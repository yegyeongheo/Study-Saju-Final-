import {PAID_REPORT_SPEC,CYCLE_UNAVAILABLE_COPY} from './paid-report-spec.js';
const root=document.getElementById('outline');
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
function render(audience){
 root.replaceChildren();
 for(const c of PAID_REPORT_SPEC[audience]){
  const chapter=node('article');chapter.className='chapter';
  const number=node('span',`CHAPTER ${String(c.number).padStart(2,'0')}`);number.className='number';
  chapter.append(number,node('h2',c.title));
  for(const [i,s] of c.sections.entries()){
   const part=node('section');part.className='part';part.append(node('h3',`${i+1}. ${s.heading}`),node('p',s.intro));chapter.append(part);
  }
  const detail=node('details'),list=node('ul');detail.append(node('summary','자세히 다룰 내용'));
  c.topics.forEach(t=>list.append(node('li',t)));detail.append(list);chapter.append(detail);
  if(c.number===9){const p=node('p',CYCLE_UNAVAILABLE_COPY);p.className='notice';chapter.append(p);}
  root.append(chapter);
 }
 document.querySelectorAll('[data-audience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.audience===audience)));
}
document.querySelectorAll('[data-audience]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.audience)));
render('child');
