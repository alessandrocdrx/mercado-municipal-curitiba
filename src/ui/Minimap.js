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
      <div class="mm-bar"><div class="mm-floors"></div><button class="mm-expand" title="Ampliar mapa">⤢</button></div>`;
    this.svg = document.createElementNS(SVG, 'svg');
    this.el.appendChild(this.svg);
    root.appendChild(this.el);
    this.onSelect = onSelect;
    this.onFloor = onFloor;
    this.el.querySelector('.mm-expand').addEventListener('click', () => this.el.classList.toggle('large'));
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

    // Enquadramento: a planta inteira, se houver; senão os pontos existentes.
    let box;
    if (floor?.plan) {
      box = { minX: 0, minY: -floor.plan.height, maxX: floor.plan.width, maxY: 0 };
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

    // áreas fora do desenho da planta (posição aproximada)
    for (const a of floor?.areas ?? []) {
      const x = Math.min(a.from.x, a.to.x);
      const y = -Math.max(a.from.y, a.to.y);
      const rect = node('rect', { x, y, width: Math.abs(a.to.x - a.from.x), height: Math.abs(a.to.y - a.from.y), class: 'mm-area', 'stroke-width': unit * 0.4, fill: a.color });
      rect.append(node('title', {}, a.title));
      this.svg.append(rect);
    }

    for (const m of modules) {
      const p = m.placement;
      if (p?.x === undefined || !onFloor(p.floor) || p.surface === 'ceiling' || p.surface === 'floor') continue;
      const rect = node('rect', { x: -(p.width ?? 1) / 2, y: -unit * 0.35, width: p.width ?? 1, height: unit * 0.7, class: 'mm-module' });
      rect.setAttribute('transform', `translate(${p.x} ${-p.y}) rotate(${p.facing ?? 0})`);
      rect.append(node('title', {}, m.title ?? m.id));
      this.svg.append(rect);
    }

    for (const s of placed) {
      for (const link of s.links ?? []) {
        const t = placed.find((o) => o.id === link.to);
        if (t) this.svg.append(node('line', { x1: s.position.x, y1: -s.position.y, x2: t.position.x, y2: -t.position.y, class: 'mm-link', 'stroke-width': unit * 0.3 }));
      }
    }

    const r = unit * 6;
    this.cone = node('path', { d: `M0 0 L${-r * 0.4} ${-r} A${r} ${r} 0 0 1 ${r * 0.4} ${-r} Z`, class: 'mm-cone' });
    this.svg.append(this.cone);
    this.current = current;

    for (const s of placed) {
      const isCur = s.id === current.id;
      const dot = node('circle', { cx: s.position.x, cy: -s.position.y, r: unit * (isCur ? 1.5 : 1), class: isCur ? 'mm-scene mm-current' : 'mm-scene' });
      dot.append(node('title', {}, s.title ?? s.id));
      dot.addEventListener('click', () => this.onSelect(s.id));
      this.svg.append(dot);
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
