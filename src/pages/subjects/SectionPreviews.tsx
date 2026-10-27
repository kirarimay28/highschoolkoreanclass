import type { SectionPreviewId } from '@/config/subjects';

/** 기능 카드 아래 미니 일러스트 (장식용) — 과목 포인트 색(--page-accent / --page-gold)을 따름 */
const A = (o = 1) => `rgb(var(--page-accent) / ${o})`;
const G = (o = 1) => `rgb(var(--page-gold) / ${o})`;

export function SectionPreview({ id }: { id: SectionPreviewId }) {
  const art = id === 'timeline' ? <TimelineArt /> : id === 'diy' ? <DiyArt /> : id === 'vocab' ? <VocabArt /> : <LectureArt />;
  return (
    <svg viewBox="0 0 240 72" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false">
      {art}
    </svg>
  );
}

/** 시대 띠 6칸 + 갈래 레인 3줄 + 영향 화살표 */
function TimelineArt() {
  const eras = [0, 1, 2, 3, 4, 5];
  const w = 36;
  const x0 = 12;
  const lanes = [
    { y: 26, from: 0, to: 2.6 },
    { y: 41, from: 1.4, to: 4.4 },
    { y: 56, from: 3.2, to: 6 },
  ];
  return (
    <g>
      {eras.map((i) => (
        <g key={i}>
          <rect x={x0 + i * w} y={6} width={w - 2} height={62} rx={4} fill={i % 2 ? G(0.1) : A(0.05)} />
          <rect x={x0 + i * w} y={6} width={w - 2} height={10} rx={3} fill={G(0.35 + i * 0.05)} />
        </g>
      ))}
      {lanes.map((l, i) => (
        <g key={i}>
          <rect x={x0 + l.from * w + 2} y={l.y - 4} width={(l.to - l.from) * w - 6} height={8} rx={4} fill={A(0.18 + i * 0.12)} />
          {[0.25, 0.6, 0.9].map((t) => (
            <circle key={t} cx={x0 + (l.from + (l.to - l.from) * t) * w} cy={l.y} r={2.6} fill={G(0.95)} stroke="white" strokeWidth={0.8} />
          ))}
        </g>
      ))}
      <path d={`M${x0 + 2.4 * w} 30 C ${x0 + 2.6 * w} 34, ${x0 + 2.4 * w} 38, ${x0 + 2.7 * w} 39`} fill="none" stroke={G(0.9)} strokeWidth={1.2} strokeDasharray="2 2" />
      <path d={`M${x0 + 4.2 * w} 45 C ${x0 + 4.4 * w} 49, ${x0 + 4.1 * w} 53, ${x0 + 4.5 * w} 54`} fill="none" stroke={G(0.9)} strokeWidth={1.2} strokeDasharray="2 2" />
    </g>
  );
}

/** 문단 카드 ①~⑤ 를 연결선으로 */
function DiyArt() {
  const nodes = [
    { n: '①', x: 120, y: 14 },
    { n: '②', x: 66, y: 38 },
    { n: '③', x: 174, y: 38 },
    { n: '④', x: 36, y: 60 },
    { n: '⑤', x: 96, y: 60 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
  ];
  return (
    <g>
      {edges.map(([a, b]) => (
        <line key={`${a}${b}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={G(0.8)} strokeWidth={1.4} />
      ))}
      <line x1={174} y1={38} x2={204} y2={60} stroke={G(0.5)} strokeWidth={1.2} strokeDasharray="3 2" />
      <rect x={188} y={53} width={32} height={14} rx={4} fill="white" stroke={G(0.5)} strokeDasharray="3 2" />
      {nodes.map((d, i) => (
        <g key={d.n}>
          <rect x={d.x - 20} y={d.y - 8} width={40} height={16} rx={5} fill="white" stroke={i === 0 ? A(0.7) : G(0.7)} strokeWidth={1.2} />
          <text x={d.x - 12} y={d.y + 4} fontSize={10} fontWeight={700} fill={A(0.9)}>
            {d.n}
          </text>
          <rect x={d.x - 3} y={d.y - 1.5} width={16} height={3} rx={1.5} fill={A(0.18)} />
        </g>
      ))}
    </g>
  );
}

/** 재생 화면 + 진행 막대 + 메모 시각 */
function LectureArt() {
  return (
    <g>
      <rect x={30} y={6} width={108} height={60} rx={7} fill={A(0.12)} stroke={G(0.6)} strokeWidth={1.2} />
      <circle cx={84} cy={30} r={12} fill="white" opacity={0.9} />
      <path d="M80 23 L91 30 L80 37 Z" fill={A(0.85)} />
      <rect x={38} y={54} width={92} height={4} rx={2} fill="white" opacity={0.8} />
      <rect x={38} y={54} width={52} height={4} rx={2} fill={A(0.75)} />
      <circle cx={90} cy={56} r={3.2} fill={G(1)} stroke="white" strokeWidth={0.8} />
      {[
        { y: 14, t: '0:42', w: 44 },
        { y: 32, t: '3:15', w: 34 },
        { y: 50, t: '7:08', w: 40 },
      ].map((m) => (
        <g key={m.t}>
          <rect x={148} y={m.y - 7} width={78} height={14} rx={7} fill="white" stroke={G(0.5)} />
          <text x={154} y={m.y + 3.5} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={A(0.9)}>
            {m.t}
          </text>
          <rect x={178} y={m.y - 1.5} width={m.w} height={3} rx={1.5} fill={G(0.45)} />
        </g>
      ))}
    </g>
  );
}

/** 겹쳐진 단어 카드 */
function VocabArt() {
  const cards = [
    { x: 58, y: 14, r: -9, o: 0.55 },
    { x: 76, y: 10, r: -3, o: 0.75 },
  ];
  return (
    <g>
      {cards.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={74} height={50} rx={7} fill="white" stroke={G(c.o)} strokeWidth={1.2} transform={`rotate(${c.r} ${c.x + 37} ${c.y + 25})`} />
      ))}
      <g transform="rotate(4 131 37)">
        <rect x={94} y={10} width={74} height={50} rx={7} fill="white" stroke={A(0.6)} strokeWidth={1.4} />
        <rect x={94} y={10} width={74} height={9} rx={4} fill={G(0.3)} />
        <text x={131} y={42} textAnchor="middle" fontSize={15} fontWeight={700} fill={A(0.9)} fontFamily="serif">
          졍지
        </text>
        <rect x={115} y={49} width={32} height={3} rx={1.5} fill={G(0.5)} />
      </g>
      <g>
        <rect x={178} y={20} width={44} height={14} rx={7} fill={A(0.12)} />
        <text x={200} y={30.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={A(0.85)}>
          부엌
        </text>
        <rect x={178} y={40} width={44} height={14} rx={7} fill={G(0.18)} />
        <text x={200} y={50.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={G(1)}>
          「청산별곡」
        </text>
      </g>
    </g>
  );
}
