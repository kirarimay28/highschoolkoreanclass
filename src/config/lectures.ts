import type { SubjectId } from '@/types';

/**
 * 개념 복습 강의 설정
 * 다른 과목에서 켜려면:
 *  1) 이 파일 lectureUnits 에 그 과목 단원 목록 추가
 *  2) config/subjects.ts 그 과목 sections 에 { id: 'lectures', ..., path: 'lectures' } 추가
 */
export const lectureUnits: Partial<Record<SubjectId, string[]>> = {
  'speech-language': ['음운', '단어', '문장', '담화', '화법'],
};

/** 성취기준 빠른 선택 (직접 입력도 가능) */
export const lectureStandardPresets: Partial<Record<SubjectId, { code: string; label: string }[]>> = {
  'speech-language': [
    { code: '12화언01-03', label: '품사와 문장 구조' },
    { code: '12화언01-04', label: '단어의 짜임' },
  ],
};

/**
 * 파일 한 개 최대 크기.
 * Supabase 무료 요금제는 파일당 50MB 가 한도라서 50MB.
 * (KoreanEdu 는 Firestore 무료 용량 때문에 100MB 로 낮췄었음)
 * 더 큰 영상은 YouTube(일부 공개)에 올리고 링크로 추가하세요.
 */
export const LECTURE_MAX_BYTES = 50 * 1024 * 1024;

export const lectureAcceptTypes = 'video/mp4,video/quicktime,video/webm';

/** 배속 */
export const lectureSpeeds = [0.75, 1, 1.25, 1.5, 2];

/** 이만큼 보면 자동으로 "봤어요" (KoreanEdu 와 같은 90%) */
export const LECTURE_AUTO_DONE_RATIO = 0.9;

/** 위치 저장 간격 (ms) — KoreanEdu 와 같은 5초 */
export const LECTURE_SAVE_INTERVAL = 5000;

/** 업로드가 이 시간 동안 멈춰 있으면 실패로 보고 안내 (KoreanEdu 타임아웃 수정과 같은 20초) */
export const LECTURE_UPLOAD_STALL_MS = 20_000;

export const lectureNotice = '출결·평가와 상관없는 복습 공간이에요. 필요한 개념만 골라 보세요.';
