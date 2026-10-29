export function validateInput(x){
  if(!x||typeof x!=='object')return '입력 데이터가 없습니다.';
  if(!['demo','ai'].includes(x.mode))return '분석 모드가 올바르지 않습니다.';
  if(typeof x.note!=='string'||x.note.trim().length<12||x.note.length>4000)return '돌봄 기록을 12~4000자로 입력하세요.';
  if(!['en','vi','zh','other'].includes(x.language))return '입력 언어를 선택해주세요.';
  return null;
}
const taxonomy=[['식사',/(meal|ate|food|breakfast|lunch|dinner|식사|먹|ăn|cơm|吃|饭)/i],['수분',/(water|drink|fluid|수분|물|uống|nước|喝|水)/i],['이동',/(walk|walking|wheelchair|fall|transfer|이동|걸|낙상|đi bộ|ngã|走|跌)/i],['위생',/(bath|shower|toilet|clean|위생|목욕|화장실|tắm|洗澡)/i],['수면',/(sleep|slept|nap|수면|잠|ngủ|睡)/i],['기분',/(mood|calm|anxious|happy|기분|불안|vui|lo lắng|情绪)/i],['관찰',/(pain|fever|cough|blood pressure|temperature|아프|열|기침|đau|sốt|痛|发烧)/i],['기타',/(medicine|medication|pill|drug|약|투약|thuốc|药)/i]];
const questions=[['식사','식사량 또는 식사 여부가 기록되지 않았습니다.'],['수분','수분 섭취량이 기록되지 않았습니다.'],['이동','이동 상태 및 낙상 여부가 확인되지 않았습니다.'],['관찰','특이 증상 또는 건강 상태 확인 기록이 없습니다.'],['기타','투약 관련 기록 유무를 확인하세요.']];
export function analyzeDemo({note,language}){
  const lines=note.split(/[\n.!?。]+/).map(x=>x.trim()).filter(Boolean);
  const items=[];for(const line of lines){const match=taxonomy.find(([,re])=>re.test(line));if(match)items.push({category:match[0],detail:'원문 확인 필요 (데모 모드는 번역하지 않습니다)',evidence:line.slice(0,180)});}
  const found=new Set(items.map(x=>x.category));
  const missing=questions.filter(([k])=>!found.has(k)).map(([,v])=>v);
  return {mode:'demo',model:null,koreanTranslation:'데모 모드에서는 실제 번역이 수행되지 않습니다. 아래 원문과 분류 결과를 확인하세요.',summary:`입력 기록 ${lines.length}개 구간 중 키워드 기반으로 ${items.length}개 항목을 분류했습니다. AI 분석 결과가 아닙니다.`,items,missing,warnings:['데모 모드는 키워드 규칙으로만 분류하며 번역·의미 분석을 수행하지 않습니다.','실제 돌봄 결정 전에 원문과 기록을 담당자가 검토해야 합니다.'],handoff:'[데모] 원문 검토 후 인수인계 내용을 직접 확정하세요.\n'+note,language};
}
export function normalizeAIResponse(o){
  const s=x=>typeof x==='string'?x.slice(0,12000):'';
  const a=x=>Array.isArray(x)?x.slice(0,30):[];
  return {koreanTranslation:s(o.koreanTranslation),summary:s(o.summary),items:a(o.items).map(y=>({category:s(y?.category),detail:s(y?.detail),evidence:s(y?.evidence)})),missing:a(o.missing).map(s),warnings:a(o.warnings).map(s),handoff:s(o.handoff)};
}
