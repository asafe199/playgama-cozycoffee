import * as THREE from 'three';
import { scene, add, box, cyl, noShadow, M } from './scene.js';
import { wood, woodDark, metal, black } from './materials.js';
import { THEMES } from '../model/levels.js';
import { tr } from '../model/i18n.js';

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
box(11.0, 1.2, 1.2, woodDark, -0.3, 0.6, -5.3);
box(11.2, 0.12, 1.4, top, -0.3, 1.26, -5.3);
// serving counter (front)
export const counterBase = box(7.4, 0.9, 0.7, woodDark, 0, 0.45, -1.2);
export const counterTop = box(7.6, 0.1, 0.9, top, 0, 0.95, -1.2);

function plant(x, z, s = 1, parent = scene) {
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
  parent.add(g);
  return g;
}
const greenPlants = [
  plant(-5.8, -0.2, 1.2),
  plant(5.8, -0.2, 1.1),
  plant(5.3, 4.8, 1.3),
  plant(-5.3, 4.8, 1.2),
];

const leafMat = M(0xb98a5e, { roughness: 0.5 });
const doorDecor = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
function entranceDoor(x, z) {
  const g = new THREE.Group();
  const postH = 2.7, half = 0.62;
  box(0.16, postH, 0.2, woodDark, -half, postH / 2, 0, g);
  box(0.16, postH, 0.2, woodDark, half, postH / 2, 0, g);
  add(new THREE.TorusGeometry(half + 0.08, 0.09, 10, 16, Math.PI), woodDark, 0, postH, 0, g);
  function leaf(hingeX, openSign) {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, 0, 0);
    box(half - 0.06, postH - 0.1, 0.05, leafMat, ((half - 0.06) / 2) * openSign, (postH - 0.1) / 2, 0, pivot, 0.02);
    add(new THREE.SphereGeometry(0.035, 10, 10), black, (half - 0.16) * openSign, 1.1, 0.04, pivot);
    pivot.rotation.y = openSign * 1.2;
    g.add(pivot);
  }
  leaf(-half + 0.02, 1);
  leaf(half - 0.02, -1);
  doorDecor.forEach((d) => { d.visible = false; g.add(d); });
  buildDoorDecor(postH, half);
  g.position.set(x, 0, z);
  g.rotation.y = Math.PI / 2;
  scene.add(g);
}
function buildDoorDecor(postH, half) {
  const gold = M(0xd4af37, { roughness: 0.2, metalness: 0.95 });
  const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
  const [, d2, d3, d4] = doorDecor;
  // level 2: neon arch, pink mat, brass push plates
  const neon = noShadow(add(new THREE.TorusGeometry(half + 0.24, 0.035, 8, 40, Math.PI), glow(0xff4fa3), 0, postH, 0.12, d2));
  for (const sx of [-1, 1]) noShadow(cyl(0.035, 0.035, postH, glow(0xff4fa3), sx * (half + 0.24), postH / 2, 0.12, d2, 8));
  noShadow(box(1.3, 0.03, 0.8, M(0xd4538a, { roughness: 0.9 }), 0, 0.02, 0.7, d2));
  for (const sx of [-1, 1]) box(0.08, 0.5, 0.04, gold, sx * 0.1, 1.1, 0.07, d2);
  // level 3: gold arch, columns with lanterns, red carpet
  add(new THREE.TorusGeometry(half + 0.18, 0.07, 10, 32, Math.PI), gold, 0, postH, 0.12, d3);
  add(new THREE.ConeGeometry(0.14, 0.3, 4), gold, 0, postH + half + 0.35, 0.12, d3);
  for (const sx of [-1, 1]) {
    const cx = sx * (half + 0.45);
    cyl(0.13, 0.15, 3.0, gold, cx, 1.5, 0.35, d3, 20);
    cyl(0.2, 0.2, 0.1, gold, cx, 0.05, 0.35, d3, 20);
    cyl(0.2, 0.2, 0.1, gold, cx, 3.0, 0.35, d3, 20);
    noShadow(add(new THREE.SphereGeometry(0.17, 14, 14), glow(0xffd27a), cx, 3.25, 0.35, d3));
  }
  box(1.2, 0.03, 2.2, M(0x9b1c2c, { roughness: 0.9 }), 0, 0.03, 1.3, d3);
  for (const sx of [-1, 1]) box(0.05, 0.035, 2.2, gold, sx * 0.62, 0.035, 1.3, d3);
  // level 4: royal double arch, crystal-lit pillars, violet carpet
  for (const r of [0.18, 0.34]) add(new THREE.TorusGeometry(half + r, 0.06, 10, 32, Math.PI), gold, 0, postH, 0.12, d4);
  add(new THREE.OctahedronGeometry(0.2), M(0x8fd8ff, { roughness: 0.1, emissive: 0x2a6a8a }), 0, postH + half + 0.55, 0.12, d4);
  for (const sx of [-1, 1]) {
    const cx = sx * (half + 0.55);
    cyl(0.16, 0.19, 3.2, M(0xf1ece2, { roughness: 0.25 }), cx, 1.6, 0.35, d4, 24);
    cyl(0.24, 0.24, 0.12, gold, cx, 0.06, 0.35, d4, 20);
    cyl(0.24, 0.24, 0.12, gold, cx, 3.2, 0.35, d4, 20);
    noShadow(add(new THREE.SphereGeometry(0.18, 14, 14), glow(0x9fe0ff), cx, 3.5, 0.35, d4));
  }
  box(1.3, 0.03, 2.6, M(0x4b2a8a, { roughness: 0.9 }), 0, 0.03, 1.5, d4);
  for (const sx of [-1, 1]) box(0.05, 0.035, 2.6, gold, sx * 0.67, 0.035, 1.5, d4);
  leafGold = gold;
}
let leafGold;
entranceDoor(5.85, 3.6);

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
  c.fillText(tr('Café Noir').toUpperCase(), 256, 82);
  const sign = noShadow(add(new THREE.PlaneGeometry(2.7, 0.84), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }), -5.9, 3.0, 4.5, extras));
  sign.rotation.y = Math.PI / 2;
  // floor lamp
  cyl(0.04, 0.04, 2.6, black, -5.3, 1.3, 2.9, extras, 8);
  noShadow(add(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), -5.3, 2.7, 2.9, extras));
  // bar stools along the left wall
  for (const z of [-0.2, 0.9]) {
    cyl(0.28, 0.28, 0.08, M(0xd4538a, { roughness: 0.5 }), -5.0, 0.8, z, extras, 20);
    cyl(0.04, 0.04, 0.8, metal, -5.0, 0.4, z, extras, 8);
  }
  // layout: long planters along both side walls, two tables stacked in a column
  const planter = (x, z0, z1) => {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    box(0.6, 0.5, len, woodDark, x, 0.25, zc, extras, 0.04);
    box(0.5, 0.04, len - 0.1, M(0x3a2a1c, { roughness: 1 }), x, 0.5, zc, extras);
    const n = Math.round(len / 0.9);
    for (let i = 0; i < n; i++) plant(x, z0 + (len / n) * (i + 0.5), 0.75, extras).position.y = 0.4;
  };
  planter(-5.65, -3.6, -1.2);
  planter(5.65, -3.6, -1.2);
  cafeTable(-3.4, 2.0, extras);
  cafeTable(-3.4, 4.5, extras);
}

function cafeTable(x, z, parent = scene) {
  const g = new THREE.Group();
  const gold = M(0xd4af37, { roughness: 0.2, metalness: 0.9 });
  const seat = M(0xe8d5a8, { roughness: 0.5 });
  cyl(0.55, 0.55, 0.05, top, 0, 1.0, 0, g, 32);
  cyl(0.06, 0.06, 0.9, gold, 0, 0.55, 0, g, 16);
  cyl(0.3, 0.3, 0.04, gold, 0, 0.08, 0, g, 24);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const chair = new THREE.Group();
    box(0.4, 0.06, 0.4, seat, 0, 0.5, 0, chair, 0.02);
    box(0.4, 0.5, 0.06, seat, 0, 0.75, -0.17, chair, 0.02);
    for (const lx of [-0.16, 0.16]) for (const lz of [-0.16, 0.16]) cyl(0.025, 0.025, 0.5, gold, lx, 0.25, lz, chair, 8);
    chair.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85);
    chair.rotation.y = Math.atan2(-chair.position.x, -chair.position.z);
    g.add(chair);
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

// ---------- level 4 ("Café Royal"): bigger hall + decor ----------
export const bigRoom = new THREE.Group();
bigRoom.visible = false;
scene.add(bigRoom);
for (let i = 0; i < 8; i++) {
  const m = M(0xd8d3c8, { roughness: 0.3 });
  floorMats.push(m);
  box(12, 0.16, 0.5, m, 0, -0.08, 6.5 + i * 0.5, bigRoom, 0.01);
}
box(0.3, WH, 4, wallMat, -6.15, WH / 2, 8.0, bigRoom);
export const extras4 = new THREE.Group();
extras4.visible = false;
scene.add(extras4);
{
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const c = cv.getContext('2d');
  c.font = 'bold 64px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = '#7fd0ff'; c.shadowBlur = 28;
  c.fillStyle = '#eaf6ff';
  c.fillText(tr('Café Royal').toUpperCase(), 256, 82);
  const sign = noShadow(add(new THREE.PlaneGeometry(2.7, 0.84), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }), -5.9, 3.0, 4.5, extras4));
  sign.rotation.y = Math.PI / 2;
  const goldM = M(0xd4af37, { roughness: 0.2, metalness: 0.9 });
  const marble = M(0xf1ece2, { roughness: 0.2 });
  const leaf = M(0x2f7a4a, { roughness: 0.8 });
  // marble pillars with gold capitals
  for (const [px, pz] of [[-5.5, 3.2], [-5.5, 10.0], [5.6, 6.2], [5.6, 10.0]]) {
    cyl(0.28, 0.32, WH - 0.4, marble, px, (WH - 0.4) / 2, pz, extras4, 24);
    cyl(0.4, 0.4, 0.15, goldM, px, 0.08, pz, extras4, 24);
    cyl(0.4, 0.4, 0.15, goldM, px, WH - 0.4, pz, extras4, 24);
  }
  // topiaries along the left wall
  for (const tz of [5.8, 7.4, 9.0]) {
    cyl(0.28, 0.2, 0.5, goldM, -5.4, 0.25, tz, extras4, 16);
    add(new THREE.SphereGeometry(0.42, 16, 14), leaf, -5.4, 0.95, tz, extras4);
  }
  // two staggered rows of tables, no lamps on the tables
  for (const tx of [-4.5, -1.5, 1.5, 4.5]) cafeTable(tx, 4.3, extras4);
  for (const tx of [-4.5, -1.5, 1.5, 4.5]) cafeTable(tx, 7.8, extras4);
  // royal runner and gold rug border
  const border = noShadow(add(new THREE.TorusGeometry(2.4, 0.05, 8, 64), goldM, 0, 0.05, 1.2, extras4));
  border.rotation.x = Math.PI / 2;
  noShadow(box(1.1, 0.02, 8.0, M(0x4b2a8a, { roughness: 0.95 }), 0, 0.03, 4.2, extras4, 0.005));
}

// ---------- level 3 ("Café Dourado") decor ----------
export const extras3 = new THREE.Group();
extras3.visible = false;
scene.add(extras3);
{
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const c = cv.getContext('2d');
  c.font = 'bold 60px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = '#e0a848'; c.shadowBlur = 28;
  c.fillStyle = '#fff3d6';
  c.fillText(tr('Café Dourado').toUpperCase(), 256, 82);
  const sign = noShadow(add(new THREE.PlaneGeometry(2.7, 0.84), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }), -5.9, 3.0, 4.5, extras3));
  sign.rotation.y = Math.PI / 2;
  // floor lamp
  cyl(0.04, 0.04, 2.6, black, -5.3, 1.3, 2.9, extras3, 8);
  noShadow(add(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }), -5.3, 2.7, 2.9, extras3));
  // bar stools along the left wall
  for (const z of [-0.2, 0.9]) {
    cyl(0.28, 0.28, 0.08, M(0xc9952e, { roughness: 0.5 }), -5.0, 0.8, z, extras3, 20);
    cyl(0.04, 0.04, 0.8, metal, -5.0, 0.4, z, extras3, 8);
  }
  // organized lounge: one row of tables at the front, each with its own lamp
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const brass = M(0xd4af37, { roughness: 0.2, metalness: 0.9 });
  const shade = M(0xe8d5a8, { roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide });
  const hang = (x, z, y, r) => {
    noShadow(cyl(0.012, 0.012, WH - y, brass, x, (WH + y) / 2, z, extras3, 6));
    noShadow(add(new THREE.CylinderGeometry(r * 0.55, r, r * 0.8, 24, 1, true), shade, x, y, z, extras3));
    noShadow(cyl(r * 0.5, r * 0.5, 0.03, brass, x, y + r * 0.4, z, extras3, 16));
    noShadow(add(new THREE.SphereGeometry(r * 0.38, 16, 16), lampMat, x, y - r * 0.25, z, extras3));
  };
  for (const tx of [-3.6, 0, 3.6]) {
    cafeTable(tx, 4.6, extras3);
    hang(tx, 4.6, 2.9, 0.42);
    const tl = new THREE.PointLight(0xffd08a, 3, 4, 2);
    tl.position.set(tx, 2.6, 4.6);
    extras3.add(tl);
  }
  // gold rug border
  const border = noShadow(add(new THREE.TorusGeometry(2.4, 0.04, 8, 64), brass, 0, 0.05, 1.2, extras3));
  border.rotation.x = Math.PI / 2;
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
  extras3.visible = n === 3;
  extras4.visible = n === 4;
  bigRoom.visible = n === 4;
  greenPlants.forEach((p) => (p.visible = n === 1));
  leafMat.color.setHex([0xb98a5e, 0x1f4a52, 0x5a1a22, 0x2a1850][n - 1]);
  doorDecor.forEach((d, i) => (d.visible = i === n - 1));
}
