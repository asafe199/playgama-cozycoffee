import * as THREE from 'three';
import { scene, add, box, cyl, noShadow, M } from './scene.js';
import { wood, woodDark, metal, black, white } from './materials.js';
import { makeTag } from './hud.js';
import { counterBase, counterTop } from './room.js';
import { LEVELS, SLOT_SETS } from '../model/levels.js';
import { lang } from '../model/i18n.js';

const SZ = -5.3;

export const stations = {};
function makeStation(key, x, z, hw, label) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.userData.station = key;
  scene.add(g);
  const ring = noShadow(add(new THREE.PlaneGeometry(Math.max(1.2, hw * 2), 1), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.0 }), x, 0.03, key === 'serve' ? -2.4 : z + 1.4));
  ring.rotation.x = -Math.PI / 2;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x4cd964 }));
  bar.position.set(x, 2.6, z + 0.2);
  bar.visible = false;
  scene.add(bar);
  stations[key] = { key, g, pos: new THREE.Vector3(x, 0, z), hw, label, ring, bar, data: {} };
  return stations[key];
}

// cup stack
const cupSt = makeStation('cups', -4.3, SZ, 0.5, 'Copos');
for (let i = 0; i < 4; i++) cyl(0.17, 0.12, 0.28, white, 0, 1.46 + i * 0.28, 0, cupSt.g, 16);
box(0.5, 0.06, 0.5, black, 0, 1.35, 0, cupSt.g);

// espresso machine
export const machineSt = makeStation('espresso', -2.5, SZ, 0.8, 'Máquina de espresso');
const accent = M(0xc0392b, { roughness: 0.3, metalness: 0.5 });
box(1.5, 0.75, 0.75, metal, 0, 1.7, 0, machineSt.g, 0.06);
box(1.56, 0.12, 0.8, accent, 0, 2.12, 0, machineSt.g, 0.05);
box(1.2, 0.08, 0.5, black, 0, 1.38, 0.1, machineSt.g);
for (const gx of [-0.4, 0.4]) {
  cyl(0.11, 0.11, 0.12, black, gx, 1.82, 0.42, machineSt.g, 16);
  box(0.06, 0.06, 0.3, black, gx, 1.82, 0.58, machineSt.g);
}
machineSt.cupSlot = new THREE.Group();
machineSt.cupSlot.position.set(0, 1.4, 0.42);
machineSt.g.add(machineSt.cupSlot);
machineSt.bar.position.y = 2.6;

// milk steamer
export const milkSt = makeStation('milk', -0.7, SZ, 0.8, 'Leite');
box(0.5, 0.7, 0.5, M(0xf2f2f2, { roughness: 0.4, metalness: 0.3 }), 0, 1.65, 0, milkSt.g, 0.06);
cyl(0.2, 0.17, 0.35, metal, 0, 2.15, 0, milkSt.g, 20);
cyl(0.2, 0.2, 0.04, M(0xffffff), 0, 2.33, 0, milkSt.g, 20);
milkSt.cupSlot = new THREE.Group();
milkSt.cupSlot.position.set(0.5, 1.4, 0.15);
milkSt.g.add(milkSt.cupSlot);
milkSt.bar.position.y = 2.85;
milkSt.bar.position.z += 0.6;

// dough crate
const doughSt = makeStation('dough', 1.1, SZ, 0.6, 'Massa');
box(0.95, 0.5, 0.7, wood, 0, 1.55, 0, doughSt.g, 0.04);
for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.17, 12, 10), M(0xefd9a8, { roughness: 1 }), -0.25 + i * 0.25, 1.85, 0, doughSt.g).scale.y = 0.7;

// oven
export const ovenSt = makeStation('oven', 3.0, SZ, 0.8, 'Forno');
box(1.5, 1.0, 0.9, black, 0, 1.8, 0, ovenSt.g, 0.07);
export const ovenGlass = box(1.1, 0.6, 0.05, M(0x6b4a33, { roughness: 0.2, metalness: 0.3, emissive: 0x000000 }), 0, 1.8, 0.46, ovenSt.g, 0.02);
ovenSt.cupSlot = new THREE.Group();
ovenSt.cupSlot.position.set(0, 1.6, 0.2);
ovenSt.g.add(ovenSt.cupSlot);
ovenSt.bar.position.y = 2.6;

// serve counter marker
const serveSt = makeStation('serve', 0, -1.2, 3.4, 'Balcão de entrega');
const serveGlow = box(7.0, 0.02, 0.5, M(0xffd54a, { roughness: 0.6, emissive: 0x332600 }), 0, 1.02, 0, serveSt.g, 0.01);
const SERVE_HW = 3.4;
const SERVE_SCALE = 1.35;
// plates marking where to leave the order (one per customer spot)
const plateGroups = SLOT_SETS.map((xs) => {
  const g = new THREE.Group();
  for (const px of xs) {
    cyl(0.36, 0.3, 0.04, white, px, 1.04, 0, g, 28);
    cyl(0.24, 0.24, 0.045, M(0xe8e1d6, { roughness: 0.5 }), px, 1.045, 0, g, 28);
  }
  serveSt.g.add(g);
  return g;
});

// station name tags so every appliance is identifiable
const TAG_Y = 3.4;
const TAGS = [
  [cupSt, 'Copos', 'Cups', TAG_Y, 0], [machineSt, 'Espresso', 'Espresso', TAG_Y, 0], [milkSt, 'Leite', 'Milk', TAG_Y, 0],
  [doughSt, 'Massa', 'Dough', TAG_Y, 0], [ovenSt, 'Forno', 'Oven', TAG_Y, 0],
];
for (const [s, pt, en, y, dx] of TAGS) {
  const tag = makeTag(lang === 'pt' ? pt : en);
  tag.position.set(s.pos.x + dx, y, s.pos.z);
  scene.add(tag);
}

// ---------- level 2: fancy machines + chocolate station ----------
const gold = M(0xd4af37, { roughness: 0.22, metalness: 0.95 });
const teal = M(0x1f8a8a, { roughness: 0.25, metalness: 0.6 });
const glass = new THREE.MeshStandardMaterial({ color: 0xbfe6f0, transparent: true, opacity: 0.35, roughness: 0.05 });

// ---------- level 3: deluxe "Café Dourado" machines ----------
const roseGold = M(0xb76e79, { roughness: 0.2, metalness: 0.95 });
const champagne = M(0xe8d5a8, { roughness: 0.18, metalness: 0.85 });
const marble = M(0xf0ece0, { roughness: 0.12, metalness: 0.05 });
const marbleDark = M(0x14100c, { roughness: 0.2, metalness: 0.3 });
const warmGlass = new THREE.MeshStandardMaterial({ color: 0xffe3b0, transparent: true, opacity: 0.35, roughness: 0.05 });
const amberGlow = M(0xffb347, { roughness: 0.3, emissive: 0xff8c1a, emissiveIntensity: 0.9 });
export const chocoSt = makeStation('choco', 4.4, SZ, 0.4, 'Chocolate');
chocoSt.cupSlot = new THREE.Group();
chocoSt.cupSlot.position.set(0, 1.4, 0.5);
chocoSt.g.add(chocoSt.cupSlot);
chocoSt.bar.position.y = 2.8;
chocoSt.hidden = true;
const disc = (mat, r, h, y, parent) => cyl(r, r, h, mat, 0, y, 0, parent, 28);
function buildDipStation(g, toppingColor, toppingEmissive) {
  const topping = M(toppingColor, { roughness: 0.25, emissive: toppingEmissive });
  disc(gold, 0.36, 0.1, 1.42, g); disc(topping, 0.3, 0.12, 1.55, g);
  disc(gold, 0.24, 0.08, 1.8, g); disc(topping, 0.2, 0.1, 1.9, g);
  cyl(0.05, 0.05, 0.5, gold, 0, 1.7, 0, g, 10);
  add(new THREE.SphereGeometry(0.12, 14, 12), topping, 0, 2.2, 0, g);
}
buildDipStation(chocoSt.g, 0x3a1a0c, 0x1a0a04);
chocoSt.g.visible = false;

// honey station (level 3 only)
export const honeySt = makeStation('honey', -5.3, SZ, 0.35, 'Mel');
honeySt.cupSlot = new THREE.Group();
honeySt.cupSlot.position.set(0, 1.4, 0.5);
honeySt.g.add(honeySt.cupSlot);
honeySt.bar.position.y = 2.8;
honeySt.hidden = true;
buildDipStation(honeySt.g, 0xd98c1f, 0x7a4a0a);
honeySt.g.visible = false;

function dial(parent, x, y, z) {
  const r = cyl(0.17, 0.17, 0.05, gold, x, y, z, parent, 24); r.rotation.x = Math.PI / 2;
  const f = cyl(0.13, 0.13, 0.06, white, x, y, z + 0.005, parent, 24); f.rotation.x = Math.PI / 2;
  box(0.02, 0.1, 0.02, black, x + 0.03, y + 0.03, z + 0.04, parent);
}
const fancyBuilders = {
  cups(st, g) {
    box(0.7, 0.1, 0.7, gold, 0, 1.4, 0, g, 0.03);
    cyl(0.33, 0.33, 0.9, glass, 0, 1.9, 0, g, 24);
    cyl(0.36, 0.36, 0.06, gold, 0, 2.38, 0, g, 24);
    for (let i = 0; i < 4; i++) cyl(0.17, 0.12, 0.28, white, 0, 1.58 + i * 0.28, 0, g, 16);
  },
  espresso(st, g) {
    box(1.5, 0.85, 0.75, metal, 0, 1.78, 0, g, 0.08);
    box(1.56, 0.1, 0.8, gold, 0, 2.24, 0, g, 0.04);
    box(1.56, 0.08, 0.8, gold, 0, 1.38, 0, g, 0.03);
    for (const x of [-0.78, 0.78]) box(0.08, 0.85, 0.7, teal, x, 1.78, 0, g, 0.03);
    dial(g, 0, 2.0, 0.39);
    for (const gx of [-0.45, 0.45]) {
      cyl(0.12, 0.12, 0.14, gold, gx, 1.76, 0.42, g, 16);
      box(0.06, 0.06, 0.3, gold, gx, 1.76, 0.6, g);
    }
    box(1.1, 0.05, 0.45, gold, 0, 1.4, 0.12, g);
    for (const x of [-0.5, 0, 0.5]) cyl(0.09, 0.07, 0.12, white, x, 2.36, 0, g, 12);
  },
  milk(st, g) {
    cyl(0.28, 0.28, 0.8, metal, 0, 1.8, 0, g, 24);
    cyl(0.3, 0.3, 0.06, gold, 0, 1.5, 0, g, 24);
    cyl(0.3, 0.3, 0.06, gold, 0, 2.18, 0, g, 24);
    add(new THREE.SphereGeometry(0.28, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), teal, 0, 2.2, 0, g);
    cyl(0.03, 0.03, 0.6, gold, 0.3, 1.8, 0.2, g, 8);
    box(0.2, 0.04, 0.04, gold, 0.4, 1.5, 0.2, g);
    dial(g, 0, 1.95, 0.29);
  },
  dough(st, g) {
    box(1.1, 0.12, 0.8, M(0xf2efe9, { roughness: 0.15, metalness: 0.1 }), 0, 1.45, 0, g, 0.03);
    box(1.14, 0.06, 0.84, gold, 0, 1.38, 0, g, 0.02);
    cyl(0.32, 0.22, 0.3, M(0xb87333, { roughness: 0.3, metalness: 0.9 }), -0.25, 1.66, 0, g, 24);
    for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.17, 12, 10), M(0xefd9a8, { roughness: 1 }), -0.25 + (i - 1) * 0.15, 1.9 + (i % 2) * 0.1, 0, g).scale.y = 0.75;
    cyl(0.07, 0.07, 0.7, woodDark, 0.3, 1.58, 0.15, g, 10).rotation.z = Math.PI / 2;
  },
  oven(st, g) {
    box(1.5, 1.05, 0.9, M(0x1b3a3a, { roughness: 0.3, metalness: 0.6 }), 0, 1.82, 0, g, 0.07);
    box(1.56, 0.08, 0.95, gold, 0, 2.36, 0, g, 0.03);
    box(1.56, 0.08, 0.95, gold, 0, 1.3, 0, g, 0.03);
    box(1.1, 0.6, 0.05, M(0xff9a3c, { roughness: 0.2, emissive: 0xff6a00, emissiveIntensity: 0.9 }), 0, 1.8, 0.46, g, 0.02);
    cyl(0.03, 0.03, 1.0, gold, 0, 2.0, 0.55, g, 8).rotation.z = Math.PI / 2;
    for (const x of [-0.5, 0, 0.5]) { const k = cyl(0.07, 0.07, 0.06, gold, x, 2.2, 0.46, g, 14); k.rotation.x = Math.PI / 2; }
  },
};
const copper = M(0xb87333, { roughness: 0.25, metalness: 0.95 });
const dome = (r, mat, x, y, z, g) => add(new THREE.SphereGeometry(r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, g);
const deluxeBuilders = {
  cups(st, g) {
    cyl(0.4, 0.44, 0.1, roseGold, 0, 1.4, 0, g, 32);
    cyl(0.36, 0.36, 0.02, champagne, 0, 1.47, 0, g, 32);
    cyl(0.33, 0.33, 0.9, warmGlass, 0, 1.95, 0, g, 24);
    dome(0.34, warmGlass, 0, 2.4, 0, g);
    cyl(0.03, 0.03, 0.12, roseGold, 0, 2.77, 0, g, 8);
    add(new THREE.SphereGeometry(0.06, 12, 10), amberGlow, 0, 2.85, 0, g);
    for (let i = 0; i < 4; i++) cyl(0.17, 0.12, 0.28, white, 0, 1.62 + i * 0.28, 0, g, 16);
  },
  espresso(st, g) {
    box(1.6, 0.85, 0.8, marble, 0, 1.78, 0, g, 0.08);
    box(1.66, 0.1, 0.85, roseGold, 0, 1.36, 0, g, 0.03);
    box(1.66, 0.1, 0.85, roseGold, 0, 2.24, 0, g, 0.04);
    dome(0.5, copper, 0, 2.28, -0.05, g).scale.set(1.3, 0.9, 0.8);
    cyl(0.04, 0.04, 0.16, roseGold, 0, 2.72, -0.05, g, 8);
    add(new THREE.SphereGeometry(0.07, 12, 10), amberGlow, 0, 2.84, -0.05, g);
    for (const x of [-0.85, 0.85]) {
      cyl(0.09, 0.09, 0.85, champagne, x, 1.78, 0, g, 16);
      cyl(0.1, 0.1, 0.08, roseGold, x, 2.24, 0, g, 16);
    }
    dial(g, -0.45, 2.02, 0.41); dial(g, 0.45, 2.02, 0.41);
    for (const gx of [-0.3, 0.3]) {
      cyl(0.12, 0.12, 0.14, roseGold, gx, 1.74, 0.44, g, 16);
      box(0.06, 0.06, 0.3, roseGold, gx, 1.74, 0.62, g);
    }
    box(1.2, 0.05, 0.5, roseGold, 0, 1.4, 0.14, g);
    box(0.5, 0.06, 0.04, amberGlow, 0, 2.06, 0.42, g);
    for (const x of [-0.5, 0, 0.5]) cyl(0.09, 0.07, 0.12, marble, x, 2.42, 0.2, g, 12);
  },
  milk(st, g) {
    cyl(0.3, 0.3, 0.9, marble, 0, 1.8, 0, g, 28);
    cyl(0.32, 0.32, 0.07, roseGold, 0, 1.38, 0, g, 28);
    cyl(0.32, 0.32, 0.07, roseGold, 0, 2.25, 0, g, 28);
    box(0.1, 0.55, 0.04, amberGlow, 0, 1.85, 0.3, g);
    dome(0.3, copper, 0, 2.28, 0, g);
    cyl(0.025, 0.025, 0.2, roseGold, 0, 2.62, 0, g, 8);
    add(new THREE.SphereGeometry(0.06, 12, 10), amberGlow, 0, 2.74, 0, g);
    cyl(0.03, 0.03, 0.7, roseGold, 0.34, 1.85, 0.1, g, 8);
    box(0.25, 0.04, 0.04, roseGold, 0.44, 1.5, 0.1, g);
    dial(g, 0, 2.05, 0.31);
  },
  dough(st, g) {
    box(1.2, 0.12, 0.85, marble, 0, 1.45, 0, g, 0.03);
    box(1.24, 0.06, 0.9, roseGold, 0, 1.38, 0, g, 0.02);
    cyl(0.34, 0.24, 0.3, champagne, -0.25, 1.66, 0, g, 24);
    for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.17, 12, 10), M(0xefd9a8, { roughness: 1 }), -0.25 + (i - 1) * 0.15, 1.9 + (i % 2) * 0.1, 0, g).scale.y = 0.75;
    dome(0.42, warmGlass, -0.25, 1.8, 0, g);
    add(new THREE.SphereGeometry(0.04, 10, 10), roseGold, -0.25, 2.24, 0, g);
    cyl(0.07, 0.07, 0.7, roseGold, 0.35, 1.58, 0.2, g, 10).rotation.z = Math.PI / 2;
    for (const x of [-0.45, 0, 0.45]) add(new THREE.SphereGeometry(0.02, 8, 8), amberGlow, x, 1.52, 0.4, g);
  },
  oven(st, g) {
    box(1.6, 1.1, 0.95, marbleDark, 0, 1.85, 0, g, 0.07);
    box(1.66, 0.08, 1.0, roseGold, 0, 2.42, 0, g, 0.03);
    box(1.66, 0.08, 1.0, roseGold, 0, 1.3, 0, g, 0.03);
    box(1.0, 0.5, 0.05, amberGlow, 0, 1.76, 0.49, g, 0.02);
    const arch = cyl(0.5, 0.5, 0.05, amberGlow, 0, 2.0, 0.49, g, 24);
    arch.rotation.x = Math.PI / 2; arch.scale.set(1, 1, 0.5);
    add(new THREE.TorusGeometry(0.52, 0.04, 8, 24, Math.PI), roseGold, 0, 2.0, 0.5, g);
    box(1.04, 0.06, 0.06, roseGold, 0, 1.5, 0.52, g);
    cyl(0.07, 0.07, 0.45, roseGold, 0.62, 2.7, -0.2, g, 12);
    for (const x of [-0.65, 0.65]) { const k = cyl(0.07, 0.07, 0.06, roseGold, x, 1.5, 0.5, g, 14); k.rotation.x = Math.PI / 2; }
  },
};
const fancyStations = { cups: cupSt, espresso: machineSt, milk: milkSt, dough: doughSt, oven: ovenSt };
for (const [k, st] of Object.entries(fancyStations)) {
  st.basic = new THREE.Group();
  for (const ch of [...st.g.children]) if (ch !== st.cupSlot) st.basic.add(ch);
  st.g.add(st.basic);
  st.fancy = new THREE.Group();
  st.fancy.visible = false;
  fancyBuilders[k](st, st.fancy);
  st.fancy.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  st.g.add(st.fancy);
  st.deluxe = new THREE.Group();
  st.deluxe.visible = false;
  deluxeBuilders[k](st, st.deluxe);
  st.deluxe.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  st.g.add(st.deluxe);
}
const chocoTag = makeTag(lang === 'pt' ? 'Chocolate' : 'Chocolate');
chocoTag.position.set(chocoSt.pos.x, TAG_Y, chocoSt.pos.z);
scene.add(chocoTag);

const honeyTag = makeTag(lang === 'pt' ? 'Mel' : 'Honey');
honeyTag.position.set(honeySt.pos.x, TAG_Y, honeySt.pos.z);
scene.add(honeyTag);

export function applyStationLevel(n) {
  const lv = LEVELS[n - 1];
  plateGroups.forEach((g, i) => (g.visible = i === lv.slots));
  for (const st of Object.values(fancyStations)) { st.basic.visible = n === 1; st.fancy.visible = n === 2; st.deluxe.visible = n === 3; }
  chocoSt.g.visible = n >= 2;
  chocoSt.hidden = n < 2;
  chocoTag.visible = n >= 2;
  honeySt.g.visible = n >= 3;
  honeySt.hidden = n < 3;
  honeyTag.visible = n >= 3;

  const scale = n === 3 ? SERVE_SCALE : 1;
  counterBase.scale.x = scale;
  counterTop.scale.x = scale;
  serveGlow.scale.x = scale;
  serveSt.ring.scale.x = scale;
  serveSt.hw = SERVE_HW * scale;
}
