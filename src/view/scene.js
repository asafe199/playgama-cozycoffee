import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9dfd2);
const aspect = () => innerWidth / innerHeight;
let frustum = 8.2;
export const camera = new THREE.OrthographicCamera(-frustum * aspect(), frustum * aspect(), frustum, -frustum, 0.1, 100);
camera.position.set(11, 14, 11);
camera.lookAt(0, 0.5, -1.4);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
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

// ---------- geometry helpers ----------
export const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, ...o });
export function add(geo, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
export const box = (w, h, d, mat, x, y, z, p, r = 0.03) => add(new RoundedBoxGeometry(w, h, d, 2, r), mat, x, y, z, p);
export const cyl = (rt, rb, h, mat, x, y, z, p, seg = 24) => add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
export const noShadow = (m) => ((m.castShadow = false), m);

export function setZoom(f, lookZ) {
  frustum = f;
  camera.position.set(11, 14, 11 + (lookZ + 1.4));
  camera.lookAt(0, 0.5, lookZ);
  camera.top = f;
  camera.bottom = -f;
  camera.left = -f * aspect();
  camera.right = f * aspect();
  camera.updateProjectionMatrix();
}

addEventListener('resize', () => {
  camera.left = -frustum * aspect();
  camera.right = frustum * aspect();
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
