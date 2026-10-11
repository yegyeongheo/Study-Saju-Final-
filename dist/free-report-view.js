import {createReportCards} from './report-cards.js';
import {composeFreeReport} from './free-report-model.js';
import {ELEMENT_ORDER,ELEMENT_LABELS} from './natal-display.js';
import {REPORT_OFFER,REPORT_CHAPTERS,REPORT_CHAPTER_DETAILS} from './report-offer.js';
import {createResultShare,shareSnapshot} from './result-share.js';

const color={wood:'#83bba8',fire:'#d4989b',earth:'#d2bb7d',metal:'#c7c5db',water:'#93a9d0'};
const count=range=>range.min===range.max?String(range.min):`${range.min}–${range.max}`;
export function createFreeReportView({createShare=createResultShare,offer=REPORT_OFFER}={}) {
  const el=id=>document.getElementById(id),cards=createReportCards(),sharing=createShare();
  const node=(tag,text,className)=>{const item=document.createElement(tag);if(text!==undefined)item.textContent=text;if(className)item.className=className;return item;};
  const paragraphs=(id,texts)=>el(id).replaceChildren(...texts.map(text=>node('p',text)));
  let observer=null,lastCalculation=null,lastReport=null,lastPayload=null;
  function clearReveal(){observer?.disconnect();observer=null;document.querySelectorAll('.report-section.is-awaiting').forEach(s=>s.classList.remove('is-awaiting'));}
  function reveal(){
    if(el('free-result-view').hidden)return;
    clearReveal();
    if(typeof IntersectionObserver!=='function'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('is-awaiting');observer.unobserve(entry.target);}}),{threshold:0.04});
    document.querySelectorAll('.report-section').forEach(section=>{
      if(section.getBoundingClientRect().top>window.innerHeight){section.classList.add('is-awaiting');observer.observe(section);}
    });
  }
  function renderNatal(natal){
    const table=el('natal-table');table.replaceChildren();el('element-bars').replaceChildren();el('polarity-counts').replaceChildren();
    el('natal-table-wrap').hidden=natal.status!=='ready';
    if(natal.status!=='ready'){
      el('natal-basis').textContent='원국을 확인할 수 없어 집계를 표시하지 않았어요.';
      el('element-summary').textContent='출생 정보와 사주 계산 결과를 확인해 주세요.';
      el('element-notice').textContent='';el('element-bars').setAttribute('aria-label','오행 집계 미상');return;
    }
    el('natal-basis').textContent=`${natal.total}글자 기준${natal.unknown?' · 시주 제외 · 태어난 시간 모름':''}${natal.varied?' · 원국 후보별 범위':''}`;
    table.append(node('caption','천간과 지지 · 년주, 월주, 일주, 시주','visually-hidden'));
    const head=node('thead'),header=node('tr');
    for(const column of natal.columns){const th=node('th',column.label,column.key==='day'?'day-column':'');th.scope='col';header.append(th);}
    head.append(header);table.append(head);const body=node('tbody');
    for(const kind of ['stem','branch']){
      const row=node('tr');
      for(const column of natal.columns){
        const cell=node('td',undefined,column.key==='day'?'day-column':'');
        cell.append(node('span',kind==='stem'?'천간':'지지','visually-hidden'));
        if(column.unknown)cell.append(node('span','미상','natal-unknown'));
        else{
          const chars=[...new Map(column.values.map(p=>[p[kind].char,p[kind]])).values()];
          if(chars.length>1)cell.append(node('span','가능한 후보','natal-candidate'));
          for(const char of chars){const span=node('span',char.char,'natal-char');span.style.color=color[char.element];span.append(node('small',char.reading));cell.append(span);}
        }
        row.append(cell);
      }body.append(row);
    }table.append(body);
    const labels=[];
    for(const key of ELEMENT_ORDER){
      const range=natal.ranges[key],row=node('div',undefined,'element-bar'),track=node('span',undefined,'element-track');
      track.style.setProperty('--element-color',color[key]);
      for(const [className,value] of [['element-range',range.max],['element-fill',range.min]]){const fill=node('span',undefined,className);fill.style.width=`${value/natal.total*100}%`;track.append(fill);}
      row.append(node('span',ELEMENT_LABELS[key]),track,node('span',`${count(range)}개`,'element-amount'));el('element-bars').append(row);labels.push(`${ELEMENT_LABELS[key]} ${count(range)}개`);
    }
    el('element-bars').setAttribute('aria-label',`${natal.total}글자 기준. ${labels.join(', ')}`);
    el('polarity-counts').append(node('span',`음 陰 ${count(natal.ranges.yin)}개`),node('span',`양 陽 ${count(natal.ranges.yang)}개`));
    el('element-summary').textContent=natal.summary;el('element-notice').textContent=natal.notice;
  }
  function renderOffer(model){
    const child=model.audience==='child',available=offer.available&&Number.isFinite(offer.price)&&offer.price>=0&&offer.providedChapters.length>0&&(!offer.providedChapters.includes(9)||offer.cycleVerified)&&typeof window.studySajuCheckout==='function';
    el('paid-report-lead').textContent=model.purchaseLead;
    el('paid-report-scope').textContent=available?'구매 시 제공되는 항목을 아래에서 확인해 주세요.':'아래는 준비 중인 10개 장의 구성입니다. 현재 유료 리포트 제공과 결제는 시작 전이에요.';
    el('paid-report-chapters').replaceChildren();
    REPORT_CHAPTERS[model.audience].forEach((title,index)=>{
      const row=node('li'),content=node('div');content.append(node('strong',title),node('p',REPORT_CHAPTER_DETAILS[model.audience][index]));
      if(index===8&&!offer.cycleVerified)content.append(node('small','시기 해석 연결·검증 후 제공 범위 확정'));
      else if(available)content.append(node('small',offer.providedChapters.includes(index+1)?'구매 시 제공':'제공 준비 중 · 구매 항목 제외'));
      row.append(content);el('paid-report-chapters').append(row);
    });
    const price=el('paid-report-price');price.replaceChildren(node('small',available?'이용 가격':'출시 예정 가격'));
    price.append(node('span',Number.isFinite(offer.price)?`${new Intl.NumberFormat('ko-KR').format(offer.price)}원`:'확정 후 안내'));
    const button=el('open-paid-report');button.textContent=child?'우리 아이 공부 운명서 펼치기':'나의 공부 운명서 펼치기';button.disabled=!available;
    el('paid-report-status').textContent=available?'':'실제 제공 항목이 확정되면 열려요.';
    button.onclick=available?async()=>{
      button.disabled=true;
      try{await window.studySajuCheckout({audience:model.audience});}catch{el('paid-report-status').textContent='구매 안내를 열지 못했어요. 다시 시도해 주세요.';}finally{button.disabled=false;}
    }:null;
  }
  function render(calculation,payload,report){
    if(calculation===lastCalculation&&payload===lastPayload&&report===lastReport)return;
    lastCalculation=calculation;lastPayload=payload;lastReport=report;
    const model=composeFreeReport(calculation,payload,report),child=model.audience==='child';
    cards.render(calculation,payload,model.type);
    el('study-section-title').textContent=child?'우리 아이의 공부유형은':'당신의 공부유형은';
    el('guardian-section-title').textContent=child?'우리 아이의 수호카드':'당신의 수호카드';
    el('combined-title').textContent=child?'두 카드로 읽는 우리 아이':'두 카드로 읽는 나';
    el('natal-title').textContent=child?'우리 아이의 사주 원국':'나의 사주 원국';
    el('study-card-title').textContent=model.type?.typeName||'공부유형 결과 준비 중';
    el('study-hanja').hidden=!model.type;el('study-hanja').textContent=model.type?.hanja||'';
    el('study-core-line').textContent=model.type?.headline||'공부유형 판정 기준을 연결하고 있어요.';
    paragraphs('study-description',model.type?.description||['아래에서는 현재 확인된 사주의 세부 특성을 먼저 살펴볼 수 있어요.']);
    el('study-type-pain').hidden=!model.type?.pain;
    el('study-type-pain').textContent=model.type?.pain?(child?model.type.pain.replaceAll('나에게','아이에게'):model.type.pain):'';
    el('study-strengths').replaceChildren();
    for(const strength of model.strengths){const row=node('div');row.append(node('dt',strength.keyword),node('dd',strength.summary));el('study-strengths').append(row);}
    if(model.strengths.length<2)el('study-strengths').append(node('div','대표 강점을 두 가지로 확정하기에는 일관된 특성 정보가 부족해요.','report-data-note'));
    paragraphs('guardian-description',model.guardianDescription||model.temperament?.sentences||['출생 정보를 확인하면 일주의 기질을 읽어드립니다.']);
    el('guardian-keywords').replaceChildren(...(model.guardianKeywords||model.temperament?.keywords||[]).map(t=>node('li',t)));
    el('combined-headline').textContent=model.interpretation.headline||'';
    el('combined-source').textContent=model.interpretation.source||'';
    el('combined-source-details').hidden=!model.interpretation.source;
    paragraphs('combined-summary',model.interpretation.story?.opening|| (model.summary.length?model.summary:['두 카드와 세부 특성을 연결한 해석은 충분한 결과가 확인되면 보여드릴게요.','지금은 아래에서 확인 가능한 특성과 오늘 적용할 방법을 먼저 살펴보세요.']));
    el('combined-insights').replaceChildren();
    const fallbackInsights=[
      [child?'아이의 공부 무기':'나의 공부 무기',model.weapon?.keyword||'강점을 살펴보는 중',model.weapon?(child?`${model.weapon.scene} ${model.weapon.summary} 이해한 내용을 다음 과제에 직접 적용하는 순간까지 이어 주세요.`:model.weapon.scene):'현재 정보만으로 대표 강점을 확정하기 어려워요.'],
      [child?'아이의 공부 함정':'나의 공부 함정',model.trap?.keyword||'막히는 순간을 살펴보는 중',model.trap?.scene||'공부를 시작하는 순간과 멈추는 순간을 함께 살펴보세요. 배움의 흐름을 바꾸는 단서가 그 사이에 있습니다.'],
      [child?'아이를 움직이는 열쇠':'나를 움직이는 열쇠',model.key.keyword,model.key.text]
    ];
    const story=model.interpretation.story;
    const insights=story?.sections||(model.interpretation.insights.length?model.interpretation.insights:fallbackInsights.map(([label,title,text])=>({label,title,paragraphs:[text]})));
    for(const {label,title,paragraphs:body,role,emphasis} of insights){
      const box=node('article',undefined,story?`report-story-part report-story-${role}`:'report-insight');
      if(label)box.append(node('p',label,'report-story-eyebrow'));
      box.append(node('h3',title));
      for(const text of body){
        const p=node('p');
        const at=emphasis?text.indexOf(emphasis):-1;
        if(at<0)p.textContent=text;
        else {if(at)p.append(node('span',text.slice(0,at)));p.append(node('strong',emphasis));if(at+emphasis.length<text.length)p.append(node('span',text.slice(at+emphasis.length)));}
        box.append(p);
      }
      el('combined-insights').append(box);
    }
    el('combined-closing').textContent=story?.closing||'';
    renderNatal(model.natal);renderOffer(model);reveal();sharing.prepare(shareSnapshot(model,payload.learner?.gender));
  }
  function reset(){
    lastCalculation=lastReport=lastPayload=null;clearReveal();sharing.reset();cards.reset();
    for(const id of ['study-type-pain','combined-closing','combined-headline','combined-source','study-hanja','study-core-line','study-description','study-strengths','guardian-description','guardian-keywords','combined-summary','combined-insights','natal-table','element-bars','polarity-counts','natal-basis','element-summary','element-notice','paid-report-lead','paid-report-chapters','paid-report-price','paid-report-status'])el(id).replaceChildren();
    el('combined-source-details').hidden=true;
    el('combined-source-details').removeAttribute('open');
    el('open-paid-report').disabled=true;el('open-paid-report').onclick=null;
  }
  return {render,reset,reveal};
}
