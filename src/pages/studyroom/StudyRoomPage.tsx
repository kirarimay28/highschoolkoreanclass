import { Navigate, useParams } from 'react-router-dom';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { getStudyroomTool, studyroomMedalLayoutId, type StudyroomToolId } from '@/config/studyroom';
import { CalendarPanel } from './CalendarPanel';
import { PlannerPanel } from './PlannerPanel';
import { RankingPanel } from './RankingPanel';
import { TimerPanel } from './TimerPanel';

const panels: Record<StudyroomToolId, () => JSX.Element> = {
  planner: PlannerPanel,
  timer: TimerPanel,
  ranking: RankingPanel,
  calendar: CalendarPanel,
};

/** 스터디룸 도구별 독립 페이지 (/studyroom/:toolId) */
export function StudyRoomPage() {
  const { toolId } = useParams();
  const tool = getStudyroomTool(toolId);
  if (!tool) return <Navigate to="/lobby?expand=studyroom" replace />;
  const Panel = panels[tool.id];

  return (
    <MedalPageHeader
      backTo="/lobby?expand=studyroom"
      backLabel="온라인 스터디룸"
      icon={tool.icon}
      title={tool.label}
      hanja={tool.hanja}
      description={tool.description}
      accent={tool.accent}
      layoutId={studyroomMedalLayoutId(tool.id)}
    >
      <Panel />
    </MedalPageHeader>
  );
}
