import { useState, type FormEvent } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { loginTeacher } from '@/services/authService';
import type { LoginFormProps } from './loginForms';

export function TeacherLoginForm({ onSuccess }: LoginFormProps) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSuccess(await loginTeacher(staffId, password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="royal-label" htmlFor="staffId">교직원 ID</label>
        <input
          id="staffId"
          className="royal-input"
          autoComplete="username"
          placeholder="예: teacher01"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="royal-label" htmlFor="staffPw">비밀번호</label>
        <input
          id="staffPw"
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
