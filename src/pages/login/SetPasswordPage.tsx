import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoyalButton } from '@/components/common/RoyalButton';
import { BackgroundDecor } from '@/components/motifs/BackgroundDecor';
import { Emblem } from '@/components/motifs/Emblem';
import { appConfig } from '@/config/app';
import { useAuth } from '@/context/AuthContext';
import { completePasswordSetup } from '@/services/authService';

const MIN_LENGTH = 8;

/** 선생님 초대 메일 / 비밀번호 재설정 메일의 링크로 들어왔을 때 */
export function SetPasswordPage({ type, onDone }: { type: 'invite' | 'recovery'; onDone: () => void }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`비밀번호는 ${MIN_LENGTH}자 이상으로 정해 주세요.`);
    if (password !== confirm) return setError('두 비밀번호가 서로 달라요.');
    setBusy(true);
    setError('');
    try {
      signIn(await completePasswordSetup(password));
      onDone();
      navigate('/lobby', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-4 pb-12">
      <BackgroundDecor />
      <div className="mt-14 flex flex-col items-center text-center">
        <span className="glass flex h-24 w-24 items-center justify-center rounded-tile border border-white shadow-soft">
          <Emblem size={70} />
        </span>
        <p className="mt-5 font-serif text-sm font-bold tracking-[0.3em] text-gold-dark">{appConfig.school}</p>
        <h1 className="title-gradient mt-1 pb-1 text-3xl font-bold">{type === 'invite' ? '선생님 계정 만들기' : '비밀번호 다시 정하기'}</h1>
        <p className="mt-1 text-sm text-ink-soft">앞으로 로그인할 때 쓸 비밀번호를 정해 주세요.</p>
      </div>
      <form onSubmit={submit} className="royal-card mt-8 w-full max-w-md space-y-4 p-5 sm:p-6">
        <div>
          <label className="royal-label" htmlFor="newPw">새 비밀번호 ({MIN_LENGTH}자 이상)</label>
          <input id="newPw" type="password" autoComplete="new-password" className="royal-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="royal-label" htmlFor="newPw2">한 번 더 입력</label>
          <input id="newPw2" type="password" autoComplete="new-password" className="royal-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-royal-light">{error}</p>}
        <RoyalButton type="submit" size="lg" fullWidth disabled={busy}>
          저장하고 입장하기
        </RoyalButton>
      </form>
    </div>
  );
}
