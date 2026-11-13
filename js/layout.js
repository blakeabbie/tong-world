/* TONG WORLD — layout
   Vertical rhythm from the Figma frames, as shares of the window height:

                      Desktop 1440×900       Mobile 402×780
     top margin       48  → 5.333%           36  → 4.615%     never under 36 px
     text → mark      120 → 13.333%          87  → 11.154%
     mark → contact   80  → 8.889%           99  → 12.692%
     bottom margin    60  → 6.667%           48  → 6.154%     never under 48 px

   Top and bottom margins hold at the Figma values once the window is taller than the frame
   (48 / 60 from 900 px on desktop, 36 / 48 from 780 px on mobile) and never grow after that.

   The shares blend smoothly between the two frames by window shape (landscape → desktop,
   portrait → mobile), so narrowing a browser never jumps. Above 1440 px of height the mark
   stops growing; the extra height widens the two gaps around it.
   The mark takes whatever height is left, limited by the width (36 px side margins).
   On very short, wide windows the gaps above and below it shrink, but never below 48 px. */
(function () {
  'use strict';

  const root = document.documentElement;
  const page = document.getElementById('page');
  const intro = document.getElementById('intro');
  const contact = document.getElementById('contact');
  const svg = document.getElementById('mark-svg');

  const DESK = { aspect: 1440 / 900, top: 48 / 900, gap1: 120 / 900, gap2: 80 / 900, bottom: 60 / 900 };
  const MOB  = { aspect: 402 / 780,  top: 36 / 780, gap1: 87 / 780,  gap2: 99 / 780, bottom: 48 / 780 };
  const MIN_TOP = 36, MIN_BOTTOM = 48, MIN_GAP = 48, MIN_MARK = 64, SIDE = 36, MAX_H = 1440;
  const MARGIN_H = 900; // top and bottom margins stop growing once the window is taller than this

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // The compact switch: the width at which the fixed desktop lines no longer fit at 14 px.
  let compactBelow = 620;
  function measureBreakpoint() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-weight:300;font-size:14px;left:-9999px;top:0';
    const en = document.createElement('span');
    en.style.cssText = 'font-family:var(--sans);letter-spacing:-0.0083em';
    en.textContent = 'A consultancy studio for strategic and cultural initiatives in the creative industries,';
    const zh = document.createElement('span');
    zh.style.cssText = 'font-family:var(--zh);display:block';
    zh.textContent = intro.querySelector('.zh').textContent;
    probe.append(en, zh);
    document.body.appendChild(probe);
    const widest = Math.max(en.getBoundingClientRect().width, zh.getBoundingClientRect().width);
    probe.remove();
    compactBelow = Math.ceil(widest + 2 * 24 + 2 * SIDE); // text padding + breathing room either side
  }

  function layout() {
    const vw = root.clientWidth;
    const vh = window.innerHeight;
    const H = Math.min(vh, MAX_H);

    root.classList.toggle('is-compact', vw < compactBelow);

    // Blend the spacing shares by window shape.
    const t = clamp((vw / vh - MOB.aspect) / (DESK.aspect - MOB.aspect), 0, 1);
    const share = k => lerp(MOB[k], DESK[k], t);

    // Margins scale with height up to the Figma frame height, then hold at the Figma values
    // (desktop 48 / 60 from 900 px tall; mobile 36 / 48 from 780 px). They never grow beyond that,
    // at any window height; extra height goes to the gaps and the mark.
    const tM = clamp((vw / Math.min(vh, MARGIN_H) - MOB.aspect) / (DESK.aspect - MOB.aspect), 0, 1);
    const shareM = k => lerp(MOB[k], DESK[k], tM);
    const refH = lerp(780, MARGIN_H, tM);
    const mH = Math.min(vh, refH);
    const top = Math.max(MIN_TOP, mH * shareM('top'));
    const bottom = Math.max(MIN_BOTTOM, mH * shareM('bottom'));
    // The gaps either side of the mark never go below 48 px.
    let gap1 = Math.max(MIN_GAP, H * share('gap1'));
    let gap2 = Math.max(MIN_GAP, H * share('gap2'));

    const introH = intro.getBoundingClientRect().height;
    const contactH = contact.getBoundingClientRect().height;
    const fixed = top + bottom + introH + contactH;

    // Height left for the mark at the designed spacing.
    let box = H - fixed - gap1 - gap2;
    const widthLimit = Math.max(MIN_MARK, vw - 2 * SIDE);

    // Short window: shrink the gaps proportionally toward a thin minimum before the mark gets tiny.
    if (box < MIN_MARK * 2) {
      const want = MIN_MARK * 2 - box;
      const room = Math.max(0, gap1 - MIN_GAP) + Math.max(0, gap2 - MIN_GAP);
      const take = Math.min(want, room);
      if (room > 0) {
        const k = take / room;
        gap1 -= (gap1 - MIN_GAP) * k;
        gap2 -= (gap2 - MIN_GAP) * k;
      }
      box = H - fixed - gap1 - gap2;
    }
    box = Math.max(MIN_MARK, box);
    const mark = Math.min(box, widthLimit);

    // Taller than 1440: the mark has stopped growing and the margins are fixed,
    // so the extra height opens up the two gaps around the mark (keeping their ratio).
    if (vh > H) {
      const extra = vh - H, sum = gap1 + gap2;
      gap1 += extra * gap1 / sum;
      gap2 += extra * gap2 / sum;
    }

    const px = v => Math.round(v * 100) / 100 + 'px';
    const s = root.style;
    s.setProperty('--top', px(top));
    s.setProperty('--bottom', px(bottom));
    s.setProperty('--gap1', px(gap1));
    s.setProperty('--gap2', px(gap2));
    s.setProperty('--mark-box', px(box));
    s.setProperty('--mark', px(mark));
  }

  // Lay out on the next frame, and once more shortly after the last resize: some browsers
  // (and mobile toolbars) report the final window size a moment after the resize event.
  let queued = false, trailing = 0;
  function schedule() {
    clearTimeout(trailing);
    trailing = setTimeout(layout, 150);
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; layout(); });
  }

  function start() {
    measureBreakpoint();
    layout();
    // Text height changes as the type scales or rewraps; keep the mark in step.
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(schedule);
      ro.observe(intro);
      ro.observe(document.body); // body is at least the window height, so this also catches viewport changes
    }
  }

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);

  start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);

  window.TongMark.mount(svg);
})();
