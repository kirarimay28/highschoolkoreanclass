/**
 * 독서와 작문 › DIY 구조도 지문 (기본값)
 * 선생님·교수자가 앱에서 지문·모범 구조도를 바꾸면 그 내용이 우선합니다.
 * 원문은 PDF 복사 시 잘못 들어간 띄어쓰기만 정리했습니다.
 */
import type { ReadingPassage } from '@/types/structure';

export const readingStandards = [
  { code: '12독작01-03', label: '내용 파악·추론' },
  { code: '12독작01-05', label: '내용 조직 방법' },
  { code: '12독작01-13', label: '학습을 위한 정리' },
];

/** 문단 카드 역할 라벨 (직접 입력도 가능) */
export const paragraphRoles = ['화제 제시', '원리 설명', '적용', '한계·보완', '관점 전환', '결론'];

/** 문단 사이 관계 라벨 */
export const paragraphRelations = ['구체화', '원리→적용', '조건·한계', '해결', '관점 전환', '병렬', '인과'];

export const conceptColors = [
  { id: 'core', label: '핵심 개념', rgb: '139 26 26' },
  { id: 'cause', label: '원인·원리', rgb: '150 118 22' },
  { id: 'use', label: '활용', rgb: '44 74 110' },
  { id: 'cond', label: '조건·수치', rgb: '70 66 60' },
] as const;

const eog: ReadingPassage = {
  id: 'eog',
  title: '안전도(EOG)',
  field: '과학·기술',
  structureType: '개념 정의 → 원리 → 활용 1(한계와 보완) → 활용 2',
  paragraphs: [
    '빛을 받아들이는 감각 기관인 안구는 특유의 전기적 성질을 지닌다. 이러한 성질에서 비롯된 전기 신호를 눈 주위 피부에 붙인 전극으로 기록하는 기술이 안전도(EOG)이다. 이 기술은 ㉠ 눈을 감은 상태에서도 전기 신호를 기록할 수 있어 안구 운동을 살피는 데 효과적이며, 망막의 기능을 평가하는 임상 검사에도 활용된다.',
    '안구는 앞쪽이 양극이고 뒤쪽이 음극인 전기 쌍극자처럼 작동한다. 각막이 있는 앞쪽의 전위와 망막이 있는 뒤쪽의 전위 사이에는 전위차가 생기는데, 이 전위차를 정지 전위라고 한다. 정지 전위는 망막의 가장 바깥쪽에 위치한 한 겹의 세포층인 망막색소상피에서 일어나는 이온 수송으로 인해 형성된다. 이온은 전하를 띤 입자이므로 이온이 수송되면 세포층의 한쪽 면에 전하가 치우쳐 전위차가 발생하는 것이다. 망막색소상피에서 일어나는 이온 수송은 눈을 감아도 계속되므로 정지 전위는 사라지지 않는다. 또한 조명 조건이 일정하게 유지될 때 정지 전위의 크기는 비교적 일정하게 유지되며 안구의 방향에 따라 달라지지 않는다.',
    '안전도를 활용한 검사를 하려면 눈 좌우의 피부에 각각 전극을 붙이는데, 전기 쌍극자처럼 작동하는 안구의 특성으로 인해 두 전극 사이에도 전위차가 발생할 수 있다. 이때 전위차를 오른쪽 전극의 전위에서 왼쪽 전극의 전위를 뺀 값으로 정하면, 안구가 정면을 향할 때는 오른쪽 전극의 전위와 왼쪽 전극의 전위가 동일하여 전위차가 나타나지 않는다. 이와 달리 안구가 오른쪽으로 돌 때는 양극인 각막이 오른쪽 전극에 가까워져 그 전극의 전위가 높아지므로 전위차가 양수가 되고, 왼쪽으로 돌 때는 왼쪽 전극의 전위가 높아져 전위차가 음수가 된다. 즉 전위차의 부호는 회전 방향을 나타낸다. 그리고 전위차의 절댓값은 전위차의 크기를 나타낸다. 전위차의 크기는 측정 시점의 정지 전위의 크기에 비례하고, 정면 기준 좌우 각각 약 30° 이내에서는 안구의 회전 각도의 크기에도 비례한다. 따라서 정지 전위가 일정하다는 전제에서, 전위차의 부호와 크기로부터 각각 안구의 회전 방향과 각도를 알아내 안구 운동을 추적할 수 있다.',
    '한편 정지 전위는 조명 조건이 암조건인지 명조건인지에 따라 변한다. 암조건이 일정 시간 이상 이어지면 정지 전위가 점차 작아져 최솟값에 이르고, 이후 명조건이 일정 시간 이상 이어지면 정지 전위가 다시 커져 최댓값에 도달한다. 이처럼 정지 전위가 달라지면 같은 각도에서 측정하더라도 전극 사이의 전위차의 크기가 달라지므로, 그 크기만으로는 회전 각도를 정확히 알 수 없다. 그러므로 안구 운동을 정확히 추적하려면, 일정한 조명 조건에서 정지 전위가 안정될 만큼 안구를 충분히 적응시킨 뒤 측정 중에도 그 조명 조건을 유지해야 한다.',
    '조명 조건에 따라 달라지는 정지 전위는 망막 기능을 평가하는 지표가 되기도 한다. 빛에 노출되면 빛을 받아들이는 시각세포가 반응하고, 그 반응으로 인해 망막색소상피에서 일어나는 이온 수송이 더 활발해진다. 그러면 전하의 치우침이 커져 정지 전위가 커진다. 그러나 망막색소상피의 기능이 저하되면 이온 수송이 제대로 일어나지 못하여 정지 전위가 정상 범위까지 커지지 못한다. 이때 명조건에서의 정지 전위 최댓값을 암조건에서의 최솟값으로 나눈 값을 아덴비라 하는데, 망막색소상피의 기능이 정상이면 대략 1.8 이상으로 나타난다. 아덴비가 그보다 낮으면 망막색소상피의 기능 저하 가능성을 시사하므로 진단의 보조 지표로 쓰인다.',
  ],
  questions: [
    '③의 안구 운동 추적이 성립하려면 어떤 전제가 필요한가? 그 전제는 어느 문단에서 깨지는가?',
    "같은 '정지 전위의 변화'가 ④와 ⑤에서 각각 어떤 의미로 쓰이는가?",
    '㉠이 가능한 이유를 지문에서 찾아 구조도의 어느 노드와 연결되는지 표시해 보자.',
  ],
  modelParagraph: {
    nodes: [
      { id: 'p1', kind: 'paragraph', paragraph: 1, role: '화제 제시', text: '안구의 전기적 성질을 이용한 안전도(EOG)의 개념과 두 가지 활용(안구 운동 추적, 망막 기능 평가) 예고', x: 300, y: 0 },
      { id: 'p2', kind: 'paragraph', paragraph: 2, role: '원리 설명', text: '안구는 전기 쌍극자(앞 양극, 뒤 음극), 각막–망막 사이 전위차인 정지 전위는 망막색소상피의 이온 수송으로 형성, 눈을 감아도 유지되고 방향과 무관', x: 300, y: 210 },
      { id: 'p3', kind: 'paragraph', paragraph: 3, role: '적용', text: '(활용 1) 좌우 전극 전위차의 부호로 회전 방향, 크기로 회전 각도를 파악해 안구 운동 추적 (전제: 정지 전위 일정)', x: 40, y: 430 },
      { id: 'p4', kind: 'paragraph', paragraph: 4, role: '한계·보완', text: '정지 전위가 조명 조건(암/명)에 따라 변해 ③의 전제가 깨짐 → 조명 조건에 충분히 적응시키고 유지해야 함', x: 40, y: 650 },
      { id: 'p5', kind: 'paragraph', paragraph: 5, role: '관점 전환', text: '(활용 2) 조명에 따른 정지 전위 변화를 망막 기능 평가 지표로 활용, 아덴비(명조건 최댓값 ÷ 암조건 최솟값)로 망막색소상피 기능 판단', x: 560, y: 650 },
    ],
    edges: [
      { id: 'e12', source: 'p1', target: 'p2', label: '구체화' },
      { id: 'e23', source: 'p2', target: 'p3', label: '원리→적용' },
      { id: 'e34', source: 'p3', target: 'p4', label: '조건·한계' },
      { id: 'e45', source: 'p4', target: 'p5', label: '관점 전환' },
      { id: 'e13', source: 'p1', target: 'p3', label: '병렬' },
      { id: 'e15', source: 'p1', target: 'p5', label: '병렬' },
    ],
  },
  modelContent: {
    nodes: [
      { id: 'c0', kind: 'concept', color: 'core', text: '정지 전위 (각막–망막 사이 전위차)', x: 520, y: 0 },
      // 형성 원리
      { id: 'a0', kind: 'concept', color: 'cause', text: '형성 원리', x: 0, y: 170 },
      { id: 'a1', kind: 'concept', color: 'cause', text: '망막색소상피의 이온 수송', x: 0, y: 300 },
      { id: 'a2', kind: 'concept', color: 'cause', text: '세포층 한쪽에 전하 치우침', x: 0, y: 420 },
      { id: 'a3', kind: 'concept', color: 'cause', text: '전위차 발생', x: 0, y: 540 },
      { id: 'a4', kind: 'concept', color: 'cond', text: '성질: 눈 감아도 유지 (→ ㉠의 근거)', x: 0, y: 680 },
      { id: 'a5', kind: 'concept', color: 'cond', text: '성질: 조명 일정하면 크기 일정', x: 0, y: 790 },
      { id: 'a6', kind: 'concept', color: 'cond', text: '성질: 안구 방향과 무관', x: 0, y: 900 },
      // 조명 조건 (두 활용을 잇는 노드)
      { id: 'l0', kind: 'concept', color: 'cond', text: '조명 조건에 따른 변화 (암조건→최솟값, 명조건→최댓값)', x: 520, y: 330 },
      // 활용 1
      { id: 'b0', kind: 'concept', color: 'use', text: '활용 1. 안구 운동 추적', x: 300, y: 520 },
      { id: 'b1', kind: 'concept', color: 'cond', text: '전위차 = 오른쪽 전극 전위 − 왼쪽 전극 전위', x: 300, y: 650 },
      { id: 'b2', kind: 'concept', color: 'use', text: '부호 → 회전 방향 (정면 0, 오른쪽 +, 왼쪽 −)', x: 300, y: 780 },
      { id: 'b3', kind: 'concept', color: 'cond', text: '크기 → 정지 전위 크기에 비례, 좌우 약 30° 이내에서 회전 각도에 비례', x: 300, y: 900 },
      { id: 'b4', kind: 'concept', color: 'use', text: '보완: 일정 조명에 충분히 적응 후 측정 중 유지', x: 560, y: 650 },
      // 활용 2
      { id: 'd0', kind: 'concept', color: 'use', text: '활용 2. 망막 기능 평가', x: 860, y: 520 },
      { id: 'd1', kind: 'concept', color: 'cause', text: '빛 노출 → 시각세포 반응 → 이온 수송 활발 → 정지 전위 증가', x: 860, y: 650 },
      { id: 'd2', kind: 'concept', color: 'cause', text: '기능 저하 시 → 이온 수송 부족 → 정지 전위가 정상 범위까지 커지지 못함', x: 860, y: 780 },
      { id: 'd3', kind: 'concept', color: 'cond', text: '아덴비 = 명조건 최댓값 ÷ 암조건 최솟값', x: 860, y: 910 },
      { id: 'd4', kind: 'concept', color: 'cond', text: '약 1.8 이상 정상, 낮으면 기능 저하 가능성 (진단 보조 지표)', x: 860, y: 1030 },
    ],
    edges: [
      { id: 'ec-a', source: 'c0', target: 'a0', label: '형성' },
      { id: 'ea01', source: 'a0', target: 'a1', label: '' },
      { id: 'ea12', source: 'a1', target: 'a2', label: '그래서' },
      { id: 'ea23', source: 'a2', target: 'a3', label: '그래서' },
      { id: 'ea34', source: 'a3', target: 'a4', label: '성질' },
      { id: 'ea45', source: 'a4', target: 'a5', label: '' },
      { id: 'ea56', source: 'a5', target: 'a6', label: '' },
      { id: 'ec-l', source: 'c0', target: 'l0', label: '조명에 따라' },
      { id: 'ec-b', source: 'c0', target: 'b0', label: '활용 1' },
      { id: 'ec-d', source: 'c0', target: 'd0', label: '활용 2' },
      { id: 'el-b', source: 'l0', target: 'b0', label: '방해 요인' },
      { id: 'el-d', source: 'l0', target: 'd0', label: '평가 지표' },
      { id: 'eb01', source: 'b0', target: 'b1', label: '측정' },
      { id: 'eb12', source: 'b1', target: 'b2', label: '부호' },
      { id: 'eb23', source: 'b2', target: 'b3', label: '크기' },
      { id: 'eb04', source: 'b0', target: 'b4', label: '한계 → 보완' },
      { id: 'ed01', source: 'd0', target: 'd1', label: '원리' },
      { id: 'ed12', source: 'd1', target: 'd2', label: '이상 시' },
      { id: 'ed23', source: 'd2', target: 'd3', label: '측정' },
      { id: 'ed34', source: 'd3', target: 'd4', label: '판정' },
    ],
  },
};

export const defaultPassages: ReadingPassage[] = [eog];

/** 문단을 문장으로 나누기 (". " 기준 — "1.8" 같은 소수점은 나누지 않음) */
export function splitSentences(paragraph: string): string[] {
  return paragraph.split(/(?<=[.?!])\s+/).filter(Boolean);
}

export const sentenceKey = (paragraph: number, sentence: number) => `${paragraph}-${sentence}`;

export const circled = (n: number) => '①②③④⑤⑥⑦⑧⑨⑩'[n - 1] ?? `(${n})`;

/** 모범 구조도를 볼 수 없는 경우(학생이 서버에서 받은 지문)에는 기본 지문의 모범을 템플릿 원본으로 사용 */
const templateSource = (p: ReadingPassage) => {
  const base = defaultPassages.find((d) => d.id === p.id);
  return {
    paragraph: p.modelParagraph.nodes.length ? p.modelParagraph : base?.modelParagraph,
    content: p.modelContent.nodes.length ? p.modelContent : base?.modelContent,
  };
};

/** 도움 모드 문단 구조도: 카드 위치·연결선은 놓아 두고 역할·요약·관계는 빈칸 */
export function guidedParagraphTemplate(p: ReadingPassage) {
  const model = templateSource(p).paragraph;
  if (model?.nodes.length) {
    return {
      nodes: model.nodes.map((n) => ({ ...n, role: '', text: '', sentenceKey: undefined })),
      edges: model.edges.map((e) => ({ ...e, label: '' })),
    };
  }
  // 모범이 없으면 문단 순서대로 카드를 세로로 놓고 차례로 연결
  const nodes = p.paragraphs.map((_, i) => ({ id: `p${i + 1}`, kind: 'paragraph' as const, paragraph: i + 1, role: '', text: '', x: 200, y: i * 210 }));
  return { nodes, edges: nodes.slice(1).map((n, i) => ({ id: `e${i + 1}${i + 2}`, source: nodes[i].id, target: n.id, label: '' })) };
}

/** 도움 모드 내용 구조도: 중심 노드 + 큰 가지(중심에서 바로 이어진 노드)만 */
export function guidedContentTemplate(p: ReadingPassage) {
  const model = templateSource(p).content;
  if (!model?.nodes.length) return { nodes: [{ id: 'c0', kind: 'concept' as const, color: 'core' as const, text: '', x: 300, y: 0 }], edges: [] };
  const center = model.nodes.find((n) => n.color === 'core') ?? model.nodes[0];
  // 기본 지문: 정지 전위 + 형성 원리 / 활용 1 / 활용 2 (조명 노드는 학생이 찾도록 뺌)
  const preferred = ['a0', 'b0', 'd0'].filter((id) => model.nodes.some((n) => n.id === id));
  const branchIds = preferred.length
    ? preferred
    : model.edges.filter((e) => e.source === center.id).map((e) => e.target);
  const keep = new Set([center.id, ...branchIds]);
  return {
    nodes: model.nodes.filter((n) => keep.has(n.id)).map((n) => ({ ...n })),
    edges: model.edges.filter((e) => keep.has(e.source) && keep.has(e.target)).map((e) => ({ ...e })),
  };
}

export const emptyDiagram = () => ({ nodes: [], edges: [] });
