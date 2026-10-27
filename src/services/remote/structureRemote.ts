import type { User } from '@/types';
import type { Diagram, GalleryItem, ReadingPassage, StructureActivity, StructureMode, StructureNotes, StructureWork } from '@/types/structure';
import { db, toMillis, unwrap } from '../supabase';

const EMPTY: Diagram = { nodes: [], edges: [] };
const sid = (user: User) => user.id.replace(/^student:/, '');

interface PassageRow {
  id: string;
  title: string;
  field: string;
  paragraphs: string[];
  questions: string[];
  structure_type?: string | null;
  model_paragraph?: Diagram;
  model_content?: Diagram;
}
const toPassage = (r: PassageRow): ReadingPassage => ({
  id: r.id,
  title: r.title,
  field: r.field,
  paragraphs: r.paragraphs,
  questions: r.questions ?? [],
  structureType: r.structure_type ?? undefined,
  modelParagraph: r.model_paragraph ?? EMPTY,
  modelContent: r.model_content ?? EMPTY,
});

interface WorkRow {
  id: string;
  passage_id: string;
  activity: StructureActivity | 'notes';
  student_id: string;
  student_name: string;
  mode: StructureMode;
  draft: Diagram;
  notes: { highlights: string[]; answers: string[] } | null;
  first_submission: Diagram | null;
  first_at: string | null;
  revised: Diagram | null;
  revised_at: string | null;
  teacher_comment: string | null;
  comment_by: string | null;
  shared: boolean;
  share_name: boolean;
  updated_at: string;
}
const toWork = (r: WorkRow): StructureWork => ({
  id: r.id,
  passageId: r.passage_id,
  activity: r.activity as StructureActivity,
  studentId: `student:${r.student_id}`,
  studentName: r.student_name,
  mode: r.mode,
  draft: r.draft ?? EMPTY,
  firstSubmission: r.first_submission ?? undefined,
  firstAt: r.first_at ? toMillis(r.first_at) : undefined,
  revised: r.revised ?? undefined,
  revisedAt: r.revised_at ? toMillis(r.revised_at) : undefined,
  teacherComment: r.teacher_comment ?? undefined,
  commentBy: r.comment_by ?? undefined,
  shared: r.shared,
  shareName: r.share_name,
  updatedAt: toMillis(r.updated_at),
});

/** 선생님은 모범 구조도까지, 학생은 지문만 */
export async function listPassages(user: User): Promise<ReadingPassage[]> {
  if (user.role === 'student') return (unwrap(await db().rpc('list_passages_public')) as PassageRow[]).map(toPassage);
  return (unwrap(await db().from('reading_passages').select('*').order('updated_at')) as PassageRow[]).map(toPassage);
}

export async function savePassage(user: User, p: ReadingPassage): Promise<void> {
  unwrap(
    await db().from('reading_passages').upsert({
      id: p.id,
      title: p.title,
      field: p.field,
      paragraphs: p.paragraphs,
      questions: p.questions,
      structure_type: p.structureType ?? null,
      model_paragraph: p.modelParagraph,
      model_content: p.modelContent,
      updated_by: user.name,
      updated_at: new Date().toISOString(),
    }),
  );
}

async function studentRows(user: User, passageId: string): Promise<WorkRow[]> {
  return unwrap(await db().rpc('student_structure_list', { p_student_id: sid(user), p_name: user.name, p_passage: passageId })) as WorkRow[];
}

export async function getWork(user: User, passageId: string, activity: StructureActivity): Promise<StructureWork | undefined> {
  const row = (await studentRows(user, passageId)).find((r) => r.activity === activity);
  return row ? toWork(row) : undefined;
}

export async function getNotes(user: User, passageId: string): Promise<StructureNotes | undefined> {
  const row = (await studentRows(user, passageId)).find((r) => r.activity === 'notes');
  return row?.notes ? { passageId, studentId: user.id, highlights: row.notes.highlights ?? [], answers: row.notes.answers ?? [] } : undefined;
}

export async function saveDraft(user: User, passageId: string, activity: StructureActivity, mode: StructureMode, draft: Diagram): Promise<void> {
  unwrap(
    await db().rpc('student_structure_save', {
      p_student_id: sid(user), p_name: user.name, p_passage: passageId, p_activity: activity, p_mode: mode, p_draft: draft, p_notes: null,
    }),
  );
}

export async function saveNotes(user: User, notes: StructureNotes): Promise<void> {
  unwrap(
    await db().rpc('student_structure_save', {
      p_student_id: sid(user), p_name: user.name, p_passage: notes.passageId, p_activity: 'notes', p_mode: null, p_draft: null,
      p_notes: { highlights: notes.highlights, answers: notes.answers },
    }),
  );
}

export async function submit(user: User, passageId: string, activity: StructureActivity, diagram: Diagram): Promise<void> {
  unwrap(await db().rpc('student_structure_submit', { p_student_id: sid(user), p_name: user.name, p_passage: passageId, p_activity: activity, p_diagram: diagram }));
}

/** 제출한 학생에게만 모범 구조도. 표에 없는 기본 지문이면 model 이 null (앱 기본값 사용) */
export async function getModelForStudent(user: User, passageId: string, activity: StructureActivity): Promise<{ submitted: boolean; model: Diagram | null; structureType?: string }> {
  const res = unwrap(await db().rpc('student_structure_model', { p_student_id: sid(user), p_name: user.name, p_passage: passageId, p_activity: activity })) as {
    submitted: boolean;
    model?: Diagram | null;
    structure_type?: string | null;
  } | null;
  return { submitted: !!res?.submitted, model: res?.model ?? null, structureType: res?.structure_type ?? undefined };
}

export async function listWorks(passageId: string): Promise<StructureWork[]> {
  const rows = unwrap(await db().from('structure_works').select('*').eq('passage_id', passageId).neq('activity', 'notes').order('updated_at', { ascending: false })) as WorkRow[];
  return rows.map(toWork);
}

export async function updateWork(id: string, patch: { teacherComment?: string; commentBy?: string; shared?: boolean; shareName?: boolean }): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.teacherComment !== undefined) row.teacher_comment = patch.teacherComment;
  if (patch.commentBy !== undefined) row.comment_by = patch.commentBy;
  if (patch.shared !== undefined) row.shared = patch.shared;
  if (patch.shareName !== undefined) row.share_name = patch.shareName;
  unwrap(await db().from('structure_works').update(row).eq('id', id));
}

export async function listGallery(passageId: string): Promise<GalleryItem[]> {
  const rows = unwrap(await db().rpc('structure_gallery', { p_passage: passageId })) as {
    id: string;
    activity: StructureActivity;
    student_name: string | null;
    diagram: Diagram;
    teacher_comment: string | null;
  }[];
  return rows.map((r) => ({ id: r.id, activity: r.activity, studentName: r.student_name ?? undefined, diagram: r.diagram, teacherComment: r.teacher_comment ?? undefined }));
}
