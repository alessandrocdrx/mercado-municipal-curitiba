// Minimapa da planta do pavimento atual: foto/desenho da planta ao fundo,
// pontos = cenas, traços = módulos ancorados na planta, cone = direção do olhar.
// Clique num ponto para ir até a cena; botões trocam de pavimento.

import { resolveUrl } from '../core/textures.js';

const SVG = 'http://www.w3.org/2000/svg';

export class Minimap {
  constructor(root, { onSelect, onFloor }) {
    this.el = document.createElement('section');
    this.el.className = 'minimap';
    this.el.innerHTML = `
      <div class="mm-bar"><div class="mm-floors"></div><button class="mm-expand" title="Ampliar mapa">⤢ Ampliar</button></div>
      <div class="mm-map"><span class="mm-north" title="Norte real" hidden><i></i>N</span></div>
      <a class="mm-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" title="Contornos, escala e norte do prédio: © OpenStreetMap contributors (ODbL)" hidden>© OpenStreetMap</a>`;
    this.svg = document.createElementNS(SVG, 'svg');
    this.el.querySelector('.mm-map').appendChild(this.svg);
    this.north = this.el.querySelector('.mm-north');
    this.credit = this.el.querySelector('.mm-credit');
    root.appendChild(this.el);
    this.onSelect = onSelect;
    this.onFloor = onFloor;
    this.el.querySelector('.mm-expand').addEventListener('click', (e) => {
      const large = this.el.classList.toggle('large');
      e.currentTarget.textContent = large ? '✕ Reduzir' : '⤢ Ampliar';
    });
  }

  render({ tour, tourUrl, scenes, modules, current }) {
    const floorId = current.floor ?? null;
    const floor = tour.floors.find((f) => f.id === floorId);
    const onFloor = (f) => (f ?? null) === floorId;
    const placed = scenes.filter((s) => s.position && onFloor(s.floor));
    this.svg.replaceChildren();
    this.el.hidden = placed.length < 2;
    if (this.el.hidden) return;

    const floorsEl = this.el.querySelector('.mm-floors');
    floorsEl.replaceChildren(...tour.floors.map((f) => {
      const b = document.createElement('button');
      b.textContent = f.title ?? f.id;
      b.className = f.id === floorId ? 'on' : '';
      b.addEventListener('click', () => f.id !== floorId && this.onFloor(f));
      return b;
    }));

    // Enquadramento: a planta inteira (e os contornos do prédio), se houver; senão os pontos existentes.
    let box;
    const outlines = floor?.outlines ?? [];
    if (floor?.plan) {
      box = { minX: 0, minY: -floor.plan.height, maxX: floor.plan.width, maxY: 0 };
      for (const p of outlines.flatMap((o) => o.points)) {
        box = { minX: Math.min(box.minX, p.x - 2), maxX: Math.max(box.maxX, p.x + 2), minY: Math.min(box.minY, p.y - 2), maxY: Math.max(box.maxY, p.y + 2) };
      }
      this.svg.append(node('image', {
        href: resolveUrl(floor.plan.src, tourUrl),
        x: 0, y: 0, width: floor.plan.width, height: floor.plan.height,
        preserveAspectRatio: 'none', class: 'mm-plan',
      }));
    } else {
      const pts = placed.map((s) => s.position);
      const pad = 3;
      box = {
        minX: Math.min(...pts.map((p) => p.x)) - pad, maxX: Math.max(...pts.map((p) => p.x)) + pad,
        minY: Math.min(...pts.map((p) => p.y)) - pad, maxY: Math.max(...pts.map((p) => p.y)) + pad,
      };
    }
    // y da planta cresce para o norte; no SVG cresce para baixo.
    this.svg.setAttribute('viewBox', `${box.minX} ${-box.maxY} ${box.maxX - box.minX} ${box.maxY - box.minY}`);
    const unit = (box.maxX - box.minX) / 100; // marcadores proporcionais ao tamanho do mapa

    // contornos do prédio atual (OpenStreetMap): mostram o que as plantas não desenham
    for (const o of outlines) {
      const poly = node('polygon', {
        points: o.points.map((p) => `${p.x},${-p.y}`).join(' '),
        class: `mm-outline mm-outline-${o.kind}`, 'stroke-width': unit * 0.35, 'stroke-dasharray': `${unit * 1.2} ${unit * 0.7}`,
      });
      poly.append(node('title', {}, `${o.title} (OpenStreetMap)`));
      this.svg.append(poly);
    }
    this.credit.hidden = !outlines.length;
    // seta do norte real: o "cima" da planta aponta para o rumo `bearingUp`
    this.north.hidden = floor?.bearingUp === undefined;
    if (!this.north.hidden) this.north.firstElementChild.style.transform = `rotate(${-floor.bearingUp}deg)`;

    for (const s of placed) {
      for (const link of s.links ?? []) {
        const t = placed.find((o) => o.id === link.to);
        if (t) this.svg.append(node('line', { x1: s.position.x, y1: -s.position.y, x2: t.position.x, y2: -t.position.y, class: 'mm-link', 'stroke-width': unit * 0.3 }));
      }
    }

    const r = unit * 9;
    this.cone = node('path', { d: `M0 0 L${-r * 0.45} ${-r} A${r} ${r} 0 0 1 ${r * 0.45} ${-r} Z`, class: 'mm-cone' });
    this.svg.append(this.cone);
    this.current = current;
    this.unit = unit;
    this.placed = placed;
    // linha até o próximo destino (botão ▲)
    this.targetLine = node('line', { class: 'mm-target-line', 'stroke-width': unit * 0.7, 'stroke-dasharray': `${unit * 1.5} ${unit}` });
    this.svg.append(this.targetLine);

    const vizinhos = new Set((current.links ?? []).map((l) => l.to));
    this.dots = new Map();
    for (const s of placed) {
      if (s.id === current.id) continue;
      const near = vizinhos.has(s.id);
      const dot = node('circle', { cx: s.position.x, cy: -s.position.y, r: unit * (near ? 1.4 : 0.9), class: near ? 'mm-scene mm-near' : 'mm-scene' });
      dot.append(node('title', {}, s.title ?? s.id));
      dot.addEventListener('click', () => this.onSelect(s.id));
      this.svg.append(dot);
      this.dots.set(s.id, dot);
    }
    if (current.position) {
      // "você está aqui": anel pulsante + ponto amarelo com borda
      const cx = current.position.x, cy = -current.position.y;
      this.svg.append(node('circle', { cx, cy, r: unit * 4, class: 'mm-pulse' }));
      const me = node('circle', { cx, cy, r: unit * 2.2, class: 'mm-current', 'stroke-width': unit * 0.6 });
      me.append(node('title', {}, `Você está aqui: ${current.title ?? ''}`));
      this.svg.append(me);
    }
    this.setTarget(this.targetId);
  }

  /** Destaca no mapa o ponto para onde o botão ▲ leva. */
  setTarget(sceneId) {
    this.targetId = sceneId;
    if (!this.dots) return;
    for (const [id, dot] of this.dots) dot.classList.toggle('mm-target', id === sceneId);
    const t = this.placed?.find((s) => s.id === sceneId);
    const c = this.current?.position;
    this.targetLine.style.display = t && c ? '' : 'none';
    if (t && c) {
      Object.entries({ x1: c.x, y1: -c.y, x2: t.position.x, y2: -t.position.y }).forEach(([k, v]) => this.targetLine.setAttribute(k, v));
    }
  }

  setHeading(viewYaw) {
    if (!this.current?.position || !this.cone) return;
    const heading = viewYaw - (this.current.northYaw ?? 0);
    this.cone.setAttribute('transform', `translate(${this.current.position.x} ${-this.current.position.y}) rotate(${heading})`);
  }
}

function node(tag, attrs, text) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}
