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
