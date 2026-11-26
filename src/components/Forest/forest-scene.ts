/**
 * Paints a layered pixel-art forest into a tiny canvas that CSS scales up
 * with `image-rendering: pixelated`. Everything is seeded, so the forest
 * looks the same on every visit; only the drifting motes move.
 */

type RGB = readonly [number, number, number];

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const ramp = (...c: string[]) => c.map(hex);

/** Colour ramps, darkest first. */
const P = {
  sky: ramp("#7fa79a", "#9dbcab", "#bcd2bb", "#d8e5cb", "#ecf0d9", "#f8f5e3"),
  far: ramp("#5f8a7f", "#729b8d", "#88ad9b", "#a0c0aa"),
  mid: ramp("#22463b", "#2d5749", "#3c6958", "#507e69", "#699479"),
  near: ramp("#08150f", "#0c1d17", "#112820", "#19382c", "#245039", "#336846"),
  trunkFar: ramp("#557c70", "#668d80"),
  trunkMid: ramp("#1b372e", "#26473b", "#345a4a"),
  trunkNear: ramp("#060e0b", "#0b1914", "#13271e", "#1f3a2b"),
  ground: ramp(
    "#0a1612",
    "#10241e",
    "#173326",
    "#21462f",
    "#2f5e3a",
    "#477c47",
  ),
  rust: ramp("#3d1a14", "#6b2a1c", "#9c3f24", "#c95a2e", "#e8843a", "#f5b25a"),
  teal: ramp("#08292a", "#0f4143", "#17605d", "#22827a", "#3aa595"),
  amber: hex("#ffa800"),
  cream: hex("#f2dca0"),
  glow: hex("#fff6cf"),
};

/** 4×4 ordered-dither thresholds. */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16,
);
const bay = (x: number, y: number) => B4[((y & 3) << 2) | (x & 3)];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise1(x: number, scale: number, s: number) {
  const p = x / scale;
  const i = Math.floor(p);
  const f = p - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, 0, s) * (1 - u) + hash(i + 1, 0, s) * u;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks a ramp colour for a fractional index, dithering between steps. */
function pick(r: RGB[], t: number, x: number, y: number): RGB {
  const n = r.length - 1;
  if (t <= 0) return r[0];
  if (t >= n) return r[n];
  const b = Math.floor(t);
  return t - b > bay(x, y) ? r[b + 1] : r[b];
}

interface Layer {
  ramp: RGB[];
  trunk: RGB[];
  /** Uniform fog, 0–1. */
  haze: number;
  /** Fog that thickens towards the layer's base. */
  mist: number;
  mistTop: number;
  mistBottom: number;
  /** How strongly the glow and rays brighten this layer. */
  light: number;
  /** Leaf texture strength. */
  tex: number;
  bias: number;
}

export function paint(W: number, H: number): ImageData {
  const img = new ImageData(W, H);
  const d = img.data;
  const U = Math.min(H, W * 1.4);
  const gx = W * 0.62;
  const gy = -H * 0.08;
  const N = W * H;
  const glowF = new Float32Array(N);
  const rayF = new Float32Array(N);
  const skyT = new Float32Array(N);

  const set = (x: number, y: number, c: RGB) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = 255;
  };

  // ── Sky, glow and light rays ──────────────────────────────────────────
  const rays: [number, number, number][] = [
    [1.42, 0.03, 0.55],
    [1.62, 0.03, 0.9],
    [1.8, 0.022, 0.7],
    [1.98, 0.04, 1],
    [2.2, 0.025, 0.6],
    [2.42, 0.05, 0.7],
    [2.65, 0.03, 0.45],
  ];
  const sig2 = 2 * (U * 0.42) ** 2;
  const skyN = P.sky.length - 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = x - gx;
      const dy = y - gy;
      const dist2 = dx * dx + dy * dy;
      const glow = Math.exp(-dist2 / sig2);
      const a = Math.atan2(dy, dx);
      let r = 0;
      for (const [ang, w, s] of rays) {
        const da = (a - ang) / w;
        r += s * Math.exp(-da * da);
      }
      r = Math.min(1, r * Math.exp(-Math.sqrt(dist2) / (U * 1.3)));
      glowF[i] = glow;
      rayF[i] = r;
      skyT[i] = clamp01(0.02 + 0.95 * glow + 0.5 * r - 0.2 * (y / H)) * skyN;
      set(x, y, pick(P.sky, skyT[i], x, y));
    }
  }

  // ── Drawing helpers ───────────────────────────────────────────────────
  const plot = (L: Layer, r: RGB[], x: number, y: number, t: number) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    t += L.light * (glowF[i] * 0.5 + rayF[i] * 0.8) * (r.length - 1);
    const m =
      L.haze + L.mist * clamp01((y - L.mistTop) / (L.mistBottom - L.mistTop));
    if (m > bay(x + 2, y + 1)) {
      set(x, y, pick(P.sky, skyT[i] - 0.6 + rayF[i] * 0.5, x, y));
    } else {
      set(x, y, pick(r, t, x, y));
    }
  };

  const clump = (L: Layer, cx: number, cy: number, r: number, s: number) => {
    const l0x = gx - cx;
    const l0y = gy - cy;
    const ll = Math.hypot(l0x, l0y) || 1;
    const lx = (l0x / ll) * 0.7;
    const ly = (l0y / ll) * 0.7;
    const lz = 0.71;
    const n = L.ramp.length - 1;
    const jagMax = Math.min(3, r * 0.4);
    for (let y = Math.floor(cy - r - 2); y <= Math.ceil(cy + r + 2); y++) {
      if (y < 0 || y >= H) continue;
      for (let x = Math.floor(cx - r - 2); x <= Math.ceil(cx + r + 2); x++) {
        if (x < 0 || x >= W) continue;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const jag =
          (hash(x >> 1, y >> 1, s) - 0.5) * jagMax +
          (hash(x, y, s + 1) - 0.5) * 1.2;
        const rr = r + jag;
        if (dx * dx + dy * dy > rr * rr) continue;
        const nx = dx / r;
        const ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let sh = (nx * lx + ny * ly + nz * lz + 1) / 2;
        sh = clamp01((sh - 0.5) * 1.6 + 0.5);
        sh += (hash(x >> 1, y >> 1, s + 7) - 0.5) * L.tex;
        plot(L, L.ramp, x, y, sh * n + L.bias);
      }
    }
  };

  const trunk = (
    L: Layer,
    x: number,
    yTop: number,
    yBot: number,
    w: number,
    lean: number,
  ) => {
    const n = L.trunk.length - 1;
    for (let y = Math.floor(yTop); y <= yBot; y++) {
      const cx = x + lean * (yBot - y);
      const toBase = yBot - y;
      const ww = toBase < w * 1.5 ? w + (w * 1.5 - toBase) * 0.6 : w;
      const x0 = Math.round(cx - ww / 2);
      const x1 = Math.round(cx + ww / 2);
      for (let xx = x0; xx < Math.max(x1, x0 + 1); xx++) {
        const u = (xx - x0 + 0.5) / Math.max(1, x1 - x0);
        const side = gx > cx ? u : 1 - u;
        plot(
          L,
          L.trunk,
          xx,
          y,
          side * n * 0.95 + (hash(xx, y >> 1, 9) - 0.5) * 0.6,
        );
      }
    }
  };

  const limb = (
    L: Layer,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    w: number,
  ) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= steps; k++) {
      const f = k / steps;
      for (let wi = 0; wi < w; wi++) {
        plot(
          L,
          L.trunk,
          x0 + (x1 - x0) * f + wi,
          y0 + (y1 - y0) * f,
          (L.trunk.length - 1) * 0.45,
        );
      }
    }
  };

  const tree = (
    L: Layer,
    rnd: () => number,
    x: number,
    base: number,
    crownY: number,
    R: number,
    tw: number,
  ) => {
    const seed = (rnd() * 1e9) | 0;
    const lean = (rnd() - 0.5) * 0.08;
    trunk(L, x, crownY, base, tw, lean);
    const cx = x + lean * (base - crownY);
    const limbs = rnd() < 0.6 ? 2 : 1;
    for (let b = 0; b < limbs; b++) {
      const dir = b === 0 ? -1 : 1;
      const ly = crownY + R * (0.3 + rnd() * 0.5);
      limb(
        L,
        cx,
        ly,
        cx + dir * R * (0.6 + rnd() * 0.3),
        ly - R * 0.5,
        Math.max(1, tw - 1),
      );
    }
    const clumps: [number, number, number][] = [[cx, crownY, R * 0.62]];
    const k = 4 + Math.floor(rnd() * 5);
    for (let j = 0; j < k; j++) {
      const a = rnd() * Math.PI * 2;
      const dist = R * (0.3 + rnd() * 0.55);
      clumps.push([
        cx + Math.cos(a) * dist,
        crownY + Math.sin(a) * dist * 0.7,
        R * (0.32 + rnd() * 0.25),
      ]);
    }
    if (rnd() < 0.4) {
      // a lower side branch with its own little crown
      const dir = rnd() < 0.5 ? -1 : 1;
      const yy = crownY + R * (1.1 + rnd() * 0.6);
      const ex = cx + dir * R * 0.9;
      limb(L, cx, yy + R * 0.3, ex, yy, Math.max(1, tw - 1));
      for (let j = 0; j < 3; j++) {
        clumps.push([
          ex + (rnd() - 0.5) * R * 0.6,
          yy + (rnd() - 0.5) * R * 0.3,
          R * (0.25 + rnd() * 0.15),
        ]);
      }
    }
    // bottom first, so upper clumps cast their shadowed edge over lower ones
    clumps.sort((a, b) => b[1] - a[1]);
    clumps.forEach(([x2, y2, r2], j) => clump(L, x2, y2, r2, seed + j * 13));
  };

  const groundY = (x: number) =>
    Math.round(H * 0.83 + (noise1(x, U * 0.25, 3) - 0.5) * U * 0.05);

  // ── Haze trees (farthest) ─────────────────────────────────────────────
  {
    const rnd = rng(11);
    const base = H * 0.64;
    const L: Layer = {
      ramp: P.far,
      trunk: P.trunkFar,
      haze: 0.3,
      mist: 0.5,
      mistTop: base - U * 0.15,
      mistBottom: base,
      light: 0.3,
      tex: 0.25,
      bias: 0.7,
    };
    for (let x = -10; x < W + 10; x += U * (0.07 + rnd() * 0.05)) {
      const R = U * (0.05 + rnd() * 0.04);
      tree(L, rnd, x, base, base - U * (0.12 + rnd() * 0.18), R, 1);
    }
  }

  // ── Far trees ─────────────────────────────────────────────────────────
  {
    const rnd = rng(23);
    const base = H * 0.73;
    const L: Layer = {
      ramp: P.far,
      trunk: P.trunkFar,
      haze: 0.12,
      mist: 0.95,
      mistTop: base - U * 0.16,
      mistBottom: base + 2,
      light: 0.5,
      tex: 0.35,
      bias: 0.2,
    };
    for (let x = -10; x < W + 10; x += U * (0.09 + rnd() * 0.07)) {
      const R = U * (0.06 + rnd() * 0.05);
      tree(
        L,
        rnd,
        x,
        base,
        base - U * (0.18 + rnd() * 0.22),
        R,
        1 + Math.round(rnd()),
      );
    }
  }

  // ── Mid trees, thinned out in the middle so the glow shows through ───
  {
    const rnd = rng(37);
    const base = H * 0.82;
    const L: Layer = {
      ramp: P.mid,
      trunk: P.trunkMid,
      haze: 0,
      mist: 0.85,
      mistTop: base - U * 0.13,
      mistBottom: base + 4,
      light: 0.3,
      tex: 0.45,
      bias: -0.3,
    };
    for (let x = -10; x < W + 10; x += U * (0.14 + rnd() * 0.12)) {
      const skip = rnd();
      const R = U * (0.08 + rnd() * 0.06);
      const top = base - U * (0.25 + rnd() * 0.25);
      const tw = 2 + Math.round(rnd());
      if (x > W * 0.38 && x < W * 0.74 && skip < 0.75) continue;
      tree(L, rnd, x, base, top, R, tw);
    }
  }

  // ── Near trees framing the clearing ───────────────────────────────────
  const Rn = Math.min(U * 0.28, W * 0.22);
  const twN = Math.max(3, Math.round(U * 0.035));
  const near: Layer = {
    ramp: P.near,
    trunk: P.trunkNear,
    haze: 0,
    mist: 0,
    mistTop: 0,
    mistBottom: 1,
    light: 0.12,
    tex: 0.6,
    bias: -0.5,
  };
  {
    const rnd = rng(53);
    // top canopy
    for (const [from, to] of [
      [-Rn, W * 0.28],
      [W * 0.74, W + Rn],
    ] as const) {
      for (let x = from; x < to; x += Rn * (0.4 + rnd() * 0.3)) {
        clump(
          near,
          x,
          -U * 0.08 + rnd() * U * 0.15,
          Rn * (0.4 + rnd() * 0.3),
          (rnd() * 1e9) | 0,
        );
      }
    }
    // hanging vines
    for (let v = 0; v < 9; v++) {
      const left = v % 2 === 0;
      const x0 = Math.round(
        left ? rnd() * W * 0.26 : W * 0.76 + rnd() * W * 0.24,
      );
      const y0 = Math.round(U * (0.02 + rnd() * 0.08));
      const len = U * (0.1 + rnd() * 0.3);
      for (let k = 0; k < len; k++) {
        const x = Math.round(x0 + Math.sin((y0 + k) * 0.15 + v) * 1);
        plot(near, near.ramp, x, y0 + k, 2.2);
        if (k % 3 === 0)
          plot(near, near.ramp, x + (k % 6 === 0 ? 1 : -1), y0 + k, 3.4);
      }
    }
    const trees: [number, number, number][] = [
      [-Rn * 0.3, U * 0.12, Rn],
      [Rn * 0.9, U * 0.32, Rn * 0.8],
      [W + Rn * 0.3, U * 0.08, Rn],
      [W - Rn * 1.0, U * 0.3, Rn * 0.78],
    ];
    for (const [x, cy, R] of trees) {
      tree(near, rnd, x, groundY(x) + 3, cy, R, twN);
    }
  }

  // ── Ground, grass, flowers ────────────────────────────────────────────
  for (let x = 0; x < W; x++) {
    const g = groundY(x);
    for (let y = g; y < H; y++) {
      const i = y * W + x;
      const depth = (y - g) / (H - g);
      const lit = (glowF[i] * 0.8 + rayF[i] * 1.2) * (1 - depth) * 2;
      const t =
        2.4 - depth * 2.8 + (hash(x >> 2, y >> 1, 21) - 0.5) * 0.9 + lit;
      set(x, y, pick(P.ground, Math.max(1, t), x, y));
    }
    const blades =
      Math.floor(hash(x, 0, 31) * 3) + (hash(x, 1, 31) > 0.85 ? 3 : 0);
    for (let k = 1; k <= blades; k++) {
      const i = Math.max(0, (g - k) * W + x);
      set(
        x,
        g - k,
        pick(P.ground, 3 + k * 0.4 + (glowF[i] + rayF[i]) * 1.5, x, g - k),
      );
    }
    if (hash(x, 2, 41) > 0.965) {
      const c = [P.amber, P.cream, P.rust[4]][Math.floor(hash(x, 3, 41) * 3)];
      set(x, g - 1 - Math.floor(hash(x, 4, 41) * 2), c);
    }
  }

  // two tiny mushrooms at the tree roots
  const mushroom = (x: number) => {
    x = Math.round(x);
    const y = groundY(x);
    const cap = [P.rust[3], P.rust[4], P.cream];
    set(x, y - 1, P.cream);
    set(x, y - 2, P.cream);
    for (let k = -1; k <= 1; k++) set(x + k, y - 3, cap[0]);
    set(x, y - 4, cap[1]);
    set(x - 1, y - 3, cap[2]);
  };
  mushroom(Rn * 0.9 + twN + 3);
  mushroom(W - Rn * 1.0 - twN - 4);

  // ── Foreground leaves ─────────────────────────────────────────────────
  const leaf = (
    ax: number,
    ay: number,
    ang: number,
    len: number,
    wid: number,
    r: RGB[],
  ) => {
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const n = r.length - 1;
    for (let y = Math.floor(ay - len); y <= Math.ceil(ay + len); y++) {
      if (y < 0 || y >= H) continue;
      for (let x = Math.floor(ax - len); x <= Math.ceil(ax + len); x++) {
        if (x < 0 || x >= W) continue;
        const rx = x + 0.5 - ax;
        const ry = y + 0.5 - ay;
        const u = rx * ca + ry * sa;
        if (u < 0 || u > len) continue;
        // bend the leaf so it droops a little along its length
        const v = -rx * sa + ry * ca - (u / len) ** 2 * len * 0.18;
        const half = wid * Math.sin(Math.PI * Math.pow(u / len, 0.65));
        if (Math.abs(v) > half) continue;
        const vn = v / half;
        let t = n * 0.45 + (vn < 0 ? 0.8 : -0.3) + (1 - Math.abs(vn)) * 0.6;
        const vein = ((u - Math.abs(v) * 0.9) / (len * 0.11)) % 1;
        if (vein < 0.12 && Math.abs(vn) > 0.15) t += 0.9;
        if (Math.abs(v) < 0.6) t = n - 0.4;
        t -= (1 - u / len) * 1.4;
        set(x, y, pick(r, t, x, y));
      }
    }
  };
  {
    const rnd = rng(71);
    const scale = Math.min(1, W / (U * 1.6));
    const ax = W + 1;
    const ay = H * 0.8;
    const leaves: [number, RGB[]][] = [
      [Math.PI + 0.9, P.teal],
      [Math.PI - 0.35, P.teal],
      [Math.PI + 0.45, P.rust],
      [Math.PI + 1.25, P.rust],
      [Math.PI + 0.05, P.rust],
    ];
    for (const [ang, r] of leaves) {
      const len = U * (0.22 + rnd() * 0.12) * scale;
      leaf(ax, ay + (rnd() - 0.5) * U * 0.05, ang, len, len * 0.3, r);
    }
  }

  return img;
}

interface Mote {
  x: number;
  y: number;
  vy: number;
  ph: number;
  f: number;
  warm: boolean;
}

function makeMotes(W: number, H: number): Mote[] {
  const rnd = rng(97);
  const count = Math.round(Math.min(70, Math.max(24, (W * H) / 1400)));
  return Array.from({ length: count }, () => ({
    x: rnd() * W,
    y: rnd() * H,
    vy: 0.6 + rnd() * 1.6,
    ph: rnd() * Math.PI * 2,
    f: 0.8 + rnd() * 1.8,
    warm: rnd() < 0.55,
  }));
}

const css = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

/** Wires a canvas up to fill its parent with the forest. */
export function mountForest(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!host || !ctx) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0;
  let H = 0;
  let S = 0;
  let base: HTMLCanvasElement | null = null;
  let motes: Mote[] = [];
  let visible = true;
  let frame = 0;
  let last = 0;

  const draw = (now: number) => {
    if (!base) return;
    ctx.globalAlpha = 1;
    ctx.drawImage(base, 0, 0);
    const time = now / 1000;
    const top = H * 0.15;
    const span = H - top;
    for (const m of motes) {
      const x = Math.round(m.x + Math.sin(time * 0.4 + m.ph) * 3);
      const yy = (((m.y - time * m.vy - top) % span) + span) % span;
      const y = Math.round(top + yy);
      const b = 0.5 + 0.5 * Math.sin(time * m.f + m.ph * 3);
      if (b < 0.3) continue;
      ctx.fillStyle = css(m.warm ? P.amber : P.glow);
      ctx.globalAlpha = b;
      ctx.fillRect(x, y, 1, 1);
      if (b > 0.8) {
        ctx.globalAlpha = (b - 0.8) * 1.6;
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  };

  const loop = (now: number) => {
    frame = 0;
    if (!visible || document.hidden) return;
    if (now - last > 33) {
      last = now;
      draw(now);
    }
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (reduce || frame) return;
    frame = requestAnimationFrame(loop);
  };

  const layout = () => {
    const cw = host.clientWidth;
    const ch = host.clientHeight;
    if (!cw || !ch) return;
    const s = Math.max(3, Math.round(ch / 180));
    const w = Math.ceil(cw / s);
    const h = Math.ceil((ch * 1.06) / s);
    if (w === W && h === H && s === S) return;
    W = w;
    H = h;
    S = s;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * S}px`;
    canvas.style.height = `${H * S}px`;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    off.getContext("2d")?.putImageData(paint(W, H), 0, 0);
    base = off;
    motes = makeMotes(W, H);
    draw(performance.now());
    canvas.dataset.ready = "";
  };

  layout();
  start();

  let t: number | undefined;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = window.setTimeout(layout, 150);
  }).observe(host);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(host);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) start();
  });
}
