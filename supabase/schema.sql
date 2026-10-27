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
