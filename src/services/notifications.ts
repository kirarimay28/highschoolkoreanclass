import type { User } from '@/types';
import { readJSON, writeJSON } from './storage';

/**
 * 앱 안 알림 (조용한 알림)
 * ─────────────────────────────────────────────
 * 푸시·소리·브라우저 알림은 절대 보내지 않습니다. 앱에 들어와 있을 때만
 * 헤더의 종 아이콘에 조용히 표시됩니다.
 *
 * 알림 "제공자(provider)"를 등록하는 구조라서, 게시판 답글·고쳐주세요 처리 상태 등도
 * registerNotificationProvider 로 붙이기만 하면 같은 목록에 나옵니다.
 * (제공자 등록: src/services/notificationProviders.ts)
 */

export interface AppNotification {
  id: string; // 같은 일에는 항상 같은 id (읽음 처리 기준)
  kind: string; // 'message' | 'message-reply' | …
  title: string;
  body?: string;
  link: string; // 누르면 이동할 주소
  createdAt: number;
  unread: boolean;
}

export type NotificationProvider = (user: User) => Promise<Omit<AppNotification, 'unread'>[]>;

const providers: NotificationProvider[] = [];
const CHANGED = 'hkc:notifications-changed';
const MAX_SEEN = 500;

export function registerNotificationProvider(provider: NotificationProvider): void {
  providers.push(provider);
}

const seenKey = (user: User) => `notificationsSeen:${user.id}`;
const loadSeen = (user: User) => new Set(readJSON<string[]>(seenKey(user), []));
function saveSeen(user: User, seen: Set<string>) {
  try {
    writeJSON(seenKey(user), [...seen].slice(-MAX_SEEN));
  } catch {
    /* 저장 불가 환경 */
  }
}

/** 최신순 알림 목록 */
export async function listNotifications(user: User): Promise<AppNotification[]> {
  const results = await Promise.allSettled(providers.map((p) => p(user)));
  const seen = loadSeen(user);
  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .map((n) => ({ ...n, unread: !seen.has(n.id) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function markNotificationsSeen(user: User, ids: string[]): void {
  const seen = loadSeen(user);
  ids.forEach((id) => seen.add(id));
  saveSeen(user, seen);
  notifyChanged();
}

/** 이 주소로 가는 알림을 모두 읽음 처리 (예: 쪽지를 열었을 때) */
export async function markNotificationsSeenByLink(user: User, link: string): Promise<void> {
  const list = await listNotifications(user);
  const ids = list.filter((n) => n.unread && n.link === link).map((n) => n.id);
  if (ids.length) markNotificationsSeen(user, ids);
}

/** 데이터가 바뀌었으니 종 아이콘을 다시 계산하라는 신호 (앱 안에서만) */
export function notifyChanged(): void {
  window.dispatchEvent(new Event(CHANGED));
}

export function onNotificationsChanged(cb: () => void): () => void {
  window.addEventListener(CHANGED, cb);
  return () => window.removeEventListener(CHANGED, cb);
}
