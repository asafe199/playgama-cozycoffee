import bridge from '@playgama/bridge';

const GAME_VERSION = '1.0.1';

// Stable event names; the changing identity (level) goes into the data.
function send(name, data) {
  try {
    bridge.analytics.send(name, { game_version: GAME_VERSION, ...data });
  } catch (e) { /* telemetry must never break the game */ }
}

const base = (level) => ({ level_id: `level_${level}`, step_index: level });

export const progressionStarted = (level) => send('progression_started', base(level));

export const progressionCompleted = (level, { score, stars, hearts_left, duration_sec }) =>
  send('progression_completed', { ...base(level), score, stars, hearts_left, duration_sec: Math.round(duration_sec) });

// reason: 'wrong_orders' | 'walkouts' | 'abandoned'
export const progressionFailed = (level, { reason, score, duration_sec }) =>
  send('progression_failed', { ...base(level), reason, score, duration_sec: Math.round(duration_sec) });
