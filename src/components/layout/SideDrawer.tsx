import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { Icon } from '@/components/common/Icon';
import { IconTile } from '@/components/common/IconTile';
import { Crane } from '@/components/motifs/Crane';
import { Emblem } from '@/components/motifs/Emblem';
import { appConfig } from '@/config/app';
import { lobbyMenu } from '@/config/lobbyMenu';
import { loginRoles, roleLabels } from '@/config/roles';
import type { User } from '@/types';
import { cn } from '@/utils/format';

interface SideDrawerProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

/** 왼쪽에서 열리는 메뉴 서랍 — 프로필 카드 + 로비 메뉴(설정 파일 기반) */
export function SideDrawer({ open, user, onClose, onLogout }: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const menu = lobbyMenu.filter((m) => !m.roles || m.roles.includes(user.role));
  const roleIcon = loginRoles.find((r) => r.id === user.role)?.icon ?? 'user';

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] transition-colors',
      isActive ? 'bg-royal/[0.07] font-semibold text-royal' : 'text-ink hover:bg-royal/[0.04]',
    );

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="메뉴">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-md" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] animate-slide-in flex-col overflow-hidden bg-hanji-card shadow-2xl">
        {/* 상단: 앱 이름 + 프로필 카드 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-hanji-card via-royal-light/10 to-gold/25 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <Crane className="pointer-events-none absolute -right-4 top-2 w-32 text-royal/10" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-soft shadow-sm hover:text-royal"
            aria-label="메뉴 닫기"
          >
            <Icon name="close" size={18} />
          </button>

          <div className="relative flex items-center gap-3">
            <span className="glass flex h-14 w-14 items-center justify-center rounded-2xl border border-white shadow-soft">
              <Emblem size={40} />
            </span>
            <div>
              <p className="font-serif text-xl font-bold text-royal-deep">{appConfig.name}</p>
              <p className="text-xs text-royal/80">{appConfig.subtitle}</p>
            </div>
          </div>

          <div className="glass relative mt-5 rounded-card border border-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size={48} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5">
                  <span className="truncate font-serif text-lg font-bold text-royal-deep">{user.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-gold-dark">
                    <Icon name={roleIcon} size={13} />
                    {roleLabels[user.role]}
                  </span>
                </p>
                {user.meta && <p className="text-xs text-ink-soft">{user.meta}</p>}
              </div>
            </div>
            <div className="gold-rule my-3" />
            <p className="font-serif text-sm italic text-royal/80">“{appConfig.slogan}”</p>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLink to="/lobby" onClick={onClose} className={itemClass}>
            <IconTile icon="home" tone="gold" size="sm" />
            로비
          </NavLink>
          {menu.map((m) => (
            <NavLink key={m.id} to={m.path} onClick={onClose} className={itemClass}>
              <IconTile icon={m.icon} tone={m.tone} size="sm" />
              {m.title}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gold/20 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] text-ink-soft hover:bg-royal/[0.04] hover:text-royal"
          >
            <Icon name="logout" size={20} className="mx-2" />
            로그아웃
          </button>
        </div>
      </aside>
    </div>
  );
}
