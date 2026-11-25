import * as THREE from 'three';
import { camera, renderer, scene, zoomBy, panBy } from '../view/scene.js';
import { hud, menu } from '../view/hud.js';
import { setNick } from '../model/profile.js';
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
  menu.startBtn.addEventListener('click', () => { setNick(menu.nickInput.value); menu.root.style.display = 'none'; resetGame(); });
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
  const tap = (e) => {
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
        P.goal = new THREE.Vector3(s.key === 'serve' ? SLOTS.reduce((m, x) => (Math.abs(x - h.point.x) < Math.abs(m - h.point.x) ? x : m), SLOTS[1]) : THREE.MathUtils.clamp(s.key === 'waffle' && G.level >= 4 ? s.pos.x - 0.85 : s.pos.x, BOUNDS.minX, BOUNDS.maxX), 0, s.key === 'serve' ? -2.4 : s.key === 'waffle' ? (G.level < 4 ? -3.0 : -4.4) : -3.9);
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
  };

  // one finger/click = tap to move (touch: drag pans the camera); two fingers = pinch zoom + pan; wheel zooms on desktop
  const pts = new Map();
  let gesture = false, startInfo = null, last = null;
  const mid = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    try { el.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { gesture = false; startInfo = { x: e.clientX, y: e.clientY, t: performance.now() }; }
    if (pts.size === 2) { gesture = true; last = mid(); }
  });
  el.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const m = mid();
      if (m.d > 0) zoomBy(last.d / m.d);
      panBy(m.x - last.x, m.y - last.y);
      last = m;
    } else if (startInfo) {
      if (!startInfo.moved && Math.hypot(e.clientX - startInfo.x, e.clientY - startInfo.y) > 12) {
        startInfo.moved = true;
        startInfo.lx = startInfo.x; startInfo.ly = startInfo.y;
      }
      // press and drag with one finger moves the camera
      if (startInfo.moved && e.pointerType !== 'mouse') {
        panBy(e.clientX - startInfo.lx, e.clientY - startInfo.ly);
        startInfo.lx = e.clientX; startInfo.ly = e.clientY;
      }
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && !gesture && startInfo && !startInfo.moved && e.type === 'pointerup') tap(e);
    if (pts.size === 0) startInfo = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(Math.exp(e.deltaY * 0.0015)); }, { passive: false });
  addEventListener('contextmenu', (e) => e.preventDefault());
}
