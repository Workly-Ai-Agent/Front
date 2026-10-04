# Workly Frontend

Workly는 프로젝트 계획, 팀 채팅, Task 실행을 한곳에서 관리하는 협업 서비스입니다. 프론트엔드는 React와 TypeScript로 구성되며 Kotlin/Spring 백엔드와 HTTP API 및 WebSocket으로 통신합니다.

## 주요 기능

- 워크스페이스, 프로젝트, 멤버와 역할 관리
- 담당자, 일정, 우선순위, 상태를 관리하는 Task 보드
- 워크스페이스 및 프로젝트 실시간 채팅
- AI가 만든 전체 계획 및 채팅 기반 Task 변경 제안 검토
- Leader 승인 후 Task에 제안 반영
- 사용자 스킬과 프로젝트 Agent 활동 확인

## 기술 구성

- React 19, TypeScript, Vite
- React Router, Zustand
- Tailwind CSS
- WebSocket/STOMP를 통한 실시간 채팅

## 로컬 실행

Node.js와 npm을 설치한 뒤 프론트엔드 디렉터리에서 실행합니다.

```bash
npm install
cp .env.example .env
npm run dev
```

기본 설정은 백엔드를 `http://localhost:8080`에서 찾습니다. 백엔드와 AI Agent를 먼저 실행하고, 필요한 경우 `.env`의 주소를 환경에 맞게 바꾸세요.

```env
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:8080
```

Vite는 `/api` 요청과 `/ws` WebSocket 연결을 `VITE_BACKEND_URL`로 프록시합니다. 배포할 때 `VITE_API_BASE_URL`을 백엔드의 `/api` 주소로 설정하세요. 이 값은 빌드 시 프론트엔드 번들에 포함되므로 비밀 키를 넣지 마세요.

## 명령어

```bash
npm run dev       # 개발 서버
npm run build     # TypeScript 검사 및 배포 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint
```

## AI 제안 흐름

전체 계획은 프로젝트의 AI 계획 화면에서 요청하고, 채팅 중 생긴 개별 Task 추가·변경은 해당 메시지의 반영 메뉴에서 요청합니다. AI는 제안만 만들며 프로젝트 Leader가 승인해야 실제 Task 목록에 반영됩니다.

## 관련 저장소

- [Back](https://github.com/Workly-Ai-Agent/Back) — API, 인증, 데이터 저장, WebSocket
- [AI-Agent](https://github.com/Workly-Ai-Agent/AI-Agent) — 계획 분석 및 제안 생성
