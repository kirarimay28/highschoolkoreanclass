import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppRoutes } from './routes';

/** 미리보기 빌드(VITE_ROUTER=memory)는 주소창 없이 동작하는 MemoryRouter 사용 */
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
