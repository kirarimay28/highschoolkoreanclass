-- ════════════════════════════════════════════════════════════════
--  문학 › 고전 어휘 시험 기록 (schema.sql 을 이미 실행한 프로젝트에 추가로 실행)
--  · 시험(exam): 학생당 하루(한국 시간) 한 번. 선생님은 보기·지우기(지우면 다시 응시 가능)
--  · 연습(practice): 학생 본인만 (선생님도 볼 수 있는 규칙을 만들지 않음)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.vocab_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  student_name text not null,
  mode text not null check (mode in ('exam', 'practice')),
  format text not null check (format in ('단답형', '객관식')),
  exam_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  start_num integer not null,
  end_num integer not null,
  carryover_nums integer[] not null default '{}',
  score integer not null,
  total integer not null,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists vocab_one_exam_per_day on public.vocab_attempts (student_id, exam_date) where mode = 'exam';
alter table public.vocab_attempts enable row level security;
drop policy if exists "teachers read vocab exams" on public.vocab_attempts;
create policy "teachers read vocab exams" on public.vocab_attempts
  for select to authenticated using (mode = 'exam' and public.is_teacher());
drop policy if exists "teachers delete vocab exams" on public.vocab_attempts;
create policy "teachers delete vocab exams" on public.vocab_attempts
  for delete to authenticated using (mode = 'exam' and public.is_teacher());

-- 학생 본인 확인 → 학번 (structure.sql·lectures.sql 과 같은 함수)
create or replace function public.verified_student_id(p_student_id text, p_name text)
returns text
language sql stable security definer set search_path = public
as $$
  select s.student_id from public.students s
  where s.student_id = regexp_replace(coalesce(p_student_id, ''), '\s', '', 'g')
    and regexp_replace(s.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
$$;
revoke all on function public.verified_student_id(text, text) from public, anon, authenticated;

create or replace function public.student_vocab_attempts(p_student_id text, p_name text)
returns setof public.vocab_attempts
language plpgsql stable security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name);
begin
  if v_sid is null then return; end if;
  return query select * from public.vocab_attempts where student_id = v_sid order by created_at desc limit 200;
end $$;

create or replace function public.student_vocab_save(
  p_student_id text, p_name text, p_mode text, p_format text, p_start integer, p_end integer, p_carryover integer[], p_results jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_sid text := public.verified_student_id(p_student_id, p_name); v_name text;
begin
  if v_sid is null then raise exception '등록된 학생이 아니에요.'; end if;
  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) = 0 or jsonb_array_length(p_results) > 200 then
    raise exception '문항이 올바르지 않아요.';
  end if;
  select name into v_name from public.students where student_id = v_sid;
  insert into public.vocab_attempts (student_id, student_name, mode, format, start_num, end_num, carryover_nums, score, total, results)
  values (
    v_sid, v_name, p_mode, p_format, p_start, p_end, coalesce(p_carryover, '{}'),
    (select count(*) from jsonb_array_elements(p_results) e where (e->>'correct')::boolean),
    jsonb_array_length(p_results), p_results
  );
exception when unique_violation then
  raise exception '오늘 시험은 이미 봤어요.';
end $$;

grant execute on function public.student_vocab_attempts(text, text) to anon, authenticated;
grant execute on function public.student_vocab_save(text, text, text, text, integer, integer, integer[], jsonb) to anon, authenticated;
