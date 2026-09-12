# CLAUDE.md — 제주 태양 관측소 대시보드

이 저장소는 초등 6학년 「계절의 변화」 단원용 실시간 태양고도 측정 대시보드다.
이지메이커 보드(밝기센서 5개, A0~A4)가 USB로 보내는 값을 Web Serial로 받아 그림자 길이·태양 고도를 계산하고,
시뮬레이터·탐구 카드·기록 기능으로 학생 탐구를 확장한다. 서버와 DB는 없다.

## 문서 읽는 순서 (작업 전 반드시)
1. `docs/00-프로젝트-개요.md` — 배경, 심사 기준, 산출물, 결정 사항
2. `docs/01-측정기-하드웨어-프로토콜.md` — 센서 배치, 시리얼 형식, 보정
3. `docs/02-구현기획서.md` — 화면·파일 구조·단계별 작업 (§5.1 시리얼 이식 코드 포함)
4. `docs/03-디자인-확정안.md` — 스타일 규칙. 02와 충돌하면 **03이 우선**
5. `docs/04-계산-사양.md` — 수식과 테스트 벡터. 여기 값으로 테스트를 통과시킬 것
6. `docs/05-탐구카드-데이터.md` — 18개 카드 정의
7. `docs/06-작업단계-프롬프트.md` — 단계별 완료 조건
8. `docs/reference/` — 원본 기획서, 제작 가이드, 주최 측 템플릿 HTML(통신 코드 원본)

## 기술 스택 (변경 금지)
- Next.js 15 App Router, TypeScript strict, `output: 'export'` (정적). API 라우트·서버 컴포넌트 데이터 페칭 금지
- Tailwind + shadcn/ui (stone 프리셋, radius 0.5rem). 컴포넌트는 shadcn만. 커스텀 CSS는 `globals.css`의 토큰과 `.num`뿐
- 상태: zustand + `persist`(localStorage). 차트: shadcn `ChartContainer`(recharts). 테스트: vitest
- Web Serial: `'use client'` 컴포넌트에서만. `lib/serial.ts`는 `docs/reference/바이브코딩_웹시리얼연결_기본.html`의 로직을 이식한 것이어야 하며 **baudRate 115200**
- 폰트 Pretendard 단일. 아이콘 lucide-react 16px, 의미 있을 때만

## 절대 규칙
- 항상 mock 모드로 모든 화면이 동작해야 한다. 센서 없이 시연 가능해야 심사에서 살아남는다
- 계산 로직(`lib/solar.ts`, `lib/shadow.ts`, `lib/calibration.ts`)은 브라우저 API·React 의존 없는 순수 함수. 단일 HTML로 복사해 쓸 수 있어야 한다
- `docs/04-계산-사양.md`의 테스트 벡터를 통과하지 않으면 UI 작업으로 넘어가지 않는다
- 디자인 금지 목록: 그라디언트, 글로우/box-shadow, backdrop-blur, 이모지, 영문 병기 제목, 장식 아이콘, 앰버 외 강조색, animate-pulse(연결 상태 점 제외)
- 모든 UI 문구는 초등 6학년이 읽는 한국어. 숫자는 소수 1자리, tabular-nums
- 한 단계가 끝나면 `npm run build`와 `npm test`가 통과해야 한다. 실기기 없이도 `npm run dev` 후 모의 모드로 화면 확인

## 명령
```
npm run dev      # 로컬 (Web Serial은 localhost에서 동작)
npm test         # vitest
npm run build    # out/ 생성 → Vercel 또는 Netlify 드래그앤드롭
```

## 기본값
- 관측지: 제주 위도 33.5°N, 경도 126.53°E, 표준시 자오선 135°E
- 가림판 높이 25.0 cm (센서 수광면 기준), 센서 거리 [9.1, 14.4, 21.0, 29.8, 43.3] cm = 각도 [70, 60, 50, 40, 30]°
- 경계 임계값(정규화) 0.5, 시리얼 2 Hz, 차트 최근 120점

## 현재 상태
`06-작업단계-프롬프트.md`의 체크리스트를 갱신하며 진행한다. 새 결정이 생기면 이 파일의 "결정 기록"에 한 줄 추가한다.

0단계·1단계 완료. `npm test` 64개 통과, `npm run build`로 `out/` 생성 확인.

**문서 누락**: `docs/` 폴더가 없다. 실제로 있는 문서는 루트의 `04-계산-사양.md`, `06-작업단계-프롬프트.md`,
그리고 원본 기획서 v1에 해당하는 `태양고도-탐구주제.md`뿐이다.
`docs/00`, `docs/01`(시리얼 형식·보정 절차), `docs/02`(파일 구조·시리얼 이식 코드 §5.1), `docs/03`(디자인 토큰),
`docs/05`(탐구카드 18개), `docs/reference/바이브코딩_웹시리얼연결_기본.html`이 없다.
2단계(시리얼)와 3·4단계(디자인)는 이 문서들 없이는 추측이 된다.

## 결정 기록
- 서보(각도 스캔·방위 회전) 제외. 5센서 고정 배열로 확정
- DB 없음. localStorage + CSV/JSON 파일 + URL 해시 공유
- 다크 셀레스티얼 시안 폐기. 라이트 shadcn + 앰버 단일 강조
- 하늘 장면은 측면도 한 장(방위각 표시 없음)
- Tailwind v4 + shadcn v4(`radix-nova`, `cn` 패키지, recharts 3). shadcn v2의 `--base-color stone`이
  없어져 stone 팔레트와 `--radius: 0.5rem`을 `app/globals.css`에 직접 넣었다. `.dark` 블록은 지웠다
- Next.js는 15.5.25. 15.5.4는 CVE-2025-66478 대상이라 15 계열 패치 버전으로 올렸다
- `lib/shadow.ts`에 `DIFFUSE_MAX = 0.75` 추가. docs/04 규칙 2(nolight)와 3(inside)만으로는
  문서의 두 테스트 벡터를 구분하지 못해 밝기 수준으로 가른다. 자세한 사유는 파일 주석 참고
- docs/04의 "9/12 10:00 → 53.2°" 벡터는 같은 문서의 식과 어긋난다. 식대로면 10:00은 44.0°,
  53.2°는 약 10:59다. 식이 명확하므로 식을 따랐다. 수업 자료에 53.2°/10:00이 들어갔다면 확인 필요
- `lib/calibration.ts`는 docs/01이 없어 2점 보정(그늘·빛)으로 임시 구현. 문서가 오면 대조할 것
