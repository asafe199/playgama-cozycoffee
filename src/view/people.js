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
    box(0.62, 0.55, 0.06, M(0x8b4a2b), 0, 0.95, 0.22, g, 0.03);
    cyl(0.3, 0.3, 0.1, white, 0, 2.05, 0, g, 20);
    cyl(0.22, 0.26, 0.2, white, 0, 2.18, 0, g, 20);
  } else {
    add(new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), M(hairC, { roughness: 0.8 }), 0, 1.82, -0.01, g).rotation.x = -0.15;
  }
  g.userData.legs = [legL, legR];
  g.userData.arms = [armL, armR];
  return g;
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
