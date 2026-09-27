import './style.css';
import { Viewer } from './core/Viewer.js';
import { wrapDeg } from './core/geo.js';
import { releaseUnused } from './core/textures.js';
import { TourLoader } from './tour/TourLoader.js';
import { buildScene, eyeFor, hasPhoto, resolveLinks } from './tour/SceneBuilder.js';
import { Hotspots } from './ui/Hotspots.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { Minimap } from './ui/Minimap.js';
import { Editor } from './ui/Editor.js';
import { Directory } from './ui/Directory.js';
import { bearing, DEG } from './core/geo.js';
import * as THREE from 'three';

const app = document.getElementById('app');
const stage = app.querySelector('.stage');
const overlay = app.querySelector('.overlay');
const titleEl = app.querySelector('.scene-title');
const fader = app.querySelector('.fader');

const loader = new TourLoader(import.meta.env.BASE_URL + 'tour/tour.json');
const viewer = new Viewer(stage);
const hotspots = new Hotspots(viewer, overlay, (link) => goTo(link.to, { via: link }));
const info = new InfoPanel(app);
const minimap = new Minimap(app, {
  onSelect: (id) => goTo(id),
  onFloor: (floor) => goTo(floor.startScene),
});
const editor = new Editor(viewer, app);
const directory = new Directory(app, { onGo: (moduleId) => showModule(moduleId) });
editor.onReload = () => reload();

let current = null;
let navigating = null;

viewer.addEventListener('pick', ({ detail }) => {
  if (editor.handlePick(detail)) return;
  const module = detail.hits[0]?.object.userData.module;
  if (module?.info || module?.title) info.show(module);
  else info.hide();
});

// ------------------------------------------------ andar com clique duplo
// Como no Street View: dois cliques (ou dois toques) num ponto leva ao ponto
// de vista mais próximo daquele lugar. No computador, um círculo no chão
// mostra onde o mouse está apontando.

const cursor = new THREE.Mesh(
  new THREE.RingGeometry(0.32, 0.42, 40),
  new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthTest: false, fog: false }),
);
cursor.rotation.x = -Math.PI / 2;
cursor.renderOrder = 20;
cursor.visible = false;
viewer.scene.add(cursor);

viewer.addEventListener('hover', ({ detail }) => {
  const eye = current?.scene.position?.z ?? 1.6;
  const p = detail && current?.scene.position ? viewer.floorPoint(detail.x, detail.y, eye) : null;
  cursor.visible = Boolean(p && p.length() < 40);
  if (cursor.visible) cursor.position.copy(p).add(viewer.eye).setY(-eye + 0.03);
});

const tip = app.querySelector('.tip');
function flash(text) {
  tip.textContent = text;
  tip.classList.remove('gone');
  clearTimeout(flash.t);
  flash.t = setTimeout(hideTip, 1800);
}
const hideTip = () => tip?.classList.add('gone');
setTimeout(hideTip, 9000);

viewer.addEventListener('doublepick', ({ detail }) => {
  if (editor.active || !current?.scene.position) return;
  hideTip();
  info.hide();
  const target = walkTarget(detail);
  if (target) goTo(target.id);
  else flash('Não há ponto de vista nessa direção');
});

/** Escolhe o ponto de vista mais próximo do lugar clicado, na direção do clique. */
function walkTarget({ x, y, hits }) {
  const here = current.scene;
  const eye = here.position.z ?? 1.6;
  // lugar clicado: o box (se clicou num), o chão, ou 6 m à frente se clicou acima do horizonte
  let local = hits[0]?.local?.clone() ?? viewer.floorPoint(x, y, eye);
  if (!local || local.length() > 40) {
    const { yaw } = viewer.pick(x, y);
    local = new THREE.Vector3(Math.sin(yaw * DEG), 0, -Math.cos(yaw * DEG)).multiplyScalar(6);
  }
  const yawLocal = Math.atan2(local.x, -local.z) / DEG;
  const dist = Math.hypot(local.x, local.z);
  const b = (yawLocal - (here.northYaw ?? 0)) * DEG;
  const point = { x: here.position.x + Math.sin(b) * dist, y: here.position.y + Math.cos(b) * dist };
  const clickBearing = yawLocal - (here.northYaw ?? 0);

  // só os vizinhos ligados pelo corredor: nunca se atravessa um box
  const neighbors = new Set(current.links.filter((l) => l.distance !== undefined).map((l) => l.to));
  const candidates = current.scenes.filter((s) => neighbors.has(s.id) && s.position)
    .map((s) => {
      const away = Math.hypot(s.position.x - here.position.x, s.position.y - here.position.y);
      const off = Math.abs(wrapDeg(bearing(here.position, s.position) - clickBearing));
      return { s, away, off, toClick: Math.hypot(s.position.x - point.x, s.position.y - point.y) };
    })
    .filter((c) => c.off < 70);
  candidates.sort((a, b) => a.toClick - b.toClick);
  return candidates[0]?.s ?? null;
}

viewer.addEventListener('viewchange', ({ detail }) => {
  minimap.setHeading(detail.yaw);
  if (current) updateForward();
  writeHash();
});

window.addEventListener('hashchange', () => {
  const { scene } = readHash();
  if (scene && scene !== current?.scene.id) goTo(scene, { view: readHash() });
});

async function goTo(sceneId, { via, view, force } = {}) {
  if (navigating) return navigating;
  if (force && sceneId === current?.scene.id) {
    viewer.setView(view);
    return;
  }
  navigating = (async () => {
    // Na maquete do mesmo pavimento, anda-se deslizando a câmera (sem recarregar)
    const target = await loader.scene(sceneId);
    if (current?.world && !hasPhoto(target.base) && (target.floor ?? null) === current.world.floor) {
      await walkTo(target);
      if (view) viewer.setView(view);
      return;
    }
    fader.classList.add('on');
    const [built] = await Promise.all([buildScene(loader, sceneId), wait(200)]);
    const previous = current;
    current = built;

    viewer.setContent(built.group);
    viewer.setEnvironment(built.environment);
    viewer.eye.copy(built.eye);
    viewer.setView(nextView(previous, built, via, view));
    await arrived();
    editor.setScene(built);

    previous?.dispose();
    releaseUnused(collectTextures(built.group));
    fader.classList.remove('on');
  })().catch((err) => {
    console.error(err);
    fader.classList.remove('on');
    titleEl.textContent = `Erro ao abrir "${sceneId}": ${err.message}`;
  }).finally(() => { navigating = null; });
  return navigating;
}

/** Desliza até outro ponto de vista do mesmo pavimento. */
async function walkTo(target) {
  info.hide();
  const from = current.scene.position;
  const dist = Math.hypot(target.position.x - from.x, target.position.y - from.y);
  current.scene = target;
  current.links = resolveLinks(target, current.scenes);
  forward.hidden = true;
  await viewer.moveEye(eyeFor(target, current.anchor), Math.min(1400, Math.max(450, dist * 110)));
  await arrived();
}

/** Atualiza tudo o que depende do ponto atual (título, mapa, botões). */
async function arrived() {
  // setas só para trocar de andar (escada); no mesmo andar anda-se pelo chão
  hotspots.setLinks(current.links.filter((l) => l.distance === undefined));
  const tour = await loader.tour();
  minimap.render({ tour, tourUrl: loader.tourUrl, scenes: current.scenes, modules: current.modules, current: current.scene });
  minimap.setHeading(viewer.view.yaw);
  titleEl.textContent = current.scene.title ?? current.scene.id;
  document.title = `${tour.title ?? 'Tour 360°'} · ${current.scene.title ?? current.scene.id}`;
  app.querySelector('.splash')?.classList.add('gone');
  writeHash();
  updateForward();
}

// ------------------------------------------------ botão "andar" e teclado
// Mostra o próximo ponto na direção do olhar; tocar nele anda até lá.

const forward = app.querySelector('.forward');
let forwardTarget = null;

/** Vizinho pelo corredor mais alinhado com uma direção (graus relativos ao olhar). */
function neighborToward(offset = 0, maxOff = 50) {
  if (!current?.scene.position) return null;
  const heading = viewer.view.yaw + offset - (current.scene.northYaw ?? 0);
  let best = null;
  for (const l of current.links) {
    if (l.distance === undefined) continue;
    const off = Math.abs(wrapDeg(l.yaw - (current.scene.northYaw ?? 0) - heading));
    if (off <= maxOff && (!best || off < best.off)) best = { link: l, off };
  }
  return best?.link ?? null;
}

function updateForward() {
  forwardTarget = neighborToward(0);
  forward.hidden = !forwardTarget;
  if (forwardTarget) forward.querySelector('span').textContent = forwardTarget.label;
}

forward.addEventListener('click', () => {
  if (forwardTarget && !navigating) {
    hideTip();
    goTo(forwardTarget.to);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea') || editor.active || navigating) return;
  const key = e.key.toLowerCase();
  const link = key === 'w' ? neighborToward(0) : key === 's' ? neighborToward(180) : null;
  if (link) {
    hideTip();
    goTo(link.to);
  }
});

/**
 * Como no Street View: ao andar para outra cena mantém-se o rumo (direção em
 * relação ao norte), a menos que o link defina `targetYaw`.
 */
function nextView(previous, built, via, view) {
  if (view?.yaw !== undefined) return view;
  if (via?.targetYaw !== undefined) return { yaw: via.targetYaw, pitch: 0 };
  if (previous?.scene.position && built.scene.position) {
    const heading = viewer.view.yaw - (previous.scene.northYaw ?? 0);
    return { yaw: wrapDeg(heading + (built.scene.northYaw ?? 0)), pitch: 0 };
  }
  return { yaw: 0, pitch: 0, fov: 75, ...built.scene.initialView };
}

/** Vai até o ponto de vista mais próximo de um módulo e olha para ele. */
async function showModule(moduleId) {
  const [mod, scenes] = await Promise.all([loader.module(moduleId), loader.allScenes()]);
  const p = mod.placement;
  const candidates = scenes.filter((s) => s.position && (s.floor ?? null) === (p.floor ?? null));
  // o ponto precisa estar na frente do box (o lado para onde ele está virado)
  const inFront = (s) => Math.cos((bearing(p, s.position) - (p.facing ?? 0)) * Math.PI / 180) > 0.2;
  const dist = (s) => Math.hypot(s.position.x - p.x, s.position.y - p.y);
  const best = [...candidates].sort((a, b) => (inFront(b) - inFront(a)) || dist(a) - dist(b))[0];
  if (!best) return;
  const yaw = wrapDeg((best.northYaw ?? 0) + bearing(best.position, p));
  await goTo(best.id, { view: { yaw, pitch: -3, fov: 65 }, force: true });
  info.show(mod);
}

async function reload() {
  loader.reload();
  const id = current?.scene.id;
  const view = { ...viewer.view };
  current = null;
  await goTo(id ?? (await loader.tour()).startScene, { view });
}

function collectTextures(group) {
  const set = new Set();
  group.traverse((o) => {
    const map = o.material?.map;
    if (map) set.add(map.userData?.base ?? map);
  });
  return set;
}

// ------------------------------------------------ link compartilhável (#hash)

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const num = (k) => (p.has(k) ? Number(p.get(k)) : undefined);
  return { scene: p.get('cena') ?? undefined, yaw: num('yaw'), pitch: num('pitch'), fov: num('fov') };
}

let hashTimer;
function writeHash() {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    if (!current) return;
    const { yaw, pitch, fov } = viewer.view;
    const hash = `#cena=${current.scene.id}&yaw=${yaw.toFixed(1)}&pitch=${pitch.toFixed(1)}&fov=${fov.toFixed(0)}`;
    try {
      history.replaceState(null, '', hash);
    } catch {
      // Alguns ambientes (iframes restritos) não permitem alterar a URL.
    }
  }, 300);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ------------------------------------------------ início

const start = readHash();
const tour = await loader.tour();
app.querySelector('.about').addEventListener('click', () => info.show({ title: tour.title, type: 'Sobre', info: tour.info, _baseUrl: loader.tourUrl }));
directory.setItems(tour.directory);
app.querySelector('.open-directory').addEventListener('click', () => {
  info.hide();
  directory.toggle();
});
goTo(start.scene ?? tour.startScene, { view: start.scene ? start : undefined });
