/**
 * 처음 실행 시 화면이 비어 보이지 않도록 넣는 샘플 데이터.
 * 날짜는 "오늘" 기준으로 계산됩니다.
 */
import type { BoardPost, FeedbackItem, LibraryFile, StudyRecord } from '@/types';
import { addDays, toDateKey, weekKeys } from '@/utils/date';

const HOUR = 3600 * 1000;

export function buildSeed(now = Date.now()) {
  const today = new Date(now);
  const week = weekKeys(today);

  const sampleStudents = [
    { id: 'student:20301', name: '김하늘', base: 5400 },
    { id: 'student:20302', name: '문서연', base: 7800 },
    { id: 'student:20303', name: '박지후', base: 3600 },
    { id: 'student:20304', name: '이도윤', base: 6300 },
  ];

  const studyRecords: StudyRecord[] = sampleStudents.flatMap((s, si) =>
    week
      .filter((d) => d <= toDateKey(today))
      .map((date, di) => ({
        userId: s.id,
        userName: s.name,
        date,
        seconds: Math.max(600, s.base - ((di * 7 + si * 13) % 9) * 420),
      })),
  );
  // 지난주 기록 약간
  sampleStudents.forEach((s) =>
    studyRecords.push({ userId: s.id, userName: s.name, date: toDateKey(addDays(today, -8)), seconds: s.base }),
  );

  const board: BoardPost[] = [
    {
      id: 'p_seed1',
      category: 'study',
      title: '「관동별곡」에서 화자의 정서 변화가 헷갈려요',
      content: '금강산 부분과 동해 부분에서 화자의 태도가 어떻게 달라지는지 잘 모르겠어요. 정리하는 팁이 있을까요?',
      authorId: 'student:20303',
      authorName: '박지후',
      authorRole: 'student',
      anonymous: true,
      createdAt: now - 26 * HOUR,
      comments: [
        {
          id: 'c_seed1',
          authorId: 'teacher:teacher01',
          authorName: '문서연',
          authorRole: 'teacher',
          anonymous: false,
          content: '여정에 따라 "연군지정 ↔ 선정(仙情)" 사이의 갈등이 어떻게 드러나는지 표로 정리해 보세요. 다음 시간에 같이 봐요!',
          createdAt: now - 20 * HOUR,
        },
      ],
    },
    {
      id: 'p_seed2',
      category: 'life',
      title: '수행평가 기간에 시간 관리 어떻게 하세요?',
      content: '과목마다 수행평가가 겹쳐서 너무 바빠요. 스터디룸 플래너 다들 어떻게 쓰는지 궁금합니다.',
      authorId: 'student:20301',
      authorName: '김하늘',
      authorRole: 'student',
      anonymous: false,
      createdAt: now - 5 * HOUR,
      comments: [],
    },
  ];

  const library: LibraryFile[] = [
    {
      id: 'f_seed1',
      subjectId: 'literature',
      title: '고전 시가의 흐름 정리',
      description: '고대 가요부터 조선 후기 사설시조까지',
      fileName: '고전시가_흐름.pdf',
      fileType: 'pdf',
      size: 2_340_000,
      uploaderName: '문서연',
      uploadedAt: now - 72 * HOUR,
    },
    {
      id: 'f_seed2',
      subjectId: 'reading-writing',
      title: '논증 구조 분석 활동지',
      fileName: '논증구조_활동지.pptx',
      fileType: 'pptx',
      size: 5_120_000,
      uploaderName: '문서연',
      uploadedAt: now - 30 * HOUR,
    },
    {
      id: 'f_seed3',
      subjectId: 'speech-language',
      title: '음운 변동 한눈에 보기',
      description: '교체 · 탈락 · 첨가 · 축약',
      fileName: '음운변동_정리.pdf',
      fileType: 'pdf',
      size: 980_000,
      uploaderName: '한문학',
      uploadedAt: now - 8 * HOUR,
    },
  ];

  const feedback: FeedbackItem[] = [
    {
      id: 'fb_seed1',
      type: 'request',
      title: '타이머에 알림음이 있으면 좋겠어요',
      content: '뽀모도로가 끝났을 때 소리로 알려주면 좋겠습니다.',
      authorId: 'student:20304',
      authorName: '이도윤',
      status: 'checking',
      createdAt: now - 50 * HOUR,
    },
    {
      id: 'fb_seed2',
      type: 'bug',
      title: '모바일에서 캘린더 글씨가 작아요',
      content: '아이폰에서 날짜 숫자가 잘 안 보여요.',
      authorId: 'student:20305',
      authorName: '최유나',
      status: 'received',
      createdAt: now - 3 * HOUR,
    },
  ];

  return { studyRecords, board, library, feedback };
}
