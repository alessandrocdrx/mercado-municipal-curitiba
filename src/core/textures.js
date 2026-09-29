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
export function facadeTexture(args) {
  if (args.style === 'arte') return facadeArte(args);
  return args.tema === 'estilizado' ? facadeEstilizada(args) : facadeAtual(args);
}

function facadeAtual({ style = 'box', color = '#6b6e73', label = '', sublabel = '', aspect = 1, known = true, facade, textColor, closed, vitrine, shutter, tema }) {
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
    // letreiro
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, signH);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0, signH - 6, w, 6);
    signText(ctx, label, known ? sublabel : '', 0, 0, w, signH, legivel(textColor, color)); // sem comerciante: só o número
    if (known && label) seloInfo(ctx, w, h, signH);
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

/** Selo "i" amarelo: convida a tocar para ver detalhes (fica no vão escuro, abaixo do letreiro). */
function seloInfo(ctx, w, h, signH) {
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

// ---------------------------------------------------------------- cenário estilizado
// Uma só paleta para tudo: lojas, chão, teto, mobiliário, corrimãos e rua.

export const PALETA = {
  creme: '#f4ead2', pedra: '#cfc6b4', terracota: '#c8553d', mostarda: '#e8b339',
  verde: '#1f4d3a', petroleo: '#2a7f8a', ameixa: '#7b4b6a', ardosia: '#2f3a44', ceu: '#dcecf3',
};
const CORES_LOJA = [PALETA.terracota, PALETA.mostarda, PALETA.verde, PALETA.petroleo, PALETA.ameixa, PALETA.ardosia];

/** Cor da paleta mais próxima: as lojas mantêm a ideia da cor do ramo, todas na mesma família. */
export function harmoniza(hex) {
  const c = new THREE.Color(hex);
  let melhor = CORES_LOJA[0];
  let menor = Infinity;
  for (const p of CORES_LOJA) {
    const q = new THREE.Color(p);
    const d = (c.r - q.r) ** 2 + (c.g - q.g) ** 2 + (c.b - q.b) ** 2;
    if (d < menor) { menor = d; melhor = p; }
  }
  return melhor;
}

/** Loja estilizada: letreiro liso, toldo listrado, vão em ardósia e balcão mostarda. */
function facadeEstilizada({ style = 'box', color = '#6b6e73', label = '', sublabel = '', aspect = 1, known = true, closed, shutter, vitrine }) {
  const P = PALETA;
  const w = 320;
  const h = Math.max(64, Math.round(w / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (style === 'porta') {
    ctx.fillStyle = P.verde;
    ctx.fillRect(0, 0, w, h * 0.26);
    ctx.fillRect(0, 0, w * 0.07, h);
    ctx.fillRect(w * 0.93, 0, w * 0.07, h);
    ctx.fillStyle = P.mostarda;
    ctx.fillRect(0, h * 0.26 - 5, w, 5);
    signText(ctx, label, sublabel, 0, 0, w, h * 0.26, P.creme);
  } else {
    const signH = style === 'banca' ? h * 0.42 : h * 0.3;
    const cor = known ? harmoniza(color) : '#7c7668';
    const y0 = signH + h * 0.04;
    ctx.fillStyle = P.creme;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = P.ardosia;
    ctx.fillRect(w * 0.06, y0, w * 0.88, h - y0);
    if (shutter) {
      ctx.fillStyle = P.pedra;
      ctx.fillRect(w * 0.06, y0, w * 0.88, h - y0);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      for (let y = y0 + 6; y < h; y += h * 0.05) ctx.fillRect(w * 0.06, y, w * 0.88, 2);
    } else if (closed) {
      ctx.fillStyle = '#bcd6e2';
      ctx.fillRect(w * 0.06, y0, w * 0.88, h - y0);
      ctx.fillStyle = P.ardosia;
      for (const x of [0.06, 0.36, 0.64, 0.92]) ctx.fillRect(w * x, y0, w * 0.02, h - y0);
    } else {
      ctx.fillStyle = vitrine ? '#bcd6e2' : P.mostarda;
      ctx.fillRect(w * 0.06, h * (style === 'banca' ? 0.72 : 0.68), w * 0.88, h * 0.06);
    }
    // toldo listrado com babado
    const n = 8;
    const tw = (w * 0.88) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? P.creme : cor;
      ctx.beginPath();
      ctx.rect(w * 0.06 + i * tw, signH, tw, h * 0.05);
      ctx.arc(w * 0.06 + i * tw + tw / 2, signH + h * 0.05, tw / 2, 0, Math.PI);
      ctx.fill();
    }
    // letreiro
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, w, signH);
    ctx.strokeStyle = P.creme;
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, w - 14, signH - 14);
    signText(ctx, label, known ? sublabel : '', 0, 0, w, signH, lum(cor) > 0.6 ? P.ardosia : P.creme);
    ctx.fillStyle = P.verde;
    ctx.fillRect(0, h - h * 0.04, w, h * 0.04);
    if (known && label) seloInfo(ctx, w, h, signH);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Teto creme com vigas verdes finas. */
export const tetoEstilizado = once(() => canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = PALETA.creme;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(31,77,58,.20)';
  ctx.fillRect(0, 0, w, 10);
  ctx.fillRect(0, 0, 10, h);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillRect(64, 64, 128, 128);
}));

/** Fachada de prédio: duas faixas de janelas azul-claras sobre fundo liso (a cor vem do material). */
export const predioEstilizado = once(() => canvasTexture(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, w, h);
  for (const y of [20, 72]) {
    ctx.fillStyle = '#8fb7c9';
    ctx.fillRect(10, y, 108, 34);
    ctx.fillStyle = '#f7f3ea';
    for (const x of [37, 64, 91]) ctx.fillRect(x, y, 3, 34);
  }
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  ctx.fillRect(0, h - 6, w, 6);
}));

/** Asfalto de estacionamento com divisórias das vagas (repetição = 2,5 m × 5,5 m). */
export const estacionamentoTexture = once(() => canvasTexture(128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#4a4f55';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, 4, h);
  ctx.fillRect(0, 0, w, 4);
}));


/** Painel de arte na parede (mural em estilo geométrico, moldura e plaqueta). */
function facadeArte({ label = '', sublabel = '', aspect = 2, tema }) {
  const w = 512;
  const h = Math.max(96, Math.round(w / aspect));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2f28'; g.fillRect(0, 0, w, h);
  const m = 8;
  g.fillStyle = '#efe4cc'; g.fillRect(m, m, w - 2 * m, h - 2 * m - 22);
  // figuras geométricas (evocam os painéis em traço de Poty; ilustração, não reprodução)
  const cores = ['#c8553d', '#1f4d3a', '#e8b339', '#2a7f8a', '#2f3a44'];
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 16; i++) {
    g.fillStyle = cores[i % cores.length];
    const x = m + rnd() * (w - 2 * m - 60);
    const y = m + rnd() * (h - 2 * m - 22 - 40);
    if (i % 3 === 0) { g.beginPath(); g.arc(x + 25, y + 20, 14 + rnd() * 14, 0, 6.3); g.fill(); }
    else g.fillRect(x, y, 20 + rnd() * 50, 14 + rnd() * 28);
  }
  g.strokeStyle = '#2f3a44'; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(m + rnd() * (w - 2 * m), m); g.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.6, m + rnd() * (w - 2 * m), h - 30); g.stroke(); }
  g.fillStyle = '#f4ead2'; g.fillRect(0, h - 22, w, 22);
  g.fillStyle = '#2f3a44'; g.font = 'bold 13px sans-serif'; g.textBaseline = 'middle';
  g.fillText(`${label} — ${sublabel}`.slice(0, 80), 10, h - 11);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
