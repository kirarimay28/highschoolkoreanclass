import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { BackgroundDecor } from '@/components/motifs/BackgroundDecor';
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
    <div className="relative isolate flex min-h-dvh flex-col items-center px-4 pb-12">
      <BackgroundDecor />

      {/* 엠블럼 · 제목 */}
      <div className="mt-12 flex animate-fade-up flex-col items-center text-center sm:mt-16">
        <span className="glass flex h-28 w-28 items-center justify-center rounded-tile border border-white shadow-soft sm:h-32 sm:w-32">
          <Emblem size={84} animated />
        </span>
        <h1 className="mt-6 flex flex-col items-center">
          <span className="font-serif text-base font-bold tracking-[0.3em] text-gold-dark sm:text-lg">{appConfig.school}</span>
          <span className="title-shimmer mt-1 pb-1 font-display text-5xl font-black tracking-tight drop-shadow-[0_4px_14px_rgb(var(--color-gold)/0.45)] sm:text-6xl">
            {appConfig.name}
          </span>
        </h1>
        <p className="mt-1 text-balance font-serif text-xs tracking-[0.3em] text-gold-dark sm:text-sm sm:tracking-[0.35em]">
          {appConfig.hanja}
        </p>
        <span className="my-3 h-1.5 w-1.5 rounded-full bg-royal-light/70" aria-hidden />
        <p className="text-[15px] font-medium tracking-[0.15em] text-royal/80">{appConfig.slogan}</p>
      </div>

      {/* 역할 선택 + 입력 폼 */}
      <section className="royal-card mt-8 w-full max-w-lg p-4 sm:p-6">
        <p className="mb-3 text-center text-sm text-ink-soft">역할을 골라 입장하세요</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${loginRoles.length}, minmax(0, 1fr))` }}>
          {loginRoles.map((r) => {
            const selected = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all duration-200',
                  selected
                    ? 'border-gold/60 bg-gradient-to-b from-royal-light to-royal text-hanji shadow-button'
                    : 'border-white bg-white/60 text-royal hover:bg-white hover:shadow-glow',
                )}
              >
                <Icon name={r.icon} size={22} />
                <span className="font-serif text-[15px] font-bold">{r.label}</span>
              </button>
            );
          })}
        </div>

        <div key={role} className="mt-5 animate-fade-up rounded-card bg-white/50 p-4 ring-1 ring-inset ring-white sm:p-5">
          {current && (
            <>
              <h2 className="text-center text-lg font-bold text-royal-deep">{current.label} 입장</h2>
              <p className="mt-0.5 text-center text-sm text-ink-soft">{current.description}</p>
              <CloudDivider className="my-4" />
            </>
          )}
          <Form onSuccess={handleSuccess} />
        </div>
      </section>
    </div>
  );
}
