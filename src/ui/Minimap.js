// Minimapa da planta: pontos = cenas, retângulos = módulos ancorados na planta,
// cone = direção do olhar. Clique num ponto para ir até a cena.

const SVG = 'http://www.w3.org/2000/svg';

export class Minimap {
  constructor(root, onSelect) {
    this.svg = document.createElementNS(SVG, 'svg');
    this.svg.classList.add('minimap');
    root.appendChild(this.svg);
    this.onSelect = onSelect;
  }

  render({ scenes, modules, currentId }) {
    const placed = scenes.filter((s) => s.position);
    this.svg.replaceChildren();
    this.svg.hidden = placed.length < 2;
    if (this.svg.hidden) return;

    const pts = [...placed.map((s) => s.position), ...modules.filter((m) => m.placement?.x !== undefined).map((m) => m.placement)];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const pad = 3;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    // y da planta cresce para o norte; no SVG cresce para baixo.
    this.svg.setAttribute('viewBox', `${minX} ${-maxY} ${maxX - minX} ${maxY - minY}`);

    for (const m of modules) {
      const p = m.placement;
      if (p?.x === undefined || p.surface === 'ceiling' || p.surface === 'floor') continue;
      const rect = node('rect', { x: -(p.width ?? 1) / 2, y: -0.25, width: p.width ?? 1, height: 0.5, class: 'mm-module' });
      rect.setAttribute('transform', `translate(${p.x} ${-p.y}) rotate(${p.facing ?? 0})`);
      rect.append(node('title', {}, m.title ?? m.id));
      this.svg.append(rect);
    }

    for (const s of placed) {
      for (const link of s.links ?? []) {
        const t = placed.find((o) => o.id === link.to);
        if (t) this.svg.append(node('line', { x1: s.position.x, y1: -s.position.y, x2: t.position.x, y2: -t.position.y, class: 'mm-link' }));
      }
    }

    this.cone = node('path', { d: 'M0 0 L-2.2 -5 A5.5 5.5 0 0 1 2.2 -5 Z', class: 'mm-cone' });
    this.svg.append(this.cone);
    this.current = placed.find((s) => s.id === currentId);

    for (const s of placed) {
      const dot = node('circle', { cx: s.position.x, cy: -s.position.y, r: s.id === currentId ? 1.1 : 0.8, class: s.id === currentId ? 'mm-scene mm-current' : 'mm-scene' });
      dot.append(node('title', {}, s.title ?? s.id));
      dot.addEventListener('click', () => this.onSelect(s.id));
      this.svg.append(dot);
    }
  }

  setHeading(viewYaw) {
    if (!this.current || !this.cone) return;
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
