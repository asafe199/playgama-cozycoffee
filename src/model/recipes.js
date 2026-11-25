export const RECIPES = {
  espresso: { label: 'Espresso', icon: '☕' },
  latte: { label: 'Latte', icon: '🥛' },
  croissant: { label: 'Croissant', icon: '🥐' },
  mocha: { label: 'Mocha', icon: '☕🍫' },
  mochalatte: { label: 'Mocha Latte', icon: '🥛🍫' },
  chococroissant: { label: 'Choco Croissant', icon: '🥐🍫' },
  honeylatte: { label: 'Honey Latte', icon: '🥛🍯' },
  wafflehoney: { label: 'Waffle with Honey', icon: '🧇🍯' },
  honeyespresso: { label: 'Honey Espresso', icon: '☕🍯' },
  creamlatte: { label: 'Cream Latte', icon: '🥛🍦' },
  creamwaffle: { label: 'Waffle with Cream', icon: '🧇🍦' },
  creammocha: { label: 'Cream Mocha', icon: '☕🍫🍦' },
};

export const ORDER_POOLS = [
  ['espresso', 'espresso', 'latte', 'croissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'honeylatte', 'wafflehoney'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'honeylatte', 'wafflehoney', 'honeyespresso', 'honeyespresso'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'honeylatte', 'wafflehoney', 'honeyespresso', 'creamlatte', 'creamwaffle', 'creammocha', 'creamlatte'],
];
