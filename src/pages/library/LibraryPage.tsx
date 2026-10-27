import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { RoyalButton } from '@/components/common/RoyalButton';
import { TabBar } from '@/components/common/TabBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { libraryAcceptedTypes } from '@/config/library';
import { can } from '@/config/permissions';
import { getSubject, subjects } from '@/config/subjects';
import { useCurrentUser } from '@/context/AuthContext';
import { deleteFile, getDownloadUrl, listFiles, uploadFile } from '@/services/libraryService';
import type { SubjectId } from '@/types';
import { formatDateTime } from '@/utils/date';
import { formatFileSize } from '@/utils/format';
import { useAsyncData } from '@/utils/useAsyncData';

type Filter = SubjectId | 'all';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  ...subjects.map((s) => ({ id: s.id, label: s.name })),
];

export function LibraryPage() {
  const user = useCurrentUser();
  const canUpload = can(user.role, 'uploadLibrary');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data: files, reload } = useAsyncData(() => listFiles({ subjectId: filter, query }), [filter, query], []);

  const download = async (id: string) => {
    const res = await getDownloadUrl(id);
    if (!res) return;
    if (res.isPlaceholder) alert('샘플 자료라 실제 파일 대신 안내 문서가 내려받아집니다.');
    const a = document.createElement('a');
    a.href = res.url;
    a.download = res.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (res.url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(res.url), 1000);
  };

  return (
    <div>
      <PageHeader
        title="도서관"
        description={canUpload ? '수업 자료를 올리고 관리하세요.' : '수업 자료를 찾아보고 내려받으세요.'}
        actions={
          canUpload && (
            <RoyalButton icon="upload" onClick={() => setUploading(true)}>
              자료 올리기
            </RoyalButton>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <TabBar items={filters} value={filter} onChange={setFilter} size="sm" className="md:max-w-lg" />
        <label className="relative md:ml-auto md:w-72">
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="royal-input pl-10"
            placeholder="자료 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="자료 검색"
          />
        </label>
      </div>

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {files.map((f) => (
          <li key={f.id} className="royal-card flex items-center gap-4 p-4">
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-gold/50 bg-royal text-[10px] font-bold uppercase text-gold-light">
              <Icon name="file" size={18} />
              {f.fileType}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-sans text-base font-semibold">{f.title}</h2>
              </div>
              {f.description && <p className="truncate text-sm text-ink-soft">{f.description}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                <Badge>{getSubject(f.subjectId)?.name}</Badge>
                <span>{formatFileSize(f.size)}</span>
                <span>{f.uploaderName}</span>
                <span>{formatDateTime(f.uploadedAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
              <RoyalButton size="sm" variant="secondary" icon="download" onClick={() => download(f.id)} aria-label="내려받기">
                <span className="hidden sm:inline">받기</span>
              </RoyalButton>
              {canUpload && (
                <RoyalButton
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  aria-label="삭제"
                  onClick={async () => {
                    if (!confirm(`"${f.title}" 자료를 삭제할까요?`)) return;
                    await deleteFile(f.id);
                    reload();
                  }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      {files.length === 0 && <EmptyState icon="library" title="자료가 없어요">다른 과목이나 검색어로 찾아보세요.</EmptyState>}

      {canUpload && (
        <UploadModal
          open={uploading}
          defaultSubject={filter === 'all' ? subjects[0].id : filter}
          onClose={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  open,
  defaultSubject,
  onClose,
  onUploaded,
}: {
  open: boolean;
  defaultSubject: SubjectId;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const user = useCurrentUser();
  const [subjectId, setSubjectId] = useState<SubjectId>(defaultSubject);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      await uploadFile(user, { subjectId, title: title.trim(), description: description.trim() || undefined, file });
      setTitle('');
      setDescription('');
      setFile(null);
      onUploaded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="자료 올리기" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="royal-label">과목</span>
          <TabBar items={subjects.map((s) => ({ id: s.id, label: s.name }))} value={subjectId} onChange={setSubjectId} size="sm" />
        </div>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gold/50 bg-hanji/60 px-4 py-6 text-center hover:border-gold">
          <Icon name="upload" className="text-gold" />
          <span className="text-sm text-ink-soft">{file ? `${file.name} (${formatFileSize(file.size)})` : 'PPT, PDF 등 파일을 선택하세요'}</span>
          <input
            type="file"
            className="sr-only"
            accept={libraryAcceptedTypes.join(',')}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
            }}
          />
        </label>
        <div>
          <label className="royal-label" htmlFor="libTitle">제목</label>
          <input id="libTitle" className="royal-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="royal-label" htmlFor="libDesc">설명 (선택)</label>
          <input id="libDesc" className="royal-input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <RoyalButton variant="ghost" onClick={onClose}>취소</RoyalButton>
          <RoyalButton type="submit" icon="upload" disabled={!file || busy}>
            올리기
          </RoyalButton>
        </div>
      </form>
    </Modal>
  );
}
