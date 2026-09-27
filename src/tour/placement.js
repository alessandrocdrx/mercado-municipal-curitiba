// Posiciona o plano de um módulo dentro de uma cena. Há dois jeitos:
//
// 1) Ancorado na VISTA (específico de uma foto) — ideal para recortar um trecho
//    exato da panorâmica:
//      { "yaw": 30, "pitch": -5, "distance": 6, "width": 3, "height": 2.4,
//        "rotation": { "yaw": 0, "pitch": 0, "roll": 0 } }
//    O plano fica de frente para o observador; `rotation` inclina a partir daí
//    (ex.: rotation.yaw = 35 para uma fachada vista de lado).
//
// 2) Ancorado na PLANTA (metros) — declarado uma vez no module.json e exibido
//    automaticamente em TODAS as cenas próximas:
//      { "x": 3, "y": 10, "z": 1.3, "width": 3, "height": 2.6,
//        "facing": 270, "surface": "wall" | "floor" | "ceiling" }
//    `facing` = para onde a face do módulo aponta (graus a partir do norte).

import { DEG, dirFromYawPitch, worldToLocal } from '../core/geo.js';

export function isWorldPlacement(p) {
  return p && typeof p.x === 'number' && typeof p.y === 'number';
}

export function applyPlacement(mesh, p, scene) {
  mesh.rotation.set(0, 0, 0, 'YXZ');
  mesh.scale.set(p.width ?? 1, p.height ?? 1, 1);

  if (isWorldPlacement(p)) {
    worldToLocal(p, scene, mesh.position);
    const yaw = ((scene.northYaw ?? 0) + (p.facing ?? 0)) * DEG;
    switch (p.surface ?? 'wall') {
      case 'floor':
        mesh.rotation.set(-Math.PI / 2, -yaw, 0, 'YXZ');
        break;
      case 'ceiling':
        mesh.rotation.set(Math.PI / 2, -yaw, 0, 'YXZ');
        break;
      default:
        mesh.rotation.set(0, Math.PI - yaw, (p.roll ?? 0) * DEG, 'YXZ');
    }
  } else {
    dirFromYawPitch(p.yaw ?? 0, p.pitch ?? 0, mesh.position).multiplyScalar(p.distance ?? 5);
    mesh.lookAt(0, 0, 0);
    const r = p.rotation ?? {};
    mesh.rotateY(-(r.yaw ?? 0) * DEG);
    mesh.rotateX((r.pitch ?? 0) * DEG);
    mesh.rotateZ(-(r.roll ?? 0) * DEG);
  }
  mesh.updateMatrixWorld();
}
