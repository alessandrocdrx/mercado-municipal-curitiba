// Monta um THREE.Group para uma cena: panorâmica base (cubo ou equiretangular,
// completa ou parcial) + módulos sobrepostos + descrição dos links.

import * as THREE from 'three';
import { DEG, bearing, wrapDeg, worldToLocal } from '../core/geo.js';
import { textureFor, ceilingTexture, roadTexture, sidewalkTexture, crosswalkTexture, streetSignTexture, plasterTexture, concreteTexture, stepTopTexture } from '../core/textures.js';
import { settings } from '../core/settings.js';
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
    environment = await buildModel(group, anchor, floor, loader.tourUrl);
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

async function buildModel(group, scene, floor, tourUrl) {
  // luz para os volumes dos boxes terem faces com tons diferentes
  group.add(new THREE.AmbientLight('#ffffff', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 1.4);
  sun.position.set(0.4, 1, 0.25);
  group.add(sun);

  const cam = scene.position ?? { x: 0, y: 0 };
  if (floor?.plan) {
    // chão = foto da planta, na escala e posição da própria planta, recortada
    // na área coberta (fora dela a foto mostra só o papel)
    const W = floor.plan.width;
    const H = floor.plan.height;
    const cov = floor.covered ?? { from: { x: 0, y: 0 }, to: { x: W, y: -H } };
    const x0 = Math.min(cov.from.x, cov.to.x);
    const x1 = Math.max(cov.from.x, cov.to.x);
    const y0 = Math.min(-cov.from.y, -cov.to.y); // distância a partir do topo da planta
    const y1 = Math.max(-cov.from.y, -cov.to.y);
    const original = await textureFor({ src: floor.plan.floorSrc ?? floor.plan.src }, { baseUrl: tourUrl }); // piso sem textos
    const tex = original.clone();
    tex.userData = { own: true, base: original }; // cópia com recorte próprio
    tex.repeat.set((x1 - x0) / W, (y1 - y0) / H);
    tex.offset.set(x0 / W, 1 - y1 / H);
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: '#d8d8d8' });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    plane.name = 'piso-planta';
    applyPlacement(plane, {
      x: (x0 + x1) / 2, y: -(y0 + y1) / 2, z: 0,
      width: x1 - x0, height: y1 - y0, facing: 0, surface: 'floor',
    }, scene);
    group.add(plane);
  }
  // piso neutro em volta, para não haver "buraco" fora da planta
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#8d8b86' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(cam.z ?? 1.6) - 0.02;
  group.add(ground);

  // teto só sobre a área coberta do pavimento (na rua, céu aberto)
  const cov = floor?.covered;
  const ceilTex = ceilingTexture();
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
  for (const prop of floor?.props ?? []) buildProp(group, scene, prop);

  return { background: '#cfdbe4', fog: { color: '#d6dde2', near: 12, far: 55 } };
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
    media = { ...media, placeholder: { ...media.placeholder, style: kind, known, textura: settings.texturas } };
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
        color: media.placeholder?.facade ?? (kind === 'banca' ? '#cfc6b4' : '#ddd6c8'),
        map: settings.texturas ? plasterTexture() : null,
      }),
    );
    body.position.z = -depth / 2 - 0.005;
    body.name = 'volume';
    mesh.add(body);
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
function stepMaterials(cor) {
  if (!stepMats.has(cor)) {
    const side = new THREE.MeshLambertMaterial({ color: cor, map: concreteTexture() });
    const top = new THREE.MeshLambertMaterial({ color: cor, map: stepTopTexture() });
    stepMats.set(cor, [side, side, top, side, side, side]); // +x, -x, topo, base, +z, -z
  }
  return stepMats.get(cor);
}
const propGeo = new Map();
const geo = (key, make) => {
  if (!propGeo.has(key)) propGeo.set(key, make());
  return propGeo.get(key);
};

function buildProp(group, scene, p) {
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
  const tx = settings.texturas;
  // corrimão de madeira, travessa e balaústres de aço (só com texturas ligadas)
  const railing = (a, b, top) => {
    const raise = (v, h) => v.clone().setY(v.y + h);
    rod(raise(a, top), raise(b, top), 0.035, '#6a4a2f');
    rod(raise(a, top * 0.48), raise(b, top * 0.48), 0.014, '#a5abb1');
    const n = Math.max(1, Math.round(a.distanceTo(b) / 0.8));
    for (let i = 0; i <= n; i++) {
      const v = a.clone().lerp(b, i / n);
      rod(v, raise(v, top), i % 2 ? 0.012 : 0.022, '#a5abb1');
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
    const up = (v, h) => v.clone().setY(v.y + h);
    if (tx) {
      railing(a, b, 1.05);
    } else {
      rod(up(a, 1.05), up(b, 1.05), 0.03, p.cor ?? '#f2f2f2');
      rod(up(a, 0.5), up(b, 0.5), 0.015, p.cor ?? '#f2f2f2');
      const n = Math.max(1, Math.round(a.distanceTo(b) / 1.2));
      for (let i = 0; i <= n; i++) {
        const v = a.clone().lerp(b, i / n);
        rod(v, up(v, 1.05), 0.02, p.cor ?? '#f2f2f2');
      }
    }
  } else if (p.tipo === 'vao' || p.tipo === 'plataforma') {
    // vão aberto (poço escuro com guarda-corpo) ou plataforma elevada (mezanino)
    const pts = p.pontos.map(([x, y]) => loc(x, y));
    const shape = new THREE.Shape(pts.map((v) => new THREE.Vector2(v.x, -v.z)));
    if (p.tipo === 'vao') {
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat('#2a2a2a'));
      m.rotation.x = -Math.PI / 2;
      m.position.y = pts[0].y + 0.02;
      group.add(m);
      pts.forEach((v, i) => {
        const w = pts[(i + 1) % pts.length];
        if (tx) { railing(v, w, 1.05); return; }
        rod(v.clone().setY(v.y + 1.05), w.clone().setY(w.y + 1.05), 0.03, '#f2f2f2');
        rod(v, v.clone().setY(v.y + 1.05), 0.025, '#f2f2f2');
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
      const step = new THREE.Mesh(geo(`deg${w}_${(run / n).toFixed(2)}`, () => new THREE.BoxGeometry(w, 1, run / n)), tx ? stepMaterials(p.cor ?? '#ffffff') : mat(p.cor ?? '#e6e4de'));
      step.scale.y = sh;
      step.position.set(v.x, a.y + sh / 2, v.z);
      step.rotation.y = ry;
      group.add(step);
    }
    const side = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)).multiplyScalar(w / 2);
    for (const s of [side, side.clone().negate()]) {
      if (tx) railing(a.clone().add(s), b.clone().add(s).setY(a.y + h), 1);
      else rod(a.clone().add(s).setY(a.y + 1), b.clone().add(s).setY(a.y + h + 1), 0.03, p.corGuarda ?? '#f2f2f2');
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
