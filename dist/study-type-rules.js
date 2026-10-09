// Plug in the EXISTING approved eight-type table here. No replacement scoring is invented.
// Metadata: id -> {name,hanja,self:{headline,description:[3–4 sentences]},child:{...}}.
// Rule: {typeId, priority, all:[{trait,levels:['HIGH','VERY_HIGH']}, ...]}.
// Priorities must be explicit; ambiguous equal-priority matches remain unresolved.
export const STUDY_TYPES = Object.freeze({});
export const STUDY_TYPE_RULES = Object.freeze([]);
export function selectApprovedType(traits, audience, types=STUDY_TYPES, rules=STUDY_TYPE_RULES) {
  const matches=rules.filter(rule=>Number.isFinite(rule.priority) && Array.isArray(rule.all) && rule.all.length && rule.all.every(c=>{
    const levels=traits[c.trait]?.levels||[traits[c.trait]?.level];
    return levels.length>0 && Array.isArray(c.levels) && levels.every(level=>['VERY_LOW','LOW','MID','HIGH','VERY_HIGH'].includes(level)&&c.levels.includes(level));
  }) && Object.hasOwn(types,rule.typeId)).sort((a,b)=>b.priority-a.priority);
  if (!matches.length || (matches[1] && matches[0].priority===matches[1].priority)) return null;
  const rule=matches[0],meta=types[rule.typeId],copy=meta[audience];
  if (!copy || !Array.isArray(copy.description) || copy.description.length<3 || copy.description.length>4 || [meta.name,meta.hanja,copy.headline,...copy.description].some(text=>typeof text!=='string'||!text.trim())) return null;
  return {typeId:rule.typeId,typeName:meta.name,hanja:meta.hanja,headline:copy.headline,description:copy.description,evidence:rule.all.map(c=>c.trait)};
}
