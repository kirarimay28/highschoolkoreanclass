import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import { TabBar } from '@/components/common/TabBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSubject, subjectSections, subjects } from '@/config/subjects';

/** 과목 페이지 — 지금은 기본 레이아웃 + "준비 중" 자리 */
export function SubjectPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const subject = getSubject(subjectId);
  if (!subject) return <Navigate to="/subjects" replace />;

  return (
    <div>
      <PageHeader title={subject.name} description={subject.description} backTo="/subjects" backLabel="과목 선택" />

      <TabBar
        items={subjects.map((s) => ({ id: s.id, label: s.name, icon: s.icon }))}
        value={subject.id}
        onChange={(id) => navigate(`/subjects/${id}`)}
        className="mb-6"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subjectSections.map((sec) => (
          <section key={sec.id} className="royal-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name={sec.icon} className="text-gold" />
                <h2 className="text-lg font-bold">{sec.title}</h2>
              </div>
              <Badge>준비 중</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{sec.description}</p>
            <div className="mt-4 rounded-xl border border-dashed border-gold/40 bg-hanji/60 px-4 py-6 text-center text-sm text-ink-faint">
              {subject.name} {sec.title} 콘텐츠가 곧 채워질 예정입니다.
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
