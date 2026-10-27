import type { Message, MessageAttachment, MessageCategory, MessageRecipient, MessageReply, MessageStatus, Role, User } from '@/types';
import { db, friendlyError, toMillis, unwrap } from '../supabase';

const BUCKET = 'message-files';

interface ReplyRow {
  id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  body: string;
  created_at: string;
}
interface MessageRow {
  id: string;
  sender_student_id: string;
  sender_name: string;
  recipient_id: string; // 함수 결과는 'teacher:uuid', 표 직접 조회는 uuid
  recipient_name?: string;
  category: MessageCategory;
  title: string;
  body: string;
  attachment: MessageAttachment | null;
  status: MessageStatus;
  created_at: string;
  replies?: ReplyRow[];
  message_replies?: ReplyRow[];
}

const toReply = (r: ReplyRow): MessageReply => ({
  id: r.id,
  authorId: r.author_id,
  authorName: r.author_name,
  authorRole: r.author_role,
  body: r.body,
  createdAt: toMillis(r.created_at),
});

function toMessage(r: MessageRow, recipientName?: string): Message {
  const replies = (r.replies ?? r.message_replies ?? []).map(toReply).sort((a, b) => a.createdAt - b.createdAt);
  return {
    id: r.id,
    senderId: `student:${r.sender_student_id}`,
    senderName: r.sender_name,
    recipientId: r.recipient_id.startsWith('teacher:') ? r.recipient_id : `teacher:${r.recipient_id}`,
    recipientName: `${r.recipient_name ?? recipientName ?? ''} 선생님`,
    category: r.category,
    title: r.title,
    body: r.body,
    attachment: r.attachment ?? undefined,
    status: r.status,
    createdAt: toMillis(r.created_at),
    replies,
  };
}

const studentId = (user: User) => user.id.replace(/^student:/, '');
const teacherUuid = (user: User) => user.id.replace(/^teacher:/, '');

export async function listRecipients(): Promise<MessageRecipient[]> {
  const rows = unwrap(await db().rpc('list_teachers')) as MessageRecipient[];
  return rows.map((r) => ({ ...r, name: `${r.name} 선생님` }));
}

export async function uploadAttachment(file: File): Promise<MessageAttachment> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const up = await db().storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (up.error) throw new Error(friendlyError(up.error));
  return { name: file.name, size: file.size, type: file.type, path };
}

export async function sendMessage(
  user: User,
  input: { recipientId: string; category: MessageCategory; title: string; body: string; attachment?: MessageAttachment },
): Promise<void> {
  unwrap(
    await db().rpc('student_send_message', {
      p_student_id: studentId(user),
      p_name: user.name,
      p_recipient: input.recipientId,
      p_category: input.category,
      p_title: input.title,
      p_body: input.body,
      p_attachment: input.attachment ?? null,
    }),
  );
}

export async function listMyMessages(user: User): Promise<Message[]> {
  const rows = unwrap(await db().rpc('student_list_messages', { p_student_id: studentId(user), p_name: user.name })) as MessageRow[];
  return rows.map((r) => toMessage(r));
}

export async function listInbox(user: User): Promise<Message[]> {
  const rows = unwrap(
    await db().from('messages').select('*, message_replies(*)').eq('recipient_id', teacherUuid(user)).order('created_at', { ascending: false }),
  ) as MessageRow[];
  return rows.map((r) => toMessage(r, user.name));
}

export async function setStatus(id: string, status: MessageStatus): Promise<void> {
  unwrap(await db().from('messages').update({ status }).eq('id', id));
}

export async function teacherReply(user: User, id: string, body: string): Promise<void> {
  unwrap(await db().from('message_replies').insert({ message_id: id, author_id: user.id, author_name: user.name, author_role: 'teacher', body }));
  await setStatus(id, 'replied');
}

export async function studentReply(user: User, id: string, body: string): Promise<void> {
  unwrap(await db().rpc('student_reply', { p_student_id: studentId(user), p_name: user.name, p_message_id: id, p_body: body }));
}

/** 선생님만: 첨부 파일 임시 내려받기 주소 (10분) */
export async function attachmentUrl(attachment: MessageAttachment): Promise<string | null> {
  if (!attachment.path) return null;
  const { data } = await db().storage.from(BUCKET).createSignedUrl(attachment.path, 600, { download: attachment.name });
  return data?.signedUrl ?? null;
}
