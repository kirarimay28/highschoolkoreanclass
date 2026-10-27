import { Link, Outlet, useNavigate } from 'react-router-dom';
import { RoyalButton } from '@/components/common/RoyalButton';
import { Emblem } from '@/components/motifs/Emblem';
import { appConfig } from '@/config/app';
import { roleLabels } from '@/config/roles';
import { useAuth } from '@/context/AuthContext';

/** 로그인 후 모든 화면의 공통 틀: 상단 바 + 본문 */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="cloud-pattern flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-gold/40 bg-royal text-hanji shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/lobby" className="flex min-w-0 items-center gap-2.5">
            <Emblem size={38} />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-serif text-lg font-bold">{appConfig.name}</p>
              <p className="hidden text-xs text-gold-light/90 sm:block">{appConfig.subtitle}</p>
            </div>
          </Link>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right leading-tight">
                <p className="max-w-[9rem] truncate text-sm font-semibold sm:max-w-none">{user.name}</p>
                <p className="text-xs text-gold-light">
                  {roleLabels[user.role]}
                  {user.meta && <span className="hidden sm:inline"> · {user.meta}</span>}
                </p>
              </div>
              <RoyalButton
                variant="ghost"
                size="sm"
                icon="logout"
                onClick={handleLogout}
                className="text-hanji hover:bg-hanji/10"
                aria-label="로그아웃"
              >
                <span className="hidden sm:inline">로그아웃</span>
              </RoyalButton>
            </div>
          )}
        </div>
        <div className="h-[3px] bg-gradient-to-r from-gold-dark via-gold-light to-gold-dark" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-ink-faint">{appConfig.footer}</footer>
    </div>
  );
}
