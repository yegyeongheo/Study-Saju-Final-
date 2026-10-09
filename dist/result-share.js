import {DAY_ANIMAL_IMAGES, STUDY_TYPE_IMAGES} from './card-assets.js';
import {cardImageFilename} from './report-cards.js';

// Explicit allowlist: never serialize the input form, birth data, or answers.
export function shareSnapshot(model, gender) {
  const card = model.guardian?.status === 'ready' ? model.guardian.card : null;
  return Object.freeze({
    typeName:model.type?.typeName || '공부유형 준비 중',
    headline:model.type?.headline || '나를 이해하는 공부의 첫걸음',
    hanja:model.type?.hanja || '',
    guardianTitle:card?.title || '수호카드 확인 중',
    studyImage:cardImageFilename(STUDY_TYPE_IMAGES, model.type?.typeId && `${model.type.typeId}-${gender}`),
    guardianImage:cardImageFilename(DAY_ANIMAL_IMAGES, card?.key)
  });
}

function lines(ctx, text, maxWidth) {
  const result=[]; let line='';
  for (const char of String(text)) {
    if (char==='\n' || (line && ctx.measureText(line+char).width>maxWidth)) {
      result.push(line.trim()); line=char==='\n'?'':char;
    } else line+=char;
  }
  if (line) result.push(line.trim());
  return result;
}
function centered(ctx, text, y, width, lineHeight) {
  for (const line of lines(ctx,text,width)) {ctx.fillText(line,540,y); y+=lineHeight;}
  return y;
}
function fitCenter(ctx,text,top,width,height,initial,family){
  let size=initial;
  do{ctx.font=`${size}px ${family}`;if(lines(ctx,text,width).length*size*1.35<=height)break;size-=2;}while(size>16);
  centered(ctx,text,top+size,width,size*1.35);
}

export function paintShareImage(ctx, snapshot, images={}) {
  const W=1080,H=1720;
  ctx.clearRect(0,0,W,H);
  const background=ctx.createLinearGradient(0,0,W,H);
  background.addColorStop(0,'#171b32'); background.addColorStop(1,'#29283f');
  ctx.fillStyle=background; ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(540,800,20,540,800,700);
  glow.addColorStop(0,'#c5b6e91c');glow.addColorStop(1,'#c5b6e900');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#b9a47866'; ctx.lineWidth=2; ctx.strokeRect(34,34,W-68,H-68);
  ctx.textAlign='center';ctx.fillStyle='#c7b9e8';
  ctx.font='23px "Noto Sans KR", sans-serif';ctx.fillText('S T U D Y   S A J U',540,114);
  ctx.font='40px "Gowun Batang", serif';ctx.fillStyle='#f8f4ff';ctx.fillText('두 카드로 읽는 나',540,190);
  ctx.fillStyle='#cbbbed';fitCenter(ctx,snapshot.typeName,232,880,138,54,'"Gowun Batang", serif');
  if(snapshot.hanja){ctx.fillStyle='#d9c38f';fitCenter(ctx,snapshot.hanja,366,850,52,28,'"Gowun Batang", serif');}
  ctx.fillStyle='#eee8fa';fitCenter(ctx,snapshot.headline,422,850,140,29,'"Noto Sans KR", sans-serif');
  const cards=[{x:88,title:'공부유형',name:snapshot.typeName,image:images.study},{x:568,title:'수호카드',name:snapshot.guardianTitle,image:images.guardian}];
  for(const card of cards){
    const x=card.x,top=658,w=424,h=820;
    ctx.fillStyle='#c7b9e8';ctx.font='24px "Noto Sans KR", sans-serif';ctx.fillText(card.title,x+w/2,600);
    ctx.font='30px "Gowun Batang", serif';ctx.fillStyle='#f6f0ff';
    let labelSize=30;while(ctx.measureText(card.name).width>420&&labelSize>10){labelSize--;ctx.font=`${labelSize}px "Gowun Batang", serif`;}ctx.fillText(card.name,x+w/2,643);
    ctx.fillStyle='#171b2bcc';ctx.fillRect(x,top,w,h);
    if(card.image){
      const ratio=Math.min(w/card.image.width,h/card.image.height),iw=card.image.width*ratio,ih=card.image.height*ratio;
      ctx.drawImage(card.image,x+(w-iw)/2,top+(h-ih)/2,iw,ih);
    }else{
      ctx.strokeStyle='#bda56b99';ctx.lineWidth=2;ctx.strokeRect(x+14,top+14,w-28,h-28);
      ctx.font='25px "Noto Sans KR", sans-serif';ctx.fillStyle='#bcb3ce';ctx.fillText('카드 이미지 준비 중',x+w/2,top+h/2);
    }
  }
  ctx.font='35px "Gowun Batang", serif';ctx.fillStyle='#eee7fa';ctx.fillText('공부사주',540,1552);
  ctx.font='21px "Noto Sans KR", sans-serif';ctx.fillStyle='#aaa2be';
  ctx.fillText('사주를 바탕으로 한 자기 이해 콘텐츠',540,1604);
}

function loadArtwork(filename) {
  if(!filename)return Promise.resolve(null);
  return new Promise(resolve=>{
    const image=new Image();let done=false;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(value);};
    const timer=setTimeout(()=>finish(null),5000);
    image.onload=()=>finish(image);image.onerror=()=>finish(null);image.src=filename;
  });
}
export async function makeShareBlob(snapshot) {
  const [study,guardian]=await Promise.all([loadArtwork(snapshot.studyImage),loadArtwork(snapshot.guardianImage)]);
  if(document.fonts?.ready) await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1800))]);
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1720;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  paintShareImage(ctx,snapshot,{study,guardian});
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image unavailable')),'image/png'));
}

export function createResultShare({makeBlob=makeShareBlob}={}) {
  const el=id=>document.getElementById(id),save=el('save-result-image'),share=el('share-result-image'),link=el('result-image-download'),status=el('result-share-status');
  let generation=0,blob=null,url=null;
  function reset(){
    generation++;blob=null;if(url)URL.revokeObjectURL(url);url=null;
    save.disabled=share.disabled=true;link.hidden=true;link.removeAttribute('href');status.textContent='';
  }
  function download(){if(!url)return;link.hidden=false;link.click();status.textContent='저장을 시작했어요. 열리지 않으면 이미지 내려받기를 눌러 주세요.';}
  save.addEventListener('click',download);
  share.addEventListener('click',()=>{
    if(!blob)return;
    const token=generation;
    const file=typeof File==='function'?new File([blob],'studysaju-result.png',{type:'image/png'}):null;
    if(file && typeof navigator.share==='function' && navigator.canShare?.({files:[file]})){
      // Call while the click still has transient user activation; image is prepared beforehand.
      navigator.share({files:[file],title:'공부사주'}).then(()=>{
        if(token===generation)status.textContent='공유 창에서 선택한 곳으로 전달했어요.';
      }).catch(error=>{
        if(token!==generation)return;
        status.textContent=error?.name==='AbortError'?'공유를 취소했어요.':'공유 창을 열지 못했어요. 이미지를 저장해서 공유해 주세요.';
        if(error?.name!=='AbortError')link.hidden=false;
      });
    }else{download();status.textContent='이 브라우저에서는 이미지 저장 후 원하는 앱에서 공유해 주세요.';}
  });
  function prepare(snapshot){
    reset();const token=generation;status.textContent='저장할 이미지를 준비하고 있어요.';
    Promise.resolve().then(()=>makeBlob(snapshot)).then(value=>{
      if(token!==generation)return;
      blob=value;url=URL.createObjectURL(blob);link.href=url;save.disabled=share.disabled=false;
      status.textContent='개인정보 없이 카드와 핵심 문장만 저장돼요.';
    }).catch(()=>{if(token===generation)status.textContent='이미지를 준비하지 못했어요. 다시 분석한 뒤 시도해 주세요.';});
  }
  return {prepare,reset};
}
