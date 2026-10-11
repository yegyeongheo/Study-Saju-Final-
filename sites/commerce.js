// Explicitly disconnected. Render will replace these handlers with authenticated
// order/PSP/report services. No client flag or callback URL grants report access.
export function commerceResponse(request) {
  const path=new URL(request.url).pathname;
  if(!['/api/checkout/session','/api/study-reports/current'].includes(path))return null;
  const allowed=path==='/api/checkout/session'?'POST':'GET';
  if(request.method!==allowed)return new Response(JSON.stringify({error:'METHOD_NOT_ALLOWED'}),{status:405,headers:{Allow:allowed,'Content-Type':'application/json','Cache-Control':'no-store'}});
  return new Response(JSON.stringify({schemaVersion:'study-report-access-v1',status:'unavailable',code:'PAYMENTS_NOT_CONNECTED'}),{
    status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
  });
}
