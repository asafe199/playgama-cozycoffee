import { Vector3 } from 'three';
import { LEVELS, SLOT_SETS } from './levels.js';

export const DAY = 150;

export let level = 1;
export let SLOTS = SLOT_SETS[0];
export const BOUNDS = { minX: -5.2, maxX: 5.2, minZ: -4.5, maxZ: -2.3 };
export function setLevel(n) {
  level = n;
  BOUNDS.minX = n >= 3 ? -5.7 : -5.2;
  BOUNDS.maxX = n >= 4 ? 9.3 : n >= 3 ? 5.7 : 5.2;
  SLOTS = SLOT_SETS[LEVELS[n - 1].slots];
}

export const G = { level: 1, mode: 'ready', score: 0, time: DAY, hearts: 3, customers: [], nextSpawn: 1, served: 0, paused: false, best: 0, maxLevel: 1 };
export const P = { pos: new Vector3(0, 0, -3.8), goal: null, pending: null, held: null, heldMesh: null };

export const skinC = [0xf1c27d, 0xc68642, 0xe0ac69, 0xffdbac];
export const shirtC = [0xd96c6c, 0x6c9fd9, 0x8fc48a, 0xe8b84a, 0x9b7fd1];
export const hairC = [0x2b1d14, 0x5a3825, 0xc9a24a, 0x111111];
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
