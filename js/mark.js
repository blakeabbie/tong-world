/* TONG WORLD — Tension block mark
   The 堂 character morphs between two whole-number systems on a 1000-unit artboard
   (character 850 × 850 at 75..925):
     E hairline          bars 4,   stems 100, pitch 125 across × 141 down
     E inverse hairline  bars 100, stems 4,   pitch 141 across × 125 down
   and passes through the heavy block (bars 100, stems 100, pitch 125) in between.
   Every frame keeps the outer edges fixed, so the SVG viewBox is cropped to the character.

   Timing: 0.15 s still on each design, 0.25 s still on the block, 1.25 s per phase.
   Loop = 5.30 s. Playback starts on the block, then E hairline, block, inverse. */
(function () {
  'use strict';

  const M = 75;
  // Bars: [first column, last column, row]. Stems: [column, first row, last row].
  const BARS = [[0,2,0],[0,2,1],[4,6,0],[4,6,1],[0,6,2],[1,5,3],[1,5,4],[1,5,5],[1,5,6]];
  const STEMS = [[2,0,1],[4,0,1],[3,0,2],[0,2,6],[6,2,6],[1,3,4],[5,3,4],[3,4,6]];

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // Centrelines of each column and row in the two end states.
  const colA = i => M + 50 + 125 * i, colB = i => M + 2 + 141 * i;
  const rowA = j => M + 2 + 141 * j,  rowB = j => M + 50 + 125 * j;

  let flip = false; // true on the return trip (inverse back to E)
  function frame(cs, rs) {
    const L = (a, b, t) => flip ? lerp(b, a, t) : lerp(a, b, t);
    return {
      cx: cs.map((t, i) => L(colA(i), colB(i), t)),
      cy: rs.map((t, j) => L(rowA(j), rowB(j), t)),
      w: cs.map(t => Math.max(1, L(100, 4, t))),
      h: rs.map(t => Math.max(1, L(4, 100, t)))
    };
  }

  // Tension ease: build (swell 105 / hairline to 2), strain, freeze, release, one 1.75% overshoot, settle.
  const C = { back: 5 / 96, ov: 0.0175, pull: 0.62, freeze: 0.015, r: 0.71, k: 120, settle: 0.16 };
  function ease(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (t < C.pull) return -C.back * Math.pow(t / C.pull, 2);
    if (t < C.r - C.freeze) {
      const u = (t - C.pull) / (C.r - C.freeze - C.pull);
      return -C.back + 0.002 * u * (1 + Math.sin(u * u * 90)) / 2;
    }
    if (t < C.r) return -C.back;
    const s = (t - C.r) * C.k;
    const x = -C.back + (1 + C.back + C.ov) * (1 - Math.exp(-s));
    const st = clamp((t - C.r - 0.03) / C.settle);
    return x - C.ov * st * st * (3 - 2 * st);
  }
  // Hairlines never drop below 2 before a move, or dip more than the overshoot allows after it.
  function limit(t, startsHeavy) {
    if (t < 0) return startsHeavy ? t : Math.max(t * (2 / 96) / C.back, -2 / 96);
    if (t > 1) return startsHeavy ? 1 + (t - 1) * (2 / 96) / 0.035 : t;
    return t;
  }

  // Timing (seconds). Holds are the stillness you see; each phase rests for its last TAIL fraction.
  const HOLD = 0.15, BLOCK = 0.25, PHASE = 1.25;
  const TAIL = 1 - (C.r + 0.03 + C.settle);
  const holdP = Math.max(0, HOLD - TAIL * PHASE);
  const MOVE = 2 * PHASE + Math.max(0, BLOCK - TAIL * PHASE);
  const W = PHASE / MOVE;            // each phase's share of a move
  const CYCLE = 2 * (holdP + MOVE);  // 5.30 s
  const START = 3.8;                 // the block on the return leg: block → E → block → inverse

  function at(time) {
    let c = ((time % CYCLE) + CYCLE) % CYCLE;
    let p, rev = false;
    if (c < holdP) p = 0;
    else if ((c -= holdP) < MOVE) p = c / MOVE;
    else if ((c -= MOVE) < holdP) p = 1;
    else { c -= holdP; p = 1 - c / MOVE; rev = true; }
    if (rev) { flip = true; p = 1 - p; }
    const a = clamp(p / W), b = clamp((p - (1 - W)) / W);
    // Forward: bars move first (to the block), then stems. Return: stems first, then bars.
    const first = ease(a), second = ease(b);
    const rows = flip ? second : first, cols = flip ? first : second;
    const rs = Array(7).fill(limit(rows, flip)), cs = Array(7).fill(limit(cols, !flip));
    const f = frame(cs, rs);
    flip = false;
    return f;
  }

  function mount(svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const rects = [];
    for (let i = 0; i < BARS.length + STEMS.length; i++) {
      const r = document.createElementNS(NS, 'rect');
      svg.appendChild(r);
      rects.push(r);
    }
    const r2 = v => Math.round(v * 100) / 100;
    function render(f) {
      let n = 0;
      for (const [a, b, j] of BARS) {
        const x0 = f.cx[a] - f.w[a] / 2, x1 = f.cx[b] + f.w[b] / 2, y = f.cy[j] - f.h[j] / 2;
        const r = rects[n++];
        r.setAttribute('x', r2(x0)); r.setAttribute('y', r2(y));
        r.setAttribute('width', r2(x1 - x0)); r.setAttribute('height', r2(f.h[j]));
      }
      for (const [i, a, b] of STEMS) {
        const y0 = f.cy[a] - f.h[a] / 2, y1 = f.cy[b] + f.h[b] / 2, x = f.cx[i] - f.w[i] / 2;
        const r = rects[n++];
        r.setAttribute('x', r2(x)); r.setAttribute('y', r2(y0));
        r.setAttribute('width', r2(f.w[i])); r.setAttribute('height', r2(y1 - y0));
      }
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    render(at(START)); // first paint: the block
    let t0 = null, raf = 0;
    function tick(now) {
      if (t0 === null) t0 = now;
      render(at(START + (now - t0) / 1000));
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { render(at(START)); return; }
      t0 = null;
      raf = requestAnimationFrame(tick);
    }
    reduce.addEventListener ? reduce.addEventListener('change', sync) : reduce.addListener(sync);
    sync();
  }

  window.TongMark = { mount, at, CYCLE };
})();
