import test from 'node:test';
import assert from 'node:assert/strict';
import {relay} from '../sites/worker.js';
const env={SAJU_API_ORIGIN:'https://example.onrender.com',SAJU_API_TOKEN:'a'.repeat(43)};
const request=(extra={},body='{}')=>new Request('https://example.chatgpt.site/api/saju/v1/analyze',{
  method:'POST',headers:{Origin:'https://example.chatgpt.site','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...extra},body});
test('relay rejects foreign origin and oversized bodies before upstream',async()=>{
  const never=()=>assert.fail('unexpected upstream request');
  assert.equal((await relay(request({Origin:'https://attacker.invalid'}),env,never)).status,403);
  assert.equal((await relay(request({},'x'.repeat(32769)),env,never)).status,413);
  assert.equal((await relay(request(),{},never)).status,503);
});
test('relay overwrites credentials, hashes address, preserves JSON and limits forwarded headers',async()=>{
  const result=await relay(request({Authorization:'Bearer attacker','X-Saju-Client-ID':'spoofed'}),env,async(url,options)=>{
    assert.equal(url.href,'https://example.onrender.com/api/saju/v1/analyze');
    assert.equal(options.headers.Authorization,'Bearer '+env.SAJU_API_TOKEN);
    assert.match(options.headers['X-Saju-Client-ID'],/^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(options.headers).includes('192.0.2.1'));
    assert.equal(options.redirect,'error');
    return new Response('{"untouched":[1,null]}',{headers:{'Set-Cookie':'secret','Authorization':'secret'}});
  });
  assert.equal(await result.text(),'{"untouched":[1,null]}');
  assert.equal(result.headers.get('Set-Cookie'),null);
  assert.equal(result.headers.get('Authorization'),null);
});
