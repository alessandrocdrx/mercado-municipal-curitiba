// Monta um THREE.Group para uma cena: panorâmica base (cubo ou equiretangular,
// completa ou parcial) + módulos sobrepostos + descrição dos links.

import * as THREE from 'three';
import { DEG, bearing, wrapDeg } from '../core/geo.js';
import { textureFor, ceilingTexture } from '../core/textures.js';
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

  // Sem foto 360° no ponto, o app monta uma maquete 3D a partir da planta:
  // chão com a planta (corredores coloridos), teto, boxes em volume.
  const model = !hasPhoto(scene.base);
  let environment = { background: '#111111' };
  if (model) {
    const tour = await loader.tour();
    const floor = tour.floors?.find((f) => f.id === scene.floor);
    environment = await buildModel(group, scene, floor, loader.tourUrl);
  } else {
    group.add(await buildBase(scene));
  }

  const layers = collectLayers(scene, modules);
  const meshes = await Promise.all(layers.map(({ module, placement }) => buildModuleMesh(module, placement, scene, model)));
  meshes.forEach((m) => group.add(m));

  return {
    scene,
    scenes,
    modules,
    group,
    meshes,
    environment,
    links: resolveLinks(scene, scenes),
    dispose: () => disposeGroup(group),
  };
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
    // chão = foto da planta, na escala e posição da própria planta
    const tex = await textureFor({ src: floor.plan.src }, { baseUrl: tourUrl });
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: '#d8d8d8' });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    plane.name = 'piso-planta';
    applyPlacement(plane, {
      x: floor.plan.width / 2, y: -floor.plan.height / 2, z: 0,
      width: floor.plan.width, height: floor.plan.height, facing: 0, surface: 'floor',
    }, scene);
    group.add(plane);
  }
  // piso neutro em volta, para não haver "buraco" fora da planta
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#9a978f' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(cam.z ?? 1.6) - 0.02;
  group.add(ground);

  const ceilTex = ceilingTexture();
  ceilTex.repeat.set(400 / 6, 400 / 6);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ map: ceilTex }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = CEILING_HEIGHT - (cam.z ?? 1.6);
  ceiling.name = 'teto';
  group.add(ceiling);

  return { background: '#d9d6cf', fog: { color: '#d9d6cf', near: 10, far: 42 } };
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
    const depth = BODY_DEPTH[kind];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, depth),
      new THREE.MeshLambertMaterial({ color: kind === 'banca' ? '#cfc6b4' : '#ddd6c8' }),
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
function resolveLinks(scene, scenes) {
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
    if (obj.material.map?.isCanvasTexture) obj.material.map.dispose();
    obj.material.dispose();
  });
}
