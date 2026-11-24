import * as THREE from 'three';
import { add, cyl, M } from './scene.js';
import { white } from './materials.js';

export function makeItem(type) {
  const g = new THREE.Group();
  if (['cup', 'espresso', 'latte', 'milkcup', 'mocha', 'mochalatte', 'doceleitelatte'].includes(type)) {
    cyl(0.14, 0.1, 0.2, white, 0, 0.1, 0, g, 16);
    if (type !== 'cup') cyl(0.12, 0.12, 0.02, M(type === 'latte' || type === 'milkcup' ? 0xfdfdfd : type === 'mocha' ? 0x4a2512 : type === 'mochalatte' ? 0xc89a74 : type === 'doceleitelatte' ? 0xc68642 : 0x3b2314, { roughness: 0.4 }), 0, 0.2, 0, g, 16);
    if (type === 'mocha' || type === 'mochalatte' || type === 'doceleitelatte') {
      add(new THREE.SphereGeometry(0.1, 12, 10), white, 0, 0.27, 0, g).scale.y = 0.7;
      cyl(0.145, 0.145, 0.04, M(type === 'doceleitelatte' ? 0xc68642 : 0x4a2512), 0, 0.12, 0, g, 16);
    }
  } else if (type === 'dough') {
    add(new THREE.SphereGeometry(0.18, 12, 10), M(0xefd9a8, { roughness: 1 }), 0, 0.14, 0, g).scale.y = 0.75;
  } else {
    const c = add(new THREE.TorusGeometry(0.12, 0.07, 10, 18, Math.PI * 1.5), M(type === 'burnt' ? 0x1b1b1b : type === 'chococroissant' ? 0x6b3a1c : type === 'doceleitecroissant' ? 0xc68642 : 0xdc9a4a, { roughness: 0.85 }), 0, 0.15, 0, g);
    c.rotation.x = Math.PI / 2;
  }
  g.traverse((o) => (o.castShadow = true));
  return g;
}
