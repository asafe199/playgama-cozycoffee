import bridge from '@playgama/bridge';

const tracks = Object.values(import.meta.glob('../media/*.mp3', { eager: true, query: '?url', import: 'default' }));

let audio = null;
let last = -1;
let wanted = false;
let userMuted = false;
let platformMuted = bridge.platform?.isAudioEnabled === false;
let hostPaused = false;
let hidden = document.hidden;
const listeners = [];

const silent = () => userMuted || platformMuted || hostPaused || hidden;

function sync() {
  if (!audio) return;
  if (wanted && !silent()) audio.play().catch(() => {});
  else audio.pause();
}

function next() {
  if (!tracks.length) return;
  let i;
  do i = Math.floor(Math.random() * tracks.length);
  while (tracks.length > 1 && i === last);
  last = i;
  if (!audio) {
    audio = new Audio();
    audio.volume = 0.4;
    audio.addEventListener('ended', next);
  }
  audio.src = tracks[i];
  sync();
}

export function playRandomMusic() {
  wanted = true;
  next();
}

export function stopMusic() {
  wanted = false;
  audio?.pause();
}

export function setHostPaused(p) {
  hostPaused = !!p;
  sync();
}

export function setPlatformAudio(enabled) {
  platformMuted = !enabled;
  sync();
}

export function toggleMute() {
  userMuted = !userMuted;
  sync();
  listeners.forEach((f) => f(userMuted));
  return userMuted;
}

export const isMuted = () => userMuted;
export const onMuteChange = (f) => listeners.push(f);

document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
  sync();
});
