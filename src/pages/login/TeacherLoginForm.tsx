import { useState, type FormEvent } from 'react';
import { RoyalButton } from '@/components/common/RoyalButton';
import { isRemoteBackend } from '@/config/backend';
import { loginTeacher, requestPasswordReset } from '@/services/authService';
import type { LoginFormProps } from './loginForms';

export function TeacherLoginForm({ onSuccess }: LoginFormProps) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const forgot = async () => {
    setError('');
    setNotice('');
    if (!staffId.trim()) return setError('위에 이메일을 먼저 입력해 주세요.');
    try {
      await requestPasswordReset(staffId);
      setNotice('비밀번호를 다시 정하는 메일을 보냈어요. 메일의 링크를 눌러 주세요.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

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
        <label className="royal-label" htmlFor="staffId">{isRemoteBackend ? '이메일' : '교직원 ID'}</label>
        <input
          id="staffId"
          type={isRemoteBackend ? 'email' : 'text'}
          className="royal-input"
          autoComplete="username"
          placeholder={isRemoteBackend ? '예: teacher@school.kr' : '예: teacher01'}
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
      {notice && <p className="text-sm text-success">{notice}</p>}
      <RoyalButton type="submit" size="lg" fullWidth disabled={busy}>
        입장하기
      </RoyalButton>
      {isRemoteBackend && (
        <button type="button" onClick={forgot} className="mx-auto block py-1 text-sm text-ink-soft hover:text-royal">
          비밀번호를 잊으셨나요?
        </button>
      )}
    </form>
  );
}
