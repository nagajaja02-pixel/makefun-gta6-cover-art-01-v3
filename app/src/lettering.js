// Caption lettering styles for Cover Studio v3.
//
// Every style paints the same caption text, but each one treats the letters
// differently: a gradient wash, a neon glow, halftone dots, a hard outline,
// or a solid block shadow. The painter receives the canvas context, the text,
// the centre x, the baseline y, and the pixel size it should aim for; it
// shrinks the text until it fits inside maxWidth (92% of the poster width)
// and returns the size it actually used. All styles use the vendored
// condensed black display font, loaded locally, so the letters stay thick
// and readable even when the poster is shown small.

export const LETTERING = [
  { id: 'gradient', name: 'Sunset Gradient' },
  { id: 'neon', name: 'Neon Glow' },
  { id: 'halftone', name: 'Halftone Pop' },
  { id: 'outline', name: 'Bold Outline' },
  { id: 'block', name: 'Block Shadow' },
  { id: 'chrome', name: 'Chrome Shine' },
];

export function letteringById(id) {
  return LETTERING.find((l) => l.id === id) || LETTERING[0];
}

const FONT = (px) => `${px}px "CoverFont", "Arial Black", sans-serif`;

// Fit the text to maxWidth by shrinking from startPx, then paint it with
// the named style. Returns the pixel size actually used.
export function paintCaption(ctx, text, styleId, cx, baselineY, startPx, maxWidth) {
  let px = startPx;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  while (px > 12) {
    ctx.font = FONT(px);
    if (ctx.measureText(text).width <= maxWidth) break;
    px = Math.floor(px * 0.94);
  }
  ctx.font = FONT(px);
  const w = ctx.measureText(text).width;
  const left = cx - w / 2;
  const top = baselineY - px * 0.82;
  const height = px;

  if (styleId === 'gradient') {
    const g = ctx.createLinearGradient(left, 0, left + w, 0);
    g.addColorStop(0, '#ffd23e');
    g.addColorStop(0.5, '#ff5e62');
    g.addColorStop(1, '#b967ff');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a0b1e';
    ctx.lineWidth = Math.max(2, px * 0.07);
    ctx.strokeText(text, cx, baselineY);
    ctx.fillStyle = g;
    ctx.fillText(text, cx, baselineY);
  } else if (styleId === 'neon') {
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = px * 0.38;
    ctx.fillStyle = '#e8fbff';
    ctx.fillText(text, cx, baselineY);
    ctx.fillText(text, cx, baselineY);
    ctx.shadowColor = '#ff2fb3';
    ctx.shadowBlur = px * 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baselineY);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10, 20, 40, 0.85)';
    ctx.lineWidth = Math.max(1, px * 0.03);
    ctx.strokeText(text, cx, baselineY);
  } else if (styleId === 'halftone') {
    // Draw the letters once on a scratch canvas, then stamp halftone dots
    // only where the letters are, using source-atop.
    const pad = Math.ceil(px * 0.2);
    const sw = Math.ceil(w) + pad * 2;
    const sh = Math.ceil(px * 1.2) + pad * 2;
    const tmp = document.createElement('canvas');
    tmp.width = sw;
    tmp.height = sh;
    const t = tmp.getContext('2d');
    t.font = FONT(px);
    t.textAlign = 'center';
    t.textBaseline = 'alphabetic';
    t.fillStyle = '#000000';
    t.fillText(text, sw / 2, pad + px * 0.82);
    t.globalCompositeOperation = 'source-atop';
    t.fillStyle = '#ffcf3f';
    t.fillRect(0, 0, sw, sh);
    t.fillStyle = '#111111';
    const step = Math.max(5, Math.round(px / 9));
    for (let yy = step / 2; yy < sh; yy += step) {
      for (let xx = step / 2; xx < sw; xx += step) {
        const r = step * 0.32 * (0.6 + 0.4 * Math.sin((xx + yy) * 0.35));
        t.beginPath();
        t.arc(xx, yy, r, 0, Math.PI * 2);
        t.fill();
      }
    }
    ctx.drawImage(tmp, left - pad, top - pad);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a0b1e';
    ctx.lineWidth = Math.max(2, px * 0.05);
    ctx.strokeText(text, cx, baselineY);
  } else if (styleId === 'outline') {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(3, px * 0.15);
    ctx.strokeText(text, cx, baselineY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baselineY);
  } else if (styleId === 'block') {
    ctx.fillStyle = '#141414';
    ctx.fillText(text, cx + px * 0.07, baselineY + px * 0.07);
    ctx.fillText(text, cx + px * 0.14, baselineY + px * 0.14);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = Math.max(2, px * 0.05);
    ctx.strokeText(text, cx, baselineY);
    ctx.fillStyle = '#ff5a3c';
    ctx.fillText(text, cx, baselineY);
  } else if (styleId === 'chrome') {
    const g = ctx.createLinearGradient(0, top, 0, top + height);
    g.addColorStop(0, '#f8f8f8');
    g.addColorStop(0.35, '#9aa0a6');
    g.addColorStop(0.55, '#e8e8e8');
    g.addColorStop(0.8, '#6b7280');
    g.addColorStop(1, '#d7dbe0');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = Math.max(2, px * 0.06);
    ctx.strokeText(text, cx, baselineY);
    ctx.fillStyle = g;
    ctx.fillText(text, cx, baselineY);
    // A thin bright shine across the upper third of the letters.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, w, height * 0.32);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(left, top + height * 0.1, w, Math.max(2, height * 0.07));
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baselineY);
  }
  return px;
}
