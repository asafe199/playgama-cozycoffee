import bridge from '@playgama/bridge';

bridge
  .initialize()
  .catch((e) => console.warn('Bridge init failed, using defaults', e))
  .then(() => bridge.storage.get(['lang']).catch(() => null))
  .then(async (d) => {
    const { initLang } = await import('./model/i18n.js');
    initLang(Array.isArray(d) ? d[0] : null);
    return import('./game.js');
  });
