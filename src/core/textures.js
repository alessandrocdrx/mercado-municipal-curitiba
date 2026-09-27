// Carregamento de texturas com cache, suporte a vídeo e placeholders gerados
// em canvas — assim o tour funciona antes de existir qualquer foto real.

import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const cache = new Map(); // chave -> Promise<Texture>

const VIDEO_EXT = /\.(mp4|webm|ogv)(\?|$)/i;

/**
 * media: { src?, placeholder?: { color, label, sublabel } }
 * baseUrl: pasta do JSON que declarou a mídia (src é relativo a ela)
 * version: string usada para invalidar cache do navegador quando o arquivo muda
 */
export function textureFor(media, { baseUrl, version, aspect = 1, fallbackLabel = '', labelScale = 1 } = {}) {
  if (media?.src) {
    const url = resolveUrl(media.src, baseUrl, version);
    if (!cache.has(url)) {
      const promise = (VIDEO_EXT.test(url) ? loadVideo(url) : loadImage(url)).catch((err) => {
        cache.delete(url);
        console.warn(`[tour] falha ao carregar ${url}`, err);
        return placeholderTexture({ color: '#5a1f1f', label: 'Arquivo não encontrado', sublabel: media.src, aspect });
      });
      cache.set(url, promise);
    }
    return cache.get(url);
  }
  return Promise.resolve(placeholderTexture({ label: fallbackLabel, labelScale, ...media?.placeholder, aspect }));
}

export function resolveUrl(src, baseUrl, version) {
  const url = new URL(src, new URL(baseUrl, window.location.href));
  if (version) url.searchParams.set('v', version);
  return url.toString();
}

/** Libera da GPU as texturas que não aparecem em `keep` (Set de Texture). */
export async function releaseUnused(keep) {
  for (const [key, promise] of cache) {
    const tex = await promise;
    if (!keep.has(tex)) {
      tex.image?.pause?.();
      tex.dispose();
      cache.delete(key);
    }
  }
}

export function clearTextureCache() {
  return releaseUnused(new Set());
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    Object.assign(video, { src: url, loop: true, muted: true, playsInline: true, crossOrigin: 'anonymous' });
    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {});
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    }, { once: true });
    video.addEventListener('error', () => reject(new Error(`vídeo inválido: ${url}`)), { once: true });
  });
}

/** Textura provisória: cor sólida, grade de 1 m aprox. e um rótulo. */
export function placeholderTexture({ color = '#3b4252', label = '', sublabel = '', aspect = 1, grid = 8, labelScale = 1 } = {}) {
  const w = 1024;
  const h = Math.max(64, Math.round(w / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  const step = w / grid;
  for (let x = step; x < w; x += step) line(ctx, x, 0, x, h);
  for (let y = step; y < h; y += step) line(ctx, 0, y, w, y);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = Math.min(h * 0.18, 96) * labelScale;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillText(label, w / 2, h / 2 - (sublabel ? size * 0.45 : 0), w * 0.9);
  if (sublabel) {
    ctx.font = `400 ${size * 0.45}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(sublabel, w / 2, h / 2 + size * 0.55, w * 0.9);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
