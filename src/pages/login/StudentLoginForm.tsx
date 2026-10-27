import { useState, type FormEvent } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { loginStudent } from '@/services/authService';
import type { LoginFormProps } from './loginForms';

export function StudentLoginForm({ onSuccess }: LoginFormProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSuccess(await loginStudent(studentId, password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="royal-label" htmlFor="studentId">학번</label>
        <input
          id="studentId"
          className="royal-input"
          inputMode="numeric"
          autoComplete="username"
          placeholder="예: 20301"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="royal-label" htmlFor="studentPw">비밀번호</label>
        <input
          id="studentPw"
          type="password"
          className="royal-input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-royal-light">{error}</p>}
      <RoyalButton type="submit" size="lg" fullWidth disabled={busy}>
        입장하기
      </RoyalButton>
    </form>
  );
}
