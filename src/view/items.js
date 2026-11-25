import * as THREE from 'three';
import { add, cyl, M } from './scene.js';
import { white } from './materials.js';

export function makeItem(type) {
  const g = new THREE.Group();
  if (['cup', 'espresso', 'latte', 'milkcup', 'mocha', 'mochalatte', 'honeylatte', 'honeyespresso', 'creamlatte', 'creammocha'].includes(type)) {
    cyl(0.14, 0.1, 0.2, white, 0, 0.1, 0, g, 16);
    if (type !== 'cup') cyl(0.12, 0.12, 0.02, M(type === 'latte' || type === 'milkcup' ? 0xfdfdfd : type === 'mocha' || type === 'creammocha' ? 0x4a2512 : type === 'mochalatte' ? 0xc89a74 : type === 'creamlatte' ? 0xfdfdfd : type === 'honeylatte' ? 0xd98c1f : 0x3b2314, { roughness: 0.4 }), 0, 0.2, 0, g, 16);
    if (type === 'honeyespresso') {
      cyl(0.145, 0.145, 0.04, M(0xd98c1f, { roughness: 0.3 }), 0, 0.12, 0, g, 16);
      add(new THREE.SphereGeometry(0.06, 10, 8), M(0xd98c1f, { roughness: 0.3, emissive: 0x5a3a0a }), 0, 0.24, 0, g).scale.y = 0.6;
    }
    if (type === 'mocha' || type === 'mochalatte' || type === 'honeylatte') {
      add(new THREE.SphereGeometry(0.1, 12, 10), white, 0, 0.27, 0, g).scale.y = 0.7;
      cyl(0.145, 0.145, 0.04, M(type === 'honeylatte' ? 0xd98c1f : 0x4a2512), 0, 0.12, 0, g, 16);
    }
    if (type === 'creamlatte' || type === 'creammocha') {
      add(new THREE.SphereGeometry(0.13, 14, 10), M(0xfffaf2, { roughness: 0.6 }), 0, 0.27, 0, g).scale.y = 0.8;
      add(new THREE.SphereGeometry(0.07, 12, 10), M(0xfffaf2, { roughness: 0.6 }), 0, 0.37, 0, g);
      add(new THREE.SphereGeometry(0.035, 8, 8), M(0xc0152f, { roughness: 0.3 }), 0, 0.45, 0, g);
    }
  } else if (type === 'dough') {
    add(new THREE.SphereGeometry(0.18, 12, 10), M(0xefd9a8, { roughness: 1 }), 0, 0.14, 0, g).scale.y = 0.75;
  } else if (type === 'wafflehoney' || type === 'waffle' || type === 'creamwaffle') {
    const waffle = M(0xd9a35c, { roughness: 0.8 });
    const ridge = M(0xc98a4a, { roughness: 0.8 });
    add(new THREE.BoxGeometry(0.3, 0.06, 0.3), waffle, 0, 0.1, 0, g);
    for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) add(new THREE.BoxGeometry(0.07, 0.03, 0.07), ridge, i * 0.09, 0.14, j * 0.09, g);
    if (type === 'wafflehoney') add(new THREE.SphereGeometry(0.05, 10, 8), M(0xd98c1f, { roughness: 0.3, emissive: 0x5a3a0a }), 0, 0.15, 0, g).scale.set(1.4, 0.4, 1.4);
    if (type === 'creamwaffle') {
      add(new THREE.SphereGeometry(0.11, 12, 10), M(0xfffaf2, { roughness: 0.6 }), 0, 0.2, 0, g).scale.y = 0.8;
      add(new THREE.SphereGeometry(0.035, 8, 8), M(0xc0152f, { roughness: 0.3 }), 0, 0.3, 0, g);
    }
  } else {
    const c = add(new THREE.TorusGeometry(0.12, 0.07, 10, 18, Math.PI * 1.5), M(type === 'chococroissant' ? 0x6b3a1c : 0xdc9a4a, { roughness: 0.85 }), 0, 0.15, 0, g);
    c.rotation.x = Math.PI / 2;
  }
  g.traverse((o) => (o.castShadow = true));
  return g;
}
