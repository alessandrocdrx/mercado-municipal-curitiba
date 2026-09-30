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
import { PAVIMENTOS, BOXES, PORTAS, CENAS, LIGACOES, ESCADAS, RUAS, MOBILIARIO, AREA_COBERTA, CONTORNOS_OSM, PAREDES, OBRAS } from './dados-planta.mjs';
import { COMERCIANTES, CATEGORIAS } from './comerciantes.mjs';
import { FOTOS_MERCADO, FOTOS_COMERCIANTES } from './fotos.mjs';
import crypto from 'node:crypto';

const ORDEM_PISOS = ['inferior', 'superior', 'nivel3'];
const PREFIXO_PISO = { 'inf-': 'inferior', 'sup-': 'superior', 'n3-': 'nivel3' };
const ALTURA_LANCE = { 'inferior>superior': 4.5, 'superior>nivel3': 3.5 };

const ROOT = 'public/tour';
const IMG_W = 2000;
const IMG_H = 1500;
const r2 = (v) => Math.round(v * 100) / 100;

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

const OSM = JSON.parse(fs.readFileSync(new URL('./osm-dados.json', import.meta.url), 'utf8'));

/** lon/lat → px da planta, pela rotação (`rumoCima`), escala e âncora do pavimento. */
function lonLatParaPx(pav, [lon, lat]) {
  const [alon, alat] = pav.ancora.lonLat;
  const leste = (lon - alon) * 111320 * Math.cos((alat * Math.PI) / 180);
  const norte = (lat - alat) * 110540;
  const r = (pav.rumoCima * Math.PI) / 180;
  const direita = leste * Math.cos(r) - norte * Math.sin(r);
  const cima = leste * Math.sin(r) + norte * Math.cos(r);
  return [pav.ancora.px[0] + direita / pav.escala, pav.ancora.px[1] - cima / pav.escala];
}

/** px da imagem → metros na planta (x para a direita, y para cima = Rua da Paz). */
const toMeters = (pav, [px, py]) => ({ x: r2(px * pav.escala), y: r2(-py * pav.escala) });
/** desloca um ponto em px na direção de um facing */
const push = ([px, py], facing, d) => [px + Math.sin((facing * Math.PI) / 180) * d, py - Math.cos((facing * Math.PI) / 180) * d];

// Aparência real (cores, tipo, profundidade) lida no tour 3D oficial: visual-tour3d.json
const VISUAL = JSON.parse(fs.readFileSync(new URL('./visual-tour3d.json', import.meta.url), 'utf8'));
const clamp = (v, a, b) => (v === undefined ? undefined : Math.min(b, Math.max(a, v)));

const moduleIds = [];
const fundidos = new Set(); // boxes absorvidos por uma loja de vários boxes
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
  const prefix = { inferior: 'inf', superior: 'sup', nivel3: 'n3' }[pav.id];
  for (const grupo of BOXES[pav.id]) {
    const { ids, de, ate, facing } = grupo;
    const tipo = grupo.tipo ?? 'box';
    const passo = ids.length > 1 ? Math.hypot(ate[0] - de[0], ate[1] - de[1]) / (ids.length - 1) : null;
    const larguraPx = grupo.largura ?? passo ?? 40;
    // boxes vizinhos do mesmo comerciante viram uma loja só (fachada contínua)
    const dono = (num) => donoDoBox.get(`${prefix}-${tipo}-${num}`);
    const corridas = [];
    ids.forEach((num, i) => {
      const ult = corridas[corridas.length - 1];
      if (ult && dono(num) && dono(ids[ult.fim]) === dono(num) && ult.fim === i - 1) ult.fim = i;
      else corridas.push({ ini: i, fim: i });
    });
    corridas.forEach(({ ini, fim }) => {
      const i = ini;
      const num = ids[ini];
      const n = fim - ini + 1;
      for (let k = ini + 1; k <= fim; k++) fundidos.add(`${prefix}-${tipo}-${ids[k]}`);
      const t = ids.length > 1 ? (ini + fim) / 2 / (ids.length - 1) : 0;
      const centro = [de[0] + (ate[0] - de[0]) * t, de[1] + (ate[1] - de[1]) * t];
      const frente = push(centro, facing, tipo === 'banca' ? 6 : 16);
      const banca = tipo === 'banca';
      const id = `${prefix}-${tipo}-${num}`;
      const numerosLoja = ids.slice(ini, fim + 1);
      const nome = grupo.rotulo ?? (n > 1 ? `${banca ? 'Bancas' : 'Boxes'} ${numerosLoja.join(' · ')}` : `${banca ? 'Banca' : 'Box'} ${num}`);
      const com = donoDoBox.get(id);
      const cat = com && CATEGORIAS[com.categoria];
      upsertModule(id, {
        type: tipo,
        title: com ? com.nome : nome,
        placement: {
          floor: pav.id,
          ...toMeters(pav, frente),
          z: (banca ? 0.6 : 1.4) + (grupo.base ?? 0),
          width: r2(larguraPx * pav.escala * (0.92 + (n - 1))),
          height: banca ? 1.2 : r2(clamp(com && VISUAL[com.nome]?.altura, 2.4, 3.5) ?? 2.8),
          depth: banca ? undefined : clamp(com && VISUAL[com.nome]?.profundidade, 1.2, 4),
          facing,
          surface: 'wall',
        },
        media: com
          ? { placeholder: limpa({
            color: VISUAL[com.nome]?.letreiro ?? cat.cor, facade: VISUAL[com.nome]?.fachada, textColor: VISUAL[com.nome]?.texto,
            closed: VISUAL[com.nome]?.tipo === 'loja_fechada_porta_enrolar' || undefined, shutter: VISUAL[com.nome]?.tipo === 'porta_enrolar' || undefined, vitrine: VISUAL[com.nome]?.vitrine,
            label: com.nome, sublabel: `${cat.nome} · ${nome}`, numeros: n > 1 ? numerosLoja.map(String) : undefined,
          }) }
          : { placeholder: { color: banca ? '#3a3f3c' : '#44474d', label: nome, sublabel: 'comerciante não identificado' } },
        info: com
          ? limpa({
            category: cat.nome,
            location: [grupo.rotulo ?? `${banca ? (com.boxes.length > 1 ? 'Bancas' : 'Banca') : (com.boxes.length > 1 ? 'Boxes' : 'Box')} ${numeros(com.boxes).replace(/, ([^,]*)$/, ' e $1')}`, grupo.area, pav.titulo].filter(Boolean).join(' · '),
            color: cat.cor,
            phone: com.telefone,
            hours: com.horario,
            description: com.descricao,
            url: com.url,
            note: com.obs,
            source: `${com.fonte ?? 'diretório de comerciantes do site oficial'}. Comerciantes podem mudar de box: confirme no local.`,
            photos: FOTOS_COMERCIANTES[com.nome],
          })
          : {
            location: pav.titulo,
            description: 'Ainda não sabemos quem ocupa este espaço. Se você souber, avise para atualizarmos o tour.',
          },
      });
    });
  }

  // ---------------------------------------------------------- módulos: portas
  for (const obra of OBRAS[pav.id] ?? []) {
    upsertModule(`${prefix}-arte-${obra.id}`, {
      type: 'arte',
      title: obra.titulo,
      placement: (() => {
        const g = posicaoObra(pav, obra);
        return { floor: pav.id, x: g.x, y: g.y, z: (obra.base ?? 1.3) + obra.altura / 2, width: obra.largura, height: obra.altura, facing: g.facing, surface: 'wall' };
      })(),
      media: { placeholder: { label: obra.titulo, sublabel: `${obra.autor} · ${obra.ano}` } },
      info: { category: 'Arte', description: obra.descricao, url: obra.url, location: `${pav.titulo} · posição estimada` },
    });
  }
  for (const porta of PORTAS[pav.id]) {
    const { facing } = porta;
    upsertModule(`${prefix}-porta-${porta.id.toLowerCase()}`, {
      type: 'porta',
      title: porta.titulo ?? `Porta ${porta.id}`,
      placement: { floor: pav.id, ...toMeters(pav, porta.em), z: (porta.altura ?? 3.2) / 2, width: porta.largura ?? 3.2, height: porta.altura ?? 3.2, facing, surface: 'wall' },
      media: { placeholder: { color: '#1e3a5f', label: porta.titulo ?? `Porta ${porta.id}`, sublabel: porta.rua } },
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
      position: { ...toMeters(pav, cena.em), z: r2(1.6 + (cena.base ?? 0)) },
      northYaw: 0,
      moduleRadius: 28,
      // sem foto: o app monta a maquete 3D. Para usar foto 360°, preencha
      // base.faces (cubo) ou base.src (equirect) — o gerador preserva.
      base: { type: 'cube', faces: {} },
      links,
    });
  }
}

writeJson(path.join(ROOT, 'tour.json'), {
  title: 'Mercado Municipal de Curitiba',
  info: {
    description:
      'Fundado em 2 de agosto de 1958, com projeto do engenheiro Saul Raiz. Em 2009 ganhou o Mercado de Orgânicos, ao lado do mercado tradicional.\n\n'
      + 'PROJETO INDEPENDENTE: este tour não tem vínculo oficial com o Mercado Municipal, a Ascesme ou a Prefeitura de Curitiba. A maquete e as plantas são desenhos próprios; nomes de lojas aparecem apenas para identificá-las e as marcas pertencem aos seus donos.\n\n'
      + 'DADOS E PRIVACIDADE (LGPD): mostramos só contatos comerciais divulgados publicamente pelas lojas. Não coletamos dados de quem visita o tour.\n\n'
      + 'Fotos: só com licença livre, com autor e licença indicados. Dados de posição e nomes: fontes listadas abaixo; confirme no local.',
    address: 'Av. Sete de Setembro, 1865 – Centro, Curitiba – PR, 80230-901',
    hours: 'Seg 7h–14h · Ter a Sáb 7h–18h · Dom 7h–13h (confirme antes de ir)',
    sources: [
      { title: 'Visite Curitiba', url: 'https://visite.curitiba.br/mercado-municipal-de-curitiba/' },
      { title: 'Mercado Municipal de Curitiba – 61 anos', url: 'https://www.mercadomunicipaldecuritiba.com.br/61-anos-do-mercado-municipal-de-curitiba/' },
      { title: 'Prefeitura – Cidades Educadoras', url: 'https://cidadeseducadoras.curitiba.pr.gov.br/pontos-turisticos/mercado-municipal/' },
      { title: 'Contornos, escala e norte do prédio: © OpenStreetMap contributors (ODbL)', url: 'https://www.openstreetmap.org/copyright' },
    ],
    photos: FOTOS_MERCADO,
  },
  startScene: PAVIMENTOS[0].inicio,
  floors: PAVIMENTOS.map((p) => ({
    id: p.id,
    title: p.titulo,
    startScene: p.inicio,
    plan: { src: p.planta, floorSrc: p.planta.replace('planta-', 'piso-'), width: r2(IMG_W * p.escala), height: r2(IMG_H * p.escala) },
    bearingUp: p.rumoCima, // rumo real (graus a partir do norte) do "cima" da planta
    tour3d: p.tour3d,
    below: p.abaixo && { floor: p.abaixo.pavimento, drop: p.abaixo.desnivel },
    outlines: CONTORNOS_OSM.filter((c) => c.pavimentos.includes(p.id)).map((c) => ({
      id: `osm-way-${c.way}`, title: c.nome, kind: c.tipo, source: 'OpenStreetMap',
      points: OSM.ways[c.way].lonLat.map((ll) => toMeters(p, lonLatParaPx(p, ll))),
    })),
    covered: AREA_COBERTA[p.id] && {
      from: toMeters(p, AREA_COBERTA[p.id].de), to: toMeters(p, AREA_COBERTA[p.id].ate),
    },
    props: [...(p.tour3d ? mobiliario(p) : []), ...lances(p), ...paredes(p)],
    streets: (RUAS[p.id] ?? []).map((r) => ({
      name: r.nome,
      from: toMeters(p, r.de), to: toMeters(p, r.ate),
      side: r.lado,
      sidewalk: r2(r.calcada * p.escala), road: r2(r.pista * p.escala), farSidewalk: r2(r.calcadaOposta * p.escala),
      crosswalks: (r.faixasPedestres ?? []).map((px) => r2(px * p.escala)),
    })),
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

verificaLigacoes();
for (const com of COMERCIANTES) {
  const faltando = com.boxes.filter((id) => !moduleIds.includes(id) && !fundidos.has(id));
  if (faltando.length) {
    console.error(`${com.nome}: box inexistente na planta: ${faltando.join(', ')}`);
    process.exit(1);
  }
}
console.log(`${sceneIds.length} cenas e ${moduleIds.length} módulos gerados em ${ROOT}`);

/**
 * Nenhuma ligação entre pontos de vista pode atravessar um box ou banca:
 * o caminho tem de seguir pelos corredores. Falha o gerador se atravessar.
 */
function verificaLigacoes() {
  const PROF = { box: 2.2, banca: 1.0 };
  const mods = moduleIds.map((id) => readJson(path.join(ROOT, 'modules', id, 'module.json')));
  const pos = Object.fromEntries(sceneIds.map((id) => [id, readJson(path.join(ROOT, 'scenes', id, 'scene.json'))]));
  const erros = [];
  for (const [a, b] of LIGACOES) {
    const A = pos[a];
    const B = pos[b];
    const hit = mods.filter((m) => PROF[m.type] && m.placement.floor === A.floor && atravessa(A.position, B.position, m.placement, PROF[m.type]));
    if (hit.length) erros.push(`${a} ↔ ${b} atravessa ${hit.map((m) => m.title).join(', ')}`);
  }
  if (erros.length) {
    console.error('Ligações que atravessam boxes (ajuste dados-planta.mjs):\n  ' + erros.join('\n  '));
    process.exit(1);
  }
}

function atravessa(a, b, p, prof) {
  const f = (p.facing * Math.PI) / 180;
  const n = [Math.sin(f), Math.cos(f)];
  const t = [Math.cos(f), -Math.sin(f)];
  const c = [p.x - (n[0] * prof) / 2, p.y - (n[1] * prof) / 2];
  const loc = (q) => [(q.x - c[0]) * t[0] + (q.y - c[1]) * t[1], (q.x - c[0]) * n[0] + (q.y - c[1]) * n[1]];
  const [u0, v0] = loc(a);
  const [u1, v1] = loc(b);
  const hu = p.width / 2 - 0.15;
  const hv = prof / 2 - 0.1;
  let t0 = 0;
  let t1 = 1;
  // recorte de Liang–Barsky do segmento contra o retângulo do box
  for (const [pp, qq] of [[-(u1 - u0), u0 + hu], [u1 - u0, hu - u0], [-(v1 - v0), v0 + hv], [v1 - v0, hv - v0]]) {
    if (pp === 0) {
      if (qq < 0) return false;
      continue;
    }
    const r = qq / pp;
    if (pp < 0) {
      if (r > t1) return false;
      t0 = Math.max(t0, r);
    } else {
      if (r < t0) return false;
      t1 = Math.min(t1, r);
    }
  }
  return true;
}

// ------------------------------------------------------------ helpers

// Campos que podem ser editados à mão. O gerador guarda um hash do que ele
// mesmo escreveu (`autoHash`): se o arquivo ainda bate com o hash, ninguém
// mexeu e ele pode ser atualizado; se não bate, a edição manual é mantida.
function hash(obj) {
  const campos = pick(obj, ['title', 'media', 'info', 'enabled', 'version']);
  return crypto.createHash('sha1').update(JSON.stringify(campos)).digest('hex').slice(0, 12);
}

/** Lances de escada nos pontos de vista que têm ligação entre pavimentos (subir ou descer). */
function lances(p) {
  const out = [];
  for (const e of ESCADAS) {
    const de = (CENAS[p.id] ?? []).find((c) => c.id === e.de);
    if (!de) continue;
    const destino = Object.entries(PREFIXO_PISO).find(([pre]) => e.para.startsWith(pre))?.[1];
    const a = ORDEM_PISOS.indexOf(p.id);
    const b = ORDEM_PISOS.indexOf(destino);
    if (a < 0 || b < 0 || a === b) continue;
    const subir = b > a;
    if (!subir && p.id === 'nivel3') continue; // o 3º nível não tem piso vazado para descer
    const altura = ALTURA_LANCE[subir ? `${p.id}>${destino}` : `${destino}>${p.id}`] ?? 4;
    out.push({ tipo: 'lance', ...toMeters(p, de.em), yaw: e.yaw, subir, altura, rotulo: e.rotulo });
  }
  return out;
}

/** Posição (m) e rumo de uma obra; `noLance` a encosta na parede lateral de um lance de escada. */
function posicaoObra(pav, obra) {
  if (!obra.noLance) return { ...toMeters(pav, obra.em), facing: obra.facing };
  const { de, lado, recuo } = obra.noLance;
  const cena = CENAS[pav.id].find((c) => c.id === de);
  const e = ESCADAS.find((q) => q.de === de);
  const o = toMeters(pav, cena.em);
  const yaw = (e.yaw * Math.PI) / 180;
  const dx = Math.sin(yaw);
  const dy = Math.cos(yaw);
  const nx = -dy * lado; // normal para o lado da parede
  const ny = dx * lado;
  const off = 1.3; // meia largura do lance + espessura da parede
  const t = recuo + obra.largura / 2;
  const face = off - 0.19; // face da parede voltada para a escada
  return { x: o.x + dx * t + nx * face, y: o.y + dy * t + ny * face, facing: (Math.atan2(-nx, -ny) * 180 / Math.PI + 360) % 360, o, dx, dy, nx, ny, off };
}

function paredes(p) {
  const pav = PAVIMENTOS.find((q) => q.id === p.id);
  const doLance = (OBRAS[p.id] ?? []).filter((ob) => ob.noLance).map((ob) => {
    const g = posicaoObra(pav, ob);
    const ponto = (t) => [g.o.x + g.dx * t + g.nx * g.off, g.o.y + g.dy * t + g.ny * g.off];
    const [x, y] = ponto(ob.noLance.recuo - 0.5);
    const [x2, y2] = ponto(ob.noLance.recuo + ob.largura + 0.5);
    return { tipo: 'parede', x, y, x2, y2, altura: 5.2 };
  });
  return [...doLance, ...(PAREDES[p.id] ?? []).map((w) => {
    const a = toMeters(p, w.de);
    const b = toMeters(p, w.ate);
    return { tipo: 'parede', ...a, x2: b.x, y2: b.y, altura: w.altura };
  })];
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


/**
 * Mobiliário do tour 3D (coordenadas do tour em m) → metros da planta. Grupos de
 * mesas viram mesas individuais numa grade; mesas a menos de 1,1 m de um caminho
 * entre pontos de vista são retiradas (ninguém anda por cima de mesa).
 */
function mobiliario(p) {
  const { o, ex, ey } = p.tour3d;
  const esc = Math.hypot(ex[0], ex[1]);
  const tm = ([X, Y]) => ({ x: r2(o[0] + ex[0] * X + ey[0] * Y), y: r2(o[1] + ex[1] * X + ey[1] * Y) });
  const pos = Object.fromEntries(CENAS[p.id].map((c) => [c.id, toMeters(p, c.em)]));
  const caminhos = LIGACOES.filter(([a, b]) => pos[a] && pos[b]).map(([a, b]) => [pos[a], pos[b]]);
  const perto = (q) => caminhos.some(([a, b]) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const k = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(a.x + dx * k - q.x, a.y + dy * k - q.y) < 1.1;
  });
  const out = [];
  for (const item of MOBILIARIO[p.id] ?? []) {
    const { tipo, em, de, ate, pontos, r, n, ...resto } = item;
    if (tipo === 'mesas') {
      const w = Math.abs(ate[0] - de[0]), h = Math.abs(ate[1] - de[1]);
      const cols = Math.max(1, Math.round(Math.sqrt(n * w / (h || 1))));
      const rows = Math.max(1, Math.ceil(n / cols));
      for (let i = 0; i < cols; i++) {
        for (let k = 0; k < rows; k++) {
          const q = tm([de[0] + (w * (i + 0.5)) / cols * Math.sign(ate[0] - de[0] || 1), de[1] + (h * (k + 0.5)) / rows * Math.sign(ate[1] - de[1] || 1)]);
          if (!perto(q)) out.push(limpa({ tipo: 'mesa', ...q, r: r && r2(r), ...resto }));
        }
      }
    } else if (de) {
      const a = tm(de), b = tm(ate);
      if (tipo !== 'guarda') {
        out.push(limpa({ tipo, ...a, x2: b.x, y2: b.y, ...resto }));
        continue;
      }
      // guarda-corpo: abre uma passagem de 2,4 m onde um caminho entre pontos de vista o cruza
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      const cortes = [];
      for (const [c, d] of caminhos) {
        const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (!den) continue;
        const u = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
        const v = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
        if (u > 0 && u < 1 && v > 0 && v < 1) cortes.push(u * L);
      }
      const trechos = [];
      let ini = 0;
      for (const k of cortes.sort((x, y) => x - y)) {
        if (k - 1.2 > ini) trechos.push([ini, k - 1.2]);
        ini = k + 1.2;
      }
      if (L > ini) trechos.push([ini, L]);
      for (const [s0, s1] of trechos) {
        const q0 = { x: r2(a.x + (b.x - a.x) * s0 / L), y: r2(a.y + (b.y - a.y) * s0 / L) };
        const q1 = { x: r2(a.x + (b.x - a.x) * s1 / L), y: r2(a.y + (b.y - a.y) * s1 / L) };
        out.push(limpa({ tipo, ...q0, x2: q1.x, y2: q1.y, ...resto }));
      }
    } else if (pontos) {
      const ps = pontos.map(tm);
      out.push(limpa({ tipo, ...ps[0], pontos: ps.map((q) => [q.x, q.y]), ...resto }));
    } else {
      out.push(limpa({ tipo, ...tm(em), r: r && r2(r * esc), ...resto }));
    }
  }
  return out;
}
