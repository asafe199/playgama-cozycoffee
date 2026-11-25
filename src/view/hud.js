import * as THREE from 'three';
import { lang, tr, setLang, L, LANGS } from '../model/i18n.js';
import { ITEM_NAMES } from '../model/names.js';
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
      return `<div class="ticket"><b>${RECIPES[c.type].icon} ${L(ITEM_NAMES[c.type])}</b><i><u style="width:${pct}%;background:${col}"></u></i></div>`;
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

export function refreshGuide() {
  const l2 = level >= 2, l3 = level >= 3, l4 = level >= 4, l5 = level >= 5;
  const N = (k) => L(ITEM_NAMES[k]);
  const W = L({
    pt: { title: 'Receitas', cup: 'Copo', machine: 'Máquina', milk: 'Leite', dough: 'Massa', oven: 'Forno', choc: 'Chocolate', honey: 'Mel', cream: 'Chantilly', serve: 'entregue', maker: 'Máquina de Waffle (mãos livres)' },
    en: { title: 'Recipes', cup: 'Cup', machine: 'Machine', milk: 'Milk', dough: 'Dough', oven: 'Oven', choc: 'Chocolate', honey: 'Honey', cream: 'Cream', serve: 'serve', maker: 'Waffle Maker (empty hands)' },
    es: { title: 'Recetas', cup: 'Vaso', machine: 'Máquina', milk: 'Leche', dough: 'Masa', oven: 'Horno', choc: 'Chocolate', honey: 'Miel', cream: 'Nata', serve: 'sirve', maker: 'Máquina de waffles (manos libres)' },
    fr: { title: 'Recettes', cup: 'Tasse', machine: 'Machine', milk: 'Lait', dough: 'Pâte', oven: 'Four', choc: 'Chocolat', honey: 'Miel', cream: 'Chantilly', serve: 'servez', maker: 'Gaufrier (mains libres)' },
  });
  const rows = [
    ['espresso', `${W.cup} → ${W.machine} → ${W.serve}`],
    ['latte', `${W.cup} → ${W.milk} → ${W.serve}`],
    ['croissant', `${W.dough} → ${W.oven} → ${W.serve}`],
  ];
  if (l2) rows.push(['mocha', `${N('espresso')} → ${W.choc}`], ['mochalatte', `${N('latte')} → ${W.choc}`], ['chococroissant', `${N('croissant')} → ${W.choc}`]);
  if (l3) rows.push(['honeylatte', `${N('latte')} → ${W.honey}`], ['waffle', W.maker], ['wafflehoney', `${N('waffle')} → ${W.honey}`]);
  if (l4) rows.push(['honeyespresso', `${N('espresso')} → ${W.honey}`]);
  if (l5) rows.push(['creamlatte', `${N('latte')} → ${W.cream}`], ['creamwaffle', `${N('waffle')} → ${W.cream}`], ['creammocha', `${N('mocha')} → ${W.cream}`]);
  guide.innerHTML = `<b>${W.title}</b>` + rows.map(([k, v]) => `<br>${N(k)}: ${v}`).join('');
}

hud.act.textContent = tr('AÇÃO');
hud.drop.textContent = tr('SOLTAR');
hud.msg.textContent = tr('Pronto?');
hud.overlay.style.display = 'none';
hud.title.textContent = 'Royal Coffee';
hud.text.textContent = tr('Anote os pedidos, prepare e entregue no balcão.\nWASD/setas: mover · Espaço/E: interagir · Q: soltar item · ou clique nas estações.\nItem errado custa um coração. Sem corações, game over!');
hud.btn.textContent = tr('Começar');

// ---------- main menu ----------
const T = L({
  pt: { start: 'Iniciar', instr: 'Instruções', rank: '🏆 Ranking', back: 'Voltar', nick: 'Como devemos te chamar?', play: 'Jogar', ph: 'Seu apelido', none: 'Ninguém pontuou ainda', high: 'Maiores pontuações', menu: '🏠 Menu inicial',
    how: '<b>Objetivo</b><br>Atenda os clientes entregando o pedido certo no prato à frente deles antes que percam a paciência. Pedido errado ou cliente indo embora custa um coração; sem corações, game over. Sobreviva ao expediente para avançar de nível.<br><br><b>Controles</b><br>PC: WASD/setas para mover · Espaço/E para interagir · Q para soltar o item · ou clique nas estações.<br>Celular: toque no chão ou numa estação para ir até lá · botão AÇÃO para interagir · SOLTAR para descartar · pressione e arraste com um dedo para mover a câmera · pinça com dois dedos para dar zoom.<br><br><b>Receitas</b><br>Veja o botão 📖 (ou o cartão no canto) com as receitas do nível. Os níveis seguintes adicionam chocolate, mel, waffles e chantilly.<br><br><b>Níveis 4 e 5</b><br>Quando faltarem 100 segundos, chame um ajudante que prepara pedidos sozinho.' },
  en: { start: 'Start', instr: 'Instructions', rank: '🏆 Rank', back: 'Back', nick: 'What should we call you?', play: 'Play', ph: 'Your nickname', none: 'No scores yet', high: 'High scores', menu: '🏠 Main menu',
    how: '<b>Goal</b><br>Serve customers the right order on the plate in front of them before they lose patience. A wrong order or a customer leaving costs a heart; with no hearts left it is game over. Survive the day to unlock the next level.<br><br><b>Controls</b><br>Desktop: WASD/arrows to move · Space/E to interact · Q to drop the item · or click the stations.<br>Mobile: tap the floor or a station to walk there · ACTION button to interact · DROP to discard · press and drag with one finger to move the camera · pinch with two fingers to zoom.<br><br><b>Recipes</b><br>Open the 📖 button (or the card in the corner) for the level\'s recipes. Later levels add chocolate, honey, waffles and whipped cream.<br><br><b>Levels 4 and 5</b><br>With 100 seconds left, call a helper that prepares orders on its own.' },
  es: { start: 'Empezar', instr: 'Instrucciones', rank: '🏆 Ranking', back: 'Volver', nick: '¿Cómo quieres que te llamemos?', play: 'Jugar', ph: 'Tu apodo', none: 'Nadie ha puntuado aún', high: 'Mejores puntuaciones', menu: '🏠 Menú principal',
    how: '<b>Objetivo</b><br>Sirve a los clientes el pedido correcto en el plato frente a ellos antes de que pierdan la paciencia. Un pedido equivocado o un cliente que se va cuesta un corazón; sin corazones, fin del juego. Sobrevive al día para pasar de nivel.<br><br><b>Controles</b><br>PC: WASD/flechas para moverte · Espacio/E para interactuar · Q para soltar el objeto · o haz clic en las estaciones.<br>Móvil: toca el suelo o una estación para ir hasta allí · botón ACCIÓN para interactuar · SOLTAR para descartar · mantén pulsado y arrastra con un dedo para mover la cámara · pellizca con dos dedos para hacer zoom.<br><br><b>Recetas</b><br>Abre el botón 📖 (o la tarjeta de la esquina) con las recetas del nivel. Los niveles siguientes añaden chocolate, miel, waffles y nata montada.<br><br><b>Niveles 4 y 5</b><br>Cuando queden 100 segundos, llama a un ayudante que prepara pedidos por sí solo.' },
  fr: { start: 'Démarrer', instr: 'Instructions', rank: '🏆 Classement', back: 'Retour', nick: 'Comment devons-nous vous appeler ?', play: 'Jouer', ph: 'Votre pseudo', none: 'Personne n’a encore marqué', high: 'Meilleurs scores', menu: '🏠 Menu principal',
    how: '<b>Objectif</b><br>Servez aux clients la bonne commande sur l’assiette devant eux avant qu’ils ne perdent patience. Une mauvaise commande ou un client qui part coûte un cœur ; sans cœurs, la partie est perdue. Survivez à la journée pour passer au niveau suivant.<br><br><b>Commandes</b><br>PC : WASD/flèches pour bouger · Espace/E pour interagir · Q pour lâcher l’objet · ou cliquez sur les stations.<br>Mobile : touchez le sol ou une station pour y aller · bouton ACTION pour interagir · LÂCHER pour jeter · appuyez et faites glisser un doigt pour déplacer la caméra · pincez avec deux doigts pour zoomer.<br><br><b>Recettes</b><br>Ouvrez le bouton 📖 (ou la carte dans le coin) pour les recettes du niveau. Les niveaux suivants ajoutent chocolat, miel, gaufres et chantilly.<br><br><b>Niveaux 4 et 5</b><br>Quand il reste 100 secondes, appelez un assistant qui prépare les commandes tout seul.' },
});
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
startBtn.textContent = T.start;
startBtn.style.cssText = btnCss;
const howBtn = document.createElement('button');
howBtn.textContent = T.instr;
howBtn.style.cssText = btnCss + ';background:#f3e9ff;box-shadow:0 4px 0 #9b86c9';
const rankBtn = document.createElement('button');
rankBtn.textContent = T.rank;
rankBtn.style.cssText = btnCss + ';background:#ffe9a8;box-shadow:0 4px 0 #c79a2a';
// one button per language, side by side; the active one is highlighted
const langRow = document.createElement('div');
langRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:min(420px,92vw)';
for (const [code, name] of LANGS) {
  const b = document.createElement('button');
  b.textContent = name;
  b.style.cssText = 'font-size:14px;font-weight:800;padding:8px 12px;border-radius:12px;cursor:pointer;border:2px solid #ffffff55;' + (code === lang ? 'background:#ffd54a;color:#4a3426;border-color:#ffd54a' : 'background:#ffffff18;color:#fff');
  b.addEventListener('click', () => code !== lang && setLang(code));
  langRow.append(b);
}
const howBox = document.createElement('div');
howBox.style.cssText = 'display:none;max-width:min(560px,92vw);max-height:62vh;overflow:auto;text-align:left;background:#ffffff14;border:1px solid #ffffff30;border-radius:14px;padding:14px 18px;font-size:15px;line-height:1.55;touch-action:pan-y';
howBox.innerHTML = T.how;
const backBtn = document.createElement('button');
backBtn.textContent = T.back;
backBtn.style.cssText = btnCss + ';display:none;background:#f3e9ff;box-shadow:0 4px 0 #9b86c9';
const showMain = (on) => [startBtn, howBtn, rankBtn, langRow].forEach((b) => (b.style.display = on ? (b === langRow ? 'flex' : 'block') : 'none'));
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
nickLabel.textContent = T.nick;
nickLabel.style.cssText = 'display:none;font-size:18px;color:#ffd97a;font-weight:700';
const playBtn = document.createElement('button');
playBtn.textContent = T.play;
playBtn.style.cssText = btnCss + ';display:none';
const nickInput = document.createElement('input');
nickInput.maxLength = 12;
nickInput.placeholder = T.ph;
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
    : `<div style="opacity:.7;text-align:center">${T.none}</div>`;
  board.innerHTML = `<div style="text-align:center;font-weight:800;color:#ffd97a;margin-bottom:4px">🏆 ${T.high}</div>${rows}`;
}
function refreshMenu() {
  nickInput.value = profile.nick;
  renderBoard();
}
renderBoard();
menuRoot.append(menuSub, menuTitle, nickLabel, nickInput, playBtn, startBtn, howBtn, rankBtn, langRow, board, howBox, backBtn);
document.body.appendChild(menuRoot);
hud.omenu.textContent = T.menu;
function showMenu() {
  howBox.style.display = 'none'; backBtn.style.display = 'none'; board.style.display = 'none';
  nickStep.forEach((e) => (e.style.display = 'none'));
  showMain(true);
  refreshMenu();
  menuRoot.style.display = 'flex';
}
export const menu = { show: showMenu, root: menuRoot, startBtn: playBtn, nickInput, refresh: refreshMenu };
