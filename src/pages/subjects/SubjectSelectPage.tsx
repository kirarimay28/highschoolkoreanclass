import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { subjects } from '@/config/subjects';

export function SubjectSelectPage() {
  return (
    <div>
      <PageHeader title="과목 선택" description="공부할 과목을 골라 주세요." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {subjects.map((s) => (
          <Link
            key={s.id}
            to={`/subjects/${s.id}`}
            className="royal-card group relative overflow-hidden p-6 text-center transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-glow"
          >
            <span className="pointer-events-none absolute -right-3 -top-4 font-serif text-7xl font-bold text-gold/10">
              {s.hanja}
            </span>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-royal text-gold-light">
              <Icon name={s.icon} size={28} />
            </span>
            <h2 className="mt-4 text-2xl font-bold group-hover:text-royal">{s.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
