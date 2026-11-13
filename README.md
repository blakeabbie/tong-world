# TONG WORLD

Single-page site with the 堂 Tension block mark as a live, looping SVG. Plain HTML, CSS and JavaScript with no build step, ready for GitHub Pages.

## Run locally

```bash
python3 -m http.server 8765 --directory tong-world
```

Then open http://localhost:8765.

## Files

| File | What it does |
|---|---|
| `index.html` | Content, metadata, favicon and social share tags |
| `css/style.css` | Type, colours and the compact (mobile) layout |
| `js/layout.js` | Vertical spacing, mark size and the switch to the compact layout |
| `js/mark.js` | The Tension block animation (17 SVG rectangles updated every frame) |
| `fonts/Kleisch-Light.woff2` | English typeface |
| `favicon.svg`, `favicon-32.png`, `favicon-16.png` | Tab icon: the same skeleton on a 13 × 13 pixel grid (strokes and gaps one cell each) so it stays crisp at 16 and 32 px |
| `apple-touch-icon.png`, `og-image.png` | Block-form home-screen icon and share image in #00BCFF |

## Links

- TONG WORLD → https://www.instagram.com/tong.world/ (opens in a new tab)
- Work with us. → mailto:info@tong.world

## Before launch

1. **GitHub Pages:** push this folder as the repository root and enable Pages (Settings → Pages → Deploy from branch → `main` / root). The `CNAME` file points it at **tong.world**.
2. **DNS for tong.world:** at the domain registrar, add A records for `tong.world` to GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a CNAME record for `www` to `<github-user>.github.io`. Then tick **Enforce HTTPS** in the Pages settings once the certificate is issued.

## Layout rules

- At 1440 × 900 the page matches the Figma Desktop frame exactly; at 402 × 780 it matches the Mobile frame.
- Vertical gaps are shares of the window height taken from Figma, blended between the desktop and mobile proportions by window shape so narrowing a window never jumps.
- Top margin never goes under 36 px, bottom margin never under 48 px. Once the window is taller than the Figma frame they hold at the Figma values (48 / 60 on desktop from 900 px, 36 / 48 on mobile from 780 px) and never grow; extra height goes to the gaps and the mark.
- The mark takes the remaining height, is limited by the width (36 px side margins), and stops growing at 1440 px of window height; beyond that the extra height widens the gaps around it.
- On short, wide windows the gaps above and below the mark shrink, but never below 48 px; the mark shrinks instead.
- Type is 18 / 24 from 1200 px wide, scales with width below that, and stops at 14 / 18.
- The layout switches to the mobile arrangement (natural wrapping, extra space between the Chinese and English) at the width where the fixed desktop line break no longer fits at 14 px, about 640 px.

## Colour

The mark and link hover use the circle blue from area.tech/openai: `color(display-p3 0 0.7373 1)` on wide-gamut screens, with `#00BCFF` as the sRGB fallback.

## Fonts

- English: Kleisch Light, self-hosted.
- Chinese: Songti SC on Macs; other devices fall back to Noto Serif SC from Google Fonts, which is only downloaded when Songti SC is missing.
