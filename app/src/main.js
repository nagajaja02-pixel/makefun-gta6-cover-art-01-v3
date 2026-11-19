// Cover Studio v3 — editor logic.
//
// Plain vanilla JavaScript and Canvas 2D, no framework, no network. The
// editor keeps one poster state (photo, layout, grade, lettering, caption,
// subtitle, aspect, per-panel crops) and one render function that draws the
// poster at any size: the same function paints the on-screen preview and
// the exported PNG, so the export is exactly what the preview shows.
//
// Everything runs locally. A photo is read with FileReader or taken from
// the bundled samples; it never leaves the device. The grade is applied
// per pixel through a lookup table on a working canvas, cached per photo
// and grade so dragging a panel stays smooth.

import { GRADES, gradeById, gradeCanvas } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { LETTERING, letteringById, paintCaption } from './lettering.js';

const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080×1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080×1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920×1080' },
};

const PRESETS = [
  { id: 'vice-nights', name: 'Vice Nights', layout: 'diagonal', grade: 'neon', lettering: 'neon' },
  { id: 'golden-hour', name: 'Golden Hour', layout: 'hero-left', grade: 'gold', lettering: 'gradient' },
  { id: 'midnight-run', name: 'Midnight Run', layout: 'nine', grade: 'midnight', lettering: 'outline' },
  { id: 'coral-coast', name: 'Coral Coast', layout: 'triple', grade: 'coral', lettering: 'halftone' },
  { id: 'ink-city', name: 'Ink City', layout: 'quad', grade: 'ink', lettering: 'block' },
];

const DEFAULT_CAPTION = 'PORT SOLENNE';
const DEFAULT_SUBTITLE = 'A LEONIDA STORY';

const state = {
  photo: null,
  photoName: 'pier.jpg',
  layoutId: 'hero-left',
  gradeId: 'sunset',
  letterId: 'gradient',
  caption: DEFAULT_CAPTION,
  subtitle: DEFAULT_SUBTITLE,
  aspect: 'square',
  // per-panel user crop: index -> { ox, oy, s } (offsets in panel units)
  crops: {},
};

let gradedCache = { key: '', canvas: null };
let photoReady = false;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

function currentLayout() {
  return layoutById(state.layoutId);
}

function currentPanels() {
  return currentLayout().panels();
}

// The graded photo at a working size, cached per photo + grade + size.
function gradedPhoto(maxSide) {
  if (!state.photo) return null;
  const key = `${state.photoName}|${state.gradeId}|${maxSide}`;
  if (gradedCache.key === key && gradedCache.canvas) return gradedCache.canvas;
  const iw = state.photo.naturalWidth;
  const ih = state.photo.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(2, Math.round(iw * scale));
  const h = Math.max(2, Math.round(ih * scale));
  const canvas = gradeCanvas(state.photo, gradeById(state.gradeId), w, h);
  gradedCache = { key, canvas };
  return canvas;
}

function pointInPoly(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function panelBounds(points, W, H) {
  const xs = points.map((p) => p[0] * W);
  const ys = points.map((p) => p[1] * H);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Draw the whole poster on ctx at W x H.
function renderPoster(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, W, H);
  const panels = currentPanels();
  const img = gradedPhoto(Math.max(W, H));
  const gap = Math.max(2, Math.round(Math.min(W, H) * 0.006));

  panels.forEach((panel, i) => {
    const pts = panel.points.map(([u, v]) => [u * W, v * H]);
    const b = panelBounds(panel.points, W, H);
    ctx.save();
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.clip();
    if (img) {
      const crop = state.crops[i] || { ox: 0, oy: 0, s: 1 };
      const base = Math.max(b.w / img.width, b.h / img.height);
      const zoom = base * panel.zoom * crop.s;
      const dw = img.width * zoom;
      const dh = img.height * zoom;
      const dx = b.x + (b.w - dw) / 2 + (panel.dx + crop.ox) * b.w;
      const dy = b.y + (b.h - dh) / 2 + (panel.dy + crop.oy) * b.h;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    ctx.restore();
    // Dark gutter around the panel.
    ctx.save();
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.strokeStyle = '#0d0b0a';
    ctx.lineWidth = gap;
    ctx.stroke();
    ctx.restore();
  });

  // Caption band: a dark gradient over the bottom so the letters read.
  const band = ctx.createLinearGradient(0, H * 0.68, 0, H);
  band.addColorStop(0, 'rgba(8, 6, 10, 0)');
  band.addColorStop(0.45, 'rgba(8, 6, 10, 0.55)');
  band.addColorStop(1, 'rgba(8, 6, 10, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H * 0.68, W, H * 0.32);

  // Caption + subtitle.
  const capPx = Math.round(Math.min(W, H * 1.35) * 0.085);
  const used = paintCaption(
    ctx,
    state.caption || ' ',
    state.letterId,
    W / 2,
    H * 0.925,
    capPx,
    W * 0.92,
  );
  if (state.subtitle) {
    ctx.font = `${Math.max(12, Math.round(used * 0.34))}px "CoverFont", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(state.subtitle, W / 2, H * 0.978);
  }
}

function previewSize() {
  const size = SIZES[state.aspect];
  const max = 720;
  const scale = Math.min(1, max / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function renderPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w) preview.width = w;
  if (preview.height !== h) preview.height = h;
  renderPoster(pctx, w, h);
}

function refreshControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layoutId));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.gradeId));
  document.querySelectorAll('[data-letter]').forEach((b) => b.classList.toggle('active', b.dataset.letter === state.letterId));
  document.querySelectorAll('[data-aspect]').forEach((b) => b.classList.toggle('active', b.dataset.aspect === state.aspect));
  document.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', false));
  $('captionInput').value = state.caption;
  $('subtitleInput').value = state.subtitle;
  $('statusLine').textContent = `${layoutById(state.layoutId).name} · ${gradeById(state.gradeId).name} · ${letteringById(state.letterId).name} · ${SIZES[state.aspect].label}`;
}

function setLayout(id) {
  state.layoutId = id;
  state.crops = {};
  refreshControls();
  renderPreview();
}

function setGrade(id) {
  state.gradeId = id;
  refreshControls();
  renderPreview();
}

function setLettering(id) {
  state.letterId = id;
  refreshControls();
  renderPreview();
}

function setAspect(aspect) {
  state.aspect = aspect;
  refreshControls();
  renderPreview();
}

function applyPreset(preset) {
  state.layoutId = preset.layout;
  state.gradeId = preset.grade;
  state.letterId = preset.lettering;
  state.crops = {};
  refreshControls();
  renderPreview();
}

function shuffleAll() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layoutId = pick(LAYOUTS).id;
  state.gradeId = pick(GRADES).id;
  state.letterId = pick(LETTERING).id;
  state.crops = {};
  refreshControls();
  renderPreview();
}

// Surprise me: a random look plus a random crop on every panel, and a
// random tagline when the caption is still the default one.
const TAGLINES = [
  'A LEONIDA STORY',
  'VICE NEVER SLEEPS',
  'SUNSET HEIST',
  'NEON TIDE',
  'GOLDEN GETAWAY',
  'MIDNIGHT HARBOR',
];

function surpriseMe() {
  shuffleAll();
  const panels = currentPanels();
  panels.forEach((panel, i) => {
    state.crops[i] = {
      ox: (Math.random() - 0.5) * 0.3,
      oy: (Math.random() - 0.5) * 0.2,
      s: 0.9 + Math.random() * 0.9,
    };
  });
  if (state.caption === DEFAULT_CAPTION) {
    state.subtitle = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  }
  refreshControls();
  renderPreview();
}

function resetAll() {
  state.layoutId = 'hero-left';
  state.gradeId = 'sunset';
  state.letterId = 'gradient';
  state.caption = DEFAULT_CAPTION;
  state.subtitle = DEFAULT_SUBTITLE;
  state.crops = {};
  refreshControls();
  renderPreview();
}

function setCaption(text) {
  state.caption = text;
  renderPreview();
}

function setSubtitle(text) {
  state.subtitle = text;
  renderPreview();
}

function loadPhoto(src, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.photo = img;
      state.photoName = name;
      state.crops = {};
      photoReady = true;
      renderPreview();
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function exportPNG() {
  const size = SIZES[state.aspect];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderPoster(canvas.getContext('2d'), size.w, size.h);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-${state.aspect}-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

function exportDataURL(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderPoster(canvas.getContext('2d'), w, h);
  return canvas.toDataURL('image/png');
}

// --- Panel pan / zoom on the preview canvas ---
let drag = null;
function canvasPoint(e) {
  const r = preview.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (preview.width / r.width), y: (e.clientY - r.top) * (preview.height / r.height) };
}
function hitPanel(x, y) {
  const panels = currentPanels();
  for (let i = panels.length - 1; i >= 0; i--) {
    const pts = panels[i].points.map(([u, v]) => [u * preview.width, v * preview.height]);
    if (pointInPoly(x, y, pts)) return i;
  }
  return -1;
}
preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = hitPanel(p.x, p.y);
  if (i < 0) return;
  drag = { i, x: p.x, y: p.y };
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panels = currentPanels();
  const b = panelBounds(panels[drag.i].points, preview.width, preview.height);
  const crop = state.crops[drag.i] || { ox: 0, oy: 0, s: 1 };
  crop.ox += (p.x - drag.x) / b.w;
  crop.oy += (p.y - drag.y) / b.h;
  state.crops[drag.i] = crop;
  drag.x = p.x;
  drag.y = p.y;
  renderPreview();
});
preview.addEventListener('pointerup', () => {
  drag = null;
});
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const i = hitPanel(p.x, p.y);
  if (i < 0) return;
  const crop = state.crops[i] || { ox: 0, oy: 0, s: 1 };
  crop.s = Math.min(4, Math.max(0.5, crop.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  state.crops[i] = crop;
  renderPreview();
}, { passive: false });

// --- Wire the controls ---
function buildControls() {
  const layoutBox = $('layoutBox');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.addEventListener('click', () => setLayout(l.id));
    layoutBox.appendChild(b);
  });
  const gradeBox = $('gradeBox');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.grade = g.id;
    b.textContent = g.name;
    b.addEventListener('click', () => setGrade(g.id));
    gradeBox.appendChild(b);
  });
  const letterBox = $('letterBox');
  LETTERING.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.letter = l.id;
    b.textContent = l.name;
    b.addEventListener('click', () => setLettering(l.id));
    letterBox.appendChild(b);
  });
  const presetBox = $('presetBox');
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'chip preset';
    b.dataset.preset = p.id;
    b.textContent = p.name;
    b.addEventListener('click', () => applyPreset(p));
    presetBox.appendChild(b);
  });
  document.querySelectorAll('[data-aspect]').forEach((b) => b.addEventListener('click', () => setAspect(b.dataset.aspect)));
  $('shuffleBtn').addEventListener('click', shuffleAll);
  $('surpriseBtn').addEventListener('click', surpriseMe);
  $('resetBtn').addEventListener('click', resetAll);
  $('exportBtn').addEventListener('click', exportPNG);
  $('captionInput').addEventListener('input', (e) => setCaption(e.target.value));
  $('subtitleInput').addEventListener('input', (e) => setSubtitle(e.target.value));
  $('fileInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => loadPhoto(reader.result, f.name);
    reader.readAsDataURL(f);
  });
  $('samplePier').addEventListener('click', () => loadPhoto('samples/pier.jpg', 'pier.jpg'));
  $('sampleBoulevard').addEventListener('click', () => loadPhoto('samples/boulevard.jpg', 'boulevard.jpg'));
}

// --- Boot ---
buildControls();
refreshControls();
document.fonts.load('90px "CoverFont"').catch(() => {}).finally(() => {
  loadPhoto('samples/pier.jpg', 'pier.jpg').catch(() => {
    photoReady = false;
    renderPreview();
  });
});

// API used by the screenshot script (and handy for testing).
window.CoverStudio = {
  state,
  SIZES,
  PRESETS,
  setLayout,
  setGrade,
  setLettering,
  setAspect,
  setCaption,
  setSubtitle,
  applyPreset,
  shuffleAll,
  surpriseMe,
  resetAll,
  loadPhoto,
  exportDataURL,
  renderPreview,
  isPhotoReady: () => photoReady,
};
