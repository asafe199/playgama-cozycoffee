export const RECIPES = {
  espresso: { label: 'Espresso', icon: '☕' },
  latte: { label: 'Latte', icon: '🥛' },
  croissant: { label: 'Croissant', icon: '🥐' },
  mocha: { label: 'Mocha', icon: '☕🍫' },
  mochalatte: { label: 'Mocha Latte', icon: '🥛🍫' },
  chococroissant: { label: 'Choco Croissant', icon: '🥐🍫' },
  doceleitelatte: { label: 'Doce de Leite Latte', icon: '🥛🍮' },
  doceleitecroissant: { label: 'Doce de Leite Croissant', icon: '🥐🍮' },
};

export const ORDER_POOLS = [
  ['espresso', 'espresso', 'latte', 'croissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'doceleitelatte', 'doceleitecroissant'],
];
