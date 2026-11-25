export const THEMES = [
  { bg: 0xe9dfd2, floor: 0xb98a5e, wall: 0xf0e8dc, brick: 0xb5654a, counter: 0x6b4a33, top: 0xe9e4dc, rug: 0xd9c7ae },
  { bg: 0x2e3a44, floor: 0x55606b, wall: 0x9db5a0, brick: 0x2f3b45, counter: 0x2b2f36, top: 0xcfd3d8, rug: 0x3d7580 },
  { bg: 0x3a2a1a, floor: 0x8a6d4a, wall: 0x2e2420, brick: 0x6b4226, counter: 0x1c1410, top: 0xe8d9b5, rug: 0x7a1f2b },
  { bg: 0x141c2e, floor: 0xd8d3c8, wall: 0x1f3550, brick: 0x16263a, counter: 0x1a1d2e, top: 0xf1ece2, rug: 0x3b2a78 },
  { bg: 0x1d0f1a, floor: 0xe7dcd2, wall: 0x4a1428, brick: 0x2e0e1a, counter: 0x241014, top: 0xfaf3e6, rug: 0x8a1c3a },
];

export const LEVELS = [
  { slots: 0, spawn: [6, 10], patience: 55, hearts: 3 },
  { slots: 1, spawn: [4, 7], patience: 50, hearts: 3 },
  { slots: 2, spawn: [3, 5], patience: 45, hearts: 4 },
  { slots: 3, spawn: [3.5, 6], patience: 42, hearts: 4 },
  { slots: 4, spawn: [5.3, 7.8], patience: 41, hearts: 5 },
];

export const SLOT_SETS = [[-2.6, 0, 2.6], [-3.2, -1.6, 0, 1.6, 3.2], [-4.5, -3, -1.5, 0, 1.5, 3, 4.5], [-4.9, -3.5, -2.1, -0.7, 0.7, 2.1, 3.5, 4.9].map((x) => x + 1.5), [-5.85, -4.55, -3.25, -1.95, -0.65, 0.65, 1.95, 3.25, 4.55, 5.85].map((x) => x + 2.45)];
// x of the serving counter's center per level (levels 4-5 center it on the wider kitchen)
export const COUNTER_X = [0, 0, 0, 1.5, 2.45];
