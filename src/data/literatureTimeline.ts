/**
 * 한국 문학 연대기 지도 — 데이터는 이 파일 하나에서 관리합니다.
 * ─────────────────────────────────────────────
 *  · eras        시대(가로축) 순서·배경 카드
 *  · events      타임라인 위 역사 사건 깃발
 *  · lanes       갈래 레인(세로축): 순서·색·단계 라벨·작품·상세 카드
 *  · externals   지도 밖 외부 노드 (예: 중국 전기 문학)
 *  · influences  영향 관계 화살표 (추가·삭제는 이 배열만 고치면 됨)
 * 색은 "R G B" 형식입니다.
 */

export type MapId = 'poetry' | 'narrative';
export type EraId = 'ancient' | 'unified-silla' | 'goryeo-early' | 'goryeo-late' | 'joseon-early' | 'joseon-late';

export interface Era {
  id: EraId;
  name: string;
  sub?: string;
  /** 시대명을 누르면 보이는 사회·문화적 배경 */
  background: { summary: string; points: string[] };
}

export interface HistoryEvent {
  era: EraId;
  label: string;
  year: string; // 화면 표시용 (예: "B.C.2333", "1592~1598")
}

export interface Stage {
  from: EraId;
  to: EraId;
  label: string;
}

export interface Work {
  title: string;
  author?: string;
  era: EraId;
  note?: string;
}

export interface Lane {
  id: string;
  map: MapId;
  name: string;
  color: string;
  /** true 면 전 시대에 걸친 '토대' 띠 (옅게 표시) */
  foundation?: boolean;
  /** 레인 위 발전 단계 라벨. 첫 단계 시작 ~ 마지막 단계 끝까지 띠가 그려짐 */
  stages: Stage[];
  works: Work[];
  detail: {
    definition: string;
    changes: { era: EraId; text: string }[];
    standards: string[];
    /** 설화 레인: 신화·전설·민담 비교표 */
    comparison?: { headers: string[]; rows: { label: string; cells: string[] }[] };
    /** 소설 레인: 조선 후기 소설 유형 칩 */
    typeChips?: { label: string; examples: string }[];
  };
}

export interface ExternalNode {
  id: string;
  map: MapId;
  era: EraId;
  label: string;
}

export interface InfluenceEnd {
  lane?: string; // 갈래 레인 id
  external?: string; // 외부 노드 id
  era: EraId;
}

export interface Influence {
  id: string;
  map: MapId;
  from: InfluenceEnd;
  to: InfluenceEnd;
  label: string;
  description: string;
}

/** 성취기준 원문 — 코드별로 채워 넣으면 상세 카드에 함께 표시됩니다 */
export const standardTexts: Record<string, string> = {
  '12문학01-02': '',
  '12문학01-03': '',
  '12문학01-04': '',
};

const STANDARDS = ['12문학01-02', '12문학01-03', '12문학01-04'];

// ───────────────────────── 시대 ─────────────────────────
export const eras: Era[] = [
  {
    id: 'ancient',
    name: '고대',
    sub: '고조선~삼국',
    background: {
      summary: '제천 의식과 집단 가무 속에서 노래와 이야기가 함께 불리던 시기',
      points: ['구비 전승 중심', '건국 신화와 집단 가요의 형성', '삼국 시대 한자 수용과 국가 체제 정비'],
    },
  },
  {
    id: 'unified-silla',
    name: '통일 신라',
    background: {
      summary: '국학 설치와 불교문화 속에서 향가와 한문학이 꽃핀 시기',
      points: ['국학 설치(682)로 유학·한문 교육 확대', '향가집 《삼대목》 편찬(888)', '6두품 지식인의 한문학 발달'],
    },
  },
  {
    id: 'goryeo-early',
    name: '고려 전기',
    background: {
      summary: '문벌 귀족 중심',
      points: ['과거제 실시(958)와 국자감 → 한시의 발전', '문벌 귀족이 문학의 주된 담당층'],
    },
  },
  {
    id: 'goryeo-late',
    name: '고려 후기',
    background: {
      summary: '무신 정권 → 권문세족 → 신진 사대부의 등장',
      points: ['무신정변(1170) 이후 문신들의 패관 문학·가전체', '신진 사대부가 경기체가·시조의 담당층으로 성장'],
    },
  },
  {
    id: 'joseon-early',
    name: '조선 전기',
    background: {
      summary: '관인 문학 / 사림 문학 / 방외인 문학의 공존',
      points: ['훈구파(관인): 사장 중시, 당·송의 고문 모범', '사림파: 도학 중시, 자연 속 수양의 태도', '방외인: 김시습, 정희량, 남효온 등', '훈민정음 창제(1443) → 국문 문학 기록'],
    },
  },
  {
    id: 'joseon-late',
    name: '조선 후기',
    background: {
      summary: '근대성 · 사실성 · 산문화',
      points: [
        '양난 이후 민중이 문학 담당층으로 성장',
        '지배층의 무능과 유교 이념(충·효·열)에 대한 비판 → 신분제 동요',
        '상공업 발달로 물질적·경제적 가치 중시',
      ],
    },
  },
];

// ───────────────────────── 역사 사건 ─────────────────────────
export const events: HistoryEvent[] = [
  { era: 'ancient', label: '고조선 건국', year: 'B.C.2333' },
  { era: 'ancient', label: '신라 건국', year: 'B.C.57' },
  { era: 'ancient', label: '고구려 건국', year: 'B.C.37' },
  { era: 'ancient', label: '백제 건국', year: 'B.C.18' },
  { era: 'unified-silla', label: '삼국 통일', year: '676' },
  { era: 'unified-silla', label: '국학 설치', year: '682' },
  { era: 'unified-silla', label: '삼대목 편찬', year: '888' },
  { era: 'goryeo-early', label: '고려 건국', year: '918' },
  { era: 'goryeo-early', label: '과거제 실시', year: '958' },
  { era: 'goryeo-late', label: '무신정변', year: '1170' },
  { era: 'goryeo-late', label: '몽골 침입', year: '1231' },
  { era: 'goryeo-late', label: '위화도 회군', year: '1388' },
  { era: 'joseon-early', label: '조선 건국', year: '1392' },
  { era: 'joseon-early', label: '훈민정음 창제', year: '1443' },
  { era: 'joseon-late', label: '임진왜란', year: '1592~1598' },
  { era: 'joseon-late', label: '병자호란', year: '1636' },
  { era: 'joseon-late', label: '고종 즉위', year: '1863' },
  { era: 'joseon-late', label: '강화도 조약', year: '1876' },
  { era: 'joseon-late', label: '갑오개혁', year: '1894' },
];

// ───────────────────────── 갈래 레인 ─────────────────────────
export const lanes: Lane[] = [
  // ── 고전 시가 ──
  {
    id: 'ancient-song',
    map: 'poetry',
    name: '고대 가요',
    color: '150 104 18',
    stages: [{ from: 'ancient', to: 'ancient', label: '집단 가요 → 개인 서정' }],
    works: [
      { title: '구지가', era: 'ancient', note: '가락국 건국 신화 속 집단 노동요·주술요' },
      { title: '황조가', author: '유리왕', era: 'ancient', note: '현전 최고(最古)의 개인 서정 가요' },
    ],
    detail: {
      definition: '향가 이전, 고대 국가 형성기의 노래. 원시 종합 예술에서 분화되어 집단 가요에서 개인 서정 가요로 나아감.',
      changes: [{ era: 'ancient', text: '제천 의식의 집단 가요 → 개인적 서정을 담은 노래로 변화. 한역(漢譯)되어 전함' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'hyangga',
    map: 'poetry',
    name: '향가',
    color: '163 38 64',
    stages: [
      { from: 'ancient', to: 'ancient', label: '4구체' },
      { from: 'unified-silla', to: 'unified-silla', label: '8구체 · 10구체' },
      { from: 'goryeo-early', to: 'goryeo-early', label: '10구체 (균여)' },
    ],
    works: [
      { title: '서동요', era: 'ancient', note: '4구체 — 민요적 성격' },
      { title: '처용가', era: 'unified-silla', note: '8구체' },
      { title: '제망매가', author: '월명사', era: 'unified-silla', note: '10구체 — 향가의 완성형' },
      { title: '보현시원가', author: '균여', era: 'goryeo-early', note: '고려 초 11수' },
    ],
    detail: {
      definition: '향찰로 표기한 신라의 노래. 4구체 → 8구체 → 10구체로 형식이 발전하였고, 10구체의 낙구 감탄사는 시조 종장에 영향을 줌.',
      changes: [
        { era: 'ancient', text: '4구체 — 민요가 정착한 형태' },
        { era: 'unified-silla', text: '8구체·10구체로 발전, 《삼대목》 편찬(888)' },
        { era: 'goryeo-early', text: '균여의 〈보현시원가〉를 끝으로 쇠퇴' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'hansi',
    map: 'poetry',
    name: '한시',
    color: '44 74 110',
    stages: [
      { from: 'ancient', to: 'unified-silla', label: '국가 체제 정비 · 한자 보급' },
      { from: 'goryeo-early', to: 'goryeo-late', label: '과거제·국자감 → 한시의 발전' },
      { from: 'joseon-early', to: 'joseon-early', label: '성리학 대두로 발전' },
      { from: 'joseon-late', to: 'joseon-late', label: '서정 한시 → 서사 한시' },
    ],
    works: [
      { title: '여수장우중문시', author: '을지문덕', era: 'ancient' },
      { title: '추야우중', author: '최치원', era: 'unified-silla' },
      { title: '송인', author: '정지상', era: 'goryeo-early' },
      { title: '애절양', author: '정약용', era: 'joseon-late', note: '현실을 고발한 서사 한시' },
    ],
    detail: {
      definition: '한자로 지은 정형시. 오랫동안 지배층 문학의 중심이었으며, 조선 후기에는 실학사상의 영향으로 소재가 다양해지고 현실을 서사적으로 그린 서사 한시가 나타남.',
      changes: [
        { era: 'unified-silla', text: '국학 설치, 6두품 지식인의 한문학 기반' },
        { era: 'goryeo-early', text: '과거제·국자감으로 한시 창작 활발' },
        { era: 'joseon-early', text: '성리학 대두와 함께 발전' },
        { era: 'joseon-late', text: '실학사상의 발달 → 소재 다양화, 서사 한시 등장' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'goryeo-gayo',
    map: 'poetry',
    name: '고려 가요',
    color: '46 125 104',
    stages: [
      { from: 'goryeo-early', to: 'goryeo-early', label: '민요 기원' },
      { from: 'goryeo-late', to: 'goryeo-late', label: '궁중 음악화' },
      { from: 'joseon-early', to: 'joseon-early', label: '한글 창제 후 기록' },
    ],
    works: [
      { title: '가시리', era: 'goryeo-early', note: '이별의 정한' },
      { title: '청산별곡', era: 'goryeo-late', note: '분절체, 후렴구' },
      { title: '서경별곡', era: 'goryeo-late' },
      { title: '《악학궤범》·《악장가사》', era: 'joseon-early', note: '고려 가요를 한글로 기록한 문헌' },
    ],
    detail: {
      definition: '고려 시대 평민들이 부르던 노래(속요). 민요에서 비롯되어 궁중 음악으로 쓰였고, 훈민정음 창제 후 조선 시대 문헌에 기록되어 전함.',
      changes: [
        { era: 'goryeo-early', text: '민요에서 기원' },
        { era: 'goryeo-late', text: '궁중 속악으로 수용되며 후렴구 등이 덧붙음' },
        { era: 'joseon-early', text: '《악학궤범》《악장가사》《시용향악보》에 한글로 기록' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'gyeonggi',
    map: 'poetry',
    name: '경기체가',
    color: '128 60 110',
    stages: [
      { from: 'goryeo-late', to: 'goryeo-late', label: '신진 사대부의 노래' },
      { from: 'joseon-early', to: 'joseon-early', label: '조선 초 계승 → 소멸' },
    ],
    works: [
      { title: '한림별곡', author: '한림제유', era: 'goryeo-late', note: '최초의 경기체가' },
      { title: '상대별곡', author: '권근', era: 'joseon-early' },
    ],
    detail: {
      definition: '"경(景) 긔 엇더하니잇고"라는 후렴을 가진 노래. 고려 후기 신진 사대부가 자신들의 생활과 자부심을 노래함.',
      changes: [
        { era: 'goryeo-late', text: '신진 사대부의 등장과 함께 발생' },
        { era: 'joseon-early', text: '조선 초 사대부가 계승했으나 점차 소멸' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'akjang',
    map: 'poetry',
    name: '악장',
    color: '178 62 34',
    stages: [{ from: 'joseon-early', to: 'joseon-early', label: '조선 건국 송축' }],
    works: [
      { title: '용비어천가', era: 'joseon-early', note: '훈민정음으로 지은 최초의 작품' },
      { title: '월인천강지곡', author: '세종', era: 'joseon-early' },
    ],
    detail: {
      definition: '궁중의 제례·연향에 쓰인 노래 가사. 조선 초 왕조의 창업을 찬양하고 번영을 기원함.',
      changes: [{ era: 'joseon-early', text: '조선 건국 직후 집중 창작, 이후 소멸' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'eonhae',
    map: 'poetry',
    name: '언해',
    color: '92 86 78',
    stages: [{ from: 'joseon-early', to: 'joseon-early', label: '훈민정음 창제 후 번역' }],
    works: [{ title: '두시언해', era: 'joseon-early', note: '두보의 시를 우리말로 옮김 (1481)' }],
    detail: {
      definition: '한문으로 된 글을 훈민정음으로 풀이하여 옮긴 것. 국어사 자료로서도 가치가 큼.',
      changes: [{ era: 'joseon-early', text: '훈민정음 창제 이후 불경·유교 경전·시문 언해 활발' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'sijo',
    map: 'poetry',
    name: '시조',
    color: '139 26 26',
    stages: [
      { from: 'goryeo-late', to: 'goryeo-late', label: '평시조 형성' },
      { from: 'joseon-early', to: 'joseon-early', label: '평시조 · 연시조' },
      { from: 'joseon-late', to: 'joseon-late', label: '사설시조' },
    ],
    works: [
      { title: '탄로가', author: '우탁', era: 'goryeo-late' },
      { title: '도산십이곡', author: '이황', era: 'joseon-early', note: '연시조' },
      { title: '두꺼비 파리를 물고', era: 'joseon-late', note: '사설시조 — 지배층 풍자' },
    ],
    detail: {
      definition: '3장 6구 45자 내외의 정형시. 고려 후기에 형성되어 조선 시대 사대부 문학의 중심이 되었고, 조선 후기에는 형식이 길어진 사설시조가 나타남.',
      changes: [
        { era: 'goryeo-late', text: '신진 사대부를 중심으로 평시조 형성' },
        { era: 'joseon-early', text: '사대부의 강호·유교 이념 → 연시조 발달' },
        { era: 'joseon-late', text: '평민 작가층 → 사설시조, 시조집 편찬(청구영언 등)' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'gasa',
    map: 'poetry',
    name: '가사',
    color: '118 36 44',
    stages: [
      { from: 'joseon-early', to: 'joseon-early', label: '정격 가사' },
      { from: 'joseon-late', to: 'joseon-late', label: '변격 가사' },
    ],
    works: [
      { title: '상춘곡', author: '정극인', era: 'joseon-early' },
      { title: '관동별곡', author: '정철', era: 'joseon-early' },
      { title: '누항사', author: '박인로', era: 'joseon-late' },
      { title: '일동장유가', author: '김인겸', era: 'joseon-late', note: '장편 기행 가사' },
    ],
    detail: {
      definition: '3(4)·4조, 4음보 연속체의 율문. 조선 전기 사대부의 정격 가사에서 조선 후기 작자층·내용이 확대된 변격 가사로 변화.',
      changes: [
        { era: 'joseon-early', text: '사대부의 강호가도·연군 — 정격 가사' },
        { era: 'joseon-late', text: '서민·부녀자로 작자층 확대, 기행·유배·규방 가사 — 변격 가사' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'japga',
    map: 'poetry',
    name: '잡가',
    color: '146 72 30',
    stages: [{ from: 'joseon-late', to: 'joseon-late', label: '시정의 유흥 노래' }],
    works: [{ title: '유산가', era: 'joseon-late' }],
    detail: {
      definition: '조선 후기 시정(市井)에서 전문 소리꾼이 부르던 노래. 가사·시조·민요 등이 뒤섞인 형태.',
      changes: [{ era: 'joseon-late', text: '도시 상업 발달과 유흥 문화 속에서 성행' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'minyo',
    map: 'poetry',
    name: '민요',
    color: '150 142 128',
    foundation: true,
    stages: [{ from: 'ancient', to: 'joseon-late', label: '토대 — 전 시대에 걸쳐 구전' }],
    works: [{ title: '시집살이 노래', era: 'joseon-late' }],
    detail: {
      definition: '민중 사이에서 구전되어 온 노래. 모든 시가 갈래의 토대가 되었음.',
      changes: [{ era: 'goryeo-early', text: '고려 가요의 기원이 됨' }],
      standards: STANDARDS,
    },
  },

  // ── 고전 서사 ──
  {
    id: 'seolhwa',
    map: 'narrative',
    name: '설화',
    color: '146 72 30',
    stages: [
      { from: 'ancient', to: 'ancient', label: '신화 · 전설의 시대' },
      { from: 'unified-silla', to: 'goryeo-early', label: '전설 · 민담의 시대' },
      { from: 'goryeo-late', to: 'joseon-late', label: '설화집 · 야담' },
    ],
    works: [
      { title: '단군 신화', era: 'ancient' },
      { title: '조신 설화', era: 'unified-silla', note: '《삼국유사》 수록 — 몽자류 소설의 근원' },
      { title: '삼국유사', author: '일연', era: 'goryeo-late' },
      { title: '어우야담', author: '유몽인', era: 'joseon-late' },
    ],
    detail: {
      definition: '한민족 사이에서 구전되어 온 일정한 구조를 가진 꾸며 낸 이야기. 서사 문학의 근원(변이성·전승성·구연성).',
      changes: [
        { era: 'ancient', text: '신화·전설의 시대' },
        { era: 'unified-silla', text: '전설·민담의 시대' },
        { era: 'goryeo-late', text: '설화집 편찬' },
        { era: 'joseon-late', text: '야담 — 《어우야담》 등' },
      ],
      standards: STANDARDS,
      comparison: {
        headers: ['신화', '전설', '민담'],
        rows: [
          { label: '전승자의 태도', cells: ['신성성 중시', '진실성 중시', '흥미성 중시'] },
          { label: '시간과 장소', cells: ['아득한 옛날, 신성한 장소', '구체적인 시간과 장소', '막연한 시간과 장소'] },
          { label: '증거물', cells: ['포괄적(우주, 국가 등)', '개별적(바위, 개울 등)', '보편적'] },
          { label: '주인공과 그 행위', cells: ['신적 존재, 초능력 발휘', '비범한 인간, 비극적 결말', '평범한 인간, 운명 개척'] },
          { label: '전승 범위', cells: ['민족적 범위', '지역적 범위', '세계적 범위'] },
        ],
      },
    },
  },
  {
    id: 'hanmun',
    map: 'narrative',
    name: '한문학',
    color: '44 74 110',
    stages: [
      { from: 'unified-silla', to: 'unified-silla', label: '발달' },
      { from: 'joseon-early', to: 'joseon-early', label: '융성' },
      { from: 'joseon-late', to: 'joseon-late', label: '국문 표현으로의 변모' },
    ],
    works: [
      { title: '화왕계', author: '설총', era: 'unified-silla', note: '꽃을 의인화한 우언' },
      { title: '격황소서', author: '최치원', era: 'unified-silla' },
      { title: '동문선', author: '서거정 등', era: 'joseon-early' },
      { title: '열하일기', author: '박지원', era: 'joseon-late' },
    ],
    detail: {
      definition: '한자로 기록된 문학. 공식 언어로서 문화적 보편주의의 확립에 기여.',
      changes: [
        { era: 'unified-silla', text: '한문학의 발달 — 화왕계(설총), 격황소서(최치원)' },
        { era: 'joseon-early', text: '훈구파(사장 중시)·사림파(도학 중시)·방외인 문학의 융성' },
        { era: 'joseon-late', text: '한문 문장의 오랜 전통이 국문 표현으로 변모, 사실적 기록 중시' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'paegwan',
    map: 'narrative',
    name: '패관 문학',
    color: '92 86 78',
    stages: [
      { from: 'goryeo-early', to: 'goryeo-late', label: '발달' },
      { from: 'joseon-early', to: 'joseon-early', label: '융성' },
    ],
    works: [
      { title: '수이전', author: '박인량', era: 'goryeo-early', note: '최초의 설화집' },
      { title: '파한집', author: '이인로', era: 'goryeo-late' },
      { title: '용재총화', author: '성현', era: 'joseon-early' },
    ],
    detail: {
      definition: '항간에 떠도는 이야기를 수집하고 창의성을 가미하여 윤색한 것(설화집·패관집, 비평·일화).',
      changes: [
        { era: 'goryeo-late', text: '기존 설화를 윤색, 후대 가전체에 영향 — 파한집·보한집·역옹패설' },
        { era: 'joseon-early', text: '고려 때부터 발달 → 훈민정음 창제 후 더욱 전문화·분화 — 용재총화·필원잡기' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'gajeon',
    map: 'narrative',
    name: '가전체',
    color: '128 60 110',
    stages: [{ from: 'goryeo-late', to: 'goryeo-late', label: '신흥 사대부의 가전체' }],
    works: [
      { title: '국순전', author: '임춘', era: 'goryeo-late', note: '술을 의인화' },
      { title: '공방전', author: '임춘', era: 'goryeo-late', note: '돈을 의인화' },
    ],
    detail: {
      definition: '사물을 의인화하여 그 일대기를 전(傳)의 형식으로 서술한 글. 교훈 전달이 목적이며, 설화와 소설을 이어 주는 교량 역할을 함.',
      changes: [{ era: 'goryeo-late', text: '무신 집권 이후 등장한 신흥 사대부가 교훈 전달 목적으로 창작' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'essay',
    map: 'narrative',
    name: '고전 수필',
    color: '46 125 104',
    stages: [{ from: 'joseon-late', to: 'joseon-late', label: '한문 수필 → 국문 수필' }],
    works: [
      { title: '한중록', author: '혜경궁 홍씨', era: 'joseon-late' },
      { title: '조침문', author: '유씨 부인', era: 'joseon-late' },
    ],
    detail: {
      definition: '자유로운 형식으로 체험과 생각을 기록한 산문. 초기에는 양반층의 한문 수필이 다수였으나 점차 여성이 주요 작자층으로 자리 잡음.',
      changes: [{ era: 'joseon-late', text: '사회·문화적 변동 → 역사적·개인적 체험 기록의 필요성 대두, 국문 수필의 대두' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'novel',
    map: 'narrative',
    name: '소설',
    color: '139 26 26',
    stages: [
      { from: 'joseon-early', to: 'joseon-early', label: '한문 전기 소설의 탄생' },
      { from: 'joseon-late', to: 'joseon-late', label: '국문 소설 · 한문 단편 소설' },
    ],
    works: [
      { title: '금오신화', author: '김시습', era: 'joseon-early', note: '최초의 한문 소설(전기 소설)' },
      { title: '구운몽', author: '김만중', era: 'joseon-late', note: '몽자류 소설' },
      { title: '허생전', author: '박지원', era: 'joseon-late', note: '한문 단편 소설' },
    ],
    detail: {
      definition: '설화·패관 문학·가전체 등의 서사적 전통을 계승하고 중국 전기 문학의 영향을 받아 형성된 서사 갈래.',
      changes: [
        { era: 'joseon-early', text: '한문 소설의 탄생 — 최초의 한문 소설 〈금오신화〉(전기 소설)' },
        { era: 'joseon-late', text: '임·병 양난 이후 성장한 산문 정신 → 다양한 국문 소설 발달, 한문 단편 소설의 발전' },
      ],
      standards: STANDARDS,
      typeChips: [
        { label: '영웅 군담 소설', examples: '유충렬전, 임경업전, 박씨전' },
        { label: '가정·애정 소설', examples: '사씨남정기, 숙향전' },
        { label: '몽자류·몽유록', examples: '구운몽, 운영전' },
        { label: '세태 풍자·우화 소설', examples: '배비장전, 장끼전' },
        { label: '판소리계 소설', examples: '춘향전, 흥부전, 심청전' },
      ],
    },
  },
  {
    id: 'pansori',
    map: 'narrative',
    name: '판소리',
    color: '178 62 34',
    stages: [{ from: 'joseon-late', to: 'joseon-late', label: '판소리의 형성·발전' }],
    works: [
      { title: '춘향가', era: 'joseon-late' },
      { title: '판소리 사설 정리', author: '신재효', era: 'joseon-late' },
    ],
    detail: {
      definition: '광대가 고수의 북장단에 맞추어 창(소리)과 아니리(말)로 이야기를 엮어 가는 구비 서사 문학.',
      changes: [{ era: 'joseon-late', text: '서민층에서 형성 → 양반층까지 향유층 확대, 신재효의 사설 정리' }],
      standards: STANDARDS,
    },
  },
  {
    id: 'folk-drama',
    map: 'narrative',
    name: '민속극',
    color: '150 104 18',
    stages: [
      { from: 'goryeo-early', to: 'goryeo-late', label: '산대극의 등장' },
      { from: 'joseon-late', to: 'joseon-late', label: '탈춤 · 인형극의 발달' },
    ],
    works: [
      { title: '산대잡극', author: '이색', era: 'goryeo-late', note: '고려 산대극의 모습을 읊은 시' },
      { title: '봉산 탈춤', era: 'joseon-late' },
      { title: '꼭두각시놀음', era: 'joseon-late', note: '인형극' },
    ],
    detail: {
      definition: '민중 사이에서 전승되어 온 연극. 팔관회·연등회·나례 등의 행사에서 비롯되어 조선 후기에 탈춤·인형극으로 발달.',
      changes: [
        { era: 'goryeo-late', text: '산대극 — 산대에서 광대가 음악에 맞추어 춤추고 재담을 하는 가면극 → 후대 탈춤으로 이어짐' },
        { era: 'joseon-late', text: '서민 정신, 지배층에 대한 풍자와 해학 — 산대놀이, 봉산 탈춤 / 꼭두각시놀음' },
      ],
      standards: STANDARDS,
    },
  },
  {
    id: 'muga',
    map: 'narrative',
    name: '서사 무가',
    color: '163 38 64',
    stages: [{ from: 'ancient', to: 'joseon-late', label: '굿에서 구연되며 전승' }],
    works: [
      { title: '천지왕 본풀이', era: 'ancient' },
      { title: '바리데기', era: 'joseon-late' },
    ],
    detail: {
      definition: '무당이 굿에서 노래로 구연하는 신의 내력 이야기. 신화적 성격을 지니며 오랜 기간 전승됨.',
      changes: [{ era: 'ancient', text: '고대부터 굿을 통해 구비 전승' }],
      standards: STANDARDS,
    },
  },
];

// ───────────────────────── 외부 노드 ─────────────────────────
export const externals: ExternalNode[] = [{ id: 'jeondeung', map: 'narrative', era: 'joseon-early', label: '중국 전기 문학 (전등신화)' }];

// ───────────────────────── 영향 관계 ─────────────────────────
export const influences: Influence[] = [
  {
    id: 'minyo-gayo',
    map: 'poetry',
    from: { lane: 'minyo', era: 'goryeo-early' },
    to: { lane: 'goryeo-gayo', era: 'goryeo-early' },
    label: '민요 → 고려 가요',
    description: '고려 가요는 민간에서 부르던 민요에서 비롯되어, 궁중 음악으로 수용되며 후렴구 등이 덧붙었다.',
  },
  {
    id: 'seolhwa-gajeon',
    map: 'narrative',
    from: { lane: 'seolhwa', era: 'goryeo-early' },
    to: { lane: 'gajeon', era: 'goryeo-late' },
    label: '설화 → 가전체',
    description: '설화의 의인화·우화적 수법이 가전체로 이어졌다.',
  },
  {
    id: 'paegwan-gajeon',
    map: 'narrative',
    from: { lane: 'paegwan', era: 'goryeo-late' },
    to: { lane: 'gajeon', era: 'goryeo-late' },
    label: '패관 문학 → 가전체',
    description: '패관 문학은 기존 설화를 윤색하며 창의성을 더해, 허구적 서술을 하는 가전체에 영향을 주었다.',
  },
  {
    id: 'gajeon-novel',
    map: 'narrative',
    from: { lane: 'gajeon', era: 'goryeo-late' },
    to: { lane: 'novel', era: 'joseon-early' },
    label: '가전체 → 소설',
    description: '가전체는 허구적 인물의 일대기를 서술한다는 점에서 설화와 소설을 이어 주는 교량 역할을 했다.',
  },
  {
    id: 'jeondeung-geumo',
    map: 'narrative',
    from: { external: 'jeondeung', era: 'joseon-early' },
    to: { lane: 'novel', era: 'joseon-early' },
    label: '전등신화 → 금오신화',
    description: '명나라 구우의 《전등신화》 등 중국 전기(傳奇) 문학의 영향을 받아, 김시습이 최초의 한문 소설 〈금오신화〉를 지었다.',
  },
  {
    id: 'pansori-novel',
    map: 'narrative',
    from: { lane: 'pansori', era: 'joseon-late' },
    to: { lane: 'novel', era: 'joseon-late' },
    label: '판소리 → 판소리계 소설',
    description: '판소리 사설이 소설로 정착하여 〈춘향전〉〈흥부전〉〈심청전〉 등 판소리계 소설이 되었다.',
  },
  {
    id: 'sandae-talchum',
    map: 'narrative',
    from: { lane: 'folk-drama', era: 'goryeo-late' },
    to: { lane: 'folk-drama', era: 'joseon-late' },
    label: '산대극 → 탈춤',
    description: '고려 시대 산대극의 가면극 전통이 조선 후기 산대놀이·탈춤으로 이어졌다.',
  },
];

export const timelineMaps: { id: MapId | 'modern'; label: string; ready: boolean }[] = [
  { id: 'poetry', label: '고전 시가', ready: true },
  { id: 'narrative', label: '고전 서사', ready: true },
  { id: 'modern', label: '현대 문학 · 준비 중', ready: false },
];

export const eraIndex = (id: EraId) => eras.findIndex((e) => e.id === id);
export const getEra = (id: EraId) => eras.find((e) => e.id === id)!;
