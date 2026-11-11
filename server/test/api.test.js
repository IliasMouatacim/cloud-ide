const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
test('authentication, validation and project ownership', async () => {
 const child=spawn(process.execPath,['src/index.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:'3099',NODE_ENV:'test'},stdio:'pipe'});
 try {
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error(`Server exited ${code}`)));});
  async function call(path,method='GET',body,token){const r=await fetch('http://localhost:3099/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
  assert.equal((await call('/projects')).status,401);
  assert.equal((await call('/auth/register','POST',{username:[],email:'invalid',password:123})).status,400);
  const user=async email=>(await call('/auth/register','POST',{username:'Test',email,password:'test-password'})).data;
  const a=await user(`a-${Date.now()}@example.test`),b=await user(`b-${Date.now()}@example.test`);
  assert.ok(a.token);assert.ok(b.token);
  assert.equal((await call('/auth/login','POST',{email:a.user.email.toUpperCase(),password:'test-password'})).status,200);
  assert.equal((await call('/projects','POST',{name:{}},a.token)).status,400);
  const p=await call('/projects','POST',{name:'Test',template:'blank'},a.token);assert.equal(p.status,201);
  for(const method of ['GET','DELETE']) assert.equal((await call('/projects/'+p.data.id,method,undefined,b.token)).status,403);
  assert.equal((await call('/files/'+p.data.id+'/a.txt','PUT',{content:42},a.token)).status,400);
  assert.equal((await call('/files/'+p.data.id+'/a.txt','PUT',{content:'hello'},a.token)).status,200);
  assert.equal((await call('/files/'+p.data.id,'GET',undefined,b.token)).status,403);
  assert.equal((await call('/projects/'+p.data.id,'DELETE',undefined,a.token)).status,200);
  assert.equal((await call('/projects/'+p.data.id,'GET',undefined,a.token)).status,404);
  const snapshot=await call('/projects/snapshot','POST',{name:'Saved workspace',files:{'src/main.js':'console.log(42)'}},a.token);
  assert.equal(snapshot.status,201);
  const revision=snapshot.data.revision;
  assert.equal((await call('/projects/'+snapshot.data.id+'/snapshot','PUT',{name:'Changed',files:{'new.txt':'saved'},revision},b.token)).status,403);
  const updated=await call('/projects/'+snapshot.data.id+'/snapshot','PUT',{name:'Changed',files:{'new.txt':'saved'},revision},a.token);
  assert.equal(updated.status,200);
  assert.equal(updated.data.revision,revision+1);
  assert.equal((await call('/projects/'+snapshot.data.id+'/snapshot','PUT',{name:'Stale',files:{},revision},a.token)).status,409);
  const latest=await call('/projects/'+snapshot.data.id+'/snapshot','GET',undefined,a.token);
  assert.deepEqual(latest.data.files,{'new.txt':'saved'});
  assert.equal(latest.data.project.name,'Changed');
  const simultaneous=await Promise.all([1,2].map(()=>call('/projects/'+snapshot.data.id+'/snapshot','PUT',{name:'Changed',files:{'new.txt':'saved'},revision:latest.data.project.revision},a.token)));
  assert.deepEqual(simultaneous.map(r=>r.status).sort(),[200,409]);
  assert.equal((await call('/files/'+snapshot.data.id,'GET',undefined,a.token)).data[0].content,'saved');
  assert.equal((await call('/files/'+snapshot.data.id,'GET',undefined,b.token)).status,403);
  assert.equal((await call('/projects/snapshot','POST',{name:'Invalid',files:{'../escape':'bad'}},a.token)).status,400);
  await call('/projects/'+snapshot.data.id,'DELETE',undefined,a.token);
  assert.equal((await call('/unknown')).status,404);
  const malformed=await fetch('http://localhost:3099/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
 } finally {child.kill();}
});
