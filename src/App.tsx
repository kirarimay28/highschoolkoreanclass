import { useState } from 'react';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SetPasswordPage } from '@/pages/login/SetPasswordPage';
import { passwordSetupType } from '@/services/supabase';
import { AppRoutes } from './routes';

/**
 * 라우터 선택 (VITE_ROUTER)
 *  - hash: GitHub Pages 같은 정적 호스팅 (주소가 /#/lobby 형태)
 *  - memory: claude.ai 미리보기
 *  - 기본: 일반 주소 (/lobby)
 */
const routers = { hash: HashRouter, memory: MemoryRouter } as const;
const Router = routers[import.meta.env.VITE_ROUTER as keyof typeof routers] ?? BrowserRouter;

export default function App() {
  // 초대·비밀번호 재설정 메일 링크로 들어온 경우에만 비밀번호 설정 화면을 먼저 보여 줌
  const [setupType, setSetupType] = useState(passwordSetupType);
  return (
    <Router>
      <AuthProvider>
        {setupType ? <SetPasswordPage type={setupType} onDone={() => setSetupType(null)} /> : <AppRoutes />}
      </AuthProvider>
    </Router>
  );
}
