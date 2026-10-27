import type { IconName } from '@/components/common/icons';
import type { Tone } from '@/components/common/IconTile';
import type { Role } from '@/types';

export interface LobbyMenuItem {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  /** 아이콘 타일 색: royal | gold | indigo | jade | plum */
  tone: Tone;
  path: string;
  /** true: 로비에 큰 카드로 보임 / false·생략: ☰ 메뉴 서랍에 보임 */
  showInLobby?: boolean;
  /** 지정하면 해당 역할에게만 보임. 생략하면 모두에게 보임 */
  roles?: Role[];
}

/**
 * 메뉴 목록 — showInLobby: true 인 항목은 로비 카드로,
 * 나머지는 ☰ 메뉴 서랍에 이 순서대로 보입니다.
 * 새 path 를 추가했다면 src/routes.tsx 에 페이지도 연결해 주세요.
 */
export const lobbyMenu: LobbyMenuItem[] = [
  {
    id: 'subjects',
    title: '과목 선택',
    description: '문학 · 독서와 작문 · 화법과 언어',
    icon: 'book',
    tone: 'royal',
    path: '/subjects',
    showInLobby: true,
  },
  {
    id: 'studyroom',
    title: '온라인 스터디룸',
    description: '플래너 · 타이머 · 랭킹 · 캘린더로 스스로 공부해요',
    icon: 'timer',
    tone: 'gold',
    path: '/studyroom',
    showInLobby: true,
  },
  {
    id: 'board',
    title: '질의응답 게시판',
    description: '공부 · 생활 고민을 익명 또는 실명으로 물어보세요',
    icon: 'messages',
    tone: 'indigo',
    path: '/board',
  },
  {
    id: 'library',
    title: '도서관',
    description: '과목별 수업 자료(PPT, PDF)를 찾아보고 내려받아요',
    icon: 'library',
    tone: 'jade',
    path: '/library',
  },
  {
    id: 'tutorial',
    title: '튜토리얼',
    description: '처음이라면 여기서 사용법을 익혀요',
    icon: 'scroll',
    tone: 'plum',
    path: '/tutorial',
  },
  {
    id: 'feedback',
    title: '고쳐주세요',
    description: '버그 · 불편 사항 · 업데이트 요청을 남겨 주세요',
    icon: 'wrench',
    tone: 'royal',
    path: '/feedback',
  },
];
