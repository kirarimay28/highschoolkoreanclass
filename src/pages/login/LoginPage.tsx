import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { Emblem } from '@/components/motifs/Emblem';
import { appConfig } from '@/config/app';
import { loginRoles } from '@/config/roles';
import { useAuth } from '@/context/AuthContext';
import type { Role, User } from '@/types';
import { cn } from '@/utils/format';
import { loginForms } from './loginForms';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<Role>(loginRoles[0]?.id ?? 'student');

  if (user) return <Navigate to="/lobby" replace />;

  const handleSuccess = (next: User) => {
    signIn(next);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/login' ? from : '/lobby', { replace: true });
  };

  const Form = loginForms[role];
  const current = loginRoles.find((r) => r.id === role);

  return (
    <div className="cloud-pattern relative flex min-h-dvh flex-col items-center px-4 pb-10">
      {/* 상단 대홍 띠 */}
      <div className="absolute inset-x-0 top-0 h-36 bg-royal sm:h-44">
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-gold-dark via-gold-light to-gold-dark" />
      </div>

      <div className="relative z-10 mt-10 flex flex-col items-center text-center sm:mt-14">
        <div className="rounded-full bg-hanji p-1.5 shadow-glow">
          <Emblem size={120} animated />
        </div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{appConfig.name}</h1>
        <p className="mt-1 font-serif text-sm tracking-[0.3em] text-gold-dark">{appConfig.hanja}</p>
        <p className="mt-1 text-sm text-ink-soft">{appConfig.subtitle}</p>
      </div>

      <div className="relative z-10 mt-6 w-full max-w-xl">
        {/* 역할 선택 */}
        <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${loginRoles.length}, minmax(0, 1fr))` }}>
          {loginRoles.map((r) => {
            const selected = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-collar border px-2 py-3 transition-all duration-200 sm:py-4',
                  selected
                    ? 'border-gold bg-royal text-hanji shadow-glow'
                    : 'border-gold/40 bg-hanji-card text-royal hover:border-gold hover:shadow-glow',
                )}
              >
                <Icon name={r.icon} size={22} />
                <span className="font-serif text-[15px] font-bold sm:text-base">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* 입력 폼 */}
        <section key={role} className="royal-card mt-4 animate-fade-up p-5 sm:p-7">
          {current && (
            <>
              <h2 className="text-center text-xl font-bold">{current.label} 입장</h2>
              <p className="mt-1 text-center text-sm text-ink-soft">{current.description}</p>
              <CloudDivider className="my-4" />
            </>
          )}
          <Form onSuccess={handleSuccess} />
        </section>
      </div>
    </div>
  );
}
