import { parse } from 'es-module-lexer';
const CDN = 'https://cdn.jsdelivr.net';
const cache = new Map();
const builtins = new Set(['assert','buffer','child_process','cluster','crypto','dgram','dns','events','fs','http','https','module','net','os','path','perf_hooks','process','readline','stream','string_decoder','timers','tls','tty','url','util','vm','worker_threads','zlib']);
const reactPackage = specifier => ['react','react-dom','lucide-react'].some(name=>specifier===name || specifier.startsWith(name+'/'));

export function createPackageResolver(files, imports, encode) {
  let manifest = {};
  if (files['package.json']) {
    try { manifest=JSON.parse(files['package.json']); }
    catch { throw new Error('package.json contains invalid JSON. Fix it before previewing.'); }
  }
  const versions={...manifest.devDependencies,...manifest.dependencies};
  let count=0;
  async function source(url) {
    if(cache.has(url))return cache.get(url);
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`Package download failed (${response.status}). Check the dependency name/version in package.json and your connection.`);
    const text=await response.text();
    if(text.length>5*1024*1024)throw new Error('A dependency is too large for the built-in preview. Use its project dev server.');
    if(cache.size>=100)cache.delete(cache.keys().next().value);
    cache.set(url,text);return text;
  }
  async function load(url) {
    const key=`package:/${encodeURIComponent(url)}`;
    if(Object.hasOwn(imports,key))return key;
    if(++count>150)throw new Error('This dependency graph is too large for the built-in preview. Use the project dev server.');
    imports[key]=null;
    try {
      let text=await source(url);
      const dependencies=[];
      const records=parse(text)[0];
      for(const record of [...records].reverse()) {
        if(!record.specifier)continue;
        const specifier=record.specifier;
        let target;
        if(specifier.startsWith('/') || specifier.startsWith('.') || specifier.startsWith(CDN+'/')) {
          const remote=new URL(specifier,url);
          const identity=remote.pathname.match(/^\/npm\/((?:@[^/]+\/)?[^/@]+)(?:@[^/]+)?(\/.*)?\/\+esm$/);
          if(identity && reactPackage(identity[1])) {
            target=identity[1]+(identity[2] || '');
            // CDN react-dom entrypoints must share the preview's React instance.
            if(!imports[target])throw new Error(`Unsupported React entrypoint: ${target}`);
          } else {
            if(remote.origin!==CDN)throw new Error('A dependency references an unsupported module host. Use an explicit import map.');
            target=`package:/${encodeURIComponent(remote.href)}`;
            dependencies.push(remote.href);
          }
        } else if(reactPackage(specifier) && imports[specifier]) target=specifier;
        else if(/^(https?:|data:|blob:)/.test(specifier))continue;
        else target=await resolvePackage(specifier);
        text=text.slice(0,record.start)+(record.type==='dynamic'?JSON.stringify(target):target)+text.slice(record.end);
      }
      imports[key]=encode(text);
      for(const dependency of dependencies)await load(dependency);
      return key;
    } catch(error) {
      delete imports[key];
      throw new Error(`Could not prepare dependency ${new URL(url).pathname}: ${error.message}`);
    }
  }
  async function resolvePackage(specifier) {
    const root=specifier.split('/')[0];
    if(specifier.startsWith('node:') || builtins.has(root))throw new Error(`"${specifier}" is a Node.js server module. It cannot run inside a browser preview; use a server runtime.`);
    const match=specifier.match(/^((?:@[a-z\d_.-]+\/)?[a-z\d_.-]+)(?:@([^/]+))?(\/.*)?$/i);
    if(!match)throw new Error(`Invalid package import: ${specifier}`);
    const [,name,explicit,subpath='']=match;
    const version=explicit || versions[name] || 'latest';
    if(!/^[a-z\d.*^~<>=|+ -]+$/i.test(version))throw new Error(`Dependency "${name}" uses "${version}". Workspace, Git and file dependencies need a project dev server.`);
    const url=`${CDN}/npm/${name}@${encodeURIComponent(version)}${subpath}/+esm`;
    const key=await load(url);
    imports[specifier]=imports[key];
    return specifier;
  }
  return resolvePackage;
}
