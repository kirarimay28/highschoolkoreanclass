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
