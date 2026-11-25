import * as THREE from 'three';
import { add, box, cyl, M } from './scene.js';
import { white } from './materials.js';

export function makePerson(shirtC, skinC, hairC, chef = false) {
  const g = new THREE.Group();
  const limb = (w, h, d, mat, x, y, r) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    box(w, h, d, mat, 0, -h / 2, 0, pivot, r);
    g.add(pivot);
    return pivot;
  };
  const pants = M(0x39424e), shirt = M(shirtC, { roughness: 0.9 });
  const legL = limb(0.26, 0.75, 0.3, pants, -0.13, 0.75, 0.06);
  const legR = limb(0.26, 0.75, 0.3, pants, 0.13, 0.75, 0.06);
  box(0.7, 0.8, 0.42, shirt, 0, 1.1, 0, g, 0.12);
  const armL = limb(0.16, 0.7, 0.18, shirt, -0.43, 1.45, 0.07);
  const armR = limb(0.16, 0.7, 0.18, shirt, 0.43, 1.45, 0.07);
  add(new THREE.SphereGeometry(0.28, 20, 20), M(skinC, { roughness: 0.6 }), 0, 1.78, 0, g);
  if (chef) {
    const basic = new THREE.Group();
    g.add(basic);
    box(0.62, 0.55, 0.06, M(0x8b4a2b), 0, 0.95, 0.22, basic, 0.03);
    cyl(0.3, 0.3, 0.1, white, 0, 2.05, 0, basic, 20);
    cyl(0.22, 0.26, 0.2, white, 0, 2.18, 0, basic, 20);
    g.userData.basic = basic;
    const gold = M(0xd4af37, { roughness: 0.25, metalness: 0.9 });
    const fancy = new THREE.Group();
    box(0.76, 0.84, 0.46, M(0x15151c, { roughness: 0.6 }), 0, 1.1, 0, fancy, 0.1);
    box(0.1, 0.84, 0.47, gold, -0.24, 1.1, 0, fancy, 0.02);
    box(0.1, 0.84, 0.47, gold, 0.24, 1.1, 0, fancy, 0.02);
    for (const y of [1.35, 1.15, 0.95]) add(new THREE.SphereGeometry(0.04, 8, 8), gold, 0, y, 0.24, fancy);
    add(new THREE.SphereGeometry(0.06, 8, 8), M(0xb3122e), 0, 1.5, 0.23, fancy);
    box(0.2, 0.08, 0.05, M(0xb3122e), -0.09, 1.5, 0.23, fancy, 0.02);
    box(0.2, 0.08, 0.05, M(0xb3122e), 0.09, 1.5, 0.23, fancy, 0.02);
    const toque = new THREE.Group();
    cyl(0.31, 0.31, 0.06, gold, 0, 2.1, 0, toque, 20);
    cyl(0.24, 0.28, 0.32, white, 0, 2.38, 0, toque, 20);
    add(new THREE.SphereGeometry(0.15, 12, 10), gold, 0, 2.6, 0, toque);
    fancy.add(toque);
    // level 5: gold crown and crimson cape instead of the toque
    const royal = new THREE.Group();
    const ruby = M(0xd0183a, { roughness: 0.2, emissive: 0x4a0612 });
    cyl(0.27, 0.29, 0.16, gold, 0, 2.2, 0, royal, 20);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = add(new THREE.ConeGeometry(0.06, 0.2, 6), gold, Math.cos(a) * 0.26, 2.38, Math.sin(a) * 0.26, royal);
      add(new THREE.SphereGeometry(0.035, 8, 8), ruby, Math.cos(a) * 0.26, 2.5, Math.sin(a) * 0.26, royal);
    }
    const cape = new THREE.Group();
    cape.position.set(0, 1.6, -0.3);
    box(0.86, 1.1, 0.06, M(0xa3162b, { roughness: 0.7 }), 0, -0.55, 0, cape, 0.02);
    royal.add(cape);
    g.userData.cape = cape;
    box(0.9, 0.12, 0.5, M(0xf6f0e8, { roughness: 0.9 }), 0, 1.55, -0.03, royal, 0.03);
    royal.visible = false;
    fancy.add(royal);
    g.userData.toque = toque;
    g.userData.royal = royal;
    fancy.visible = false;
    g.add(fancy);
    g.userData.fancy = fancy;
    g.userData.shirt = shirt;
    g.userData.shirtBase = shirtC;  } else {
    add(new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), M(hairC, { roughness: 0.8 }), 0, 1.82, -0.01, g).rotation.x = -0.15;
  }
  g.userData.legs = [legL, legR];
  g.userData.arms = [armL, armR];
  return g;
}

export function dressChef(g, fancy, royal = false) {
  g.userData.toque.visible = !royal;
  g.userData.royal.visible = royal;
  g.userData.fancy.visible = fancy;
  g.userData.basic.visible = !fancy;
  g.userData.shirt.color.setHex(fancy ? 0x15151c : g.userData.shirtBase);
}

export function animatePerson(g, moving, t, holding = false) {
  const [lL, lR] = g.userData.legs, [aL, aR] = g.userData.arms;
  const sw = moving ? Math.sin(t * 12) * 0.7 : 0;
  lL.rotation.x += (sw - lL.rotation.x) * 0.3;
  lR.rotation.x += (-sw - lR.rotation.x) * 0.3;
  const hold = holding ? -1.0 : 0;
  aL.rotation.x += ((holding ? hold : -sw * 0.8) - aL.rotation.x) * 0.3;
  aR.rotation.x += ((holding ? hold : sw * 0.8) - aR.rotation.x) * 0.3;
}
