// Colour grades for Cover Studio v3.
//
// A grade is a gradient map: every pixel's luminance is remapped through a
// short list of colour stops, so the whole photo takes on one strong mood
// while keeping its shapes and contrast. Each grade also carries a strength
// (how far the photo is pushed toward the map) and a short label shown in
// the editor. The stops are my own choices; the map is built by linear
// interpolation between neighbouring stops, one lookup table per channel.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset Blaze',
    strength: 0.92,
    stops: [
      [0.0, 26, 8, 40],
      [0.35, 140, 40, 90],
      [0.65, 230, 110, 40],
      [1.0, 255, 225, 170],
    ],
  },
  {
    id: 'neon',
    name: 'Neon Vice',
    strength: 0.94,
    stops: [
      [0.0, 4, 20, 32],
      [0.3, 10, 60, 90],
      [0.6, 220, 30, 140],
      [1.0, 120, 240, 255],
    ],
  },
  {
    id: 'gold',
    name: 'Gold Rush',
    strength: 0.9,
    stops: [
      [0.0, 20, 12, 4],
      [0.35, 110, 70, 20],
      [0.7, 220, 160, 60],
      [1.0, 255, 240, 200],
    ],
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    strength: 0.92,
    stops: [
      [0.0, 2, 6, 18],
      [0.4, 20, 50, 110],
      [0.75, 90, 140, 200],
      [1.0, 220, 235, 255],
    ],
  },
  {
    id: 'pastel',
    name: 'Vice Pastel',
    strength: 0.88,
    stops: [
      [0.0, 40, 30, 70],
      [0.4, 150, 110, 180],
      [0.7, 240, 150, 180],
      [1.0, 200, 255, 230],
    ],
  },
  {
    id: 'ink',
    name: 'Mono Ink',
    strength: 1.0,
    stops: [
      [0.0, 5, 5, 5],
      [0.25, 45, 45, 45],
      [0.5, 120, 120, 120],
      [0.75, 195, 195, 195],
      [1.0, 250, 250, 250],
    ],
  },
  {
    id: 'coral',
    name: 'Coral Heat',
    strength: 0.92,
    stops: [
      [0.0, 40, 6, 14],
      [0.35, 160, 40, 50],
      [0.7, 240, 110, 80],
      [1.0, 255, 220, 180],
    ],
  },
  {
    id: 'emerald',
    name: 'Emerald Night',
    strength: 0.92,
    stops: [
      [0.0, 2, 14, 8],
      [0.35, 10, 60, 40],
      [0.7, 30, 160, 110],
      [1.0, 210, 255, 225],
    ],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Build the three 256-entry lookup tables for one grade.
export function buildLut(grade) {
  const lut = { r: new Uint8Array(256), g: new Uint8Array(256), b: new Uint8Array(256) };
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = (t - a[0]) / span;
    lut.r[i] = Math.round(a[1] + (b[1] - a[1]) * f);
    lut.g[i] = Math.round(a[2] + (b[2] - a[2]) * f);
    lut.b[i] = Math.round(a[3] + (b[3] - a[3]) * f);
  }
  return lut;
}

// Return a new canvas holding the source image with the grade applied.
// The source is drawn at the given working size; the caller picks the size
// (small for a fast preview, full size for an export).
export function gradeCanvas(source, grade, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const lut = buildLut(grade);
  const s = grade.strength;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    const mr = lut.r[lum];
    const mg = lut.g[lum];
    const mb = lut.b[lum];
    d[i] = Math.round(d[i] + (mr - d[i]) * s);
    d[i + 1] = Math.round(d[i + 1] + (mg - d[i + 1]) * s);
    d[i + 2] = Math.round(d[i + 2] + (mb - d[i + 2]) * s);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
