import {PAID_REPORT_SPEC} from './paid-report-spec.js';
import {REPORT_OFFER} from './report-offer.js';
const sectionKeys=['state','pain','solution'];
const text=(value,max=6000)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
// This is a response-shape guard, NOT a payment authorization mechanism.
// Only an authenticated server endpoint may return the paid body.
export function validateReportAccess(value) {
  const invalid=()=>{throw new Error('INVALID_REPORT_RESPONSE');};
  if(value?.schemaVersion!=='study-report-access-v1')return invalid();
  if(['unavailable','payment_required','processing','failed'].includes(value.status))return {status:value.status};
  if(value.status!=='ready')return invalid();
  const {payment,report}=value;
  if(payment?.status!=='verified'||payment.productId!==REPORT_OFFER.productId||payment.amount!==9900||payment.currency!=='KRW')return invalid();
  if(!text(report?.id,120)||!['child','self'].includes(report.audience))return invalid();
  const snapshot=report.freeResult;
  if(snapshot?.payload?.audience!==report.audience||!snapshot.payload.learner||!snapshot.calculation?.subjects?.learner)return invalid();
  if(!Array.isArray(report.chapters)||report.chapters.length!==10)return invalid();
  for(let i=0;i<10;i++) {
    const ch=report.chapters[i];
    if(ch.number!==i+1||ch.status!=='ready'||!Array.isArray(ch.sections)||ch.sections.length!==3)return invalid();
    if(i===8&&ch.cycleVerified!==true)return invalid();
    for(let j=0;j<3;j++){
      const s=ch.sections[j];
      if(s.role!==sectionKeys[j]||s.heading!==PAID_REPORT_SPEC[report.audience][i].sections[j].heading||!Array.isArray(s.paragraphs)||s.paragraphs.length<1||s.paragraphs.length>12||s.paragraphs.some(p=>!text(p)))return invalid();
    }
  }
  return structuredClone({status:'ready',report});
}
export async function fetchReportAccess({fetchImpl=fetch,signal}={}) {
  const response=await fetchImpl('/api/study-reports/current',{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal});
  // A disconnected backend is explicit, not interpreted as a paid result.
  if(response.status===503)return {status:'unavailable'};
  if(response.status===401||response.status===403)return {status:'payment_required'};
  if(!response.ok)throw new Error('REPORT_REQUEST_FAILED');
  return validateReportAccess(await response.json());
}
