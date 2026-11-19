// Panel layouts for Cover Studio v3.
//
// A layout is a function of the poster that returns the panels it is made
// of. Every panel is a polygon in unit coordinates (0..1 across the poster),
// so the same layout works at every export size. A rect is just a polygon
// with four corners. Each panel also carries a default crop: a zoom factor
// and an offset, so the same photo reads differently in each panel instead
// of repeating the same framing. The user can drag and scroll any panel to
// change its crop; the layout's defaults are only the starting point.

function rect(x, y, w, h, zoom, dx, dy) {
  return {
    points: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    zoom: zoom || 1,
    dx: dx || 0,
    dy: dy || 0,
  };
}

function poly(points, zoom, dx, dy) {
  return { points, zoom: zoom || 1, dx: dx || 0, dy: dy || 0 };
}

export const LAYOUTS = [
  {
    id: 'hero-left',
    name: 'Hero Left',
    panels: () => [
      rect(0, 0, 0.62, 1, 1.0, 0, 0),
      rect(0.62, 0, 0.38, 0.5, 1.7, 0.12, 0),
      rect(0.62, 0.5, 0.38, 0.5, 2.1, -0.15, 0.05),
    ],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    panels: () => [
      rect(0, 0, 1, 0.62, 1.0, 0, 0),
      rect(0, 0.62, 0.5, 0.38, 1.8, 0.1, 0),
      rect(0.5, 0.62, 0.5, 0.38, 2.2, -0.1, 0.08),
    ],
  },
  {
    id: 'triple',
    name: 'Triple Strip',
    panels: () => [
      rect(0, 0, 1 / 3, 1, 1.35, 0.18, 0),
      rect(1 / 3, 0, 1 / 3, 1, 1.0, 0, 0),
      rect(2 / 3, 0, 1 / 3, 1, 1.6, -0.2, 0.04),
    ],
  },
  {
    id: 'quad',
    name: 'Quad Grid',
    panels: () => [
      rect(0, 0, 0.5, 0.5, 1.5, 0.15, 0),
      rect(0.5, 0, 0.5, 0.5, 1.9, -0.12, 0),
      rect(0, 0.5, 0.5, 0.5, 2.1, 0.08, 0.1),
      rect(0.5, 0.5, 0.5, 0.5, 1.3, -0.05, -0.08),
    ],
  },
  {
    id: 'nine',
    name: 'Nine Grid',
    panels: () => {
      const out = [];
      const zooms = [1.6, 2.2, 1.4, 2.0, 1.0, 1.8, 1.5, 2.4, 1.7];
      const offs = [0.1, -0.12, 0.08, -0.06, 0, 0.14, -0.1, 0.05, -0.08];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const i = r * 3 + c;
          out.push(rect(c / 3, r / 3, 1 / 3, 1 / 3, zooms[i], offs[i], (i % 2 ? 0.06 : -0.04)));
        }
      }
      return out;
    },
  },
  {
    id: 'diagonal',
    name: 'Diagonal Split',
    panels: () => [
      poly(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        1.25,
        0.1,
        0,
      ),
      poly(
        [
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        1.9,
        -0.14,
        0.06,
      ),
    ],
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Duo',
    panels: () => [
      rect(0, 0, 0.68, 1, 1.0, 0, 0),
      rect(0.68, 0, 0.32, 0.62, 1.8, 0.1, 0),
      rect(0.68, 0.62, 0.32, 0.38, 2.3, -0.08, 0.1),
    ],
  },
  {
    id: 'five-frame',
    name: 'Five Frame',
    panels: () => [
      rect(0.22, 0.18, 0.56, 0.64, 1.0, 0, 0),
      rect(0, 0, 1, 0.18, 1.7, 0.12, 0),
      rect(0, 0.82, 1, 0.18, 1.9, -0.1, 0),
      rect(0, 0.18, 0.22, 0.64, 2.2, 0.05, 0.08),
      rect(0.78, 0.18, 0.22, 0.64, 1.5, -0.06, -0.05),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
