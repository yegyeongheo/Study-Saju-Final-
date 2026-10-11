import {verifiedChapters} from './report-readiness.js';
import {PAID_REPORT_SPEC} from './paid-report-spec.js';
// Confirmed price; actual checkout remains disconnected until the Render integration.
export const REPORT_OFFER=Object.freeze({productId:'study-fortune-v1',price:9900,currency:'KRW',available:false,cycleVerified:false,providedChapters:Object.freeze(verifiedChapters('child').filter(n=>verifiedChapters('self').includes(n)))});
export const REPORT_CHAPTERS=Object.fromEntries(Object.entries(PAID_REPORT_SPEC).map(([audience,chapters])=>[audience,chapters.map(c=>c.title)]));
export const REPORT_CHAPTER_DETAILS=Object.fromEntries(Object.entries(PAID_REPORT_SPEC).map(([audience,chapters])=>[audience,chapters.map(c=>c.sections[0].intro)]));
