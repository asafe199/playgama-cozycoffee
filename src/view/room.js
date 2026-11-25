import * as THREE from 'three';
import { scene, add, box, cyl, noShadow, M } from './scene.js';
import { wood, woodDark, metal, black, white } from './materials.js';
import { THEMES, COUNTER_X } from '../model/levels.js';
import { tr } from '../model/i18n.js';
import { makePerson, swayHair } from './people.js';
import { skinC, shirtC, hairC, pick } from '../model/state.js';

const diners = [];
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
// left-wall windows: level 1 is rectangular, levels 2-5 each get their own shape
const WIN_Z = [-2.2, 1.4], WIN_Y = 2.5;
const glassFace = new THREE.MeshBasicMaterial({ color: 0xcfeaf7, side: THREE.DoubleSide });
const WIN_SHAPES = [
  null,
  { // arched
    path: (d) => { const w = 1.4 - d, b = -1.2 + d, s = new THREE.Shape(); s.moveTo(-w, b); s.lineTo(w, b); s.lineTo(w, 0.2); s.absarc(0, 0.2, w, 0, Math.PI, false); s.lineTo(-w, b); return s; },
    bars: { v: [-1.08, 1.45], h: 1.28 },
  },
  { // round
    path: (d) => { const s = new THREE.Shape(); s.absarc(0, 0, 1.35 - d, 0, Math.PI * 2, false); return s; },
    bars: { v: [-1.22, 1.22], h: 1.22 },
  },
  { // hexagonal
    path: (d) => { const r = 1.5 - d * 1.15, s = new THREE.Shape(); for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r * 0.87); } s.closePath(); return s; },
    bars: { v: [-1.14, 1.14], h: 1.3 },
  },
  { // pointed gothic arch
    path: (d) => { const w = 1.2 - d, b = -1.3 + d, t = 1.7 - d * 1.4, s = new THREE.Shape(); s.moveTo(-w, b); s.lineTo(w, b); s.lineTo(w, 0.4); s.quadraticCurveTo(w, 1.2, 0, t); s.quadraticCurveTo(-w, 1.2, -w, 0.4); s.lineTo(-w, b); return s; },
    bars: { v: [-1.18, 1.5], h: 1.07 },
  },
];
const windowSets = WIN_SHAPES.map((def) => {
  const g = new THREE.Group();
  scene.add(g);
  for (const z of WIN_Z) {
    if (!def) {
      box(0.1, 2.5, 3.1, black, -6.0, WIN_Y, z, g, 0.02);
      noShadow(add(new THREE.PlaneGeometry(2.9, 2.3), glassFace, -5.93, WIN_Y, z, g)).rotation.y = Math.PI / 2;
      noShadow(box(0.04, 2.3, 0.05, black, -5.92, WIN_Y, z, g));
      noShadow(box(0.04, 0.05, 2.9, black, -5.92, WIN_Y, z, g));
      continue;
    }
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(def.path(0), { depth: 0.1, bevelEnabled: false }), black);
    frame.castShadow = true;
    frame.rotation.y = -Math.PI / 2;
    frame.position.set(-5.95, WIN_Y, z);
    g.add(frame);
    const pane = noShadow(new THREE.Mesh(new THREE.ShapeGeometry(def.path(0.12)), glassFace));
    pane.rotation.y = -Math.PI / 2;
    pane.position.set(-5.93, WIN_Y, z);
    g.add(pane);
    const [v0, v1] = def.bars.v;
    noShadow(box(0.04, v1 - v0, 0.05, black, -5.92, WIN_Y + (v0 + v1) / 2, z, g));
    noShadow(box(0.04, 0.05, def.bars.h * 2, black, -5.92, WIN_Y, z, g));
  }
  return g;
});
const baseRug = add(new THREE.CylinderGeometry(2.4, 2.4, 0.03, 48), rugMat, 0, 0.02, 1.2);


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
const doorDecor = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
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
  doorGroup = g;
}
let doorGroup;
function buildDoorDecor(postH, half) {
  const gold = M(0xd4af37, { roughness: 0.2, metalness: 0.95 });
  const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
  const [, d2, d3, d4, d5] = doorDecor;
  // level 2: brass push plates
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
  // level 5: triple gold arch, ruby crown, crimson carpet
  for (const r of [0.16, 0.3, 0.44]) add(new THREE.TorusGeometry(half + r, 0.06, 10, 32, Math.PI), gold, 0, postH, 0.12, d5);
  add(new THREE.OctahedronGeometry(0.22), M(0xd0183a, { roughness: 0.1, emissive: 0x6a0a1c }), 0, postH + half + 0.7, 0.12, d5);
  for (const sx of [-1, 1]) {
    const cx = sx * (half + 0.55);
    cyl(0.15, 0.17, 3.4, M(0xf1ece2, { roughness: 0.2 }), cx, 1.7, 0.35, d5, 20);
    cyl(0.26, 0.26, 0.12, gold, cx, 0.06, 0.35, d5, 20);
    cyl(0.26, 0.26, 0.12, gold, cx, 3.4, 0.35, d5, 20);
    noShadow(add(new THREE.SphereGeometry(0.2, 14, 14), glow(0xff9ab0), cx, 3.72, 0.35, d5));
  }
  box(1.4, 0.03, 2.8, M(0x8a1030, { roughness: 0.9 }), 0, 0.03, 1.6, d5);
  for (const sx of [-1, 1]) box(0.05, 0.035, 2.8, gold, sx * 0.72, 0.035, 1.6, d5);
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

function addDiner(chair, tableParent) {
  const p = makePerson(pick(shirtC), pick(skinC), pick(hairC), false, Math.random() < 0.5);
  p.position.y = -0.12;
  p.scale.setScalar(0.92);
  const [lL, lR] = p.userData.legs;
  lL.rotation.x = lR.rotation.x = -1.45;
  const [aL, aR] = p.userData.arms;
  const cup = new THREE.Group();
  cyl(0.07, 0.055, 0.12, white, 0, -0.2, 0.1, cup, 12);
  cyl(0.06, 0.06, 0.02, M(0x5a3825), 0, -0.14, 0.1, cup, 12);
  aR.userData.fore.add(cup);
  chair.add(p);
  diners.push({ p, head: p.userData.head, aL, aR, root: tableParent, ph: Math.random() * 6.28, rate: 0.6 + Math.random() * 0.5, rest: 2 + Math.random() * 3 });
}

export function animateDiners(t) {
  for (const d of diners) {
    if (!d.root.visible) continue;
    // cycle: rest, lift cup (shoulder + elbow), sip with head tilted back, set down
    const c = (t * d.rate + d.ph) % (d.rest + 3.2);
    const lift = c > d.rest ? Math.sin(((c - d.rest) / 3.2) * Math.PI) : 0;
    const breathe = Math.sin(t * 1.6 + d.ph) * 0.02;
    swayHair(d.p, false, t);
    const rot = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * 0.15; };
    rot(d.aR, 'x', -0.55 - lift * 0.5 + breathe);
    rot(d.aR.userData.fore, 'x', -1.0 - lift * 1.15);
    rot(d.aR, 'z', -0.05);
    // free hand rests on the table, with a small tap
    rot(d.aL, 'x', -0.7 + Math.sin(t * 2.2 + d.ph) * 0.04);
    rot(d.aL.userData.fore, 'x', -0.9 + Math.max(0, Math.sin(t * 3 + d.ph * 2)) * 0.12);
    // head: tilts back while sipping, otherwise glances around slowly and nods
    const glance = Math.sin(t * 0.5 + d.ph) * 0.35 * (1 - lift);
    rot(d.head, 'y', glance);
    rot(d.head, 'x', -lift * 0.35 + Math.sin(t * 0.9 + d.ph * 3) * 0.05);
    rot(d.head, 'z', Math.sin(t * 0.7 + d.ph) * 0.05);
    rot(d.p, 'x', -lift * 0.08);
  }
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
    const diner = Math.random() < 0.45;
    if (diner) addDiner(chair, parent);
    if (diner || Math.random() < 0.3) {
      const cx = Math.cos(a) * 0.3, cz = Math.sin(a) * 0.3;
      cyl(0.13, 0.1, 0.015, white, cx, 1.03, cz, g, 16);
      cyl(0.06, 0.05, 0.1, white, cx, 1.09, cz, g, 12);
      cyl(0.052, 0.052, 0.01, M(0x5a3825), cx, 1.14, cz, g, 12);
      add(new THREE.TorusGeometry(0.035, 0.012, 6, 10), white, cx + 0.065, 1.09, cz, g);
    }
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

// ---------- level 4 ("Café Royal"): bigger hall + decor ----------
export const bigRoom = new THREE.Group();
bigRoom.visible = false;
scene.add(bigRoom);
// level 4 widens the hall to the right: floor, back wall and kitchen counter
for (let i = 0; i < 32; i++) {
  const m = M(0xd8d3c8, { roughness: 0.3 });
  floorMats.push(m);
  box(3.6, 0.16, 0.5, m, 7.8, -0.08, -5.75 + i * 0.5, bigRoom, 0.01);
}
box(3.6, 1.4, 0.3, brick, 7.8, 0.7, -6.15, bigRoom);
box(3.6, WH - 1.4, 0.3, wallMat, 7.8, 1.4 + (WH - 1.4) / 2, -6.15, bigRoom);
box(3.6, 1.2, 1.2, woodDark, 7.2, 0.6, -5.3, bigRoom);
box(3.6, 0.12, 1.4, top, 7.2, 1.26, -5.3, bigRoom);
for (let i = 0; i < 8; i++) {
  const m = M(0xd8d3c8, { roughness: 0.3 });
  floorMats.push(m);
  box(12, 0.16, 0.5, m, 0, -0.08, 6.25 + i * 0.5, bigRoom, 0.01);
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
  sign.scale.setScalar(1.25);
  const goldM = M(0xd4af37, { roughness: 0.2, metalness: 0.9 });
  const leaf = M(0x2f7a4a, { roughness: 0.8 });
  // topiaries along the left wall
  for (const tz of [5.8, 7.4, 9.0]) {
    cyl(0.28, 0.2, 0.5, goldM, -5.4, 0.25, tz, extras4, 16);
    add(new THREE.SphereGeometry(0.42, 16, 14), leaf, -5.4, 0.95, tz, extras4);
  }
  // two staggered rows of tables, no lamps on the tables
  for (const tx of [-3, 0, 3, 6]) cafeTable(tx, 4.3, extras4);
  for (const tx of [-3, 0, 3, 6]) cafeTable(tx, 7.8, extras4);
  // royal runner and gold rug border
  const border = noShadow(add(new THREE.TorusGeometry(2.4, 0.05, 8, 64), goldM, 1.5, 0.05, 1.2, extras4));
  border.rotation.x = Math.PI / 2;
  noShadow(box(1.1, 0.02, 4.6, M(0x4b2a8a, { roughness: 0.95 }), 1.5, 0.03, 5.9, extras4, 0.005));
}

// ---------- level 5 ("Café Imperial"): even bigger hall + decor ----------
export const bigRoom5 = new THREE.Group();
bigRoom5.visible = false;
scene.add(bigRoom5);
for (let i = 0; i < 32; i++) {
  const m = M(0xe7dcd2, { roughness: 0.3 });
  floorMats.push(m);
  box(2.4, 0.16, 0.5, m, 10.8, -0.08, -5.75 + i * 0.5, bigRoom5, 0.01);
}
for (let i = 0; i < 6; i++) {
  const m = M(0xe7dcd2, { roughness: 0.3 });
  floorMats.push(m);
  box(18, 0.16, 0.5, m, 3, -0.08, 10.75 + i * 0.5, bigRoom5, 0.01);
}
box(2.4, 1.4, 0.3, brick, 10.8, 0.7, -6.15, bigRoom5);
box(2.4, WH - 1.4, 0.3, wallMat, 10.8, 1.4 + (WH - 1.4) / 2, -6.15, bigRoom5);
box(2.4, 1.2, 1.2, woodDark, 10.8, 0.6, -5.3, bigRoom5);
box(2.4, 0.12, 1.4, top, 10.8, 1.26, -5.3, bigRoom5);
box(0.3, WH, 3, wallMat, -6.15, WH / 2, 11.5, bigRoom5);
export const extras5 = new THREE.Group();
extras5.visible = false;
scene.add(extras5);
{
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const c = cv.getContext('2d');
  c.font = 'bold 60px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = '#ff9ab0'; c.shadowBlur = 28;
  c.fillStyle = '#fff0f3';
  c.fillText(tr('Café Imperial').toUpperCase(), 256, 82);
  const sign = noShadow(add(new THREE.PlaneGeometry(2.7, 0.84), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }), -5.9, 2.5, 5.6, extras5));
  sign.rotation.y = Math.PI / 2;
  sign.scale.setScalar(1.25);
  const goldM = M(0xd4af37, { roughness: 0.2, metalness: 0.9 });
  const marble = M(0xf6f0e8, { roughness: 0.2 });
  const crystal = new THREE.MeshBasicMaterial({ color: 0xffe6ee });
  // marble pillars on both sides of the hall
  for (const [px, pz] of [[-5.5, 3.2], [-5.5, 8.0], [-5.5, 12.6], [10.6, 8.0], [10.6, 12.6], [6.4, 12.6]]) {
    cyl(0.28, 0.32, WH - 0.4, marble, px, (WH - 0.4) / 2, pz, extras5, 24);
    cyl(0.4, 0.4, 0.15, goldM, px, 0.08, pz, extras5, 24);
    cyl(0.4, 0.4, 0.15, goldM, px, WH - 0.4, pz, extras5, 24);
  }
  // crystal chandeliers
  const chandelier = (x, z) => {
    noShadow(cyl(0.012, 0.012, 1.4, goldM, x, WH - 0.7, z, extras5, 6));
    const ring = noShadow(add(new THREE.TorusGeometry(0.6, 0.04, 8, 32), goldM, x, WH - 1.45, z, extras5));
    ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      noShadow(add(new THREE.OctahedronGeometry(0.07), crystal, x + Math.cos(a) * 0.6, WH - 1.65, z + Math.sin(a) * 0.6, extras5));
    }
    noShadow(add(new THREE.SphereGeometry(0.14, 12, 12), crystal, x, WH - 1.45, z, extras5));
  };
  for (const [x, z] of [[-3.55, 6], [2.45, 6], [8.45, 6], [-0.55, 10], [5.45, 10]]) chandelier(x, z);
  // christmas tree at the end of the hall
  {
    const tx = 2.45, tz = 12.6;
    const green = M(0x1f6b3a, { roughness: 0.9 });
    cyl(1.0, 1.1, 0.3, marble, tx, 0.15, tz, extras5, 24);
    cyl(0.16, 0.2, 0.5, M(0x6b4226), tx, 0.55, tz, extras5, 10);
    const bulbs = [0xd0183a, 0xffd34d, 0x4aa3ff, 0xf6f0e8];
    [[1.0, 1.1, 0.8], [0.8, 1.0, 1.65], [0.6, 0.9, 2.4], [0.4, 0.8, 3.05]].forEach(([r, h, y], k) => {
      add(new THREE.ConeGeometry(r, h, 16), green, tx, y, tz, extras5);
      for (let n = 0; n < 6; n++) {
        const a = (n / 6) * Math.PI * 2 + k;
        const rr = r * 0.62;
        add(new THREE.SphereGeometry(0.07, 8, 8), M(bulbs[(n + k) % 4], { roughness: 0.3, emissive: 0x222222 }), tx + Math.cos(a) * rr, y - h * 0.15, tz + Math.sin(a) * rr, extras5);
      }
    });
    add(new THREE.OctahedronGeometry(0.2), goldM, tx, 3.6, tz, extras5);
    for (const [gx, gz, c] of [[-0.6, 0.5, 0xc0152f], [0.55, 0.6, 0xffd34d], [0.1, 0.85, 0x4aa3ff]]) {
      box(0.35, 0.3, 0.35, M(c), tx + gx, 0.45, tz + gz, extras5, 0.02);
    }
  }
  // christmas touches: candy-cane pillar stripes, garland + lights on the left wall, baubles, gifts, mini trees
  {
    const red = M(0xc0152f, { roughness: 0.5 });
    const white = M(0xfafafa, { roughness: 0.5 });
    const pine = M(0x1f6b3a, { roughness: 0.9 });
    const lightCols = [0xff3b3b, 0xffd34d, 0x4aa3ff, 0x6bdc7a];
    for (const [px, pz] of [[-5.5, 3.2], [-5.5, 8.0], [-5.5, 12.6], [10.6, 8.0], [10.6, 12.6], [6.4, 12.6]]) {
      for (let y = 0.7; y < WH - 0.8; y += 0.5) cyl(0.3, 0.3, 0.2, red, px, y, pz, extras5, 20);
      add(new THREE.TorusGeometry(0.3, 0.07, 8, 20), pine, px, WH - 0.55, pz, extras5).rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(0.11, 10, 10), red, px + 0.3, WH - 0.55, pz, extras5);
    }
    for (let z = -4.6; z <= 13.2; z += 0.45) {
      const y = 3.75 + Math.sin(((z + 4.6) / 3.0) * Math.PI) * -0.22;
      noShadow(add(new THREE.SphereGeometry(0.17, 8, 8), pine, -5.85, y, z, extras5));
      noShadow(add(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: lightCols[Math.round((z + 4.6) / 0.45) % 4] }), -5.78, y - 0.17, z + 0.1, extras5));
    }
    for (let z = -4.2; z <= 12.5; z += 3.0) {
      noShadow(add(new THREE.SphereGeometry(0.2, 8, 8), red, -5.8, 3.7, z, extras5));
      noShadow(box(0.08, 0.5, 0.22, red, -5.78, 3.35, z - 0.12, extras5));
      noShadow(box(0.08, 0.5, 0.22, red, -5.78, 3.35, z + 0.12, extras5));
    }
    for (let x = -4.8; x <= 11.2; x += 0.45) {
      const y = 4.0 + Math.sin(((x + 4.8) / 3.0) * Math.PI) * -0.2;
      noShadow(add(new THREE.SphereGeometry(0.15, 8, 8), pine, x, y, -5.9, extras5));
      noShadow(add(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: lightCols[Math.round((x + 4.8) / 0.45) % 4] }), x, y - 0.16, -5.8, extras5));
    }
    for (const [x, z] of [[-3.55, 6], [2.45, 6], [8.45, 6], [-0.55, 10], [5.45, 10]]) {
      for (const [i, c] of [[0, 0xc0152f], [1, 0xffd34d], [2, 0x4aa3ff]]) {
        const a = (i / 3) * Math.PI * 2;
        noShadow(add(new THREE.SphereGeometry(0.09, 10, 10), M(c, { roughness: 0.2, metalness: 0.5 }), x + Math.cos(a) * 0.35, WH - 1.95, z + Math.sin(a) * 0.35, extras5));
      }
    }
    for (const [x, z] of [[-5.0, 1.2], [10.6, 11.0], [-1.0, 12.9]]) {
      cyl(0.1, 0.12, 0.2, M(0x6b4226), x, 0.1, z, extras5, 8);
      [[0.45, 0.6, 0.45], [0.35, 0.55, 0.9], [0.22, 0.5, 1.3]].forEach(([r, h, y]) => add(new THREE.ConeGeometry(r, h, 12), pine, x, y, z, extras5));
      add(new THREE.OctahedronGeometry(0.09), goldM, x, 1.65, z, extras5);
      add(new THREE.SphereGeometry(0.06, 8, 8), red, x + 0.18, 0.75, z + 0.1, extras5);
      add(new THREE.SphereGeometry(0.06, 8, 8), M(0xffd34d), x - 0.15, 1.15, z + 0.12, extras5);
    }
    for (const [x, z, c] of [[3.9, 12.9, 0xc0152f], [1.2, 13.1, 0x2d8f4e], [4.5, 12.3, 0xffd34d]]) {
      box(0.4, 0.35, 0.4, M(c), x, 0.18, z, extras5, 0.02);
      box(0.42, 0.06, 0.08, white, x, 0.36, z, extras5);
      box(0.08, 0.06, 0.42, white, x, 0.36, z, extras5);
    }
    for (const [x, z] of [[0.2, 3.4], [4.7, 3.4], [-3.0, 8.2], [8.2, 8.4]]) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        add(new THREE.SphereGeometry(0.09, 8, 8), red, x + Math.cos(a) * 0.12, 0.62, z + Math.sin(a) * 0.12, extras5).scale.y = 0.4;
      }
    }
  }
  // gold urns with roses along the right side
  for (const tz of [-0.6, 1.0]) {
    cyl(0.22, 0.28, 0.6, goldM, 11.2, 0.3, tz, extras5, 16);
    add(new THREE.SphereGeometry(0.34, 14, 12), M(0xc0152f, { roughness: 0.7 }), 11.2, 0.85, tz, extras5);
  }
  // tables: two sparse staggered rows
  for (const tx of [-3.55, 2.45, 8.45]) cafeTable(tx, 6.0, extras5);
  for (const tx of [-0.55, 5.45]) cafeTable(tx, 10.0, extras5);
  // crimson runner with gold borders and rug ring
  const border = noShadow(add(new THREE.TorusGeometry(2.4, 0.05, 8, 64), goldM, 2.45, 0.05, 1.2, extras5));
  border.rotation.x = Math.PI / 2;
  noShadow(box(1.3, 0.02, 7.65, M(0x8a1030, { roughness: 0.95 }), 2.45, 0.03, 7.425, extras5, 0.005));
  for (const sx of [-1, 1]) noShadow(box(0.05, 0.025, 7.65, goldM, 2.45 + sx * 0.67, 0.035, 7.425, extras5));
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
  baseRug.position.x = COUNTER_X[n - 1];
  windowSets.forEach((g, i) => (g.visible = i === n - 1));
  extras.visible = n === 2;
  extras3.visible = n === 3;
  extras4.visible = n === 4;
  extras5.visible = n === 5;
  bigRoom.visible = n >= 4;
  bigRoom5.visible = n >= 5;
  doorGroup.position.x = n >= 5 ? 11.65 : n >= 4 ? 9.35 : 5.85;
  greenPlants.forEach((p) => (p.visible = n === 1));
  leafMat.color.setHex([0xb98a5e, 0x1f4a52, 0x5a1a22, 0x2a1850, 0x6a1020][n - 1]);
  doorDecor.forEach((d, i) => (d.visible = i === n - 1));
}
