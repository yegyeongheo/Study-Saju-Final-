// Server-only Cloudflare/Sites entry point. Never bundle into dist.
const jsonError = (status, code) => new Response(JSON.stringify({status:'error',error:{code}}),
  {status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function relay(request, env, fetchImpl = fetch) {
  if (request.method !== 'POST') return jsonError(405,'METHOD_NOT_ALLOWED');
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return jsonError(403,'ORIGIN_NOT_ALLOWED');
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return jsonError(415,'JSON_REQUIRED');
  }
  let upstream;
  try {
    upstream = new URL(env.SAJU_API_ORIGIN);
    if (upstream.protocol !== 'https:' || upstream.username || upstream.password || upstream.search
        || upstream.hash || upstream.pathname !== '/' || !/^[A-Za-z0-9_-]{43,128}$/.test(env.SAJU_API_TOKEN || '')) throw Error();
  } catch { return jsonError(503,'API_NOT_CONFIGURED'); }
  // Cloudflare sets this header at its edge; do not use user-supplied X-Forwarded-For.
  const address = request.headers.get('CF-Connecting-IP');
  if (!address) return jsonError(503,'CLIENT_ID_UNAVAILABLE');
  const reader = request.body?.getReader();
  if (!reader) return jsonError(400,'INVALID_JSON');
  const chunks=[];
  let size=0;
  while (true) {
    const {done,value}=await reader.read();
    if (done) break;
    size+=value.length;
    if (size>32768) { await reader.cancel(); return jsonError(413,'REQUEST_TOO_LARGE'); }
    chunks.push(value);
  }
  const body=new Uint8Array(size);
  let offset=0;
  for (const chunk of chunks) { body.set(chunk,offset); offset+=chunk.length; }
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(env.SAJU_API_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=await crypto.subtle.sign('HMAC',key,encoder.encode(address));
  const client=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  try {
    const result=await fetchImpl(new URL('/api/saju/v1/analyze',upstream),{
      method:'POST',redirect:'manual',signal:AbortSignal.timeout(28000),body,
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.SAJU_API_TOKEN}`,'X-Saju-Client-ID':client}
    });
    if (result.status >= 300 && result.status < 400) {
      await result.body?.cancel();
      return jsonError(502,'UPSTREAM_REDIRECT_REJECTED');
    }
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    if (result.status===429) headers['Retry-After']='60';
    return new Response(result.body,{status:result.status,headers});
  } catch { return jsonError(502,'CORE_UNAVAILABLE'); }
}

export default {
  async fetch(request,env) {
    if (new URL(request.url).pathname==='/api/saju/v1/analyze') return relay(request,env);
    return env.ASSETS.fetch(request);
  }
};
