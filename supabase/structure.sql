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
