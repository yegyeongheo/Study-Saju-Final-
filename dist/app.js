const childSamples=[['이유를 알면, 깊이 몰입하는 아이.','무작정 외우기보다 ‘왜 그런지’를 이해할 때 공부가 시작되는 유형. 질문이 많다면 아이가 자신만의 연결고리를 찾고 있는 걸 수 있어요.','“오늘 배운 걸 엄마 아빠한테 설명해 줄래?”라고 물어보세요. 아이가 자신의 말로 설명하고, 막힌 부분을 함께 찾아볼 수 있어요.'],['흐름을 읽고, 준비의 순서를 세워요.','대운·세운에서 확장과 도전의 흐름을 읽었다면, 준비해 온 공부를 시험이나 지원으로 연결하는 계획을 살펴볼 수 있어요. 아이의 준비 수준과 실제 일정도 함께 놓고 봅니다.','아이와 도전하고 싶은 목표를 먼저 정해 보세요. 시험일까지 남은 시간을 복습·모의시험·마무리로 나누어 무리 없는 계획을 함께 세워요.'],['깊이 탐구하는 힘은, 어떤 진로로 이어질까요?','원리를 이해하고 구조를 분석하는 데 흥미가 있다면 연구·기획·데이터 분석 같은 분야를 진로 후보로 탐색해 볼 수 있어요. 사주에서 읽은 성향에 아이의 실제 흥미와 경험을 함께 놓고 살펴요.','아이와 관심 분야 두 가지를 골라 관련 책, 체험, 작은 프로젝트를 접해 보세요. 어떤 활동에서 질문이 많아지고 몰입하는지 함께 관찰해요.']];let samples=childSamples;
const tabs=[...document.querySelectorAll('.tab')];
const reportPanels=[...document.querySelectorAll('.report-step')];
const reportTrack=document.getElementById('report-track');
const reportStage=document.getElementById('report-stage');
let activeReport=0,reportPinned=false,reportStepDistance=500,reportPinTop=20,reportFrame=0;
function renderSamples(){
 reportPanels.forEach((panel,i)=>{const suffix=i?'-'+i:'';['sample-title','sample-body','sample-tip'].forEach((id,j)=>document.getElementById(id+suffix).textContent=samples[i][j]);});
}
function select(i){
 activeReport=Math.max(0,Math.min(2,i));
 tabs.forEach((b,j)=>{b.setAttribute('aria-selected',activeReport===j);b.tabIndex=activeReport===j?0:-1;});
 reportPanels.forEach((panel,j)=>{const hidden=reportPinned&&j!==activeReport;panel.classList.toggle('is-current',j===activeReport);panel.setAttribute('aria-hidden',String(hidden));panel.inert=hidden;});
}
function goToReport(i){
 select(i);
 if(reportPinned){const top=window.scrollY+reportTrack.getBoundingClientRect().top-reportPinTop+reportStepDistance*(i+.14);window.scrollTo({top,behavior:motionQuery.matches?'auto':'smooth'});}
 else reportPanels[i].scrollIntoView({behavior:motionQuery.matches?'auto':'smooth',block:'start'});
}
tabs.forEach((b,i)=>{b.addEventListener('click',()=>goToReport(i));b.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%3;if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i+2)%3;if(e.key==='Home')j=0;if(e.key==='End')j=2;if(j!==undefined){e.preventDefault();goToReport(j);tabs[j].focus();}});});

// Scroll position controls each scene; native scrolling remains untouched.
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
const story=document.querySelector('.story');
const stage=document.querySelector('.story-stage');
const titleScene=document.getElementById('title-scene');
const questionScene=document.getElementById('question-scene');
const invitation=document.getElementById('invitation');
const printScene=document.getElementById('print-scene');
const landscape=document.querySelector('.landscape img');
const cue=document.querySelector('.scroll-cue');
const clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const rise=(s,a,b)=>ease((s-a)/(b-a));
let motionActive=false,frame=0,revealObserver;
function paint(el,opacity,y,scale=1){el.style.opacity=String(opacity);el.style.transform=`translate3d(0,${y}px,0) scale(${scale})`;}
function updateStory(){
 frame=0;if(!motionActive)return;
 const range=Math.max(1,story.offsetHeight-stage.offsetHeight);
 const progress=clamp(-story.getBoundingClientRect().top/range)*3.5;
 const titleIn=rise(progress,.03,.52),titleOut=rise(progress,1.02,1.3);
 paint(titleScene,titleIn*(1-titleOut),36*(1-titleIn)-20*titleOut);
 const questionIn=rise(progress,1.2,1.57),questionOut=rise(progress,2.42,2.68);
 paint(questionScene,questionIn*(1-questionOut),30*(1-questionIn)-20*questionOut);
 const inviteIn=rise(progress,1.8,2.16);paint(invitation,inviteIn,20*(1-inviteIn));
 const printIn=rise(progress,2.53,3.14);
 paint(printScene,printIn,125*(1-printIn),.93+.07*printIn);
 landscape.style.transform=`scale(${1.035+progress*.004}) translate3d(0,${-progress*4}px,0)`;
 cue.style.opacity=String(1-rise(progress,.08,.42));cue.style.pointerEvents=progress>.42?'none':'auto';
 cue.tabIndex=progress>.42?-1:0;
}
function schedule(){if(motionActive&&!frame)frame=requestAnimationFrame(updateStory)}
function setupMotion(){
 if(revealObserver)revealObserver.disconnect();
 if(frame){cancelAnimationFrame(frame);frame=0;}
 motionActive=!motionQuery.matches&&'IntersectionObserver' in window;
 document.documentElement.classList.toggle('has-motion',motionActive);
 [titleScene,questionScene,invitation,printScene,landscape,cue].forEach(el=>el.removeAttribute('style'));
 cue.tabIndex=0;
 if(!motionActive)return;
 const reveals=[...document.querySelectorAll('.reveal')];
 reveals.forEach(el=>{const r=el.getBoundingClientRect();el.classList.toggle('is-visible',r.bottom>0&&r.top<innerHeight*.94)});
 revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-visible',e.isIntersecting)),{rootMargin:'-4% 0px -6% 0px',threshold:.08});
 reveals.forEach(el=>revealObserver.observe(el));
 updateStory();
}
setupMotion();
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('pageshow',schedule);
motionQuery.addEventListener('change',setupMotion);

// Optional audience-specific report copy for future app integration. Landing CTAs open start.html.
const selfSamples=[['이유를 알면, 깊이 몰입하는 사람.','무작정 외우기보다 ‘왜 그런지’를 이해할 때 공부가 시작되는 유형. 질문이 많다는 건, 자신만의 연결고리를 찾고 있다는 뜻일 수 있어요.','문제를 풀기 전, 오늘 배운 개념을 내 말로 세 문장만 설명해 보세요.'],['흐름을 읽고, 준비의 순서를 세워요.','대운·세운에서 확장과 도전의 흐름을 읽었다면, 준비해 온 공부를 시험이나 지원으로 연결하는 계획을 세워볼 수 있어요. 실제 일정과 준비 수준도 함께 살펴요.','도전할 시험을 먼저 정하고, 접수일에서 거꾸로 복습·모의시험·마무리 일정을 잡아 보세요.'],['깊이 탐구하는 힘은, 어떤 진로로 이어질까요?','원리를 이해하고 구조를 분석하는 데 흥미가 있다면 연구·기획·데이터 분석 같은 분야를 진로 후보로 탐색해 볼 수 있어요. 사주에서 읽은 성향에 실제 흥미와 경험을 함께 놓고 살펴요.','관심 분야 두 가지를 고른 뒤, 관련 입문 강의나 작은 프로젝트를 직접 경험하고 비교해 보세요.']];
function setAudience(audience){
 const isSelf=audience==='self';samples=isSelf?selfSamples:childSamples;
 document.getElementById('report-heading').innerHTML=isSelf?'그래서,<br>어떻게 공부하면 될까요?':'그래서,<br>어떻게 도와주면 될까요?';
 document.getElementById('report-description').innerHTML=isSelf?'입시 재도전부터 공무원·전문직 시험까지.<br>나에게 맞는 공부의 다음 행동을 짚어요.':'해석에서 끝나지 않도록.<br>아이와 함께할 다음 행동까지 짚어요.';
 document.querySelectorAll('.report-audience').forEach(el=>el.textContent=(isSelf?'본인 공부':'자녀 학습')+' · 해석 예시 · 개인 분석 결과가 아닙니다');
 renderSamples();
 configureReportScroll(true);
 select(0);
}
document.querySelectorAll('[data-audience]').forEach(link=>link.addEventListener('click',()=>setAudience(link.dataset.audience)));


// Pin only when the complete example fits; small/zoomed screens use a native vertical flow.
function configureReportScroll(reset=false){
 reportPinned=false;reportTrack.style.height='';reportTrack.classList.remove('is-pinned');
 const viewport=window.innerHeight;reportPinTop=20;
 reportStepDistance=Math.max(340,viewport*.68);
 if(!motionQuery.matches){
  reportTrack.classList.add('is-pinned');
  reportTrack.style.setProperty('--report-pin-top',reportPinTop+'px');
  const cardHeight=reportStage.getBoundingClientRect().height;
  if(cardHeight+reportPinTop+24<=viewport){reportPinned=true;reportTrack.style.height=(cardHeight+reportStepDistance*3)+'px';}
  else reportTrack.classList.remove('is-pinned');
 }
 select(reset?0:activeReport);
 if(!reset)updateReportScroll();
}
function updateReportScroll(){
 reportFrame=0;let index=0;
 if(reportPinned){
  const distance=reportPinTop-reportTrack.getBoundingClientRect().top;
  index=Math.max(0,Math.min(2,Math.floor(distance/reportStepDistance)));
 }else{
  const readingLine=window.innerHeight*.45;
  reportPanels.forEach((panel,i)=>{if(panel.getBoundingClientRect().top<=readingLine)index=i;});
 }
 if(index!==activeReport)select(index);
}
function scheduleReportScroll(){if(!reportFrame)reportFrame=requestAnimationFrame(updateReportScroll);}
window.addEventListener('scroll',scheduleReportScroll,{passive:true});
window.addEventListener('resize',()=>configureReportScroll(),{passive:true});
window.addEventListener('pageshow',()=>configureReportScroll());
motionQuery.addEventListener('change',()=>configureReportScroll());
configureReportScroll();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>configureReportScroll());
