import { Navigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { getSubject, subjectMedalLayoutId } from '@/config/subjects';

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subject.sections.map((sec) => (
          <section key={sec.id} className="royal-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--page-accent)/0.08)] text-[rgb(var(--page-accent))] ring-1 ring-inset ring-[rgb(var(--page-accent)/0.15)]">
                  <Icon name={sec.icon} size={20} />
                </span>
                <h2 className="text-lg font-bold">{sec.title}</h2>
              </div>
              <Badge className="border-[rgb(var(--page-gold)/0.4)] bg-[rgb(var(--page-gold)/0.1)] text-[rgb(var(--page-accent))]">준비 중</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{sec.description}</p>
            <div className="mt-4 rounded-2xl border border-dashed border-[rgb(var(--page-gold)/0.4)] bg-white/40 px-4 py-6 text-center text-sm text-ink-faint">
              {subject.name} {sec.title} 콘텐츠가 곧 채워질 예정입니다.
            </div>
          </section>
        ))}
      </div>
    </MedalPageHeader>
  );
}
