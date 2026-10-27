/**
 * 학교 정보 — 학교명이 바뀌면 여기만 고치면 됩니다.
 * (로그인 화면, 상단 헤더, 메뉴 서랍, 하단 문구, 브라우저 탭 제목에 쓰임)
 */
export const SCHOOL_NAME = '국교고등학교';
export const SCHOOL_NAME_HANJA = '國敎高等學校';

/** 앱 전반의 이름·문구 */
export const appConfig = {
  school: SCHOOL_NAME,
  name: '국어 교실',
  /** 로그인 화면 한자 부제 */
  hanja: `${SCHOOL_NAME_HANJA} 國語學堂`,
  subtitle: `${SCHOOL_NAME} 2학년 국어 수업`,
  slogan: '우리말의 품격을 함께 배우다',
  footer: `${SCHOOL_NAME} 2학년 국어 · 袞龍袍 테마`,
  /** 브라우저 탭 제목 */
  documentTitle: `${SCHOOL_NAME} 국어 교실`,
} as const;
