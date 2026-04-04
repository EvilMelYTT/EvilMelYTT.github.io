
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
    container.appendChild(el);
  }
})();


const openMeBtn = document.getElementById('openMeBtn');
const drawer = document.getElementById('drawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerClose = document.getElementById('drawerClose');

function openDrawer() {
  drawer.classList.add('open');
  drawerBackdrop.classList.add('open');
  fetchAnime();
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerBackdrop.classList.remove('open');
}

openMeBtn.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

document.querySelectorAll('.dtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dtab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

let malFetched = false;
async function fetchAnime() {
  if (malFetched) return;
  malFetched = true;
  const grid = document.getElementById('animeGrid');
  const loading = document.getElementById('animeLoading');
  try {
    const r = await fetch('./animelist.json');
    if (!r.ok) throw new Error();
    const data = await r.json();
    loading.style.display = 'none';
    data.forEach(a => {
      const link = document.createElement('a');
      link.className = 'anime-item';
      link.href = a.url;
      link.target = '_blank';
      link.rel = 'noopener';
      const img = document.createElement('img');
      img.src = a.image;
      img.alt = a.title;
      img.loading = 'lazy';
      const score = document.createElement('span');
      score.className = 'anime-score';
      score.textContent = '★ ' + a.score;
      const name = document.createElement('span');
      name.className = 'anime-name';
      name.textContent = a.title;
      link.appendChild(img);
      link.appendChild(score);
      link.appendChild(name);
      grid.appendChild(link);
    });
    if (data.length === 0) loading.textContent = 'Nothing here yet ᓚᘏᗢ';
  } catch {
    loading.innerHTML = 'Anime list not generated yet.<br><a href="https://myanimelist.net/profile/EvilMel" target="_blank" style="color:var(--accent)">View on MAL ↗</a>';
  }
}

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
let lbIndex = 0;
let lbUrls = [];

function openLightbox(urls, index) {
  lbUrls = urls;
  lbIndex = index;
  lbImg.src = lbUrls[lbIndex];
  lightbox.classList.add('open');
}
function closeLightbox() { lightbox.classList.remove('open'); }
function lbGo(dir) {
  lbIndex = (lbIndex + dir + lbUrls.length) % lbUrls.length;
  lbImg.src = lbUrls[lbIndex];
}

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lbPrev.addEventListener('click', e => { e.stopPropagation(); lbGo(-1); });
lbNext.addEventListener('click', e => { e.stopPropagation(); lbGo(1); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') lbGo(-1);
  if (e.key === 'ArrowRight') lbGo(1);
  if (e.key === 'Escape') closeLightbox();
});


const gate = document.getElementById('gate');
gate.addEventListener('click', function () {
  gate.classList.add('hidden');
  setTimeout(() => gate.remove(), 500);
  setPlaying(true);
});


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


const imageUrls = [
  "https://i.ibb.co/N6hR3P81/sample-d398025e6c04ee30429e1aa49c2a48a475752081.jpg",
  "https://i.ibb.co/PsJ7ZBQh/sample-637e037f0253d655d8116b71512e178c1c8ec823.jpg",
  "https://i.ibb.co/ZCHgHFn/sample-414dbad77d063a984a2c64cea54273277d0970fd.jpg",
  "https://i.ibb.co/sdkCDzFD/q9pok1limzv71.jpg",
  "https://i.ibb.co/4ZFV2SV5/oreimo-05-2.jpg",
  "https://i.ibb.co/MdPFJgd/kuroneko-ruri.gif",
  "https://i.ibb.co/x8Mhv8sS/kuroneko-didnt-deserve-that-ending-v0-pn2m5d4f6lbf1.jpg",
  "https://i.ibb.co/Q7cqWsSz/Kuroneko-in-the-arcade-S02-E01-m21-s31.webp",
  "https://i.ibb.co/XrZ630Vy/Kuroneko-Appearance.webp",
  "https://i.ibb.co/RGSc7nXc/kasseus-maximus-kuroneko-layingdown-resize-fix.jpg",
  "https://i.ibb.co/5xXkmLGs/117988529-p0.jpg",
  "https://i.ibb.co/XnvK64v/ef66df23956ceda5762bdc0b48fcc2bc.jpg",
  "https://i.ibb.co/wFgBLx13/bd4d27e3d8d050221eca8695e843972e.jpg",
  "https://i.ibb.co/67k24mWF/131823071-p0.jpg",
  "https://i.ibb.co/5X7jwKXY/21452704-p0.jpg",
  "https://i.ibb.co/FbDV1wN0/648192.jpg",
  "https://i.ibb.co/Kpw1f5Mv/837959.jpg",
  "https://i.ibb.co/h1gzfhtB/4655c053ac6eeb378f5453f10ba2867cb89875c3.jpg",
  "https://i.ibb.co/HT9p16d3/1200x675.jpg",
  "https://i.ibb.co/Wv54x8q9/638b30d6051911412d93e758f6a2b4cf.jpg",
  "https://i.ibb.co/v4P3rzMp/40e1479e6e648546e85b7b981bf2d7941c5d3794.jpg",
  "https://i.ibb.co/WN5jZtbD/35f2bf27262890758652a1e57b278f4b7a2cefb5.jpg",
  "https://i.ibb.co/CScrQrN/7a866da2acc24a449b1081135f81c9b1.gif",
  "https://i.ibb.co/TDrGDqGD/3f87e8714c97fe48839335db1aac629e.gif",
  "https://i.ibb.co/G4knK5vx/122004950-p0-min.jpg",
  "https://i.ibb.co/nF7NHmy/122004950-p0-master1200.webp",
  "https://i.ibb.co/Tq4YnSkn/129488328-p0-master1200.webp",
  "https://i.ibb.co/Xxr3b1hh/96811374-p0.jpg",
  "https://i.ibb.co/cSfyyJqj/15172211-p0-master1200.webp",
  "https://i.ibb.co/7N1qrbHL/47730149-p0-master1200.webp",
  "https://i.ibb.co/xKfZTPrd/60498994-p0.png",
  "https://i.ibb.co/k22sc1x0/107649822-p0-master1200.webp",
  "https://i.ibb.co/hJQ49LB2/107649822-p13-master1200.webp",
  "https://i.ibb.co/HDqDXDTr/107649822-p14-master1200.webp",
  "https://i.ibb.co/Ldwh3VT5/127951315-p0-master1200.webp",
  "https://i.ibb.co/kgtHzb30/79995854-p0-master1200.webp",
  "https://i.ibb.co/6cDLMZPP/15888063-p0-master1200.webp",
  "https://i.ibb.co/jPSpgR6F/84907932-p0-master1200.webp",
  "https://i.ibb.co/fYvmskGh/107335998-p0-master1200.webp",
  "https://i.ibb.co/1GQ4LXJt/14897039-p0-master1200.webp",
  "https://i.ibb.co/W4dTXmC4/17642471-p0-master1200.webp",
  "https://i.ibb.co/Y4nskHnV/46328969-p0-master1200.webp",
  "https://i.ibb.co/rGd9JKQS/35971343-p0-master1200.webp",
  "https://i.ibb.co/4RFwmww4/19537991-p0-master1200.webp",
  "https://i.ibb.co/xtZF47tV/13630562-p0-master1200.webp",
  "https://i.ibb.co/S4g6Thyb/15412556-p0-master1200.webp",
  "https://i.ibb.co/b5Dd60y7/14051428-p0-master1200.webp",
  "https://i.ibb.co/NgVmnKw9/82133500-p0-master1200.webp",
  "https://i.ibb.co/bR82bP5K/98001962-p0-master1200.webp",
  "https://i.ibb.co/TB1dZZBj/29587986-p0-master1200.webp",
  "https://i.ibb.co/zh6Cd8bb/97764598-p0-master1200.webp",
  "https://i.ibb.co/LzmM0tv3/95857567-p0-master1200.webp",
  "https://i.ibb.co/7JtmKdyj/54115101-p0.jpg",
  "https://i.ibb.co/FL1LHM9w/19462688-p0-master1200.webp",
  "https://i.ibb.co/ZRY1KzJb/117980361-p0-master1200.webp",
  "https://i.ibb.co/tTqmxGN5/26599253-p0.jpg",
  "https://i.ibb.co/DP4RcQDj/86061021-p0-master1200.webp",
  "https://i.ibb.co/CcnDJwF/129530247-p0-master1200.webp",
  "https://i.ibb.co/tMkFj06D/d0a0e22217b548fbab87f2e97cac78fdf2464006-hq.gif",
  "https://i.ibb.co/rKQR4GLK/images-27.jpg",
  "https://i.ibb.co/TBfZXX66/images-28.jpg",
  "https://i.ibb.co/jkCCqMCV/a94487e4f63b3e7f40365392385ad52f.gif",
  "https://i.ibb.co/LzNht9DF/images-29.jpg",
  "https://i.ibb.co/sB9PghL/tumblr-mr9xd31-MCH1s1pzmeo1-400.gif",
  "https://i.ibb.co/R4b6NQPF/tumblr-mpoqt4v04-F1squyp0o1-500.gif",
  "https://i.ibb.co/gFTwcRgH/tumblr-mlbhsr-J2321r6jylpo1-500.gif",
  "https://i.ibb.co/gLrp2HcG/tumblr-mpgo7q-Kqgy1qj9uf7o1-500.gif",
  "https://i.ibb.co/V0XVFJMM/tumblr-mr7yq9ben-P1rhlkj4o1-500.gif",
  "https://i.ibb.co/HfkLQK06/tumblr-mn0d86f-YKg1s8166so1-500.gif",
  "https://i.ibb.co/dwKGTdtx/tumblr-md6rnh6-EQD1rsw0k3o1-500.gif",
  "https://i.ibb.co/fdj9kqR0/kuroneko-crying-kuroneko.gif"
];

(function () {
  const track = document.getElementById('scroller-track');
  const loading = document.getElementById('scroller-loading');
  let loaded = 0;
  const imgs = [];

  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
    img.onload = img.onerror = () => {
      loaded++;
      loading.textContent = 'Loading all images ᓚᘏᗢ ' + Math.round(loaded / imageUrls.length * 100) + '%';
      if (loaded === imageUrls.length) startScroller();
    };
    imgs.push(img);
  });

  function startScroller() {
    loading.style.display = 'none';
    imgs.forEach(img => track.appendChild(img));
    imgs.forEach(img => track.appendChild(img.cloneNode()));

    track.style.cursor = 'pointer';
    track.addEventListener('click', e => {
      const clickedImg = e.target.closest('img');
      if (!clickedImg) return;
      const allImgs = [...track.querySelectorAll('img')].slice(0, imageUrls.length);
      const idx = allImgs.indexOf(clickedImg);
      if (idx !== -1) openLightbox(imageUrls, idx);
    });

    let scroll = 0;
    function animate() {
      scroll += 0.5;
      if (scroll >= track.scrollWidth / 2) scroll = 0;
      track.style.transform = 'translateX(-' + scroll + 'px)';
      requestAnimationFrame(animate);
    }
    animate();
  }
})();
