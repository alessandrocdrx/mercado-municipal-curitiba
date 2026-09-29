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
export function facadeTexture({ style = 'box', color = '#6b6e73', label = '', sublabel = '', aspect = 1, known = true, facade, textColor, closed, vitrine, shutter, textura }) {
  const w = 320;
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
    if (textura) {
      // moldura metálica com brilho, requadro interno e soleira de latão
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.28)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w * 0.07, h);
      ctx.fillRect(w * 0.93, 0, w * 0.07, h);
      ctx.fillRect(0, 0, w, h * 0.26);
      ctx.strokeStyle = '#5f7791';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.07, h * 0.26, w * 0.86, h * 0.72);
      ctx.fillStyle = '#b8964a';
      ctx.fillRect(w * 0.07, h * 0.97, w * 0.86, h * 0.03);
    }
    signText(ctx, label, sublabel, 0, 0, w, h * 0.26);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  } else {
    const signH = style === 'banca' ? h * 0.42 : h * 0.3;
    // corpo da loja
    // corpo da loja (cor real da fachada quando conhecida)
    ctx.fillStyle = facade ?? '#e7e1d6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = known ? '#3b342c' : '#4a4a4a';
    ctx.fillRect(w * 0.06, signH + h * 0.04, w * 0.88, h - signH - h * 0.04);
    if (shutter) {
      // fechada com porta de enrolar metálica
      ctx.fillStyle = '#9a9ea2';
      ctx.fillRect(w * 0.06, signH + h * 0.04, w * 0.88, h);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      for (let y = signH + h * 0.06; y < h; y += h * 0.035) ctx.fillRect(w * 0.06, y, w * 0.88, 2);
    } else if (closed) {
      // loja fechada: vitrine de vidro com caixilhos
      ctx.fillStyle = 'rgba(170,200,215,.55)';
      ctx.fillRect(w * 0.06, signH + h * 0.04, w * 0.88, h - signH - h * 0.04);
      ctx.fillStyle = '#2b2b2b';
      for (const x of [0.06, 0.36, 0.64, 0.92]) ctx.fillRect(w * x, signH + h * 0.04, w * 0.02, h);
    } else {
      // balcão (vitrine refrigerada = vidro claro)
      ctx.fillStyle = vitrine ? '#cfe3ea' : known ? shade(facade ?? color, 0.35) : '#8a8a8a';
      ctx.fillRect(w * 0.06, h * (style === 'banca' ? 0.72 : 0.68), w * 0.88, h);
    }
    if (textura) acabamentoLoja(ctx, w, h, { style, signH, counterY: h * (style === 'banca' ? 0.72 : 0.68), plain: Boolean(shutter || closed) });
    // letreiro
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, signH);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0, signH - 6, w, 6);
    if (textura) acabamentoLetreiro(ctx, w, signH);
    signText(ctx, label, known ? sublabel : '', 0, 0, w, signH, legivel(textColor, color)); // sem comerciante: só o número
    if (known && label) {
      // selo "i": convite a tocar para ver detalhes
      // fica no vão escuro da loja, abaixo do letreiro, para não cobrir nome e número
      const r = Math.min(w * 0.06, 20);
      const cx = w * 0.94 - r * 1.4;
      const cy = signH + h * 0.04 + r * 1.4;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1c1c1c';
      ctx.font = `bold ${Math.round(r * 1.4)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('i', cx, cy + 1);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signText(ctx, label, sublabel, x, y, w, h, color = '#fff') {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  let size = Math.min(h * (sublabel ? 0.42 : 0.55), w * 0.14);
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
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.fillText(sublabel, x + w / 2, cy - size * 0.15, w * 0.92);
    ctx.globalAlpha = 1;
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

const lum = (hex) => {
  const n = parseInt(String(hex).slice(1), 16);
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0.3;
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
/** Cor do texto do letreiro: a informada, se contrastar com o fundo; senão preto ou branco. */
function legivel(texto, fundo) {
  if (texto && Math.abs(lum(texto) - lum(fundo)) > 0.35) return texto;
  return lum(fundo) > 0.6 ? '#1c1c1c' : '#fff';
}

// ---------------------------------------------------------------- acabamentos (menu Visual > Texturas)

const once = (fn) => {
  let v;
  return () => {
    if (!v) { v = fn(); v.userData.shared = true; }
    return v;
  };
};

/** Reboco claro com manchas leves e rodapé; a cor da loja entra por `material.color`. */
export const plasterTexture = once(() => canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const a = Math.random() * 0.07;
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.fillRect(0, h * 0.86, w, 3);
}));

/** Concreto claro com granulado (laterais e espelhos dos degraus). */
export const concreteTexture = once(() => canvasTexture(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#d3cfc6';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.09})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}));

/** Piso do degrau: concreto com faixas antiderrapantes amarelas nas duas bordas. */
export const stepTopTexture = once(() => canvasTexture(256, 64, (ctx, w, h) => {
  ctx.fillStyle = '#c9c5bb';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  for (const y of [0, h - 12]) {
    ctx.fillStyle = '#e0b93a';
    ctx.fillRect(0, y, w, 12);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let x = 4; x < w; x += 10) ctx.fillRect(x, y + 3, 5, 6);
  }
}, false));

/** Detalhes extras da loja (rodapé de azulejo, veio de madeira no balcão, luz no vão). */
function acabamentoLoja(ctx, w, h, { style, signH, counterY, plain }) {
  const y0 = signH + h * 0.04;
  // luz vinda de cima no vão da loja
  if (!plain) {
    const g = ctx.createLinearGradient(0, y0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,.10)');
    g.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.06, y0, w * 0.88, h - y0);
    if (style === 'box') {
      ctx.strokeStyle = 'rgba(40,20,5,.28)';
      ctx.lineWidth = 1;
      for (let x = w * 0.06; x < w * 0.94; x += 14) {
        ctx.beginPath(); ctx.moveTo(x, counterY); ctx.lineTo(x, h); ctx.stroke();
      }
    }
  }
  // rodapé de azulejo
  const t = h * 0.07;
  ctx.fillStyle = '#efece4';
  ctx.fillRect(0, h - t, w, t);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += t) { ctx.beginPath(); ctx.moveTo(x, h - t); ctx.lineTo(x, h); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, h - t); ctx.lineTo(w, h - t); ctx.stroke();
  // pilaretes laterais
  ctx.fillStyle = 'rgba(0,0,0,.10)';
  ctx.fillRect(0, y0, w * 0.06, h - y0);
  ctx.fillRect(w * 0.94, y0, w * 0.06, h - y0);
}

/** Brilho e moldura do letreiro. */
function acabamentoLetreiro(ctx, w, signH) {
  const g = ctx.createLinearGradient(0, 0, 0, signH);
  g.addColorStop(0, 'rgba(255,255,255,.24)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,.20)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, signH);
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, signH - 14);
}

// ---------------------------------------------------------------- sinalização

const AVISOS = {
  saida: { fundo: '#0b7a45', texto: '#ffffff', titulo: 'SAÍDA', ratio: 0.42 },
  escada: { fundo: '#1f4f8f', texto: '#ffffff', titulo: 'ESCADA', ratio: 0.5 },
  rampa: { fundo: '#1f4f8f', texto: '#ffffff', titulo: 'RAMPA', ratio: 0.5 },
  degrau: { fundo: '#f2c200', texto: '#1c1c1c', titulo: 'CUIDADO', sub: 'DEGRAU', ratio: 0.75 },
  vao: { fundo: '#f2c200', texto: '#1c1c1c', titulo: 'ATENÇÃO', sub: 'VÃO', ratio: 0.75 },
  acessivel: { fundo: '#1f4f8f', texto: '#ffffff', titulo: 'ACESSÍVEL', ratio: 0.5 },
};
const avisoCache = new Map();

/** Placa de sinalização (canvas). `icone` escolhe o modelo; `texto` substitui o título. */
export function avisoTexture(icone = 'atencao', texto) {
  const key = `${icone}|${texto ?? ''}`;
  if (avisoCache.has(key)) return avisoCache.get(key);
  const cfg = AVISOS[icone] ?? { fundo: '#f2c200', texto: '#1c1c1c', titulo: texto ?? 'ATENÇÃO', ratio: 0.5 };
  const W = 256;
  const H = Math.round(W * cfg.ratio);
  const tex = canvasTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = cfg.fundo;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = cfg.texto;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = cfg.texto;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titulo = texto ?? cfg.titulo;
    if (icone === 'saida') {
      // porta com seta para a direita
      ctx.font = '700 62px system-ui, sans-serif';
      ctx.fillText(titulo, w * 0.42, h / 2 + 3, w * 0.7);
      ctx.beginPath();
      ctx.moveTo(w * 0.78, h * 0.5); ctx.lineTo(w * 0.9, h * 0.5);
      ctx.moveTo(w * 0.84, h * 0.32); ctx.lineTo(w * 0.92, h * 0.5); ctx.lineTo(w * 0.84, h * 0.68);
      ctx.lineWidth = 7; ctx.stroke();
    } else if (icone === 'escada' || icone === 'rampa') {
      ctx.beginPath();
      if (icone === 'escada') { ctx.moveTo(30, h * 0.42); for (let i = 0; i < 4; i++) { ctx.lineTo(30 + i * 20, h * 0.42 - i * 8 + 8); ctx.lineTo(30 + (i + 1) * 20, h * 0.42 - i * 8 + 8); } } else { ctx.moveTo(30, h * 0.5); ctx.lineTo(120, h * 0.28); ctx.lineTo(120, h * 0.5); ctx.closePath(); }
      ctx.lineWidth = 6; ctx.stroke();
      ctx.font = '700 52px system-ui, sans-serif';
      ctx.fillText(titulo, w * 0.62, h * 0.5, w * 0.56);
    } else if (cfg.sub) {
      // triângulo de advertência
      ctx.fillStyle = cfg.texto;
      ctx.beginPath(); ctx.moveTo(w * 0.5, 22); ctx.lineTo(w * 0.86, h * 0.56); ctx.lineTo(w * 0.14, h * 0.56); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cfg.fundo;
      ctx.font = '800 64px system-ui, sans-serif';
      ctx.fillText('!', w * 0.5, h * 0.42);
      ctx.fillStyle = cfg.texto;
      ctx.font = '800 34px system-ui, sans-serif';
      ctx.fillText(`${titulo} · ${cfg.sub}`, w / 2, h * 0.8, w * 0.86);
    } else {
      ctx.font = '700 44px system-ui, sans-serif';
      ctx.fillText(titulo, w / 2, h / 2, w * 0.86);
    }
  }, false);
  tex.userData.shared = true;
  tex.userData.ratio = cfg.ratio;
  avisoCache.set(key, tex);
  return tex;
}

/** Fachada de prédio com janelas (cinza claro; a cor do prédio entra por `material.color`). */
export const predioTexture = once(() => canvasTexture(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#ececec';
  ctx.fillRect(0, 0, w, h);
  for (const x of [14, 74]) {
    ctx.fillStyle = '#556b80';
    ctx.fillRect(x, 26, 40, 60);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(x, 26, 40, 18);
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 26, 40, 60);
    ctx.beginPath(); ctx.moveTo(x + 20, 26); ctx.lineTo(x + 20, 86); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(0, h - 6, w, 6);
}));
