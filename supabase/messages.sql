-- ════════════════════════════════════════════════════════════════
--  선생님께 쪽지 (schema.sql 을 이미 실행한 프로젝트에 추가로 실행)
--  · 학생: 로그인 계정이 없으므로 이름+학번이 명단과 맞을 때만 함수로 보내기·조회
--  · 선생님: 자기에게 온 쪽지만 조회·답장·상태 변경
--  · 알림 소리/푸시 없음 — 앱 안에서만 표시
-- ════════════════════════════════════════════════════════════════

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_student_id text not null references public.students (student_id) on delete cascade,
  sender_name text not null,
  recipient_id uuid not null references public.teachers (id) on delete cascade,
  category text not null check (category in ('class', 'assignment', 'counsel', 'etc')),
  title text not null check (length(title) between 1 and 200),
  body text not null check (length(body) between 1 and 5000),
  attachment jsonb,
  status text not null default 'sent' check (status in ('sent', 'read', 'replied', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_student_id, created_at desc);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  author_role text not null check (author_role in ('student', 'teacher')),
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists message_replies_msg_idx on public.message_replies (message_id, created_at);

alter table public.messages enable row level security;
alter table public.message_replies enable row level security;

-- 선생님: 자기에게 온 쪽지만
drop policy if exists "teachers read own messages" on public.messages;
create policy "teachers read own messages" on public.messages
  for select to authenticated using (recipient_id = auth.uid() and public.is_teacher());
drop policy if exists "teachers update own messages" on public.messages;
create policy "teachers update own messages" on public.messages
  for update to authenticated using (recipient_id = auth.uid() and public.is_teacher())
  with check (recipient_id = auth.uid() and public.is_teacher());

drop policy if exists "teachers read replies" on public.message_replies;
create policy "teachers read replies" on public.message_replies
  for select to authenticated using (
    exists (select 1 from public.messages m where m.id = message_id and m.recipient_id = auth.uid()) and public.is_teacher()
  );
drop policy if exists "teachers write replies" on public.message_replies;
create policy "teachers write replies" on public.message_replies
  for insert to authenticated with check (
    author_role = 'teacher' and author_id = 'teacher:' || auth.uid()::text
    and exists (select 1 from public.messages m where m.id = message_id and m.recipient_id = auth.uid())
    and public.is_teacher()
  );

-- 학생이 고를 수 있는 선생님 목록 (이름만)
create or replace function public.list_teachers()
returns table (id text, name text)
language sql stable security definer set search_path = public
as $$ select 'teacher:' || t.id::text, t.name from public.teachers t order by t.name $$;

-- 학생 본인 확인 (이름 띄어쓰기 무시)
create or replace function public.verify_student(p_student_id text, p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
      and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
  )
$$;

create or replace function public.student_send_message(
  p_student_id text, p_name text, p_recipient text, p_category text, p_title text, p_body text, p_attachment jsonb default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_name text;
begin
  if not public.verify_student(p_student_id, p_name) then raise exception '등록된 학생이 아니에요.'; end if;
  select name into v_name from public.students where student_id = regexp_replace(p_student_id, '\s', '', 'g');
  insert into public.messages (sender_student_id, sender_name, recipient_id, category, title, body, attachment)
  values (regexp_replace(p_student_id, '\s', '', 'g'), v_name, replace(p_recipient, 'teacher:', '')::uuid, p_category, p_title, p_body, p_attachment)
  returning id into v_id;
  return v_id;
end $$;

-- 학생: 내가 보낸 쪽지 + 답장 (대화)
create or replace function public.student_list_messages(p_student_id text, p_name text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.verify_student(p_student_id, p_name) then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', m.id, 'sender_student_id', m.sender_student_id, 'sender_name', m.sender_name,
      'recipient_id', 'teacher:' || m.recipient_id::text, 'recipient_name', t.name,
      'category', m.category, 'title', m.title, 'body', m.body, 'attachment', m.attachment,
      'status', m.status, 'created_at', m.created_at,
      'replies', coalesce((select jsonb_agg(jsonb_build_object(
          'id', r.id, 'author_id', r.author_id, 'author_name', r.author_name, 'author_role', r.author_role,
          'body', r.body, 'created_at', r.created_at) order by r.created_at)
        from public.message_replies r where r.message_id = m.id), '[]'::jsonb)
    ) order by m.created_at desc)
    from public.messages m join public.teachers t on t.id = m.recipient_id
    where m.sender_student_id = regexp_replace(p_student_id, '\s', '', 'g')
  ), '[]'::jsonb);
end $$;

-- 학생: 대화 이어 쓰기 → 다시 '새 쪽지' 상태로
create or replace function public.student_reply(p_student_id text, p_name text, p_message_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_name text;
begin
  if not public.verify_student(p_student_id, p_name) then raise exception '등록된 학생이 아니에요.'; end if;
  select sender_name into v_name from public.messages
  where id = p_message_id and sender_student_id = regexp_replace(p_student_id, '\s', '', 'g');
  if v_name is null then raise exception '쪽지를 찾을 수 없어요.'; end if;
  insert into public.message_replies (message_id, author_id, author_name, author_role, body)
  values (p_message_id, 'student:' || regexp_replace(p_student_id, '\s', '', 'g'), v_name, 'student', p_body);
  update public.messages set status = 'sent' where id = p_message_id;
end $$;

grant execute on function public.list_teachers() to anon, authenticated;
grant execute on function public.verify_student(text, text) to anon, authenticated;
grant execute on function public.student_send_message(text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_list_messages(text, text) to anon, authenticated;
grant execute on function public.student_reply(text, text, uuid, text) to anon, authenticated;

-- 첨부 파일 (비공개, 파일당 10MB): 학생은 올리기만, 선생님은 내려받기
insert into storage.buckets (id, name, public, file_size_limit)
values ('message-files', 'message-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "anyone upload message files" on storage.objects;
create policy "anyone upload message files" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'message-files');
drop policy if exists "teachers read message files" on storage.objects;
create policy "teachers read message files" on storage.objects
  for select to authenticated using (bucket_id = 'message-files' and public.is_teacher());
