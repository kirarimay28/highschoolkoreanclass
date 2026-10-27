import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appConfig } from './config/app';
import { ensureSeedData } from './services/seedService';
// 폰트는 npm 패키지로 내장 (학교망·오프라인에서도 동작)
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/index.css';

ensureSeedData();
document.title = appConfig.documentTitle;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
