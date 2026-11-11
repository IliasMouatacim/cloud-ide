const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

test('PostgreSQL preserves users, projects and files after API restart', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
 let child;
 const start = async () => {
  child = spawn(process.execPath, ['src/index.js'], { cwd: require('node:path').join(__dirname, '..'), env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test', PORT: '3098' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(()=>{throw Error('API startup failed')})]);
 };
 const stop = async () => { const exited=once(child,'exit'); child.kill(); await exited; };
 async function call(path,method='GET',body,token) {
  const r=await fetch('http://localhost:3098/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json()};
 }
 const email=`persist-${Date.now()}@example.test`, password='database-test-password';
 try {
  await start();
  const a=await call('/auth/register','POST',{username:'Persistent',email,password}); assert.equal(a.status,201);
  const token=a.data.token;
  const p=await call('/projects','POST',{name:'Persisted',template:'html'},token); assert.equal(p.status,201);
  assert.equal((await call('/files/'+p.data.id,'GET',undefined,token)).data.length,3);
  await call('/files/'+p.data.id+'/note.txt','PUT',{content:'survives restart'},token);
  await stop(); await start();
  assert.equal((await call('/auth/login','POST',{email,password})).status,200);
  assert.equal((await call('/projects/'+p.data.id,'GET',undefined,token)).data.name,'Persisted');
  assert.ok((await call('/files/'+p.data.id,'GET',undefined,token)).data.some(f=>f.content==='survives restart'));
  assert.equal((await call('/auth/register','POST',{username:'Duplicate',email,password})).status,409);
  assert.equal((await call('/projects/'+p.data.id,'DELETE',undefined,token)).status,200);
  const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  try {
   assert.equal((await pool.query('SELECT count(*) FROM files WHERE project_id=$1',[p.data.id])).rows[0].count,'0');
   await pool.query('DELETE FROM users WHERE id=$1',[a.data.user.id]);
  } finally { await pool.end(); }
 } finally { if(child && child.exitCode===null) await stop(); }
});
