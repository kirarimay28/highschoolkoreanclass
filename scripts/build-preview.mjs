// dist-preview/index.html 을 Artifact 형식(문서 뼈대 없이 본문만)으로 바꿉니다.
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'dist-preview/index.html';
const html = readFileSync(path, 'utf8');
const assets = [...html.matchAll(/<(script|link)[^>]*(?:src|href)="\.\/assets\/[^"]+"[^>]*>(?:<\/script>)?/g)].map((m) => m[0]);
const out = `<title>국어 교실 미리보기</title>
<meta name="theme-color" content="#8B1A1A">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap">
${assets.join('\n')}
<div id="root"></div>
`;
writeFileSync(path, out);
console.log('preview ready:', assets.length, 'asset tags');
