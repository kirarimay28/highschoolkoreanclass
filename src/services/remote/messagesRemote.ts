import type { Message, MessageContact, User } from '@/types';
import { db, toMillis, unwrap } from '../supabase';

interface Row {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  created_at: string;
  read: boolean;
}
const toMessage = (r: Row): Message => ({
  id: r.id,
  senderId: r.sender_id,
  senderName: r.sender_name,
  receiverId: r.receiver_id,
  receiverName: r.receiver_name,
  content: r.content,
  createdAt: toMillis(r.created_at),
  read: r.read,
});

const sid = (user: User) => user.id.replace(/^student:/, '');
const isStudent = (user: User) => user.role === 'student';

export async function listContacts(user: User): Promise<MessageContact[]> {
  const teachers = (unwrap(await db().rpc('list_teachers')) as { id: string; name: string }[]).map((t) => ({ ...t, role: 'teacher' as const }));
  if (isStudent(user)) return teachers;
  const students = unwrap(await db().from('students').select('student_id, name').order('student_id')) as { student_id: string; name: string }[];
  return [...students.map((s) => ({ id: `student:${s.student_id}`, name: s.name, role: 'student' as const })), ...teachers.filter((t) => t.id !== user.id)];
}

export async function listMessages(user: User): Promise<Message[]> {
  if (isStudent(user)) {
    return (unwrap(await db().rpc('student_dm_list', { p_student_id: sid(user), p_name: user.name })) as Row[]).map(toMessage);
  }
  return (unwrap(await db().from('direct_messages').select('*').order('created_at')) as Row[]).map(toMessage);
}

export async function send(user: User, to: MessageContact, content: string): Promise<void> {
  if (isStudent(user)) {
    unwrap(await db().rpc('student_dm_send', { p_student_id: sid(user), p_name: user.name, p_receiver: to.id, p_content: content }));
    return;
  }
  unwrap(
    await db().from('direct_messages').insert({ sender_id: user.id, sender_name: user.name, receiver_id: to.id, receiver_name: to.name, content }),
  );
}

export async function markRead(user: User, partnerId: string): Promise<void> {
  if (isStudent(user)) {
    unwrap(await db().rpc('student_dm_mark_read', { p_student_id: sid(user), p_name: user.name, p_partner: partnerId }));
    return;
  }
  unwrap(await db().from('direct_messages').update({ read: true }).eq('receiver_id', user.id).eq('sender_id', partnerId).eq('read', false));
}

export async function remove(user: User, id: string): Promise<void> {
  if (isStudent(user)) {
    unwrap(await db().rpc('student_dm_delete', { p_student_id: sid(user), p_name: user.name, p_id: id }));
    return;
  }
  unwrap(await db().from('direct_messages').delete().eq('id', id));
}
