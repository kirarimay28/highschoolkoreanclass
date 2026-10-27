import { useState } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { professorQuiz, professorQuizText } from '@/config/professorQuiz';
import { loginProfessor } from '@/services/authService';
import { cn } from '@/utils/format';
import { GoldSparkles } from './GoldSparkles';
import type { LoginFormProps } from './loginForms';

const SUCCESS_DELAY_MS = 1500;

/** 교수자용 퀴즈 로그인 — 질문은 src/config/professorQuiz.ts 에서 관리 */
export function ProfessorQuizForm({ onSuccess }: LoginFormProps) {
  const [step, setStep] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [message, setMessage] = useState('');
  const [shaking, setShaking] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const question = professorQuiz[step];

  const choose = async (choice: string) => {
    if (solved) return;
    if (choice !== question.answer) {
      setMessage(question.wrongMessages[wrongCount % question.wrongMessages.length]);
      setWrongCount((n) => n + 1);
      setShaking(choice);
      return;
    }
    setMessage('');
    setWrongCount(0);
    if (step < professorQuiz.length - 1) {
      setStep(step + 1);
      return;
    }
    setSolved(true);
    const user = await loginProfessor();
    setTimeout(() => onSuccess(user), SUCCESS_DELAY_MS);
  };

  return (
    <div className="relative">
      {solved && <GoldSparkles />}
      <p className="mb-4 text-center text-sm text-ink-soft">{professorQuizText.intro}</p>

      {/* 진행 표시 */}
      <div className="mb-4 flex justify-center gap-2" aria-label={`${step + 1} / ${professorQuiz.length} 문항`}>
        {professorQuiz.map((q, i) => (
          <span
            key={q.id}
            className={cn(
              'h-2 w-8 rounded-full border border-gold/60 transition-colors',
              i < step || solved ? 'bg-gold' : i === step ? 'bg-royal' : 'bg-transparent',
            )}
          />
        ))}
      </div>

      <div key={question.id} className="animate-fade-up">
        <p className="mb-1 text-center font-serif text-sm text-gold-dark">제{step + 1}문</p>
        <h3 className="mb-5 text-center text-lg font-bold sm:text-xl">{question.question}</h3>

        <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${question.choices.length}, minmax(0, 1fr))` }}>
          {question.choices.map((choice) => (
            <RoyalButton
              key={choice}
              variant={solved && choice === question.answer ? 'primary' : 'secondary'}
              onClick={() => choose(choice)}
              onAnimationEnd={() => setShaking(null)}
              className={cn(
                'h-auto min-h-[3.25rem] whitespace-normal break-all px-2 py-3 text-[13px] leading-snug sm:px-3 sm:text-sm',
                shaking === choice && 'animate-shake border-royal-light',
              )}
            >
              {choice}
            </RoyalButton>
          ))}
        </div>
      </div>

      <p
        className={cn(
          'mt-4 min-h-[1.5rem] text-center font-serif text-[15px]',
          solved ? 'font-bold text-gold-dark' : 'text-royal-light',
        )}
        aria-live="polite"
      >
        {solved ? professorQuizText.success : message}
      </p>
    </div>
  );
}
