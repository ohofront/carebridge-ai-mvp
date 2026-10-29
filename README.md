# CareBridge — React + TypeScript MVP

AI 라이프 솔루션 챌린지용 **비의료 돌봄 인수인계 보조 시제품**.
기존 HTML/Vanilla JS 앱을 React 19 + TypeScript + Vite로 전환했습니다. 기존 Node.js AI API, 규칙 기반 데모, 20건 평가 데이터와 스크립트를 유지합니다.

## 준비

- Node.js 22.13 이상
- npm
- OpenAI API 키 및 API 크레딧 (실제 AI 모드에서만 필요)

```bash
npm install
cp .env.example .env
```

`.env` 파일의 `OPENAI_API_KEY=`에 키를 입력하세요. **GitHub에 올리지 마세요.** 브라우저에는 절대로 API 키를 입력하지 않습니다.

## 개발 모드 (터미널 2개)

터미널 A (백엔드 / 포트 3001):

```bash
npm run dev:server
```

터미널 B (React/Vite / 포트 5173):

```bash
npm run dev
```

브라우저에서 **http://localhost:5173** 을 엽니다. `/api`는 Vite가 서버 3001번으로 프록시합니다.

기존 3000번 서버가 켜져 있어도 충돌하지 않습니다. `PORT`를 바꾸려면 `vite.config.ts`의 프록시 대상 포트도 변경해야 합니다.

## 단일 포트 실행 (공모전 배포 형태)

```bash
npm run build
PORT=3000 npm start
```

브라우저에서 **http://localhost:3000** 을 엽니다. 이 방식은 React 빌드 결과와 API를 하나의 Node 서버에서 제공합니다. 기존 3000번 서버를 종료해야 합니다.

`.env`에 `PORT=3001`이 설정되어 있으면 `PORT=3000 npm start`처럼 환경변수로 덮어씁니다.

## 확인 및 평가

```bash
npm test
npm run build
# 서버 실행 후 새 터미널에서
CAREBRIDGE_URL=http://localhost:3001 node evaluation/run_eval.mjs
```

공모전 제출을 위해 실제 AI 모드에서 20건을 평가하세요. 데모 모드는 AI 번역/AI 성능 검증이 아닙니다. 평가 스크립트는 모델 호출 비용이 발생합니다.

## 주요 기능

- 영어/베트남어/중국어 합성 돌봄 기록 샘플
- 한국어 번역, 요약, 근거 포함 항목 분류, 누락 질문, 인수인계 초안
- 복사 및 JSON 다운로드
- API 키가 없는 환경을 위한 명확히 표시된 규칙 기반 데모
- React 상태 조건부 렌더링으로 이전 '안내문 아래 결과' 레이아웃 버그 수정

## 보안 및 한계

- 시제품이며 의료 진단/의료 판단에 사용하지 마세요.
- 실제 환자/요양대상자의 개인정보를 입력하지 마세요. 외부 API 호출로 내용이 전송됩니다.
- `OPENAI_API_KEY`는 서버 전용이며 `.env` 파일을 저장소에 업로드하지 마세요.
- 공개 운영 전에는 접근 제어, 보존/삭제 정책, 사용자 고지, 의료/돌봄 전문가 검증, 요청 제한 및 비용 한도 등을 추가해야 합니다.
