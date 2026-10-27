import type { RegisteredStudent, User } from '@/types';
import { db, toMillis, unwrap } from '../supabase';

interface StudentRow {
  student_id: string;
  name: string;
  registered_at: string;
  registered_by: string;
}

const toStudent = (r: StudentRow): RegisteredStudent => ({
  studentId: r.student_id,
  name: r.name,
  registeredAt: toMillis(r.registered_at),
  registeredBy: r.registered_by,
});

export async function listStudents(): Promise<RegisteredStudent[]> {
  const rows = unwrap(await db().from('students').select('*').order('student_id'));
  return (rows as StudentRow[]).map(toStudent);
}

export async function findStudent(name: string, studentId: string): Promise<{ studentId: string; name: string } | undefined> {
  const rows = unwrap(await db().rpc('student_login', { p_name: name, p_student_id: studentId }));
  const row = (rows as { student_id: string; name: string }[])[0];
  return row ? { studentId: row.student_id, name: row.name } : undefined;
}

export async function getStudentName(studentId: string): Promise<string | undefined> {
  const rows = unwrap(await db().from('students').select('name').eq('student_id', studentId));
  return (rows as { name: string }[])[0]?.name;
}

export async function insertStudent(teacher: User, name: string, studentId: string): Promise<RegisteredStudent> {
  const row = unwrap(
    await db().from('students').insert({ student_id: studentId, name, registered_by: teacher.name }).select().single(),
  );
  return toStudent(row as StudentRow);
}

export async function removeStudent(studentId: string): Promise<void> {
  unwrap(await db().from('students').delete().eq('student_id', studentId));
}
