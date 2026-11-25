import bridge from '@playgama/bridge';

export const profile = { nick: '', top: [] };
const TOP_SIZE = 5;

export function cleanNick(v) {
  return String(v || '').replace(/[<>&"']/g, '').trim().slice(0, 12);
}

export function loadProfile() {
  return bridge.storage
    .get(['nick', 'top'])
    .then((d) => {
      profile.nick = cleanNick(d?.[0]);
      try {
        const raw = d?.[1];
        const t = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
        profile.top = Array.isArray(t) ? t.filter((e) => e && Number.isFinite(e.s)).map((e) => ({ n: cleanNick(e.n) || '?', s: e.s })).slice(0, TOP_SIZE) : [];
      } catch { profile.top = []; }
    })
    .catch(() => {});
}

export function setNick(v) {
  profile.nick = cleanNick(v);
  bridge.storage.set(['nick'], [profile.nick]).catch(() => {});
}

// Keeps one entry per player (their best) and the TOP_SIZE highest scores.
export function submitScore(name, score) {
  if (score <= 0) return false;
  const n = cleanNick(name) || '?';
  const cur = profile.top.find((e) => e.n === n);
  if (cur && cur.s >= score) return false;
  if (cur) cur.s = score; else profile.top.push({ n, s: score });
  profile.top.sort((a, b) => b.s - a.s);
  profile.top.length = Math.min(profile.top.length, TOP_SIZE);
  bridge.storage.set(['top'], [JSON.stringify(profile.top)]).catch(() => {});
  return true;
}
