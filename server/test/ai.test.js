const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {once}=require('node:events');
test('AI provider request validation, response mapping and safe failure',{timeout:5000},async()=>{
 const app=express();app.use(express.json());app.use(require('../src/routes/ai'));
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');
 const originalFetch=global.fetch;const originalKey=process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY='test-only-key';
 let providerCalls=0;
 global.fetch=async(url,options)=>{
  providerCalls++;assert.equal(new URL(url).hostname,'generativelanguage.googleapis.com');
  assert.equal(options.headers['x-goog-api-key'],'test-only-key');
  const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[0].text,'Hello');assert(options.signal);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Answer'}]}}]})};
 };
 const call=body=>originalFetch(`http://127.0.0.1:${server.address().port}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try {
  assert.equal((await call({message:42})).status,400);assert.equal(providerCalls,0);
  const response=await call({message:'Hello',history:[]});assert.equal(response.status,200);assert.deepEqual(await response.json(),{reply:'Answer'});
  global.fetch=async()=>({ok:false});assert.equal((await call({message:'Hello'})).status,502);
  delete process.env.GEMINI_API_KEY;assert.equal((await call({message:'Hello'})).status,503);
 }finally{global.fetch=originalFetch;if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
