import { isRemoteBackend } from '@/config/backend';
import { MESSAGE_ATTACHMENT_INLINE_MAX, MESSAGE_ATTACHMENT_MAX, isPending } from '@/config/messages';
import { can } from '@/config/permissions';
import { professorAccount } from '@/config/professorQuiz';
import { teachersMock } from '@/data/teachers.mock';
import type { Message, MessageAttachment, MessageCategory, MessageRecipient, MessageStatus, User } from '@/types';
import { notifyChanged } from './notifications';
import * as remote from './remote/messagesRemote';
import { STORAGE_KEYS, createId, readJSON, writeJSON } from './storage';

/**
 * 선생님께 쪽지
 * - Supabase 가 설정되어 있으면 서버(supabase/messages.sql), 아니면 이 브라우저(localStorage)
 * - 어떤 경우에도 푸시·소리 알림은 보내지 않음. 앱 안 알림은 notifications.ts 가 계산
 */

export class MessageError extends Error {}

const load = () => readJSON<Message[]>(STORAGE_KEYS.messages, []);
const save = (list: Message[]) => writeJSON(STORAGE_KEYS.messages, list);

/** 받는 선생님 목록 (로컬: mock 교사 + 교수님 / 서버: teachers 표) */
export async function listRecipients(): Promise<MessageRecipient[]> {
  if (isRemoteBackend) return remote.listRecipients();
  return [
    ...teachersMock.map((t) => ({ id: `teacher:${t.staffId}`, name: `${t.name} 선생님` })),
    { id: `professor:${professorAccount.id}`, name: professorAccount.name },
  ];
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface NewMessageInput {
  recipientId: string;
  recipientName: string;
  category: MessageCategory;
  title: string;
  body: string;
  file?: File | null;
}

/** 학생 → 선생님 (항상 실명) */
export async function sendMessage(user: User, input: NewMessageInput): Promise<void> {
  if (input.file && input.file.size > MESSAGE_ATTACHMENT_MAX) throw new MessageError('첨부 파일은 10MB까지 보낼 수 있어요.');
  if (isRemoteBackend) {
    const attachment = input.file ? await remote.uploadAttachment(input.file) : undefined;
    await remote.sendMessage(user, { ...input, attachment });
    notifyChanged();
    return;
  }
  let attachment: MessageAttachment | undefined;
  if (input.file) {
    attachment = { name: input.file.name, size: input.file.size, type: input.file.type };
    if (input.file.size <= MESSAGE_ATTACHMENT_INLINE_MAX) attachment.dataUrl = await readAsDataUrl(input.file);
  }
  const message: Message = {
    id: createId('m_'),
    senderId: user.id,
    senderName: user.name,
    senderMeta: user.meta,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    category: input.category,
    title: input.title,
    body: input.body,
    attachment,
    status: 'sent',
    createdAt: Date.now(),
    replies: [],
  };
  save([message, ...load()]);
  notifyChanged();
}

/** 학생: 내가 보낸 쪽지 / 선생님·교수자: 받은 쪽지 */
export async function listMessages(user: User): Promise<Message[]> {
  const inbox = can(user.role, 'receiveMessages');
  if (isRemoteBackend) {
    if (inbox) return remote.listInbox(user);
    if (user.role === 'student') return remote.listMyMessages(user);
    return [];
  }
  return load()
    .filter((m) => (inbox ? m.recipientId === user.id : m.senderId === user.id))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMessage(user: User, id: string): Promise<Message | undefined> {
  return (await listMessages(user)).find((m) => m.id === id);
}

async function setStatus(id: string, status: MessageStatus) {
  if (isRemoteBackend) await remote.setStatus(id, status);
  else save(load().map((m) => (m.id === id ? { ...m, status } : m)));
  notifyChanged();
}

/** 선생님이 쪽지를 열면 자동으로 '읽음' */
export async function markRead(message: Message): Promise<void> {
  if (message.status === 'sent') await setStatus(message.id, 'read');
}

/** 답장 없이 처리 완료 */
export async function markDone(message: Message): Promise<void> {
  await setStatus(message.id, 'done');
}

/** 답장 — 선생님이 쓰면 '답장 완료', 학생이 이어 쓰면 다시 '새 쪽지' */
export async function replyMessage(user: User, message: Message, body: string): Promise<void> {
  const fromTeacher = can(user.role, 'receiveMessages');
  if (isRemoteBackend) {
    if (fromTeacher) await remote.teacherReply(user, message.id, body);
    else await remote.studentReply(user, message.id, body);
    notifyChanged();
    return;
  }
  const reply = { id: createId('r_'), authorId: user.id, authorName: user.name, authorRole: user.role, body, createdAt: Date.now() };
  save(
    load().map((m) =>
      m.id === message.id ? { ...m, replies: [...m.replies, reply], status: (fromTeacher ? 'replied' : 'sent') as MessageStatus } : m,
    ),
  );
  notifyChanged();
}

/** 첨부 파일 내려받기 주소 (없으면 null) */
export async function getAttachmentUrl(message: Message): Promise<string | null> {
  const a = message.attachment;
  if (!a) return null;
  if (a.dataUrl) return a.dataUrl;
  if (isRemoteBackend && a.path) return remote.attachmentUrl(a);
  return null;
}

/** 답장을 기다리는 쪽지 (오래된 순) */
export async function listPending(user: User): Promise<Message[]> {
  if (!can(user.role, 'receiveMessages')) return [];
  return (await listMessages(user)).filter((m) => isPending(m.status)).sort((a, b) => a.createdAt - b.createdAt);
}
