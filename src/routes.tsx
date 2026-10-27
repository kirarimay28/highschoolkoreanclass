import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { BoardPage } from '@/pages/board/BoardPage';
import { BoardPostPage } from '@/pages/board/BoardPostPage';
import { FeedbackPage } from '@/pages/feedback/FeedbackPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { StudentManagePage } from '@/pages/students/StudentManagePage';
import { StudyRoomPage } from '@/pages/studyroom/StudyRoomPage';
import { SubjectPage } from '@/pages/subjects/SubjectPage';
import { SubjectSelectPage } from '@/pages/subjects/SubjectSelectPage';
import { TutorialPage } from '@/pages/tutorial/TutorialPage';

/** URL ↔ 페이지 연결. 로비 메뉴(src/config/lobbyMenu.ts)의 path 와 맞춰 주세요. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/subjects" element={<SubjectSelectPage />} />
          <Route path="/subjects/:subjectId" element={<SubjectPage />} />
          <Route path="/studyroom" element={<StudyRoomPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/:postId" element={<BoardPostPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/students" element={<StudentManagePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/lobby" replace />} />
    </Routes>
  );
}
