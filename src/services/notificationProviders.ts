/**
 * 앱 안 알림 제공자 등록 — 새 종류의 알림은 여기에 추가하세요.
 * (예: 질의응답 게시판 답글, 고쳐주세요 처리 상태 변경)
 */
import { listConversations } from './messageService';
import { registerNotificationProvider } from './notifications';

// 선생님께 쪽지: 안 읽은 쪽지가 있는 대화
registerNotificationProvider(async (user) =>
  (await listConversations(user))
    .filter((c) => c.unreadCount > 0)
    .map((c) => {
      const last = c.messages.filter((m) => m.senderId === c.partnerId).at(-1)!;
      return {
        id: `message:${last.id}`,
        kind: 'message',
        title: `${c.partnerName}님의 쪽지${c.unreadCount > 1 ? ` ${c.unreadCount}개` : ''}`,
        body: last.content,
        link: `/messages/${encodeURIComponent(c.partnerId)}`,
        createdAt: last.createdAt,
      };
    }),
);
