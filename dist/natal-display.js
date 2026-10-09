// Display counts only: never a strength score or a new core calculation.
export const ELEMENT_ORDER = ['wood','fire','earth','metal','water'];
export const ELEMENT_LABELS = {wood:'목',fire:'화',earth:'토',metal:'금',water:'수'};
const STEMS='甲乙丙丁戊己庚辛壬癸', STEM_KO='갑을병정무기경신임계';
const BRANCHES='子丑寅卯辰巳午未申酉戌亥', BRANCH_KO='자축인묘진사오미신유술해';
const BRANCH_ELEMENTS=['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water'];
export const PILLARS=[['year','년주'],['month','월주'],['day','일주'],['hour','시주']];
export function learnerResult(calculation) {
  const raw=calculation?.subjects?.learner;
  if (!['ok','partial'].includes(raw?.status) || !Array.isArray(raw.result?.subjects)) return null;
  return raw.result.subjects.find(s=>s.subjectId==='learner') || null;
}
export function characterInfo(char, kind) {
  const stem=kind==='stem', index=(stem?STEMS:BRANCHES).indexOf(char);
  if (typeof char!=='string' || char.length!==1 || index<0) return null;
  return {char,reading:(stem?STEM_KO:BRANCH_KO)[index],element:stem?ELEMENT_ORDER[Math.floor(index/2)]:BRANCH_ELEMENTS[index],polarity:index%2===0?'yang':'yin'};
}
export function pillarInfo(value) {
  if (typeof value!=='string' || value.length!==2) return null;
  const stem=characterInfo(value[0],'stem'),branch=characterInfo(value[1],'branch');
  if (!stem || !branch || stem.polarity!==branch.polarity) return null;
  return {value,stem,branch};
}
export function buildNatalDisplay(calculation, payload) {
  const unknown=payload?.learner?.birthTime?.isUnknown===true || payload?.learner?.birthTime?.period==='unknown';
  const keys=PILLARS.map(([key])=>key).filter(key=>!unknown || key!=='hour');
  const candidates=learnerResult(calculation)?.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return {status:'unavailable',unknown};
  const rows=candidates.map(c=>Object.fromEntries(keys.map(key=>[key,pillarInfo(c?.pillars?.[key])])));
  if (rows.some(row=>keys.some(key=>!row[key]))) return {status:'unavailable',unknown};
  const counts=rows.map(row=>{
    const elements=Object.fromEntries(ELEMENT_ORDER.map(key=>[key,0]));let yin=0,yang=0;
    for (const key of keys) for (const char of [row[key].stem,row[key].branch]) {
      elements[char.element]++; if(char.polarity==='yin')yin++;else yang++;
    }
    return {...elements,yin,yang};
  });
  const ranges=Object.fromEntries([...ELEMENT_ORDER,'yin','yang'].map(key=>[key,{min:Math.min(...counts.map(row=>row[key])),max:Math.max(...counts.map(row=>row[key]))}]));
  const columns=PILLARS.map(([key,label])=>({key,label,unknown:unknown&&key==='hour',values:unknown&&key==='hour'?[]:[...new Set(rows.map(row=>row[key].value))].map(pillarInfo)}));
  const varied=columns.some(column=>column.values.length>1);
  return {status:'ready',unknown,total:keys.length*2,columns,ranges,varied,
    notice:unknown?'시주를 제외한 여섯 글자의 오행 구성입니다. 실제 오행의 힘과는 차이가 있을 수 있어요.':'사주 여덟 글자의 오행 구성입니다. 실제 오행의 힘과는 차이가 있을 수 있어요.',
    summary:varied?'출생 정보에 따라 원국 후보가 있어요. 아래 개수는 가능한 구성의 범위이며, 특정 후보를 임의로 고르지 않았어요.':`${ELEMENT_ORDER.map(key=>`${ELEMENT_LABELS[key]} ${ranges[key].min}개`).join(' · ')}로 구성돼요. 글자의 배치를 보여주는 집계이며, 성격이나 공부 능력의 순위를 뜻하지 않아요.`};
}
