/* ══════════════════════════════════════════════════════
   slide.js — 한국어 모음 합류 발표
   ══════════════════════════════════════════════════════ */

// ── Viewport scaling ────────────────────────────────────
function scaleViewport() {
  const vp = document.getElementById('slide-viewport');
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const ox = (window.innerWidth  - 1920 * scale) / 2;
  const oy = (window.innerHeight - 1080 * scale) / 2;
  vp.style.transform = `scale(${scale})`;
  vp.style.position  = 'absolute';
  vp.style.left      = `${ox}px`;
  vp.style.top       = `${oy}px`;
}
window.addEventListener('resize', scaleViewport);
scaleViewport();

// ── Navigation ───────────────────────────────────────────
const TOTAL = 30;
let current = 1;

function showSlide(n) {
  document.getElementById(`slide-${current}`).classList.remove('active');
  current = Math.max(1, Math.min(TOTAL, n));
  document.getElementById(`slide-${current}`).classList.add('active');
  document.getElementById('slide-counter').textContent = `${current} / ${TOTAL}`;
  document.getElementById('btn-prev').disabled = current === 1;
  document.getElementById('btn-next').disabled = current === TOTAL;
}
function navigate(dir) { showSlide(current + dir); }

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
});
document.getElementById('btn-prev').addEventListener('click', () => navigate(-1));
document.getElementById('btn-next').addEventListener('click', () => navigate(1));

// ── Graph class ──────────────────────────────────────────
class Graph {
  constructor(id, { xMin, xMax, yMin, yMax }) {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx  = this.canvas.getContext('2d');
    this.W    = this.canvas.width;
    this.H    = this.canvas.height;
    this.xMin = xMin; this.xMax = xMax;
    this.yMin = yMin; this.yMax = yMax;
  }
  wx(x) { return (x - this.xMin) / (this.xMax - this.xMin) * this.W; }
  wy(y) { return (this.yMax - y) / (this.yMax - this.yMin) * this.H; }
  clear(bg = '#ffffff') {
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.W, this.H);
  }
  drawGrid(stepX = 1, stepY = 1) {
    const { ctx, W, H } = this;
    ctx.beginPath(); ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 1;
    for (let x = Math.ceil(this.xMin); x <= this.xMax; x += stepX) {
      const cx = this.wx(x); ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    }
    for (let y = Math.ceil(this.yMin); y <= this.yMax; y += stepY) {
      const cy = this.wy(y); ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    }
    ctx.stroke();
  }
  drawAxes(color = '#b8c4d2') {
    const { ctx, W, H } = this;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    if (this.yMin <= 0 && this.yMax >= 0) {
      ctx.moveTo(0, this.wy(0)); ctx.lineTo(W, this.wy(0));
    }
    if (this.xMin <= 0 && this.xMax >= 0) {
      ctx.moveTo(this.wx(0), 0); ctx.lineTo(this.wx(0), H);
    }
    ctx.stroke();
  }
  drawCurve(f, color, lw = 2.5, steps = 800) {
    const { ctx } = this;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw;
    let pen = false;
    for (let i = 0; i <= steps; i++) {
      const x = this.xMin + (this.xMax - this.xMin) * i / steps;
      const y = f(x);
      const ok = isFinite(y) && y >= this.yMin - 0.8 && y <= this.yMax + 0.8;
      if (!ok) { pen = false; continue; }
      const cx = this.wx(x), cy = this.wy(y);
      pen ? ctx.lineTo(cx, cy) : (ctx.moveTo(cx, cy), (pen = true));
    }
    ctx.stroke();
  }
  drawDash(f, color, lw = 2) {
    this.ctx.setLineDash([12, 8]);
    this.drawCurve(f, color, lw);
    this.ctx.setLineDash([]);
  }
  dot(x, y, color, r = 7) {
    const { ctx } = this;
    ctx.beginPath(); ctx.arc(this.wx(x), this.wy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  text(x, y, str, color = '#333', dx = 10, dy = -10, size = 20) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = `${size}px "IBM Plex Sans KR","IBM Plex Sans",sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(str, this.wx(x) + dx, this.wy(y) + dy);
  }
  ticksX(vals, labelFn, dy = 22, size = 18) {
    const { ctx } = this;
    ctx.fillStyle = '#7b8794';
    ctx.font = `${size}px "IBM Plex Sans",sans-serif`;
    ctx.textAlign = 'center';
    for (const v of vals) ctx.fillText(labelFn(v), this.wx(v), this.wy(this.yMin) + dy + 4);
  }
  ticksY(vals, labelFn, dx = -8, size = 18) {
    const { ctx } = this;
    ctx.fillStyle = '#7b8794';
    ctx.font = `${size}px "IBM Plex Sans",sans-serif`;
    ctx.textAlign = 'right';
    for (const v of vals) ctx.fillText(labelFn(v), this.wx(this.xMin) + dx, this.wy(v) + 6);
  }
}

// ── Color constants ──────────────────────────────────────
const C_ACCENT  = '#1e4f8f';
const C_RED     = '#b42318';
const C_GREEN   = '#1f7a4d';
const C_MUTED   = '#6b7280';
const C_ORANGE  = '#d97706';
const C_INK     = '#111827';
const C_BORDER  = '#d9e2ec';

// ── Korean vowel data ────────────────────────────────────
const VOWELS = [
  { label: 'ㅣ', f1: 280,  f2: 2300, base: true },
  { label: 'ㅔ', f1: 530,  f2: 1950, merge: true },
  { label: 'ㅐ', f1: 540,  f2: 1926, merge: true },
  { label: 'ㅡ', f1: 400,  f2: 1400, base: false },
  { label: 'ㅏ', f1: 800,  f2: 1200, base: true },
  { label: 'ㅓ', f1: 600,  f2: 1100, base: false },
  { label: 'ㅗ', f1: 450,  f2: 800,  base: false },
  { label: 'ㅜ', f1: 380,  f2: 700,  base: true },
];

// ── Slide 9: Perturbation theory ─────────────────────────
function drawPerturb() {
  const canvas = document.getElementById('cv-perturb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const px = 80, py = 40;
  const tubeW = W - 2 * px;
  const tubeH = 80;
  const midY = H / 2;

  // Tube outline
  ctx.strokeStyle = C_BORDER;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, midY - tubeH / 2, tubeW, tubeH);

  // Labels: 성문 (left, closed) and 입술 (right, open)
  ctx.fillStyle = C_MUTED;
  ctx.font = '22px "IBM Plex Sans KR","IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('성문(닫힌 끝)', px, midY - tubeH / 2 - 14);
  ctx.fillText('입술(열린 끝)', px + tubeW, midY - tubeH / 2 - 14);

  // Closed end marker
  ctx.fillStyle = C_INK;
  ctx.fillRect(px - 6, midY - tubeH / 2, 6, tubeH);
  // Open end marker (gap)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + tubeW, midY - tubeH / 2 - 4, 8, tubeH + 8);
  ctx.strokeStyle = C_BORDER;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + tubeW, midY - tubeH / 2);
  ctx.lineTo(px + tubeW, midY - tubeH / 2 - 12);
  ctx.moveTo(px + tubeW, midY + tubeH / 2);
  ctx.lineTo(px + tubeW, midY + tubeH / 2 + 12);
  ctx.stroke();

  // Draw F1 velocity standing wave: V(x) = sin(πx/2L) for x in [0, L]
  const L = tubeW;
  const amp = 130;
  ctx.beginPath();
  ctx.strokeStyle = C_ACCENT;
  ctx.lineWidth = 3.5;
  for (let i = 0; i <= 800; i++) {
    const x = i / 800;
    const y = Math.sin(Math.PI * x / 2);
    const cx = px + x * L;
    const cy = midY - y * amp;
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Axis line (zero line inside tube)
  ctx.strokeStyle = '#d9e2ec';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(px, midY);
  ctx.lineTo(px + tubeW, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mark velocity node at glottis (x=0): V=0
  ctx.fillStyle = C_INK;
  ctx.beginPath();
  ctx.arc(px, midY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', px, midY + 5);

  // Mark velocity antinode at lips (x=L): V=max
  ctx.fillStyle = C_ACCENT;
  ctx.beginPath();
  ctx.arc(px + tubeW, midY - amp, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText('V', px + tubeW, midY - amp + 5);

  // Constriction 1: anterior (near lips) — F1 降
  const xAnt = 0.78;
  const yAnt = Math.sin(Math.PI * xAnt / 2);
  const cxAnt = px + xAnt * L;
  const cyAnt = midY - yAnt * amp;

  ctx.fillStyle = C_RED;
  ctx.beginPath();
  ctx.arc(cxAnt, cyAnt, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('高', cxAnt, cyAnt + 6);

  // Label below
  ctx.fillStyle = C_RED;
  ctx.font = '22px "IBM Plex Sans KR","IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('고모음', cxAnt, midY + tubeH / 2 + 32);
  ctx.fillText('협착 ≈ 속도 배', cxAnt, midY + tubeH / 2 + 58);
  ctx.fillText('→ F1 하강', cxAnt, midY + tubeH / 2 + 84);

  // Constriction 2: posterior (near glottis) — F1 升
  const xPost = 0.18;
  const yPost = Math.sin(Math.PI * xPost / 2);
  const cxPost = px + xPost * L;
  const cyPost = midY - yPost * amp;

  ctx.fillStyle = C_GREEN;
  ctx.beginPath();
  ctx.arc(cxPost, cyPost, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('低', cxPost, cyPost + 6);

  ctx.fillStyle = C_GREEN;
  ctx.font = '22px "IBM Plex Sans KR","IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('저모음', cxPost, midY + tubeH / 2 + 32);
  ctx.fillText('협착 ≈ 속도 절', cxPost, midY + tubeH / 2 + 58);
  ctx.fillText('→ F1 상승', cxPost, midY + tubeH / 2 + 84);

  // Wave label
  ctx.fillStyle = C_ACCENT;
  ctx.font = '22px "IBM Plex Sans KR","IBM Plex Sans",sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('F1 속도 정상파  V(x) = sin(πx/2L)', px, 28);
}

// ── Helpers for vowel charts ─────────────────────────────
function vowelChartCoords(canvas, f1, f2, margins) {
  const { left, right, top, bottom } = margins;
  const W = canvas.width, H = canvas.height;
  const drawW = W - left - right;
  const drawH = H - top - bottom;
  const F2_MAX = 2500, F2_MIN = 600;
  const F1_MIN = 200,  F1_MAX = 900;
  const cx = left + (F2_MAX - f2) / (F2_MAX - F2_MIN) * drawW;
  const cy = top  + (f1 - F1_MIN) / (F1_MAX - F1_MIN) * drawH;
  return { cx, cy };
}

function drawVowelAxes(ctx, W, H, margins, fontSize = 22) {
  const { left, right, top, bottom } = margins;
  const drawW = W - left - right;
  const drawH = H - top - bottom;
  const F2_MAX = 2500, F2_MIN = 600;
  const F1_MIN = 200,  F1_MAX = 900;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 1;
  [500, 1000, 1500, 2000, 2500].forEach(f2 => {
    if (f2 < F2_MIN || f2 > F2_MAX) return;
    const cx = left + (F2_MAX - f2) / (F2_MAX - F2_MIN) * drawW;
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, top + drawH); ctx.stroke();
  });
  [200, 300, 400, 500, 600, 700, 800, 900].forEach(f1 => {
    const cy = top + (f1 - F1_MIN) / (F1_MAX - F1_MIN) * drawH;
    ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(left + drawW, cy); ctx.stroke();
  });

  // Axes
  ctx.strokeStyle = C_BORDER; ctx.lineWidth = 2;
  ctx.strokeRect(left, top, drawW, drawH);

  // X-axis labels (F2, top — descending left to right)
  ctx.fillStyle = C_MUTED;
  ctx.font = `${fontSize}px "IBM Plex Sans",sans-serif`;
  ctx.textAlign = 'center';
  [2500, 2000, 1500, 1000, 600].forEach(f2 => {
    if (f2 < F2_MIN || f2 > F2_MAX) return;
    const cx = left + (F2_MAX - f2) / (F2_MAX - F2_MIN) * drawW;
    ctx.fillText(f2, cx, top - 8);
  });
  ctx.font = `${fontSize + 2}px "IBM Plex Sans",sans-serif`;
  ctx.fillText('← F2 (Hz)', left + drawW / 2, top - 30);

  // Y-axis labels (F1, descending downward)
  ctx.textAlign = 'right';
  ctx.font = `${fontSize}px "IBM Plex Sans",sans-serif`;
  [200, 400, 600, 800].forEach(f1 => {
    const cy = top + (f1 - F1_MIN) / (F1_MAX - F1_MIN) * drawH;
    ctx.fillText(f1, left - 8, cy + 6);
  });
  ctx.save();
  ctx.translate(18, top + drawH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = `${fontSize + 2}px "IBM Plex Sans",sans-serif`;
  ctx.fillText('F1 (Hz) ↓', 0, 0);
  ctx.restore();
}

// ── Slide 14: Zoomed ㅔ/ㅐ vowel chart ───────────────────
function drawVowelZoom() {
  const canvas = document.getElementById('cv-vowel-zoom');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const mg = { left: 80, right: 30, top: 60, bottom: 50 };
  const drawW = W - mg.left - mg.right;
  const drawH = H - mg.top - mg.bottom;

  // Zoomed range centered on ㅔ/ㅐ
  const F2_MAX = 2100, F2_MIN = 1700;
  const F1_MIN = 450,  F1_MAX = 650;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  function cx(f2) { return mg.left + (F2_MAX - f2) / (F2_MAX - F2_MIN) * drawW; }
  function cy(f1) { return mg.top  + (f1 - F1_MIN) / (F1_MAX - F1_MIN) * drawH; }

  // Grid
  ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 1;
  [1700, 1750, 1800, 1850, 1900, 1950, 2000, 2050, 2100].forEach(f2 => {
    ctx.beginPath(); ctx.moveTo(cx(f2), mg.top); ctx.lineTo(cx(f2), mg.top + drawH); ctx.stroke();
  });
  [450, 500, 550, 600, 650].forEach(f1 => {
    ctx.beginPath(); ctx.moveTo(mg.left, cy(f1)); ctx.lineTo(mg.left + drawW, cy(f1)); ctx.stroke();
  });

  ctx.strokeStyle = C_BORDER; ctx.lineWidth = 2;
  ctx.strokeRect(mg.left, mg.top, drawW, drawH);

  // Axis labels
  ctx.fillStyle = C_MUTED;
  ctx.font = '20px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  [1800, 1900, 2000].forEach(f2 => ctx.fillText(f2, cx(f2), mg.top - 8));
  ctx.textAlign = 'right';
  [500, 550, 600].forEach(f1 => ctx.fillText(f1, mg.left - 8, cy(f1) + 6));
  ctx.font = '20px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = C_MUTED;
  ctx.fillText('← F2 (Hz)', mg.left + drawW / 2, mg.top - 30);
  ctx.save(); ctx.translate(18, mg.top + drawH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('F1 (Hz) ↓', 0, 0); ctx.restore();

  // ERB region around the two vowels — show a critical band ellipse
  const eF1 = 530, eF2 = 1950;
  const aF1 = 540, aF2 = 1926;
  const erb = 24.7 * (4.37 * 535 / 1000 + 1); // ~83Hz around F1=535

  // Shade ERB band (horizontal band of ±ERB/2 around F1 midpoint)
  const midF1 = (eF1 + aF1) / 2;
  const bandTop = cy(midF1 - erb / 2);
  const bandBot = cy(midF1 + erb / 2);
  ctx.fillStyle = 'rgba(217,119,6,0.08)';
  ctx.fillRect(mg.left, bandTop, drawW, bandBot - bandTop);
  ctx.strokeStyle = 'rgba(217,119,6,0.35)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(mg.left, bandTop, drawW, bandBot - bandTop);
  ctx.setLineDash([]);

  // ERB label
  ctx.fillStyle = C_ORANGE;
  ctx.font = '20px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`ERB ≈ ${Math.round(erb)} Hz`, mg.left + drawW - 8, bandTop - 6);

  // Arrow showing 10Hz gap
  const x1 = cx(eF2) - 20, y1 = cy(eF1), y2 = cy(aF1);
  ctx.strokeStyle = C_MUTED; ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C_MUTED; ctx.font = '19px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('10 Hz', x1 - 6, (y1 + y2) / 2 + 7);

  // Draw vowels
  const rr = 20;
  // ㅔ
  ctx.beginPath();
  ctx.arc(cx(eF2), cy(eF1), rr, 0, Math.PI * 2);
  ctx.fillStyle = C_ACCENT; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ㅔ', cx(eF2), cy(eF1) + 8);

  // ㅐ
  ctx.beginPath();
  ctx.arc(cx(aF2), cy(aF1), rr, 0, Math.PI * 2);
  ctx.fillStyle = C_ORANGE; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ㅐ', cx(aF2), cy(aF1) + 8);

  // Data labels
  ctx.fillStyle = C_ACCENT;
  ctx.font = '20px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ㅔ  F1=${eF1} Hz, F2=${eF2} Hz`, mg.left + 8, mg.top + drawH + 38);
  ctx.fillStyle = C_ORANGE;
  ctx.fillText(`ㅐ  F1=${aF1} Hz, F2=${aF2} Hz`, mg.left + 8, mg.top + drawH + 60);
}

// ── Slide 15: Contrast vowel chart ──────────────────────
function drawVowelContrast() {
  const canvas = document.getElementById('cv-vowel-contrast');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const mg = { left: 80, right: 30, top: 60, bottom: 50 };

  drawVowelAxes(ctx, W, H, mg, 20);

  const markers = [mg];
  const F2_MAX = 2500, F2_MIN = 600;
  const F1_MIN = 200,  F1_MAX = 900;
  const drawW = W - mg.left - mg.right;
  const drawH = H - mg.top - mg.bottom;

  function cx(f2) { return mg.left + (F2_MAX - f2) / (F2_MAX - F2_MIN) * drawW; }
  function cy(f1) { return mg.top  + (f1 - F1_MIN) / (F1_MAX - F1_MIN) * drawH; }

  // Draw triangle ㅣ-ㅏ-ㅜ
  const triangle = VOWELS.filter(v => v.base);
  ctx.beginPath();
  ctx.moveTo(cx(triangle[0].f2), cy(triangle[0].f1));
  triangle.slice(1).forEach(v => ctx.lineTo(cx(v.f2), cy(v.f1)));
  ctx.closePath();
  ctx.fillStyle = 'rgba(30,79,143,0.07)';
  ctx.fill();
  ctx.strokeStyle = C_ACCENT; ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]); ctx.stroke(); ctx.setLineDash([]);

  // Circle around ㅔ/ㅐ merge zone
  const mergeX = cx(1938), mergeY = cy(535);
  ctx.beginPath();
  ctx.arc(mergeX, mergeY, 38, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(217,119,6,0.12)'; ctx.fill();
  ctx.strokeStyle = C_ORANGE; ctx.lineWidth = 2.5; ctx.stroke();

  // Draw all vowels
  VOWELS.forEach(v => {
    const vx = cx(v.f2), vy = cy(v.f1);
    const r = v.merge ? 18 : 15;
    const fill = v.merge ? C_ORANGE : (v.base ? C_ACCENT : C_MUTED);
    ctx.beginPath(); ctx.arc(vx, vy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${v.merge ? 18 : 16}px "IBM Plex Sans KR",sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(v.label, vx, vy + 6);
  });

  // Distance annotation
  const iV = VOWELS.find(v => v.label === 'ㅣ');
  const aV = VOWELS.find(v => v.label === 'ㅏ');
  ctx.strokeStyle = 'rgba(180,35,24,0.5)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(cx(iV.f2), cy(iV.f1));
  ctx.lineTo(cx(aV.f2), cy(aV.f1));
  ctx.stroke(); ctx.setLineDash([]);
  const midX = (cx(iV.f2) + cx(aV.f2)) / 2;
  const midY2 = (cy(iV.f1) + cy(aV.f1)) / 2;
  ctx.fillStyle = C_RED;
  ctx.font = '19px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('~1400 Hz', midX + 28, midY2 - 8);

  // Legend
  ctx.font = '20px "IBM Plex Sans KR",sans-serif';
  ctx.fillStyle = C_ORANGE;
  ctx.textAlign = 'left';
  ctx.fillText('● ㅔ/ㅐ — 합류 (음향 공간 내 인접)', mg.left + 4, mg.top + drawH + 38);
  ctx.fillStyle = C_ACCENT;
  ctx.fillText('◉ ㅣ·ㅏ·ㅜ — 비합류 (음향 공간 극단)', mg.left + 4, mg.top + drawH + 60);
}

// ── Slide 18: ERB curve ──────────────────────────────────
function drawERB() {
  const canvas = document.getElementById('cv-erb');
  if (!canvas) return;
  const g = new Graph('cv-erb', { xMin: 100, xMax: 2600, yMin: 0, yMax: 250 });
  g.clear();
  g.drawGrid(500, 50);

  const ctx = g.ctx;

  // ERB(f) = 24.7 * (4.37f/1000 + 1)
  const erb = f => 24.7 * (4.37 * f / 1000 + 1);

  // Shaded fill under curve
  ctx.beginPath();
  for (let i = 0; i <= 800; i++) {
    const f = 100 + (2600 - 100) * i / 800;
    const e = erb(f);
    const cx = g.wx(f), cy = g.wy(e);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.lineTo(g.wx(2600), g.wy(0));
  ctx.lineTo(g.wx(100), g.wy(0));
  ctx.closePath();
  ctx.fillStyle = 'rgba(30,79,143,0.06)'; ctx.fill();

  // ERB curve
  g.drawCurve(erb, C_ACCENT, 3);

  // Vertical line at f=540Hz
  const f0 = 540;
  const e0 = Math.round(erb(f0));
  ctx.strokeStyle = C_ORANGE; ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(g.wx(f0), g.wy(0));
  ctx.lineTo(g.wx(f0), g.wy(e0));
  ctx.stroke(); ctx.setLineDash([]);

  // Horizontal dashed line at ERB(540)
  ctx.strokeStyle = C_ORANGE; ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(g.wx(100), g.wy(e0));
  ctx.lineTo(g.wx(f0), g.wy(e0));
  ctx.stroke(); ctx.setLineDash([]);

  // Vertical tiny line for 10Hz difference
  ctx.strokeStyle = C_RED; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.wx(f0) + 6, g.wy(0));
  ctx.lineTo(g.wx(f0) + 6, g.wy(10));
  ctx.stroke();

  // Dots
  g.dot(f0, e0, C_ORANGE, 8);
  g.dot(f0, 10, C_RED, 6);

  // Annotations
  const fs = 21;
  ctx.fillStyle = C_ORANGE;
  ctx.font = `${fs}px "IBM Plex Sans",sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`ERB(${f0}) ≈ ${e0} Hz`, g.wx(100) + 8, g.wy(e0) - 8);

  ctx.fillStyle = C_RED;
  ctx.fillText(`ㅔ/ㅐ 차이 10 Hz`, g.wx(f0) + 20, g.wy(5));

  ctx.fillStyle = C_ORANGE;
  ctx.fillText(`F1 = ${f0} Hz`, g.wx(f0) - 72, g.wy(0) - 12);

  // X-axis ticks
  ctx.fillStyle = C_MUTED;
  ctx.font = `${fs}px "IBM Plex Sans",sans-serif`;
  ctx.textAlign = 'center';
  [200, 500, 1000, 1500, 2000, 2500].forEach(f => {
    ctx.fillText(f, g.wx(f), g.wy(0) + 26);
  });
  ctx.fillText('주파수 (Hz)', g.wx(1350), g.wy(0) + 50);

  // Y-axis ticks
  ctx.textAlign = 'right';
  [0, 50, 100, 150, 200].forEach(e => {
    ctx.fillText(e, g.wx(100) - 8, g.wy(e) + 6);
  });
  ctx.save(); ctx.translate(g.wx(100) - 52, g.wy(125)); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('ERB 대역폭 (Hz)', 0, 0);
  ctx.restore();

  // Box: 10Hz << 83Hz
  ctx.fillStyle = 'rgba(180,35,24,0.07)';
  const bx = g.wx(1400), by = g.wy(230), bw = 500, bh = 70;
  roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
  ctx.strokeStyle = C_RED; ctx.lineWidth = 1.5; roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();
  ctx.fillStyle = C_RED;
  ctx.font = `bold ${fs}px "IBM Plex Sans",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`10 Hz << ${e0} Hz  →  구별 불능`, bx + bw / 2, by + bh / 2 + 8);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Slide 19: Interactive critical band ──────────────────
function erb(f) { return 24.7 * (4.37 * f / 1000 + 1); }
function erbRate(f) { return 21.4 * Math.log10(4.37 * f / 1000 + 1); }
function mmOnBM(f) { return erbRate(f) * 0.9; }

function drawCritical(fa, fb) {
  const canvas = document.getElementById('cv-critical');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const fMin = 200, fMax = 1100;
  const padL = 80, padR = 80, padT = 60, padB = 70;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;

  function toX(f) {
    return padL + (erbRate(f) - erbRate(fMin)) / (erbRate(fMax) - erbRate(fMin)) * drawW;
  }

  // Frequency axis background
  ctx.fillStyle = '#f8f9fb';
  roundRect(ctx, padL, padT, drawW, drawH); ctx.fill();
  ctx.strokeStyle = C_BORDER; ctx.lineWidth = 1.5;
  roundRect(ctx, padL, padT, drawW, drawH); ctx.stroke();

  // Tick marks and labels
  ctx.fillStyle = C_MUTED;
  ctx.font = '24px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  [200, 300, 400, 500, 600, 700, 800, 1000].forEach(f => {
    const x = toX(f);
    ctx.fillRect(x - 1, padT + drawH - 8, 2, 8);
    ctx.fillText(f, x, padT + drawH + 34);
  });
  ctx.font = '26px "IBM Plex Sans KR",sans-serif';
  ctx.fillText('기저막 주파수 위치 (Hz, ERB 척도)', padL + drawW / 2, padT + drawH + 62);

  // ERB region around midpoint of fa and fb
  const avgF = (fa + fb) / 2;
  const erbW = erb(avgF);
  const xcenter = toX(avgF);
  const cbHalfPx = (erbW / 2) / (fMax - fMin) * drawW * 0.85;

  ctx.fillStyle = 'rgba(217,119,6,0.12)';
  roundRect(ctx, xcenter - cbHalfPx, padT, cbHalfPx * 2, drawH);
  ctx.fill();
  ctx.strokeStyle = C_ORANGE; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  roundRect(ctx, xcenter - cbHalfPx, padT, cbHalfPx * 2, drawH);
  ctx.stroke(); ctx.setLineDash([]);

  // ERB label
  ctx.fillStyle = C_ORANGE;
  ctx.font = 'bold 24px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`임계대역 ≈ ${Math.round(erbW)} Hz`, xcenter, padT - 10);

  // Vowel dots
  const midY = padT + drawH / 2;
  const r = 22;

  // ㅔ dot
  const xa = toX(fa);
  ctx.beginPath(); ctx.arc(xa, midY, r, 0, Math.PI * 2);
  ctx.fillStyle = C_ACCENT; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ㅔ', xa, midY + 8);
  ctx.fillStyle = C_ACCENT; ctx.font = '22px "IBM Plex Sans",sans-serif';
  ctx.fillText(fa + ' Hz', xa, midY - r - 10);

  // ㅐ dot
  const xb = toX(fb);
  ctx.beginPath(); ctx.arc(xb, midY, r, 0, Math.PI * 2);
  ctx.fillStyle = C_RED; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "IBM Plex Sans KR",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ㅐ', xb, midY + 8);
  ctx.fillStyle = C_RED; ctx.font = '22px "IBM Plex Sans",sans-serif';
  ctx.fillText(fb + ' Hz', xb, midY + r + 30);
}

function updateSlide19() {
  const fa = +document.getElementById('s19-fa').value;
  const fb = +document.getElementById('s19-fb').value;
  document.getElementById('s19-va').textContent = fa;
  document.getElementById('s19-vb').textContent = fb;

  const diff = Math.abs(fa - fb);
  const avgF = (fa + fb) / 2;
  const erbW = erb(avgF);
  const distMM = Math.abs(mmOnBM(fa) - mmOnBM(fb));

  document.getElementById('s19-diff').textContent = diff;
  document.getElementById('s19-erb').textContent  = Math.round(erbW);
  document.getElementById('s19-dist').textContent = distMM.toFixed(2);

  const v = document.getElementById('s19-verdict');
  if (diff < erbW * 0.3) {
    v.style.color = C_RED;
    v.textContent = `⚠ ${diff} Hz 차이는 임계대역(${Math.round(erbW)} Hz)의 ${Math.round(diff/erbW*100)}% — 같은 임계대역 안, 귀가 구별하기 매우 어려움`;
  } else if (diff < erbW) {
    v.style.color = C_ORANGE;
    v.textContent = `⚠ ${diff} Hz 차이는 임계대역(${Math.round(erbW)} Hz) 이내 — 구별 단서가 약함`;
  } else {
    v.style.color = C_GREEN;
    v.textContent = `✓ ${diff} Hz 차이가 임계대역(${Math.round(erbW)} Hz)을 초과 — 귀가 비교적 잘 구별함`;
  }

  drawCritical(fa, fb);
}

// ── Slide 28: Functional load bar chart ─────────────────
function drawFunLoad() {
  const canvas = document.getElementById('cv-funload');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const pairs = [
    { label: 'ㅔ/ㅐ', value: 0.0082, color: C_RED,    note: '3번째로 낮음 (합류)' },
    { label: 'ㅗ/ㅜ', value: 0.0140, color: C_MUTED,   note: '' },
    { label: 'ㅓ/ㅗ', value: 0.0170, color: C_MUTED,   note: '' },
    { label: 'ㅏ/ㅣ', value: 0.0260, color: C_MUTED,   note: '' },
    { label: 'ㅏ/ㅓ', value: 0.0317, color: C_ACCENT,  note: '가장 강한 대립' },
  ];

  const maxVal = 0.036;
  const barH = 72;
  const gap = 22;
  const padL = 130, padR = 200, padT = 50;
  const totalH = pairs.length * (barH + gap);
  const drawW = W - padL - padR;

  pairs.forEach((p, i) => {
    const y = padT + i * (barH + gap);
    const bw = (p.value / maxVal) * drawW;

    // Bar
    ctx.fillStyle = p.color === C_RED ? 'rgba(180,35,24,0.15)' :
                    p.color === C_ACCENT ? 'rgba(30,79,143,0.12)' : '#f3f4f6';
    roundRect(ctx, padL, y, drawW, barH, 8); ctx.fill();

    ctx.fillStyle = p.color;
    roundRect(ctx, padL, y, bw, barH, 8); ctx.fill();

    // Label left
    ctx.fillStyle = C_INK;
    ctx.font = 'bold 28px "IBM Plex Sans KR",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(p.label, padL - 14, y + barH / 2 + 10);

    // Value right of bar
    ctx.fillStyle = p.color;
    ctx.font = `bold 26px "IBM Plex Sans",sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(p.value.toFixed(4), padL + bw + 14, y + barH / 2 + 10);

    // Note
    if (p.note) {
      ctx.fillStyle = p.color;
      ctx.font = `22px "IBM Plex Sans KR",sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(p.note, padL + bw + 100, y + barH / 2 + 10);
    }
  });

  // X-axis tick labels
  ctx.fillStyle = C_MUTED;
  ctx.font = '22px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  [0, 0.01, 0.02, 0.03].forEach(v => {
    ctx.fillText(v.toFixed(2), padL + (v / maxVal) * drawW, padT + totalH + 34);
    ctx.strokeStyle = C_BORDER; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL + (v / maxVal) * drawW, padT);
    ctx.lineTo(padL + (v / maxVal) * drawW, padT + totalH);
    ctx.stroke();
  });
  ctx.fillText('기능부담량', padL + drawW / 2, padT + totalH + 60);

  // Annotation: ㅔ/ㅐ is 1/4 of ㅏ/ㅓ
  const eIdx = 0, aIdx = 4;
  const ey = padT + eIdx * (barH + gap) + barH / 2;
  const ay = padT + aIdx * (barH + gap) + barH / 2;
  const annoX = padL + (0.0317 / maxVal) * drawW + 150;
  ctx.strokeStyle = 'rgba(180,35,24,0.4)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(annoX, ey); ctx.lineTo(annoX, ay); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C_RED; ctx.font = 'bold 24px "IBM Plex Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('약 1/4', annoX + 44, (ey + ay) / 2 + 8);
}

// ── DOMContentLoaded ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // KaTeX
  renderMathInElement(document.body, {
    delimiters: [
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true  },
    ],
    throwOnError: false,
    strict: false,
  });

  requestAnimationFrame(() => {
    drawPerturb();
    drawVowelZoom();
    drawVowelContrast();
    drawERB();
    drawFunLoad();
    // Interactive slide 19 initial draw
    updateSlide19();
  });

  // Attach interactive listeners
  const s19fa = document.getElementById('s19-fa');
  const s19fb = document.getElementById('s19-fb');
  if (s19fa) s19fa.addEventListener('input', updateSlide19);
  if (s19fb) s19fb.addEventListener('input', updateSlide19);
});
