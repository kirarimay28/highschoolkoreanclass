import { useAuth, type ProfessorView } from '@/context/AuthContext';
import { cn } from '@/utils/format';
import { Seal } from './DesignNotes';

const views: { id: ProfessorView; label: string }[] = [
  { id: 'student', label: '학생 화면으로 보기' },
  { id: 'teacher', label: '선생님 화면으로 보기' },
];

/** 교수자 헤더 띠: 시점 전환 + 체험 모드 안내 */
export function ProfessorBar() {
  const { professorView, setProfessorView } = useAuth();
  return (
    <div className="border-t border-gold/30 bg-[rgb(var(--color-hanji-card)/0.85)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-3 py-1.5 sm:px-4">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-ink-soft">
          <Seal size={18} />
          <span>
            <b className="text-royal">교수자 모드</b>
            <span className="hidden sm:inline"> · 실제 학생·선생님과 같은 화면이에요. 작성·수정·삭제한 내용은 실제로 남아요.</span>
          </span>
        </p>
        <div role="radiogroup" aria-label="보는 시점" className="flex rounded-full border border-gold/40 bg-white/70 p-0.5">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={professorView === v.id}
              onClick={() => setProfessorView(v.id)}
              className={cn(
                'min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors sm:text-[13px]',
                professorView === v.id ? 'bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button' : 'text-ink-soft hover:text-royal',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
