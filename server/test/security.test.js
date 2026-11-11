const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const WS=require('ws');
test('HTTP and WebSocket security boundaries and graceful shutdown',{timeout:20000},async()=>{
 const child=spawn(process.execPath,['src/index.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:'3097',NODE_ENV:'test',ENABLE_HOST_TERMINAL:'false'},stdio:'pipe'});
 try {
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Startup failed')})]);
  const call=(path,body,token)=>fetch('http://localhost:3097/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  const live=await call('/live');assert.equal(live.status,200);assert.equal(live.headers.get('x-content-type-options'),'nosniff');assert.match(live.headers.get('x-request-id'),/^[a-f0-9-]{36}$/);
  assert.equal((await call('/ai/chat',{message:'hello'})).status,401);
  const registered=await call('/auth/register',{username:'Security',email:`secure-${Date.now()}@example.test`,password:'test-password'});assert.equal(registered.status,201);const {token}=await registered.json();
  assert.equal((await call('/socket-ticket',{type:'terminal'},token)).status,403);
  assert.equal((await call('/socket-ticket',{type:'collaboration',projectId:'00000000-0000-0000-0000-000000000000'},token)).status,403);
  const project=await (await call('/projects',{name:'Socket test'},token)).json();
  const grant=await (await call('/socket-ticket',{type:'collaboration',projectId:project.id},token)).json();
  const ws=new WS(`ws://localhost:3097/ws?ticket=${grant.ticket}`,{origin:'http://localhost:5173'});
  const [raw]=await once(ws,'message');assert.equal(JSON.parse(raw).type,'collab:joined');ws.close();
  const denied=async url=>new Promise((resolve,reject)=>{const socket=new WS(url);socket.on('unexpected-response',(_req,res)=>{const code=res.statusCode;res.resume();socket.terminate();resolve(code)});socket.on('error',()=>{});socket.on('open',()=>{socket.close();reject(Error('Unauthorized socket accepted'))})});
  assert.equal(await denied(`ws://localhost:3097/ws?ticket=${grant.ticket}`),401);
  assert.equal(await denied('ws://localhost:3097/ws?type=terminal'),401);
  let response;
  for(let i=0;i<31;i++) response=await call('/auth/login',{email:'none',password:'bad'});
  assert.equal(response.status,429);assert.ok(response.headers.get('retry-after'));
  await fetch(`http://localhost:3097/api/projects/${project.id}`,{method:'DELETE',headers:{Authorization:'Bearer '+token}});
  const exited=once(child,'exit');child.kill('SIGTERM');assert.equal((await exited)[0],0);
 } finally {if(child.exitCode===null)child.kill('SIGKILL');}
});
