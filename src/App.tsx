import { useEffect, useState } from 'react';

type Language = 'en' | 'vi' | 'zh' | 'other';
type Mode = 'demo' | 'ai';
type Item = { category: string; detail: string; evidence: string };
type Analysis = { mode: Mode; model?: string | null; koreanTranslation: string; summary: string; items: Item[]; missing: string[]; warnings: string[]; handoff: string };
type ApiStatus = { aiConfigured: boolean; mode: string };

const samples: Record<Exclude<Language, 'other'>, string> = {
  en: 'During lunch, the resident ate about half of the meal and drank one glass of water. At 2 PM, the resident walked in the corridor with assistance. The resident said they felt tired. No fall was reported.',
  vi: 'Buổi trưa, người được chăm sóc ăn khoảng nửa suất cơm và uống một cốc nước. Lúc 14 giờ, người đó đi bộ với sự hỗ trợ của nhân viên. Người đó nói rằng cảm thấy mệt.',
  zh: '午餐时，老人吃了大约一半的饭，喝了一杯水。下午两点，在护理人员帮助下在走廊行走。老人表示有点疲倦。',
};

function downloadJson(data: Analysis) {
  const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'carebridge-result.json'; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<Mode>('demo');
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/status', { signal: controller.signal })
      .then(async (res) => { if (!res.ok) throw new Error('서버 상태 오류'); return res.json() as Promise<ApiStatus>; })
      .then(setStatus)
      .catch((e: unknown) => { if (!(e instanceof DOMException && e.name === 'AbortError')) setStatusError(true); });
    return () => controller.abort();
  }, []);

  const loadSample = (lang: Exclude<Language, 'other'>) => { setLanguage(lang); setNote(samples[lang]); setError(''); };
  const analyze = async () => {
    setError('');
    if (note.trim().length < 12 || note.length > 4000) { setError('돌봄 기록을 12~4000자로 입력하세요.'); return; }
    if (/\b\d{6}\s*-?\s*\d{7}\b/.test(note)) { setError('주민등록번호로 보이는 정보가 있습니다. 비식별화 후 다시 입력하세요.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: note.trim(), language, mode }) });
      const data: Analysis & { error?: string; detail?: string } = await response.json();
      if (!response.ok) throw new Error([data.error || '분석 실패', data.detail].filter(Boolean).join(' · '));
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };
  const copy = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.handoff); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError('클립보드 접근 권한을 확인해 주세요.'); }
  };

  return <>
    <header className="top"><div className="brand"><span className="mark">✳</span><span>CareBridge <small>돌봄의 언어를 잇다</small></span></div><span className="topright">2026 AI 라이프 솔루션 챌린지 · React MVP</span></header>
    <main>
      <section className="hero"><span className="eyebrow">다국어 돌봄 기록 → 한국어 인수인계</span><h1>기록은 쉽게,<br/><em>돌봄은 빠짐없이.</em></h1><p>외국인 요양보호사의 기록을 한국어로 정리하고, 다음 담당자가 확인할 내용을 표시합니다.</p><div className="hero-note">⚠ 시제품입니다. 주민등록번호·실제 환자 이름·의료기록 등 개인정보를 입력하지 마세요. 의료 판단이나 투약 지시를 제공하지 않습니다. 실제 AI 분석 시 입력이 외부 API로 전송됩니다.</div></section>
      <section className="workspace">
        <div className="panel">
          <div className="panel-heading"><span className="step">01</span><div><h2>돌봄 기록 입력</h2><p>개인정보를 제거한 가상의 기록만 사용해주세요.</p></div></div>
          <label htmlFor="language">원문 언어</label>
          <select id="language" value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="en">영어 English</option><option value="vi">베트남어 Tiếng Việt</option><option value="zh">중국어 中文</option><option value="other">기타 / 한국어</option></select>
          <div className="quick"><span>샘플 불러오기</span><button type="button" className="sample" onClick={() => loadSample('en')}>영어 예시</button><button type="button" className="sample" onClick={() => loadSample('vi')}>베트남어 예시</button><button type="button" className="sample" onClick={() => loadSample('zh')}>중국어 예시</button></div>
          <label htmlFor="note">근무 기록 <span id="charcount">{note.length} / 4000</span></label>
          <textarea id="note" value={note} maxLength={4000} onChange={e => setNote(e.target.value)} placeholder="예: The resident ate half of lunch, drank one glass of water, and walked with assistance..." spellCheck={false}/>
          <div className="modebox"><label htmlFor="mode">분석 모드</label><select id="mode" value={mode} onChange={e => setMode(e.target.value as Mode)}><option value="demo">오프라인 데모 (규칙 기반, 번역 없음)</option><option value="ai" disabled={status?.aiConfigured === false}>실제 AI 분석 (서버 API 키 필요)</option></select><p>{statusError ? '서버 상태를 확인할 수 없습니다.' : !status ? '서버 상태 확인 중…' : status.aiConfigured ? '실제 AI 분석 사용 가능 · 서버 API 키 설정됨' : '현재 데모 모드만 사용 가능 · 서버에 OPENAI_API_KEY를 설정하세요.'}</p></div>
          <button type="button" className="primary" onClick={analyze} disabled={loading || (mode === 'ai' && !status?.aiConfigured)}>{loading ? '분석 중...' : '기록 분석하기'} <span>↗</span></button>
          {error && <p role="alert" className="error">{error}</p>}
        </div>
        <div className="panel output" aria-live="polite">
          <div className="panel-heading"><span className="step">02</span><div><h2>인수인계 분석 결과</h2><p>근거 문장과 누락 확인 사항을 함께 살펴보세요.</p></div></div>
          {!result ? <div className="empty"><div className="empty-icon">↗</div><strong>분석 결과가 여기에 표시됩니다</strong><p>왼쪽에서 샘플을 불러오고 ‘기록 분석하기’를 눌러보세요.</p></div> : <div className="results">
            <div className="resultbadge">{result.mode === 'ai' ? `AI 분석 결과 · ${result.model ?? '모델'}` : '데모 결과 · 규칙 기반 / AI 분석 아님'}</div>
            <section className="result-section"><h3>한국어 번역</h3><p className="paper">{result.koreanTranslation || '—'}</p></section>
            <section className="result-section"><h3>핵심 요약</h3><p>{result.summary || '—'}</p></section>
            <section className="result-section"><h3>항목별 돌봄 기록 <span>({result.items.length})</span></h3>{result.items.length ? result.items.map((item, index) => <div className="item" key={`${item.category}-${index}`}><b>{item.category}</b><p>{item.detail}</p><small>근거: {item.evidence}</small></div>) : <p>추출된 항목이 없습니다.</p>}</section>
            <section className="result-section"><h3>추가 확인이 필요한 정보 <span>({result.missing.length})</span></h3>{result.missing.length ? <ul id="missing">{result.missing.map((m, i) => <li key={i}>{m}</li>)}</ul> : <p>추가 확인 항목이 없습니다.</p>}</section>
            <section className="result-section"><h3>담당자 인수인계 초안</h3><pre className="paper">{result.handoff || '—'}</pre><button type="button" className="secondary" onClick={copy}>{copied ? '복사 완료 ✓' : '인수인계 내용 복사'}</button><button type="button" className="secondary" onClick={() => downloadJson(result)}>결과 JSON 다운로드</button></section>
            <section className="result-section"><h3>주의사항</h3>{result.warnings.length ? <ul id="warnings">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul> : <p>추가 주의사항이 없습니다.</p>}</section>
          </div>}
        </div>
      </section>
      <section className="bottom"><div><span className="eyebrow">HOW IT WORKS</span><h2>세 단계의 간결한 인수인계</h2></div><div className="steps"><div><b>01</b><strong>기록 입력</strong><span>비식별화된 돌봄 내용</span></div><div><b>02</b><strong>AI 구조화</strong><span>번역 · 항목 추출 · 근거 확인</span></div><div><b>03</b><strong>인수인계</strong><span>누락 항목 확인 후 최종 검토</span></div></div></section>
      <footer>CareBridge · 비의료 의사결정 보조 시제품 · 실제 돌봄에는 담당자의 검토가 필요합니다.</footer>
    </main>
  </>;
}
