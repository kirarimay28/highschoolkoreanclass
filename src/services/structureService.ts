import { isRemoteBackend } from '@/config/backend';
import { defaultPassages } from '@/data/readingPassages';
import type { User } from '@/types';
import type { Diagram, GalleryItem, ReadingPassage, StructureActivity, StructureMode, StructureNotes, StructureWork } from '@/types/structure';
import * as remote from './remote/structureRemote';
import { STORAGE_KEYS, createId, readJSON, writeJSON } from './storage';

/**
 * DIY 구조도 저장
 * - Supabase 가 설정되어 있으면 서버(supabase/structure.sql), 아니면 이 브라우저(localStorage)
 * - 지문: 기본 지문(src/data/readingPassages.ts) 위에 선생님이 저장한 지문이 덮어씀
 */

const EMPTY: Diagram = { nodes: [], edges: [] };
const loadPassages = () => readJSON<ReadingPassage[]>(STORAGE_KEYS.passages, []);
const loadWorks = () => readJSON<StructureWork[]>(STORAGE_KEYS.structureWorks, []);
const saveWorks = (w: StructureWork[]) => writeJSON(STORAGE_KEYS.structureWorks, w);
const loadNotes = () => readJSON<StructureNotes[]>(STORAGE_KEYS.structureNotes, []);

function merge(saved: ReadingPassage[]): ReadingPassage[] {
  const byId = new Map(defaultPassages.map((p) => [p.id, p]));
  for (const p of saved) {
    const base = byId.get(p.id);
    // 학생용 서버 목록에는 모범 구조도가 비어 있으므로 기본값을 쓰지 않도록 그대로 둠
    byId.set(p.id, base ? { ...base, ...p, questions: p.questions?.length ? p.questions : base.questions } : p);
  }
  return [...byId.values()];
}

export async function listPassages(user: User): Promise<ReadingPassage[]> {
  if (isRemoteBackend) return merge(await remote.listPassages(user));
  return merge(loadPassages());
}

export async function savePassage(user: User, passage: ReadingPassage): Promise<void> {
  if (isRemoteBackend) return remote.savePassage(user, passage);
  writeJSON(STORAGE_KEYS.passages, [...loadPassages().filter((p) => p.id !== passage.id), passage]);
}

export async function getWork(user: User, passageId: string, activity: StructureActivity): Promise<StructureWork | undefined> {
  if (isRemoteBackend) return remote.getWork(user, passageId, activity);
  return loadWorks().find((w) => w.passageId === passageId && w.activity === activity && w.studentId === user.id);
}

function upsertLocal(user: User, passageId: string, activity: StructureActivity, patch: (w: StructureWork) => StructureWork) {
  const works = loadWorks();
  const i = works.findIndex((w) => w.passageId === passageId && w.activity === activity && w.studentId === user.id);
  const base: StructureWork =
    i >= 0
      ? works[i]
      : { id: createId('w_'), passageId, activity, studentId: user.id, studentName: user.name, mode: 'guided', draft: EMPTY, shared: false, shareName: false, updatedAt: Date.now() };
  const next = { ...patch(base), updatedAt: Date.now() };
  if (i >= 0) works[i] = next;
  else works.push(next);
  saveWorks(works);
}

export async function saveDraft(user: User, passageId: string, activity: StructureActivity, mode: StructureMode, draft: Diagram): Promise<void> {
  if (isRemoteBackend) return remote.saveDraft(user, passageId, activity, mode, draft);
  upsertLocal(user, passageId, activity, (w) => ({ ...w, mode, draft }));
}

/** "다 만들었어요" — 처음이면 첫 버전, 그다음부터는 수정 버전 */
export async function submitDiagram(user: User, passageId: string, activity: StructureActivity, diagram: Diagram): Promise<void> {
  if (isRemoteBackend) return remote.submit(user, passageId, activity, diagram);
  upsertLocal(user, passageId, activity, (w) =>
    w.firstSubmission
      ? { ...w, draft: diagram, revised: diagram, revisedAt: Date.now() }
      : { ...w, draft: diagram, firstSubmission: diagram, firstAt: Date.now() },
  );
}

/** 모범 구조도 — 학생은 제출한 뒤에만 */
export async function getModel(
  user: User,
  passage: ReadingPassage,
  activity: StructureActivity,
): Promise<{ submitted: boolean; model: Diagram | null; structureType?: string }> {
  const fallback = activity === 'paragraph' ? passage.modelParagraph : passage.modelContent;
  if (user.role !== 'student') return { submitted: true, model: fallback, structureType: passage.structureType };
  if (isRemoteBackend) {
    const res = await remote.getModelForStudent(user, passage.id, activity);
    if (!res.submitted) return res;
    const base = defaultPassages.find((p) => p.id === passage.id);
    const baseModel = base ? (activity === 'paragraph' ? base.modelParagraph : base.modelContent) : null;
    return { submitted: true, model: res.model?.nodes?.length ? res.model : baseModel, structureType: res.structureType ?? base?.structureType };
  }
  const work = await getWork(user, passage.id, activity);
  return work?.firstSubmission ? { submitted: true, model: fallback, structureType: passage.structureType } : { submitted: false, model: null };
}

export async function getNotes(user: User, passageId: string): Promise<StructureNotes> {
  const empty = { passageId, studentId: user.id, highlights: [], answers: [] };
  if (isRemoteBackend) return (user.role === 'student' ? await remote.getNotes(user, passageId) : undefined) ?? empty;
  return loadNotes().find((n) => n.passageId === passageId && n.studentId === user.id) ?? empty;
}

export async function saveNotes(user: User, notes: StructureNotes): Promise<void> {
  if (isRemoteBackend) {
    if (user.role === 'student') await remote.saveNotes(user, notes);
    return;
  }
  writeJSON(STORAGE_KEYS.structureNotes, [...loadNotes().filter((n) => !(n.passageId === notes.passageId && n.studentId === notes.studentId)), notes]);
}

// ── 선생님·교수자 ──
export async function listSubmissions(passageId: string): Promise<StructureWork[]> {
  const list = isRemoteBackend ? await remote.listWorks(passageId) : loadWorks().filter((w) => w.passageId === passageId);
  return list.filter((w) => w.firstSubmission).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateSubmission(id: string, patch: { teacherComment?: string; commentBy?: string; shared?: boolean; shareName?: boolean }): Promise<void> {
  if (isRemoteBackend) return remote.updateWork(id, patch);
  saveWorks(loadWorks().map((w) => (w.id === id ? { ...w, ...patch } : w)));
}

export async function listGallery(passageId: string): Promise<GalleryItem[]> {
  if (isRemoteBackend) return remote.listGallery(passageId);
  return loadWorks()
    .filter((w) => w.passageId === passageId && w.shared && w.firstSubmission)
    .map((w) => ({ id: w.id, activity: w.activity, studentName: w.shareName ? w.studentName : undefined, diagram: w.revised ?? w.firstSubmission!, teacherComment: w.teacherComment }));
}
