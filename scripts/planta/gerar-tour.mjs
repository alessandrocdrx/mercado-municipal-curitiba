#!/usr/bin/env node
// Gera/atualiza public/tour a partir da planta digitalizada (dados-planta.mjs).
//   npm run planta
//
// É seguro rodar de novo: posição, links e tamanho vêm da planta, mas o que
// foi preenchido à mão é preservado —
//   module.json: title, media, info, enabled, version
//   scene.json:  base (se já tiver alguma foto), layers, hideModules, initialView

import fs from 'node:fs';
import path from 'node:path';
import { PAVIMENTOS, BOXES, PORTAS, CENAS, LIGACOES, ESCADAS } from './dados-planta.mjs';
import { COMERCIANTES, CATEGORIAS } from './comerciantes.mjs';
import crypto from 'node:crypto';

const ROOT = 'public/tour';
const IMG_W = 2000;
const IMG_H = 1500;
const r2 = (v) => Math.round(v * 100) / 100;

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

/** px da imagem → metros na planta (x para a direita, y para cima = Rua da Paz). */
const toMeters = (pav, [px, py]) => ({ x: r2(px * pav.escala), y: r2(-py * pav.escala) });
/** desloca um ponto em px na direção de um facing */
const push = ([px, py], facing, d) => [px + Math.sin((facing * Math.PI) / 180) * d, py - Math.cos((facing * Math.PI) / 180) * d];

const moduleIds = [];
const sceneIds = [];

// box → comerciante
const donoDoBox = new Map();
for (const com of COMERCIANTES) {
  for (const id of com.boxes) {
    if (donoDoBox.has(id)) throw new Error(`${id} atribuído a "${donoDoBox.get(id).nome}" e "${com.nome}"`);
    donoDoBox.set(id, com);
  }
}
const numeros = (ids) => ids.map((id) => id.split('-').pop()).join(', ');

// ------------------------------------------------------------ módulos: boxes e bancas
for (const pav of PAVIMENTOS) {
  const prefix = pav.id === 'inferior' ? 'inf' : 'sup';
  for (const grupo of BOXES[pav.id]) {
    const { ids, de, ate, facing } = grupo;
    const tipo = grupo.tipo ?? 'box';
    const passo = ids.length > 1 ? Math.hypot(ate[0] - de[0], ate[1] - de[1]) / (ids.length - 1) : null;
    const larguraPx = grupo.largura ?? passo ?? 40;
    ids.forEach((num, i) => {
      const t = ids.length > 1 ? i / (ids.length - 1) : 0;
      const centro = [de[0] + (ate[0] - de[0]) * t, de[1] + (ate[1] - de[1]) * t];
      const frente = push(centro, facing, tipo === 'banca' ? 6 : 16);
      const banca = tipo === 'banca';
      const id = `${prefix}-${tipo}-${num}`;
      const nome = `${banca ? 'Banca' : 'Box'} ${num}`;
      const com = donoDoBox.get(id);
      const cat = com && CATEGORIAS[com.categoria];
      upsertModule(id, {
        type: tipo,
        title: com ? com.nome : nome,
        placement: {
          floor: pav.id,
          ...toMeters(pav, frente),
          z: banca ? 1.0 : 1.4,
          width: r2(larguraPx * pav.escala * 0.92),
          height: banca ? 2.0 : 2.8,
          facing,
          surface: 'wall',
        },
        media: com
          ? { placeholder: { color: cat.cor, label: com.nome, sublabel: `${cat.nome} · ${nome}` } }
          : { placeholder: { color: banca ? '#3a3f3c' : '#44474d', label: nome, sublabel: 'comerciante não identificado' } },
        info: com
          ? limpa({
            category: cat.nome,
            location: `${pav.titulo} · ${banca ? 'Banca' : 'Box'} ${numeros(com.boxes)}`,
            phone: com.telefone,
            hours: com.horario,
            description: com.descricao,
            url: com.url,
            note: [com.obs, com.fonte && `Fonte do box: ${com.fonte}.`, 'Dados do diretório de comerciantes do site oficial; confirme no local.'].filter(Boolean).join(' '),
          })
          : {
            location: pav.titulo,
            description: 'Comerciante deste espaço não identificado no site oficial.',
          },
      });
    });
  }

  // ---------------------------------------------------------- módulos: portas
  for (const porta of PORTAS[pav.id]) {
    const { facing } = porta;
    upsertModule(`${prefix}-porta-${porta.id.toLowerCase()}`, {
      type: 'porta',
      title: `Porta ${porta.id}`,
      placement: { floor: pav.id, ...toMeters(pav, porta.em), z: 1.6, width: 3.2, height: 3.2, facing, surface: 'wall' },
      media: { placeholder: { color: '#1e3a5f', label: `Porta ${porta.id}`, sublabel: porta.rua } },
      info: { location: `${pav.titulo} · ${porta.rua}` },
    });
  }

  // ---------------------------------------------------------- cenas
  for (const cena of CENAS[pav.id]) {
    const links = LIGACOES.flatMap(([a, b]) => (a === cena.id ? [{ to: b }] : b === cena.id ? [{ to: a }] : []));
    for (const e of ESCADAS.filter((e) => e.de === cena.id)) links.push({ to: e.para, yaw: e.yaw, pitch: -20, label: e.rotulo });
    upsertScene(cena.id, {
      title: cena.titulo,
      floor: pav.id,
      position: { ...toMeters(pav, cena.em), z: 1.6 },
      northYaw: 0,
      moduleRadius: 14,
      base: {
        type: 'cube',
        placeholder: { color: '#3a3d42' },
        faces: {
          down: { placeholder: { color: cena.cor, label: `Piso · ${cena.titulo}` } },
          up: { placeholder: { color: '#55595f', label: 'Teto (aguardando foto)' } },
        },
      },
      links,
    });
  }
}

writeJson(path.join(ROOT, 'tour.json'), {
  title: 'Mercado Municipal de Curitiba',
  info: {
    description:
      'Fundado em 2 de agosto de 1958, com projeto do engenheiro Saul Raiz. Em 2009 ganhou o Mercado de Orgânicos, ao lado do mercado tradicional. Este tour usa as plantas afixadas no próprio mercado; fotos e dados dos boxes serão adicionados aos poucos.',
    address: 'Av. Sete de Setembro, 1865 – Centro, Curitiba – PR, 80230-901',
    hours: 'Seg 7h–14h · Ter a Sáb 7h–18h · Dom 7h–13h (confirme antes de ir)',
    sources: [
      { title: 'Visite Curitiba', url: 'https://visite.curitiba.br/mercado-municipal-de-curitiba/' },
      { title: 'Mercado Municipal de Curitiba – 61 anos', url: 'https://www.mercadomunicipaldecuritiba.com.br/61-anos-do-mercado-municipal-de-curitiba/' },
      { title: 'Prefeitura – Cidades Educadoras', url: 'https://cidadeseducadoras.curitiba.pr.gov.br/pontos-turisticos/mercado-municipal/' },
    ],
  },
  startScene: PAVIMENTOS[0].inicio,
  floors: PAVIMENTOS.map((p) => ({
    id: p.id,
    title: p.titulo,
    startScene: p.inicio,
    plan: { src: p.planta, width: r2(IMG_W * p.escala), height: r2(IMG_H * p.escala) },
  })),
  scenes: sceneIds,
  modules: moduleIds,
  directory: COMERCIANTES.map((com) => limpa({
    name: com.nome,
    category: CATEGORIAS[com.categoria].nome,
    modules: com.boxes.length ? com.boxes : undefined,
    boxes: com.boxes.length ? numeros(com.boxes) : com.boxesForaDaPlanta?.join(', '),
    onPlan: com.boxes.length > 0,
    phone: com.telefone,
    url: com.url,
    description: com.descricao,
  })),
});

// Remove pastas geradas antes que não existem mais na planta
for (const [dir, keep] of [['scenes', sceneIds], ['modules', moduleIds]]) {
  const full = path.join(ROOT, dir);
  for (const name of fs.existsSync(full) ? fs.readdirSync(full) : []) {
    const json = readJson(path.join(full, name, dir === 'scenes' ? 'scene.json' : 'module.json'));
    if (!keep.includes(name) && json?.generated) {
      fs.rmSync(path.join(full, name), { recursive: true });
      console.log(`removido: ${dir}/${name}`);
    }
  }
}

console.log(`${sceneIds.length} cenas e ${moduleIds.length} módulos gerados em ${ROOT}`);

// ------------------------------------------------------------ helpers

// Campos que podem ser editados à mão. O gerador guarda um hash do que ele
// mesmo escreveu (`autoHash`): se o arquivo ainda bate com o hash, ninguém
// mexeu e ele pode ser atualizado; se não bate, a edição manual é mantida.
function hash(obj) {
  const campos = pick(obj, ['title', 'media', 'info', 'enabled', 'version']);
  return crypto.createHash('sha1').update(JSON.stringify(campos)).digest('hex').slice(0, 12);
}

function upsertModule(id, gerado) {
  if (moduleIds.includes(id)) throw new Error(`id duplicado na planta: ${id}`);
  moduleIds.push(id);
  const file = path.join(ROOT, 'modules', id, 'module.json');
  const atual = readJson(file);
  const editado = atual && atual.autoHash && hash(atual) !== atual.autoHash;
  const final = { ...gerado, ...(editado ? pick(atual, ['title', 'media', 'info', 'enabled', 'version']) : {}), placement: gerado.placement };
  writeJson(file, { ...final, generated: true, autoHash: editado ? atual.autoHash : hash(gerado) });
}

function limpa(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
}

function upsertScene(id, gerado) {
  sceneIds.push(id);
  const file = path.join(ROOT, 'scenes', id, 'scene.json');
  const atual = readJson(file) ?? {};
  const temFoto = atual.base && (atual.base.src || Object.values(atual.base.faces ?? {}).some((f) => typeof f === 'string' || f?.src));
  const manual = pick(atual, ['layers', 'hideModules', 'initialView']);
  writeJson(file, { ...gerado, ...manual, ...(temFoto ? { base: atual.base } : {}), generated: true });
}

function pick(obj, keys) {
  return Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
}

