import { backendConfig } from '@/config/backend';
import { LECTURE_UPLOAD_STALL_MS } from '@/config/lectures';
import type { SubjectId, User } from '@/types';
import type { Lecture, LectureMemo, LectureProgress } from '@/types/lecture';
import { db, friendlyError, toMillis, unwrap } from '../supabase';

const BUCKET = 'lectures';
const sid = (user: User) => user.id.replace(/^student:/, '');
const who = (user: User) => ({ p_student_id: sid(user), p_name: user.name });

interface LectureRow {
  id: string;
  subject_id: SubjectId;
  title: string;
  unit: string;
  sort_order: number;
  standards: string[];
  description: string | null;
  storage_path: string | null;
  link_url: string | null;
  mime_type: string | null;
  size: number | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  uploaded_by_name: string;
  views: number;
  created_at: string;
}
const toLecture = (r: LectureRow): Lecture => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  unit: r.unit,
  order: r.sort_order,
  standards: r.standards ?? [],
  description: r.description ?? undefined,
  storagePath: r.storage_path ?? undefined,
  linkUrl: r.link_url ?? undefined,
  mimeType: r.mime_type ?? undefined,
  size: r.size ?? undefined,
  durationSeconds: r.duration_seconds ?? undefined,
  thumbnailUrl: r.thumbnail_url ?? undefined,
  uploadedByName: r.uploaded_by_name,
  createdAt: toMillis(r.created_at),
  views: r.views,
});

export async function listLectures(subjectId: SubjectId): Promise<Lecture[]> {
  return (unwrap(await db().from('lectures').select('*').eq('subject_id', subjectId)) as LectureRow[]).map(toLecture);
}

/** 없는 값은 null 로 (KoreanEdu: undefined 를 그대로 보내 저장 오류가 났던 문제) */
export async function insertLecture(l: Lecture): Promise<void> {
  unwrap(
    await db().from('lectures').insert({
      id: l.id,
      subject_id: l.subjectId,
      title: l.title,
      unit: l.unit,
      sort_order: l.order,
      standards: l.standards,
      description: l.description ?? null,
      storage_path: l.storagePath ?? null,
      link_url: l.linkUrl ?? null,
      mime_type: l.mimeType ?? null,
      size: l.size ?? null,
      duration_seconds: l.durationSeconds ?? null,
      thumbnail_url: l.thumbnailUrl ?? null,
      uploaded_by_name: l.uploadedByName,
    }),
  );
}

export async function updateLecture(id: string, p: { title: string; unit: string; order: number; standards: string[]; description?: string; linkUrl?: string }) {
  unwrap(
    await db()
      .from('lectures')
      .update({ title: p.title, unit: p.unit, sort_order: p.order, standards: p.standards, description: p.description ?? null, link_url: p.linkUrl ?? null })
      .eq('id', id),
  );
}

export async function deleteLecture(id: string): Promise<void> {
  unwrap(await db().from('lectures').delete().eq('id', id));
}

export async function setOrders(orders: { id: string; order: number }[]): Promise<void> {
  for (const o of orders) unwrap(await db().from('lectures').update({ sort_order: o.order }).eq('id', o.id));
}

export async function addView(id: string): Promise<void> {
  await db().rpc('lecture_add_view', { p_id: id });
}

/**
 * 진행률이 보이는 업로드 (supabase-js 의 upload 는 진행률을 알려 주지 않아 저장 공간 주소로 직접 전송)
 * - KoreanEdu 수정 사항: 20초 동안 진행이 없으면 멈춘 것으로 보고 원인 안내, 오류 내용을 화면에 표시
 */
export async function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
  const { data } = await db().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('선생님 계정으로 다시 로그인해 주세요.');
  const ext = (file.name.split('.').pop() ?? 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  // 저장 경로는 영문·숫자만 (한글 파일명 오류 방지)
  const path = `${crypto.randomUUID()}.${ext === 'mov' ? 'mp4' : ext}`;
  const type = file.type && file.type !== 'video/quicktime' ? file.type : 'video/mp4';

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${backendConfig.supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', backendConfig.supabaseAnonKey);
    xhr.setRequestHeader('content-type', type);
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.setRequestHeader('x-upsert', 'false');

    let lastLoaded = -1;
    let lastChange = Date.now();
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastChange > LECTURE_UPLOAD_STALL_MS) {
        window.clearInterval(watchdog);
        xhr.abort();
        reject(new Error('업로드가 20초 넘게 멈춰 있어요. 인터넷 연결을 확인하거나, 와이파이에서 다시 시도해 주세요.'));
      }
    }, 2000);
    const stop = () => window.clearInterval(watchdog);

    onProgress(0);
    xhr.upload.onprogress = (e) => {
      if (e.loaded !== lastLoaded) {
        lastLoaded = e.loaded;
        lastChange = Date.now();
      }
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      stop();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        return resolve();
      }
      let detail = '';
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string; statusCode?: string };
        detail = body.message || body.error || '';
      } catch {
        detail = xhr.responseText.slice(0, 120);
      }
      if (xhr.status === 413 || /exceeded the maximum|too large/i.test(detail)) reject(new Error('파일이 너무 커요. 50MB 이하로 줄이거나 YouTube 링크로 추가해 주세요.'));
      else if (xhr.status === 403 || xhr.status === 401 || /row-level security|unauthori/i.test(detail))
        reject(new Error(`올릴 권한이 없어요 (${xhr.status}). supabase/lectures.sql 을 실행했는지, 선생님 계정인지 확인해 주세요.`));
      else if (/bucket not found/i.test(detail)) reject(new Error('영상 저장 공간이 없어요. supabase/lectures.sql 을 실행해 주세요.'));
      else reject(new Error(`업로드 실패 (${xhr.status}${detail ? ` — ${detail}` : ''})`));
    };
    xhr.onerror = () => (stop(), reject(new Error('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')));
    xhr.onabort = () => stop();
    xhr.send(file);
  });
  return path;
}

export async function removeVideo(path: string): Promise<void> {
  const res = await db().storage.from(BUCKET).remove([path]);
  if (res.error) throw new Error(friendlyError(res.error));
}

export function publicVideoUrl(path: string): string {
  return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ───────── 학생 본인 기록 (이름+학번 확인 함수로만 접근, 선생님은 조회 불가) ─────────
interface ProgressRow {
  lecture_id: string;
  position_seconds: number;
  watched_seconds: number;
  completed: boolean;
  updated_at: string;
}
export async function listProgress(user: User, subjectId: SubjectId): Promise<LectureProgress[]> {
  const rows = unwrap(await db().rpc('student_lecture_progress', { ...who(user), p_subject: subjectId })) as ProgressRow[];
  return rows.map((r) => ({
    lectureId: r.lecture_id,
    positionSeconds: Number(r.position_seconds),
    watchedSeconds: r.watched_seconds,
    completed: r.completed,
    updatedAt: toMillis(r.updated_at),
  }));
}

export async function saveProgress(user: User, p: LectureProgress): Promise<void> {
  unwrap(
    await db().rpc('student_lecture_progress_save', {
      ...who(user),
      p_lecture: p.lectureId,
      p_position: p.positionSeconds,
      p_watched: Math.round(p.watchedSeconds),
      p_completed: p.completed,
    }),
  );
}

interface MemoRow {
  id: string;
  lecture_id: string;
  position_seconds: number;
  body: string;
  created_at: string;
}
export async function listMemos(user: User, lectureId: string): Promise<LectureMemo[]> {
  const rows = unwrap(await db().rpc('student_lecture_memos', { ...who(user), p_lecture: lectureId })) as MemoRow[];
  return rows.map((r) => ({ id: r.id, lectureId: r.lecture_id, positionSeconds: Number(r.position_seconds), text: r.body, createdAt: toMillis(r.created_at) }));
}

export async function addMemo(user: User, lectureId: string, positionSeconds: number, text: string): Promise<void> {
  unwrap(await db().rpc('student_lecture_memo_add', { ...who(user), p_lecture: lectureId, p_position: positionSeconds, p_body: text }));
}

export async function updateMemo(user: User, id: string, text: string): Promise<void> {
  unwrap(await db().rpc('student_lecture_memo_update', { ...who(user), p_id: id, p_body: text }));
}

export async function deleteMemo(user: User, id: string): Promise<void> {
  unwrap(await db().rpc('student_lecture_memo_delete', { ...who(user), p_id: id }));
}
