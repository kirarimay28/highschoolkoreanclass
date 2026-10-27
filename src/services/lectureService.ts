import { isRemoteBackend } from '@/config/backend';
import { lectureUnits } from '@/config/lectures';
import type { SubjectId, User } from '@/types';
import type { Lecture, LectureInput, LectureMemo, LectureProgress } from '@/types/lecture';
import { deleteBlob, getBlob, putBlob } from './blobStore';
import * as remote from './remote/lectureRemote';
import { STORAGE_KEYS, createId, readJSON, writeJSON } from './storage';

/**
 * 개념 복습 강의 (KoreanEdu store.ts 의 영상 함수들을 옮김)
 * - Supabase 가 설정되어 있으면 서버(supabase/lectures.sql + 저장 공간 'lectures'), 아니면 이 브라우저
 * - 시청 기록·메모는 학생 본인만. 선생님 화면용 함수는 만들지 않음 (조회 수만 영상 정보에 들어 있음)
 */

const LOCAL_PREFIX = 'local/';
const loadAll = () => readJSON<Lecture[]>(STORAGE_KEYS.lectures, []);
const saveAll = (l: Lecture[]) => writeJSON(STORAGE_KEYS.lectures, l);

/** 단원(설정 순서) → 단원 안 순서 */
export function sortLectures(list: Lecture[], subjectId: SubjectId): Lecture[] {
  const units = lectureUnits[subjectId] ?? [];
  const rank = (u: string) => (units.includes(u) ? units.indexOf(u) : units.length);
  return [...list].sort((a, b) => rank(a.unit) - rank(b.unit) || a.unit.localeCompare(b.unit) || a.order - b.order || a.createdAt - b.createdAt);
}

export async function listLectures(subjectId: SubjectId): Promise<Lecture[]> {
  const list = isRemoteBackend ? await remote.listLectures(subjectId) : loadAll().filter((l) => l.subjectId === subjectId);
  return sortLectures(list, subjectId);
}

/**
 * 썸네일·길이 만들기 (KoreanEdu generateThumbnail)
 * - 모바일에서 5초 안에 못 만들면 없이 진행 (그때 undefined 가 서버 저장 오류를 냈던 문제 → 저장 시 null 처리)
 * - 짧은 영상은 5초 지점이 없어서 실패하던 것 → 길이의 1/4 지점 사용
 */
export function readVideoMeta(file: File): Promise<{ thumbnailUrl?: string; durationSeconds?: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let done = false;
    let duration: number | undefined;
    const finish = (thumb?: string) => {
      if (done) return;
      done = true;
      // 임시 영상을 먼저 떼어 낸 뒤 주소 해제 (안 그러면 브라우저가 지워진 주소를 계속 읽으려 함)
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve({ thumbnailUrl: thumb, durationSeconds: duration });
    };
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      duration = Number.isFinite(video.duration) ? Math.round(video.duration) : undefined;
      video.currentTime = Math.min(5, (video.duration || 4) / 4);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        canvas.getContext('2d')?.drawImage(video, 0, 0, 160, 90);
        finish(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        finish();
      }
    };
    video.onerror = () => finish();
    setTimeout(() => finish(), 5000);
    video.src = url;
  });
}

/** iOS 의 .mov(video/quicktime)는 크롬·파이어폭스에서 재생이 안 돼 video/mp4 로 다룸 (KoreanEdu 모바일 재생 수정) */
export const playableType = (type: string | undefined) => (!type || type === 'video/quicktime' ? 'video/mp4' : type);

export async function createLecture(user: User, input: LectureInput, onProgress: (pct: number) => void): Promise<void> {
  const { file } = input;
  // 썸네일 만들기와 업로드를 동시에 → 진행률이 바로 보임 (KoreanEdu 수정)
  const [meta, storagePath] = await Promise.all([
    file ? readVideoMeta(file) : Promise.resolve({} as { thumbnailUrl?: string; durationSeconds?: number }),
    file ? uploadVideo(file, onProgress) : Promise.resolve(undefined),
  ]);
  const existing = await listLectures(input.subjectId);
  const order = Math.max(0, ...existing.filter((l) => l.unit === input.unit).map((l) => l.order + 1));
  const lecture: Lecture = {
    id: crypto.randomUUID(),
    subjectId: input.subjectId,
    title: input.title,
    unit: input.unit,
    order,
    standards: input.standards,
    description: input.description || undefined,
    storagePath,
    linkUrl: file ? undefined : input.linkUrl,
    mimeType: file ? playableType(file.type) : undefined,
    size: file?.size,
    durationSeconds: meta.durationSeconds,
    thumbnailUrl: meta.thumbnailUrl,
    uploadedByName: user.name,
    createdAt: Date.now(),
    views: 0,
  };
  try {
    if (isRemoteBackend) await remote.insertLecture(lecture);
    else saveAll([...loadAll(), lecture]);
  } catch (e) {
    // 정보 저장이 실패하면 올린 파일도 지움 (빈 파일이 저장 공간에 남지 않게)
    if (storagePath) await removeVideo(storagePath).catch(() => undefined);
    throw e;
  }
}

async function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
  if (isRemoteBackend) return remote.uploadVideo(file, onProgress);
  const key = `${LOCAL_PREFIX}${createId('v_')}`;
  onProgress(0);
  await putBlob(key, file);
  onProgress(100);
  return key;
}

async function removeVideo(path: string) {
  if (path.startsWith(LOCAL_PREFIX)) return deleteBlob(path);
  if (isRemoteBackend) return remote.removeVideo(path);
}

export type LecturePatch = Pick<Lecture, 'title' | 'unit' | 'standards' | 'description' | 'linkUrl'>;

export async function updateLecture(lecture: Lecture, patch: LecturePatch): Promise<void> {
  // 단원을 옮기면 새 단원의 맨 뒤로
  let order = lecture.order;
  if (patch.unit !== lecture.unit) {
    const existing = await listLectures(lecture.subjectId);
    order = Math.max(0, ...existing.filter((l) => l.unit === patch.unit).map((l) => l.order + 1));
  }
  const next = { ...patch, order, description: patch.description || undefined };
  if (isRemoteBackend) return remote.updateLecture(lecture.id, next);
  saveAll(loadAll().map((l) => (l.id === lecture.id ? { ...l, ...next } : l)));
}

export async function deleteLecture(lecture: Lecture): Promise<void> {
  if (isRemoteBackend) await remote.deleteLecture(lecture.id);
  else {
    saveAll(loadAll().filter((l) => l.id !== lecture.id));
    writeJSON(STORAGE_KEYS.lectureMemos, readJSON<StoredMemo[]>(STORAGE_KEYS.lectureMemos, []).filter((m) => m.lectureId !== lecture.id));
  }
  if (lecture.storagePath) await removeVideo(lecture.storagePath).catch((e) => console.warn('[lecture] 파일 삭제 실패', e));
}

/** 같은 단원 안에서 한 칸 위·아래로 */
export async function moveLecture(lecture: Lecture, dir: -1 | 1): Promise<void> {
  const siblings = (await listLectures(lecture.subjectId)).filter((l) => l.unit === lecture.unit);
  const i = siblings.findIndex((l) => l.id === lecture.id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  const orders = siblings.map((l, k) => ({ id: l.id, order: k }));
  if (isRemoteBackend) return remote.setOrders(orders.filter((o, k) => siblings[k].order !== o.order));
  const byId = new Map(orders.map((o) => [o.id, o.order]));
  saveAll(loadAll().map((l) => (byId.has(l.id) ? { ...l, order: byId.get(l.id)! } : l)));
}

/** 재생 주소 */
export async function getVideoUrl(lecture: Lecture): Promise<string> {
  if (!lecture.storagePath) throw new Error('파일로 올린 영상이 아니에요.');
  if (lecture.storagePath.startsWith(LOCAL_PREFIX)) {
    const blob = await getBlob(lecture.storagePath);
    if (!blob) throw new Error('영상 파일을 찾을 수 없어요. 이 브라우저에서 올린 영상만 볼 수 있어요.');
    return URL.createObjectURL(new Blob([blob], { type: playableType(lecture.mimeType ?? blob.type) }));
  }
  return remote.publicVideoUrl(lecture.storagePath);
}

/** 조회 수 +1 — 누가 봤는지는 남기지 않음. 한 번 연 화면에서 여러 번 세지 않도록 탭(세션)당 1회 */
export async function countView(lectureId: string): Promise<void> {
  const key = `hkc:lectureViewed:${lectureId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* noop */
  }
  if (isRemoteBackend) return remote.addView(lectureId);
  saveAll(loadAll().map((l) => (l.id === lectureId ? { ...l, views: l.views + 1 } : l)));
}

// ───────── 나만 보는 시청 기록·메모 ─────────
// 서버: 학생은 이름+학번 확인 함수로 본인 것만. 선생님·교수자 본인의 기록은 이 브라우저에만 저장.
const useServer = (user: User) => isRemoteBackend && user.role === 'student';

interface StoredProgress extends LectureProgress {
  userId: string;
}
interface StoredMemo extends LectureMemo {
  userId: string;
}
const loadProgress = () => readJSON<StoredProgress[]>(STORAGE_KEYS.lectureProgress, []);
const loadMemos = () => readJSON<StoredMemo[]>(STORAGE_KEYS.lectureMemos, []);
const strip = <T extends { userId: string }>({ userId: _u, ...rest }: T) => rest;

export async function listMyProgress(user: User, subjectId: SubjectId): Promise<LectureProgress[]> {
  if (useServer(user)) return remote.listProgress(user, subjectId);
  return loadProgress()
    .filter((p) => p.userId === user.id)
    .map(strip);
}

export async function saveMyProgress(user: User, p: LectureProgress): Promise<void> {
  if (useServer(user)) return remote.saveProgress(user, p);
  writeJSON(STORAGE_KEYS.lectureProgress, [
    ...loadProgress().filter((x) => !(x.userId === user.id && x.lectureId === p.lectureId)),
    { ...p, userId: user.id, updatedAt: Date.now() },
  ]);
}

export async function listMyMemos(user: User, lectureId: string): Promise<LectureMemo[]> {
  const list = useServer(user)
    ? await remote.listMemos(user, lectureId)
    : loadMemos()
        .filter((m) => m.userId === user.id && m.lectureId === lectureId)
        .map(strip);
  return list.sort((a, b) => a.positionSeconds - b.positionSeconds);
}

export async function addMyMemo(user: User, lectureId: string, positionSeconds: number, text: string): Promise<void> {
  if (useServer(user)) return remote.addMemo(user, lectureId, positionSeconds, text);
  writeJSON(STORAGE_KEYS.lectureMemos, [...loadMemos(), { id: createId('m_'), userId: user.id, lectureId, positionSeconds, text, createdAt: Date.now() }]);
}

export async function updateMyMemo(user: User, id: string, text: string): Promise<void> {
  if (useServer(user)) return remote.updateMemo(user, id, text);
  writeJSON(STORAGE_KEYS.lectureMemos, loadMemos().map((m) => (m.id === id && m.userId === user.id ? { ...m, text } : m)));
}

export async function deleteMyMemo(user: User, id: string): Promise<void> {
  if (useServer(user)) return remote.deleteMemo(user, id);
  writeJSON(STORAGE_KEYS.lectureMemos, loadMemos().filter((m) => !(m.id === id && m.userId === user.id)));
}
