-- ════════════════════════════════════════════════════════════════
--  국어 교실 — Supabase 데이터베이스 설정
--  Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여 넣고 [Run]
--  (여러 번 실행해도 안전하도록 작성되어 있습니다)
--
--  보안 원칙
--   · 선생님 = Supabase 로그인 계정 + teachers 표에 등록된 사람
--   · 학생   = 로그인 계정 없음(이름+학번). 학생 명단과 익명 글 작성자 실명은
--              학생 쪽(anon)에서 직접 읽을 수 없고, 정해진 함수로만 확인/조회
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────── 선생님 ───────────────
create table if not exists public.teachers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null
);
alter table public.teachers enable row level security;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.teachers where id = auth.uid()) $$;

drop policy if exists "teachers read own" on public.teachers;
create policy "teachers read own" on public.teachers
  for select to authenticated using (id = auth.uid());

-- 선생님 추가: Authentication → Users 에서 계정을 만든 뒤
--   select public.add_teacher('선생님이메일@학교.kr', '정국어');
create or replace function public.add_teacher(p_email text, p_name text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception '이메일 % 인 계정이 없어요. Authentication → Users 에서 먼저 만들어 주세요.', p_email;
  end if;
  insert into public.teachers (id, name) values (v_id, trim(p_name))
  on conflict (id) do update set name = excluded.name;
  return '등록 완료: ' || trim(p_name);
end $$;
revoke all on function public.add_teacher(text, text) from public, anon, authenticated;

-- ─────────────── 학생 명단 ───────────────
create table if not exists public.students (
  student_id text primary key check (student_id ~ '^[0-9]{4,10}$'),
  name text not null check (length(trim(name)) > 0),
  registered_at timestamptz not null default now(),
  registered_by text not null
);
alter table public.students enable row level security;

drop policy if exists "teachers manage students" on public.students;
create policy "teachers manage students" on public.students
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- 학생 로그인 확인: 이름(띄어쓰기 무시)과 학번이 모두 맞을 때만 한 줄 돌려줌
create or replace function public.student_login(p_name text, p_student_id text)
returns table (student_id text, name text)
language sql stable security definer set search_path = public
as $$
  select s.student_id, s.name
  from public.students s
  where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
    and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
$$;
grant execute on function public.student_login(text, text) to anon, authenticated;

-- ─────────────── 질의응답 게시판 ───────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('study', 'life', 'etc')),
  title text not null check (length(title) between 1 and 200),
  content text not null check (length(content) between 1 and 5000),
  author_id text not null,
  author_name text not null,
  author_role text not null check (author_role in ('student', 'teacher', 'professor')),
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  author_role text not null check (author_role in ('student', 'teacher', 'professor')),
  anonymous boolean not null default false,
  content text not null check (length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id);
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- 선생님: 실명 포함 전체 조회·관리
drop policy if exists "teachers manage posts" on public.posts;
create policy "teachers manage posts" on public.posts
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teachers manage comments" on public.comments;
create policy "teachers manage comments" on public.comments
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- 학생: 글·댓글 쓰기만 직접 허용 (선생님 이름으로는 못 씀)
drop policy if exists "students write posts" on public.posts;
create policy "students write posts" on public.posts
  for insert to anon with check (author_role in ('student', 'professor'));
drop policy if exists "students write comments" on public.comments;
create policy "students write comments" on public.comments
  for insert to anon with check (author_role in ('student', 'professor'));

-- 학생용 목록: 익명 글은 작성자 정보를 지우고, 본인 글 여부만 알려 줌
create or replace function public.list_posts(p_viewer text, p_category text default null)
returns table (
  id uuid, category text, title text, content text,
  author_id text, author_name text, author_role text, anonymous boolean,
  is_mine boolean, created_at timestamptz, comment_count bigint
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.category, p.title, p.content,
         case when p.anonymous then '' else p.author_id end,
         case when p.anonymous then '' else p.author_name end,
         case when p.anonymous then 'student' else p.author_role end,
         p.anonymous, p.author_id = p_viewer, p.created_at,
         (select count(*) from public.comments c where c.post_id = p.id)
  from public.posts p
  where p_category is null or p.category = p_category
  order by p.created_at desc
$$;

create or replace function public.get_post(p_id uuid, p_viewer text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'category', p.category, 'title', p.title, 'content', p.content,
    'author_id', case when p.anonymous then '' else p.author_id end,
    'author_name', case when p.anonymous then '' else p.author_name end,
    'author_role', case when p.anonymous then 'student' else p.author_role end,
    'anonymous', p.anonymous, 'is_mine', p.author_id = p_viewer, 'created_at', p.created_at,
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'author_id', case when c.anonymous then '' else c.author_id end,
        'author_name', case when c.anonymous then '' else c.author_name end,
        'author_role', case when c.anonymous then 'student' else c.author_role end,
        'anonymous', c.anonymous, 'is_mine', c.author_id = p_viewer,
        'content', c.content, 'created_at', c.created_at) order by c.created_at)
      from public.comments c where c.post_id = p.id), '[]'::jsonb))
  from public.posts p where p.id = p_id
$$;

-- 학생: 본인 글·댓글 삭제
create or replace function public.delete_own_post(p_id uuid, p_viewer text)
returns void language sql security definer set search_path = public
as $$ delete from public.posts where id = p_id and author_id = p_viewer $$;
create or replace function public.delete_own_comment(p_id uuid, p_viewer text)
returns void language sql security definer set search_path = public
as $$ delete from public.comments where id = p_id and author_id = p_viewer $$;

grant execute on function public.list_posts(text, text) to anon, authenticated;
grant execute on function public.get_post(uuid, text) to anon, authenticated;
grant execute on function public.delete_own_post(uuid, text) to anon, authenticated;
grant execute on function public.delete_own_comment(uuid, text) to anon, authenticated;

-- ─────────────── 스터디룸: 플래너 ───────────────
create table if not exists public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  text text not null check (length(text) between 1 and 300),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists planner_user_idx on public.planner_tasks (user_id, date);
alter table public.planner_tasks enable row level security;
drop policy if exists "everyone planner" on public.planner_tasks;
create policy "everyone planner" on public.planner_tasks
  for all to anon, authenticated using (true) with check (true);

-- ─────────────── 스터디룸: 공부 시간 ───────────────
create table if not exists public.study_records (
  user_id text not null,
  user_name text not null,
  date date not null,
  seconds integer not null default 0 check (seconds >= 0),
  primary key (user_id, date)
);
alter table public.study_records enable row level security;
drop policy if exists "everyone read study" on public.study_records;
create policy "everyone read study" on public.study_records
  for select to anon, authenticated using (true);

-- 타이머 시간 누적 (한 번에 최대 3시간까지만 더함)
create or replace function public.add_study_seconds(p_user_id text, p_user_name text, p_seconds integer, p_date date)
returns void language sql security definer set search_path = public
as $$
  insert into public.study_records (user_id, user_name, date, seconds)
  values (p_user_id, p_user_name, p_date, least(greatest(p_seconds, 0), 10800))
  on conflict (user_id, date) do update
    set seconds = public.study_records.seconds + least(greatest(excluded.seconds, 0), 10800),
        user_name = excluded.user_name
$$;
grant execute on function public.add_study_seconds(text, text, integer, date) to anon, authenticated;

-- ─────────────── 고쳐주세요 ───────────────
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'inconvenience', 'request')),
  title text not null check (length(title) between 1 and 200),
  content text not null check (length(content) between 1 and 5000),
  author_id text not null,
  author_name text not null,
  status text not null default 'received' check (status in ('received', 'checking', 'done')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "everyone read feedback" on public.feedback;
create policy "everyone read feedback" on public.feedback
  for select to anon, authenticated using (true);
drop policy if exists "everyone write feedback" on public.feedback;
create policy "everyone write feedback" on public.feedback
  for insert to anon, authenticated with check (status = 'received');
drop policy if exists "teachers update feedback" on public.feedback;
create policy "teachers update feedback" on public.feedback
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- ─────────────── 도서관 ───────────────
create table if not exists public.library_files (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null check (subject_id in ('literature', 'reading-writing', 'speech-language')),
  title text not null,
  description text,
  file_name text not null,
  file_type text not null,
  size bigint not null,
  storage_path text not null,
  uploader_name text not null,
  uploaded_at timestamptz not null default now()
);
alter table public.library_files enable row level security;
drop policy if exists "everyone read library" on public.library_files;
create policy "everyone read library" on public.library_files
  for select to anon, authenticated using (true);
drop policy if exists "teachers manage library" on public.library_files;
create policy "teachers manage library" on public.library_files
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- 파일 저장 공간(누구나 내려받기, 선생님만 올리기·지우기, 파일당 50MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('library', 'library', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "teachers upload library" on storage.objects;
create policy "teachers upload library" on storage.objects
  for insert to authenticated with check (bucket_id = 'library' and public.is_teacher());
drop policy if exists "teachers delete library" on storage.objects;
create policy "teachers delete library" on storage.objects
  for delete to authenticated using (bucket_id = 'library' and public.is_teacher());
drop policy if exists "teachers read library objects" on storage.objects;
create policy "teachers read library objects" on storage.objects
  for select to authenticated using (bucket_id = 'library' and public.is_teacher());

-- ─────────────── 선생님께 쪽지 (supabase/messages.sql 과 같은 내용) ───────────────
-- ════════════════════════════════════════════════════════════════
--  선생님께 쪽지 (schema.sql 을 이미 실행한 프로젝트에 추가로 실행)
--  KoreanEdu 쪽지와 같은 구조: 보낸 사람 · 받는 사람 · 내용 · 시각 · 읽음
--  · 학생: 로그인 계정이 없으므로 이름+학번이 명단과 맞을 때만 함수로 보내기·조회
--  · 선생님: 자기가 주고받은 쪽지만
--  · 알림 소리/푸시 없음 — 앱 안에서만 표시
-- ════════════════════════════════════════════════════════════════

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  sender_name text not null,
  receiver_id text not null,
  receiver_name text not null,
  content text not null check (length(content) between 1 and 5000),
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index if not exists dm_sender_idx on public.direct_messages (sender_id, created_at);
create index if not exists dm_receiver_idx on public.direct_messages (receiver_id, created_at);
alter table public.direct_messages enable row level security;

-- 선생님: 자기가 보낸·받은 쪽지
drop policy if exists "teachers read own dms" on public.direct_messages;
create policy "teachers read own dms" on public.direct_messages
  for select to authenticated using (
    public.is_teacher() and ('teacher:' || auth.uid()::text) in (sender_id, receiver_id)
  );
drop policy if exists "teachers send dms" on public.direct_messages;
create policy "teachers send dms" on public.direct_messages
  for insert to authenticated with check (
    public.is_teacher() and sender_id = 'teacher:' || auth.uid()::text and read = false
  );
drop policy if exists "teachers mark read" on public.direct_messages;
create policy "teachers mark read" on public.direct_messages
  for update to authenticated using (public.is_teacher() and receiver_id = 'teacher:' || auth.uid()::text)
  with check (public.is_teacher() and receiver_id = 'teacher:' || auth.uid()::text);
drop policy if exists "teachers delete own sent" on public.direct_messages;
create policy "teachers delete own sent" on public.direct_messages
  for delete to authenticated using (public.is_teacher() and sender_id = 'teacher:' || auth.uid()::text);

-- 학생이 고를 수 있는 선생님 목록 (이름만)
create or replace function public.list_teachers()
returns table (id text, name text)
language sql stable security definer set search_path = public
as $$ select 'teacher:' || t.id::text, t.name from public.teachers t order by t.name $$;

-- 학생 본인 확인 (이름 띄어쓰기 무시) → 맞으면 'student:학번'
create or replace function public.student_dm_id(p_student_id text, p_name text)
returns text
language sql stable security definer set search_path = public
as $$
  select 'student:' || s.student_id from public.students s
  where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
    and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
$$;

create or replace function public.student_dm_list(p_student_id text, p_name text)
returns setof public.direct_messages
language plpgsql stable security definer set search_path = public
as $$
declare v_me text := public.student_dm_id(p_student_id, p_name);
begin
  if v_me is null then return; end if;
  return query select * from public.direct_messages where v_me in (sender_id, receiver_id) order by created_at;
end $$;

-- 학생은 선생님에게만 보낼 수 있음
create or replace function public.student_dm_send(p_student_id text, p_name text, p_receiver text, p_content text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_me text := public.student_dm_id(p_student_id, p_name); v_my_name text; v_to_name text;
begin
  if v_me is null then raise exception '등록된 학생이 아니에요.'; end if;
  select name into v_my_name from public.students where 'student:' || student_id = v_me;
  select name into v_to_name from public.teachers where 'teacher:' || id::text = p_receiver;
  if v_to_name is null then raise exception '선생님께만 쪽지를 보낼 수 있어요.'; end if;
  insert into public.direct_messages (sender_id, sender_name, receiver_id, receiver_name, content)
  values (v_me, v_my_name, p_receiver, v_to_name, p_content);
end $$;

create or replace function public.student_dm_mark_read(p_student_id text, p_name text, p_partner text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_me text := public.student_dm_id(p_student_id, p_name);
begin
  if v_me is null then return; end if;
  update public.direct_messages set read = true where receiver_id = v_me and sender_id = p_partner and not read;
end $$;

create or replace function public.student_dm_delete(p_student_id text, p_name text, p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_me text := public.student_dm_id(p_student_id, p_name);
begin
  if v_me is null then return; end if;
  delete from public.direct_messages where id = p_id and sender_id = v_me;
end $$;

grant execute on function public.list_teachers() to anon, authenticated;
grant execute on function public.student_dm_list(text, text) to anon, authenticated;
grant execute on function public.student_dm_send(text, text, text, text) to anon, authenticated;
grant execute on function public.student_dm_mark_read(text, text, text) to anon, authenticated;
grant execute on function public.student_dm_delete(text, text, uuid) to anon, authenticated;
revoke all on function public.student_dm_id(text, text) from public, anon, authenticated;

-- ─────────────── DIY 구조도 (supabase/structure.sql 과 같은 내용) ───────────────
-- ════════════════════════════════════════════════════════════════
--  독서와 작문 › DIY 구조도 (schema.sql 을 이미 실행한 프로젝트에 추가로 실행)
--  · 지문·모범 구조도: 선생님만 추가·교체. 학생은 지문만 보고, 모범 구조도는 제출 후에만
--  · 학생 구조도: 학생 본인(이름+학번 확인 함수)과 선생님만
--  · 함께 보기 갤러리: 선생님이 공유한 것만 (이름 표시는 선택)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.reading_passages (
  id text primary key,
  title text not null,
  field text not null default '',
  paragraphs jsonb not null,
  questions jsonb not null default '[]'::jsonb,
  structure_type text,
  model_paragraph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  model_content jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.reading_passages enable row level security;
drop policy if exists "teachers manage passages" on public.reading_passages;
create policy "teachers manage passages" on public.reading_passages
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- 학생용 지문 목록 (모범 구조도 제외)
create or replace function public.list_passages_public()
returns table (id text, title text, field text, paragraphs jsonb, questions jsonb)
language sql stable security definer set search_path = public
as $$ select id, title, field, paragraphs, questions from public.reading_passages order by updated_at $$;
grant execute on function public.list_passages_public() to anon, authenticated;

create table if not exists public.structure_works (
  id uuid primary key default gen_random_uuid(),
  passage_id text not null,
  activity text not null check (activity in ('paragraph', 'content', 'notes')),
  student_id text not null references public.students (student_id) on delete cascade,
  student_name text not null,
  mode text not null default 'guided' check (mode in ('guided', 'free')),
  draft jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  notes jsonb, -- activity = 'notes' 일 때: 형광펜·생각 질문 답
  first_submission jsonb,
  first_at timestamptz,
  revised jsonb,
  revised_at timestamptz,
  teacher_comment text,
  comment_by text,
  shared boolean not null default false,
  share_name boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (passage_id, activity, student_id)
);
alter table public.structure_works enable row level security;
drop policy if exists "teachers read works" on public.structure_works;
create policy "teachers read works" on public.structure_works
  for select to authenticated using (public.is_teacher());
drop policy if exists "teachers comment works" on public.structure_works;
create policy "teachers comment works" on public.structure_works
  for update to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- 학생 본인 확인 → 학번 (명단에 없으면 null)
create or replace function public.verified_student_id(p_student_id text, p_name text)
returns text
language sql stable security definer set search_path = public
as $$
  select s.student_id from public.students s
  where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
    and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
$$;
revoke all on function public.verified_student_id(text, text) from public, anon, authenticated;

create or replace function public.student_structure_list(p_student_id text, p_name text, p_passage text)
returns setof public.structure_works
language plpgsql stable security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then return; end if;
  return query select * from public.structure_works where student_id = v_sid and passage_id = p_passage;
end $$;

-- 작업 중 저장 (구조도 초안 또는 형광펜·답)
create or replace function public.student_structure_save(
  p_student_id text, p_name text, p_passage text, p_activity text, p_mode text, p_draft jsonb, p_notes jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name); v_name text;
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  select name into v_name from public.students where student_id = v_sid;
  insert into public.structure_works (passage_id, activity, student_id, student_name, mode, draft, notes)
  values (p_passage, p_activity, v_sid, v_name, coalesce(p_mode, 'guided'), coalesce(p_draft, '{"nodes":[],"edges":[]}'::jsonb), p_notes)
  on conflict (passage_id, activity, student_id) do update
    set mode = excluded.mode, draft = excluded.draft, notes = coalesce(excluded.notes, public.structure_works.notes), updated_at = now();
end $$;

-- 제출: 처음이면 첫 버전, 이후는 수정 버전으로 저장
create or replace function public.student_structure_submit(p_student_id text, p_name text, p_passage text, p_activity text, p_diagram jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name); v_name text;
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  if p_activity not in ('paragraph', 'content') then raise exception '잘못된 활동이에요.'; end if;
  select name into v_name from public.students where student_id = v_sid;
  insert into public.structure_works (passage_id, activity, student_id, student_name, draft, first_submission, first_at)
  values (p_passage, p_activity, v_sid, v_name, p_diagram, p_diagram, now())
  on conflict (passage_id, activity, student_id) do update
    set draft = excluded.draft,
        first_submission = coalesce(public.structure_works.first_submission, excluded.first_submission),
        first_at = coalesce(public.structure_works.first_at, now()),
        revised = case when public.structure_works.first_submission is null then null else excluded.draft end,
        revised_at = case when public.structure_works.first_submission is null then null else now() end,
        updated_at = now();
end $$;

-- 모범 구조도: 제출한 학생에게만. 표에 없는 기본 지문이면 submitted 만 알려 줌(앱의 기본값 사용)
create or replace function public.student_structure_model(p_student_id text, p_name text, p_passage text, p_activity text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name); v_ok boolean; v_model jsonb; v_type text;
begin
  if v_sid is null then return null; end if;
  select first_submission is not null into v_ok from public.structure_works
  where student_id = v_sid and passage_id = p_passage and activity = p_activity;
  if not coalesce(v_ok, false) then return jsonb_build_object('submitted', false); end if;
  select case when p_activity = 'paragraph' then model_paragraph else model_content end, structure_type
    into v_model, v_type from public.reading_passages where id = p_passage;
  return jsonb_build_object('submitted', true, 'model', v_model, 'structure_type', v_type);
end $$;

-- 함께 보기 갤러리
create or replace function public.structure_gallery(p_passage text)
returns table (id uuid, activity text, student_name text, diagram jsonb, teacher_comment text)
language sql stable security definer set search_path = public
as $$
  select w.id, w.activity, case when w.share_name then w.student_name else null end,
         coalesce(w.revised, w.first_submission), w.teacher_comment
  from public.structure_works w
  where w.passage_id = p_passage and w.shared and w.first_submission is not null
  order by w.updated_at desc
$$;

grant execute on function public.student_structure_list(text, text, text) to anon, authenticated;
grant execute on function public.student_structure_save(text, text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.student_structure_submit(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_structure_model(text, text, text, text) to anon, authenticated;
grant execute on function public.structure_gallery(text) to anon, authenticated;

-- ─────────────── 개념 복습 강의 (supabase/lectures.sql 과 같은 내용) ───────────────
-- ════════════════════════════════════════════════════════════════
--  개념 복습 강의 (schema.sql 을 이미 실행한 프로젝트에 추가로 실행)
--  · 영상 정보: 누구나 보기, 선생님만 올리기·수정·삭제
--  · 조회 수: 숫자만 +1 (누가 봤는지는 저장하지 않음)
--  · 시청 기록·메모: 학생 본인만 (이름+학번 확인 함수). 선생님도 볼 수 있는 규칙을 만들지 않음
--  · 영상 파일: 저장 공간 'lectures' (파일당 50MB — Supabase 무료 요금제 한도)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null check (subject_id in ('literature', 'reading-writing', 'speech-language')),
  title text not null check (length(trim(title)) > 0),
  unit text not null,
  sort_order integer not null default 0,
  standards text[] not null default '{}',
  description text,
  storage_path text,
  link_url text,
  mime_type text,
  size bigint,
  duration_seconds integer,
  thumbnail_url text,
  uploaded_by_name text not null,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  check (storage_path is not null or link_url is not null)
);
alter table public.lectures enable row level security;
drop policy if exists "everyone read lectures" on public.lectures;
create policy "everyone read lectures" on public.lectures
  for select to anon, authenticated using (true);
drop policy if exists "teachers manage lectures" on public.lectures;
create policy "teachers manage lectures" on public.lectures
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

create or replace function public.lecture_add_view(p_id uuid)
returns void
language sql security definer set search_path = public
as $$ update public.lectures set views = views + 1 where id = p_id $$;
grant execute on function public.lecture_add_view(uuid) to anon, authenticated;

-- 학생 시청 기록 / 메모 — 정책(policy)이 없으므로 아래 함수로만 읽고 쓸 수 있음
create table if not exists public.lecture_progress (
  student_id text not null references public.students(student_id) on delete cascade,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  position_seconds real not null default 0,
  watched_seconds integer not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, lecture_id)
);
alter table public.lecture_progress enable row level security;

create table if not exists public.lecture_memos (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  position_seconds real not null default 0,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.lecture_memos enable row level security;
create index if not exists lecture_memos_owner on public.lecture_memos (student_id, lecture_id);

-- 학생 본인 확인 → 학번 (명단에 없으면 null) — structure.sql 과 같은 함수
create or replace function public.verified_student_id(p_student_id text, p_name text)
returns text
language sql stable security definer set search_path = public
as $$
  select s.student_id from public.students s
  where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
    and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
$$;
revoke all on function public.verified_student_id(text, text) from public, anon, authenticated;

create or replace function public.student_lecture_progress(p_student_id text, p_name text, p_subject text)
returns setof public.lecture_progress
language plpgsql stable security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then return; end if;
  return query select p.* from public.lecture_progress p join public.lectures l on l.id = p.lecture_id
    where p.student_id = v_sid and l.subject_id = p_subject;
end $$;

create or replace function public.student_lecture_progress_save(
  p_student_id text, p_name text, p_lecture uuid, p_position real, p_watched integer, p_completed boolean
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  insert into public.lecture_progress (student_id, lecture_id, position_seconds, watched_seconds, completed)
  values (v_sid, p_lecture, greatest(coalesce(p_position, 0), 0), greatest(coalesce(p_watched, 0), 0), coalesce(p_completed, false))
  on conflict (student_id, lecture_id) do update
    set position_seconds = excluded.position_seconds, watched_seconds = excluded.watched_seconds,
        completed = excluded.completed, updated_at = now();
end $$;

create or replace function public.student_lecture_memos(p_student_id text, p_name text, p_lecture uuid)
returns setof public.lecture_memos
language plpgsql stable security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then return; end if;
  return query select * from public.lecture_memos where student_id = v_sid and lecture_id = p_lecture order by position_seconds;
end $$;

create or replace function public.student_lecture_memo_add(p_student_id text, p_name text, p_lecture uuid, p_position real, p_body text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  insert into public.lecture_memos (student_id, lecture_id, position_seconds, body)
  values (v_sid, p_lecture, greatest(coalesce(p_position, 0), 0), p_body);
end $$;

create or replace function public.student_lecture_memo_update(p_student_id text, p_name text, p_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  update public.lecture_memos set body = p_body where id = p_id and student_id = v_sid;
end $$;

create or replace function public.student_lecture_memo_delete(p_student_id text, p_name text, p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  delete from public.lecture_memos where id = p_id and student_id = v_sid;
end $$;

grant execute on function public.student_lecture_progress(text, text, text) to anon, authenticated;
grant execute on function public.student_lecture_progress_save(text, text, uuid, real, integer, boolean) to anon, authenticated;
grant execute on function public.student_lecture_memos(text, text, uuid) to anon, authenticated;
grant execute on function public.student_lecture_memo_add(text, text, uuid, real, text) to anon, authenticated;
grant execute on function public.student_lecture_memo_update(text, text, uuid, text) to anon, authenticated;
grant execute on function public.student_lecture_memo_delete(text, text, uuid) to anon, authenticated;

-- 영상 저장 공간 (누구나 재생, 선생님만 올리기·지우기, 파일당 50MB, 영상만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lectures', 'lectures', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "teachers upload lectures" on storage.objects;
create policy "teachers upload lectures" on storage.objects
  for insert to authenticated with check (bucket_id = 'lectures' and public.is_teacher());
drop policy if exists "teachers delete lectures" on storage.objects;
create policy "teachers delete lectures" on storage.objects
  for delete to authenticated using (bucket_id = 'lectures' and public.is_teacher());
drop policy if exists "teachers read lecture objects" on storage.objects;
create policy "teachers read lecture objects" on storage.objects
  for select to authenticated using (bucket_id = 'lectures' and public.is_teacher());
