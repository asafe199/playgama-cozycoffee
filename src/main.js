import bridge from '@playgama/bridge';

bridge
  .initialize()
  .catch((e) => console.warn('Bridge init failed, using defaults', e))
  .then(() => import('./game.js'));
