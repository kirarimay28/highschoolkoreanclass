import { LayoutGroup } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { Icon } from '@/components/common/Icon';
import { RoyalButton } from '@/components/common/RoyalButton';
import { BackgroundDecor } from '@/components/motifs/BackgroundDecor';
import { Emblem } from '@/components/motifs/Emblem';
import { appConfig } from '@/config/app';
import { roleLabels } from '@/config/roles';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { SideDrawer } from './SideDrawer';

/** 로그인 후 모든 화면의 공통 틀: 유리 상단 바 + 메뉴 서랍 + 본문 */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(closeDrawer, [location.pathname, closeDrawer]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <BackgroundDecor crane={false} />

      <header className="glass sticky top-0 z-30 border-b border-white/80 shadow-[0_1px_0_rgb(var(--color-gold)/0.25)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-royal hover:bg-royal/[0.06]"
              aria-label="메뉴 열기"
            >
              <Icon name="menu" size={22} />
            </button>
            <Link to="/lobby" className="flex min-w-0 items-center gap-2.5">
              <Emblem size={34} />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-serif text-[11px] font-bold tracking-[0.2em] text-gold-dark">{appConfig.school}</p>
                <p className="truncate font-serif text-lg font-bold text-royal-deep">{appConfig.name}</p>
              </div>
            </Link>
          </div>
          {user && (
            <div className="flex items-center gap-1 sm:gap-3">
              <NotificationBell user={user} />
              <Avatar name={user.name} size={34} className="hidden sm:flex" />
              <div className="text-right leading-tight sm:text-left">
                <p className="max-w-[8rem] truncate text-sm font-semibold sm:max-w-none">{user.name}</p>
                <p className="text-xs text-gold-dark">
                  {roleLabels[user.role]}
                  {user.meta && <span className="hidden sm:inline"> · {user.meta}</span>}
                </p>
              </div>
              <RoyalButton variant="ghost" size="sm" icon="logout" onClick={handleLogout} aria-label="로그아웃">
                <span className="hidden sm:inline">로그아웃</span>
              </RoyalButton>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {/* 화면이 바뀌어도 같은 layoutId 메달이 이어지도록 */}
        <LayoutGroup>
          <Outlet />
        </LayoutGroup>
      </main>

      <footer className="py-6 text-center text-xs text-ink-faint">{appConfig.footer}</footer>

      {user && <SideDrawer open={drawerOpen} user={user} onClose={closeDrawer} onLogout={handleLogout} />}
    </div>
  );
}
