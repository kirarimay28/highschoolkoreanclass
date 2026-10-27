import {
  Background,
  BaseEdge,
  ConnectionMode,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  getBezierPath,
  getNodesBounds,
  getViewportForBounds,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { circled, conceptColors, paragraphRelations, paragraphRoles } from '@/data/readingPassages';
import type { ConceptColor, Diagram, DiagramEdge, DiagramNode, StructureActivity } from '@/types/structure';
import { cn } from '@/utils/format';

/** 지문에서 끌어온 문장 (드래그 데이터) */
export const SENTENCE_MIME = 'application/x-hkc-sentence';
export interface DraggedSentence {
  key: string; // "2-3"
  paragraph: number;
  text: string;
}

type NodeData = { node: DiagramNode };
type EdgeData = { label: string };

interface BoardCtx {
  activity: StructureActivity;
  readOnly: boolean;
  updateNode: (id: string, patch: Partial<DiagramNode>) => void;
  removeNode: (id: string) => void;
  updateEdge: (id: string, label: string) => void;
  sentenceText?: (key: string) => string | undefined;
}
const Ctx = createContext<BoardCtx | null>(null);
const useBoard = () => useContext(Ctx)!;

const colorOf = (c?: ConceptColor) => conceptColors.find((x) => x.id === c) ?? conceptColors[0];
let seq = 0;
const newId = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

// ───────────────────────── 노드 ─────────────────────────
function Handles() {
  const cls = '!h-2.5 !w-2.5 !border-2 !border-hanji-card !bg-gold';
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className={cls} />
      <Handle type="source" position={Position.Right} id="r" className={cls} />
      <Handle type="source" position={Position.Bottom} id="b" className={cls} />
      <Handle type="source" position={Position.Left} id="l" className={cls} />
    </>
  );
}

function ParagraphNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const { readOnly, updateNode, removeNode, sentenceText } = useBoard();
  const n = data.node;
  const preset = paragraphRoles.includes(n.role ?? '') || !n.role;
  const [custom, setCustom] = useState(!preset);
  const quote = n.sentenceKey && sentenceText?.(n.sentenceKey);

  return (
    <div
      className={cn(
        'hanji-node w-[250px] rounded-2xl border bg-hanji-card p-3 text-left shadow-soft',
        selected ? 'border-gold shadow-glow' : 'border-gold/40',
      )}
    >
      <Handles />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-royal font-serif text-lg font-bold text-hanji">
          {circled(n.paragraph ?? 0)}
        </span>
        {readOnly ? (
          <span className="rounded-full bg-royal/10 px-2.5 py-0.5 text-sm font-bold text-royal">{n.role || '역할 ?'}</span>
        ) : custom ? (
          <input
            className="nodrag min-w-0 flex-1 rounded-lg border border-gold/40 bg-white/80 px-2 py-1 text-sm font-bold text-royal"
            placeholder="역할 직접 입력"
            value={n.role ?? ''}
            onChange={(e) => updateNode(n.id, { role: e.target.value })}
            aria-label={`${circled(n.paragraph ?? 0)} 문단 역할`}
          />
        ) : (
          <select
            className="nodrag min-w-0 flex-1 rounded-lg border border-gold/40 bg-white/80 px-2 py-1 text-sm font-bold text-royal"
            value={n.role ?? ''}
            onChange={(e) => (e.target.value === '__custom' ? (setCustom(true), updateNode(n.id, { role: '' })) : updateNode(n.id, { role: e.target.value }))}
            aria-label={`${circled(n.paragraph ?? 0)} 문단 역할`}
          >
            <option value="">역할 고르기</option>
            {paragraphRoles.map((r) => (
              <option key={r}>{r}</option>
            ))}
            <option value="__custom">직접 입력…</option>
          </select>
        )}
        {!readOnly && (
          <button type="button" className="nodrag rounded p-1 text-ink-faint hover:text-royal" onClick={() => removeNode(n.id)} aria-label="카드 지우기">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
      {readOnly ? (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-ink">{n.text || '—'}</p>
      ) : (
        <textarea
          className="nodrag nowheel mt-2 w-full resize-none rounded-lg border border-gold/30 bg-white/70 px-2 py-1.5 text-[13px] leading-snug"
          rows={3}
          placeholder="이 문단을 한 줄로 요약해 보세요"
          value={n.text}
          onChange={(e) => updateNode(n.id, { text: e.target.value })}
          aria-label={`${circled(n.paragraph ?? 0)} 문단 요약`}
        />
      )}
      {quote && <p className="mt-1.5 line-clamp-2 border-l-2 border-gold/60 pl-2 text-[11px] text-ink-soft">“{quote}”</p>}
    </div>
  );
}

function ConceptNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const { readOnly, updateNode, removeNode, sentenceText } = useBoard();
  const n = data.node;
  const color = colorOf(n.color);
  const quote = n.sentenceKey && sentenceText?.(n.sentenceKey);
  return (
    <div
      className={cn('hanji-node w-[220px] rounded-2xl border-2 bg-hanji-card p-2.5 text-left shadow-soft', selected && 'shadow-glow')}
      style={{ borderColor: `rgb(${color.rgb} / ${selected ? 1 : 0.55})` }}
    >
      <Handles />
      <div className="mb-1 flex items-center gap-1">
        {readOnly ? (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-hanji" style={{ background: `rgb(${color.rgb})` }}>
            {color.label}
          </span>
        ) : (
          conceptColors.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              aria-pressed={n.color === c.id}
              onClick={() => updateNode(n.id, { color: c.id })}
              className={cn('nodrag h-4 w-4 rounded-full ring-offset-1 ring-offset-hanji-card', n.color === c.id && 'ring-2')}
              style={{ background: `rgb(${c.rgb})`, ['--tw-ring-color' as string]: `rgb(${c.rgb})` }}
            />
          ))
        )}
        {!readOnly && <span className="ml-1 text-[10px] text-ink-faint">{color.label}</span>}
        {!readOnly && (
          <button type="button" className="nodrag ml-auto rounded p-0.5 text-ink-faint hover:text-royal" onClick={() => removeNode(n.id)} aria-label="노드 지우기">
            <Icon name="close" size={13} />
          </button>
        )}
      </div>
      {readOnly ? (
        <p className="whitespace-pre-wrap text-[13px] font-semibold leading-snug" style={{ color: `rgb(${color.rgb})` }}>
          {n.text || '—'}
        </p>
      ) : (
        <textarea
          className="nodrag nowheel w-full resize-none rounded-lg border border-gold/30 bg-white/70 px-2 py-1 text-[13px] font-semibold leading-snug"
          style={{ color: `rgb(${color.rgb})` }}
          rows={2}
          placeholder="개념을 적어 보세요"
          value={n.text}
          onChange={(e) => updateNode(n.id, { text: e.target.value })}
          aria-label="개념 내용"
        />
      )}
      {quote && <p className="mt-1 line-clamp-2 border-l-2 border-gold/60 pl-2 text-[10px] text-ink-soft">“{quote}”</p>}
    </div>
  );
}

const nodeTypes = { paragraph: ParagraphNode, concept: ConceptNode };

// ───────────────────────── 연결선 ─────────────────────────
function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, selected }: EdgeProps<Edge<EdgeData>>) {
  const { activity, readOnly, updateEdge } = useBoard();
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const label = data?.label ?? '';
  const [editing, setEditing] = useState(false);
  const preset = paragraphRelations.includes(label) || !label;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: 'rgb(var(--color-gold))', strokeWidth: selected ? 3 : 2 }} />
      <EdgeLabelRenderer>
        <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}>
          {readOnly ? (
            label && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-royal-deep shadow">{label}</span>
          ) : activity === 'paragraph' && preset && !editing ? (
            <select
              className={cn('rounded-full border px-2 py-0.5 text-[11px] font-bold shadow', label ? 'border-gold bg-gold text-royal-deep' : 'border-dashed border-gold bg-hanji-card text-ink-faint')}
              value={label}
              onChange={(e) => (e.target.value === '__custom' ? setEditing(true) : updateEdge(id, e.target.value))}
              aria-label="관계 라벨"
            >
              <option value="">관계 ?</option>
              {paragraphRelations.map((r) => (
                <option key={r}>{r}</option>
              ))}
              <option value="__custom">직접 입력…</option>
            </select>
          ) : (
            <input
              className={cn('w-28 rounded-full border px-2 py-0.5 text-center text-[11px] font-bold shadow', label ? 'border-gold bg-gold text-royal-deep' : 'border-dashed border-gold bg-hanji-card')}
              placeholder="관계 입력"
              value={label}
              onChange={(e) => updateEdge(id, e.target.value)}
              onBlur={() => setEditing(false)}
              aria-label="관계 라벨"
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { labeled: LabeledEdge };

// ───────────────────────── 변환 ─────────────────────────
const toRFNode = (n: DiagramNode): Node<NodeData> => ({ id: n.id, type: n.kind, position: { x: n.x, y: n.y }, data: { node: n } });
/** 두 노드의 위치를 보고 서로 마주 보는 면에 화살표를 붙임 */
function sides(from?: DiagramNode, to?: DiagramNode): { sourceHandle: string; targetHandle: string } {
  if (!from || !to) return { sourceHandle: 'b', targetHandle: 't' };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) >= Math.abs(dx) * 0.6) return dy >= 0 ? { sourceHandle: 'b', targetHandle: 't' } : { sourceHandle: 't', targetHandle: 'b' };
  return dx >= 0 ? { sourceHandle: 'r', targetHandle: 'l' } : { sourceHandle: 'l', targetHandle: 'r' };
}

const toRFEdge = (e: DiagramEdge, nodes: DiagramNode[] = []): Edge<EdgeData> => ({
  id: e.id,
  source: e.source,
  target: e.target,
  ...sides(nodes.find((n) => n.id === e.source), nodes.find((n) => n.id === e.target)),
  type: 'labeled',
  data: { label: e.label },
  markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(150, 118, 22)', width: 18, height: 18 },
});

// ───────────────────────── 작업판 ─────────────────────────
export interface StructureBoardProps {
  activity: StructureActivity;
  diagram: Diagram;
  onChange?: (d: Diagram) => void;
  readOnly?: boolean;
  /** 문장 key → 문장 (노드에 인용 표시) */
  sentenceText?: (key: string) => string | undefined;
  paragraphCount?: number;
  className?: string;
  /** PNG 파일 이름 */
  exportName?: string;
  toolbar?: boolean;
}

export function StructureBoard(props: StructureBoardProps) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  );
}

function Board({ activity, diagram, onChange, readOnly = false, sentenceText, paragraphCount = 5, className, exportName, toolbar = true }: StructureBoardProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  // React Flow 가 쓰는 노드·연결선. 크기(measured)·선택 상태는 여기서만 유지하고 데이터에는 저장하지 않음
  const [nodes, setNodes] = useState<Node<NodeData>[]>(() => diagram.nodes.map(toRFNode));
  const [edges, setEdges] = useState<Edge<EdgeData>[]>(() => diagram.edges.map((e) => toRFEdge(e, diagram.nodes)));
  useLayoutEffect(() => {
    setNodes((prev) =>
      diagram.nodes.map((n) => {
        const old = prev.find((p) => p.id === n.id);
        return { ...toRFNode(n), measured: old?.measured, selected: old?.selected, dragging: old?.dragging };
      }),
    );
  }, [diagram.nodes]);
  useLayoutEffect(() => {
    setEdges((prev) => diagram.edges.map((e) => ({ ...toRFEdge(e, diagram.nodes), selected: prev.find((p) => p.id === e.id)?.selected })));
  }, [diagram.edges, diagram.nodes]);
  const selection = useMemo(
    () => ({ nodes: new Set(nodes.filter((n) => n.selected).map((n) => n.id)), edges: new Set(edges.filter((e) => e.selected).map((e) => e.id)) }),
    [nodes, edges],
  );
  const [exporting, setExporting] = useState(false);

  const emit = useCallback((d: Diagram) => onChange?.(d), [onChange]);

  const updateNode = useCallback(
    (id: string, patch: Partial<DiagramNode>) => emit({ ...diagram, nodes: diagram.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }),
    [diagram, emit],
  );
  const removeNode = useCallback(
    (id: string) => emit({ nodes: diagram.nodes.filter((n) => n.id !== id), edges: diagram.edges.filter((e) => e.source !== id && e.target !== id) }),
    [diagram, emit],
  );
  const updateEdge = useCallback(
    (id: string, label: string) => emit({ ...diagram, edges: diagram.edges.map((e) => (e.id === id ? { ...e, label } : e)) }),
    [diagram, emit],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<NodeData>>[]) => {
      setNodes((prev) => applyNodeChanges(readOnly ? changes.filter((c) => c.type !== 'position' && c.type !== 'remove') : changes, prev));
      if (readOnly) return;
      const meaningful = changes.filter((c) => c.type === 'position' || c.type === 'remove');
      if (!meaningful.length) return;
      const applied = applyNodeChanges(meaningful, nodes);
      const ids = new Set(applied.map((n) => n.id));
      emit({
        nodes: diagram.nodes.filter((n) => ids.has(n.id)).map((n) => {
          const p = applied.find((a) => a.id === n.id)!.position;
          return { ...n, x: Math.round(p.x), y: Math.round(p.y) };
        }),
        edges: diagram.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
      });
    },
    [diagram, nodes, emit, readOnly],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<EdgeData>>[]) => {
      setEdges((prev) => applyEdgeChanges(readOnly ? changes.filter((c) => c.type !== 'remove') : changes, prev));
      if (readOnly) return;
      const removes = changes.filter((c) => c.type === 'remove');
      if (!removes.length) return;
      const ids = new Set(applyEdgeChanges(removes, edges).map((e) => e.id));
      emit({ ...diagram, edges: diagram.edges.filter((e) => ids.has(e.id)) });
    },
    [diagram, edges, emit, readOnly],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (readOnly || !c.source || !c.target || c.source === c.target) return;
      emit({ ...diagram, edges: [...diagram.edges, { id: newId('e'), source: c.source, target: c.target, label: '' }] });
    },
    [diagram, emit, readOnly],
  );

  const placeAt = (clientX?: number, clientY?: number) => {
    if (clientX !== undefined && clientY !== undefined) return rf.screenToFlowPosition({ x: clientX, y: clientY });
    const r = wrapper.current?.getBoundingClientRect();
    const c = r ? rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 };
    return { x: c.x - 110 + (diagram.nodes.length % 4) * 24, y: c.y - 40 + (diagram.nodes.length % 4) * 24 };
  };

  /** 문장 → 노드 (문단 구조도: 그 문단 카드에 붙임 / 내용 구조도: 새 개념 노드) */
  const addSentence = useCallback(
    (s: DraggedSentence, at?: { x: number; y: number }) => {
      if (activity === 'paragraph') {
        const card = diagram.nodes.find((n) => n.paragraph === s.paragraph);
        if (card) {
          updateNode(card.id, { sentenceKey: s.key, text: card.text || s.text });
          return;
        }
        const pos = at ?? placeAt();
        emit({ ...diagram, nodes: [...diagram.nodes, { id: newId('p'), kind: 'paragraph', paragraph: s.paragraph, role: '', text: s.text, sentenceKey: s.key, x: pos.x, y: pos.y }] });
        return;
      }
      const pos = at ?? placeAt();
      emit({ ...diagram, nodes: [...diagram.nodes, { id: newId('c'), kind: 'concept', color: 'core', text: s.text, sentenceKey: s.key, x: pos.x, y: pos.y }] });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, diagram, emit, updateNode],
  );

  const onDrop = (e: DragEvent) => {
    const raw = e.dataTransfer.getData(SENTENCE_MIME);
    if (!raw || readOnly) return;
    e.preventDefault();
    addSentence(JSON.parse(raw) as DraggedSentence, placeAt(e.clientX, e.clientY));
  };

  const usedParagraphs = new Set(diagram.nodes.filter((n) => n.kind === 'paragraph').map((n) => n.paragraph));
  const addParagraph = (p: number) => {
    const pos = placeAt();
    emit({ ...diagram, nodes: [...diagram.nodes, { id: newId('p'), kind: 'paragraph', paragraph: p, role: '', text: '', x: pos.x, y: pos.y }] });
  };
  const addConcept = (color: ConceptColor) => {
    const pos = placeAt();
    emit({ ...diagram, nodes: [...diagram.nodes, { id: newId('c'), kind: 'concept', color, text: '', x: pos.x, y: pos.y }] });
  };
  const deleteSelected = () =>
    emit({
      nodes: diagram.nodes.filter((n) => !selection.nodes.has(n.id)),
      edges: diagram.edges.filter((e) => !selection.edges.has(e.id) && !selection.nodes.has(e.source) && !selection.nodes.has(e.target)),
    });

  const exportPng = async () => {
    const viewport = wrapper.current?.querySelector<HTMLElement>('.react-flow__viewport');
    if (!viewport || !diagram.nodes.length) return;
    setExporting(true);
    try {
      const bounds = getNodesBounds(rf.getNodes());
      const width = Math.min(4000, Math.max(800, bounds.width + 160));
      const height = Math.min(4000, Math.max(600, bounds.height + 160));
      const vp = getViewportForBounds(bounds, width, height, 0.2, 2, 0.08);
      const url = await toPng(viewport, {
        backgroundColor: '#FCF9F1',
        width,
        height,
        pixelRatio: 2,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        filter: (el) => !(el instanceof HTMLElement && el.classList.contains('nodrag') && el.tagName === 'BUTTON'),
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportName ?? '구조도'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setExporting(false);
    }
  };

  const ctx = useMemo<BoardCtx>(() => ({ activity, readOnly, updateNode, removeNode, updateEdge, sentenceText }), [activity, readOnly, updateNode, removeNode, updateEdge, sentenceText]);

  return (
    <Ctx.Provider value={ctx}>
      <div className={cn('flex h-full min-h-[420px] flex-col overflow-hidden rounded-card border border-gold/40 bg-hanji-card', className)}>
        {toolbar && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-gold/25 bg-white/50 px-2 py-1.5">
            {!readOnly && activity === 'paragraph' && (
              <span className="flex flex-wrap items-center gap-1">
                <span className="text-xs text-ink-soft">문단 카드</span>
                {Array.from({ length: paragraphCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={usedParagraphs.has(p)}
                    onClick={() => addParagraph(p)}
                    className="h-7 w-7 rounded-full border border-gold/50 bg-hanji-card font-serif text-sm font-bold text-royal enabled:hover:bg-gold/15 disabled:opacity-30"
                    aria-label={`${circled(p)} 문단 카드 추가`}
                  >
                    {circled(p)}
                  </button>
                ))}
              </span>
            )}
            {!readOnly && activity === 'content' && (
              <span className="flex flex-wrap items-center gap-1">
                {conceptColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addConcept(c.id)}
                    className="flex items-center gap-1 rounded-full border bg-hanji-card px-2 py-1 text-xs font-semibold hover:bg-white"
                    style={{ borderColor: `rgb(${c.rgb} / 0.5)`, color: `rgb(${c.rgb})` }}
                  >
                    <Icon name="plus" size={12} />
                    {c.label}
                  </button>
                ))}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {!readOnly && (
                <RoyalButton size="sm" variant="ghost" icon="trash" onClick={deleteSelected} disabled={!selection.nodes.size && !selection.edges.size} className="h-8 px-2.5 text-xs">
                  선택 지우기
                </RoyalButton>
              )}
              <RoyalButton size="sm" variant="ghost" icon="download" onClick={exportPng} disabled={exporting || !diagram.nodes.length} className="h-8 px-2.5 text-xs">
                PNG
              </RoyalButton>
            </span>
          </div>
        )}
        <div ref={wrapper} className="relative min-h-0 flex-1" onDragOver={(e) => e.dataTransfer.types.includes(SENTENCE_MIME) && (e.preventDefault(), (e.dataTransfer.dropEffect = 'copy'))} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: 'rgb(var(--color-gold))', strokeWidth: 2 }}
          >
            <Background gap={24} color="rgb(201 162 39 / 0.25)" />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
          {!diagram.nodes.length && !readOnly && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink-faint">
              {activity === 'paragraph' ? '위의 ①~⑤ 버튼으로 문단 카드를 놓거나, 지문의 형광펜 문장을 끌어와 보세요.' : '위의 버튼으로 개념 노드를 만들거나, 지문의 형광펜 문장을 끌어와 보세요.'}
              <br />
              노드 가장자리의 금색 점을 끌어 다른 노드에 이으면 화살표가 생겨요.
            </p>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}

/** 바깥에서 문장을 작업판에 넣을 때 (모바일 "작업판에 추가" 버튼) */
export function appendSentence(activity: StructureActivity, diagram: Diagram, s: DraggedSentence): Diagram {
  if (activity === 'paragraph') {
    const card = diagram.nodes.find((n) => n.paragraph === s.paragraph);
    if (card) return { ...diagram, nodes: diagram.nodes.map((n) => (n.id === card.id ? { ...n, sentenceKey: s.key, text: n.text || s.text } : n)) };
    const y = Math.max(0, ...diagram.nodes.map((n) => n.y + 200));
    return { ...diagram, nodes: [...diagram.nodes, { id: newId('p'), kind: 'paragraph', paragraph: s.paragraph, role: '', text: s.text, sentenceKey: s.key, x: 0, y }] };
  }
  const y = Math.max(0, ...diagram.nodes.map((n) => n.y + 130));
  return { ...diagram, nodes: [...diagram.nodes, { id: newId('c'), kind: 'concept', color: 'core', text: s.text, sentenceKey: s.key, x: 0, y }] };
}
