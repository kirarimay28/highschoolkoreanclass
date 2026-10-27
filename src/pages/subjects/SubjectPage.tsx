import { Link, Navigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { getSubject, subjectMedalLayoutId, type SubjectConfig, type SubjectSection } from '@/config/subjects';
import { cn } from '@/utils/format';
import { SectionPreview } from './SectionPreviews';

/** 과목별 독립 페이지 — 그 과목 내용만 보임. 메뉴는 config/subjects.ts 의 sections */
export function SubjectPage() {
  const { subjectId } = useParams();
  const subject = getSubject(subjectId);
  if (!subject) return <Navigate to="/lobby?expand=subjects" replace />;

  return (
    <MedalPageHeader
      backTo="/lobby?expand=subjects"
      backLabel="과목 선택"
      icon={subject.icon}
      title={subject.name}
      hanja={subject.hanja}
      description={subject.description}
      accent={subject.accent}
      layoutId={subjectMedalLayoutId(subject.id)}
    >
      {/* 카드가 늘어나면 아래로 줄이 늘어남 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subject.sections.map((sec) => (
          <SectionCard key={sec.id} subject={subject} section={sec} />
        ))}
      </div>
    </MedalPageHeader>
  );
}

/** status 에 따라 '바로 가기'(기능 있음) / '준비 중' 카드를 같은 틀로 그림 */
function SectionCard({ subject, section: sec }: { subject: SubjectConfig; section: SubjectSection }) {
  const ready = sec.status === 'ready' && !!sec.path;
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--page-accent)/0.08)] text-[rgb(var(--page-accent))] ring-1 ring-inset ring-[rgb(var(--page-accent)/0.15)]">
            <Icon name={sec.icon} size={20} />
          </span>
          <h2 className={cn('break-keep text-[17px] font-bold leading-snug sm:text-lg', ready && 'transition-colors group-hover:text-[rgb(var(--page-accent))]')}>{sec.title}</h2>
        </div>
        {ready ? (
          <Badge className="shrink-0 gap-0.5 border-gold/60 bg-gradient-to-b from-gold-light/60 to-gold/30 font-semibold text-gold-dark">
            바로 가기 <Icon name="back" size={12} className="rotate-180" />
          </Badge>
        ) : (
          <Badge className="shrink-0 border-[rgb(var(--page-gold)/0.4)] bg-[rgb(var(--page-gold)/0.1)] text-[rgb(var(--page-accent))]">준비 중</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">{sec.description}</p>
      {ready && sec.preview ? (
        <div className="mt-4 h-24 rounded-2xl border border-[rgb(var(--page-gold)/0.35)] bg-white/50 px-3 py-2 transition-colors group-hover:border-[rgb(var(--page-gold)/0.7)]">
          <SectionPreview id={sec.preview} />
        </div>
      ) : (
        <div className="mt-4 flex h-24 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--page-gold)/0.4)] bg-white/40 px-4 text-center text-sm text-ink-faint">
          {subject.name} {sec.title} 콘텐츠가 곧 채워질 예정입니다.
        </div>
      )}
    </>
  );

  return ready ? (
    <Link
      to={`/subject/${subject.id}/${sec.path}`}
      className="royal-card group block p-5 outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-glow hover:ring-2 hover:ring-[rgb(var(--page-gold)/0.6)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--page-gold))]"
    >
      {body}
    </Link>
  ) : (
    <section className="royal-card p-5">{body}</section>
  );
}
