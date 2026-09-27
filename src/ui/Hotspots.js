// Setas de navegação (links entre cenas) desenhadas em HTML sobre o canvas.

import { dirFromYawPitch } from '../core/geo.js';

export class Hotspots {
  constructor(viewer, overlay, onNavigate) {
    this.viewer = viewer;
    this.layer = document.createElement('div');
    this.layer.className = 'hotspots';
    overlay.appendChild(this.layer);
    this.items = [];
    this.onNavigate = onNavigate;
    viewer.onFrame(() => this._update());
  }

  setLinks(links) {
    this.layer.replaceChildren();
    this.items = links.map((link) => {
      const el = document.createElement('button');
      el.className = 'hotspot';
      el.title = link.label;
      el.innerHTML = `<span class="hotspot-arrow" style="--yaw:${link.yaw}deg"></span><span class="hotspot-label"></span>`;
      el.querySelector('.hotspot-label').textContent = link.label;
      el.addEventListener('click', () => this.onNavigate(link));
      this.layer.appendChild(el);
      // no mesmo pavimento a seta fica pousada no chão, a meio caminho (até 4 m)
      const pos = link.distance
        ? dirFromYawPitch(link.yaw, 0).multiplyScalar(Math.min(4, Math.max(1.8, link.distance / 2))).setY(-(link.eye ?? 1.6) + 0.05)
        : dirFromYawPitch(link.yaw, link.pitch).multiplyScalar(10);
      return { el, link, pos };
    });
  }

  _update() {
    for (const { el, pos } of this.items) {
      const p = this.viewer.toScreen(pos);
      el.style.display = p ? '' : 'none';
      if (p) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    }
    // As setas apontam para a direção do link relativa ao olhar atual.
    this.layer.style.setProperty('--view-yaw', `${this.viewer.view.yaw}deg`);
  }
}
