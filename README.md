# Seoul Sound Map
Seoul Sound Map

도시의 위험 데이터를 ‘소리’와 ‘공간 경험’으로 시각화하는 인터랙티브 웹 프로젝트

📌 프로젝트 개요

Seoul Sound Map은 서울시 자치구별 위험 데이터를 분석하여
이를 **지도 시각화 + 사운드(Web Audio)**로 변환해 보여주는 경험형 웹 프로젝트입니다.

사용자는 지도를 탐색하며

특정 지역의 상대적 위험도

시간이 지나며 변화한 도시의 상태
를 **숫자가 아닌 감각적 경험(색과 소리)**으로 인지할 수 있습니다.

🎯 핵심 컨셉

❌ 단순한 범죄 통계 대시보드

⭕ 도시의 상태를 ‘듣고 느끼는’ 전시형 인터랙션

“이 지역은 어떤 분위기의 소리를 낼까?”

🧱 전체 기술 스택
Frontend

Next.js (App Router) + React + TypeScript

TailwindCSS

레이아웃, 다크 테마, hover/transition 등 상호작용 스타일

SVG 기반 지도 렌더링

서울 자치구 경계를 <path> 단위로 직접 제어

외부 지도 SDK (Google Maps, Mapbox 등) 미사용

Audio

Web Audio API

사용자 클릭 이후에만 AudioContext 생성 (브라우저 자동재생 정책 준수)

위험도 점수에 따라 필터, 주파수, LFO 등 사운드 파라미터 실시간 변경

Backend (Server)

Next.js Route Handlers (Vercel Serverless)

/api/risk-score

서버에서만 파일 시스템 접근 및 OpenAI 호출 수행

AI / Prompt Engineering

OpenAI Chat Completions

계산된 위험 점수를 기반으로 분포를 자연스럽게 보정

JSON-only 출력 강제

파싱 실패 시 fallback 로직 포함

Data Storage

프로젝트 내부 JSON 파일 기반 데이터 관리

data/crime/

data/five/

data/policestation/

각 폴더에서 최신 파일 자동 선택

Deployment

Vercel

Frontend + Serverless API 통합 배포

OpenAI API Key는 서버 환경변수로만 관리

🔄 데이터 처리 흐름
1. 데이터 로딩

각 데이터 폴더(crime, five, policestation)에서
가장 최신 JSON 파일을 자동 선택하여 로드

2. 데이터 전처리

crime

서울 {구} 컬럼 탐색

모든 행 합산 → crimeTotal

five

합계/소계 행 탐색

최신 연도 값 추출 → fiveTotal

policestation

“서울” 경찰서만 필터링

경찰서명 → 구명 매칭

4대 범죄(살인/강도/절도/폭력) 합산 → policeTotal

3. 정규화 및 baseScore 계산

각 데이터셋을 0~1 범위로 정규화

가중치 적용:

crime: 0.45

five: 0.35

policestation: 0.20

최종 baseScore (0~100) 생성

4. OpenAI 보정 단계

입력:
(crimeTotal, fiveTotal, policeTotal, baseScore)

규칙:

0~100 범위 유지

단조 증가

동점 최소화

OpenAI 응답 파싱 성공 시 → 보정 점수 사용

실패 시 → baseScore로 fallback

5. 프론트 반영

/api/risk-score 응답 수신

지도 색상 / 패널 정보 / 사운드 파라미터 동기화

🗺️ 주요 화면
메인 페이지 (Map Experience)

서울 지도 탐색

자치구 hover / 선택 시:

위험도 색상 변화

사운드 변화

간단한 해설 패널 표시

트렌드 페이지 (/trend)

연도별 위험도 변화 시각화

단일 연도 보기 / 연도 비교

전시형(스토리텔링) 패널

카드 나열이 아닌 문장형 요약

미니 타임라인 + 미니 차트

📁 프로젝트 구조
app/
  page.tsx                # 메인 지도 경험
  trend/page.tsx          # 연도별 변화 페이지
  api/
    risk-score/route.ts   # 서버리스 API

components/
  SeoulMap.tsx
  HoverTooltip.tsx
  SidePanel.tsx
  TrendEditorialPanel.tsx
  MiniTimeline.tsx
  MiniSparkline.tsx

data/
  crime/
  five/
  policestation/

lib/
  risk.ts                 # score → level/color/copy
  stats.ts                # 평균/증감 계산
  audioEngine.ts          # Web Audio 로직
  dataLoader.ts           # 최신 JSON 선택 로직

🔐 보안 및 안정성 설계

OpenAI API Key는 서버 환경변수에서만 관리

클라이언트에서 직접 OpenAI 호출 ❌

OpenAI 실패 시에도 서비스가 중단되지 않도록 fallback 설계

AudioContext는 사용자 제스처 이후에만 생성

✨ 프로젝트 의의

공공 데이터를 분석 도구가 아닌 ‘경험’으로 재해석

지도 + 사운드를 결합한 감각 중심 시각화

AI를 ‘결정자’가 아닌 보조적 보정 도구로 사용

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 안내

- Audio는 하단 시트의 "소리 켜기" 버튼을 클릭한 뒤에만 시작됩니다.
- `data/districts.ts`의 mock 위험도는 추후 실제 데이터로 교체할 수 있습니다.
- `/trend` 페이지에서 연도별 위험도 변화/비교와 서울 평균 추이를 확인할 수 있습니다.
