import * as THREE from 'three';
import bridge from '@playgama/bridge';
import { lang, tr } from '../model/i18n.js';
import { RECIPES, ORDER_POOLS } from '../model/recipes.js';
import { LEVELS, SLOT_SETS } from '../model/levels.js';
import { G, P, DAY, level, SLOTS, setLevel, skinC, shirtC, hairC, pick } from '../model/state.js';
import { scene, renderer, camera } from '../view/scene.js';
import { makeItem } from '../view/items.js';
import { makePerson, animatePerson } from '../view/people.js';
import { applyRoomTheme } from '../view/room.js';
import {
  stations, machineSt, milkSt, ovenSt, chocoSt, honeySt, ovenGlass, applyStationLevel,
} from '../view/stations.js';
import { hud, say, renderHud, makeTag, makeBubble, refreshGuide } from '../view/hud.js';
import { setupInput, keys } from './input.js';

// ---------- player ----------
const player = makePerson(0x2f6f8f, 0xf1c27d, 0x2b1d14, true);
scene.add(player);

function setHeld(type) {
  if (P.heldMesh) player.remove(P.heldMesh);
  P.held = type;
  P.heldMesh = null;
  if (type) {
    P.heldMesh = makeItem(type);
    P.heldMesh.position.set(0, 1.05, 0.62);
    player.add(P.heldMesh);
    const names = lang === 'pt'
      ? { cup: 'Copo vazio', milkcup: 'Copo com leite', espresso: 'Espresso', latte: 'Latte', dough: 'Massa', croissant: 'Croissant', mocha: 'Mocha', mochalatte: 'Mocha Latte', chococroissant: 'Croissant de chocolate', honeylatte: 'Honey Latte', wafflehoney: 'Waffle com Mel' }
      : { cup: 'Empty cup', milkcup: 'Cup with milk', espresso: 'Espresso', latte: 'Latte', dough: 'Dough', croissant: 'Croissant', mocha: 'Mocha', mochalatte: 'Mocha Latte', chococroissant: 'Choco croissant', honeylatte: 'Honey Latte', wafflehoney: 'Waffle with Honey' };
    const tag = makeTag(names[type]);
    tag.position.set(0, 2.9, 0);
    tag.scale.set(1.6, 0.45, 1);
    P.heldMesh.add(tag);
    tag.position.set(0, 1.85 - 0, -0.62);
  }
}

// ---------- level composition ----------
function applyLevel(n) {
  setLevel(n);
  applyRoomTheme(n);
  applyStationLevel(n);
  refreshGuide();
}

// ---------- game flow ----------
function resetGame() {
  G.customers.forEach((c) => scene.remove(c.mesh));
  G.customers = [];
  applyLevel(G.level);
  hud.lvl.value = String(G.level);
  Object.assign(G, { mode: 'playing', score: 0, time: DAY, hearts: LEVELS[G.level - 1].hearts, nextSpawn: 1, served: 0 });
  setHeld(null);
  P.pos.set(0, 0, -3.8);
  P.goal = P.pending = null;
  for (const s of [machineSt, ovenSt, milkSt, chocoSt, honeySt]) {
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
  const type = pick(ORDER_POOLS[level - 1]);
  const mesh = makePerson(pick(shirtC), pick(skinC), pick(hairC));
  mesh.position.set(6, 0, 4);
  const bubble = makeBubble(RECIPES[type].icon);
  bubble.position.y = 3.0;
  bubble.visible = false;
  mesh.add(bubble);
  const xBubble = makeBubble('❌');
  xBubble.position.y = 3.0;
  xBubble.visible = false;
  mesh.add(xBubble);
  scene.add(mesh);
  G.customers.push({ mesh, bubble, xBubble, slot, type, state: 'walking', patience: LEVELS[level - 1].patience, max: LEVELS[level - 1].patience, leaving: false, wrongFlash: 0 });
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
      } else if (!d.state && (h === 'espresso' || h === 'latte')) {
        d.milk = h === 'latte';
        s.cupSlot.add(makeItem(h));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
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
      } else if (!d.state && h === 'latte') {
        s.cupSlot.add(makeItem('latte'));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
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
        say('Assando…');
      } else if (!d.state && h === 'croissant') {
        s.cupSlot.add(makeItem('croissant'));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld('croissant');
        say('Croissant pronto! Entregue no balcão.');
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
      } else if (!d.state && ['mocha', 'mochalatte', 'chococroissant'].includes(h)) {
        d.item = { mocha: 'espresso', mochalatte: 'latte', chococroissant: 'croissant' }[h];
        s.cupSlot.add(makeItem(h));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld({ espresso: 'mocha', latte: 'mochalatte', croissant: 'chococroissant' }[d.item]);
        say('Pronto! Entregue no prato do cliente.');
      } else if (!d.state) say('Chocolate precisa de espresso, latte ou croissant na mão.');
      break;
    }
    case 'honey': {
      const d = s.data;
      if (!d.state && ['latte', 'croissant'].includes(h)) {
        d.item = h;
        setHeld(null);
        d.state = 'dipping'; d.t = 0;
        s.cupSlot.add(makeItem(h));
        say('Adicionando mel…');
      } else if (!d.state && ['honeylatte', 'wafflehoney'].includes(h)) {
        d.item = { honeylatte: 'latte', wafflehoney: 'croissant' }[h];
        s.cupSlot.add(makeItem(h));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld({ latte: 'honeylatte', croissant: 'wafflehoney' }[d.item]);
        say('Pronto! Entregue no prato do cliente.');
      } else if (!d.state) say('Mel precisa de latte ou croissant na mão.');
      break;
    }
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
        target.bubble.visible = false;
        target.xBubble.visible = true;
        target.wrongFlash = 1.2;
        if (G.hearts <= 0) endGame(false, lang === 'pt' ? 'Você errou pedidos demais.' : 'Too many wrong orders.');
        break;
      }
      const bonus = Math.round((target.patience / target.max) * 10);
      G.score += 10 + bonus;
      G.served++;
      setHeld(null);
      target.state = 'leaving';
      target.bubble.visible = false;
      target.xBubble.visible = false;
      say(lang === 'pt' ? `Entregue! +${10 + bonus} pontos` : `Served! +${10 + bonus} points`);
      break;
    }
  }
  renderHud();
}

function dropHeld() {
  if (G.mode !== 'playing' || !P.held) return;
  setHeld(null);
  say('Item descartado.');
}

setupInput({ interact, dropHeld, nearest, resetGame });

// ---------- loop ----------
const clock = new THREE.Clock();
const dirV = new THREE.Vector3();
function clampPlayer() {
  P.pos.x = THREE.MathUtils.clamp(P.pos.x, -5.2, 5.2);
  P.pos.z = THREE.MathUtils.clamp(P.pos.z, -4.5, -2.3);
}

function updateStation(s, dt, doneAt) {
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
      s.cupSlot.add(makeItem(s.key === 'choco' ? { espresso: 'mocha', latte: 'mochalatte', croissant: 'chococroissant' }[d.item] : s.key === 'honey' ? { latte: 'honeylatte', croissant: 'wafflehoney' }[d.item] : s.key === 'espresso' ? (d.milk ? 'latte' : 'espresso') : s.key === 'milk' ? 'latte' : 'croissant'));
      say(s.key === 'choco' ? 'Chocolate pronto!' : s.key === 'honey' ? 'Mel pronto!' : s.key === 'espresso' ? 'Espresso pronto!' : s.key === 'milk' ? 'Leite pronto!' : 'Croissant pronto! Pegue no forno.');
    }
  } else if (d.state === 'done') {
    s.bar.scale.x = 1.2;
    s.bar.position.x = s.pos.x;
    s.bar.material.color.setHex(0x4cd964);
  }
}

let readySent = false;
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
    updateStation(machineSt, dt, 4);
    updateStation(milkSt, dt, 3);
    updateStation(ovenSt, dt, 5);
    updateStation(chocoSt, dt, 2.5);
    updateStation(honeySt, dt, 2.5);
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
      c.xBubble.position.y = c.bubble.position.y;
      if (c.wrongFlash > 0) {
        c.wrongFlash -= dt;
        if (c.wrongFlash <= 0) { c.xBubble.visible = false; c.bubble.visible = true; }
      }
      if (c.patience <= 0) {
        c.state = 'leaving';
        c.bubble.visible = false;
        c.xBubble.visible = false;
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
