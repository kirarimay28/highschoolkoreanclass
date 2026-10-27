import { LIBRARY_INLINE_LIMIT } from '@/config/library';
import type { LibraryFile, SubjectId, User } from '@/types';
import { isRemoteBackend } from '@/config/backend';
import * as remote from './remote/libraryRemote';
import { STORAGE_KEYS, createId, readJSON, resolve, writeJSON } from './storage';

/**
 * 도서관 서비스 (mock)
 * - 목록 정보는 localStorage 에 저장
 * - 파일 내용: 작은 파일은 dataURL 로 localStorage 에, 큰 파일은 이번 세션 메모리에만 보관
 * 실제 파일 서버(Supabase Storage 등) 연결 시 upload / getDownloadUrl 내부만 교체하세요.
 */

interface StoredLibraryFile extends LibraryFile {
  dataUrl?: string;
}

const sessionBlobs = new Map<string, Blob>();

const load = () => readJSON<StoredLibraryFile[]>(STORAGE_KEYS.library, []);
const save = (files: StoredLibraryFile[]) => writeJSON(STORAGE_KEYS.library, files);
const strip = ({ dataUrl: _omit, ...file }: StoredLibraryFile): LibraryFile => file;

export async function listFiles(filter: { subjectId?: SubjectId | 'all'; query?: string } = {}): Promise<LibraryFile[]> {
  const q = filter.query?.trim().toLowerCase();
  const source: StoredLibraryFile[] = isRemoteBackend ? await remote.listFiles(filter.subjectId) : load();
  return (
    source
      .filter((f) => !filter.subjectId || filter.subjectId === 'all' || f.subjectId === filter.subjectId)
      .filter(
        (f) =>
          !q ||
          f.title.toLowerCase().includes(q) ||
          f.fileName.toLowerCase().includes(q) ||
          (f.description ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(strip)
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface UploadInput {
  subjectId: SubjectId;
  title: string;
  description?: string;
  file: File;
}

export async function uploadFile(user: User, input: UploadInput): Promise<LibraryFile | void> {
  if (isRemoteBackend) return remote.uploadFile(user, input);
  const { file } = input;
  const id = createId('f_');
  const record: StoredLibraryFile = {
    id,
    subjectId: input.subjectId,
    title: input.title || file.name,
    description: input.description,
    fileName: file.name,
    fileType: file.name.split('.').pop()?.toLowerCase() ?? '',
    size: file.size,
    uploaderName: user.name,
    uploadedAt: Date.now(),
  };
  sessionBlobs.set(id, file);
  if (file.size <= LIBRARY_INLINE_LIMIT) {
    try {
      record.dataUrl = await readAsDataUrl(file);
      save([record, ...load()]);
      return strip(record);
    } catch {
      delete record.dataUrl; // 용량 초과 시 목록 정보만 저장
    }
  }
  save([record, ...load()]);
  return strip(record);
}

export function deleteFile(id: string): Promise<void> {
  if (isRemoteBackend) return remote.deleteFile(id);
  sessionBlobs.delete(id);
  save(load().filter((f) => f.id !== id));
  return resolve(undefined);
}

/** 내려받기 URL. 실제 파일이 없으면 안내용 텍스트 파일을 만들어 돌려줍니다. */
export function getDownloadUrl(id: string): Promise<{ url: string; fileName: string; isPlaceholder: boolean } | null> {
  if (isRemoteBackend) return remote.getDownloadUrl(id);
  const record = load().find((f) => f.id === id);
  if (!record) return resolve(null);
  const blob = sessionBlobs.get(id);
  if (blob) return resolve({ url: URL.createObjectURL(blob), fileName: record.fileName, isPlaceholder: false });
  if (record.dataUrl) return resolve({ url: record.dataUrl, fileName: record.fileName, isPlaceholder: false });
  const placeholder = new Blob(
    [`[샘플 자료] ${record.title}\n\n실제 파일 서버가 연결되면 이 자리에서 원본 파일(${record.fileName})이 내려받아집니다.`],
    { type: 'text/plain;charset=utf-8' },
  );
  return resolve({ url: URL.createObjectURL(placeholder), fileName: `${record.title}.txt`, isPlaceholder: true });
}
