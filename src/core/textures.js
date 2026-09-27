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
export function textureFor(media, { baseUrl, version, aspect = 1, fallbackLabel = '', labelScale = 1, resolution = 1024 } = {}) {
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
  const ph = { label: fallbackLabel, labelScale, resolution, ...media?.placeholder, aspect };
  return Promise.resolve(ph.style ? facadeTexture(ph) : placeholderTexture(ph));
}

export function resolveUrl(src, baseUrl, version) {
  const url = new URL(src, new URL(baseUrl, window.location.href));
  // Build de arquivo único: imagens do tour embutidas como data: URI.
  const root = window.__TOUR_ROOT__;
  const embedded = root && url.href.startsWith(root) && window.__TOUR_ASSETS__?.[url.href.slice(root.length)];
  if (embedded) return embedded;
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
export function placeholderTexture({ color = '#3b4252', label = '', sublabel = '', aspect = 1, grid = 8, labelScale = 1, resolution = 1024 } = {}) {
  const w = resolution;
  const h = Math.max(32, Math.round(w / aspect));
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
  const size = Math.min(h * 0.18, w * 0.094) * labelScale;
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

/**
 * Fachada provisória para a maquete 3D: letreiro colorido no alto com o nome
 * e, abaixo, a "loja" (vão escuro com balcão). style: 'box' | 'banca' | 'porta'.
 */
export function facadeTexture({ style = 'box', color = '#6b6e73', label = '', sublabel = '', aspect = 1, known = true }) {
  const w = 512;
  const h = Math.max(64, Math.round(w / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (style === 'porta') {
    // vão aberto: só moldura e letreiro; o miolo fica transparente (vê-se a rua)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1d2a38';
    ctx.fillRect(0, 0, w, h * 0.26);
    ctx.fillRect(0, 0, w * 0.07, h);
    ctx.fillRect(w * 0.93, 0, w * 0.07, h);
    signText(ctx, label, sublabel, 0, 0, w, h * 0.26);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  } else {
    const signH = style === 'banca' ? h * 0.42 : h * 0.3;
    // corpo da loja
    ctx.fillStyle = '#e7e1d6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = known ? '#3b342c' : '#4a4a4a';
    ctx.fillRect(w * 0.06, signH + h * 0.04, w * 0.88, h - signH - h * 0.04);
    // balcão
    ctx.fillStyle = known ? shade(color, 0.35) : '#8a8a8a';
    ctx.fillRect(w * 0.06, h * (style === 'banca' ? 0.72 : 0.68), w * 0.88, h);
    // letreiro
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, signH);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0, signH - 6, w, 6);
    signText(ctx, label, sublabel, 0, 0, w, signH);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signText(ctx, label, sublabel, x, y, w, h) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  let size = Math.min(h * (sublabel ? 0.42 : 0.55), 72);
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  // quebra em duas linhas se o nome for longo
  const lines = fitLines(ctx, label, w * 0.9);
  if (lines.length > 1) {
    size *= 0.72;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
  }
  const total = lines.length * size + (sublabel ? size * 0.7 : 0);
  let cy = y + h / 2 - total / 2 + size / 2;
  for (const line of lines) {
    ctx.fillText(line, x + w / 2, cy, w * 0.92);
    cy += size;
  }
  if (sublabel) {
    ctx.font = `500 ${size * 0.5}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(sublabel, x + w / 2, cy - size * 0.15, w * 0.92);
  }
}

function fitLines(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return [text];
  const words = text.split(' ');
  let best = [text];
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const worst = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best.worst || worst < best.worst) best = Object.assign([a, b], { worst });
  }
  return best;
}

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  return `#${c.lerp(new THREE.Color('#ffffff'), amount).getHexString()}`;
}

/** Textura repetível de teto: forro claro com vigas. */
export function ceilingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ecebe6';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#c9c6bd';
  ctx.fillRect(0, 0, 256, 14);
  ctx.fillRect(0, 0, 14, 256);
  ctx.fillStyle = '#f7f6f2';
  ctx.fillRect(70, 70, 116, 116);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function canvasTexture(w, h, draw, repeat = true) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Asfalto com faixa central amarela tracejada (1 repetição = 12 m de rua). */
export function roadTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a3c40';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.fillStyle = '#e8c33a';
    ctx.fillRect(0, h / 2 - 5, w * 0.55, 10); // tracejado central
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 6, w, 6); // bordas da pista
    ctx.fillRect(0, h - 12, w, 6);
  });
}

/** Calçada de petit-pavê claro com juntas. */
export function sidewalkTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c9c4ba';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,70,60,.18)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= w; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  });
}

/** Faixa de pedestres (listras brancas). */
export function crosswalkTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(245,245,245,.95)';
    for (let x = 16; x < w; x += 64) ctx.fillRect(x, 0, 32, h);
  }, false);
}

/** Placa de rua (azul, texto branco). */
export function streetSignTexture(name) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f4f8f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 54px system-ui, sans-serif';
    ctx.fillText(name, w / 2, h / 2 + 2, w - 40);
  }, false);
}
