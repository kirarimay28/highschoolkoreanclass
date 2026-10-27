import { useState, type FormEvent } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { loginStudent } from '@/services/authService';
import type { LoginFormProps } from './loginForms';

export function StudentLoginForm({ onSuccess }: LoginFormProps) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSuccess(await loginStudent(name, studentId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="royal-label" htmlFor="studentName">이름</label>
        <input
          id="studentName"
          className="royal-input"
          autoComplete="name"
          placeholder="예: 김하늘"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
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
      {error && <p className="text-sm text-royal-light">{error}</p>}
      <RoyalButton type="submit" size="lg" fullWidth disabled={busy}>
        입장하기
      </RoyalButton>
    </form>
  );
}
