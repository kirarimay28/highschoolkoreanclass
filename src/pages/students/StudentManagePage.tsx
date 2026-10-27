import { useMemo, useState, type FormEvent } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { can } from '@/config/permissions';
import { useCurrentUser } from '@/context/AuthContext';
import { describeStudentId, listStudents, registerStudent, registerStudentsBulk, removeStudent } from '@/services/rosterService';
import { formatDateTime } from '@/utils/date';
import { useAsyncData } from '@/utils/useAsyncData';

/** 선생님용: 앱을 쓸 학생 등록·삭제 */
export function StudentManagePage() {
  const user = useCurrentUser();
  const { data: students, reload } = useAsyncData(listStudents, [], []);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    return q ? students.filter((s) => s.name.includes(q) || s.studentId.includes(q)) : students;
  }, [students, query]);

  if (!can(user.role, 'manageStudents')) {
    return (
      <div>
        <PageHeader title="학생 등록" />
        <EmptyState icon="users" title="선생님만 이용할 수 있어요" />
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const s = await registerStudent(user, { name, studentId });
      setMessage({ type: 'ok', text: `${s.name}(${s.studentId}) 학생을 등록했어요.` });
      setName('');
      setStudentId('');
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
  };

  const submitBulk = async () => {
    const { added, skipped } = await registerStudentsBulk(user, bulkText);
    const lines = [`${added.length}명을 등록했어요.`];
    if (skipped.length) lines.push(`등록하지 못한 줄 ${skipped.length}개: ${skipped.map((s) => `"${s.line}" (${s.reason})`).join(', ')}`);
    setMessage({ type: skipped.length && !added.length ? 'error' : 'ok', text: lines.join(' ') });
    if (added.length) setBulkText(skipped.map((s) => s.line).join('\n'));
    reload();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="학생 등록" description="여기에 등록된 학생만 이름과 학번으로 로그인할 수 있어요." />

      <section className="royal-card p-5 sm:p-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="royal-label" htmlFor="regName">이름</label>
            <input id="regName" className="royal-input" placeholder="예: 김하늘" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="royal-label" htmlFor="regId">학번</label>
            <input
              id="regId"
              className="royal-input"
              inputMode="numeric"
              placeholder="예: 20301"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          <RoyalButton type="submit" icon="userPlus" className="h-[46px]">
            등록
          </RoyalButton>
        </form>

        <button
          type="button"
          onClick={() => setBulkOpen((v) => !v)}
          className="mt-4 text-sm font-medium text-indigo hover:underline"
          aria-expanded={bulkOpen}
        >
          {bulkOpen ? '여러 명 한 번에 등록 닫기' : '여러 명 한 번에 등록하기'}
        </button>
        {bulkOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-ink-soft">
              한 줄에 한 명씩 <b>이름 학번</b>을 적어 주세요. 엑셀에서 이름·학번 두 칸을 복사해 붙여 넣어도 돼요.
            </p>
            <textarea
              id="regBulk"
              rows={6}
              className="royal-input resize-y font-mono text-sm"
              placeholder={'김하늘 20301\n문서연 20302\n박지후 20303'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="flex justify-end">
              <RoyalButton variant="secondary" icon="userPlus" disabled={!bulkText.trim()} onClick={submitBulk}>
                한 번에 등록
              </RoyalButton>
            </div>
          </div>
        )}

        {message && (
          <p className={`mt-4 rounded-2xl px-4 py-2.5 text-sm ${message.type === 'ok' ? 'bg-success/10 text-success' : 'bg-royal/[0.07] text-royal'}`} role="status">
            {message.text}
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            등록된 학생 <span className="text-gold-dark">{students.length}명</span>
          </h2>
          <label className="relative w-full sm:w-60">
            <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="royal-input pl-10" placeholder="이름·학번 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="학생 검색" />
          </label>
        </div>

        <ul className="royal-card divide-y divide-gold/15 overflow-hidden">
          {filtered.map((s) => (
            <li key={s.studentId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="w-16 shrink-0 font-mono text-sm tabular-nums text-ink-soft">{s.studentId}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="truncate text-xs text-ink-faint">
                  {[describeStudentId(s.studentId), `${s.registeredBy} 등록`, formatDateTime(s.registeredAt)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <RoyalButton
                size="sm"
                variant="ghost"
                icon="trash"
                aria-label={`${s.name} 삭제`}
                onClick={async () => {
                  if (!confirm(`${s.name}(${s.studentId}) 학생을 명단에서 지울까요? 지우면 이 학생은 로그인할 수 없어요.`)) return;
                  await removeStudent(s.studentId);
                  setMessage({ type: 'ok', text: `${s.name} 학생을 명단에서 지웠어요.` });
                  reload();
                }}
              />
            </li>
          ))}
          {filtered.length === 0 && (
            <li>
              <EmptyState icon="users" title={students.length ? '검색 결과가 없어요' : '아직 등록된 학생이 없어요'} />
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
