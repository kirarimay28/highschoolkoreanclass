import { useState } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { professorQuiz, professorQuizText } from '@/config/professorQuiz';
import { isRemoteBackend } from '@/config/backend';
import { AuthError, loginProfessor } from '@/services/authService';
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
  const [successText, setSuccessText] = useState('');

  const [typed, setTyped] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [busy, setBusy] = useState(false);
  const question = professorQuiz[step];
  const isInput = question.choices.length === 0;

  const choose = async (choice: string) => {
    if (solved) return;
    const ok = isInput ? choice.replace(/\s/g, '') === question.answer.replace(/\s/g, '') : choice === question.answer;
    if (!ok) {
      setMessage(question.choiceMessages?.[choice] ?? question.wrongMessages[wrongCount % question.wrongMessages.length]);
      setWrongCount((n) => n + 1);
      setShaking(isInput ? 'input' : choice);
      return;
    }
    setMessage('');
    setWrongCount(0);
    if (step < professorQuiz.length - 1) {
      setStep(step + 1);
      return;
    }
    setSuccessText(question.choiceMessages?.[choice] ?? professorQuizText.success);
    // 서버 사용 시: 교수자용 선생님 계정 비밀번호를 한 번 더 받음
    if (isRemoteBackend) return setNeedPassword(true);
    setSolved(true);
    const user = await loginProfessor();
    setTimeout(() => onSuccess(user), SUCCESS_DELAY_MS);
  };

  const submitPassword = async () => {
    setPwError('');
    setBusy(true);
    try {
      const user = await loginProfessor(password);
      setSolved(true);
      setTimeout(() => onSuccess(user), SUCCESS_DELAY_MS);
    } catch (e) {
      setPwError(e instanceof AuthError ? e.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
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

      {needPassword ? (
        <form
          className="animate-fade-up space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (password && !busy) submitPassword();
          }}
        >
          <p className="text-center font-serif text-[15px] font-bold text-gold-dark">{successText}</p>
          <h3 className="text-center text-lg font-bold">교수자 계정 비밀번호</h3>
          <input
            type="password"
            className="royal-input text-center"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            aria-label="교수자 계정 비밀번호"
            autoComplete="current-password"
            autoFocus
          />
          <RoyalButton type="submit" fullWidth disabled={!password || busy || solved}>
            {busy ? '확인 중…' : '입장하기'}
          </RoyalButton>
          <p className="min-h-[1.5rem] text-center text-sm text-royal-light" aria-live="polite">
            {solved ? '입장합니다.' : pwError}
          </p>
        </form>
      ) : (
      <>
      <div key={question.id} className="animate-fade-up">
        <p className="mb-1 text-center font-serif text-sm text-gold-dark">제{step + 1}문</p>
        <h3 className="mb-5 text-center text-lg font-bold sm:text-xl">{question.question}</h3>

        {isInput ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) choose(typed);
            }}
          >
            <input
              className={cn('royal-input flex-1 text-center', shaking === 'input' && 'animate-shake')}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onAnimationEnd={() => setShaking(null)}
              placeholder={question.placeholder}
              aria-label={question.question}
              autoComplete="name"
              autoFocus
            />
            <RoyalButton type="submit" disabled={!typed.trim()}>
              확인
            </RoyalButton>
          </form>
        ) : (
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
        )}
      </div>

      <p
        className={cn(
          'mt-4 min-h-[1.5rem] text-center font-serif text-[15px]',
          solved ? 'font-bold text-gold-dark' : 'text-royal-light',
        )}
        aria-live="polite"
      >
        {solved ? successText : message}
      </p>
      </>
      )}
    </div>
  );
}
