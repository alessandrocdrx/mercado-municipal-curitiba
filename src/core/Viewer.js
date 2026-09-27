// Renderizador + câmera + controles de olhar (arrastar, roda, pinça, teclado).
// Não sabe nada sobre o tour: apenas mostra o que estiver em `viewer.content`.

import * as THREE from 'three';
import { dirFromYawPitch, yawPitchFromDir, wrapDeg } from './geo.js';

export class Viewer extends EventTarget {
  constructor(container) {
    super();
    this.container = container;
    this.view = { yaw: 0, pitch: 0, fov: 75 };
    this.limits = { minFov: 25, maxFov: 100, minPitch: -89, maxPitch: 89 };
    this.keyboardLook = true;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111');
    this.camera = new THREE.PerspectiveCamera(this.view.fov, 1, 0.05, 5000);
    this.content = new THREE.Group();
    this.scene.add(this.content);

    this.raycaster = new THREE.Raycaster();
    this._frameHooks = new Set();

    this._bindPointer();
    this._bindKeyboard();
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this._frame());
  }

  setView({ yaw = this.view.yaw, pitch = this.view.pitch, fov = this.view.fov } = {}) {
    this.view.yaw = wrapDeg(yaw);
    this.view.pitch = THREE.MathUtils.clamp(pitch, this.limits.minPitch, this.limits.maxPitch);
    this.view.fov = THREE.MathUtils.clamp(fov, this.limits.minFov, this.limits.maxFov);
    this.dispatchEvent(new CustomEvent('viewchange', { detail: { ...this.view } }));
  }

  /** Substitui o conteúdo exibido (um THREE.Group montado pelo SceneBuilder). */
  setContent(group) {
    this.scene.remove(this.content);
    this.content = group;
    this.scene.add(group);
  }

  /** Cor de fundo e neblina (a maquete usa neblina para dar profundidade). */
  setEnvironment({ background = '#111111', fog } = {}) {
    this.scene.background = new THREE.Color(background);
    this.scene.fog = fog ? new THREE.Fog(fog.color, fog.near, fog.far) : null;
  }

  onFrame(fn) {
    this._frameHooks.add(fn);
    return () => this._frameHooks.delete(fn);
  }

  /** Projeta um ponto 3D para pixels da tela; null se estiver atrás da câmera. */
  toScreen(vec3) {
    const p = vec3.clone().project(this.camera);
    if (p.z > 1) return null;
    const { clientWidth: w, clientHeight: h } = this.container;
    return { x: (p.x + 1) * 0.5 * w, y: (1 - p.y) * 0.5 * h };
  }

  /** yaw/pitch e objetos sob uma posição do mouse (pixels relativos ao container). */
  pick(x, y) {
    const { clientWidth: w, clientHeight: h } = this.container;
    const ndc = new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.content.children, true).filter((hit) => hit.object.userData.pickable);
    return { ...yawPitchFromDir(this.raycaster.ray.direction), hits };
  }

  /**
   * Ponto do chão sob a posição (x, y) da tela, em coordenadas locais da cena
   * (observador na origem, olhos a `eye` metros do chão). null se acima do horizonte.
   */
  floorPoint(x, y, eye = 1.6) {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.raycaster.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), this.camera);
    const dir = this.raycaster.ray.direction;
    if (dir.y > -0.02) return null;
    return dir.clone().multiplyScalar(eye / -dir.y);
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _frame() {
    const { yaw, pitch, fov } = this.view;
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(dirFromYawPitch(yaw, pitch));
    this.camera.updateMatrixWorld();
    for (const fn of this._frameHooks) fn();
    this.renderer.render(this.scene, this.camera);
  }

  _bindPointer() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    const pointers = new Map();
    let drag = null;
    let pinch = null;
    let lastTap = null; // para detectar toque/clique duplo
    let pendingPick = null;

    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        drag = { x: e.clientX, y: e.clientY, yaw: this.view.yaw, pitch: this.view.pitch, moved: 0 };
      } else if (pointers.size === 2) {
        drag = null;
        pinch = { dist: pinchDistance(pointers), fov: this.view.fov };
      }
    });

    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) {
        if (e.pointerType === 'mouse') {
          const rect = el.getBoundingClientRect();
          this.dispatchEvent(new CustomEvent('hover', { detail: { x: e.clientX - rect.left, y: e.clientY - rect.top } }));
        }
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        this.setView({ fov: pinch.fov * (pinch.dist / pinchDistance(pointers)) });
      } else if (drag) {
        // "Agarrar e arrastar": a imagem acompanha o dedo/mouse, como no Street View.
        const degPerPx = this.view.fov / this.container.clientHeight;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
        this.setView({ yaw: drag.yaw - dx * degPerPx, pitch: drag.pitch + dy * degPerPx });
      }
    });

    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (drag && drag.moved < 5 && e.type === 'pointerup') {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const now = performance.now();
        const detail = { x, y, ...this.pick(x, y), shiftKey: e.shiftKey };
        if (lastTap && now - lastTap.t < 350 && Math.hypot(x - lastTap.x, y - lastTap.y) < 40) {
          // clique/toque duplo: cancela o clique simples pendente e anda
          clearTimeout(pendingPick);
          lastTap = null;
          this.dispatchEvent(new CustomEvent('doublepick', { detail }));
        } else {
          lastTap = { t: now, x, y };
          clearTimeout(pendingPick);
          pendingPick = setTimeout(() => this.dispatchEvent(new CustomEvent('pick', { detail })), 300);
        }
      }
      drag = null;
      if (pointers.size < 2) pinch = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', () => this.dispatchEvent(new CustomEvent('hover', { detail: null })));
    el.addEventListener('pointercancel', end);

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.setView({ fov: this.view.fov * Math.exp(e.deltaY * 0.001) });
    }, { passive: false });
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.keyboardLook || e.target.closest?.('input, textarea')) return;
      const step = e.shiftKey ? 15 : 5;
      const moves = {
        ArrowLeft: { yaw: this.view.yaw - step },
        ArrowRight: { yaw: this.view.yaw + step },
        ArrowUp: { pitch: this.view.pitch + step },
        ArrowDown: { pitch: this.view.pitch - step },
        '+': { fov: this.view.fov - 5 },
        '=': { fov: this.view.fov - 5 },
        '-': { fov: this.view.fov + 5 },
      };
      if (moves[e.key]) {
        e.preventDefault();
        this.setView(moves[e.key]);
      }
    });
  }
}

function pinchDistance(pointers) {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y) || 1;
}
