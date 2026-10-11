import {PAID_REPORT_SPEC,CYCLE_UNAVAILABLE_COPY} from './paid-report-spec.js';
import {REPORT_CHAPTERS,REPORT_CHAPTER_DETAILS} from './report-offer.js';
import {fetchReportAccess} from './report-access.js';
const labels={state:'현재의 모습',pain:'막히기 쉬운 지점',solution:'바로 해볼 방법'};
export function createReportFlow({getSnapshot,restoreSnapshot,navigate,loadAccess=fetchReportAccess}={}) {
  const el=id=>document.getElementById(id);
  const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
  let generation=0,controller=null,mode=null,returnSnapshot=null;
  function releaseOverview() {
    const overview=el('free-overview');
    el('free-overview-home').append(overview);
    overview.querySelectorAll('.is-awaiting').forEach(n=>n.classList.remove('is-awaiting'));
  }
  function cancel(){generation++;controller?.abort();controller=null;}
  function leave(){cancel();releaseOverview();mode=null;returnSnapshot=null;el('full-paid-chapters').replaceChildren();el('full-report-content').hidden=true;}
  function title(audience){return audience==='child'?'우리 아이 공부 운명서':'나의 공부 운명서';}
  function checkout(){
    const snapshot=getSnapshot();if(!snapshot){navigate('results');return;}
    el('checkout-title').textContent=title(snapshot.payload.audience);
    el('checkout-chapters').replaceChildren(...REPORT_CHAPTERS[snapshot.payload.audience].map((t,i)=>{
      const row=node('li'),body=node('div');body.append(node('strong',t),node('p',REPORT_CHAPTER_DETAILS[snapshot.payload.audience][i]));row.append(body);return row;
    }));
  }
  function state(status){
    el('full-report-content').hidden=true;el('full-report-state').hidden=false;
    el('full-report-view').setAttribute('aria-busy',String(status==='loading'));
    const copy={
      loading:['결제 내역을 확인하고 있어요.','확인이 끝나면 전체 공부 운명서가 열려요.'],
      unavailable:['결제 연결을 준비하고 있어요.','현재는 실제 결제와 유료 해석을 제공하지 않아요.'],
      payment_required:['구매 내역을 확인해 주세요.','결제한 계정으로 접속했는지 확인해 주세요. 결제 확인 후 전체 운명서를 읽을 수 있어요.'],
      processing:['결제는 확인됐어요.','10개 챕터를 준비하고 있어요. 잠시 뒤 다시 확인해 주세요.'],
      failed:['운명서를 불러오지 못했어요.','다시 결제하지 않아도 돼요. 잠시 뒤 다시 확인해 주세요.']
    }[status];
    el('full-report-state-title').textContent=copy[0];el('full-report-state-message').textContent=copy[1];
    el('retry-full-report').hidden=!['processing','failed','payment_required'].includes(status);
  }
  function jump(target){
    const section=el(target);section?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    section?.focus({preventScroll:true});
  }
  function renderReader(snapshot,report=null){
    const audience=snapshot.payload.audience,preview=!report;
    el('full-report-view').setAttribute('aria-busy','false');
    el('full-report-state').hidden=true;el('retry-full-report').hidden=true;el('full-report-content').hidden=false;
    el('full-report-title').textContent=title(audience);
    el('full-report-label').textContent=preview?'STUDY SAJU · CONTENTS PREVIEW':'STUDY SAJU · FULL REPORT';
    el('full-report-notice').textContent=preview?'구성 미리보기 · 무료 결과는 실제 해석이며, 아래 유료 10장은 목차 안내예요.':'결제가 확인됐어요. 무료 해석과 10개 챕터를 한 권으로 읽어보세요.';
    el('full-free-content').append(el('free-overview'));
    el('free-overview').querySelectorAll('.is-awaiting').forEach(n=>n.classList.remove('is-awaiting'));
    const select=el('report-chapter-jump');select.replaceChildren();
    const option=(value,text)=>{const o=node('option',text);o.value=value;select.append(o);};
    option('full-free-title','무료 해석 · 두 카드와 나의 사주');
    el('full-paid-chapters').replaceChildren();
    REPORT_CHAPTERS[audience].forEach((name,i)=>{
      const number=i+1,id=`full-chapter-${number}`,chapter=node('section',undefined,'reader-chapter');
      chapter.id=id;chapter.tabIndex=-1;chapter.setAttribute('aria-labelledby',`${id}-title`);
      chapter.append(node('p',`CHAPTER ${String(number).padStart(2,'0')}`,'report-section-number'));
      const heading=node('h2',name);heading.id=`${id}-title`;chapter.append(heading);
      if(preview){
        chapter.append(node('p','이 장에 담길 이야기','reader-deck'));
        for(const part of PAID_REPORT_SPEC[audience][i].sections){
          const block=node('article',undefined,`reader-part reader-${part.role}`);
          block.append(node('p',labels[part.role],'reader-part-label'),node('h3',part.heading),node('p',part.intro));chapter.append(block);
        }
        chapter.append(node('p',i===8?CYCLE_UNAVAILABLE_COPY:'구성 안내예요. 개인화된 유료 본문은 결제 연결 후 제공돼요.','report-data-note'));
      }else{
        for(const part of report.chapters[i].sections){
          const block=node('article',undefined,`reader-part reader-${part.role}`);
          block.append(node('p',labels[part.role],'reader-part-label'),node('h3',part.heading));
          for(const text of part.paragraphs)block.append(node('p',text));
          chapter.append(block);
        }
      }
      el('full-paid-chapters').append(chapter);option(id,`${String(number).padStart(2,'0')} · ${name}`);
    });
  }
  async function load(){
    cancel();const current=generation;controller=new AbortController();const requestController=controller;
    state('loading');el('full-report-label').textContent='STUDY SAJU · FULL REPORT';el('full-report-notice').textContent='';
    const timeout=setTimeout(()=>requestController.abort(),20000);
    try{
      const response=await loadAccess({signal:requestController.signal});
      if(current!==generation)return;
      if(response.status!=='ready'){state(response.status);return;}
      restoreSnapshot(response.report.freeResult);
      renderReader(response.report.freeResult,response.report);
    }catch(error){if(current===generation)state('failed');}
    finally{clearTimeout(timeout);if(current===generation)controller=null;}
  }
  function show(view){
    leave();
    if(view==='checkout'){checkout();return;}
    if(view==='reportPreview'){
      mode='preview';const snapshot=getSnapshot();if(snapshot)renderReader(snapshot);else navigate('results');return;
    }
    if(view==='fullReport'){mode='paid';returnSnapshot=getSnapshot();load();}
  }
  function back(){
    const previous=mode,snapshot=returnSnapshot;
    leave();
    if(previous==='paid'&&snapshot)restoreSnapshot(snapshot);
    navigate(getSnapshot()?(previous==='preview'?'checkout':'results'):'choose');
  }
  el('checkout-back').onclick=()=>navigate('results');
  el('preview-full-report').onclick=()=>navigate('reportPreview');
  el('full-report-back').onclick=back;
  el('retry-full-report').onclick=load;
  el('report-chapter-jump').onchange=e=>jump(e.target.value);
  el('report-to-top').onclick=()=>{el('report-chapter-jump').scrollIntoView({block:'start'});el('report-chapter-jump').focus({preventScroll:true});};
  window.addEventListener('pagehide',()=>{leave();returnSnapshot=null;});
  return {show,leave};
}
