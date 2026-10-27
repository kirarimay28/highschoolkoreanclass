/**
 * 앱 안 알림 제공자 등록 — 새 종류의 알림은 여기에 추가하세요.
 * (예: 질의응답 게시판 답글, 고쳐주세요 처리 상태 변경)
 */
import { can } from '@/config/permissions';
import { listMessages } from './messageService';
import { registerNotificationProvider } from './notifications';

// 선생님께 쪽지
registerNotificationProvider(async (user) => {
  const messages = await listMessages(user);
  if (can(user.role, 'receiveMessages')) {
    // 선생님: 새 쪽지, 또는 학생이 대화를 이어 쓴 쪽지
    return messages
      .filter((m) => m.status === 'sent')
      .map((m) => {
        const last = m.replies[m.replies.length - 1];
        const followUp = last && last.authorRole === 'student';
        return {
          id: `message:${m.id}:${m.replies.length}`,
          kind: 'message',
          title: followUp ? `${m.senderName} 학생이 쪽지를 이어 썼어요` : `${m.senderName} 학생의 새 쪽지`,
          body: m.title,
          link: `/messages/${m.id}`,
          createdAt: followUp ? last.createdAt : m.createdAt,
        };
      });
  }
  // 학생: 선생님의 답장
  return messages.flatMap((m) =>
    m.replies
      .filter((r) => r.authorRole !== 'student')
      .map((r) => ({
        id: `message-reply:${r.id}`,
        kind: 'message-reply',
        title: `${r.authorName}${r.authorRole === 'teacher' ? ' 선생님' : ''}이 답장했어요`,
        body: m.title,
        link: `/messages/${m.id}`,
        createdAt: r.createdAt,
      })),
  );
});
