import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabBar } from '@/components/common/TabBar';
import { MedalPageHeader } from '@/components/layout/MedalPageHeader';
import { can } from '@/config/permissions';
import { getSubject } from '@/config/subjects';
import { useCurrentUser } from '@/context/AuthContext';
import { vocabStandards } from '@/data/classicalVocab';
import { listMyAttempts } from '@/services/vocabService';
import type { VocabAttempt } from '@/types/vocab';
import { useAsyncData } from '@/utils/useAsyncData';
import { ExamRecords } from './ExamRecords';
import { VocabBook } from './VocabBook';
import { VocabQuiz } from './VocabQuiz';

type Tab = 'book' | 'practice' | 'exam';
const tabs: { id: Tab; label: string }[] = [
  { id: 'book', label: '단어장' },
  { id: 'practice', label: '시험 연습' },
  { id: 'exam', label: '시험 응시' },
];

/** 문학 › 고전 어휘 (KoreanEdu 고어 학습·고어 시험 탭을 옮김. 데이터: src/data/classicalVocab.ts) */
export function VocabPage() {
  const user = useCurrentUser();
  const subject = getSubject('literature')!;
  const isTeacher = can(user.role, 'manageVocabExams');
  const [params, setParams] = useSearchParams();
  const tab = (tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'book') as Tab;
  const [busy, setBusy] = useState(false);

  // 기록을 못 불러와도 단어장·연습은 쓸 수 있게 (KoreanEdu d37fdff: 새 기능 하나의 실패가 화면 전체를 막지 않도록)
  const { data: attempts, reload } = useAsyncData(() => listMyAttempts(user).catch(() => [] as VocabAttempt[]), [user.id], [] as VocabAttempt[]);

  const changeTab = (t: Tab) => {
    if (busy && !confirm('푸는 중인 문제가 사라져요. 그래도 옮길까요?')) return;
    setBusy(false);
    setParams(t === 'book' ? {} : { tab: t }, { replace: true });
  };

  return (
    <MedalPageHeader
      backTo="/subject/literature"
      backLabel="문학"
      icon="bookmark"
      title="고전 어휘"
      hanja="古語"
      description="고전 시가에 자주 나오는 옛말을 익히고 시험으로 확인해요."
      accent={subject.accent}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {vocabStandards.map((code) => (
          <span key={code} className="rounded-md bg-[rgb(var(--page-accent)/0.08)] px-2 py-0.5 font-mono text-xs font-semibold text-[rgb(var(--page-accent))]">
            {code}
          </span>
        ))}
      </div>

      <TabBar items={tabs} value={tab} onChange={changeTab} touch noteScope="literature:vocab" className="mb-5 max-w-lg" />

      {/* 탭은 보이는 것만 그림 (KoreanEdu 050cf23: 숨긴 탭의 오류가 화면 전체를 하얗게 만들던 문제) */}
      {tab === 'book' ? (
        <VocabBook attempts={attempts} />
      ) : tab === 'practice' ? (
        <VocabQuiz key="practice" mode="practice" attempts={attempts} onSaved={reload} onBusy={setBusy} />
      ) : isTeacher ? (
        <ExamRecords />
      ) : (
        <VocabQuiz key="exam" mode="exam" attempts={attempts} onSaved={reload} onBusy={setBusy} />
      )}
    </MedalPageHeader>
  );
}
