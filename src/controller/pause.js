import { G } from '../model/state.js';
import { setHostPaused as syncMusicPause } from './music.js';

// Combines the host-driven pause (Bridge PAUSE_STATE_CHANGED), the player-pressed pause button,
// and the recipes-modal pause into the single `G.paused` flag the game loop reads, and keeps the
// background music paused/resumed in sync with it.
const flags = { host: false, user: false, modal: false };

function recompute() {
  G.paused = flags.host || flags.user || flags.modal;
  syncMusicPause(G.paused);
}

export const setHostPaused = (v) => { flags.host = !!v; recompute(); };
export const setUserPaused = (v) => { flags.user = !!v; recompute(); };
export const setModalPaused = (v) => { flags.modal = !!v; recompute(); };
export const toggleUserPaused = () => { flags.user = !flags.user; recompute(); return flags.user; };
export const isUserPaused = () => flags.user;
