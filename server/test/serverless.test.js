const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
test('serverless adapter uses shared PostgreSQL routes and authentication',{skip:!process.env.TEST_DATABASE_URL,timeout:15000},async()=>{
 const child=spawn(process.execPath,['-e',"const express=require('express');const app=express();app.use(require('../api/_lib/handler'));app.listen(3096,()=>console.log('ready'));"],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,DATABASE_URL:process.env.TEST_DATABASE_URL,JWT_SECRET:'serverless-integration-test-secret-32-characters'},stdio:'pipe'});
 try {
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Adapter startup failed')})]);
  const health=await fetch('http://localhost:3096/api/health');assert.equal(health.status,200);assert.equal((await health.json()).storage,'postgres');
  const response=await fetch('http://localhost:3096/api/projects');assert.equal(response.status,401);assert.ok((await response.json()).requestId);
 }finally{child.kill();await once(child,'exit');}
});
