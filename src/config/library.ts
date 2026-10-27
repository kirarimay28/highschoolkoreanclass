/** 도서관 업로드 허용 형식 */
export const libraryAcceptedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.hwp', '.hwpx', '.xlsx', '.png', '.jpg'];

/**
 * 이 크기 이하 파일만 브라우저(localStorage)에 실제 내용까지 저장합니다.
 * 더 큰 파일은 목록 정보만 저장되고, 내려받기는 이번 세션 동안만 가능합니다.
 * (실제 파일 서버 연결 시 제거)
 */
export const LIBRARY_INLINE_LIMIT = 1.5 * 1024 * 1024;
