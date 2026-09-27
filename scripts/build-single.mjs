#!/usr/bin/env node
// Gera dist-single/mercado-360.html: um único HTML com JS, CSS e o tour
// (JSON) embutidos. Útil para compartilhar uma demo sem servidor.
// Imagens do tour (jpg/png/webp/svg) também são embutidas; vídeos não.
// Para muitas fotos 360° publique a pasta dist/ completa.
//   npm run build:single

import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const tourDir = 'public/tour';
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const inlineAsset = (file) => fs.readFileSync(path.join(dist, file), 'utf8').replaceAll('</script', '<\\/script');
const jsFile = html.match(/<script type="module"[^>]*src="\.\/([^"]+)"/)[1];
const cssFile = html.match(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"/)?.[1];

const tourFiles = {};
const tourAssets = {};
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const key = path.relative(tourDir, full).split(path.sep).join('/');
    const ext = path.extname(name).toLowerCase();
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (ext === '.json') tourFiles[key] = JSON.parse(fs.readFileSync(full, 'utf8'));
    else if (MIME[ext]) tourAssets[key] = `data:${MIME[ext]};base64,${fs.readFileSync(full).toString('base64')}`;
  }
})(tourDir);

// ícone e imagem de compartilhamento embutidos (a página não tem outros arquivos)
const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(path.join('public', file)).toString('base64')}`;
const icon = dataUri('icon.svg', 'image/svg+xml');
const head = html.match(/<head>([\s\S]*)<\/head>/)[1]
  .split('\n').filter((l) => /<meta (name="(description|theme-color|twitter:card)"|property="og:)|<link rel="(icon|apple-touch-icon)"/.test(l)).join('\n')
  .replaceAll('./icon.svg', icon)
  .replaceAll('./apple-touch-icon.png', dataUri('apple-touch-icon.png', 'image/png'))
  .replaceAll('./og-image.jpg', dataUri('og-image.jpg', 'image/jpeg'));

const title = html.match(/<title>(.*?)<\/title>/)[1];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script type="module"[^>]*><\/script>/, '').replaceAll('./icon.svg', icon);

const out = `<title>${title}</title>
${head}
${cssFile ? `<style>${inlineAsset(cssFile)}</style>` : ''}
${body.trim()}
<script>window.__TOUR_FILES__ = ${JSON.stringify(tourFiles).replaceAll('</', '<\\/')};
window.__TOUR_ASSETS__ = ${JSON.stringify(tourAssets)};</script>
<script type="module">${inlineAsset(jsFile)}</script>
`;

fs.mkdirSync('dist-single', { recursive: true });
fs.writeFileSync('dist-single/mercado-360.html', out);
console.log(`dist-single/mercado-360.html (${(out.length / 1024).toFixed(0)} KB, ${Object.keys(tourFiles).length} arquivos do tour e ${Object.keys(tourAssets).length} imagens embutidos)`);
