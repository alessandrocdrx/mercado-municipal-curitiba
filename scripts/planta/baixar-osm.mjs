#!/usr/bin/env node
// Baixa do OpenStreetMap os contornos listados em CONTORNOS_OSM
// (dados-planta.mjs) e grava scripts/planta/osm-dados.json.
//   npm run osm
// © OpenStreetMap contributors, licença ODbL (openstreetmap.org/copyright).

import fs from 'node:fs';
import { CONTORNOS_OSM } from './dados-planta.mjs';

const UA = 'MercadoCuritibaTour/1.0 (github.com/alessandrocdrx/mercado-municipal-curitiba)';
const ways = {};
for (const { way } of CONTORNOS_OSM) {
  const res = await fetch(`https://api.openstreetmap.org/api/0.6/way/${way}/full.json`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`way ${way}: HTTP ${res.status}`);
  const { elements } = await res.json();
  const nodes = new Map(elements.filter((e) => e.type === 'node').map((n) => [n.id, [n.lon, n.lat]]));
  const w = elements.find((e) => e.type === 'way' && e.id === way);
  ways[way] = { tags: w.tags, versao: w.version, lonLat: w.nodes.map((id) => nodes.get(id)) };
  console.log(`way ${way} (${w.tags.name ?? w.tags.building ?? ''}): ${w.nodes.length} pontos`);
}
const out = {
  fonte: 'https://www.openstreetmap.org',
  licenca: '© OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright)',
  baixadoEm: new Date().toISOString().slice(0, 10),
  ways,
};
fs.writeFileSync(new URL('./osm-dados.json', import.meta.url), `${JSON.stringify(out, null, 1)}\n`);
console.log('scripts/planta/osm-dados.json gravado');
