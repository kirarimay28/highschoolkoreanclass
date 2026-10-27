/**
 * claude.ai Artifact 미리보기용 빌드 설정 (npm run build:preview)
 * - 상대 경로 자산, MemoryRouter 사용
 * - 내장 폰트 파일 대신 Google Fonts 사용 (파일 수 제한 때문)
 */
import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import base from './vite.config';

const empty = fileURLToPath(new URL('./src/styles/preview/empty.css', import.meta.url));

export default mergeConfig(
  base,
  defineConfig({
    base: './',
    define: { 'import.meta.env.VITE_ROUTER': JSON.stringify('memory') },
    resolve: {
      alias: [
        { find: /^@fontsource\/.*\.css$/, replacement: empty },
        { find: /^pretendard\/.*\.css$/, replacement: empty },
      ],
    },
    build: { outDir: 'dist-preview', emptyOutDir: true },
  }),
);
