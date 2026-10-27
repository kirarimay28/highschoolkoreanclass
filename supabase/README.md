# Supabase 연결 방법

## 1. 프로젝트 만들기
1. https://supabase.com 가입 → **New project**
2. 이름: `highschoolkoreanclass`, 지역: **Northeast Asia (Seoul)**, DB 비밀번호는 아무거나(따로 보관)

## 2. 데이터베이스 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 폴더의 `schema.sql` 내용을 전부 붙여 넣고 **Run**

## 3. 선생님 계정 만들기
1. **Authentication → Users → Add user → Create new user**
   이메일·비밀번호 입력, **Auto Confirm User** 체크 → Create
2. **SQL Editor** 에서 실행 (이메일·이름만 바꾸기):
   ```sql
   select public.add_teacher('teacher@school.kr', '문서연');
   ```
3. (권장) **Authentication → Sign In / Providers** 에서 **Allow new users to sign up** 끄기

## 4. 앱에 연결
**Project Settings → API Keys** 에서
- Project URL (`https://xxxx.supabase.co`)
- `anon` `public` 키 (또는 Publishable key)

를 프로젝트 루트의 `.env.production` 에 넣습니다.
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```
이 두 값은 원래 브라우저에 공개되는 값이라 저장소에 올려도 됩니다. 데이터 보호는 `schema.sql` 의 보안 규칙(RLS)이 담당합니다.
`service_role` 키는 절대 넣지 마세요.

## 보안 요약
| 데이터 | 학생 | 선생님 |
|---|---|---|
| 학생 명단 | 조회 불가 (로그인 확인만) | 등록·삭제 |
| 익명 글 작성자 | 서버가 가려서 보냄 | 실명 보임 |
| 도서관 파일 | 내려받기 | 올리기·지우기 |
| 피드백 상태 | 보기 | 변경 |
| 개념 복습 강의 영상 | 보기 | 올리기·수정·삭제, 조회 수만 |
| 강의 시청 기록·메모 | 본인 것만 | 볼 수 없음 (규칙 자체가 없음) |
| 고전 어휘 시험 기록 | 본인 것만 | 전체 보기·지우기 |
| 고전 어휘 연습 기록 | 본인 것만 | 볼 수 없음 |

학생은 로그인 계정이 없으므로(이름+학번), 다른 학생의 이름과 학번을 아는 사람은 그 학생으로 로그인할 수 있습니다.
교수자(퀴즈 로그인)는 서버 계정이 없어 Supabase 사용 중에는 관리 기능이 꺼집니다.

## 추가 기능 SQL
이미 `schema.sql` 을 실행한 프로젝트는 새 기능이 생길 때 해당 파일만 추가로 실행하면 됩니다. (여러 번 실행해도 안전)
- `messages.sql` — 선생님께 쪽지
- `structure.sql` — 독서와 작문 › DIY 구조도
- `lectures.sql` — 개념 복습 강의 (영상 저장 공간 `lectures`, 파일당 50MB)
- `vocab.sql` — 문학 › 고전 어휘 시험 기록
