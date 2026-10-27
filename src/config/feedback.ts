import type { FeedbackStatus, FeedbackType } from '@/types';

export const feedbackTypes: { id: FeedbackType; label: string }[] = [
  { id: 'bug', label: '버그 신고' },
  { id: 'inconvenience', label: '불편 사항' },
  { id: 'request', label: '업데이트 요청' },
];

/** 상태 순서 = 처리 흐름 순서 */
export const feedbackStatuses: { id: FeedbackStatus; label: string; className: string }[] = [
  { id: 'received', label: '접수', className: 'bg-ink/5 text-ink-soft border-ink/15' },
  { id: 'checking', label: '확인 중', className: 'bg-gold/15 text-gold-dark border-gold/40' },
  { id: 'done', label: '반영 완료', className: 'bg-success/10 text-success border-success/30' },
];
