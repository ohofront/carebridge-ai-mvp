import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.CAREBRIDGE_URL || 'http://localhost:3000';
const cases=JSON.parse(await fs.readFile(new URL('./cases_20.json',import.meta.url),'utf8'));
const output=[];
for(const test of cases){
 const started=performance.now();
 try{
  const res=await fetch(`${base}/api/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:test.language,note:test.note,mode:'ai'})});
  const data=await res.json();
  if(!res.ok) throw Error(`${res.status}: ${data.detail||data.error||'unknown'}`);
  if(data.mode!=='ai')throw Error(`실제 AI 모드가 아닙니다 (${data.mode})`);
  const predicted=[...new Set((data.items||[]).map(x=>x.category))];
  const expected=test.gold_categories;
  const tp=expected.filter(x=>predicted.includes(x)).length;
  const precision=predicted.length?tp/predicted.length:0;
  const recall=tp/expected.length;
  output.push({id:test.id,lang:test.language,status:'ok',ms:Math.round(performance.now()-started),expected,predicted,precision,recall,summary:data.summary,translation:data.koreanTranslation,missing:data.missing,items:data.items,handoff:data.handoff,manual_review:{facts_preserved:null,unsupported_fact:null,missing_appropriate:null,notes:''},gold_evidence:test.evidence_tokens,forbidden_claims:test.forbidden_claims_ko});
  process.stdout.write(`${test.id}: success, categories precision=${precision.toFixed(2)}, recall=${recall.toFixed(2)}\n`);
 }catch(err){output.push({id:test.id,status:'error',error:String(err),ms:Math.round(performance.now()-started)});console.error(`${test.id}: ${err.message}`)}
}
const ok=output.filter(x=>x.status==='ok');
const avg=key=>ok.length?ok.reduce((a,b)=>a+b[key],0)/ok.length:null;
const report={metadata:{generatedAt:new Date().toISOString(),base,caseCount:cases.length,successCount:ok.length,notes:'범주 평가만 자동. 사실보존/환각/누락 적절성은 원문 및 결과를 사람이 직접 검수해야 합니다. 실제 AI API 실행 결과만 포함.'},metrics:{category_precision:avg('precision'),category_recall:avg('recall'),avg_latency_ms:avg('ms')},results:output};
const filename=path.resolve(`carebridge-eval-results-${new Date().toISOString().slice(0,10)}.json`);
await fs.writeFile(filename,JSON.stringify(report,null,2));
console.log(`\n결과 저장: ${filename}\n성공: ${ok.length}/${cases.length} | Precision ${report.metrics.category_precision?.toFixed(3)||'N/A'} | Recall ${report.metrics.category_recall?.toFixed(3)||'N/A'}`);
if(ok.length!==cases.length)process.exitCode=1;
