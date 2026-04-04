/* Snow */
(function () {
  const container = document.getElementById('snow');
  const chars = ['❄', '❅', '❆', '✦', '·'];
  const count = 38;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'flake';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (8 + Math.random() * 10) + 'px';
    el.style.animationDuration = (8 + Math.random() * 14) + 's';
    el.style.animationDelay = (Math.random() * 12) + 's';
    el.style.opacity = 0;
    container.appendChild(el);
  }
})();

/* Audio */
const bgm = document.getElementById('bgm');
const btn = document.getElementById('soundBtn');
const iconOn = document.getElementById('iconOn');
const iconOff = document.getElementById('iconOff');
const nowPlaying = document.getElementById('nowPlaying');
let playing = false;

function setPlaying(state) {
  playing = state;
  iconOn.style.display = state ? '' : 'none';
  iconOff.style.display = state ? 'none' : '';
  nowPlaying.classList.toggle('visible', state);
  if (state) {
    bgm.play().catch(() => {});
  } else {
    bgm.pause();
  }
}

btn.addEventListener('click', () => setPlaying(!playing));

/* Try autoplay on first interaction */
document.addEventListener('click', function tryPlay() {
  if (!playing) setPlaying(true);
  document.removeEventListener('click', tryPlay);
}, { once: true });

/* Visitor counter using localStorage — simple session tracking */
(function () {
  const key = 'evilmel_visits';
  let count = parseInt(localStorage.getItem(key) || '0', 10);
  const sessionKey = 'evilmel_session';
  if (!sessionStorage.getItem(sessionKey)) {
    count++;
    localStorage.setItem(key, count);
    sessionStorage.setItem(sessionKey, '1');
  }
  document.getElementById('visitorCount').textContent = count;
})();
