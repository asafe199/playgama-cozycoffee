import * as THREE from 'three';
import bridge from '@playgama/bridge';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- i18n (source strings are Portuguese; English comes from the map) ----------
const lang = String(bridge.platform?.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const EN = {
  'Pegue um copo, passe na máquina e entregue o pedido certo!': 'Grab a cup, use the machine and serve the right order!',
  'Expediente concluído! 🌟': 'Shift complete! 🌟',
  'Game over 💥': 'Game over 💥',
  'Jogar de novo': 'Play again',
  'Suas mãos estão ocupadas.': 'Your hands are full.',
  'Copo na mão → leve à máquina de ESPRESSO (ou ao LEITE para latte).': 'Cup in hand → take it to the ESPRESSO machine (or MILK for a latte).',
  'Preparando espresso…': 'Brewing espresso…',
  'Espresso pronto! Entregue no balcão ou leve ao LEITE para fazer latte.': 'Espresso ready! Serve it or take it to MILK for a latte.',
  'Coloque um copo aqui.': 'Put a cup here.',
  'Latte pronto! Entregue no balcão.': 'Latte ready! Serve it at the counter.',
  'Leite precisa de um copo ou espresso na mão.': 'Milk needs a cup or an espresso in hand.',
  'Massa na mão → leve ao FORNO e espere assar.': 'Dough in hand → take it to the OVEN and wait.',
  'Assando… não deixe queimar!': "Baking… don't let it burn!",
  'Queimou! Jogue no lixo.': 'Burnt! Throw it in the trash.',
  'Croissant pronto! Entregue no balcão.': 'Croissant ready! Serve it at the counter.',
  'Coloque massa aqui.': 'Put dough here.',
  'Descartado.': 'Discarded.',
  'Você não está segurando nada.': "You're not holding anything.",
  'Nenhum cliente com pedido ainda.': 'No customer has ordered yet.',
  'Espresso pronto!': 'Espresso ready!',
  'Croissant pronto! Pegue no forno antes de queimar.': 'Croissant ready! Take it from the oven before it burns.',
  'O croissant queimou!': 'The croissant burned!',
  'O dia acabou!': 'The day is over!',
  'Um cliente cansou de esperar! 💔': 'A customer got tired of waiting! 💔',
  'Clientes demais foram embora.': 'Too many customers left.',
  'Começar': 'Start',
  'AÇÃO': 'ACTION',
  'Anote os pedidos, prepare e entregue no balcão.\nWASD/setas: mover · Espaço/E: interagir · Q: soltar item · ou clique nas estações.\nItem errado custa um coração. Sem corações, game over!':
    'Take orders, prepare and serve at the counter.\nWASD/arrows: move · Space/E: interact · Q: drop item · or click the stations.\nA wrong item costs a heart. No hearts left, game over!',
  'Pronto?': 'Ready?',
  'Vaporizando o leite…': 'Steaming the milk…',
  'Latte pronto! Entregue no prato do cliente.': 'Latte ready! Serve it on the customer\'s plate.',
  'Leite pronto!': 'Milk ready!',
  'Coloque o pedido no prato em frente a um cliente.': 'Put the order on the plate in front of a customer.',
  'Pedido errado! Você perdeu um coração.': 'Wrong order! You lost a heart.',
  'Copo com leite → leve à máquina de ESPRESSO para terminar o latte.': 'Cup with milk → take it to the ESPRESSO machine to finish the latte.',
  'SOLTAR': 'DROP',
  'Próximo nível': 'Next level',
  'Adicionando chocolate…': 'Adding chocolate…',
  'Chocolate pronto!': 'Chocolate ready!',
  'Pronto! Entregue no prato do cliente.': 'Ready! Serve it on the customer plate.',
  'Chocolate precisa de espresso, latte ou croissant na mão.': 'Chocolate needs an espresso, latte or croissant in hand.',
  'Copo devolvido.': 'Cup put back.',
  'Massa devolvida.': 'Dough put back.',
  'Item descartado.': 'Item dropped.',
};
const tr = (s) => (lang === 'en' && EN[s]) || s;

// ---------- renderer / camera / light ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9dfd2);
const aspect = () => innerWidth / innerHeight;
const frustum = 8.2;
const camera = new THREE.OrthographicCamera(-frustum * aspect(), frustum * aspect(), frustum, -frustum, 0.1, 100);
camera.position.set(11, 14, 11);
camera.lookAt(0, 0.5, -1.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89c82, 0.5));
const sun = new THREE.DirectionalLight(0xffe6c4, 2.2);
sun.position.set(-6, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
sun.shadow.bias = -0.0005;
scene.add(sun);

// ---------- helpers ----------
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, ...o });
function add(geo, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, p, r = 0.03) => add(new RoundedBoxGeometry(w, h, d, 2, r), mat, x, y, z, p);
const cyl = (rt, rb, h, mat, x, y, z, p, seg = 24) => add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
const noShadow = (m) => ((m.castShadow = false), m);

const wood = M(0xb98a5e, { roughness: 0.55 });
const woodDark = M(0x6b4a33, { roughness: 0.6 });
const metal = M(0xb8bcc2, { roughness: 0.25, metalness: 0.9 });
const black = M(0x24262a, { roughness: 0.4, metalness: 0.4 });
const white = M(0xf7f4ef, { roughness: 0.5 });
const brick = M(0xb5654a, { roughness: 0.9 });
const wallMat = M(0xf0e8dc, { roughness: 0.95 });
const green = M(0x5f9a62, { roughness: 0.8 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f2, roughness: 0.05, transparent: true, opacity: 0.35 });
const top = M(0xe9e4dc, { roughness: 0.25 });

// ---------- room ----------
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
const rugMat = M(0xd9c7ae, { roughness: 1 });
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
box(10.4, 1.2, 1.2, woodDark, 0, 0.6, -5.3);
box(10.6, 0.12, 1.4, top, 0, 1.26, -5.3);
// serving counter (front)
box(7.4, 0.9, 0.7, woodDark, 0, 0.45, -1.5);
box(7.6, 0.1, 0.9, top, 0, 0.95, -1.5);

function pendant(x, z, y = 3.4) {
  noShadow(cyl(0.01, 0.01, WH - y, black, x, (WH + y) / 2, z, scene, 6));
  noShadow(add(new THREE.ConeGeometry(0.4, 0.4, 28, 1, true), M(0x2a2c30, { metalness: 0.6, side: THREE.DoubleSide }), x, y, z));
  noShadow(add(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd98a }), x, y - 0.12, z));
  const l = new THREE.PointLight(0xffc880, 6, 7, 2);
  l.position.set(x, y - 0.2, z);
  scene.add(l);
}
pendant(-3, -4.2);
pendant(0, -4.2);
pendant(3, -4.2);
pendant(0, 0.5);

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

// ---------- items ----------
const RECIPES = {
  espresso: { label: 'Espresso', icon: '☕' },
  latte: { label: 'Latte', icon: '🥛' },
  croissant: { label: 'Croissant', icon: '🥐' },
  mocha: { label: 'Mocha', icon: '🍫' },
  mochalatte: { label: 'Mocha Latte', icon: '🧋' },
  chococroissant: { label: 'Choco Croissant', icon: '🍩' },
};
function makeItem(type) {
  const g = new THREE.Group();
  if (['cup', 'espresso', 'latte', 'milkcup', 'mocha', 'mochalatte'].includes(type)) {
    cyl(0.14, 0.1, 0.2, white, 0, 0.1, 0, g, 16);
    if (type !== 'cup') cyl(0.12, 0.12, 0.02, M(type === 'latte' || type === 'milkcup' ? 0xfdfdfd : type === 'mocha' ? 0x4a2512 : type === 'mochalatte' ? 0xc89a74 : 0x3b2314, { roughness: 0.4 }), 0, 0.2, 0, g, 16);
    if (type === 'mocha' || type === 'mochalatte') {
      add(new THREE.SphereGeometry(0.1, 12, 10), white, 0, 0.27, 0, g).scale.y = 0.7;
      cyl(0.145, 0.145, 0.04, M(0x4a2512), 0, 0.12, 0, g, 16);
    }
  } else if (type === 'dough') {
    add(new THREE.SphereGeometry(0.18, 12, 10), M(0xefd9a8, { roughness: 1 }), 0, 0.14, 0, g).scale.y = 0.75;
  } else {
    const c = add(new THREE.TorusGeometry(0.12, 0.07, 10, 18, Math.PI * 1.5), M(type === 'burnt' ? 0x1b1b1b : type === 'chococroissant' ? 0x6b3a1c : 0xdc9a4a, { roughness: 0.85 }), 0, 0.15, 0, g);
    c.rotation.x = Math.PI / 2;
  }
  g.traverse((o) => (o.castShadow = true));
  return g;
}

// ---------- stations ----------
const stations = {};
const stand = new THREE.Vector3();
function makeStation(key, x, z, hw, label) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.userData.station = key;
  scene.add(g);
  const ring = noShadow(add(new THREE.PlaneGeometry(Math.max(1.2, hw * 2), 1), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.0 }), x, 0.03, key === 'serve' ? -2.7 : z + 1.4));
  ring.rotation.x = -Math.PI / 2;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x4cd964 }));
  bar.position.set(x, 2.6, z + 0.2);
  bar.visible = false;
  scene.add(bar);
  stations[key] = { key, g, pos: new THREE.Vector3(x, 0, z), hw, label, ring, bar, data: {} };
  return stations[key];
}
const SZ = -5.3;

// cup stack
const cupSt = makeStation('cups', -4.3, SZ, 0.5, 'Copos');
for (let i = 0; i < 4; i++) cyl(0.17, 0.12, 0.28, white, 0, 1.46 + i * 0.28, 0, cupSt.g, 16);
box(0.5, 0.06, 0.5, black, 0, 1.35, 0, cupSt.g);

// espresso machine
const machineSt = makeStation('espresso', -2.5, SZ, 0.8, 'Máquina de espresso');
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
const milkSt = makeStation('milk', -0.7, SZ, 0.8, 'Leite');
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
const ovenSt = makeStation('oven', 3.0, SZ, 0.8, 'Forno');
box(1.5, 1.0, 0.9, black, 0, 1.8, 0, ovenSt.g, 0.07);
const ovenGlass = box(1.1, 0.6, 0.05, M(0x6b4a33, { roughness: 0.2, metalness: 0.3, emissive: 0x000000 }), 0, 1.8, 0.46, ovenSt.g, 0.02);
ovenSt.cupSlot = new THREE.Group();
ovenSt.cupSlot.position.set(0, 1.6, 0.2);
ovenSt.g.add(ovenSt.cupSlot);
ovenSt.bar.position.y = 2.6;

// trash
const trashSt = makeStation('trash', 5.35, SZ + 0.4, 0.4, 'Lixo');
cyl(0.38, 0.3, 0.8, M(0x4a5560, { roughness: 0.4, metalness: 0.6 }), 0, 0.4, 0, trashSt.g, 20);
cyl(0.4, 0.4, 0.06, black, 0, 0.82, 0, trashSt.g, 20);
trashSt.ring.position.set(4.6, 0.03, SZ + 1.1);

// serve counter marker
const serveSt = makeStation('serve', 0, -1.5, 3.4, 'Balcão de entrega');
box(7.0, 0.02, 0.5, M(0xffd54a, { roughness: 0.6, emissive: 0x332600 }), 0, 1.02, 0, serveSt.g, 0.01);
serveSt.ring.scale.set(7 / 1.2, 1, 1);
// plates marking where to leave the order (one per customer spot)
const SLOT_SETS = [[-2.6, 0, 2.6], [-3.2, -1.6, 0, 1.6, 3.2]];
const plateGroups = SLOT_SETS.map((xs) => {
  const g = new THREE.Group();
  for (const px of xs) {
    cyl(0.36, 0.3, 0.04, white, px, 1.04, 0, g, 28);
    cyl(0.24, 0.24, 0.045, M(0xe8e1d6, { roughness: 0.5 }), px, 1.045, 0, g, 28);
  }
  serveSt.g.add(g);
  return g;
});

// ---------- levels / cafés ----------
const THEMES = [
  { bg: 0xe9dfd2, floor: 0xb98a5e, wall: 0xf0e8dc, brick: 0xb5654a, counter: 0x6b4a33, top: 0xe9e4dc, rug: 0xd9c7ae },
  { bg: 0x2e3a44, floor: 0x55606b, wall: 0x9db5a0, brick: 0x2f3b45, counter: 0x2b2f36, top: 0xcfd3d8, rug: 0x3d7580 },
];
const LEVELS = [
  { slots: 0, spawn: [6, 10], patience: 55 },
  { slots: 1, spawn: [4, 7], patience: 50 },
];
const extras = new THREE.Group();
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
let level = 1;
function applyLevel(n) {
  level = n;
  const th = THEMES[n - 1], lv = LEVELS[n - 1];
  scene.background.setHex(th.bg);
  floorMats.forEach((m, i) => m.color.setHex(th.floor).offsetHSL(0, 0, ((i % 3) - 1) * 0.015));
  wallMat.color.setHex(th.wall);
  brick.color.setHex(th.brick);
  woodDark.color.setHex(th.counter);
  top.color.setHex(th.top);
  rugMat.color.setHex(th.rug);
  extras.visible = n === 2;
  plateGroups.forEach((g, i) => (g.visible = i === lv.slots));
  SLOTS = SLOT_SETS[lv.slots];
  for (const st of Object.values(fancyStations)) { st.basic.visible = n === 1; st.fancy.visible = n === 2; }
  chocoSt.g.visible = n === 2;
  chocoSt.hidden = n !== 2;
  refreshGuide();
}

// station name tags so every appliance is identifiable
function makeTag(text) {
  const cv = document.createElement('canvas');
  cv.width = 320; cv.height = 90;
  const c = cv.getContext('2d');
  c.fillStyle = '#fffaf0';
  c.beginPath(); c.roundRect(4, 4, 312, 82, 24); c.fill();
  c.lineWidth = 5; c.strokeStyle = '#c0392b'; c.stroke();
  c.fillStyle = '#4a3426';
  c.font = 'bold 40px system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 160, 48);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
  s.scale.set(1.7, 0.48, 1);
  s.renderOrder = 11;
  return s;
}
const TAGS = [
  [cupSt, 'Copos', 2.7], [machineSt, 'Espresso', 3.2], [milkSt, 'Leite', 3.2],
  [doughSt, 'Massa', 2.6], [ovenSt, 'Forno', 3.2], [trashSt, 'Lixo', 1.7],
];
for (const [s, txt, y] of TAGS) {
  const tag = makeTag(lang === 'pt' ? txt : txt.replace('Copos', 'Cups').replace('Leite', 'Milk').replace('Massa', 'Dough').replace('Forno', 'Oven').replace('Lixo', 'Trash'));
  tag.position.set(s.pos.x, y, s.pos.z);
  scene.add(tag);
}

// recipe card
const guide = document.createElement('div');
guide.className = 'pill';
guide.style.cssText = 'position:fixed;left:10px;bottom:60px;font-size:13px;line-height:1.7;font-weight:600';
guide.innerHTML = lang === 'pt'
  ? '<b>Receitas</b><br>Espresso: Copo → Máquina (espere) → pegue → entregue<br>Latte: Copo → Leite → entregue<br> Croissant: Massa → Forno (espere, não queime!) → pegue → entregue'
  : '<b>Recipes</b><br>Espresso: Cup → Machine (wait) → pick up → serve<br>Latte: Cup → Milk → serve<br> Croissant: Dough → Oven (wait, don\'t burn!) → pick up → serve';
document.body.appendChild(guide);


// ---------- level 2: fancy machines + chocolate station ----------
const gold = M(0xd4af37, { roughness: 0.22, metalness: 0.95 });
const teal = M(0x1f8a8a, { roughness: 0.25, metalness: 0.6 });
const glass = new THREE.MeshStandardMaterial({ color: 0xbfe6f0, transparent: true, opacity: 0.35, roughness: 0.05 });
const chocoSt = makeStation('choco', 4.4, SZ, 0.4, 'Chocolate');
chocoSt.cupSlot = new THREE.Group();
chocoSt.cupSlot.position.set(0, 1.4, 0.5);
chocoSt.g.add(chocoSt.cupSlot);
chocoSt.bar.position.y = 2.8;
chocoSt.hidden = true;
const disc = (mat, r, h, y, parent) => cyl(r, r, h, mat, 0, y, 0, parent, 28);
const choc = M(0x3a1a0c, { roughness: 0.25, emissive: 0x1a0a04 });
disc(gold, 0.36, 0.1, 1.42, chocoSt.g); disc(choc, 0.3, 0.12, 1.55, chocoSt.g);
disc(gold, 0.24, 0.08, 1.8, chocoSt.g); disc(choc, 0.2, 0.1, 1.9, chocoSt.g);
cyl(0.05, 0.05, 0.5, gold, 0, 1.7, 0, chocoSt.g, 10);
add(new THREE.SphereGeometry(0.12, 14, 12), choc, 0, 2.2, 0, chocoSt.g);
chocoSt.g.visible = false;

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
}
{
  const t = makeTag(lang === 'pt' ? 'Chocolate' : 'Chocolate');
  t.position.set(chocoSt.pos.x, 3.0, chocoSt.pos.z);
  extras.add(t);
}
function refreshGuide() {
  const l2 = level === 2;
  guide.innerHTML = lang === 'pt'
    ? '<b>Receitas</b><br>Espresso: Copo → Máquina → entregue<br>Latte: Copo → Leite → entregue<br>Croissant: Massa → Forno (não queime!) → entregue' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '')
    : '<b>Recipes</b><br>Espresso: Cup → Machine → serve<br>Latte: Cup → Milk → serve<br>Croissant: Dough → Oven (don\'t burn!) → serve' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '');
}

// ---------- people ----------
function makePerson(shirtC, skinC, hairC, chef = false) {
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
function animatePerson(g, moving, t, holding = false) {
  const [lL, lR] = g.userData.legs, [aL, aR] = g.userData.arms;
  const sw = moving ? Math.sin(t * 12) * 0.7 : 0;
  lL.rotation.x += (sw - lL.rotation.x) * 0.3;
  lR.rotation.x += (-sw - lR.rotation.x) * 0.3;
  const hold = holding ? -1.0 : 0;
  aL.rotation.x += ((holding ? hold : -sw * 0.8) - aL.rotation.x) * 0.3;
  aR.rotation.x += ((holding ? hold : sw * 0.8) - aR.rotation.x) * 0.3;
}
const player = makePerson(0x2f6f8f, 0xf1c27d, 0x2b1d14, true);
scene.add(player);
const P = { pos: new THREE.Vector3(0, 0, -3.8), goal: null, pending: null, held: null, heldMesh: null };

function setHeld(type) {
  if (P.heldMesh) player.remove(P.heldMesh);
  P.held = type;
  P.heldMesh = null;
  if (type) {
    P.heldMesh = makeItem(type);
    P.heldMesh.position.set(0, 1.05, 0.62);
    player.add(P.heldMesh);
    const names = lang === 'pt'
      ? { cup: 'Copo vazio', milkcup: 'Copo com leite', espresso: 'Espresso', latte: 'Latte', dough: 'Massa', croissant: 'Croissant', mocha: 'Mocha', mochalatte: 'Mocha Latte', chococroissant: 'Croissant de chocolate', burnt: 'Queimado' }
      : { cup: 'Empty cup', milkcup: 'Cup with milk', espresso: 'Espresso', latte: 'Latte', dough: 'Dough', croissant: 'Croissant', mocha: 'Mocha', mochalatte: 'Mocha Latte', chococroissant: 'Choco croissant', burnt: 'Burnt' };
    const tag = makeTag(names[type]);
    tag.position.set(0, 2.9, 0);
    tag.scale.set(1.6, 0.45, 1);
    P.heldMesh.add(tag);
    tag.position.set(0, 1.85 - 0, -0.62);
  }
}

// ---------- game state ----------
const $ = (id) => document.getElementById(id);
const hud = { score: $('score'), time: $('time'), hearts: $('hearts'), tickets: $('tickets'), msg: $('msg'), overlay: $('overlay'), title: $('ot'), text: $('otxt'), btn: $('obtn'), act: $('act'), lvl: $('lvl'), drop: $('drop') };
const DAY = 150;
let SLOTS = SLOT_SETS[0];
const G = { level: 1, mode: 'ready', score: 0, time: DAY, hearts: 3, customers: [], nextSpawn: 1, served: 0, paused: false, best: 0, maxLevel: 1 };
const skinC = [0xf1c27d, 0xc68642, 0xe0ac69, 0xffdbac];
const shirtC = [0xd96c6c, 0x6c9fd9, 0x8fc48a, 0xe8b84a, 0x9b7fd1];
const hairC = [0x2b1d14, 0x5a3825, 0xc9a24a, 0x111111];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function say(t) { hud.msg.textContent = tr(t); }

function resetGame() {
  G.customers.forEach((c) => scene.remove(c.mesh));
  G.customers = [];
  applyLevel(G.level);
  hud.lvl.value = String(G.level);
  Object.assign(G, { mode: 'playing', score: 0, time: DAY, hearts: 3, nextSpawn: 1, served: 0 });
  setHeld(null);
  P.pos.set(0, 0, -3.8);
  P.goal = P.pending = null;
  for (const s of [machineSt, ovenSt, milkSt, chocoSt]) {
    s.data = {};
    if (s.cupSlot.children[0]) s.cupSlot.remove(s.cupSlot.children[0]);
    s.bar.visible = false;
  }
  hud.overlay.style.display = 'none';
  say('Pegue um copo, passe na máquina e entregue o pedido certo!');
  bridge.platform.sendMessage('level_started');
  renderHud();
}

function endGame(win, reason) {
  G.mode = 'over';
  bridge.platform.sendMessage(win ? 'level_completed' : 'level_failed');
  const isBest = G.score > G.best;
  if (isBest) {
    G.best = G.score;
    bridge.storage.set(['best_score'], [String(G.best)]).catch(() => {});
  }
  hud.overlay.style.display = 'flex';
  hud.title.textContent = tr(win ? 'Expediente concluído! 🌟' : 'Game over 💥');
  const stats = lang === 'pt'
    ? `Pontos: ${G.score} · Pedidos entregues: ${G.served} · Recorde: ${G.best}`
    : `Score: ${G.score} · Orders served: ${G.served} · Best: ${G.best}`;
  hud.text.textContent = `${reason}\n${stats}`;
  hud.btn.textContent = tr('Jogar de novo');
  if (win && G.level < LEVELS.length) {
    G.level++;
    G.maxLevel = Math.max(G.maxLevel, G.level);
    bridge.storage.set(['max_level'], [String(G.maxLevel)]).catch(() => {});
    hud.text.textContent += lang === 'pt' ? `\nNível ${G.level}: nova cafeteria com ${SLOT_SETS[LEVELS[G.level - 1].slots].length} clientes ao mesmo tempo!` : `\nLevel ${G.level}: a new café with ${SLOT_SETS[LEVELS[G.level - 1].slots].length} customers at once!`;
    hud.btn.textContent = tr('Próximo nível');
  }
  if (bridge.advertisement.isInterstitialSupported) bridge.advertisement.showInterstitial('game_over');
}

function spawnCustomer() {
  const slot = SLOTS.findIndex((_, i) => !G.customers.some((c) => c.slot === i));
  if (slot < 0) return;
  const type = pick(level === 1 ? ['espresso', 'espresso', 'latte', 'croissant'] : ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant']);
  const mesh = makePerson(pick(shirtC), pick(skinC), pick(hairC));
  mesh.position.set(6, 0, 4);
  const bubble = makeBubble(RECIPES[type].icon);
  bubble.position.y = 3.0;
  bubble.visible = false;
  mesh.add(bubble);
  scene.add(mesh);
  G.customers.push({ mesh, bubble, slot, type, state: 'walking', patience: LEVELS[level - 1].patience, max: LEVELS[level - 1].patience, leaving: false });
}

function makeBubble(icon) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(64, 60, 52, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(50, 105); c.lineTo(64, 126); c.lineTo(78, 105);
  c.fill();
  c.font = '64px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(icon, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
  s.scale.set(1.5, 1.5, 1);
  s.renderOrder = 10;
  return s;
}

function renderHud() {
  hud.score.textContent = G.score;
  hud.time.textContent = Math.max(0, Math.ceil(G.time));
  hud.hearts.textContent = '❤️'.repeat(G.hearts) + '🖤'.repeat(3 - G.hearts);
  hud.tickets.innerHTML = G.customers
    .filter((c) => c.state === 'waiting')
    .map((c) => {
      const pct = Math.max(0, (c.patience / c.max) * 100);
      const col = pct > 50 ? '#4cd964' : pct > 25 ? '#ffcc00' : '#ff4d4d';
      return `<div class="ticket"><b>${RECIPES[c.type].icon} ${RECIPES[c.type].label}</b><i><u style="width:${pct}%;background:${col}"></u></i></div>`;
    })
    .join('');
}

// ---------- interaction ----------
function distTo(s) {
  const dx = Math.max(0, Math.abs(P.pos.x - s.pos.x) - s.hw);
  return Math.hypot(dx, P.pos.z - s.pos.z);
}
function nearest() {
  let best = null, bd = 2.5;
  for (const s of Object.values(stations)) {
    if (s.key === 'serve' || s.hidden) continue;
    const d = distTo(s);
    if (d < bd) { bd = d; best = s; }
  }
  if (best && P.pos.z < -2.95) return best;
  return distTo(stations.serve) < 2.0 ? stations.serve : best;
}

function interact(s) {
  if (G.mode !== 'playing' || !s) return;
  const h = P.held;
  switch (s.key) {
    case 'cups':
      if (h === 'cup') { setHeld(null); say('Copo devolvido.'); break; }
      if (h) return say('Suas mãos estão ocupadas.');
      setHeld('cup'); say('Copo na mão → leve à máquina de ESPRESSO (ou ao LEITE para latte).');
      break;
    case 'espresso': {
      const d = s.data;
      if (!d.state && (h === 'cup' || h === 'milkcup')) {
        d.milk = h === 'milkcup';
        setHeld(null);
        d.state = 'brewing'; d.t = 0;
        s.cupSlot.add(makeItem(d.milk ? 'milkcup' : 'cup'));
        say('Preparando espresso…');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        if (d.milk) { setHeld('latte'); say('Latte pronto! Entregue no balcão.'); break; }
        setHeld('espresso'); say('Espresso pronto! Entregue no balcão ou leve ao LEITE para fazer latte.');
      } else if (!d.state) say('Coloque um copo aqui.');
      break;
    }
    case 'milk': {
      const d = s.data;
      if (!d.state && (h === 'cup' || h === 'espresso')) {
        d.item = h;
        setHeld(null);
        d.state = 'steaming'; d.t = 0;
        s.cupSlot.add(makeItem(h));
        say('Vaporizando o leite…');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        if (d.item === 'espresso') { setHeld('latte'); say('Latte pronto! Entregue no prato do cliente.'); }
        else { setHeld('latte'); say('Latte pronto! Entregue no prato do cliente.'); }
      } else if (!d.state) say('Leite precisa de um copo ou espresso na mão.');
      break;
    }
    case 'dough':
      if (h === 'dough') { setHeld(null); say('Massa devolvida.'); break; }
      if (h) return say('Suas mãos estão ocupadas.');
      setHeld('dough'); say('Massa na mão → leve ao FORNO e espere assar.');
      break;
    case 'oven': {
      const d = s.data;
      if (!d.state && h === 'dough') {
        setHeld(null);
        d.state = 'baking'; d.t = 0;
        s.cupSlot.add(makeItem('dough'));
        say('Assando… não deixe queimar!');
      } else if ((d.state === 'done' || d.state === 'burnt') && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        const burnt = d.state === 'burnt';
        d.state = null; s.bar.visible = false;
        setHeld(burnt ? 'burnt' : 'croissant');
        say(burnt ? 'Queimou! Jogue no lixo.' : 'Croissant pronto! Entregue no balcão.');
      } else if (!d.state) say('Coloque massa aqui.');
      break;
    }
    case 'choco': {
      const d = s.data;
      if (!d.state && ['espresso', 'latte', 'croissant'].includes(h)) {
        d.item = h;
        setHeld(null);
        d.state = 'dipping'; d.t = 0;
        s.cupSlot.add(makeItem(h));
        say('Adicionando chocolate…');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld({ espresso: 'mocha', latte: 'mochalatte', croissant: 'chococroissant' }[d.item]);
        say('Pronto! Entregue no prato do cliente.');
      } else if (!d.state) say('Chocolate precisa de espresso, latte ou croissant na mão.');
      break;
    }
    case 'trash':
      if (h) { setHeld(null); say('Descartado.'); }
      break;
    case 'serve': {
      if (!h) return say('Você não está segurando nada.');
      const target = G.customers
        .filter((c) => c.state === 'waiting' && Math.abs(SLOTS[c.slot] - P.pos.x) < (SLOTS[1] - SLOTS[0]) / 2 + 0.1)
        .sort((x, y) => Math.abs(SLOTS[x.slot] - P.pos.x) - Math.abs(SLOTS[y.slot] - P.pos.x))[0];
      if (!target) return say('Coloque o pedido no prato em frente a um cliente.');
      if (target.type !== h) {
        G.hearts--;
        setHeld(null);
        say('Pedido errado! Você perdeu um coração.');
        if (G.hearts <= 0) endGame(false, lang === 'pt' ? 'Você errou pedidos demais.' : 'Too many wrong orders.');
        break;
      }
      const bonus = Math.round((target.patience / target.max) * 10);
      G.score += 10 + bonus;
      G.served++;
      setHeld(null);
      target.state = 'leaving';
      target.bubble.visible = false;
      say(lang === 'pt' ? `Entregue! +${10 + bonus} pontos` : `Served! +${10 + bonus} points`);
      break;
    }
  }
  renderHud();
}

// ---------- input ----------
function dropHeld() {
  if (G.mode !== 'playing' || !P.held) return;
  setHeld(null);
  say('Item descartado.');
}
const keys = new Set();
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
renderer.domElement.addEventListener('pointerdown', (e) => {
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
      P.goal = new THREE.Vector3(s.key === 'serve' ? SLOTS.reduce((m, x) => (Math.abs(x - h.point.x) < Math.abs(m - h.point.x) ? x : m), SLOTS[1]) : s.pos.x, 0, s.key === 'trash' ? SZ + 1.3 : s.key === 'serve' ? -2.7 : -3.9);
      return;
    }
  }
  const p = new THREE.Vector3();
  if (ray.ray.intersectPlane(floorPlane, p)) {
    // keep the target inside the walkable area behind the counter
    p.x = THREE.MathUtils.clamp(p.x, -5.2, 5.2);
    p.z = THREE.MathUtils.clamp(p.z, -4.5, -2.6);
    P.goal = p; P.pending = null;
  }
});

// ---------- loop ----------
const clock = new THREE.Clock();
const dirV = new THREE.Vector3();
function clampPlayer() {
  P.pos.x = THREE.MathUtils.clamp(P.pos.x, -5.2, 5.2);
  P.pos.z = THREE.MathUtils.clamp(P.pos.z, -4.5, -2.6);
}

function updateStation(s, dt, t, doneAt, burnAt) {
  const d = s.data;
  if (!d.state) { s.bar.visible = false; return; }
  s.bar.visible = true;
  if (d.state === 'brewing' || d.state === 'baking' || d.state === 'steaming' || d.state === 'dipping') {
    d.t += dt;
    s.bar.scale.x = Math.max(0.01, (d.t / doneAt) * 1.2);
    s.bar.position.x = s.pos.x - 0.6 + s.bar.scale.x / 2;
    s.bar.material.color.setHex(0x4cd964);
    if (d.t >= doneAt) {
      d.state = 'done'; d.t = 0;
      s.cupSlot.remove(s.cupSlot.children[0]);
      s.cupSlot.add(makeItem(s.key === 'choco' ? { espresso: 'mocha', latte: 'mochalatte', croissant: 'chococroissant' }[d.item] : s.key === 'espresso' ? (d.milk ? 'latte' : 'espresso') : s.key === 'milk' ? 'latte' : 'croissant'));
      say(s.key === 'choco' ? 'Chocolate pronto!' : s.key === 'espresso' ? 'Espresso pronto!' : s.key === 'milk' ? 'Leite pronto!' : 'Croissant pronto! Pegue no forno antes de queimar.');
    }
  } else if (d.state === 'done' && burnAt) {
    d.t += dt;
    s.bar.scale.x = Math.max(0.01, (1 - d.t / burnAt) * 1.2);
    s.bar.position.x = s.pos.x - 0.6 + s.bar.scale.x / 2;
    s.bar.material.color.setHex(Math.floor(t * 6) % 2 ? 0xff4d4d : 0xffcc00);
    if (d.t >= burnAt) {
      d.state = 'burnt';
      s.cupSlot.remove(s.cupSlot.children[0]);
      s.cupSlot.add(makeItem('burnt'));
      s.bar.visible = false;
      say('O croissant queimou!');
    }
  } else if (d.state === 'done') {
    s.bar.scale.x = 1.2;
    s.bar.position.x = s.pos.x;
    s.bar.material.color.setHex(0x4cd964);
  }
}

function tick() {
  const dt = G.paused ? (clock.getDelta(), 0) : Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (G.mode === 'playing') {
    // player movement
    dirV.set(0, 0, 0);
    if (keys.has('w') || keys.has('arrowup')) dirV.z -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dirV.z += 1;
    if (keys.has('a') || keys.has('arrowleft')) dirV.x -= 1;
    if (keys.has('d') || keys.has('arrowright')) dirV.x += 1;
    // screen-aligned controls for the iso camera (rotated 45deg)
    if (dirV.lengthSq()) dirV.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    else if (P.goal) {
      dirV.copy(P.goal).sub(P.pos);
      dirV.y = 0;
      if (dirV.length() < 0.12) {
        P.goal = null;
        if (P.pending) { const s = P.pending; P.pending = null; interact(s); }
        dirV.set(0, 0, 0);
      }
    }
    const moving = dirV.lengthSq() > 0.0001;
    if (moving) {
      dirV.normalize();
      P.pos.addScaledVector(dirV, 5.2 * dt);
      clampPlayer();
      player.rotation.y = Math.atan2(dirV.x, dirV.z);
    }
    player.position.set(P.pos.x, moving ? Math.abs(Math.sin(t * 14)) * 0.05 : 0, P.pos.z);
    animatePerson(player, moving, t, !!P.held);
    const near = nearest();
    if (!moving && near) {
      const tx = near.key === 'serve' ? P.pos.x : near.pos.x;
      const want = Math.atan2(tx - P.pos.x, near.pos.z - P.pos.z);
      let diff = Math.atan2(Math.sin(want - player.rotation.y), Math.cos(want - player.rotation.y));
      player.rotation.y += diff * Math.min(1, dt * 12);
    }
    for (const s of Object.values(stations)) s.ring.material.opacity = s === near ? 0.35 + Math.sin(t * 6) * 0.1 : 0;

    // stations
    updateStation(machineSt, dt, t, 4, 0);
    updateStation(milkSt, dt, t, 3, 0);
    updateStation(ovenSt, dt, t, 5, 6);
    updateStation(chocoSt, dt, t, 2.5, 0);
    ovenGlass.material.emissive.setHex(ovenSt.data.state === 'baking' ? 0xff6a00 : 0x000000);
    ovenGlass.material.emissiveIntensity = 0.6;

    // time & spawn
    G.time -= dt;
    G.nextSpawn -= dt;
    if (G.nextSpawn <= 0 && G.customers.filter((c) => !c.leaving).length < SLOTS.length) {
      spawnCustomer();
      const [lo, hi] = LEVELS[level - 1].spawn;
      G.nextSpawn = lo + Math.random() * (hi - lo);
    }
    if (G.time <= 0) endGame(true, tr('O dia acabou!'));
  }

  // customers
  for (let i = G.customers.length - 1; i >= 0; i--) {
    const c = G.customers[i];
    const dest = c.state === 'leaving' ? new THREE.Vector3(6, 0, 4) : new THREE.Vector3(SLOTS[c.slot], 0, -0.4);
    const d = dest.clone().sub(c.mesh.position);
    d.y = 0;
    if (d.length() > 0.08) {
      c.mesh.position.addScaledVector(d.normalize(), 2.4 * dt);
      c.mesh.position.y = Math.abs(Math.sin(t * 10)) * 0.05;
      c.mesh.rotation.y = Math.atan2(d.x, d.z);
      animatePerson(c.mesh, true, t);
    } else if (c.state === 'walking') {
      c.state = 'waiting';
      c.bubble.visible = true;
      c.mesh.rotation.y = Math.PI;
      renderHud();
    } else if (c.state === 'leaving') {
      c.leaving = true;
      scene.remove(c.mesh);
      G.customers.splice(i, 1);
      renderHud();
      continue;
    }
    if (c.state === 'waiting') animatePerson(c.mesh, false, t);
    if (c.state === 'waiting' && G.mode === 'playing') {
      c.patience -= dt;
      c.bubble.position.y = 3.0 + Math.sin(t * 3) * 0.06;
      if (c.patience <= 0) {
        c.state = 'leaving';
        c.bubble.visible = false;
        G.hearts--;
        say('Um cliente cansou de esperar! 💔');
        if (G.hearts <= 0) endGame(false, tr('Clientes demais foram embora.'));
      }
    }
  }
  if (G.mode === 'playing') renderHud();
  renderer.render(scene, camera);
  if (!readySent) {
    readySent = true;
    bridge.platform.sendMessage('game_ready');
  }
  requestAnimationFrame(tick);
}
let readySent = false;

addEventListener('resize', () => {
  camera.left = -frustum * aspect();
  camera.right = frustum * aspect();
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

hud.act.textContent = tr('AÇÃO');
hud.drop.textContent = tr('SOLTAR');
hud.msg.textContent = tr('Pronto?');
hud.overlay.style.display = 'flex';
hud.title.textContent = 'Cozy Café ';
hud.text.textContent = tr('Anote os pedidos, prepare e entregue no balcão.\nWASD/setas: mover · Espaço/E: interagir · Q: soltar item · ou clique nas estações.\nItem errado custa um coração. Sem corações, game over!');
hud.btn.textContent = tr('Começar');

// The game has no audio yet; pause is the only host state to honor.
bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (p) => (G.paused = !!p));

bridge.storage
  .get(['best_score', 'max_level'])
  .then((d) => {
    G.best = Number(d?.[0]) || 0;
    G.maxLevel = Math.min(LEVELS.length, Number(d?.[1]) || 1);
    G.level = G.maxLevel;
    applyLevel(G.level);
    hud.lvl.value = String(G.level);
  })
  .catch(() => {})
  .then(tick);

if (new URLSearchParams(location.search).has('debug')) window.__cafe = { applyLevel, G, P, stations, interact, resetGame, keys, setHeld, spawnCustomer };
