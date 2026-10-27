import { useSearchParams } from 'react-router-dom';
import { TabBar } from '@/components/common/TabBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { studyroomTabs, type StudyroomTab } from '@/config/studyroom';
import { CalendarPanel } from './CalendarPanel';
import { PlannerPanel } from './PlannerPanel';
import { RankingPanel } from './RankingPanel';
import { TimerPanel } from './TimerPanel';

const panels: Record<StudyroomTab['id'], () => JSX.Element> = {
  planner: PlannerPanel,
  timer: TimerPanel,
  ranking: RankingPanel,
  calendar: CalendarPanel,
};

export function StudyRoomPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab = studyroomTabs.find((t) => t.id === tabParam)?.id ?? studyroomTabs[0].id;
  const Panel = panels[tab];

  return (
    <div>
      <PageHeader title="온라인 스터디룸" description="계획하고, 집중하고, 기록하며 스스로 성장해요." />
      <TabBar items={studyroomTabs} value={tab} onChange={(id) => setParams({ tab: id }, { replace: true })} className="mx-auto mb-6 max-w-2xl" />
      <div key={tab} className="animate-fade-up">
        <Panel />
      </div>
    </div>
  );
}
