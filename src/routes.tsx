import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { BoardPage } from '@/pages/board/BoardPage';
import { BoardPostPage } from '@/pages/board/BoardPostPage';
import { FeedbackPage } from '@/pages/feedback/FeedbackPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { ChatPage, ComposePage, MessagesPage } from '@/pages/messages/MessagesPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { StudentManagePage } from '@/pages/students/StudentManagePage';
import { StudyRoomPage } from '@/pages/studyroom/StudyRoomPage';
import { LecturePage } from '@/pages/subjects/lectures/LecturePage';
import { TimelinePage } from '@/pages/subjects/literature/TimelinePage';
import { VocabPage } from '@/pages/subjects/literature/vocab/VocabPage';
import { SubjectPage } from '@/pages/subjects/SubjectPage';
import { TutorialPage } from '@/pages/tutorial/TutorialPage';

// 무거운 페이지(React Flow)는 열 때만 불러옴
const DiyStructurePage = lazy(() => import('@/pages/subjects/reading/DiyStructurePage').then((m) => ({ default: m.DiyStructurePage })));

/** URL ↔ 페이지 연결. 로비 메뉴(src/config/lobbyMenu.ts)의 path 와 맞춰 주세요. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/subject/:subjectId" element={<SubjectPage />} />
          <Route path="/subject/literature/timeline" element={<TimelinePage />} />
          <Route path="/subject/literature/vocab" element={<VocabPage />} />
          <Route path="/subject/:subjectId/lectures" element={<LecturePage />} />
          <Route
            path="/subject/reading-writing/diy"
            element={
              <Suspense fallback={<p className="py-20 text-center text-sm text-ink-faint">구조도 작업판을 불러오는 중…</p>}>
                <DiyStructurePage />
              </Suspense>
            }
          />
          {/* 예전 주소 호환 */}
          <Route path="/subjects" element={<Navigate to="/lobby?expand=subjects" replace />} />
          <Route path="/subjects/:subjectId" element={<LegacySubjectRedirect />} />
          <Route path="/studyroom/:toolId" element={<StudyRoomPage />} />
          <Route path="/studyroom" element={<LegacyStudyroomRedirect />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/:postId" element={<BoardPostPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/new" element={<ComposePage />} />
          <Route path="/messages/:partnerId" element={<ChatPage />} />
          <Route path="/students" element={<StudentManagePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/lobby" replace />} />
    </Routes>
  );
}

function LegacySubjectRedirect() {
  const { subjectId } = useParams();
  return <Navigate to={`/subject/${subjectId}`} replace />;
}

/** /studyroom, 예전 /studyroom?tab=timer 주소 호환 */
function LegacyStudyroomRedirect() {
  const [params] = useSearchParams();
  const tab = params.get('tab');
  return <Navigate to={tab ? `/studyroom/${tab}` : '/lobby?expand=studyroom'} replace />;
}
