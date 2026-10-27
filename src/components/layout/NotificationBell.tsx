import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { listNotifications, markNotificationsSeen, onNotificationsChanged, type AppNotification } from '@/services/notifications';
import type { User } from '@/types';
import { formatRelative } from '@/utils/date';
import { cn } from '@/utils/format';

/** 앱 안에서 다시 확인하는 간격 — 소리·푸시 없이 배지만 갱신 */
const REFRESH_MS = 60_000;

/** 헤더 종 아이콘: 읽지 않은 알림이 있으면 빨간 점만 조용히 표시 */
export function NotificationBell({ user }: { user: User }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    listNotifications(user).then(setItems).catch(() => undefined);
  }, [user]);

  useEffect(refresh, [refresh, location.pathname]);
  useEffect(() => onNotificationsChanged(refresh), [refresh]);
  useEffect(() => {
    const id = window.setInterval(() => document.visibilityState === 'visible' && refresh(), REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // 바깥을 누르거나 Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = items.filter((n) => n.unread);

  const openItem = (n: AppNotification) => {
    markNotificationsSeen(user, [n.id]);
    setOpen(false);
    navigate(n.link);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread.length ? `알림 ${unread.length}개` : '알림'}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-royal hover:bg-royal/[0.06]"
      >
        <Icon name="bell" size={21} />
        {unread.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-royal-light ring-2 ring-hanji-card" aria-hidden />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="royal-card absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden bg-hanji-card/95 p-0"
            role="dialog"
            aria-label="알림"
          >
            <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
              <p className="font-serif font-bold">알림</p>
              {unread.length > 0 && (
                <button type="button" className="text-xs text-ink-soft hover:text-royal" onClick={() => markNotificationsSeen(user, unread.map((n) => n.id))}>
                  모두 읽음
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.slice(0, 30).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={cn('flex w-full gap-3 px-4 py-3 text-left hover:bg-gold/10', n.unread ? 'bg-royal/[0.03]' : 'opacity-70')}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-royal-light' : 'bg-transparent')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-ink-soft">{n.body}</span>}
                      <span className="text-[11px] text-ink-faint">{formatRelative(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
              {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-faint">새 알림이 없어요</li>}
            </ul>
            <p className="border-t border-gold/20 px-4 py-2 text-[11px] text-ink-faint">알림은 소리 없이 앱 안에서만 보여요.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
