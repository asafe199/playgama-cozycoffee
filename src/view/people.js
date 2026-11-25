import * as THREE from 'three';
import { add, box, cyl, noShadow, M } from './scene.js';
import { pick } from '../model/state.js';
import { white } from './materials.js';

const skirtC = [0xb03a5b, 0x4a6fa5, 0x6b4c9a, 0x2f7d6d, 0xd9a441, 0x8a2f2f];

export function makePerson(shirtC, skinC, hairC, chef = false, female = false) {
  const g = new THREE.Group();
  const limb = (w, h, d, mat, x, y, r) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    box(w, h, d, mat, 0, -h / 2, 0, pivot, r);
    g.add(pivot);
    return pivot;
  };
  const pants = M(0x39424e), shirt = M(shirtC, { roughness: 0.9 });
  const girl = female && !chef;
  const legMat = girl ? M(skinC, { roughness: 0.6 }) : pants;
  const legL = limb(girl ? 0.2 : 0.26, 0.75, girl ? 0.24 : 0.3, legMat, -0.13, 0.75, 0.06);
  const legR = limb(girl ? 0.2 : 0.26, 0.75, girl ? 0.24 : 0.3, legMat, 0.13, 0.75, 0.06);
  box(girl ? 0.6 : 0.7, 0.8, girl ? 0.36 : 0.42, shirt, 0, 1.1, 0, g, 0.12);
  if (girl) {
    // skirt flares from the waist so the figure reads as feminine
    const skirt = M(pick(skirtC), { roughness: 0.85 });
    cyl(0.3, 0.46, 0.42, skirt, 0, 0.78, 0, g, 20);
  }
  // arms have an elbow: upper arm + forearm pivot (userData.fore)
  const arm = (x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.45, 0);
    box(0.16, 0.36, 0.18, shirt, 0, -0.18, 0, pivot, 0.07);
    const fore = new THREE.Group();
    fore.position.y = -0.36;
    box(0.15, 0.36, 0.17, shirt, 0, -0.18, 0, fore, 0.07);
    pivot.add(fore);
    pivot.userData.fore = fore;
    g.add(pivot);
    return pivot;
  };
  const armL = arm(-0.43);
  const armR = arm(0.43);
  // head pivots at the neck (non-chef) so it can nod and turn
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  g.add(head);
  add(new THREE.SphereGeometry(0.28, 20, 20), M(skinC, { roughness: 0.6 }), 0, chef ? 1.78 : 0.28, 0, chef ? g : head);
  g.userData.head = head;
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
    // level 5: Santa outfit (red coat, white trim, belt, beard, hat with a swaying tail)
    const royal = new THREE.Group();
    const red = M(0xc0152f, { roughness: 0.8 });
    const fur = M(0xfafafa, { roughness: 1 });
    box(0.8, 0.88, 0.5, red, 0, 1.1, 0, royal, 0.1);
    box(0.84, 0.1, 0.54, fur, 0, 0.68, 0, royal, 0.03);
    box(0.14, 0.88, 0.52, fur, 0, 1.1, 0, royal, 0.03);
    box(0.82, 0.12, 0.52, M(0x15151c), 0, 0.98, 0, royal, 0.02);
    box(0.17, 0.15, 0.06, gold, 0, 0.98, 0.27, royal, 0.02);
    for (const sx of [-0.43, 0.43]) box(0.2, 0.08, 0.22, fur, sx, 0.85, 0, royal, 0.03);
    add(new THREE.SphereGeometry(0.2, 14, 12), fur, 0, 1.64, 0.15, royal).scale.set(1.15, 1.1, 0.8);
    add(new THREE.SphereGeometry(0.09, 10, 8), fur, -0.09, 1.72, 0.27, royal).scale.set(1.4, 0.6, 0.6);
    add(new THREE.SphereGeometry(0.09, 10, 8), fur, 0.09, 1.72, 0.27, royal).scale.set(1.4, 0.6, 0.6);
    cyl(0.31, 0.31, 0.12, fur, 0, 2.02, 0, royal, 20);
    const hat = cyl(0.27, 0.1, 0.38, red, 0, 2.27, -0.05, royal, 18);
    hat.rotation.x = -0.25;
    const cape = new THREE.Group();
    cape.position.set(0, 2.4, -0.18);
    cyl(0.12, 0.05, 0.45, red, 0, -0.22, 0, cape, 12);
    add(new THREE.SphereGeometry(0.09, 10, 10), fur, 0, -0.5, 0, cape);
    royal.add(cape);
    g.userData.cape = cape;
    royal.visible = false;
    fancy.add(royal);
    g.userData.toque = toque;
    g.userData.royal = royal;
    fancy.visible = false;
    g.add(fancy);
    g.userData.fancy = fancy;
    g.userData.shirt = shirt;
    g.userData.shirtBase = shirtC;  } else {
    const hairM = M(hairC, { roughness: 0.8 });
    add(new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * (female ? 0.6 : 0.55)), hairM, 0, 0.32, -0.01, head).rotation.x = -0.15;
    if (female) {
      // the hair hangs from a pivot at the crown so it can sway
      const sway = new THREE.Group();
      head.add(sway);
      g.userData.hair = sway;
      sway.userData.ph = Math.random() * 6.28;
      if (Math.random() < 0.5) {
        // long hair down the back and over the shoulders
        sway.position.set(0, 0.3, 0);
        box(0.58, 0.66, 0.16, hairM, 0, -0.3, -0.2, sway, 0.07);
        box(0.08, 0.5, 0.14, hairM, -0.28, -0.35, -0.02, sway, 0.04);
        box(0.08, 0.5, 0.14, hairM, 0.28, -0.35, -0.02, sway, 0.04);
      } else {
        // ponytail with a bow
        sway.position.set(0, 0.3, -0.3);
        add(new THREE.SphereGeometry(0.1, 10, 10), hairM, 0, 0, 0, sway);
        cyl(0.07, 0.03, 0.5, hairM, 0, -0.26, -0.04, sway, 10).rotation.x = -0.2;
        add(new THREE.SphereGeometry(0.06, 8, 8), M(0xff7aa8), 0, 0, -0.06, sway);
      }
      // lips and lashes
      noShadow(add(new THREE.SphereGeometry(0.03, 8, 6), M(0xd23a5a), 0, 0.17, 0.27, head)).scale.set(1.6, 0.7, 0.5);
    }
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
  g.userData.shirt.color.setHex(royal ? 0xc0152f : fancy ? 0x15151c : g.userData.shirtBase);
}

const gold = M(0xd9ad3a, { roughness: 0.3, metalness: 0.7 });

// Adds a small, instantly-readable accessory set to a customer built by makePerson, inspired by
// the storybook cast of the Royal Coffee key art (princess, wizard, palace guard).
export function addCostume(g, kind) {
  const head = g.userData.head;
  if (!head) return;
  if (kind === 'princess') {
    const crown = new THREE.Group();
    crown.position.set(0, 0.52, 0);
    cyl(0.17, 0.19, 0.08, gold, 0, 0, 0, crown, 14);
    for (const a of [-0.4, 0, 0.4]) {
      const spike = add(new THREE.ConeGeometry(0.05, 0.12, 4), gold, Math.sin(a) * 0.14, 0.1, Math.cos(a) * 0.14, crown);
      spike.rotation.y = a;
    }
    head.add(crown);
  } else if (kind === 'wizard') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.5, 0);
    const hatMat = M(0x3b3a7a, { roughness: 0.8 });
    cyl(0.32, 0.3, 0.05, hatMat, 0, 0, 0, hat, 16);
    const cone = add(new THREE.ConeGeometry(0.16, 0.5, 14), hatMat, 0, 0.3, 0, hat);
    cone.rotation.z = 0.12;
    add(new THREE.SphereGeometry(0.05, 10, 10), gold, 0.05, 0.56, 0, hat);
    head.add(hat);
    const beard = M(0xf3f3f3, { roughness: 0.9 });
    const chin = add(new THREE.SphereGeometry(0.14, 10, 8), beard, 0, 0.05, 0.22, head);
    chin.scale.set(0.9, 1.3, 0.8);
  } else if (kind === 'guard') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.5, 0);
    const navy = M(0x1c2a4a, { roughness: 0.6 });
    cyl(0.3, 0.3, 0.3, navy, 0, 0.1, 0, hat, 16);
    cyl(0.31, 0.31, 0.05, gold, 0, -0.02, 0, hat, 16);
    add(new THREE.ConeGeometry(0.04, 0.22, 8), M(0xb3122e), 0, 0.36, 0, hat);
    head.add(hat);
    const stache = add(new THREE.BoxGeometry(0.2, 0.05, 0.06), M(0x2b1d14), 0, 0.05, 0.25, head);
    stache.rotation.z = 0;
    const sash = add(new THREE.BoxGeometry(0.1, 0.9, 0.44), gold, -0.1, 1.1, 0.01, g);
    sash.rotation.z = 0.5;
  }
}

export function swayHair(g, moving, t) {
  const h = g.userData.hair;
  if (!h) return;
  const ph = h.userData.ph;
  const x = moving ? 0.22 + Math.sin(t * 12 + ph) * 0.14 : Math.sin(t * 1.8 + ph) * 0.05;
  const z = moving ? Math.sin(t * 6 + ph) * 0.12 : Math.sin(t * 1.3 + ph) * 0.04;
  h.rotation.x += (x - h.rotation.x) * 0.2;
  h.rotation.z += (z - h.rotation.z) * 0.2;
}

export function animatePerson(g, moving, t, holding = false) {
  swayHair(g, moving, t);
  const [lL, lR] = g.userData.legs, [aL, aR] = g.userData.arms;
  const sw = moving ? Math.sin(t * 12) * 0.7 : 0;
  lL.rotation.x += (sw - lL.rotation.x) * 0.3;
  lR.rotation.x += (-sw - lR.rotation.x) * 0.3;
  const hold = holding ? -1.0 : 0;
  aL.rotation.x += ((holding ? hold : -sw * 0.8) - aL.rotation.x) * 0.3;
  aR.rotation.x += ((holding ? hold : sw * 0.8) - aR.rotation.x) * 0.3;
}
