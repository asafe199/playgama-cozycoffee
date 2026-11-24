import * as THREE from 'three';
import { scene, add, box, cyl, noShadow, M } from './scene.js';
import { wood, woodDark, metal, black } from './materials.js';
import { THEMES } from '../model/levels.js';

const brick = M(0xb5654a, { roughness: 0.9 });
const wallMat = M(0xf0e8dc, { roughness: 0.95 });
const green = M(0x5f9a62, { roughness: 0.8 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f2, roughness: 0.05, transparent: true, opacity: 0.35 });
const top = M(0xe9e4dc, { roughness: 0.25 });
const rugMat = M(0xd9c7ae, { roughness: 1 });

// ---------- room shell ----------
const floorMats = [];
for (let i = 0; i < 24; i++) {
  const m = M(0xb98a5e, { roughness: 0.5 });
  floorMats.push(m);
  box(12, 0.16, 0.5, m, 0, -0.08, -5.75 + i * 0.5, scene, 0.01);
}
const WH = 4.6;
box(12, 1.4, 0.3, brick, 0, 0.7, -6.15);
box(12, WH - 1.4, 0.3, wallMat, 0, 1.4 + (WH - 1.4) / 2, -6.15);
box(0.3, WH, 12, wallMat, -6.15, WH / 2, 0);
for (let k = 0; k < 2; k++) {
  const z = -2.2 + k * 3.6;
  box(0.1, 2.5, 3.1, black, -6.0, 2.5, z, scene, 0.02);
  noShadow(add(new THREE.PlaneGeometry(2.9, 2.3), new THREE.MeshBasicMaterial({ color: 0xcfeaf7 }), -5.93, 2.5, z)).rotation.y = Math.PI / 2;
  noShadow(box(0.04, 2.3, 0.05, black, -5.92, 2.5, z));
  noShadow(box(0.04, 0.05, 2.9, black, -5.92, 2.5, z));
}
add(new THREE.CylinderGeometry(2.4, 2.4, 0.03, 48), rugMat, 0, 0.02, 1.2);

function pendant(x, z, y = 3.4) {
  noShadow(cyl(0.01, 0.01, WH - y, black, x, (WH + y) / 2, z, scene, 6));
  noShadow(add(new THREE.ConeGeometry(0.4, 0.4, 28, 1, true), M(0x2a2c30, { metalness: 0.6, side: THREE.DoubleSide }), x, y, z));
  noShadow(add(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd98a }), x, y - 0.12, z));
  const l = new THREE.PointLight(0xffc880, 6, 7, 2);
  l.position.set(x, y - 0.2, z);
  scene.add(l);
}
pendant(0, 1.2);

function shelf(x, y) {
  box(3.2, 0.08, 0.45, woodDark, x, y, -5.9);
  const cols = [0xd9a066, 0xf2e3c8, 0x9c6b4a, 0xe9c46a];
  for (let i = 0; i < 4; i++) {
    cyl(0.16, 0.16, 0.42, glassMat, x - 1.2 + i * 0.8, y + 0.25, -5.9, scene, 16);
    cyl(0.13, 0.13, 0.3, M(cols[i], { roughness: 0.9 }), x - 1.2 + i * 0.8, y + 0.2, -5.9, scene, 16);
  }
}
shelf(-2.2, 3.0);
shelf(2.6, 3.0);
box(2.6, 1.1, 0.08, black, 0.2, 3.5, -5.98);

// kitchen counter along back wall
box(10.4, 1.2, 1.2, woodDark, 0, 0.6, -5.3);
box(10.6, 0.12, 1.4, top, 0, 1.26, -5.3);
// serving counter (front)
box(7.4, 0.9, 0.7, woodDark, 0, 0.45, -1.2);
box(7.6, 0.1, 0.9, top, 0, 0.95, -1.2);

function plant(x, z, s = 1) {
  const g = new THREE.Group();
  cyl(0.32, 0.25, 0.5, M(0xe9e4dc, { roughness: 0.9 }), 0, 0.25, 0, g, 20);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = add(new THREE.SphereGeometry(0.3, 10, 8), green, Math.cos(a) * 0.22, 0.95 + (i % 3) * 0.22, Math.sin(a) * 0.22, g);
    leaf.scale.set(0.8, 1.7, 0.35);
    leaf.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  scene.add(g);
}
plant(-5.4, -0.2, 1.2);
plant(5.4, -0.2, 1.1);
plant(5.3, 4.8, 1.3);
plant(-5.3, 4.8, 1.2);

function entranceDoor(x, z) {
  const g = new THREE.Group();
  const postH = 2.7, half = 0.62;
  box(0.16, postH, 0.2, woodDark, -half, postH / 2, 0, g);
  box(0.16, postH, 0.2, woodDark, half, postH / 2, 0, g);
  const arch = add(new THREE.TorusGeometry(half + 0.08, 0.09, 10, 16, Math.PI), woodDark, 0, postH, 0, g);
  arch.rotation.z = Math.PI;
  function leaf(hingeX, openSign) {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, 0, 0);
    box(half - 0.06, postH - 0.1, 0.05, wood, ((half - 0.06) / 2) * openSign, (postH - 0.1) / 2, 0, pivot, 0.02);
    add(new THREE.SphereGeometry(0.035, 10, 10), black, (half - 0.16) * openSign, 1.1, 0.04, pivot);
    pivot.rotation.y = openSign * 1.2;
    g.add(pivot);
  }
  leaf(-half + 0.02, 1);
  leaf(half - 0.02, -1);
  g.position.set(x, 0, z);
  scene.add(g);
}
entranceDoor(5.6, 4.0);

// ---------- level 2 ("Café Noir") decor ----------
export const extras = new THREE.Group();
extras.visible = false;
scene.add(extras);
{
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const c = cv.getContext('2d');
  c.font = 'bold 84px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = '#ff4fa3'; c.shadowBlur = 28;
  c.fillStyle = '#ffd6ec';
  c.fillText('CAFÉ NOIR', 256, 82);
  const sign = noShadow(add(new THREE.PlaneGeometry(3.4, 1.06), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }), -5.9, 3.0, 4.3, extras));
  sign.rotation.y = Math.PI / 2;
  // floor lamp
  cyl(0.04, 0.04, 2.6, black, -5.3, 1.3, 2.9, extras, 8);
  noShadow(add(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), -5.3, 2.7, 2.9, extras));
  // bar stools along the left wall
  for (const z of [-0.2, 0.9]) {
    cyl(0.28, 0.28, 0.08, M(0xd4538a, { roughness: 0.5 }), -5.0, 0.8, z, extras, 20);
    cyl(0.04, 0.04, 0.8, metal, -5.0, 0.4, z, extras, 8);
  }
}

export function applyRoomTheme(n) {
  const th = THEMES[n - 1];
  scene.background.setHex(th.bg);
  floorMats.forEach((m, i) => m.color.setHex(th.floor).offsetHSL(0, 0, ((i % 3) - 1) * 0.015));
  wallMat.color.setHex(th.wall);
  brick.color.setHex(th.brick);
  woodDark.color.setHex(th.counter);
  top.color.setHex(th.top);
  rugMat.color.setHex(th.rug);
  extras.visible = n === 2;
}
