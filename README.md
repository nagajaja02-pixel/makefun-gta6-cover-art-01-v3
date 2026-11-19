# Cover Studio v3

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nagajaja02-pixel/makefun-gta6-cover-art-01-v3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nagajaja02-pixel/makefun-gta6-cover-art-01-v3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Cover Studio v3 turns any photo into a bold poster-style cover, in the spirit of a big open-world crime game — without using any artwork, logo, character, or font from that game.

## What it does

- Load any photo from your device, or use one of the two sample photos.
- Arrange it into **8 multi-panel layouts** (including a nine-panel grid, a diagonal split, and an asymmetric hero layout).
- Apply **8 colour grades** (sunset, neon, gold, midnight, pastel, mono ink, coral, emerald) as per-pixel gradient maps.
- Add a big caption in **6 lettering styles** (gradient, neon glow, halftone dots, bold outline, block shadow, chrome shine) with automatic fitting, plus a subtitle.
- Drag panels to pan, scroll to zoom, shuffle for a random look, hit **Surprise me** to randomise everything at once, or pick one of 5 named preset themes.
- Export the finished cover as a PNG at **1080×1080**, **1080×1350**, or **1920×1080**.

## How to open it

Open `app/index.html` in a desktop browser. No server, no build step, no network — everything runs locally, and your photo never leaves your device.

## How to export a cover

1. Pick a photo (upload, or a sample).
2. Choose a layout, a grade, and a lettering style — or hit Shuffle / a preset.
3. Type your caption and subtitle.
4. Pick a size and click Export PNG to download it.

## Files

- `main.ts` — entrypoint: copies `app/` and `screenshots/` to the output and writes `dossier.json`.
- `app/index.html`, `app/style.css` — the editor page.
- `app/src/grades.js` — the 8 colour grades (gradient-map lookup tables).
- `app/src/layouts.js` — the 8 panel layouts.
- `app/src/lettering.js` — the 6 caption lettering styles.
- `app/src/main.js` — photo loading, grading, preview, pan/zoom, presets, export.
- `app/fonts/` — Noto Sans Display Condensed Black (SIL Open Font License 1.1, see `OFL.txt`).
- `app/samples/` — two sample photos shipped free with the competition kit.

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty.
