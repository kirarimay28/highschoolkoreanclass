import type { MessageCategory, MessageStatus } from '@/types';

/** 쪽지 카테고리 */
export const messageCategories: { id: MessageCategory; label: string }[] = [
  { id: 'class', label: '수업' },
  { id: 'assignment', label: '과제' },
  { id: 'counsel', label: '상담' },
  { id: 'etc', label: '기타' },
];

/** 학생 화면에 보이는 상태 이름 */
export const studentStatusLabels: Record<MessageStatus, string> = {
  sent: '보냄',
  read: '읽음',
  replied: '답장 완료',
  done: '확인 완료',
};

/** 선생님 화면에 보이는 상태 이름 */
export const teacherStatusLabels: Record<MessageStatus, string> = {
  sent: '새 쪽지',
  read: '읽음',
  replied: '답장 완료',
  done: '처리 완료',
};

export const statusStyles: Record<MessageStatus, string> = {
  sent: 'border-royal/30 bg-royal/[0.07] text-royal',
  read: 'border-indigo/25 bg-indigo/10 text-indigo',
  replied: 'border-success/30 bg-success/10 text-success',
  done: 'border-ink/15 bg-ink/5 text-ink-soft',
};

/** 답장을 기다리는 쪽지 (미완료) */
export const isPending = (status: MessageStatus) => status === 'sent' || status === 'read';

/** 이 시간 이상 기다린 미완료 쪽지는 금색으로 강조 */
export const LONG_WAIT_HOURS = 48;

export const MESSAGE_ATTACHMENT_MAX = 10 * 1024 * 1024; // 10MB
/** 로컬 모드에서 파일 내용까지 저장하는 최대 크기 */
export const MESSAGE_ATTACHMENT_INLINE_MAX = 1.5 * 1024 * 1024;

export const quietNotice = '쪽지는 선생님께 알림 소리 없이 전달돼요. 선생님이 확인 가능한 시간에 답장해 주실 거예요.';
