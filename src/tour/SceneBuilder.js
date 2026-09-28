// Monta um THREE.Group para uma cena: panorâmica base (cubo ou equiretangular,
// completa ou parcial) + módulos sobrepostos + descrição dos links.

import * as THREE from 'three';
import { DEG, bearing, wrapDeg, worldToLocal } from '../core/geo.js';
import { textureFor, ceilingTexture, roadTexture, sidewalkTexture, crosswalkTexture, streetSignTexture } from '../core/textures.js';
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
  return worldToLocal({ ...scene.position, z: anchor.position.z }, anchor);
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
    media = { ...media, placeholder: { ...media.placeholder, style: kind, known } };
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
      new THREE.MeshLambertMaterial({ color: media.placeholder?.facade ?? (kind === 'banca' ? '#cfc6b4' : '#ddd6c8') }),
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
    if (obj.material.map?.isCanvasTexture || obj.material.map?.userData?.own) obj.material.map.dispose();
    obj.material.dispose();
  });
}
