/**
 * 설계 의도 (교수자 계정에서만 보이는 두루마리 카드) — 문구는 이 파일 하나에서 고칩니다.
 * ─────────────────────────────────────────────
 *  · 키: 화면 id (아래 screenIds / routeNotes 참고)
 *  · 성취기준은 코드만 적고, 문장은 src/data/standards.ts 에서 가져옵니다.
 *  · 항목이 없는 화면은 카드가 뜨지 않습니다. 비어 있는 항목(purpose 등)은 카드에서 빠집니다.
 *
 * 화면 id 규칙
 *  · 로비 메달:  'lobby:<메뉴 id>'            (예: lobby:subjects)
 *  · 메뉴 화면:  '<메뉴 id>'                  (예: board, library)
 *  · 과목 기능:  '<과목 id>:<기능 id>'          (예: literature:timeline)
 *  · 기능 안 탭: '<과목 id>:<기능 id>:<탭 id>'  (예: literature:vocab:exam) — 지금은 문구 없음
 */
export interface DesignNote {
  /** 기능 이름 */
  title: string;
  /** 만든 목적 (어떤 문제를 해결하려고 만들었는지) */
  purpose?: string;
  /** 기대 효과 */
  effects?: string[];
  /** 연결 성취기준 코드 */
  standards?: string[];
  /** 성취기준을 코드 대신 문장으로 설명할 때 (예: 영상마다 다름) */
  standardsNote?: string;
  /** 과목 총괄 목표 중 해당 항목 */
  goal?: string;
  /** 이 기능이 성취기준을 구현하는 방식 */
  implementation?: string;
}

export const designNotes: Record<string, DesignNote> = {
  // ── 로비 ──
  'lobby:subjects': {
    title: '과목 선택',
    purpose: '2022 개정 교육과정 고2 일반 선택 과목(문학, 독서와 작문, 화법과 언어)별로 학습 공간을 분리해 과목의 정체성을 살림',
    effects: ['과목별 맞춤 활동', '수업 흐름과 일치하는 구조'],
  },
  'lobby:studyroom': {
    title: '온라인 스터디룸',
    purpose: '학생의 자기주도 학습 습관 형성. 계획(플래너)–실행(타이머)–점검(캘린더)의 순환 구조',
    effects: ['학습 시간 가시화로 동기 강화', '랭킹을 통한 건강한 경쟁', '날짜별 성찰'],
  },
  board: {
    title: '질의응답 게시판',
    purpose: '수업 중 질문하기 어려운 학생의 질문 장벽 낮추기. 학생 간에는 익명, 교사에게는 실명으로 보여 익명성과 생활지도를 함께 보장',
    effects: ['질문 참여 확대', '공부·생활·기타 분류로 교사의 응답 효율화'],
  },
  library: {
    title: '도서관',
    purpose: '수업 자료를 한곳에 모아 언제든 다시 볼 수 있게 함',
    effects: ['결석·복습 시 자료 접근성', '과목별 자료 체계화'],
  },
  messages: {
    title: '선생님께 쪽지',
    purpose: '시간 제약 없이 교사에게 연락하되, 푸시 알림 없이 쌓이는 구조로 교사의 근무 외 시간을 보호',
    effects: ['학생의 심리적 부담 감소', '교사의 업무–휴식 경계 유지', '미응답 쪽지 누락 방지'],
  },
  tutorial: {
    title: '튜토리얼',
    purpose: '디지털 도구 사용 격차를 줄여 모든 학생이 기능을 고르게 활용하게 함',
  },
  feedback: {
    title: '고쳐주세요',
    purpose: '사용자 피드백을 앱 개선에 반영하는 순환 구조. 학생을 수업 환경 설계의 참여자로 세움',
  },

  // ── 문학 ──
  'literature:timeline': {
    title: '한국 문학 연대기 지도',
    standards: ['12문학01-02', '12문학01-03', '12문학01-04', '12문학01-05'],
    goal: '(1) 문학의 본질과 가치, 한국 문학의 성격과 역사에 대해 체계적으로 이해한다.',
    implementation:
      '시대 × 갈래 2차원 지도로 갈래의 범위와 변화 양상(01-03)을, 시대별 사회·문화적 배경 카드로 문학과 역사의 상호 관계(01-04)를, 갈래 간 영향 관계 화살표로 갈래의 특성과 맥락(01-02)을, 같은 시기 외국 문학 비교 카드로 보편성과 특수성(01-05)을 탐구. 학생이 작품과 시대를 직접 연결해 쓰는 활동으로 수동적 암기가 아닌 능동적 탐구 유도',
  },
  'literature:vocab': {
    title: '고전 어휘',
    standards: ['12문학01-03', '12문학01-06'],
    implementation:
      '고전 작품 수용의 기초인 어휘를 작품·갈래·시대와 연결해 익히고, 단어에서 연대기 지도의 작품 맥락으로 바로 이동하게 하여 어휘 학습이 작품 이해로 이어지게 함. 연습(개인 점검)과 응시(교사 확인)를 분리해 부담 없는 반복 학습 보장',
  },

  // ── 독서와 작문 ──
  'reading-writing:diy': {
    title: 'DIY 구조도',
    standards: ['12독작01-03', '12독작01-05', '12독작01-13'],
    goal: '(2) 문어 의사소통의 원리와 실제를 고려하여 다양한 글과 자료를 읽고 쓰는 활동에 능동적으로 참여한다.',
    implementation:
      '문단 구조도로 글의 내용 조직 방법을 파악하고(01-05), 내용 구조도로 드러난 정보와 숨은 관계를 정리하며(01-03), 완성한 구조도를 학습을 위한 정리 자료로 활용(01-13). 도움 모드/자유 모드로 수준별 비계 제공, 제출 후 모범 구조도와 비교하며 스스로 수정하는 자기 점검 구조',
  },

  // ── 화법과 언어 ──
  'speech-language:debate': {
    title: '토론 반대신문 보드',
    standards: ['12화언01-11', '12화언01-12'],
    goal: '(2) 다양한 담화 자료를 바탕으로 … 음성 언어 의사소통에 능동적으로 참여한다.',
    implementation:
      '주장–이유–근거 카드 구조로 논증을 시각화하고, 반대 신문 시 타당성·신뢰성·공정성 중 검토 관점을 반드시 고르게 하여 성취기준의 비판적 검토 요소를 활동 규칙으로 직접 구현. 관점별 질문 통계로 토론 과정 성찰',
  },
  'speech-language:sentence-lab': {
    title: '문장 해부실',
    standards: ['12화언01-03', '12화언01-04'],
    implementation:
      '문장을 단어 블록으로 직접 분해하며 품사·문장 성분·문장 구조·단어 짜임을 분석(01-03, 01-04). 정답은 교사가 입력하고 학생이 손으로 분석하는 구조로, 자동 분석에 의존하지 않는 탐구 중심 문법 학습. 수업 모드의 익명 오답 분포로 교사가 오개념을 즉시 파악',
  },
  'speech-language:lectures': {
    title: '개념 복습 강의',
    standardsNote: '영상별로 교사가 지정한 성취기준을 그대로 표시',
    purpose: '수업 외 시간에 기본 개념을 스스로 복습. 출결·평가에 반영하지 않고 개인 시청 기록은 학생 본인에게만 보이게 하여 감시가 아닌 학습 도구로 설계',
  },
};

/** 주소 → 화면 id. 이 주소로 들어갈 때마다 카드가 뜸 (과목 기능은 /subject/<과목>/<기능> 이 자동으로 '<과목>:<기능>') */
export const routeNotes: Record<string, string> = {
  '/board': 'board',
  '/library': 'library',
  '/messages': 'messages',
  '/tutorial': 'tutorial',
  '/feedback': 'feedback',
};

export function noteIdForPath(pathname: string): string | undefined {
  if (routeNotes[pathname]) return routeNotes[pathname];
  const m = pathname.match(/^\/subject\/([^/]+)\/([^/]+)$/);
  return m ? `${m[1]}:${m[2]}` : undefined;
}

export const getDesignNote = (id: string | undefined): DesignNote | undefined => (id ? designNotes[id] : undefined);
