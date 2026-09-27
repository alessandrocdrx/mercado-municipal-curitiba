// Modo editor (tecla E): ajuda a posicionar módulos sem adivinhar números.
//
//  • Clique num ponto vazio → mostra yaw/pitch e um trecho JSON de camada pronto.
//  • Clique num módulo → seleciona; ajuste com o teclado e copie o JSON:
//      setas         mover (vista: yaw/pitch 0,5° · planta: x/y 0,1 m)
//      PgUp / PgDn   distância (vista) ou altura z (planta)
//      [ ]           largura      ; '        altura (Shift+ inverte)
//      , .           girar (rotation.yaw na vista · facing na planta)
//      Shift         passo 10×    ; Esc     desmarcar
//  As mudanças valem só na tela: cole o JSON no arquivo para salvar.

import { applyPlacement, isWorldPlacement } from '../tour/placement.js';

export class Editor {
  constructor(viewer, root) {
    this.viewer = viewer;
    this.active = false;
    this.selected = null;
    this.current = null; // resultado do buildScene

    this.panel = document.createElement('section');
    this.panel.className = 'editor-panel';
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <header><strong>Editor</strong> <span class="editor-view"></span></header>
      <p class="editor-hint">Clique num ponto ou módulo. Setas movem, [ ] largura, ; ' altura, , . giram.</p>
      <pre class="editor-json"></pre>
      <div class="editor-actions"><button data-act="copy">Copiar JSON</button><button data-act="reload">Recarregar arquivos (R)</button></div>`;
    root.appendChild(this.panel);
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair';
    this.crosshair.hidden = true;
    root.appendChild(this.crosshair);

    this.$view = this.panel.querySelector('.editor-view');
    this.$json = this.panel.querySelector('.editor-json');
    this.panel.querySelector('[data-act=copy]').addEventListener('click', () => {
      navigator.clipboard?.writeText(this.$json.textContent);
    });
    this.panel.querySelector('[data-act=reload]').addEventListener('click', () => this.onReload?.());

    viewer.addEventListener('viewchange', ({ detail: v }) => {
      this.$view.textContent = `yaw ${v.yaw.toFixed(1)}°  pitch ${v.pitch.toFixed(1)}°  fov ${v.fov.toFixed(0)}°`;
    });
    window.addEventListener('keydown', (e) => this._key(e));
  }

  setScene(built) {
    this.current = built;
    this.select(null);
  }

  toggle(force = !this.active) {
    this.active = force;
    this.panel.hidden = !force;
    this.crosshair.hidden = !force;
    if (!force) this.select(null);
  }

  /** Retorna true se o editor tratou o clique. */
  handlePick({ yaw, pitch, hits }) {
    if (!this.active) return false;
    const mesh = hits[0]?.object;
    if (mesh) {
      this.select(mesh);
    } else {
      this.select(null);
      this._show({ module: 'id-do-modulo', yaw: round(yaw), pitch: round(pitch), distance: 5, width: 2, height: 2 });
    }
    return true;
  }

  select(mesh) {
    if (this.selected) this.selected.material.color.set('#fff');
    this.selected = mesh;
    this.viewer.keyboardLook = !mesh;
    if (!mesh) return;
    mesh.material.color.set('#ffd27a');
    this._showSelected();
  }

  _showSelected() {
    const { module, placement, anchor } = this.selected.userData;
    if (anchor === 'world') {
      const where = `modules/${module.id}/module.json → "placement"`;
      this._show(clean(placement), where);
    } else {
      const where = `scenes/${this.current.scene.id}/scene.json → "layers"`;
      this._show({ module: module.id, ...clean(placement) }, where);
    }
  }

  _show(obj, where = 'cole em "layers" do scene.json') {
    this.$json.textContent = JSON.stringify(obj, null, 2);
    this.$json.dataset.where = where;
  }

  _key(e) {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === 'e' || e.key === 'E') return this.toggle();
    if (!this.active) return;
    if (e.key === 'r' || e.key === 'R') return this.onReload?.();
    if (!this.selected) return;
    if (e.key === 'Escape') return this.select(null);

    const p = this.selected.userData.placement;
    const world = isWorldPlacement(p);
    const k = e.shiftKey ? 10 : 1;
    const nudge = {
      ArrowLeft: () => (world ? (p.x -= 0.1 * k) : (p.yaw = (p.yaw ?? 0) - 0.5 * k)),
      ArrowRight: () => (world ? (p.x += 0.1 * k) : (p.yaw = (p.yaw ?? 0) + 0.5 * k)),
      ArrowUp: () => (world ? (p.y += 0.1 * k) : (p.pitch = (p.pitch ?? 0) + 0.5 * k)),
      ArrowDown: () => (world ? (p.y -= 0.1 * k) : (p.pitch = (p.pitch ?? 0) - 0.5 * k)),
      PageUp: () => (world ? (p.z = (p.z ?? 0) + 0.1 * k) : (p.distance = (p.distance ?? 5) + 0.1 * k)),
      PageDown: () => (world ? (p.z = (p.z ?? 0) - 0.1 * k) : (p.distance = Math.max(0.5, (p.distance ?? 5) - 0.1 * k))),
      '[': () => (p.width = Math.max(0.1, (p.width ?? 1) - 0.1 * k)),
      ']': () => (p.width = (p.width ?? 1) + 0.1 * k),
      '{': () => (p.width = Math.max(0.1, (p.width ?? 1) - 1)),
      '}': () => (p.width = (p.width ?? 1) + 1),
      ';': () => (p.height = Math.max(0.1, (p.height ?? 1) - 0.1 * k)),
      "'": () => (p.height = (p.height ?? 1) + 0.1 * k),
      ',': () => rotate(p, world, -1 * k),
      '.': () => rotate(p, world, 1 * k),
      '<': () => rotate(p, world, -10),
      '>': () => rotate(p, world, 10),
    }[e.key];
    if (!nudge) return;
    e.preventDefault();
    nudge();
    applyPlacement(this.selected, p, this.current.anchor ?? this.current.scene);
    this._showSelected();
  }
}

function rotate(p, world, deg) {
  if (world) p.facing = ((p.facing ?? 0) + deg + 360) % 360;
  else p.rotation = { ...p.rotation, yaw: (p.rotation?.yaw ?? 0) + deg };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function clean(placement) {
  const out = {};
  for (const [k, v] of Object.entries(placement)) {
    if (k === 'module' || k === 'media') continue;
    out[k] = typeof v === 'number' ? round(v) : v;
  }
  return out;
}
