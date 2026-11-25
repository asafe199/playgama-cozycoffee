export const RECIPES = {
  espresso: { label: 'Espresso', icon: '☕' },
  latte: { label: 'Latte', icon: '🥛' },
  croissant: { label: 'Croissant', icon: '🥐' },
  mocha: { label: 'Mocha', icon: '☕🍫' },
  mochalatte: { label: 'Mocha Latte', icon: '🥛🍫' },
  chococroissant: { label: 'Choco Croissant', icon: '🥐🍫' },
  honeylatte: { label: 'Honey Latte', icon: '🥛🍯' },
  wafflehoney: { label: 'Waffle with Honey', icon: '🧇🍯' },
};

export const ORDER_POOLS = [
  ['espresso', 'espresso', 'latte', 'croissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'honeylatte', 'wafflehoney'],
];
