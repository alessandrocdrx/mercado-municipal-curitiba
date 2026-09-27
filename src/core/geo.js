// Convenções de coordenadas usadas em todo o projeto
// ---------------------------------------------------
// Visão (dentro de uma cena):
//   yaw   = graus, 0 = "frente" da panorâmica, positivo gira para a DIREITA
//   pitch = graus, 0 = horizonte, positivo olha para CIMA
//   O observador está sempre na origem (0,0,0) do three.js; yaw 0 aponta para -Z.
//
// Planta (mundo / mapa do mercado):
//   x = metros para o leste, y = metros para o norte, z = altura em metros
//   bearing/facing = graus no sentido horário a partir do norte
//   Cada cena informa `northYaw`: o yaw da panorâmica que aponta para o norte.

import * as THREE from 'three';

export const DEG = Math.PI / 180;

export function wrapDeg(a) {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}

/** Vetor unitário (three.js) para um par yaw/pitch em graus. */
export function dirFromYawPitch(yaw, pitch, target = new THREE.Vector3()) {
  const y = yaw * DEG;
  const p = pitch * DEG;
  return target.set(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
}

/** Inverso de dirFromYawPitch. */
export function yawPitchFromDir(v) {
  const n = v.clone().normalize();
  return {
    yaw: Math.atan2(n.x, -n.z) / DEG,
    pitch: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) / DEG,
  };
}

/** Rumo (graus a partir do norte, horário) de `from` até `to` na planta. */
export function bearing(from, to) {
  return Math.atan2(to.x - from.x, to.y - from.y) / DEG;
}

/**
 * Converte um ponto da planta para coordenadas locais da cena
 * (observador na origem, altura dos olhos descontada).
 */
export function worldToLocal(point, scene, target = new THREE.Vector3()) {
  const cam = scene.position;
  const dx = point.x - cam.x;
  const dy = point.y - cam.y;
  const dz = (point.z ?? 0) - (cam.z ?? 1.6);
  const h = Math.hypot(dx, dy);
  const yaw = ((scene.northYaw ?? 0) + Math.atan2(dx, dy) / DEG) * DEG;
  return target.set(Math.sin(yaw) * h, dz, -Math.cos(yaw) * h);
}
