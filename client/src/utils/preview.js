import { init, parse } from 'es-module-lexer';
import reactSource from 'preview-react-source?raw';
import reactDomSource from 'preview-react-dom-source?raw';
import React from 'react';

const external = value => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
const dataUrl = (source, type = 'text/javascript') => `data:${type};base64,${btoa(unescape(encodeURIComponent(source)))}`;
function resolve(from, relative) {
  const parts = relative.startsWith('/') ? [] : from.split('/').slice(0,-1);
  for (const part of relative.split(/[?#]/)[0].split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
}
const moduleName = path => `workspace:/${path}`;

// Keep native module semantics (including cycles) through an import map. All
// workspace sources stay inside the sandbox; no code is evaluated in the IDE.
export async function buildPreview(files, htmlPath, reportScript) {
  await init();
  const doc = new DOMParser().parseFromString(files[htmlPath] || '', 'text/html');
  const userMap = {};
  for (const script of doc.querySelectorAll('script[type="importmap"]')) {
    const config = JSON.parse(script.textContent);
    Object.assign(userMap, config.imports || {});
    script.remove();
  }
  const imports = { ...userMap };
  imports.react = dataUrl(`const React=globalThis.React;export default React;${Object.keys(React).filter(key=>/^[A-Za-z_$][\w$]*$/.test(key)).map(key=>`export const ${key}=React.${key};`).join('')}`);
  imports['react-dom'] = dataUrl('export default globalThis.ReactDOM;export const render=globalThis.ReactDOM.render;export const createRoot=globalThis.ReactDOM.createRoot;');
  imports['react-dom/client'] = imports['react-dom'];
  imports['react/jsx-runtime'] = dataUrl('export const Fragment=globalThis.React.Fragment;export const jsx=(type,props,key)=>globalThis.React.createElement(type,{...props,key});export const jsxs=jsx;');

  const available = path => Object.hasOwn(files,path) ? path : [path+'.js',path+'.jsx',path+'.ts',path+'.tsx',path+'/index.js',path+'/index.jsx'].find(p=>Object.hasOwn(files,p));
  let babel;
  async function transform(source, path) {
    if (/\.[jt]sx$|\.ts$/.test(path) || /<[A-Za-z][\w.:-]*(?:\s|\/?>)/.test(source)) {
      babel ||= await import('@babel/standalone');
      const presets = [];
      if (/\.tsx?$/.test(path)) presets.push('typescript');
      presets.push(['react',{runtime:'classic'}]);
      source = babel.transform(source, {filename:path,presets,sourceType:'unambiguous'}).code;
    }
    const records = parse(source)[0].map(record => ({n:record.specifier,s:record.start,e:record.end,d:record.type === 'dynamic' ? 0 : -1}));
    for (const record of [...records].reverse()) {
      if (!record.n || external(record.n)) continue;
      let replacement = record.n;
      if (record.n.startsWith('.') || record.n.startsWith('/')) {
        const target = available(resolve(path, record.n));
        if (!target) throw new Error(`Cannot find "${record.n}" imported by ${path}`);
        replacement = moduleName(target);
      } else if (!Object.hasOwn(imports, record.n)) {
        throw new Error(`Package "${record.n}" needs a project dev server or an import map. React is supported in the built-in preview.`);
      }
      source = source.slice(0,record.s) + (record.d >= 0 ? JSON.stringify(replacement) : replacement) + source.slice(record.e);
    }
    return source;
  }
  for (const [path, source] of Object.entries(files)) {
    if (/\.(?:[cm]?js|jsx|ts|tsx)$/.test(path)) {
      // Compile only modules reachable from script entries; unrelated server
      // files must not prevent an HTML project from rendering.
      imports[moduleName(path)] = null;
    } else if (path.endsWith('.svg')) {
      imports[moduleName(path)] = dataUrl(`export default ${JSON.stringify(dataUrl(source, 'image/svg+xml'))};`);
    } else if (path.endsWith('.css')) {
      imports[moduleName(path)] = dataUrl(`const style=document.createElement('style');style.textContent=${JSON.stringify(source)};document.head.append(style);`);
    }
  }
  const pending = new Set();
  async function compile(path) {
    const key=moduleName(path);
    if (imports[key] || pending.has(path)) return;
    pending.add(path);
    const source=await transform(files[path],path);
    imports[key]=dataUrl(source);
    const [dependencies]=parse(source);
    for(const dependency of dependencies) if(dependency.specifier?.startsWith('workspace:/')) await compile(dependency.specifier.slice('workspace:/'.length));
  }
  for (const link of doc.querySelectorAll('link[rel="stylesheet"][href]')) {
    const href=link.getAttribute('href');
    if(external(href)) continue;
    const path=resolve(htmlPath,href);
    if(!Object.hasOwn(files,path)) continue;
    const style=doc.createElement('style');style.textContent=files[path];link.replaceWith(style);
  }
  for (const image of doc.querySelectorAll('img[src]')) {
    const src=image.getAttribute('src');if(external(src))continue;
    const path=resolve(htmlPath,src);if(path.endsWith('.svg') && Object.hasOwn(files,path)) image.src=dataUrl(files[path],'image/svg+xml');
  }
  for (const script of [...doc.querySelectorAll('script')]) {
    const src=script.getAttribute('src');
    // Bundled React provides the templates' React globals without a CDN.
    if(src && /(?:unpkg\.com|cdn\.jsdelivr\.net)\/.*(?:react(?:-dom)?@|@babel\/standalone)/.test(src)) {script.remove();continue;}
    if(src && external(src))continue;
    const path=src ? available(resolve(htmlPath,src)) : htmlPath+'.inline.js';
    if(src && !path) throw new Error(`Cannot find script "${src}" in this workspace`);
    const type=script.getAttribute('type') || '';
    if(type && !['module','text/babel','text/javascript','application/javascript'].includes(type))continue;
    const source=src ? files[path] : script.textContent;
    if (!source.trim()) continue;
    const hasModules=/\b(?:import|export)\s/.test(source);
    if(type==='module' || type==='text/babel' || /\.[jt]sx$/.test(path) || hasModules) {
      script.type='module';
      if(!src) files={...files,[path]:source};
      await compile(path);script.src=imports[moduleName(path)];script.textContent='';
    } else if(src) {
      // Preserve the original tag's attributes instead of demoting all scripts
      // to classic inline scripts (which broke ES modules and Babel starters).
      script.src=dataUrl(source);if (!script.hasAttribute('async')) script.setAttribute('defer','');
    }
  }
  const bootstrap=doc.createElement('script');bootstrap.textContent=reportScript+'\n'+reactSource+'\n'+reactDomSource;
  doc.head.prepend(bootstrap);
  const map=doc.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports:Object.fromEntries(Object.entries(imports).filter(([,value])=>value))});bootstrap.after(map);
  return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML;
}
