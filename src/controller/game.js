import { playRandomMusic, stopMusic, setPlatformAudio } from './music.js';
import * as THREE from 'three';
import bridge from '@playgama/bridge';
import { tr, L } from '../model/i18n.js';
import { ITEM_NAMES } from '../model/names.js';
import { RECIPES, ORDER_POOLS } from '../model/recipes.js';
import { LEVELS, SLOT_SETS } from '../model/levels.js';
import { G, P, BOUNDS, DAY, level, SLOTS, setLevel, skinC, shirtC, hairC, pick } from '../model/state.js';
import { scene, renderer, camera, setZoom } from '../view/scene.js';
import { makeItem } from '../view/items.js';
import { makePerson, animatePerson, dressChef } from '../view/people.js';
import { applyRoomTheme, animateDiners } from '../view/room.js';
import {
  stations, machineSt, milkSt, ovenSt, chocoSt, honeySt, creamSt, waffleSt, ovenGlass, applyStationLevel,
} from '../view/stations.js';
import { profile, loadProfile, submitScore } from '../model/profile.js';
import { hud, menu, say, renderHud, makeTag, makeBubble, refreshGuide } from '../view/hud.js';
import { setupInput, keys, closePauseUI } from './input.js';
import { progressionStarted, progressionCompleted, progressionFailed } from './telemetry.js';
import { setHostPaused, setUserPaused, isUserPaused } from './pause.js';

// ---------- player ----------
const player = makePerson(0x2f6f8f, 0xf1c27d, 0x2b1d14, true);
scene.add(player);

// ---------- level 4 helper (auto-cooks orders) ----------
const HELPER_AT = 100;
const HELPER_ROUTES = {
  espresso: ['cups', 'espresso'], latte: ['cups', 'milk'], croissant: ['dough', 'oven'],
  mocha: ['cups', 'espresso', 'choco'], mochalatte: ['cups', 'milk', 'choco'], chococroissant: ['dough', 'oven', 'choco'],
  honeylatte: ['cups', 'milk', 'honey'], wafflehoney: ['waffle', 'honey'], honeyespresso: ['cups', 'espresso', 'honey'],
  creamlatte: ['cups', 'milk', 'cream'], creamwaffle: ['waffle', 'cream'], creammocha: ['cups', 'espresso', 'choco', 'cream'],
};
const helper = { route: [], step: 0, mesh: makePerson(0xc2185b, 0xe0ac69, 0x2b1d14, true), active: false, state: 'idle', target: null, t: 0, item: null, pos: new THREE.Vector3() };
helper.mesh.visible = false;
scene.add(helper.mesh);
const helperBtn = document.createElement('button');
helperBtn.className = 'pill';
helperBtn.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);border:2px solid #d4af37;cursor:pointer;font-size:15px;display:none;z-index:5';
helperBtn.textContent = tr('Chamar ajudante 🧑‍🍳');
document.body.appendChild(helperBtn);
helperBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (G.mode !== 'playing' || level < 4 || helper.active || G.time > HELPER_AT) return;
  helper.active = true;
  helper.state = 'idle';
  helper.pos.set(4.5, 0, -3.4);
  helper.mesh.visible = true;
  helperBtn.style.display = 'none';
  say('O ajudante chegou para ajudar o chefe!');
});

function resetHelper() {
  if (helper.item) helper.mesh.remove(helper.item);
  Object.assign(helper, { active: false, state: 'idle', target: null, t: 0, item: null });
  helper.mesh.visible = false;
  helperBtn.style.display = 'none';
}

function helperWalk(x, z, dt, t) {
  const d = new THREE.Vector3(x, 0, z).sub(helper.pos);
  const moving = d.length() > 0.1;
  if (moving) {
    helper.pos.addScaledVector(d.normalize(), 4.2 * dt);
    helper.mesh.rotation.y = Math.atan2(d.x, d.z);
  }
  helper.mesh.position.set(helper.pos.x, moving ? Math.abs(Math.sin(t * 14)) * 0.05 : 0, helper.pos.z);
  animatePerson(helper.mesh, moving, t, !!helper.item);
  return !moving;
}

function updateHelper(dt, t) {
  helperBtn.style.display = !helper.active && level >= 4 && G.time <= HELPER_AT ? 'block' : 'none';
  if (!helper.active) return;
  const h = helper;
  if (h.state === 'idle') {
    const c = G.customers.filter((x) => x.state === 'waiting' && !x.helped).sort((x, y) => x.patience - y.patience)[0];
    if (helperWalk(0, -4.0, dt, t) && c) { c.helped = true; h.target = c; h.state = 'cooking'; h.t = 0; h.step = 0; h.route = HELPER_ROUTES[c.type]; }
  } else if (h.state === 'cooking') {
    const c = h.target;
    if (c.state !== 'waiting') { if (h.item) h.mesh.remove(h.item); h.item = null; h.state = 'idle'; return; }
    const st = stations[h.route[h.step]];
    const arrived = helperWalk(THREE.MathUtils.clamp(st.key === 'waffle' && level < 4 ? st.pos.x + 0.7 : st.pos.x, BOUNDS.minX, BOUNDS.maxX), st.key === 'waffle' && level < 4 ? -3.0 : -4.0, dt, t);
    if (arrived) {
      h.mesh.rotation.y = Math.atan2(0, st.key === 'waffle' ? -1 : -1);
      h.t += dt;
      // working pose: arms moving over the station
      const [aL, aR] = h.mesh.userData.arms;
      aL.rotation.x = -1.1 + Math.sin(t * 14) * 0.3;
      aR.rotation.x = -1.1 - Math.sin(t * 14) * 0.3;
      if (h.t >= 1.2) {
        h.t = 0;
        const last = h.step === h.route.length - 1;
        if (h.item) h.mesh.remove(h.item);
        h.item = makeItem(last ? c.type : h.route[0] === 'dough' ? 'dough' : h.route[0] === 'waffle' ? 'waffle' : 'cup');
        h.item.position.set(0, 1.05, 0.62);
        h.mesh.add(h.item);
        if (last) h.state = 'delivering'; else h.step++;
      }
    }
  } else if (h.state === 'delivering') {
    const c = h.target;
    if (c.state !== 'waiting') { h.mesh.remove(h.item); h.item = null; h.state = 'idle'; return; }
    if (helperWalk(SLOTS[c.slot], -2.3, dt, t)) {
      const bonus = Math.round((c.patience / c.max) * 10);
      G.score += 10 + bonus;
      G.served++;
      c.state = 'leaving';
      c.bubble.visible = false;
      c.xBubble.visible = false;
      h.mesh.remove(h.item);
      h.item = null;
      h.state = 'idle';
      renderHud();
    }
  }
}

function setHeld(type) {
  if (P.heldMesh) player.remove(P.heldMesh);
  P.held = type;
  P.heldMesh = null;
  if (type) {
    P.heldMesh = makeItem(type);
    P.heldMesh.position.set(0, 1.05, 0.62);
    player.add(P.heldMesh);
    const names = ITEM_NAMES[type];
    const tag = makeTag(L(names));
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
  dressChef(player, n >= 4, n >= 5);
  if (n >= 5) setZoom(12.6, 1.4, 3.0);
  else setZoom(n >= 4 ? 10.6 : 8.2, n >= 4 ? 0.3 : -1.4, n >= 4 ? 1.7 : 0);
  refreshGuide();
}

// ---------- game flow ----------
function resetGame() {
  G.customers.forEach((c) => scene.remove(c.mesh));
  G.customers = [];
  applyLevel(G.level);
  resetHelper();
  hud.lvl.value = String(G.level);
  if (G.level === 1) G.total = G.totalServed = 0;
  Object.assign(G, { mode: 'playing', score: 0, time: DAY, hearts: LEVELS[G.level - 1].hearts, nextSpawn: 1, served: 0 });
  setHeld(null);
  setUserPaused(false);
  closePauseUI();
  hud.pause.textContent = '⏸️';
  hud.pause.style.display = 'block';
  playRandomMusic();
  P.pos.set(0, 0, -3.8);
  P.goal = P.pending = null;
  for (const s of [machineSt, ovenSt, milkSt, chocoSt, honeySt, creamSt, waffleSt]) {
    s.data = {};
    if (s.cupSlot.children[0]) s.cupSlot.remove(s.cupSlot.children[0]);
    s.bar.visible = false;
  }
  hud.overlay.style.display = 'none';
  say('Pegue um copo, passe na máquina e entregue o pedido certo!');
  bridge.platform.sendMessage('level_started');
  progressionStarted(G.level);
  renderHud();
}

function endGame(win, reason, failKey = 'walkouts') {
  const playedLevel = G.level;
  G.mode = 'over';
  helperBtn.style.display = 'none';
  hud.pause.style.display = 'none';
  bridge.platform.sendMessage(win ? 'level_completed' : 'level_failed');
  submitScore(profile.nick || L({ pt: 'Jogador', en: 'Player', es: 'Jugador', fr: 'Joueur' }), G.score);
  const isBest = G.score > G.best;
  if (isBest) {
    G.best = G.score;
    bridge.storage.set(['best_score'], [String(G.best)]).catch(() => {});
  }
  hud.overlay.style.display = 'flex';
  hud.card.className = win ? 'win' : 'lose';
  hud.icon.textContent = win ? '🏆' : '💔';
  hud.title.textContent = tr(win ? 'Expediente concluído! 🌟' : 'Game over 💥');
  const maxH = LEVELS[G.level - 1].hearts;
  const earned = win ? (G.hearts >= maxH ? 3 : G.hearts * 2 >= maxH ? 2 : 1) : 0;
  const duration = DAY - Math.max(0, G.time);
  if (win) progressionCompleted(playedLevel, { score: G.score, stars: earned, hearts_left: G.hearts, duration_sec: duration });
  else progressionFailed(playedLevel, { reason: failKey, score: G.score, duration_sec: duration });
  hud.stars.innerHTML = win ? [0, 1, 2].map((i) => `<span class="${i < earned ? '' : 'off'}" style="animation-delay:${0.25 + i * 0.18}s">⭐</span>`).join('') : '';
  hud.text.textContent = reason;
  const tile = (v, l, cls = '') => `<div class="stat ${cls}"><b>${v}</b><small>${l}</small></div>`;
  const stat = L({
    pt: { score: 'Pontos', orders: 'Pedidos', total: 'Pontos totais', best: 'Recorde', newBest: 'Novo recorde!' },
    en: { score: 'Score', orders: 'Orders', total: 'Total score', best: 'Best', newBest: 'New best!' },
    es: { score: 'Puntos', orders: 'Pedidos', total: 'Puntos totales', best: 'Récord', newBest: '¡Nuevo récord!' },
    fr: { score: 'Points', orders: 'Commandes', total: 'Points totaux', best: 'Record', newBest: 'Nouveau record !' },
  });
  hud.stats.innerHTML = tile(G.score, stat.score) + tile(G.served, stat.orders) + tile(G.best, isBest ? stat.newBest : stat.best, isBest ? 'best' : '');
  hud.next.textContent = '';
  hud.btn.textContent = tr('Jogar de novo');
  if (win && G.level < LEVELS.length) {
    G.level++;
    G.maxLevel = Math.max(G.maxLevel, G.level);
    bridge.storage.set(['max_level'], [String(G.maxLevel)]).catch(() => {});
    const n = SLOT_SETS[LEVELS[G.level - 1].slots].length;
    hud.next.textContent = L({
      pt: `Nível ${G.level}: nova cafeteria com ${n} clientes ao mesmo tempo!`,
      en: `Level ${G.level}: a new café with ${n} customers at once!`,
      es: `Nivel ${G.level}: ¡una nueva cafetería con ${n} clientes a la vez!`,
      fr: `Niveau ${G.level} : un nouveau café avec ${n} clients à la fois !`,
    });
    hud.btn.textContent = tr('Próximo nível');
  }
  if (win) {
    G.total += G.score;
    G.totalServed += G.served;
  }
  if (win && G.level >= LEVELS.length) {
    G.level = 1;
    hud.card.className = 'win';
    hud.icon.textContent = '👑';
    hud.title.textContent = L({ pt: 'Parabéns, você zerou o jogo!', en: 'Congratulations, you beat the game!', es: '¡Felicidades, has completado el juego!', fr: 'Félicitations, vous avez fini le jeu !' });
    hud.text.textContent = L({ pt: 'Você conquistou o Café Imperial! Este é o seu resultado final.', en: 'You conquered the Imperial Café! Here is your final result.', es: '¡Has conquistado el Café Imperial! Este es tu resultado final.', fr: 'Vous avez conquis le Café Impérial ! Voici votre résultat final.' });
    hud.stats.innerHTML = tile(G.total, stat.total) + tile(G.totalServed, stat.orders) + tile(G.best, stat.best, 'best');
    hud.next.textContent = L({ pt: 'Todos os 5 níveis concluídos!', en: 'All 5 levels completed!', es: '¡Los 5 niveles completados!', fr: 'Les 5 niveaux sont terminés !' });
    hud.btn.textContent = tr('Jogar de novo');
  }
  if (bridge.advertisement.isInterstitialSupported) bridge.advertisement.showInterstitial('game_over');
}

const doorX = () => (level >= 5 ? 11.7 : level >= 4 ? 9.4 : 6);
function spawnCustomer() {
  const slot = SLOTS.findIndex((_, i) => !G.customers.some((c) => c.slot === i));
  if (slot < 0) return;
  const type = pick(ORDER_POOLS[level - 1]);
  const mesh = makePerson(pick(shirtC), pick(skinC), pick(hairC), false, Math.random() < 0.5);
  mesh.position.set(doorX(), 0, 4);
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
    const d = distTo(s) * (s.key === 'waffle' ? (G.level < 4 ? 0.3 : 0.6) : 1);
    if (d < bd) { bd = d; best = s; }
  }
  if (best && P.pos.z < -2.95) return best;
  return distTo(stations.serve) < 2.0 ? stations.serve : best;
}

function interact(s) {
  if (G.mode !== 'playing' || G.paused || !s) return;
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
    case 'waffle': {
      const d = s.data;
      if (!d.state && !h) {
        d.state = 'baking'; d.t = 0;
        s.cupSlot.add(makeItem('dough'));
        say('Fazendo o waffle…');
      } else if (!d.state && h === 'waffle') {
        s.cupSlot.add(makeItem('waffle'));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld('waffle');
        say('Waffle na mão → leve ao MEL.');
      } else if (!d.state) say('Mãos livres: a máquina faz a massa de waffle sozinha.');
      break;
    }
    case 'honey': {
      const d = s.data;
      if (!d.state && ['latte', 'waffle', ...(level >= 4 ? ['espresso'] : [])].includes(h)) {
        d.item = h;
        setHeld(null);
        d.state = 'dipping'; d.t = 0;
        s.cupSlot.add(makeItem(h));
        say('Adicionando mel…');
      } else if (!d.state && ['honeylatte', 'wafflehoney', 'honeyespresso'].includes(h)) {
        d.item = { honeylatte: 'latte', wafflehoney: 'waffle', honeyespresso: 'espresso' }[h];
        s.cupSlot.add(makeItem(h));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld({ latte: 'honeylatte', waffle: 'wafflehoney', espresso: 'honeyespresso' }[d.item]);
        say('Pronto! Entregue no prato do cliente.');
      } else if (!d.state) say('Mel precisa de latte, waffle (ou espresso no nível 4) na mão.');
      break;
    }
    case 'cream': {
      const d = s.data;
      if (!d.state && ['latte', 'waffle', 'mocha'].includes(h)) {
        d.item = h;
        setHeld(null);
        d.state = 'dipping'; d.t = 0;
        s.cupSlot.add(makeItem(h));
        say('Adicionando chantilly…');
      } else if (!d.state && ['creamlatte', 'creamwaffle', 'creammocha'].includes(h)) {
        d.item = { creamlatte: 'latte', creamwaffle: 'waffle', creammocha: 'mocha' }[h];
        s.cupSlot.add(makeItem(h));
        d.state = 'done'; d.t = 0;
        setHeld(null);
        say('Item devolvido.');
      } else if (d.state === 'done' && !h) {
        s.cupSlot.remove(s.cupSlot.children[0]);
        d.state = null; s.bar.visible = false;
        setHeld({ latte: 'creamlatte', waffle: 'creamwaffle', mocha: 'creammocha' }[d.item]);
        say('Pronto! Entregue no prato do cliente.');
      } else if (!d.state) say('Chantilly precisa de latte, waffle ou mocha na mão.');
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
        if (G.hearts <= 0) endGame(false, L({ pt: 'Você errou pedidos demais.', en: 'Too many wrong orders.', es: 'Demasiados pedidos equivocados.', fr: 'Trop de mauvaises commandes.' }), 'wrong_orders');
        break;
      }
      const bonus = Math.round((target.patience / target.max) * 10);
      G.score += 10 + bonus;
      G.served++;
      setHeld(null);
      target.state = 'leaving';
      target.bubble.visible = false;
      target.xBubble.visible = false;
      say(L({ pt: `Entregue! +${10 + bonus} pontos`, en: `Served! +${10 + bonus} points`, es: `¡Servido! +${10 + bonus} puntos`, fr: `Servi ! +${10 + bonus} points` }));
      break;
    }
  }
  renderHud();
}

function dropHeld() {
  if (G.mode !== 'playing' || G.paused || !P.held) return;
  setHeld(null);
  say('Item descartado.');
}

function goMenu() {
  if (G.mode === 'playing') progressionFailed(G.level, { reason: 'abandoned', score: G.score, duration_sec: DAY - Math.max(0, G.time) });
  G.mode = 'over';
  stopMusic();
  helperBtn.style.display = 'none';
  hud.pause.style.display = 'none';
  setUserPaused(false);
  closePauseUI();
  hud.overlay.style.display = 'none';
  keys.clear();
  P.goal = P.pending = null;
  menu.show();
}
setupInput({ interact, dropHeld, nearest, resetGame, goMenu });

// ---------- loop ----------
const clock = new THREE.Clock();
const dirV = new THREE.Vector3();
function clampPlayer() {
  P.pos.x = THREE.MathUtils.clamp(P.pos.x, BOUNDS.minX, BOUNDS.maxX);
  P.pos.z = THREE.MathUtils.clamp(P.pos.z, BOUNDS.minZ, BOUNDS.maxZ);
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
      s.cupSlot.add(makeItem(s.key === 'choco' ? { espresso: 'mocha', latte: 'mochalatte', croissant: 'chococroissant' }[d.item] : s.key === 'cream' ? { latte: 'creamlatte', waffle: 'creamwaffle', mocha: 'creammocha' }[d.item] : s.key === 'honey' ? { latte: 'honeylatte', waffle: 'wafflehoney', espresso: 'honeyespresso' }[d.item] : s.key === 'waffle' ? 'waffle' : s.key === 'espresso' ? (d.milk ? 'latte' : 'espresso') : s.key === 'milk' ? 'latte' : 'croissant'));
      say(s.key === 'waffle' ? 'Waffle pronto! Pegue na máquina.' : s.key === 'choco' ? 'Chocolate pronto!' : s.key === 'cream' ? 'Chantilly pronto!' : s.key === 'honey' ? 'Mel pronto!' : s.key === 'espresso' ? 'Espresso pronto!' : s.key === 'milk' ? 'Leite pronto!' : 'Croissant pronto! Pegue no forno.');
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
    const cape = player.userData.cape;
    if (cape) {
      const k = Math.min(1, dt * 8);
      const target = moving ? 0.45 + Math.sin(t * 11) * 0.18 : 0.04;
      cape.rotation.x += (target - cape.rotation.x) * k;
      cape.rotation.z = (moving ? Math.sin(t * 7) * 0.1 : 0);
      cape.scale.x = 1 + (moving ? Math.sin(t * 9) * 0.06 : 0);
    }
    const near = nearest();
    if (!moving && near) {
      const tx = near.key === 'serve' ? P.pos.x : near.pos.x;
      const want = Math.atan2(tx - P.pos.x, near.pos.z - P.pos.z);
      let diff = Math.atan2(Math.sin(want - player.rotation.y), Math.cos(want - player.rotation.y));
      player.rotation.y += diff * Math.min(1, dt * 12);
    }
    for (const s of Object.values(stations)) s.ring.material.opacity = s === near ? 0.35 + Math.sin(t * 6) * 0.1 : 0;

    animateDiners(t);
    // stations
    updateStation(machineSt, dt, 4);
    updateStation(milkSt, dt, 3);
    updateStation(ovenSt, dt, 5);
    updateStation(chocoSt, dt, 2.5);
    updateStation(honeySt, dt, 2.5);
    updateStation(creamSt, dt, 2.5);
    updateStation(waffleSt, dt, 4);
    updateHelper(dt, t);
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
    const dest = c.state === 'leaving' ? new THREE.Vector3(doorX(), 0, 4) : new THREE.Vector3(SLOTS[c.slot], 0, -0.4);
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

bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (p) => {
  setHostPaused(p);
});
bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (on) => setPlatformAudio(!!on));

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
  .then(loadProfile)
  .then(() => menu.refresh())
  .then(tick);

if (new URLSearchParams(location.search).has('debug')) window.__cafe = { applyLevel, G, P, stations, interact, resetGame, keys, setHeld, spawnCustomer, helper, endGame, goMenu, bridge };
