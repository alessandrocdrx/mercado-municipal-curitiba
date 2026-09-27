#!/usr/bin/env node
// Confere a consistência do tour antes de publicar:
//   npm run validate
// Verifica JSON inválido, cenas/módulos referenciados que não existem, links
// quebrados, faces de cubo desconhecidas e arquivos de mídia ausentes.

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'public/tour');
const FACES = new Set(['front', 'right', 'back', 'left', 'up', 'down']);
const errors = [];
const warnings = [];

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    errors.push(`${rel(file)}: ${err.code === 'ENOENT' ? 'arquivo não encontrado' : err.message}`);
    return null;
  }
};
const rel = (file) => path.relative(process.cwd(), file);
const checkMedia = (media, dir, where) => {
  if (!media?.src || /^https?:/.test(media.src)) return;
  const file = path.resolve(dir, media.src);
  if (!fs.existsSync(file)) errors.push(`${where}: mídia "${media.src}" não existe (${rel(file)})`);
};

const tour = readJson(path.join(root, 'tour.json'));
if (!tour) finish();

const sceneIds = new Set(tour.scenes ?? []);
const moduleIds = new Set(tour.modules ?? []);
if (!sceneIds.has(tour.startScene ?? tour.scenes?.[0])) errors.push(`tour.json: startScene "${tour.startScene}" não está em "scenes"`);

for (const id of moduleIds) {
  const dir = path.join(root, 'modules', id);
  const mod = readJson(path.join(dir, 'module.json'));
  if (!mod) continue;
  const where = `modules/${id}`;
  checkMedia(mod.media, dir, where);
  const p = mod.placement;
  if (p && (typeof p.x !== 'number' || typeof p.y !== 'number')) errors.push(`${where}: placement precisa de x e y numéricos`);
  if (p && !(p.width > 0 && p.height > 0)) errors.push(`${where}: placement precisa de width e height > 0`);
}

for (const id of sceneIds) {
  const dir = path.join(root, 'scenes', id);
  const scene = readJson(path.join(dir, 'scene.json'));
  if (!scene) continue;
  const where = `scenes/${id}`;
  const base = scene.base ?? { type: 'cube' };

  if (base.type === 'equirect') {
    checkMedia(base, dir, `${where} base`);
    if (base.hfov > 360 || base.vfov > 180) errors.push(`${where}: hfov ≤ 360 e vfov ≤ 180`);
  } else if (!base.type || base.type === 'cube') {
    for (const [face, media] of Object.entries(base.faces ?? {})) {
      if (!FACES.has(face)) errors.push(`${where}: face "${face}" inválida (use ${[...FACES].join(', ')})`);
      checkMedia(typeof media === 'string' ? { src: media } : media, dir, `${where} face ${face}`);
    }
    const missing = [...FACES].filter((f) => !base.faces?.[f]);
    if (missing.length) warnings.push(`${where}: faces sem foto (placeholder): ${missing.join(', ')}`);
  } else {
    errors.push(`${where}: base.type "${base.type}" desconhecido (use "cube" ou "equirect")`);
  }

  for (const link of scene.links ?? []) {
    if (!sceneIds.has(link.to)) errors.push(`${where}: link para cena inexistente "${link.to}"`);
    if (link.yaw === undefined && !scene.position) warnings.push(`${where}: link "${link.to}" sem yaw e cena sem position`);
  }
  for (const [i, layer] of (scene.layers ?? []).entries()) {
    if (layer.module && !moduleIds.has(layer.module)) errors.push(`${where}: layers[${i}] usa módulo inexistente "${layer.module}"`);
    checkMedia(layer.media, layer.module && !layer.media ? path.join(root, 'modules', layer.module) : dir, `${where} layers[${i}]`);
  }
  for (const m of scene.hideModules ?? []) {
    if (!moduleIds.has(m)) warnings.push(`${where}: hideModules cita módulo inexistente "${m}"`);
  }
}

// Pastas que existem mas não foram registradas no tour.json
for (const [kind, set] of [['scenes', sceneIds], ['modules', moduleIds]]) {
  const dir = path.join(root, kind);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!set.has(name) && fs.statSync(path.join(dir, name)).isDirectory()) warnings.push(`${kind}/${name} existe mas não está listado no tour.json`);
  }
}

finish();

function finish() {
  for (const w of warnings) console.log(`aviso: ${w}`);
  for (const e of errors) console.log(`ERRO:  ${e}`);
  console.log(errors.length ? `\n${errors.length} erro(s).` : `\nTour OK (${warnings.length} aviso(s)).`);
  process.exit(errors.length ? 1 : 0);
}
