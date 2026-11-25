import * as THREE from 'three';
import { camera, renderer, scene } from '../view/scene.js';
import { hud } from '../view/hud.js';
import { stations } from '../view/stations.js';
import { LEVELS } from '../model/levels.js';
import { lang } from '../model/i18n.js';
import { G, P, BOUNDS, SLOTS } from '../model/state.js';

export const keys = new Set();

export function setupInput({ interact, dropHeld, nearest, resetGame }) {
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'q' || k === 'x') { dropHeld(); return; }
    if (k === ' ' || k === 'e') { e.preventDefault(); interact(nearest()); return; }
    keys.add(k);
    P.goal = P.pending = null;
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  hud.act.addEventListener('pointerdown', (e) => { e.stopPropagation(); interact(nearest()); });
  hud.btn.addEventListener('click', resetGame);
  hud.lvl.innerHTML = LEVELS.map((_, i) => `<option value="${i + 1}">${lang === 'pt' ? 'Nível' : 'Level'} ${i + 1}</option>`).join('');
  hud.lvl.value = String(G.level);
  hud.lvl.addEventListener('change', () => {
    G.level = Number(hud.lvl.value);
    hud.lvl.blur();
    resetGame();
  });
  hud.drop.addEventListener('pointerdown', (e) => { e.stopPropagation(); dropHeld(); });

  const ray = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (G.mode !== 'playing') return;
    ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    for (const h of ray.intersectObjects(scene.children, true)) {
      let o = h.object, vis = true;
      for (let p = o; p; p = p.parent) if (!p.visible) vis = false;
      if (!vis) continue;
      while (o && !o.userData.station) o = o.parent;
      if (o) {
        const s = stations[o.userData.station];
        P.pending = s;
        P.goal = new THREE.Vector3(s.key === 'serve' ? SLOTS.reduce((m, x) => (Math.abs(x - h.point.x) < Math.abs(m - h.point.x) ? x : m), SLOTS[1]) : THREE.MathUtils.clamp(s.pos.x, BOUNDS.minX, BOUNDS.maxX), 0, s.key === 'serve' ? -2.4 : s.key === 'waffle' ? -3.0 : -3.9);
        return;
      }
    }
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(floorPlane, p)) {
      // keep the target inside the walkable area behind the counter
      p.x = THREE.MathUtils.clamp(p.x, BOUNDS.minX, BOUNDS.maxX);
      p.z = THREE.MathUtils.clamp(p.z, BOUNDS.minZ, BOUNDS.maxZ);
      P.goal = p; P.pending = null;
    }
  });
}
