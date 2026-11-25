import * as THREE from 'three';
import { lang, tr, setLang } from '../model/i18n.js';
import { level, G } from '../model/state.js';
import { RECIPES } from '../model/recipes.js';
import { LEVELS } from '../model/levels.js';
import { profile } from '../model/profile.js';

const $ = (id) => document.getElementById(id);
export const hud = { score: $('score'), time: $('time'), hearts: $('hearts'), tickets: $('tickets'), msg: $('msg'), overlay: $('overlay'), title: $('ot'), text: $('otxt'), btn: $('obtn'), card: $('card'), icon: $('oicon'), stars: $('ostars'), stats: $('ostats'), next: $('onext'), home: $('home'), omenu: $('omenu'), act: $('act'), lvl: $('lvl'), drop: $('drop') };

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
  ? '<b>Receitas</b><br>Espresso: Copo → Máquina (espere) → pegue → entregue<br>Latte: Copo → Leite → entregue<br> Croissant: Massa → Forno (espere) → pegue → entregue'
  : '<b>Recipes</b><br>Espresso: Cup → Machine (wait) → pick up → serve<br>Latte: Cup → Milk → serve<br> Croissant: Dough → Oven (wait) → pick up → serve';
document.body.appendChild(guide);

// on small screens the recipe card starts hidden behind a toggle button
const guideBtn = document.createElement('button');
guideBtn.className = 'pill';
guideBtn.textContent = '📖';
guideBtn.style.cssText = 'position:fixed;left:10px;bottom:14px;border:0;font-size:20px;cursor:pointer;display:none';
document.body.appendChild(guideBtn);
const compact = matchMedia('(max-width: 900px), (max-height: 520px)');
function syncGuide() {
  guideBtn.style.display = compact.matches ? 'block' : 'none';
  guide.style.display = compact.matches ? 'none' : 'block';
}
compact.addEventListener('change', syncGuide);
syncGuide();
// tapping the card or the book button opens the recipes in a large centered popup
const recipeModal = document.createElement('div');
recipeModal.style.cssText = 'position:fixed;inset:0;z-index:15;display:none;align-items:center;justify-content:center;padding:16px;background:#120a10bb;backdrop-filter:blur(3px)';
const recipeCard = document.createElement('div');
recipeCard.style.cssText = 'position:relative;width:min(560px,94vw);max-height:86vh;overflow:auto;box-sizing:border-box;padding:22px 22px 18px;border-radius:22px;background:linear-gradient(180deg,#fff8ea,#f3e2c4);border:3px solid #d4af37;box-shadow:0 24px 60px #0008;color:#4a3426;touch-action:pan-y';
const recipeClose = document.createElement('button');
recipeClose.textContent = '✕';
recipeClose.style.cssText = 'position:absolute;right:10px;top:10px;width:38px;height:38px;border:0;border-radius:50%;font-size:18px;font-weight:800;cursor:pointer;background:#7a1f2e;color:#fff';
recipeModal.append(recipeCard);
recipeCard.append(recipeClose);
const recipeBody = document.createElement('div');
recipeCard.append(recipeBody);
document.body.appendChild(recipeModal);
let pausedBefore = false;
function openRecipes() {
  const lines = guide.innerHTML.split('<br>');
  const title = lines.shift().replace(/<\/?b>/g, '');
  recipeBody.innerHTML = `<div style="font:800 28px Georgia,serif;color:#7a1f2e;margin:0 40px 12px 0">📖 ${title}</div>` + lines.map((l) => {
    const i = l.indexOf(':');
    const name = i > 0 ? l.slice(0, i) : l, steps = i > 0 ? l.slice(i + 1).trim() : '';
    return `<div style="padding:9px 12px;margin-bottom:7px;border-radius:12px;background:#fff;border:2px solid #ead7b3"><b style="font-size:clamp(17px,4.6vw,22px);color:#7a1f2e">${name}</b>${steps ? `<div style="font-size:clamp(15px,4vw,19px);margin-top:2px">${steps}</div>` : ''}</div>`;
  }).join('');
  pausedBefore = G.paused;
  G.paused = true;
  recipeModal.style.display = 'flex';
}
function closeRecipes() {
  recipeModal.style.display = 'none';
  G.paused = pausedBefore;
}
guide.style.cursor = 'pointer';
for (const el of [guide, guideBtn]) el.addEventListener('pointerdown', (e) => { e.stopPropagation(); openRecipes(); });
recipeClose.addEventListener('pointerdown', (e) => { e.stopPropagation(); closeRecipes(); });
recipeModal.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === recipeModal) closeRecipes(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && recipeModal.style.display === 'flex') closeRecipes(); });

export function refreshGuide() {
  const l2 = level >= 2, l3 = level >= 3, l4 = level >= 4, l5 = level >= 5;
  guide.innerHTML = lang === 'pt'
    ? '<b>Receitas</b><br>Espresso: Copo → Máquina → entregue<br>Latte: Copo → Leite → entregue<br>Croissant: Massa → Forno → entregue' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '') + (l3 ? '<br>Honey Latte: Latte → Mel<br>Waffle: Máquina de Waffle (mãos livres)<br>Waffle com Mel: Waffle → Mel' : '') + (l4 ? '<br>Espresso com Mel: Espresso → Mel' : '') + (l5 ? '<br>Latte com Chantilly: Latte → Chantilly<br>Waffle com Chantilly: Waffle → Chantilly<br>Mocha com Chantilly: Mocha → Chantilly' : '')
    : '<b>Recipes</b><br>Espresso: Cup → Machine → serve<br>Latte: Cup → Milk → serve<br>Croissant: Dough → Oven → serve' + (l2 ? '<br>Mocha: Espresso → Chocolate<br>Mocha Latte: Latte → Chocolate<br>Choco Croissant: Croissant → Chocolate' : '') + (l3 ? '<br>Honey Latte: Latte → Honey<br>Waffle: Waffle Maker (empty hands)<br>Waffle with Honey: Waffle → Honey' : '') + (l4 ? '<br>Honey Espresso: Espresso → Honey' : '') + (l5 ? '<br>Cream Latte: Latte → Cream<br>Waffle with Cream: Waffle → Cream<br>Cream Mocha: Mocha → Cream' : '');
}

hud.act.textContent = tr('AÇÃO');
hud.drop.textContent = tr('SOLTAR');
hud.msg.textContent = tr('Pronto?');
hud.overlay.style.display = 'none';
hud.title.textContent = 'Royal Coffee';
hud.text.textContent = tr('Anote os pedidos, prepare e entregue no balcão.\nWASD/setas: mover · Espaço/E: interagir · Q: soltar item · ou clique nas estações.\nItem errado custa um coração. Sem corações, game over!');
hud.btn.textContent = tr('Começar');

// ---------- main menu ----------
const pt = lang === 'pt';
const menuRoot = document.createElement('div');
menuRoot.style.cssText = 'position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;text-align:center;color:#fff;background:radial-gradient(ellipse at 50% 35%,#3b2a78 0%,#1a1030 60%,#0d0a1a 100%)';
const menuTitle = document.createElement('h1');
menuTitle.textContent = 'Royal Coffee';
menuTitle.style.cssText = 'margin:0;font-size:clamp(38px,9vw,72px);letter-spacing:2px;font-family:Georgia,serif;color:#ffd97a;text-shadow:0 0 24px #d4af37aa,0 3px 0 #7a5a12';
const menuSub = document.createElement('div');
menuSub.textContent = '☕ 👑 🥐';
menuSub.style.cssText = 'font-size:32px;margin-bottom:10px';
const btnCss = 'font-size:20px;font-weight:800;padding:12px 0;width:min(260px,70vw);border:0;border-radius:14px;cursor:pointer;color:#4a3426;background:#ffd54a;box-shadow:0 4px 0 #b8902a';
const startBtn = document.createElement('button');
startBtn.textContent = pt ? 'Iniciar' : 'Start';
startBtn.style.cssText = btnCss;
const howBtn = document.createElement('button');
howBtn.textContent = pt ? 'Instruções' : 'Instructions';
howBtn.style.cssText = btnCss + ';background:#f3e9ff;box-shadow:0 4px 0 #9b86c9';
const rankBtn = document.createElement('button');
rankBtn.textContent = pt ? '🏆 Ranking' : '🏆 Rank';
rankBtn.style.cssText = btnCss + ';background:#ffe9a8;box-shadow:0 4px 0 #c79a2a';
const langBtn = document.createElement('button');
langBtn.textContent = pt ? '🌐 English' : '🌐 Português';
langBtn.style.cssText = btnCss + ';background:#d9efe3;box-shadow:0 4px 0 #6fa88a';
langBtn.addEventListener('click', () => setLang(pt ? 'en' : 'pt'));
const howBox = document.createElement('div');
howBox.style.cssText = 'display:none;max-width:min(560px,92vw);max-height:62vh;overflow:auto;text-align:left;background:#ffffff14;border:1px solid #ffffff30;border-radius:14px;padding:14px 18px;font-size:15px;line-height:1.55;touch-action:pan-y';
howBox.innerHTML = pt
  ? '<b>Objetivo</b><br>Atenda os clientes entregando o pedido certo no prato à frente deles antes que percam a paciência. Pedido errado ou cliente indo embora custa um coração; sem corações, game over. Sobreviva ao expediente para avançar de nível.<br><br><b>Controles</b><br>PC: WASD/setas para mover · Espaço/E para interagir · Q para soltar o item · ou clique nas estações.<br>Celular: toque no chão ou numa estação para ir até lá · botão AÇÃO para interagir · SOLTAR para descartar · pressione e arraste com um dedo para mover a câmera · pinça com dois dedos para dar zoom.<br><br><b>Receitas</b><br>Veja o botão 📖 (ou o cartão no canto) com as receitas do nível. Os níveis seguintes adicionam chocolate, mel, waffles e chantilly.<br><br><b>Níveis 4 e 5</b><br>Quando faltarem 100 segundos, chame um ajudante que prepara pedidos sozinho.'
  : '<b>Goal</b><br>Serve customers the right order on the plate in front of them before they lose patience. A wrong order or a customer leaving costs a heart; with no hearts left it is game over. Survive the day to unlock the next level.<br><br><b>Controls</b><br>Desktop: WASD/arrows to move · Space/E to interact · Q to drop the item · or click the stations.<br>Mobile: tap the floor or a station to walk there · ACTION button to interact · DROP to discard · press and drag with one finger to move the camera · pinch with two fingers to zoom.<br><br><b>Recipes</b><br>Open the 📖 button (or the card in the corner) for the level\'s recipes. Later levels add chocolate, honey, waffles and whipped cream.<br><br><b>Levels 4 and 5</b><br>With 100 seconds left, call a helper that prepares orders on its own.';
const backBtn = document.createElement('button');
backBtn.textContent = pt ? 'Voltar' : 'Back';
backBtn.style.cssText = btnCss + ';display:none;background:#f3e9ff;box-shadow:0 4px 0 #9b86c9';
const showMain = (on) => [startBtn, howBtn, rankBtn, langBtn].forEach((b) => (b.style.display = on ? 'block' : 'none'));
howBtn.addEventListener('click', () => {
  howBox.style.display = 'block'; backBtn.style.display = 'block';
  showMain(false);
});
startBtn.addEventListener('click', () => {
  showMain(false);
  backBtn.style.display = 'block';
  nickInput.value = profile.nick;
  nickStep.forEach((e) => (e.style.display = 'block'));
  nickInput.focus();
});
rankBtn.addEventListener('click', () => {
  renderBoard();
  board.style.display = 'block'; backBtn.style.display = 'block';
  showMain(false);
});
backBtn.addEventListener('click', () => {
  howBox.style.display = 'none'; backBtn.style.display = 'none'; board.style.display = 'none';
  nickStep.forEach((e) => (e.style.display = 'none'));
  showMain(true);
});
const nickLabel = document.createElement('div');
nickLabel.textContent = pt ? 'Como devemos te chamar?' : 'What should we call you?';
nickLabel.style.cssText = 'display:none;font-size:18px;color:#ffd97a;font-weight:700';
const playBtn = document.createElement('button');
playBtn.textContent = pt ? 'Jogar' : 'Play';
playBtn.style.cssText = btnCss + ';display:none';
const nickInput = document.createElement('input');
nickInput.maxLength = 12;
nickInput.placeholder = pt ? 'Seu apelido' : 'Your nickname';
nickInput.autocomplete = 'off';
nickInput.style.cssText = 'display:none;font-size:18px;font-weight:700;text-align:center;padding:11px 12px;width:min(260px,70vw);box-sizing:border-box;border-radius:14px;border:2px solid #ffd97a88;background:#ffffff1c;color:#fff;outline:none';
nickInput.addEventListener('keydown', (e) => e.stopPropagation());
nickInput.addEventListener('keyup', (e) => e.stopPropagation());
nickInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') playBtn.click(); });
const nickStep = [nickLabel, nickInput, playBtn];
const board = document.createElement('div');
board.style.cssText = 'display:none;width:min(320px,86vw);box-sizing:border-box;padding:10px 14px;border-radius:14px;background:#ffffff14;border:1px solid #ffffff30;text-align:left;font-size:15px';
const MEDALS = ['🥇', '🥈', '🥉', '4.', '5.'];
function renderBoard() {
  const rows = profile.top.length
    ? profile.top.map((e, i) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0;${i === 0 ? 'color:#ffd97a;font-weight:800' : ''}"><span>${MEDALS[i]} ${e.n.replace(/[<>&]/g, '')}</span><b>${e.s}</b></div>`).join('')
    : `<div style="opacity:.7;text-align:center">${pt ? 'Ninguém pontuou ainda' : 'No scores yet'}</div>`;
  board.innerHTML = `<div style="text-align:center;font-weight:800;color:#ffd97a;margin-bottom:4px">🏆 ${pt ? 'Maiores pontuações' : 'High scores'}</div>${rows}`;
}
function refreshMenu() {
  nickInput.value = profile.nick;
  renderBoard();
}
renderBoard();
menuRoot.append(menuSub, menuTitle, nickLabel, nickInput, playBtn, startBtn, howBtn, rankBtn, langBtn, board, howBox, backBtn);
document.body.appendChild(menuRoot);
hud.omenu.textContent = pt ? '🏠 Menu inicial' : '🏠 Main menu';
function showMenu() {
  howBox.style.display = 'none'; backBtn.style.display = 'none'; board.style.display = 'none';
  nickStep.forEach((e) => (e.style.display = 'none'));
  showMain(true);
  refreshMenu();
  menuRoot.style.display = 'flex';
}
export const menu = { show: showMenu, root: menuRoot, startBtn: playBtn, nickInput, refresh: refreshMenu };
