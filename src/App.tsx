import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
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
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
