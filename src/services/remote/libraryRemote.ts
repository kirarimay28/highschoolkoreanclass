import type { LibraryFile, SubjectId, User } from '@/types';
import { db, friendlyError, toMillis, unwrap } from '../supabase';

const BUCKET = 'library';

interface FileRow {
  id: string;
  subject_id: SubjectId;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  size: number;
  storage_path: string;
  uploader_name: string;
  uploaded_at: string;
}
const toFile = (r: FileRow): LibraryFile => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  description: r.description ?? undefined,
  fileName: r.file_name,
  fileType: r.file_type,
  size: r.size,
  storagePath: r.storage_path,
  uploaderName: r.uploader_name,
  uploadedAt: toMillis(r.uploaded_at),
});

export async function listFiles(subjectId?: SubjectId | 'all'): Promise<LibraryFile[]> {
  let q = db().from('library_files').select('*').order('uploaded_at', { ascending: false });
  if (subjectId && subjectId !== 'all') q = q.eq('subject_id', subjectId);
  return (unwrap(await q) as FileRow[]).map(toFile);
}

export async function uploadFile(
  user: User,
  input: { subjectId: SubjectId; title: string; description?: string; file: File },
): Promise<void> {
  const { file } = input;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  // 저장 경로는 영문·숫자만 (한글 파일명은 내려받을 때 원래 이름으로 복원)
  const path = `${input.subjectId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const up = await db().storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (up.error) throw new Error(friendlyError(up.error));
  const res = await db().from('library_files').insert({
    subject_id: input.subjectId,
    title: input.title || file.name,
    description: input.description ?? null,
    file_name: file.name,
    file_type: ext,
    size: file.size,
    storage_path: path,
    uploader_name: user.name,
  });
  if (res.error) {
    await db().storage.from(BUCKET).remove([path]);
    unwrap(res);
  }
}

export async function deleteFile(id: string): Promise<void> {
  const rows = unwrap(await db().from('library_files').select('storage_path').eq('id', id)) as { storage_path: string }[];
  unwrap(await db().from('library_files').delete().eq('id', id));
  if (rows[0]) await db().storage.from(BUCKET).remove([rows[0].storage_path]);
}

export async function getDownloadUrl(id: string): Promise<{ url: string; fileName: string; isPlaceholder: boolean } | null> {
  const rows = unwrap(await db().from('library_files').select('*').eq('id', id)) as FileRow[];
  const row = rows[0];
  if (!row) return null;
  const { data } = db().storage.from(BUCKET).getPublicUrl(row.storage_path, { download: row.file_name });
  return { url: data.publicUrl, fileName: row.file_name, isPlaceholder: false };
}
