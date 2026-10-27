import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { LECTURE_MAX_BYTES, lectureAcceptTypes, lectureStandardPresets } from '@/config/lectures';
import { useCurrentUser } from '@/context/AuthContext';
import { createLecture, updateLecture } from '@/services/lectureService';
import type { SubjectId } from '@/types';
import type { Lecture } from '@/types/lecture';
import { cn, formatFileSize } from '@/utils/format';

const STANDARD_RE = /^\d{1,2}[가-힣]{2,4}\d{2}-\d{2}$/;

/** 영상 올리기·고치기 (KoreanEdu UploadForm: 파일/링크 탭, 크기 제한, 진행률, 오류 표시) */
export function LectureForm({
  subjectId,
  units,
  editing,
  defaultUnit,
  onClose,
  onSaved,
}: {
  subjectId: SubjectId;
  units: string[];
  editing?: Lecture;
  defaultUnit?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const user = useCurrentUser();
  const presets = lectureStandardPresets[subjectId] ?? [];
  const [kind, setKind] = useState<'file' | 'link'>(editing?.linkUrl ? 'link' : 'file');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [unit, setUnit] = useState(editing?.unit ?? defaultUnit ?? units[0]);
  const [standards, setStandards] = useState<string[]>(editing?.standards ?? []);
  const [codeInput, setCodeInput] = useState('');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [linkUrl, setLinkUrl] = useState(editing?.linkUrl ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const linkOk = /^https?:\/\/\S+$/.test(linkUrl.trim());
  const canSave = !saving && title.trim() && unit && (editing ? !editing.linkUrl || linkOk : kind === 'file' ? !!file : linkOk);

  const toggleStandard = (code: string) => setStandards((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  const addCode = () => {
    const code = codeInput.trim().replace(/[[\]\s]/g, '');
    if (!code) return;
    if (!STANDARD_RE.test(code)) return setError('성취기준은 "12화언01-03" 처럼 적어 주세요.');
    setError('');
    if (!standards.includes(code)) setStandards([...standards, code]);
    setCodeInput('');
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileError('');
    if (f && f.size > LECTURE_MAX_BYTES) {
      setFileError(`파일이 너무 커요 (${formatFileSize(f.size)}). ${formatFileSize(LECTURE_MAX_BYTES)} 이하만 올릴 수 있어요. 큰 영상은 YouTube(일부 공개)에 올리고 [링크]로 추가해 주세요.`);
      setFile(null);
      e.target.value = '';
      return;
    }
    if (f && f.type && !f.type.startsWith('video/')) {
      setFileError('영상 파일(mp4, mov, webm)만 올릴 수 있어요.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const base = { title: title.trim(), unit, standards, description: description.trim() || undefined };
      if (editing) await updateLecture(editing, { ...base, linkUrl: editing.linkUrl ? linkUrl.trim() : undefined });
      else
        await createLecture(
          user,
          { ...base, subjectId, file: kind === 'file' ? file ?? undefined : undefined, linkUrl: kind === 'link' ? linkUrl.trim() : undefined },
          setProgress,
        );
      onSaved();
    } catch (err) {
      // 오류 내용을 화면에 그대로 (KoreanEdu: 콘솔에만 남아 원인을 몰랐던 문제)
      console.error(err);
      setError(`저장하지 못했어요: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <Modal open title={editing ? '영상 정보 고치기' : '개념 복습 영상 추가'} onClose={() => !saving && onClose()}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">제목</span>
          <input className="royal-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 관형사와 관형어 구분하기" maxLength={80} required />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">개념 단원</span>
          <select className="royal-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-1 block text-sm font-semibold">관련 성취기준</span>
          <div className="flex flex-wrap gap-1.5">
            {[...presets, ...standards.filter((c) => !presets.some((p) => p.code === c)).map((code) => ({ code, label: '' }))].map((p) => {
              const on = standards.includes(p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => toggleStandard(p.code)}
                  aria-pressed={on}
                  className={cn(
                    'min-h-[36px] rounded-full border px-3 text-xs transition-colors',
                    on ? 'border-jade bg-jade text-hanji' : 'border-gold/40 bg-white/60 text-ink-soft hover:border-jade',
                  )}
                >
                  <b className="font-mono">{p.code}</b>
                  {p.label && ` ${p.label}`}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="royal-input flex-1 py-2 text-sm"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCode())}
              placeholder="직접 입력: 12화언01-05"
            />
            <RoyalButton variant="secondary" size="sm" className="h-11" onClick={addCode}>
              추가
            </RoyalButton>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            설명 <span className="font-normal text-ink-faint">(선택)</span>
          </span>
          <textarea className="royal-input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>

        {!editing && (
          <TabBar
            items={[
              { id: 'file', label: '파일 올리기', icon: 'upload' },
              { id: 'link', label: '링크 (YouTube 등)', icon: 'external' },
            ]}
            value={kind}
            onChange={setKind}
            size="sm"
            touch
          />
        )}

        {!editing && kind === 'file' && (
          <div className="space-y-1">
            <input type="file" accept={lectureAcceptTypes} onChange={onFile} className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-2.5 file:text-royal" />
            <p className="text-xs text-ink-faint">mp4·mov·webm, {formatFileSize(LECTURE_MAX_BYTES)} 이하</p>
            {file && <p className="text-xs text-ink-soft">{file.name} · {formatFileSize(file.size)}</p>}
            {fileError && <p className="text-xs text-royal">{fileError}</p>}
          </div>
        )}

        {(kind === 'link' && !editing) || editing?.linkUrl ? (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">영상 주소</span>
            <input className="royal-input" inputMode="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://youtu.be/..." />
            <span className="mt-1 block text-xs text-ink-faint">YouTube 는 앱 안에서 배속·이어 보기·메모가 돼요. 다른 사이트는 새 창으로 열려요.</span>
          </label>
        ) : null}

        {progress !== null && (
          <div className="space-y-1" aria-live="polite">
            <div className="flex justify-between text-xs text-ink-soft">
              <span>올리는 중… 창을 닫지 마세요</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gold/15">
              <div className="h-full rounded-full bg-gradient-to-r from-royal-light to-royal transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {error && <p className="break-all rounded-xl bg-royal/5 px-3 py-2 text-sm text-royal">{error}</p>}

        <div className="flex gap-2 pt-1">
          <RoyalButton type="submit" fullWidth disabled={!canSave}>
            {saving ? '저장 중…' : '저장'}
          </RoyalButton>
          <RoyalButton variant="secondary" fullWidth disabled={saving} onClick={onClose}>
            취소
          </RoyalButton>
        </div>
      </form>
    </Modal>
  );
}
