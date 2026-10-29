# CareBridge 실 AI 평가 키트 — 합성 기록 20건

## 전제
- `cases_20.json`은 실제 사람의 데이터가 아닌 **가상의 언어별 돌봄 기록**입니다.
- `gold_categories`는 사람이 지정한 기대 범주이며 정답의 일부일 뿐입니다. 다중 분류에서 문장 해석의 차이가 있으므로 오답은 직접 재검토하세요.
- `evidence_tokens`는 원문에 반드시 보존되어야 할 주요 정보의 검수 힌트입니다. 번역문과 핸드오프를 사람과 비교해야 합니다.
- `forbidden_claims_ko`는 발견되면 심각한 오류가 될 수 있는 사례별 금지 사실의 예시입니다. 문자열 자동 매칭만으로 환각률을 계산하면 안 됩니다.
- API 호출 비용이 발생하고 API 사용 가능 여부는 계정과 모델에 따라 다릅니다.

## 1. 실행
터미널 A (프로젝트 루트):

```sh
export OPENAI_API_KEY='YOUR_KEY' # 쉘 히스토리에 키를 남기지 않는 방법 사용 권장
npm start
```

터미널 B (프로젝트 루트):

```sh
node evaluation/run_eval.mjs
```

20건을 순차 호출하며 성공 상태와 항목 분류 Precision/Recall, 평균 응답 시간을 수집해 `carebridge-eval-results-YYYY-MM-DD.json`에 저장합니다. 요청이 실패하면 오류를 기록하고 다음 케이스를 진행합니다. 결과 파일에는 AI 출력이 포함되므로 실제 민감한 데이터를 쓰지 마세요.

## 2. 수동 검수
결과 JSON의 각 `results[i].manual_review`를 다음 기준에 따라 검수하세요.
- `facts_preserved`: 식사량, 수분량, 시간, 상태, 부정 표현을 정확히 유지했는가 (true/false)
- `unsupported_fact`: 원문에 없는 **새로운 사실**을 단정했는가 (true/false)
- `missing_appropriate`: 입력에 없는 정보를 '확인 질문'으로 제시하며 사실과 구별했는가 (true/false)
- `notes`: 잘못된 번역/누락/원문 근거 등 구체적 근거

### 성과보고서에 기재할 지표
- 항목 분류 Precision = 모든 성공 사례별 Precision 평균 (매크로 평균)
- 항목 분류 Recall = 모든 성공 사례별 Recall 평균 (매크로 평균)
- 사실보존 성공률 = `facts_preserved=true` 사례 / 수동 검수 완료 사례
- 근거 없는 사실 생성률 = `unsupported_fact=true` 사례 / 수동 검수 완료 사례
- 확인 질문 적절성 = `missing_appropriate=true` 사례 / 수동 검수 완료 사례
- 평균 지연 = 성공 호출의 평균 ms
- 성공 응답률 = 성공 건수 / 20

처리 실패, 불확실한 검수는 제외하지 말고 별도 표기하세요. 임상적 안전성 또는 실제 돌봄 효과를 입증한 것으로 주장하지 마세요.
