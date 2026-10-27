import { useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { circled, sentenceKey, splitSentences } from '@/data/readingPassages';
import type { ReadingPassage } from '@/types/structure';
import { cn } from '@/utils/format';
import { SENTENCE_MIME, type DraggedSentence } from './StructureBoard';

interface PassageViewProps {
  passage: ReadingPassage;
  highlights: Set<string>;
  onHighlight: (keys: string[], on: boolean) => void;
  /** 형광펜 문장을 작업판에 넣기 (모바일·키보드용) */
  onAddToBoard?: (s: DraggedSentence) => void;
  readOnly?: boolean;
}

/**
 * 지문 보기 — 문장을 드래그(글자 선택)하면 형광펜, 형광펜 문장은 작업판으로 끌어다 놓을 수 있음.
 * 형광펜 문장을 누르면 [작업판에 추가] / [형광펜 지우기] 메뉴.
 */
export function PassageView({ passage, highlights, onHighlight, onAddToBoard, readOnly }: PassageViewProps) {
  const box = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const sentenceAt = (key: string): DraggedSentence => {
    const [p, s] = key.split('-').map(Number);
    return { key, paragraph: p, text: splitSentences(passage.paragraphs[p - 1])[s - 1] };
  };

  // 글자를 드래그해 고르면 → 걸친 문장 모두 형광펜
  const onSelectEnd = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !box.current) return;
    const range = sel.getRangeAt(0);
    const keys = [...box.current.querySelectorAll<HTMLElement>('[data-sentence]')]
      .filter((el) => range.intersectsNode(el))
      .map((el) => el.dataset.sentence!);
    if (keys.length) {
      onHighlight(keys, true);
      sel.removeAllRanges();
    }
  };

  return (
    <div ref={box} className="space-y-4 text-[15px] leading-[1.95] text-ink" onMouseUp={onSelectEnd} onTouchEnd={() => setTimeout(onSelectEnd, 0)}>
      <div className="flex items-baseline gap-2">
        <h2 className="font-serif text-xl font-bold">{passage.title}</h2>
        <span className="rounded-full bg-indigo/10 px-2 py-0.5 text-xs font-medium text-indigo">{passage.field}</span>
      </div>
      {!readOnly && (
        <p className="flex items-start gap-1.5 rounded-xl bg-gold/10 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          <Icon name="sparkles" size={14} className="mt-0.5 shrink-0 text-gold-dark" />
          <span>
            문장을 <b>드래그해 고르면 형광펜</b>이 칠해져요. 형광펜 문장을 <b>작업판으로 끌어다 놓거나</b>, 눌러서 <b>작업판에 추가</b>할 수 있어요.
          </span>
        </p>
      )}
      {passage.paragraphs.map((para, pi) => (
        <p key={pi} className="relative pl-7">
          <span className="absolute left-0 top-0 font-serif text-lg font-bold text-royal">{circled(pi + 1)}</span>
          {splitSentences(para).map((sentence, si) => {
            const key = sentenceKey(pi + 1, si + 1);
            const on = highlights.has(key);
            return (
              <span key={key} className="relative">
                <span
                  data-sentence={key}
                  draggable={on && !readOnly}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SENTENCE_MIME, JSON.stringify(sentenceAt(key)));
                    e.dataTransfer.setData('text/plain', sentence);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => on && !readOnly && setMenu(menu === key ? null : key)}
                  className={cn(
                    'rounded-sm transition-colors',
                    on && 'cursor-grab bg-[linear-gradient(transparent_35%,rgb(var(--color-gold-light)/0.75)_35%)] active:cursor-grabbing',
                  )}
                >
                  {renderMarks(sentence)}
                </span>
                {menu === key && (
                  <span className="absolute left-0 top-full z-20 mt-1 flex gap-1 whitespace-nowrap rounded-xl border border-gold/40 bg-hanji-card p-1 text-xs shadow-soft">
                    {onAddToBoard && (
                      <button type="button" className="rounded-lg px-2 py-1 font-semibold text-royal hover:bg-gold/15" onClick={() => (onAddToBoard(sentenceAt(key)), setMenu(null))}>
                        작업판에 추가
                      </button>
                    )}
                    <button type="button" className="rounded-lg px-2 py-1 text-ink-soft hover:bg-gold/15" onClick={() => (onHighlight([key], false), setMenu(null))}>
                      형광펜 지우기
                    </button>
                  </span>
                )}{' '}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

/** ㉠ 같은 표시는 눈에 띄게 */
function renderMarks(text: string) {
  return text.split(/([㉠-㉭])/).map((part, i) =>
    /^[㉠-㉭]$/.test(part) ? (
      <span key={i} className="font-bold text-royal">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
