import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconTile } from '@/components/common/IconTile';
import { RoyalButton } from '@/components/common/RoyalButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { tutorialSteps } from '@/data/tutorial.data';
import { cn } from '@/utils/format';

export function TutorialPage() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const step = tutorialSteps[index];
  const isLast = index === tutorialSteps.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="튜토리얼" description="국어 교실 사용법을 차근차근 알아봐요." />

      <div className="mb-4 flex justify-center gap-1.5">
        {tutorialSteps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}단계`}
            className={cn('h-2 rounded-full border border-gold/60 transition-all', i === index ? 'w-8 bg-royal' : 'w-2', i < index && 'bg-gold')}
          />
        ))}
      </div>

      <article key={step.id} className="royal-card animate-fade-up p-6 text-center sm:p-10">
        <IconTile icon={step.icon} tone="royal" size="lg" className="mx-auto" />
        <p className="mt-4 font-serif text-sm text-gold-dark">
          {index + 1} / {tutorialSteps.length}
        </p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{step.title}</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
        {step.tip && <p className="mt-4 rounded-xl bg-gold/10 px-4 py-2.5 text-sm text-gold-dark">💡 {step.tip}</p>}
      </article>

      <div className="mt-5 flex justify-between">
        <RoyalButton variant="ghost" icon="back" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          이전
        </RoyalButton>
        {isLast ? (
          <RoyalButton icon="check" onClick={() => navigate('/lobby')}>
            시작하기
          </RoyalButton>
        ) : (
          <RoyalButton onClick={() => setIndex(index + 1)}>다음</RoyalButton>
        )}
      </div>
    </div>
  );
}
