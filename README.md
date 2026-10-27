# 국어 교실 — 고등학교 2학년 국어 수업용 웹앱

곤룡포(袞龍袍) 테마의 수업용 웹앱입니다. (1단계: 전체 뼈대)
React + Vite + TypeScript + Tailwind CSS · 백엔드 없이 mock 데이터 + localStorage로 동작합니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입 검사 + 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
```

**배포:** `main` 브랜치에 푸시하면 Vercel 이 자동으로 배포합니다 (`vercel.json`).
주소: https://highschoolkoreanclass.vercel.app

```bash
```

샘플 데이터를 초기화하려면 브라우저 개발자 도구에서 `hkc:` 로 시작하는 localStorage 항목을 지우고 새로고침하세요.

## 테스트 계정

| 역할 | 입력 1 | 입력 2 |
| --- | --- | --- |
| 학생 | 이름 `김하늘` | 학번 `20301` (샘플 5명: 20301~20305, 선생님의 [학생 등록]에서 추가·삭제) |
| 선생님 | ID `teacher01`, `teacher02` | 비밀번호 `teacher` |
| 교수자 | 퀴즈 정답: `AI디지털학습환경설계` → `A+` | — |

## 폴더 구조

```
src/
  config/      화면을 그리는 설정 (메뉴·역할·과목·퀴즈·권한·카테고리)
  data/        mock 데이터 (학생 명단, 교사 계정, 튜토리얼, 샘플 시드)
  services/    데이터 접근 계층 — 백엔드 교체 시 여기만 수정
  context/     AuthContext (현재 사용자·역할)
  components/  RoyalButton, TabBar, Modal, Emblem(흉배), CloudDivider, 레이아웃
  pages/       login / lobby / subjects / studyroom / board / library / tutorial / feedback
  styles/      theme.css(색·폰트·둥글기 토큰), index.css
  routes.tsx   URL ↔ 페이지 연결
```

## 무엇을 고치면 되나요?

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 색·폰트·둥글기·그림자 | `src/styles/theme.css` |
| 로비 메뉴 카드 (추가/삭제/순서) | `src/config/lobbyMenu.ts` (+ 새 페이지는 `src/routes.tsx`) |
| 로그인 역할 버튼 | `src/config/roles.ts` (폼 연결: `src/pages/login/loginForms.ts`) |
| 교수자 퀴즈 질문·선택지·문구 | `src/config/professorQuiz.ts` |
| 과목 / 과목 페이지 구역 | `src/config/subjects.ts` |
| 스터디룸 탭·뽀모도로 시간 | `src/config/studyroom.ts` |
| 게시판 카테고리 / 익명 표시 규칙 | `src/config/board.ts` / `src/services/boardVisibility.ts` |
| 고쳐주세요 유형·상태 | `src/config/feedback.ts` |
| 역할별 권한 (업로드, 상태 변경 등) | `src/config/permissions.ts` |
| 튜토리얼 내용 | `src/data/tutorial.data.ts` |
| 학생 명단 | 선생님 계정 → ☰ 메뉴 → 학생 등록 (처음 샘플: `src/data/students.mock.ts`, 저장: `src/services/rosterService.ts`) |
| 아이콘 추가 | `src/components/common/icons.ts` |

## 데이터 저장 (Supabase)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 가 있으면 Supabase 에 저장 (모든 기기 공유)
- 없으면 이 브라우저(localStorage)에만 저장 (개발·미리보기용, 샘플 데이터 포함)
- 설정 방법: [`supabase/README.md`](supabase/README.md) · DB 구조와 보안 규칙: [`supabase/schema.sql`](supabase/schema.sql)
- 화면은 `src/services/*` 만 호출하고, Supabase 구현은 `src/services/remote/*` 에 있습니다.
