import { isRemoteBackend } from '@/config/backend';
import { professorAccount } from '@/config/professorQuiz';
import { teachersMock } from '@/data/teachers.mock';
import type { Message, MessageContact, User } from '@/types';
import { notifyChanged } from './notifications';
import * as remote from './remote/messagesRemote';
import { listStudents } from './rosterService';
import { STORAGE_KEYS, createId, readJSON, writeJSON } from './storage';

/**
 * 선생님께 쪽지 — KoreanEdu 쪽지와 같은 구조 (상대별 대화, 읽음 표시)
 * - Supabase 가 설정되어 있으면 서버(supabase/messages.sql), 아니면 이 브라우저(localStorage)
 * - 푸시·소리 알림은 보내지 않음. 앱 안 알림은 notifications.ts 가 계산
 */

const load = () => readJSON<Message[]>(STORAGE_KEYS.messages, []);
const save = (list: Message[]) => writeJSON(STORAGE_KEYS.messages, list);

export interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: Message[]; // 오래된 순
  unreadCount: number;
}

/** 쪽지를 보낼 수 있는 상대. 학생 → 선생님만 / 선생님·교수자 → 학생과 다른 선생님 */
export async function listContacts(user: User): Promise<MessageContact[]> {
  if (isRemoteBackend) return remote.listContacts(user);
  const staff: MessageContact[] = [
    ...teachersMock.map((t) => ({ id: `teacher:${t.staffId}`, name: t.name, role: 'teacher' as const })),
    { id: `professor:${professorAccount.id}`, name: professorAccount.name, role: 'professor' },
  ];
  if (user.role === 'student') return staff;
  const students = (await listStudents()).map((s) => ({ id: `student:${s.studentId}`, name: s.name, role: 'student' as const }));
  return [...students, ...staff.filter((c) => c.id !== user.id)];
}

export async function listMessages(user: User): Promise<Message[]> {
  if (isRemoteBackend) return remote.listMessages(user);
  return load().filter((m) => m.senderId === user.id || m.receiverId === user.id);
}

/** 상대별로 묶은 대화 목록 (최근 대화가 위) */
export async function listConversations(user: User): Promise<Conversation[]> {
  const map = new Map<string, Conversation>();
  for (const msg of await listMessages(user)) {
    const mine = msg.senderId === user.id;
    const partnerId = mine ? msg.receiverId : msg.senderId;
    const partnerName = mine ? msg.receiverName : msg.senderName;
    if (!map.has(partnerId)) map.set(partnerId, { partnerId, partnerName, messages: [], unreadCount: 0 });
    const conv = map.get(partnerId)!;
    conv.messages.push(msg);
    if (!mine && !msg.read) conv.unreadCount++;
  }
  const list = [...map.values()];
  list.forEach((c) => c.messages.sort((a, b) => a.createdAt - b.createdAt));
  return list.sort((a, b) => (b.messages.at(-1)?.createdAt ?? 0) - (a.messages.at(-1)?.createdAt ?? 0));
}

export async function countUnread(user: User): Promise<number> {
  return (await listMessages(user)).filter((m) => m.receiverId === user.id && !m.read).length;
}

/** 여러 명에게 한 번에 보낼 수 있음 */
export async function sendMessage(user: User, recipients: MessageContact[], content: string): Promise<void> {
  if (isRemoteBackend) {
    for (const to of recipients) await remote.send(user, to, content);
  } else {
    const now = Date.now();
    save([
      ...load(),
      ...recipients.map((to) => ({
        id: createId('m_'),
        senderId: user.id,
        senderName: user.name,
        receiverId: to.id,
        receiverName: to.name,
        content,
        createdAt: now,
        read: false,
      })),
    ]);
  }
  notifyChanged();
}

/** 대화를 열면 상대가 보낸 쪽지를 모두 읽음 처리 */
export async function markConversationRead(user: User, partnerId: string): Promise<void> {
  if (isRemoteBackend) await remote.markRead(user, partnerId);
  else save(load().map((m) => (m.receiverId === user.id && m.senderId === partnerId ? { ...m, read: true } : m)));
  notifyChanged();
}

/** 내가 보낸 쪽지 지우기 */
export async function deleteMessage(user: User, id: string): Promise<void> {
  if (isRemoteBackend) await remote.remove(user, id);
  else save(load().filter((m) => !(m.id === id && m.senderId === user.id)));
  notifyChanged();
}
