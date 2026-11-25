import * as THREE from 'three';
import { lang, tr } from '../model/i18n.js';
import { level, G } from '../model/state.js';
import { RECIPES } from '../model/recipes.js';
import { LEVELS } from '../model/levels.js';

const $ = (id) => document.getElementById(id);
export const hud = { score: $('score'), time: $('time'), hearts: $('hearts'), tickets: $('tickets'), msg: $('msg'), overlay: $('overlay'), title: $('ot'), text: $('otxt'), btn: $('obtn'), act: $('act'), lvl: $('lvl'), drop: $('drop') };

export function say(t) { hud.msg.textContent = tr(t); }

export function renderHud() {
  hud.score.textContent = G.score;
  hud.time.textContent = Math.max(0, Math.ceil(G.time));
  hud.hearts.textContent = '❤️'.repeat(G.hearts) + '🖤'.repeat(Math.max(0, LEVELS[G.level - 1].hearts - G.hearts));
  hud.tickets.innerHTML = G.customers
    .filter((c) => c.state === 'waiting')
    .map((c) => {
      const pct = Math.max(0, (c.patience / c.max) * 100);
      const col = pct > 50 ? '#4cd964' : pct > 25 ? '#ffcc00' : '#ff4d4d';
      return `<div class="ticket"><b>${RECIPES[c.type].icon} ${RECIPES[c.type].label}</b><i><u style="width:${pct}%;background:${col}"></u></i></div>`;
    })
    .join('');
}

// station/held-item name tag (canvas sprite)
export function makeTag(text) {
  const cv = document.createElement('canvas');
  cv.width = 320; cv.height = 90;
  const c = cv.getContext('2d');
  c.fillStyle = '#fffaf0';
  c.beginPath(); c.roundRect(4, 4, 312, 82, 24); c.fill();
  c.lineWidth = 5; c.strokeStyle = '#c0392b'; c.stroke();
  c.fillStyle = '#4a3426';
  c.font = `bold ${Array.from(text).length > 13 ? 26 : 40}px system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 160, 48);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
  s.scale.set(1.7, 0.48, 1);
  s.renderOrder = 11;
  return s;
}

// customer order speech bubble (canvas sprite)
export function makeBubble(icon) {
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
  c.font = `${Array.from(icon).length > 1 ? 44 : 64}px serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(icon, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
  s.scale.set(1.5, 1.5, 1);
  s.renderOrder = 10;
  return s;
}

// recipe card
const guide = document.createElement('div');
guide.className = 'pill';
guide.style.cssText = 'position:fixed;left:10px;bottom:60px;font-size:13px;line-height:1.7;font-weight:600';
guide.innerHTML = lang === 'pt'
  ? '<b>Receitas</b><br>Espresso: Copo → Máquina (espere) → pegue → entregue<br>Latte: Copo → Leite → entregue<br> Croissant: Massa → Forno (espere, não queime!) → pegue → entregue'
  : '<b>Recipes</b><br>Espresso: Cup → Machine (wait) → pick up → serve<br>Latte: Cup → Milk → serve<br> Croissant: Dough → Oven (wait, don\'t burn!) → pick up → serve';
document.body.appendChild(guide);

export function refreshGuide() {
  const l2 = level >= 2, l3 = level >= 3;
  guide.innerHTML = lang === 'pt'
    ? '<b>Receitas</b><br>Espresso: Copo → Máquina → entregue<br>Latte: Copo → Leite → entregue<br>Croissant: Massa → Forno (não queime!) → entregue' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '') + (l3 ? '<br>Honey Latte: Latte → Mel<br>Waffle com Mel: Croissant → Mel' : '')
    : '<b>Recipes</b><br>Espresso: Cup → Machine → serve<br>Latte: Cup → Milk → serve<br>Croissant: Dough → Oven (don\'t burn!) → serve' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '') + (l3 ? '<br>Honey Latte: Latte → Honey<br>Waffle with Honey: Croissant → Honey' : '');
}

hud.act.textContent = tr('AÇÃO');
hud.drop.textContent = tr('SOLTAR');
hud.msg.textContent = tr('Pronto?');
hud.overlay.style.display = 'flex';
hud.title.textContent = 'Cozy Café ';
hud.text.textContent = tr('Anote os pedidos, prepare e entregue no balcão.\nWASD/setas: mover · Espaço/E: interagir · Q: soltar item · ou clique nas estações.\nItem errado custa um coração. Sem corações, game over!');
hud.btn.textContent = tr('Começar');
