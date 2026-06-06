/* ============================================================
   언생탐 발표 — 내비게이션 / 스케일링 / KaTeX / 그래프
   ============================================================ */

const TOTAL = 19;
let current = 1;

/* ---------- 뷰포트 스케일링 (1920×1080 고정 → 화면 맞춤) ---------- */
function scaleViewport() {
  const vp = document.getElementById('slide-viewport');
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const ox = (window.innerWidth  - 1920 * scale) / 2;
  const oy = (window.innerHeight - 1080 * scale) / 2;
  vp.style.transform = `scale(${scale})`;
  vp.style.left = `${ox}px`;
  vp.style.top  = `${oy}px`;
}
window.addEventListener('resize', scaleViewport);
scaleViewport();

/* ---------- 내비게이션 ---------- */
function showSlide(n) {
  document.getElementById(`slide-${current}`).classList.remove('active');
  current = Math.max(1, Math.min(TOTAL, n));
  document.getElementById(`slide-${current}`).classList.add('active');
  document.getElementById('slide-counter').textContent = `${current} / ${TOTAL}`;
  document.getElementById('btn-prev').disabled = current === 1;
  document.getElementById('btn-next').disabled = current === TOTAL;
  if (history.replaceState) history.replaceState(null, '', `#${current}`);
}
function navigate(dir) { showSlide(current + dir); }

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') navigate(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')                    navigate(-1);
});
document.getElementById('btn-prev').addEventListener('click', () => navigate(-1));
document.getElementById('btn-next').addEventListener('click', () => navigate(1));

/* ---------- 준비된 이미지 placeholder 처리 ----------
   이미지 파일이 없으면 깔끔한 자리표시(placeholder)로 대체한다. */
function setupImagePlaceholders() {
  document.querySelectorAll('.img-frame img').forEach(img => {
    const frame = img.closest('.img-frame');
    const markMissing = () => { img.classList.add('missing'); frame.classList.add('is-missing'); };
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing);
  });
}

/* ============================================================
   Graph 클래스 — 모든 캔버스 좌표 변환의 기준
   ============================================================ */
class Graph {
  constructor(id, { xMin, xMax, yMin, yMax, pad }) {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    // 좌표축·라벨용 안쪽 여백
    this.pad = Object.assign({ l: 70, r: 30, t: 30, b: 60 }, pad || {});
    this.xMin = xMin; this.xMax = xMax;
    this.yMin = yMin; this.yMax = yMax;
  }
  get PW() { return this.W - this.pad.l - this.pad.r; }
  get PH() { return this.H - this.pad.t - this.pad.b; }
  wx(x) { return this.pad.l + (x - this.xMin) / (this.xMax - this.xMin) * this.PW; }
  wy(y) { return this.pad.t + (this.yMax - y) / (this.yMax - this.yMin) * this.PH; }

  clear(bg = '#ffffff') {
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.W, this.H);
  }
  // 플롯 영역 안의 가로/세로 그리드
  grid(xs, ys, color = '#e8eef6') {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath();
    (xs || []).forEach(x => { ctx.moveTo(this.wx(x), this.pad.t); ctx.lineTo(this.wx(x), this.pad.t + this.PH); });
    (ys || []).forEach(y => { ctx.moveTo(this.pad.l, this.wy(y)); ctx.lineTo(this.pad.l + this.PW, this.wy(y)); });
    ctx.stroke();
    ctx.restore();
  }
  frame(color = '#b8c4d2') {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(this.pad.l, this.pad.t, this.PW, this.PH);
  }
  curve(f, color, lw = 3, steps = 600) {
    const { ctx } = this;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    let pen = false;
    for (let i = 0; i <= steps; i++) {
      const x = this.xMin + (this.xMax - this.xMin) * i / steps;
      const y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      const cx = this.wx(x), cy = this.wy(y);
      pen ? ctx.lineTo(cx, cy) : (ctx.moveTo(cx, cy), pen = true);
    }
    ctx.stroke();
  }
  dot(x, y, color, r = 9) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(this.wx(x), this.wy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  text(x, y, str, { color = '#333', dx = 0, dy = 0, size = 22, align = 'left', weight = 400 } = {}) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "IBM Plex Sans KR","IBM Plex Sans",sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, this.wx(x) + dx, this.wy(y) + dy);
  }
  // 픽셀 좌표 기준 라벨 (축 제목 등)
  pxText(px, py, str, { color = '#7b8794', size = 22, align = 'center', weight = 400 } = {}) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "IBM Plex Sans KR","IBM Plex Sans",sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(str, px, py);
  }
}

const C = {
  accent: '#1e4f8f', red: '#b42318', green: '#1f7a4d',
  grid: '#e8eef6', axis: '#b8c4d2', tick: '#7b8794', ink: '#111827',
};

/* ============================================================
   슬라이드 3 — 사인파 한 주기
   ============================================================ */
function drawSine() {
  const g = new Graph('cv-sine', { xMin: 0, xMax: 4 * Math.PI, yMin: -1.35, yMax: 1.35, pad: { l: 60, r: 30, t: 40, b: 56 } });
  if (!g.canvas) return;
  g.clear();
  g.grid([], [-1, 0, 1]);
  // x축 (y=0)
  g.ctx.strokeStyle = C.axis; g.ctx.lineWidth = 1.5;
  g.ctx.beginPath(); g.ctx.moveTo(g.pad.l, g.wy(0)); g.ctx.lineTo(g.pad.l + g.PW, g.wy(0)); g.ctx.stroke();
  // 사인 곡선
  g.curve(x => Math.sin(x), C.accent, 3.5);
  // 한 주기 (0 ~ 2π) 표시: 양쪽 화살표
  const y0 = g.wy(0), markY = g.wy(-1.18);
  const x0 = g.wx(0), x1 = g.wx(2 * Math.PI);
  const ctx = g.ctx;
  ctx.strokeStyle = C.red; ctx.fillStyle = C.red; ctx.lineWidth = 2.5;
  // 세로 점선 (주기 경계)
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(x0, g.wy(1.05)); ctx.lineTo(x0, markY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, g.wy(1.05)); ctx.lineTo(x1, markY); ctx.stroke();
  ctx.setLineDash([]);
  // 양쪽 화살표 선
  ctx.beginPath(); ctx.moveTo(x0, markY); ctx.lineTo(x1, markY); ctx.stroke();
  const arrow = (xx, dir) => { ctx.beginPath(); ctx.moveTo(xx, markY); ctx.lineTo(xx + dir * 12, markY - 7); ctx.lineTo(xx + dir * 12, markY + 7); ctx.closePath(); ctx.fill(); };
  arrow(x0, 1); arrow(x1, -1);
  g.pxText((x0 + x1) / 2, markY - 22, 'T (주기)', { color: C.red, size: 24, weight: 600 });
  // 축 라벨
  g.pxText(g.pad.l + g.PW, g.wy(0) + 34, '시간 →', { color: C.tick, size: 22, align: 'right' });
  g.pxText(g.pad.l - 38, g.pad.t + 6, '진폭', { color: C.tick, size: 22, align: 'center' });
}

/* ============================================================
   슬라이드 5 — 라인 스펙트럼 (배음)
   ============================================================ */
function drawSpectrum() {
  const g = new Graph('cv-spectrum', { xMin: 0, xMax: 500, yMin: 0, yMax: 1.15, pad: { l: 64, r: 30, t: 40, b: 64 } });
  if (!g.canvas) return;
  g.clear();
  g.frame();
  const bars = [
    { f: 100, h: 1.00, label: 'f0' },
    { f: 200, h: 0.72, label: '2f0' },
    { f: 300, h: 0.50, label: '3f0' },
    { f: 400, h: 0.34, label: '4f0' },
  ];
  const ctx = g.ctx;
  bars.forEach(b => {
    const x = g.wx(b.f);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, g.wy(0)); ctx.lineTo(x, g.wy(b.h)); ctx.stroke();
    g.dot(b.f, b.h, C.accent, 7);
    g.pxText(x, g.wy(0) + 30, b.label, { color: C.accent, size: 24, weight: 600 });
    g.pxText(x, g.wy(0) + 56, `${b.f}Hz`, { color: C.tick, size: 19 });
  });
  g.pxText(g.pad.l + g.PW / 2, g.H - 14, '주파수 (Hz)', { color: C.tick, size: 22 });
}

/* ============================================================
   슬라이드 8 — VOT 타임라인 (바/파/빠)
   ============================================================ */
function drawF0Contour() {
  // 수렴값: 바 93, 파 126, 빠 122 Hz (tau=80ms → t=250ms에서 ~96% 수렴)
  const contours = [
    { name: '경음 (빠)', color: C.green,  f: t =>  122 + 46 * Math.exp(-t / 80) },  // 168→122
    { name: '격음 (파)', color: C.red,    f: t =>  126 + 52 * Math.exp(-t / 80) },  // 178→126
    { name: '평음 (바)', color: C.accent, f: t =>   93 - 15 * Math.exp(-t / 80) },  //  78→93
  ];

  const g = new Graph('cv-f0-contour', {
    xMin: 0, xMax: 250, yMin: 65, yMax: 195,
    pad: { l: 80, r: 140, t: 44, b: 68 },
  });
  if (!g.canvas) return;
  g.clear();
  g.grid([50, 100, 150, 200, 250], [80, 100, 120, 140, 160, 180]);
  g.frame();

  const { ctx } = g;

  // x축 틱
  ctx.fillStyle = C.tick; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = '19px "IBM Plex Sans KR",sans-serif';
  [0, 50, 100, 150, 200, 250].forEach(x => ctx.fillText(x, g.wx(x), g.pad.t + g.PH + 8));

  // y축 틱
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  [80, 100, 120, 140, 160, 180].forEach(y => ctx.fillText(y, g.pad.l - 8, g.wy(y)));

  // 축 제목
  g.pxText(g.pad.l + g.PW / 2, g.H - 14, '버스트 이후 시간 (ms)', { size: 20 });
  ctx.save();
  ctx.translate(16, g.pad.t + g.PH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = C.tick; ctx.font = '20px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('f₀ (Hz)', 0, 0);
  ctx.restore();

  contours.forEach(({ name, color, f }) => {
    g.curve(f, color, 3.5);
    g.text(250, f(250), name, { color, size: 21, weight: 600, dx: 12, dy: 7 });
  });

  // 시작점 강조
  contours.forEach(({ color, f }) => g.dot(0, f(0), color, 7));
}

/* ============================================================
   슬라이드 11 — 멜 스케일 곡선
   ============================================================ */
function drawMel() {
  const mel = f => 2595 * Math.log10(1 + f / 700);
  const g = new Graph('cv-mel', { xMin: 0, xMax: 8000, yMin: 0, yMax: 3200, pad: { l: 86, r: 36, t: 44, b: 66 } });
  if (!g.canvas) return;
  g.clear();
  g.frame();
  const xs = [2000, 4000, 6000, 8000];
  const ys = [500, 1000, 1500, 2000, 2500, 3000];
  g.grid(xs, ys);
  g.curve(mel, C.accent, 3.5);
  xs.forEach(x => g.pxText(g.wx(x), g.pad.t + g.PH + 26, (x / 1000) + 'k', { color: C.tick, size: 20 }));
  g.pxText(g.wx(0), g.pad.t + g.PH + 26, '0', { color: C.tick, size: 20 });
  [1000, 2000, 3000].forEach(y => g.pxText(g.pad.l - 12, g.wy(y), String(y), { color: C.tick, size: 20, align: 'right' }));
  g.pxText(g.pad.l + g.PW / 2, g.H - 14, '주파수 (Hz)', { color: C.tick, size: 22 });
  g.ctx.save();
  g.ctx.translate(22, g.pad.t + g.PH / 2); g.ctx.rotate(-Math.PI / 2);
  g.ctx.fillStyle = C.tick; g.ctx.textAlign = 'center'; g.ctx.font = '22px "IBM Plex Sans KR",sans-serif';
  g.ctx.fillText('멜 (mel)', 0, 0); g.ctx.restore();
}

/* ============================================================
   데이터 객체 (슬라이드 13·14·15·16)
   화자 3인: TTS / 인간1 / 인간2
   ============================================================ */

// TODO: 실제 측정값으로 교체 (단위: ms)
const votTable = {
  "바": { TTS: 22,  인간1: 18,  인간2: 20  },
  "파": { TTS: 65,  인간1: 78,  인간2: 74  },
  "빠": { TTS: 15,  인간1: 12,  인간2: 13  },
};

// TODO: 실제 측정값으로 교체 (단위: Hz, 모음 초반 f0)
const f0 = {
  "바": { TTS: 125, 인간1: 118, 인간2: 112 },
  "파": { TTS: 148, 인간1: 155, 인간2: 151 },
  "빠": { TTS: 152, 인간1: 150, 인간2: 148 },
};

// TODO: 실제 측정값으로 교체 (단위: Hz, [F1, F2])
const vowels = {
  "이": { TTS: [300, 2150], 인간1: [290, 2200], 인간2: [285, 2220] },
  "에": { TTS: [440, 1950], 인간1: [450, 1900], 인간2: [445, 1920] },
  "애": { TTS: [570, 1800], 인간1: [560, 1750], 인간2: [555, 1760] },
  "아": { TTS: [730, 1350], 인간1: [750, 1300], 인간2: [745, 1280] },
  "어": { TTS: [620, 1100], 인간1: [600, 1050], 인간2: [610, 1070] },
  "오": { TTS: [440, 850],  인간1: [430, 800],  인간2: [425, 810]  },
  "우": { TTS: [340, 800],  인간1: [330, 750],  인간2: [325, 760]  },
  "으": { TTS: [360, 1400], 인간1: [350, 1450], 인간2: [355, 1440] },
};

const SPEAKERS = [
  { key: 'TTS',  color: C.red,    cls: 'col-tts'    },
  { key: '인간1', color: C.accent, cls: 'col-human'  },
  { key: '인간2', color: C.green,  cls: 'col-human2' },
];

/* ---------- 슬라이드 13: VOT 표 채우기 ---------- */
function fillVotTable() {
  const words = { ba: '바', pa: '파', ppa: '빠' };
  const spAbr = { TTS: 't', 인간1: 'h1', 인간2: 'h2' };
  for (const [abbr, word] of Object.entries(words))
    for (const [sp, a] of Object.entries(spAbr)) {
      const el = document.getElementById(`vot-${a}-${abbr}`);
      if (el) el.textContent = `${votTable[word][sp]} ms`;
    }
}

/* ---------- 슬라이드 14: f0 표 채우기 ---------- */
function fillF0Table() {
  const words = { ba: '바', pa: '파', ppa: '빠' };
  const spAbr = { TTS: 't', 인간1: 'h1', 인간2: 'h2' };
  for (const [abbr, word] of Object.entries(words))
    for (const [sp, a] of Object.entries(spAbr)) {
      const el = document.getElementById(`f0-${a}-${abbr}`);
      if (el) el.textContent = `${f0[word][sp]} Hz`;
    }
}

/* ---------- 공통 3-bar 차트 (슬라이드 13·14) ---------- */
function drawBarChart(canvasId, data, { yMax, yTicks, yLabel }) {
  const words = Object.keys(data);
  const g = new Graph(canvasId, {
    xMin: 0, xMax: words.length, yMin: 0, yMax,
    pad: { l: 78, r: 30, t: 36, b: 66 },
  });
  if (!g.canvas) return;
  g.clear(); g.frame();
  g.grid([], yTicks);
  yTicks.forEach(y => g.pxText(g.pad.l - 12, g.wy(y), String(y), { color: C.tick, size: 20, align: 'right' }));
  const { ctx } = g;
  const groupW = g.PW / words.length;
  const barW = groupW * 0.20;
  const offsets = [-barW * 1.2, 0, barW * 1.2];
  words.forEach((w, i) => {
    const cx = g.pad.l + groupW * (i + 0.5);
    SPEAKERS.forEach((sp, j) => {
      const v = data[w][sp.key];
      const bx = cx + offsets[j], by = g.wy(v), base = g.wy(0);
      ctx.fillStyle = sp.color;
      ctx.fillRect(bx - barW / 2, by, barW, base - by);
      ctx.fillStyle = sp.color;
      ctx.font = '600 17px "IBM Plex Sans KR",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v, bx, by - 7);
    });
    ctx.fillStyle = C.ink; ctx.font = '600 24px "IBM Plex Sans KR",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(w, cx, g.pad.t + g.PH + 32);
  });
  ctx.save();
  ctx.translate(20, g.pad.t + g.PH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = C.tick; ctx.textAlign = 'center'; ctx.font = '21px "IBM Plex Sans KR",sans-serif';
  ctx.fillText(yLabel, 0, 0); ctx.restore();
}

/* ---------- 모음 공간 산점도 공통 (축 뒤집기: F2 ←, F1 ↓) ---------- */
function drawVowelScatter(canvasId, data) {
  if (!document.getElementById(canvasId)) return;
  let f1s = [], f2s = [];
  Object.values(data).forEach(d =>
    SPEAKERS.forEach(sp => { f1s.push(d[sp.key][0]); f2s.push(d[sp.key][1]); })
  );
  const pad1 = 60, pad2 = 120;
  const f1lo = Math.min(...f1s) - pad1, f1hi = Math.max(...f1s) + pad1;
  const f2lo = Math.min(...f2s) - pad2, f2hi = Math.max(...f2s) + pad2;
  const g = new Graph(canvasId, { xMin: f2hi, xMax: f2lo, yMin: f1hi, yMax: f1lo, pad: { l: 78, r: 40, t: 46, b: 62 } });
  g.clear(); g.frame();
  const { ctx } = g;
  // 같은 모음의 3점을 삼각형으로 연결
  for (const d of Object.values(data)) {
    ctx.strokeStyle = '#c4cedb'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    const pts = SPEAKERS.map(sp => [g.wx(d[sp.key][1]), g.wy(d[sp.key][0])]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const [name, d] of Object.entries(data)) {
    SPEAKERS.forEach(sp => g.dot(d[sp.key][1], d[sp.key][0], sp.color, 8));
    g.text(d['인간1'][1], d['인간1'][0], name, { color: C.ink, dx: 12, dy: -10, size: 21, weight: 600 });
  }
  g.pxText(g.pad.l + g.PW / 2, g.H - 12, 'F2 (Hz) — 높을수록 왼쪽', { color: C.tick, size: 21 });
  ctx.save();
  ctx.translate(20, g.pad.t + g.PH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = C.tick; ctx.textAlign = 'center'; ctx.font = '21px "IBM Plex Sans KR",sans-serif';
  ctx.fillText('F1 (Hz) — 높을수록 아래', 0, 0); ctx.restore();
}

/* ============================================================
   초기화
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderMathInElement(document.body, {
    delimiters: [
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true },
    ],
    throwOnError: false,
    strict: false,
  });
  setupImagePlaceholders();
  fillVotTable();
  fillF0Table();
  const start = parseInt((location.hash || '').replace('#', ''), 10);
  showSlide(Number.isInteger(start) ? start : 1);
  requestAnimationFrame(() => {
    drawSine();
    drawSpectrum();
    drawF0Contour();
    drawMel();
    drawBarChart('cv-vot-bar', votTable, { yMax: 120, yTicks: [20, 40, 60, 80, 100], yLabel: 'VOT (ms)' });
    drawBarChart('cv-f0', f0, { yMax: 200, yTicks: [40, 80, 120, 160], yLabel: 'f₀ (Hz)' });
    drawVowelScatter('cv-vowel', vowels);
    const aeData = Object.fromEntries(['에', '애'].map(k => [k, vowels[k]]));
    drawVowelScatter('cv-aee', aeData);
  });
});
