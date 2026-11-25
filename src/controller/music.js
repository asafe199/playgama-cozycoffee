const tracks = Object.values(import.meta.glob('../media/*.mp3', { eager: true, query: '?url', import: 'default' }));

let audio = null;
let last = -1;
let paused = false;

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
  if (!paused) audio.play().catch(() => {});
}

export function playRandomMusic() {
  next();
}

export function stopMusic() {
  audio?.pause();
}

export function setMusicPaused(p) {
  paused = !!p;
  if (!audio) return;
  if (paused) audio.pause();
  else audio.play().catch(() => {});
}
