import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MedallionButton, type MedallionState } from '@/components/common/MedallionButton';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { lobbyMenu, type LobbySubItem } from '@/config/lobbyMenu';
import { roleLabels, withHonorific } from '@/config/roles';
import { useCurrentUser } from '@/context/AuthContext';

/** 선택 연출이 끝나고 페이지로 넘어가기까지 (ms) */
const SELECT_DELAY = 600;

export function LobbyPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const reduce = useReducedMotion() ?? false;
  const items = lobbyMenu.filter((m) => m.showInLobby && (!m.roles || m.roles.includes(user.role)));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const medalRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const timer = useRef<number>();
  const firstChildRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const selected = items.find((m) => m.id === selectedId);
  const expandedChildren = selected?.children;

  const go = (path: string) => {
    timer.current = window.setTimeout(() => navigate(path), reduce ? 250 : SELECT_DELAY);
  };

  const collapse = () => {
    if (selectedChild) return;
    setSelectedId(null);
    setOrigin(null);
  };

  const selectItem = (id: string) => {
    if (selectedChild) return;
    const item = items.find((m) => m.id === id)!;
    if (item.children?.length) {
      if (selectedId === id) return collapse(); // 다시 누르면 접기
      const r = medalRefs.current[id]?.getBoundingClientRect();
      setOrigin(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
    go(item.path);
  };

  const selectChild = (child: LobbySubItem) => {
    if (selectedChild) return;
    setSelectedChild(child.id);
    go(child.path);
  };

  // 과목 페이지의 "‹ 과목 선택"으로 돌아오면 (?expand=subjects) 하위 메뉴를 펼친 채로 시작
  const [params] = useSearchParams();
  const expandParam = params.get('expand');
  useLayoutEffect(() => {
    if (!expandParam) return;
    const item = items.find((m) => m.id === expandParam && m.children?.length);
    if (!item) return;
    const r = medalRefs.current[item.id]?.getBoundingClientRect();
    setOrigin(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
    setSelectedId(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandParam]);

  // 하위 메뉴가 펼쳐지면 키보드 사용자를 위해 첫 번째로 포커스 이동
  useEffect(() => {
    if (selectedId && expandedChildren) firstChildRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!expandedChildren) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && collapse();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stateOf = (id: string): MedallionState => (!selectedId ? 'idle' : id === selectedId ? 'selected' : 'dimmed');

  return (
    // 빈 곳을 누르면 펼친 하위 메뉴를 접음
    <div className="mx-auto max-w-5xl" onClick={(e) => e.target === e.currentTarget && collapse()}>
      <section className="mb-8 text-center sm:mb-12">
        <p className="font-serif text-sm text-gold-dark">{roleLabels[user.role]}</p>
        <h1 className="title-gradient mt-1 pb-1 text-3xl font-bold sm:text-4xl">{withHonorific(user)}, 어서 오세요</h1>
        <p className="mt-1 text-sm text-ink-soft">오늘은 어떤 공부를 해 볼까요?</p>
        <CloudDivider className="mx-auto mt-4 max-w-md" />
      </section>

      <nav aria-label="로비 메뉴" className="flex flex-wrap items-start justify-center gap-x-4 gap-y-2 sm:gap-x-12" onClick={(e) => e.target === e.currentTarget && collapse()}>
        {items.map((item, i) => (
          <MedallionButton
            key={item.id}
            ref={(el) => (medalRefs.current[item.id] = el)}
            icon={item.icon}
            label={item.title}
            description={item.description}
            index={i}
            state={stateOf(item.id)}
            expanded={item.children ? selectedId === item.id : undefined}
            onSelect={() => selectItem(item.id)}
          />
        ))}
      </nav>

      {/* 하위 선택지: 선택한 메달에서 튀어나와 펼쳐짐 */}
      {expandedChildren && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 sm:mt-4 sm:gap-x-8" role="group" aria-label={`${selected?.title} 하위 메뉴`}>
          {expandedChildren.map((child, i) => (
            <PopOut key={child.id} origin={origin} index={i} reduce={reduce}>
              <MedallionButton
                size="sm"
                entrance={false}
                icon={child.icon}
                label={child.title}
                description={child.description}
                index={i}
                state={!selectedChild ? 'idle' : selectedChild === child.id ? 'selected' : 'dimmed'}
                colors={child.colors}
                layoutId={child.layoutId}
                onSelect={() => selectChild(child)}
                ref={i === 0 ? firstChildRef : undefined}
              />
            </PopOut>
          ))}
        </div>
      )}
    </div>
  );
}

/** 자기 자리에서 origin(선택한 메달 중심)까지 거리를 재서, 거기서부터 튀어나오게 함 */
function PopOut({ origin, index, reduce, children }: { origin: { x: number; y: number } | null; index: number; reduce: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !origin) {
      controls.set({ opacity: 0 });
      controls.start({ opacity: 1, transition: { duration: 0.2 } });
      return;
    }
    const r = el.getBoundingClientRect();
    // 메달 원의 중심은 대략 위쪽에서 원 반지름만큼 아래
    const cx = r.left + r.width / 2;
    const cy = r.top + Math.min(r.width, 112) / 2;
    controls.set({ x: origin.x - cx, y: origin.y - cy, scale: 0.2, opacity: 0 });
    controls.start({
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 460, damping: 15, delay: 0.12 + index * 0.07 },
    });
    // origin 이 바뀔 때만 다시 계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  return (
    <motion.div ref={ref} animate={controls}>
      {children}
    </motion.div>
  );
}
