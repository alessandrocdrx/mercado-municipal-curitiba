// Monta um THREE.Group para uma cena: panorâmica base (cubo ou equiretangular,
// completa ou parcial) + módulos sobrepostos + descrição dos links.

import * as THREE from 'three';
import { DEG, bearing, wrapDeg, worldToLocal } from '../core/geo.js';
import { textureFor, ceilingTexture, roadTexture, sidewalkTexture, crosswalkTexture, streetSignTexture, avisoTexture, predioTexture, predioEstilizado, tetoEstilizado, harmoniza, PALETA } from '../core/textures.js';
import { settings } from '../core/settings.js';

const estilizado = () => settings.estilo === 'estilizado';
const proprio = (t) => { const c = t.clone(); c.userData = { own: true }; c.needsUpdate = true; return c; };
import { applyPlacement, isWorldPlacement } from './placement.js';

const BASE_RADIUS = 1000;
export const CUBE_FACES = ['front', 'right', 'back', 'left', 'up', 'down'];
const FACE_LABELS = { front: 'Frente', right: 'Direita', back: 'Trás', left: 'Esquerda', up: 'Teto', down: 'Piso' };

export async function buildScene(loader, sceneId) {
  const [scene, scenes, modules] = await Promise.all([
    loader.scene(sceneId),
    loader.allScenes(),
    loader.allModules(),
  ]);
  const group = new THREE.Group();
  group.name = `scene:${scene.id}`;

  // Sem foto 360° no ponto, o app monta uma maquete 3D do pavimento inteiro
  // (chão com a planta, teto, boxes em volume, rua). Ela é montada uma vez por
  // pavimento, em torno de uma âncora fixa, e a câmera anda por ela.
  const model = !hasPhoto(scene.base);
  let environment = { background: '#111111' };
  let anchor = scene;
  if (model) {
    const eye = scene.position?.z ?? 1.6;
    anchor = {
      id: `pavimento:${scene.floor ?? ''}`, floor: scene.floor, northYaw: 0,
      position: { x: 0, y: 0, z: eye }, moduleRadius: Infinity, layers: [], hideModules: [],
    };
    const tour = await loader.tour();
    const floor = tour.floors?.find((f) => f.id === scene.floor);
    environment = await buildModel(group, anchor, floor, loader.tourUrl, { tour, modules, scenes });
  } else {
    group.add(await buildBase(scene));
  }

  const layers = collectLayers(anchor, modules);
  const meshes = await Promise.all(layers.map(({ module, placement }) => buildModuleMesh(module, placement, anchor, model)));
  meshes.forEach((m) => group.add(m));

  return {
    scene,
    scenes,
    modules,
    group,
    meshes,
    environment,
    world: model ? { floor: scene.floor ?? null } : null,
    anchor,
    eye: eyeFor(scene, anchor),
    links: resolveLinks(scene, scenes),
    dispose: () => disposeGroup(group),
  };
}

/** Posição da câmera (coordenadas do grupo) para um ponto de vista. */
export function eyeFor(scene, anchor) {
  if (!scene.position || anchor === scene) return new THREE.Vector3();
  return worldToLocal({ ...scene.position, z: scene.position.z ?? anchor.position.z }, anchor); // desníveis (escadas, mezaninos)
}

// ---------------------------------------------------------------- maquete

export function hasPhoto(base) {
  if (!base) return false;
  if (base.type === 'equirect') return Boolean(base.src);
  return Object.values(base.faces ?? {}).some((f) => typeof f === 'string' || f?.src);
}

const CEILING_HEIGHT = 5.5;

async function buildModel(group, scene, floor, tourUrl, ctx = {}) {
  // luz para os volumes dos boxes terem faces com tons diferentes
  group.add(new THREE.AmbientLight('#ffffff', estilizado() ? 1.9 : 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', estilizado() ? 0.9 : 1.4);
  sun.position.set(0.4, 1, 0.25);
  group.add(sun);

  const cam = scene.position ?? { x: 0, y: 0 };
  // Pavimento com outro embaixo (o superior): o piso fica transparente onde não há laje
  // (fora do contorno e nos vãos) e por ali se vê o pavimento de baixo.
  const vazado = Boolean(floor?.below && ctx.tour && ctx.modules);
  const vaos = (floor?.props ?? []).filter((p) => p.tipo === 'vao');
  const plate = await addFloorPlane(group, scene, floor, tourUrl, { alpha: vazado, holes: vaos, extras: vazado ? sustentos(floor, ctx) : [] });
  if (vazado) await buildBelow(group, scene, floor, tourUrl, ctx, plate);
  if (ctx.modules && ctx.scenes && floor?.id !== 'inferior') {
    for (const g of autoGuardas(floor, plate?.userData.mask, ctx)) buildProp(group, scene, g);
  }
  // piso neutro em volta, para não haver "buraco" fora da planta
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: estilizado() ? '#d9cfba' : '#8d8b86' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(cam.z ?? 1.6) - 0.02 - (vazado ? floor.below.drop + 0.05 : 0);
  group.add(ground);

  // teto só sobre a área coberta do pavimento (na rua, céu aberto)
  const cov = floor?.covered;
  const ceilTex = estilizado() ? proprio(tetoEstilizado()) : ceilingTexture();
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ceilTex }));
  ceiling.name = 'teto';
  if (cov) {
    const w = Math.abs(cov.to.x - cov.from.x);
    const h = Math.abs(cov.to.y - cov.from.y);
    ceilTex.repeat.set(w / 6, h / 6);
    applyPlacement(ceiling, {
      x: (cov.from.x + cov.to.x) / 2, y: (cov.from.y + cov.to.y) / 2, z: CEILING_HEIGHT,
      width: w, height: h, facing: 0, surface: 'ceiling',
    }, scene);
  } else {
    ceilTex.repeat.set(400 / 6, 400 / 6);
    ceiling.scale.set(400, 400, 1);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = CEILING_HEIGHT - (cam.z ?? 1.6);
  }
  group.add(ceiling);

  for (const street of floor?.streets ?? []) buildStreet(group, scene, street);
  for (const prop of floor?.props ?? []) buildProp(group, scene, vazado && prop.tipo === 'vao' ? { ...prop, aberto: true } : prop);

  return estilizado()
    ? { background: PALETA.ceu, fog: { color: '#e6f0f4', near: 14, far: 60 } }
    : { background: '#cfdbe4', fog: { color: '#d6dde2', near: 12, far: 55 } };
}

/**
 * Piso = foto da planta, na escala e posição da própria planta, recortada na área
 * coberta (fora dela a foto mostra só o papel). Com `alpha`, o papel de fora e os
 * vãos ficam transparentes. Devolve a textura base (com a máscara em userData).
 */
async function addFloorPlane(group, scene, floor, tourUrl, { alpha = false, holes = [], extras = [] } = {}) {
  if (!floor?.plan) return null;
  const W = floor.plan.width;
  const H = floor.plan.height;
  const cov = floor.covered ?? { from: { x: 0, y: 0 }, to: { x: W, y: -H } };
  const x0 = Math.min(cov.from.x, cov.to.x);
  const x1 = Math.max(cov.from.x, cov.to.x);
  const y0 = Math.min(-cov.from.y, -cov.to.y); // distância a partir do topo da planta
  const y1 = Math.max(-cov.from.y, -cov.to.y);
  const original = await textureFor({ src: floor.plan.floorSrc ?? floor.plan.src }, { baseUrl: tourUrl }); // piso sem textos
  const base = alpha ? plateTexture(original, floor, holes, extras) : original;
  const tex = base.clone();
  tex.userData = { own: true, base }; // cópia com recorte próprio
  tex.repeat.set((x1 - x0) / W, (y1 - y0) / H);
  tex.offset.set(x0 / W, 1 - y1 / H);
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: estilizado() ? '#f6ecd6' : '#d8d8d8', transparent: alpha, alphaTest: alpha ? 0.5 : 0 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  plane.name = 'piso-planta';
  applyPlacement(plane, {
    x: (x0 + x1) / 2, y: -(y0 + y1) / 2, z: 0,
    width: x1 - x0, height: y1 - y0, facing: 0, surface: 'floor',
  }, scene);
  group.add(plane);
  return base;
}

const plateCache = new Map();

/**
 * Cópia da foto do piso em que o "papel" ligado às bordas (fora do contorno da laje)
 * e os vãos são transparentes. `userData.mask` guarda 0/255 por pixel.
 */
/**
 * Formas (em metros da planta) onde o piso do pavimento existe mesmo fora do contorno
 * desenhado: a planta é esquemática, mas mesas, lojas, caminhos e plataformas são medidos.
 */
function sustentos(floor, { scenes = [], modules = [] }) {
  const same = (s) => (s.floor ?? null) === floor.id && s.position;
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const out = [];
  for (const s of scenes.filter(same)) {
    out.push({ c: [s.position.x, s.position.y], r: 3.2 });
    for (const l of s.links ?? []) {
      const t = byId.get(l.to);
      if (t && same(t)) out.push({ seg: [s.position.x, s.position.y, t.position.x, t.position.y], w: 3.2 });
    }
  }
  for (const p of floor.props ?? []) {
    if (p.tipo === 'mesa') out.push({ c: [p.x, p.y], r: 1.7 });
    else if (p.tipo === 'vaso' || p.tipo === 'pilar') out.push({ c: [p.x, p.y], r: 1.0 });
    else if (p.tipo === 'guarda') out.push({ seg: [p.x, p.y, p.x2, p.y2], w: 0.6 });
    else if (p.tipo === 'plataforma') out.push({ poly: p.pontos });
    else if (p.tipo === 'escada') out.push({ seg: [p.x, p.y, p.x2, p.y2], w: 2.4 });
  }
  for (const m of modules) {
    const q = m.placement;
    if (isWorldPlacement(q) && (q.floor ?? null) === floor.id && ['box', 'banca', 'porta'].includes(m.type)) out.push({ c: [q.x, q.y], r: 1.6 });
  }
  return out;
}

function plateTexture(original, floor, holes, extras = []) {
  const key = `${floor.id}|${holes.length}`;
  if (plateCache.has(key)) return plateCache.get(key);
  const img = original.image;
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;
  const ref = [px[0], px[1], px[2]];
  const isPaper = (k) => Math.abs(px[k * 4] - ref[0]) + Math.abs(px[k * 4 + 1] - ref[1]) + Math.abs(px[k * 4 + 2] - ref[2]) < 40;
  const seen = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let head = 0;
  let tail = 0;
  const push = (x, y) => {
    const k = y * W + x;
    if (!seen[k] && isPaper(k)) { seen[k] = 1; queue[tail++] = k; }
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (head < tail) {
    const k = queue[head++];
    px[k * 4 + 3] = 0;
    const x = k % W;
    const y = (k / W) | 0;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }
  ctx.putImageData(data, 0, 0);
  // Pinta atrás do que já existe: só aparece onde a foto estava transparente.
  const kx = W / floor.plan.width;
  const ky = H / floor.plan.height;
  const paint = (c) => {
    c.fillStyle = '#e2d9c8';
    c.strokeStyle = '#e2d9c8';
    c.lineCap = 'round';
    for (const s of extras) {
      if (s.c) {
        c.beginPath();
        c.arc(s.c[0] * kx, -s.c[1] * ky, s.r * kx, 0, Math.PI * 2);
        c.fill();
      } else if (s.seg) {
        c.lineWidth = s.w * kx;
        c.beginPath();
        c.moveTo(s.seg[0] * kx, -s.seg[1] * ky);
        c.lineTo(s.seg[2] * kx, -s.seg[3] * ky);
        c.stroke();
      } else if (s.poly) {
        c.beginPath();
        s.poly.forEach(([x, y], i) => { if (i) c.lineTo(x * kx, -y * ky); else c.moveTo(x * kx, -y * ky); });
        c.closePath();
        c.fill();
      }
    }
  };
  if (extras.length) {
    // o contorno preto da planta não deve cortar o chão nas áreas estendidas
    const ex = document.createElement('canvas');
    ex.width = W;
    ex.height = H;
    const ec = ex.getContext('2d', { willReadFrequently: true });
    paint(ec);
    const area = ec.getImageData(0, 0, W, H).data;
    const cur = ctx.getImageData(0, 0, W, H);
    const c = cur.data;
    for (let k = 0; k < W * H; k++) {
      if (!area[k * 4 + 3] || !c[k * 4 + 3]) continue;
      const r = c[k * 4];
      const g = c[k * 4 + 1];
      const b = c[k * 4 + 2];
      if (r + g + b < 450 && Math.max(r, g, b) - Math.min(r, g, b) < 30) { c[k * 4] = 226; c[k * 4 + 1] = 217; c[k * 4 + 2] = 200; }
    }
    ctx.putImageData(cur, 0, 0);
  }
  ctx.globalCompositeOperation = 'destination-over';
  paint(ctx);
  // vãos (polígonos em metros da planta → pixels)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  for (const h of holes) {
    ctx.beginPath();
    h.pontos.forEach(([x, y], i) => {
      const X = (x * W) / floor.plan.width;
      const Y = (-y * H) / floor.plan.height;
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    });
    ctx.closePath();
    ctx.fill();
  }
  const final = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) mask[k] = final[k * 4 + 3] > 127 ? 255 : 0;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData = { shared: true, mask: { W, H, data: mask } };
  plateCache.set(key, tex);
  return tex;
}

/** Contornos (laços de vértices em células) das regiões opacas da máscara. */
function outlineLoops(mask, step = 4) {
  const { W, H, data } = mask;
  const GW = Math.ceil(W / step);
  const GH = Math.ceil(H / step);
  const solid = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const x = Math.min(W - 1, i * step + (step >> 1));
      const y = Math.min(H - 1, j * step + (step >> 1));
      solid[j * GW + i] = data[y * W + x] ? 1 : 0;
    }
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= GW || j >= GH ? 0 : solid[j * GW + i]);
  const key = (i, j) => j * (GW + 1) + i;
  const edges = new Map();
  const add = (a, b, c, d) => {
    const k = key(a, b);
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k).push({ i: c, j: d, used: false });
  };
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      if (!at(i, j)) continue;
      if (!at(i, j - 1)) add(i, j, i + 1, j);
      if (!at(i + 1, j)) add(i + 1, j, i + 1, j + 1);
      if (!at(i, j + 1)) add(i + 1, j + 1, i, j + 1);
      if (!at(i - 1, j)) add(i, j + 1, i, j);
    }
  }
  const loops = [];
  for (const [k0, list] of edges) {
    for (const e0 of list) {
      if (e0.used) continue;
      const i0 = k0 % (GW + 1);
      const j0 = Math.floor(k0 / (GW + 1));
      const pts = [[i0, j0]];
      let e = e0;
      for (;;) {
        e.used = true;
        if (e.i === i0 && e.j === j0) break;
        pts.push([e.i, e.j]);
        const next = (edges.get(key(e.i, e.j)) ?? []).find((x) => !x.used);
        if (!next) break;
        e = next;
      }
      loops.push(pts.map(([i, j]) => [i * step, j * step]));
    }
  }
  return loops;
}

/** Douglas-Peucker num laço fechado. */
function simplifyLoop(pts, eps) {
  if (pts.length < 4) return pts;
  const dist = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const ring = pts.concat([pts[0]]);
  const rec = (a, b, out) => {
    let far = -1;
    let max = -1;
    for (let k = a + 1; k < b; k++) {
      const d = dist(ring[k], ring[a], ring[b]);
      if (d > max) { max = d; far = k; }
    }
    if (max > eps) { rec(a, far, out); rec(far, b, out); } else out.push(ring[b]);
  };
  let mid = 0;
  let best = -1;
  ring.forEach((p, k) => { const d = Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]); if (d > best) { best = d; mid = k; } });
  const out = [ring[0]];
  rec(0, mid, out);
  rec(mid, ring.length - 1, out);
  out.pop();
  return out;
}

/**
 * Guarda-corpos automáticos: ao longo das bordas abertas da laje (contorno da máscara) e das
 * plataformas. Ficam de fora os trechos junto de lojas, escadas, pontos de vista e caminhos
 * entre eles e onde já existe guarda-corpo ou vão.
 */
function autoGuardas(floor, mask, { modules, scenes }) {
  const props = floor.props ?? [];
  const segs = [];
  for (const p of props) {
    if (p.tipo === 'guarda') segs.push([p.x, p.y, p.x2, p.y2]);
    if (p.tipo === 'vao') p.pontos.forEach(([x, y], i) => { const q = p.pontos[(i + 1) % p.pontos.length]; segs.push([x, y, q[0], q[1]]); });
  }
  const same = (s) => (s.floor ?? null) === floor.id && s.position;
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const caminhos = [];
  for (const s of scenes.filter(same)) {
    for (const l of s.links ?? []) {
      const t = byId.get(l.to);
      if (t && same(t)) caminhos.push([s.position.x, s.position.y, t.position.x, t.position.y]);
    }
  }
  const pontos = scenes.filter(same).map((s) => [s.position.x, s.position.y]);
  const lojas = modules
    .filter((m) => isWorldPlacement(m.placement) && (m.placement.floor ?? null) === floor.id && ['box', 'banca', 'porta'].includes(m.type))
    .map((m) => ({ x: m.placement.x, y: m.placement.y, r: (m.placement.width ?? 1) / 2 + 1.4 }));
  const degraus = props.filter((p) => p.tipo === 'escada').flatMap((p) => [[p.x, p.y], [p.x2, p.y2]]);
  const dSeg = (px, py, [x1, y1, x2, y2]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
  };
  const protegido = (x, y) => segs.some((s) => dSeg(x, y, s) < 0.9)
    || caminhos.some((s) => dSeg(x, y, s) < 1.5)
    || pontos.some(([a, b]) => Math.hypot(x - a, y - b) < 2.2)
    || lojas.some((l) => Math.hypot(x - l.x, y - l.y) < l.r)
    || degraus.some(([a, b]) => Math.hypot(x - a, y - b) < 2.6);

  const out = [];
  const trecho = (a, b, base) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    const em = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    let ini = null;
    const fecha = (t0, t1) => {
      const p = em(t0);
      const q = em(t1);
      out.push({ tipo: 'guarda', x: p.x, y: p.y, x2: q.x, y2: q.y, esp: 1.4, base, auto: true });
    };
    for (let k = 0; k < n; k++) {
      const m = em((k + 0.5) / n);
      if (!protegido(m.x, m.y)) {
        if (ini === null) ini = k / n;
        if (k === n - 1) fecha(ini, 1);
      } else if (ini !== null) {
        fecha(ini, k / n);
        ini = null;
      }
    }
  };
  if (mask) {
    for (const loop of outlineLoops(mask)) {
      const poly = simplifyLoop(loop, 5).map(([px, py]) => ({ x: (px * floor.plan.width) / mask.W, y: (-py * floor.plan.height) / mask.H }));
      poly.forEach((a, i) => trecho(a, poly[(i + 1) % poly.length], 0));
    }
  }
  for (const p of props.filter((q) => q.tipo === 'plataforma')) {
    const poly = p.pontos.map(([x, y]) => ({ x, y }));
    poly.forEach((a, i) => trecho(a, poly[(i + 1) % poly.length], p.altura ?? 1.5));
  }
  return out;
}

/**
 * Pavimento de baixo, visto pelos vãos e por onde não há laje. Os pontos do
 * pavimento inferior passam ao referencial do superior pelas coordenadas do tour 3D
 * (as duas plantas têm escala e giro próprios) e descem `drop` metros.
 */
async function buildBelow(group, anchor, floor, tourUrl, { tour, modules }, upper) {
  const lower = tour.floors.find((f) => f.id === floor.below.floor);
  if (!lower?.tour3d || !floor.tour3d || !upper?.userData.mask) return;
  const drop = floor.below.drop ?? 4.5;
  const lin = (t) => [[t.ex[0], t.ey[0]], [t.ex[1], t.ey[1]]];
  const Ai = lin(lower.tour3d);
  const As = lin(floor.tour3d);
  const det = Ai[0][0] * Ai[1][1] - Ai[0][1] * Ai[1][0];
  const inv = [[Ai[1][1] / det, -Ai[0][1] / det], [-Ai[1][0] / det, Ai[0][0] / det]];
  const M = [0, 1].map((r) => [0, 1].map((c) => As[r][0] * inv[0][c] + As[r][1] * inv[1][c]));
  const oi = lower.tour3d.o;
  const os = floor.tour3d.o;
  const t = [os[0] - (M[0][0] * oi[0] + M[0][1] * oi[1]), os[1] - (M[1][0] * oi[0] + M[1][1] * oi[1])];

  const sub = new THREE.Group();
  sub.name = 'pavimento-abaixo';
  sub.matrixAutoUpdate = false;
  // local = (x, altura, -y da planta); y_planta_cima = M · y_planta_baixo + t
  sub.matrix.set(M[0][0], 0, -M[0][1], t[0], 0, 1, 0, -drop, -M[1][0], 0, M[1][1], -t[1], 0, 0, 0, 1);
  group.add(sub);

  const lowerAnchor = { ...anchor, id: `pavimento:${lower.id}`, floor: lower.id };
  await addFloorPlane(sub, lowerAnchor, lower, tourUrl, { alpha: true });

  // só o que fica sob uma área vazada do piso de cima
  const { W, H, data } = upper.userData.mask;
  const visivel = (x, y) => {
    const X = M[0][0] * x + M[0][1] * y + t[0];
    const Y = M[1][0] * x + M[1][1] * y + t[1];
    const px = Math.round((X * W) / floor.plan.width);
    const py = Math.round((-Y * H) / floor.plan.height);
    return px < 0 || py < 0 || px >= W || py >= H || data[py * W + px] === 0;
  };
  for (const m of modules) {
    const p = m.placement;
    if (!isWorldPlacement(p) || m.enabled === false || (p.floor ?? null) !== lower.id || !BODY_DEPTH[m.type === 'banca' ? 'banca' : 'box'] || m.type === 'porta') continue;
    if (!visivel(p.x, p.y)) continue;
    const ph = m.media?.placeholder ?? {};
    const depth = p.depth ?? BODY_DEPTH[m.type === 'banca' ? 'banca' : 'box'];
    const fachada = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lowMat(estilizado() ? harmoniza(ph.color ?? '#7a6f5a') : (ph.color ?? '#7a6f5a')));
    const volume = new THREE.Mesh(new THREE.BoxGeometry(1, 1, depth), lowMat(estilizado() ? PALETA.creme : (ph.facade ?? '#ddd6c8')));
    volume.position.z = -depth / 2 - 0.005;
    fachada.add(volume);
    applyPlacement(fachada, p, lowerAnchor);
    sub.add(fachada);
  }
  for (const prop of lower.props ?? []) {
    if (typeof prop.x === 'number' && !visivel(prop.x, prop.y)) continue;
    buildProp(sub, lowerAnchor, prop);
  }
}

const lowMats = new Map();
function lowMat(color) {
  if (!lowMats.has(color)) lowMats.set(color, new THREE.MeshLambertMaterial({ color }));
  return lowMats.get(color);
}

/**
 * Rua do lado de fora do prédio: calçada, meio-fio, asfalto com faixa
 * central, faixas de pedestres em frente às portas, calçada oposta e placas.
 */
function buildStreet(group, scene, st) {
  const along = bearing(st.from, st.to); // direção da rua (graus a partir do norte)
  const L = Math.hypot(st.to.x - st.from.x, st.to.y - st.from.y) + 60;
  const out = along + (st.side === 'norte' || st.side === 'esquerda' ? -90 : 90); // do prédio para a rua
  const n = { x: Math.sin(out * DEG), y: Math.cos(out * DEG) };
  const mid = { x: (st.from.x + st.to.x) / 2, y: (st.from.y + st.to.y) / 2 };
  const at = (off) => ({ x: mid.x + n.x * off, y: mid.y + n.y * off });
  const strip = (off, width, z, material, name) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    m.name = name;
    applyPlacement(m, { ...at(off), z, width: L, height: width, facing: along - 90, surface: 'floor' }, scene);
    group.add(m);
    return m;
  };
  const tex = (t, rx, ry) => { t.repeat.set(rx, ry); return t; };

  strip(st.sidewalk / 2, st.sidewalk, 0.15, new THREE.MeshBasicMaterial({ map: tex(sidewalkTexture(), L / 2, st.sidewalk / 2) }), 'calcada');
  strip(st.sidewalk + st.road / 2, st.road, 0.01, new THREE.MeshBasicMaterial({ map: tex(roadTexture(), L / 12, 1) }), 'asfalto');
  strip(st.sidewalk + st.road + st.farSidewalk / 2, st.farSidewalk, 0.15, new THREE.MeshBasicMaterial({ map: tex(sidewalkTexture(), L / 2, st.farSidewalk / 2) }), 'calcada-oposta');

  // meio-fio (degrau de 15 cm) dos dois lados da pista
  for (const off of [st.sidewalk, st.sidewalk + st.road]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(L, 0.15, 0.2), new THREE.MeshLambertMaterial({ color: '#9d988e' }));
    const p = worldToLocal({ ...at(off), z: 0.075 }, scene);
    curb.position.copy(p);
    curb.rotation.y = -((scene.northYaw ?? 0) + along - 90) * DEG;
    group.add(curb);
  }

  // faixas de pedestres em frente às portas
  const cwTex = crosswalkTexture();
  for (const x of st.crosswalks ?? []) {
    const base = { x: st.from.x + (x - st.from.x), y: st.from.y };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cwTex, transparent: true }));
    const c = { x: base.x + n.x * (st.sidewalk + st.road / 2), y: base.y + n.y * (st.sidewalk + st.road / 2) };
    applyPlacement(m, { ...c, z: 0.02, width: 4, height: st.road - 0.6, facing: along - 90, surface: 'floor' }, scene);
    group.add(m);
  }

  // placas com o nome da rua na beira da calçada, a cada 30 m
  const signTex = streetSignTexture(st.name);
  const postMat = new THREE.MeshLambertMaterial({ color: '#50555c' });
  const lenReal = L - 60;
  for (let d = 10; d < lenReal; d += 30) {
    const k = d / lenReal;
    const pt = { x: st.from.x + (st.to.x - st.from.x) * k + n.x * (st.sidewalk - 0.4), y: st.from.y + (st.to.y - st.from.y) * k + n.y * (st.sidewalk - 0.4) };
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), postMat);
    post.position.copy(worldToLocal({ ...pt, z: 1.3 }, scene));
    group.add(post);
    // uma face para cada lado, para o texto nunca aparecer espelhado
    for (const facing of [out, out + 180]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: signTex }));
      applyPlacement(sign, { ...pt, z: 2.75, width: 1.6, height: 0.4, facing: facing % 360, surface: 'wall' }, scene);
      sign.name = 'placa-rua';
      group.add(sign);
    }
  }

  // fundo urbano: prédios do outro lado da rua, árvores na calçada oposta e postes de luz
  const alongV = { x: Math.sin(along * DEG), y: Math.cos(along * DEG) };
  const pos = (off, t, z) => worldToLocal({ x: mid.x + n.x * off + alongV.x * t, y: mid.y + n.y * off + alongV.y * t, z }, scene);
  const rotY = -((scene.northYaw ?? 0) + along - 90) * DEG;
  const farEdge = st.sidewalk + st.road + st.farSidewalk;
  const alturas = [11, 17, 8, 21, 13, 9, 19, 12];
  const cores = estilizado()
    ? ['#f0d9b5', '#e7c9a9', '#cfe0e6', '#e9e2c8', '#dcc9d4', '#d9e3cf']
    : ['#c9b79c', '#b7c2c9', '#d4c1a8', '#a9b5a1', '#cbbfb0', '#b9a9a0'];
  let t = -L / 2;
  for (let i = 0; t < L / 2; i++) {
    const w = 12 + ((i * 7) % 9);
    const h = alturas[i % alturas.length];
    const map = (estilizado() ? predioEstilizado() : predioTexture()).clone();
    map.userData = { own: true };
    map.repeat.set(w / 5, h / 3.5);
    map.needsUpdate = true;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), new THREE.MeshLambertMaterial({ color: cores[i % cores.length], map }));
    b.name = 'predio-fundo';
    b.position.copy(pos(farEdge + 2.5 + 5, t + w / 2, h / 2));
    b.rotation.y = rotY;
    group.add(b);
    t += w + 0.4;
  }
  for (let d = -L / 2 + 6; d < L / 2; d += 11) {
    const tronco = new THREE.Mesh(geo('arv-tronco', () => new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8)), mat(estilizado() ? '#8a6a4a' : '#6b4a2f'));
    tronco.position.copy(pos(farEdge - st.farSidewalk / 2, d, 1.6));
    const copa = new THREE.Mesh(geo('arv-copa', () => new THREE.SphereGeometry(1.7, 10, 8)), mat(estilizado() ? '#3f8a5a' : '#3f7d3a'));
    copa.position.copy(pos(farEdge - st.farSidewalk / 2, d, 4.4));
    copa.scale.y = 0.85;
    group.add(tronco, copa);
  }
  for (let d = -L / 2 + 14; d < L / 2; d += 22) {
    const poste = new THREE.Mesh(geo('poste-luz', () => new THREE.CylinderGeometry(0.06, 0.08, 7.2, 8)), mat('#4b4f55'));
    poste.position.copy(pos(st.sidewalk + st.road + 0.7, d, 3.6));
    const braco = new THREE.Mesh(geo('poste-braco', () => new THREE.BoxGeometry(1.6, 0.08, 0.08)), mat('#4b4f55'));
    braco.position.copy(pos(st.sidewalk + st.road + 0.7 - 0.8, d, 7.1));
    braco.rotation.y = rotY + Math.PI / 2;
    const lampada = new THREE.Mesh(geo('poste-lampada', () => new THREE.BoxGeometry(0.5, 0.12, 0.25)), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
    lampada.position.copy(pos(st.sidewalk + st.road + 0.7 - 1.5, d, 7.0));
    lampada.rotation.y = rotY + Math.PI / 2;
    group.add(poste, braco, lampada);
  }
}

// ---------------------------------------------------------------- base

async function buildBase(scene) {
  const base = scene.base ?? { type: 'cube' };
  const group = new THREE.Group();
  group.name = 'base';
  const opts = { baseUrl: scene._baseUrl, version: base.version ?? scene.version };

  if (base.type === 'equirect') {
    const hfov = base.hfov ?? 360;
    const vfov = base.vfov ?? 180;
    const cYaw = base.yaw ?? 0;
    const cPitch = base.pitch ?? 0;
    const geo = new THREE.SphereGeometry(
      BASE_RADIUS, Math.max(8, Math.round(hfov / 4)), Math.max(4, Math.round(vfov / 4)),
      (cYaw - hfov / 2 - 90) * DEG, hfov * DEG,
      (90 - cPitch - vfov / 2) * DEG, vfov * DEG,
    );
    geo.scale(-1, 1, 1); // vê a esfera por dentro sem espelhar a imagem
    const tex = await textureFor(base, {
      ...opts, aspect: hfov / vfov, labelScale: 0.35, fallbackLabel: `Panorâmica ${hfov}° × ${vfov}°`,
    });
    group.add(baseMesh(geo, tex, 'equirect'));
  } else {
    // Cubo: cada face é um arquivo independente, trocável isoladamente.
    const faces = base.faces ?? {};
    await Promise.all(CUBE_FACES.map(async (face) => {
      const media = typeof faces[face] === 'string' ? { src: faces[face] } : faces[face];
      const tex = await textureFor(media ?? { placeholder: base.placeholder }, {
        ...opts, labelScale: 0.35, fallbackLabel: `${scene.title ?? scene.id} · ${FACE_LABELS[face]}`,
      });
      const mesh = baseMesh(new THREE.PlaneGeometry(2 * BASE_RADIUS, 2 * BASE_RADIUS), tex, `face:${face}`);
      placeCubeFace(mesh, face);
      group.add(mesh);
    }));
  }
  if (base.fill) group.userData.fill = base.fill;
  return group;
}

function baseMesh(geometry, map, name) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map, depthWrite: false, depthTest: false }));
  mesh.name = name;
  mesh.renderOrder = -10; // a base fica sempre "atrás" dos módulos
  return mesh;
}

// Convenção das faces (vistas de dentro do cubo, olhando para elas):
// laterais com "para cima" = teto; `up` com a borda inferior encostada na
// frente; `down` com a borda superior encostada na frente.
function placeCubeFace(mesh, face) {
  const r = BASE_RADIUS;
  const setup = {
    front: [[0, 0, -r], [0, 0, 0]],
    right: [[r, 0, 0], [0, -Math.PI / 2, 0]],
    back: [[0, 0, r], [0, Math.PI, 0]],
    left: [[-r, 0, 0], [0, Math.PI / 2, 0]],
    up: [[0, r, 0], [Math.PI / 2, 0, 0]],
    down: [[0, -r, 0], [-Math.PI / 2, 0, 0]],
  }[face];
  mesh.position.set(...setup[0]);
  mesh.rotation.set(...setup[1]);
}

// ---------------------------------------------------------------- módulos

/**
 * Junta as camadas explícitas da cena com os módulos ancorados na planta que
 * estão dentro do raio de visão. Uma camada explícita com o mesmo módulo
 * substitui o posicionamento automático (ajuste fino por foto).
 */
function collectLayers(scene, modules) {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const explicit = new Set();
  const out = [];

  for (const layer of scene.layers) {
    const module = byId.get(layer.module) ?? inlineModule(layer);
    if (!module || module.enabled === false || layer.enabled === false) continue;
    explicit.add(module.id);
    out.push({ module: layer.media ? { ...module, media: layer.media } : module, placement: layer });
  }

  const radius = scene.moduleRadius ?? 30;
  const hidden = new Set(scene.hideModules);
  if (scene.position) {
    for (const module of modules) {
      const p = module.placement;
      if (!isWorldPlacement(p) || module.enabled === false || explicit.has(module.id) || hidden.has(module.id)) continue;
      if ((p.floor ?? null) !== (scene.floor ?? null)) continue; // só módulos do mesmo pavimento
      const dist = Math.hypot(p.x - scene.position.x, p.y - scene.position.y);
      if (dist <= radius) out.push({ module, placement: p });
    }
  }
  return out;
}

function inlineModule(layer) {
  if (!layer.media && !layer.info) return null;
  return { id: layer.id ?? `inline-${Math.random().toString(36).slice(2, 8)}`, title: layer.title, media: layer.media, info: layer.info, inline: true };
}

const BODY_DEPTH = { box: 2.2, banca: 1.0 };

async function buildModuleMesh(module, placement, scene, model = false) {
  const aspect = (placement.width ?? 1) / (placement.height ?? 1);
  const baseUrl = module.inline ? scene._baseUrl : module._baseUrl;
  let media = module.media ?? {};
  const kind = module.type === 'porta' ? 'porta' : module.type === 'banca' ? 'banca' : 'box';
  if (model && !media.src && ['box', 'banca', 'porta'].includes(module.type)) {
    // fachada com letreiro em vez da placa provisória
    const known = !String(media.placeholder?.sublabel ?? '').includes('não identificado');
    media = { ...media, placeholder: { ...media.placeholder, style: kind, known, tema: estilizado() ? 'estilizado' : undefined } };
  }
  const tex = await textureFor(media, {
    baseUrl, version: module.version, aspect, fallbackLabel: module.title ?? module.id, resolution: 256,
  });
  const material = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: media.opacity ?? 1,
    side: placement.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: (media.opacity ?? 1) > 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.name = `module:${module.id}`;
  mesh.renderOrder = placement.order ?? 1;
  mesh.userData = { pickable: true, module, placement, anchor: isWorldPlacement(placement) ? 'world' : 'view' };
  if (model && BODY_DEPTH[kind] && isWorldPlacement(placement) && (placement.surface ?? 'wall') === 'wall') {
    // volume da loja atrás da fachada (filho do plano: herda posição e largura/altura)
    const depth = placement.depth ?? BODY_DEPTH[kind];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, depth),
      new THREE.MeshLambertMaterial({
        color: estilizado() ? (kind === 'banca' ? '#ece0c2' : PALETA.creme) : (media.placeholder?.facade ?? (kind === 'banca' ? '#cfc6b4' : '#ddd6c8')),
      }),
    );
    body.position.z = -depth / 2 - 0.005;
    body.name = 'volume';
    mesh.add(body);
  }
  if (model && kind === 'porta' && isWorldPlacement(placement)) {
    // marquise de concreto sobre a porta e placa "SAÍDA" logo acima do vão
    const pw = placement.width ?? 1;
    const ph = placement.height ?? 1;
    const marquise = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: estilizado() ? PALETA.verde : '#6d7178' }));
    marquise.name = 'marquise';
    marquise.scale.set((pw + 0.9) / pw, 0.16 / ph, 1.1);
    marquise.position.set(0, 0.5 + 0.08 / ph, -0.55);
    mesh.add(marquise);
    const t = avisoTexture('saida');
    const sw = Math.min(1, pw * 0.5);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t }));
    sign.name = 'aviso-saida';
    sign.scale.set(sw / pw, (sw * t.userData.ratio) / ph, 1);
    sign.position.set(0, 0.5 + (0.16 + sw * t.userData.ratio / 2 + 0.06) / ph, 0.02);
    mesh.add(sign);
  }
  applyPlacement(mesh, placement, scene);
  return mesh;
}

// ---------------------------------------------------------------- links

/** Completa yaw dos links a partir das posições na planta, quando omitido. */
export function resolveLinks(scene, scenes) {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  return scene.links.map((link) => {
    const target = byId.get(link.to);
    let yaw = link.yaw;
    const sameFloor = (scene.floor ?? null) === (target?.floor ?? null);
    if (yaw === undefined && sameFloor && scene.position && target?.position) {
      yaw = wrapDeg((scene.northYaw ?? 0) + bearing(scene.position, target.position));
    }
    const distance = sameFloor && scene.position && target?.position
      ? Math.hypot(target.position.x - scene.position.x, target.position.y - scene.position.y) : undefined;
    return { pitch: -25, ...link, yaw: yaw ?? 0, distance, eye: scene.position?.z ?? 1.6, label: link.label ?? target?.title ?? link.to };
  });
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) return;
    obj.geometry.dispose();
    // Texturas de arquivo ficam no cache (textures.js); só as geradas morrem aqui.
    const map = obj.material.map;
    if ((map?.isCanvasTexture || map?.userData?.own) && !map.userData?.shared) map.dispose();
    obj.material.dispose();
  });
}

// ------------------------------------------------ mobiliário (mesas, vasos, praças, escadas, plataformas, placas)
const propMat = new Map();
const mat = (color) => {
  if (!propMat.has(color)) propMat.set(color, new THREE.MeshLambertMaterial({ color }));
  return propMat.get(color);
};
const stepMats = new Map();
function stepMaterials() {
  if (!stepMats.size) {
    const lado = mat(PALETA.creme);
    stepMats.set('e', [lado, lado, mat('#e9d9a6'), lado, lado, lado]); // +x, -x, topo, base, +z, -z
  }
  return stepMats.get('e');
}
const propGeo = new Map();
const geo = (key, make) => {
  if (!propGeo.has(key)) propGeo.set(key, make());
  return propGeo.get(key);
};

/** Cenário estilizado: mesas, cadeiras, pisos e corrimãos passam para a paleta única. */
function estiliza(p) {
  const P = PALETA;
  const h = Math.abs(Math.round((p.x ?? 0) * 7 + (p.y ?? 0) * 13));
  switch (p.tipo) {
    case 'mesa': return { ...p, cor: P.creme, corCadeira: [P.terracota, P.verde, P.mostarda, P.petroleo][h % 4] };
    case 'praca': return { ...p, cor: '#ecdfc4', borda: P.terracota };
    case 'pilar': case 'helicoidal': return { ...p, cor: P.creme };
    case 'guarda': return { ...p, cor: P.verde };
    case 'escada': return { ...p, corGuarda: P.verde };
    case 'plataforma': return { ...p, cor: '#dccfb2', lateral: P.terracota };
    case 'placa': return { ...p, cor: P.verde };
    case 'guardasol': return { ...p, cor: [P.terracota, P.mostarda, P.petroleo][h % 3] };
    default: return p;
  }
}

function buildProp(group, scene, p) {
  const st = estilizado();
  if (st) p = estiliza(p);
  const base = p.base ?? 0;
  const at = (dx = 0, dy = 0, z = 0) => worldToLocal({ x: p.x + dx, y: p.y + dy, z: z + base }, scene);
  const loc = (x, y, z = 0) => worldToLocal({ x, y, z: z + base }, scene);
  const add = (g, color, dx, dy, z, rotX = 0) => {
    const m = new THREE.Mesh(g, mat(color));
    m.position.copy(at(dx, dy, z));
    m.rotation.x = rotX;
    group.add(m);
    return m;
  };
  const rod = (a, b, r, color) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(geo(`rod${r}`, () => new THREE.CylinderGeometry(r, r, 1, 6)), mat(color));
    m.scale.y = len;
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    group.add(m);
  };
  const yawOf = (a, b) => Math.atan2(b.x - a.x, b.z - a.z); // rotação em y que alinha +z de a para b
  // corrimão, travessa e balaústres
  const railing = (a, b, top, cor, esp = 0.8) => {
    const raise = (v, h) => v.clone().setY(v.y + h);
    const topo = st ? PALETA.verde : (cor ?? '#f2f2f2');
    const barra = st ? PALETA.pedra : (cor ?? '#e2e2e2');
    rod(raise(a, top), raise(b, top), st ? 0.035 : 0.03, topo);
    rod(raise(a, top * 0.48), raise(b, top * 0.48), 0.014, barra);
    const n = Math.max(1, Math.round(a.distanceTo(b) / esp));
    for (let i = 0; i <= n; i++) {
      const v = a.clone().lerp(b, i / n);
      rod(v, raise(v, top), i % 2 ? 0.012 : 0.022, barra);
    }
  };
  // placa de sinalização em poste, dupla face (x, y em m da planta; facing = rumo para onde a face principal olha)
  const avisoPoste = (x, y, facing, icone, larg = 0.6, texto, zc = 1.9) => {
    const t = avisoTexture(icone, texto);
    const alt = larg * (t.userData.ratio ?? 0.5);
    rod(loc(x, y, 0), loc(x, y, zc - alt / 2), 0.025, '#4b4f55');
    for (const f of [0, 180]) {
      const fa = (facing + f) % 360;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t }));
      m.name = 'aviso';
      applyPlacement(m, { x: x + Math.sin(fa * DEG) * 0.015, y: y + Math.cos(fa * DEG) * 0.015, z: zc + base, width: larg, height: alt, facing: fa, surface: 'wall' }, scene);
      group.add(m);
    }
  };
  if (p.tipo === 'praca') {
    const n = p.degraus ?? 3;
    add(new THREE.RingGeometry(p.r - 0.35, p.r, 64), p.borda ?? '#a85a5a', 0, 0, 0.015, -Math.PI / 2);
    for (let i = 1; i <= n; i++) {
      const r = p.r - 0.35 - i * 0.45;
      add(new THREE.RingGeometry(r - 0.05, r, 64), '#8f8a82', 0, 0, 0.016, -Math.PI / 2);
    }
    add(new THREE.CircleGeometry(p.r - 0.35, 64), p.cor ?? '#b9b4ac', 0, 0, 0.012, -Math.PI / 2);
  } else if (p.tipo === 'mesa') {
    const h = p.alta ? 1.05 : 0.75;
    const ret = p.formato === 'retangular';
    const top = ret
      ? add(geo('mesaR', () => new THREE.BoxGeometry(1.2, 0.04, 0.75)), p.cor ?? '#eeeeee', 0, 0, h)
      : add(geo(`mesa${p.r ?? 0.45}`, () => new THREE.CylinderGeometry(p.r ?? 0.45, p.r ?? 0.45, 0.04, 18)), p.cor ?? '#eeeeee', 0, 0, h);
    top.rotation.y = (p.giro ?? 0) * DEG;
    add(geo(`pe${h}`, () => new THREE.CylinderGeometry(0.04, 0.04, h - 0.02, 6)), '#333333', 0, 0, h / 2);
    const k = p.cadeiras ?? 4;
    const d = ret ? 0.62 : (p.r ?? 0.45) + 0.3;
    for (let i = 0; i < k; i++) {
      // retangular: cadeiras nos lados compridos; redonda: em volta
      const a = ret ? (i % 2 ? Math.PI : 0) + (p.giro ?? 0) * DEG : (i / k) * Math.PI * 2 + 0.4;
      const off = ret ? (Math.floor(i / 2) - (Math.ceil(k / 2) - 1) / 2) * 0.55 : 0;
      const g = (p.giro ?? 0) * DEG;
      const cx = Math.sin(a) * d + (ret ? Math.cos(g) * off : 0);
      const cy = Math.cos(a) * d - (ret ? Math.sin(g) * off : 0);
      if (p.banquetas) {
        add(geo('banq', () => new THREE.CylinderGeometry(0.18, 0.18, p.alta ? 0.75 : 0.45, 10)), p.corCadeira, cx, cy, p.alta ? 0.375 : 0.225);
      } else {
        add(geo('assento', () => new THREE.BoxGeometry(0.4, 0.04, 0.4)), p.corCadeira, cx, cy, 0.45);
        add(geo('pernaC', () => new THREE.CylinderGeometry(0.02, 0.02, 0.44, 5)), '#2b2b2b', cx, cy, 0.22);
        const back = add(geo('encosto', () => new THREE.BoxGeometry(0.4, 0.32, 0.03)), p.corCadeira, cx + Math.sin(a) * 0.2, cy + Math.cos(a) * 0.2, 0.68);
        back.rotation.y = -((scene.northYaw ?? 0) * DEG + a);
      }
    }
  } else if (p.tipo === 'vaso') {
    add(geo('vaso', () => new THREE.CylinderGeometry(0.22, 0.16, 0.38, 12)), '#b5653f', 0, 0, 0.19);
    add(geo('planta', () => new THREE.SphereGeometry(0.3, 10, 8)), '#3e6b35', 0, 0, 0.62);
  } else if (p.tipo === 'pilar') {
    const h = p.altura ?? 5;
    add(geo(`pilar${h}`, () => new THREE.CylinderGeometry(0.3, 0.3, h, 16)), p.cor ?? '#f2f2f2', 0, 0, h / 2);
  } else if (p.tipo === 'guarda') {
    // guarda-corpo: corrimão a 1,05 m, travessa a 0,5 m e montantes a cada 1,2 m
    const a = loc(p.x, p.y);
    const b = loc(p.x2, p.y2);
    railing(a, b, p.alt ?? 1.05, p.cor, p.esp);
  } else if (p.tipo === 'vao' || p.tipo === 'plataforma') {
    // vão aberto (poço escuro com guarda-corpo) ou plataforma elevada (mezanino)
    const pts = p.pontos.map(([x, y]) => loc(x, y));
    const shape = new THREE.Shape(pts.map((v) => new THREE.Vector2(v.x, -v.z)));
    if (p.tipo === 'vao') {
      if (!p.aberto) { // sem pavimento embaixo: poço escuro
        const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat('#2a2a2a'));
        m.rotation.x = -Math.PI / 2;
        m.position.y = pts[0].y + 0.02;
        group.add(m);
      }
      pts.forEach((v, i) => {
        const w = pts[(i + 1) % pts.length];
        railing(v, w, 1.05);
      });
    } else {
      const h = p.altura ?? 1.5;
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }), [mat(p.cor ?? '#8e8e8a'), mat(p.lateral ?? '#b5653f')]);
      m.rotation.x = -Math.PI / 2;
      m.position.y = pts[0].y;
      group.add(m);
    }
  } else if (p.tipo === 'escada') {
    // escada reta do ponto (x, y) no chão até (x2, y2) na altura `altura`
    const a = loc(p.x, p.y);
    const b = loc(p.x2, p.y2);
    const h = p.altura ?? 1.5;
    const n = Math.max(3, Math.round(h / 0.17));
    const w = p.largura ?? 2;
    const run = a.distanceTo(b);
    const ry = yawOf(a, b);
    for (let i = 0; i < n; i++) {
      const v = a.clone().lerp(b, (i + 0.5) / n);
      const sh = (i + 1) * (h / n);
      const step = new THREE.Mesh(geo(`deg${w}_${(run / n).toFixed(2)}`, () => new THREE.BoxGeometry(w, 1, run / n)), st ? stepMaterials() : mat(p.cor ?? '#e6e4de'));
      step.scale.y = sh;
      step.position.set(v.x, a.y + sh / 2, v.z);
      step.rotation.y = ry;
      group.add(step);
    }
    const side = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)).multiplyScalar(w / 2);
    for (const s of [side, side.clone().negate()]) {
      railing(a.clone().add(s), b.clone().add(s).setY(a.y + h), 1, p.corGuarda);
    }
    // placa de "cuidado, degrau" num poste ao lado do primeiro degrau, virada para quem chega
    const dx = p.x2 - p.x;
    const dy = p.y2 - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const sx = -dy / len; // perpendicular ao lance
    const sy = dx / len;
    const px = p.x - (dx / len) * 0.6 + sx * (w / 2 + 0.35);
    const py = p.y - (dy / len) * 0.6 + sy * (w / 2 + 0.35);
    avisoPoste(px, py, (Math.atan2(-dx, -dy) / DEG + 360) % 360, 'degrau', 0.5);
  } else if (p.tipo === 'aviso') {
    avisoPoste(p.x, p.y, p.facing ?? 0, p.icone, p.largura ?? 0.6, p.texto, p.z ?? 1.9);
  } else if (p.tipo === 'guardasol') {
    const r = p.r ?? 1.4;
    add(geo('gs-base', () => new THREE.CylinderGeometry(0.2, 0.24, 0.05, 12)), '#555b62', 0, 0, 0.025);
    add(geo('gs-mastro', () => new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6)), '#b8bcc2', 0, 0, 1.25);
    add(geo(`gs-copa${r}`, () => new THREE.ConeGeometry(r, 0.5, 14, 1)), p.cor ?? '#c0392b', 0, 0, 2.55);
  } else if (p.tipo === 'helicoidal') {
    // escada em espiral: coluna central, degraus em leque e corrimão externo
    const altura = p.altura ?? 2.5;
    const raio = p.r ?? 1.3;
    const n = Math.max(8, Math.round(altura / 0.18));
    const volta = Math.PI * 1.75;
    add(geo(`heli-col${altura}`, () => new THREE.CylinderGeometry(0.12, 0.12, altura, 10)), '#8a8f96', 0, 0, altura / 2);
    let anterior = null;
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * volta;
      const z = (i + 1) * (altura / n);
      const step = new THREE.Mesh(geo(`heli-deg${raio}`, () => new THREE.BoxGeometry(0.5, 0.05, raio)), st ? stepMaterials() : mat(p.cor ?? '#f2f2f2'));
      step.position.copy(at(Math.sin(phi) * raio / 2, Math.cos(phi) * raio / 2, z));
      step.rotation.y = Math.PI - phi;
      group.add(step);
      const ponta = at(Math.sin(phi) * raio, Math.cos(phi) * raio, z + 1.0);
      if (anterior) rod(anterior, ponta, 0.022, st ? PALETA.verde : '#e8e8e8');
      if (i % 3 === 0) rod(at(Math.sin(phi) * raio, Math.cos(phi) * raio, z), ponta, 0.012, '#a5abb1');
      anterior = ponta;
    }
  } else if (p.tipo === 'placa') {
    // placa suspensa com o nome da área (dupla face)
    const tex = textureFor({ placeholder: { color: p.cor ?? '#1f4d3a', label: p.texto, sublabel: p.subtexto ?? '' } }, { aspect: 4, resolution: 256 });
    tex.then((t) => {
      const w = p.largura ?? 3;
      for (const f of [0, 90, 180, 270]) {
        const fa = ((p.facing ?? 0) + f) % 360;
        const d = w / 2; // cubo suspenso: cada face afastada do centro, virada para fora
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t }));
        applyPlacement(m, { x: p.x + Math.sin(fa * DEG) * d, y: p.y + Math.cos(fa * DEG) * d, z: (p.z ?? 4) + base, width: w, height: w / 4, facing: fa, surface: 'wall' }, scene);
        group.add(m);
      }
    });
  }
}
