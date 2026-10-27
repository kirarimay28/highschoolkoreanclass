import type { IconName } from '@/components/common/icons';
import type { PageAccent } from '@/utils/accent';

export type StudyroomToolId = 'planner' | 'timer' | 'ranking' | 'calendar';

export interface StudyroomTool {
  id: StudyroomToolId;
  label: string;
  hanja: string;
  description: string;
  icon: IconName;
  /** 도구마다 홍·금 톤 안에서 살짝 다른 포인트 색 ("R G B") */
  accent: PageAccent;
}

/**
 * 스터디룸 도구 — 로비에서 "온라인 스터디룸"을 누르면 이 순서로 펼쳐지고,
 * 각각 /studyroom/:id 독립 페이지로 들어갑니다.
 */
export const studyroomTools: StudyroomTool[] = [
  {
    id: 'planner',
    label: '플래너',
    hanja: '計劃',
    description: '날짜별로 할 일을 적고 하나씩 지워 나가요',
    icon: 'todo',
    // 황토빛 — 종이에 적어 내려가는 느낌
    accent: { accent: '146 72 30', gold: '196 150 50', tint: '210 150 90' },
  },
  {
    id: 'timer',
    label: '타이머',
    hanja: '時間',
    description: '스톱워치·뽀모도로로 집중하고 시간을 기록해요',
    icon: 'timer',
    // 대홍 — 집중
    accent: { accent: '139 26 26', gold: '201 162 39', tint: '190 70 70' },
  },
  {
    id: 'ranking',
    label: '랭킹',
    hanja: '順位',
    description: '오늘·이번 주 공부 시간 순위를 확인해요',
    icon: 'trophy',
    // 짙은 금 — 시상대
    accent: { accent: '150 104 18', gold: '214 172 52', tint: '222 186 90' },
  },
  {
    id: 'calendar',
    label: '캘린더',
    hanja: '日曆',
    description: '날짜를 눌러 그날의 공부 시간과 한 일을 봐요',
    icon: 'calendar',
    // 자주 — 차분한 기록
    accent: { accent: '124 40 74', gold: '190 150 60', tint: '180 110 140' },
  },
];

export const studyroomPath = (id: StudyroomToolId) => `/studyroom/${id}`;
export const studyroomMedalLayoutId = (id: StudyroomToolId) => `studyroom-medal-${id}`;
export const getStudyroomTool = (id: string | undefined) => studyroomTools.find((t) => t.id === id);

/** 뽀모도로 기본값(분) */
export const pomodoroConfig = {
  focusMinutes: 25,
  breakMinutes: 5,
  presets: [15, 25, 50],
};

export const rankingPeriods = [
  { id: 'daily', label: '오늘' },
  { id: 'weekly', label: '이번 주' },
] as const;

export type RankingPeriod = (typeof rankingPeriods)[number]['id'];
