/**
 * Little pixel landscapes used as seams between sections. Each generator
 * fills a grid with palette keys; PixelEdge.astro turns that into SVG.
 * Everything is seeded, so the seams look the same on every build.
 */

export interface Run {
  x: number;
  y: number;
  w: number;
}

export interface EdgeLayer {
  fill: string;
  opacity: number;
  runs: Run[];
}

export interface Edge {
  width: number;
  height: number;
  /** Which side the silhouette is attached to. */
  anchor: "top" | "bottom";
  layers: EdgeLayer[];
}

export type Variant = "canopy" | "meadow" | "ground" | "hills";

type Palette = Record<string, { fill: string; opacity?: number }>;

const W = 520;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

class Grid {
  cells: (string | null)[];
  constructor(
    public w: number,
    public h: number,
  ) {
    this.cells = new Array(w * h).fill(null);
  }
  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.cells[y * this.w + x];
  }
  set(x: number, y: number, key: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.cells[y * this.w + x] = key;
  }
  /** Only paints empty cells, for things that sit behind. */
  under(x: number, y: number, key: string) {
    if (this.get(Math.round(x), Math.round(y)) === null) this.set(x, y, key);
  }
  toLayers(palette: Palette): EdgeLayer[] {
    return Object.entries(palette).map(([key, { fill, opacity = 1 }]) => {
      const runs: Run[] = [];
      for (let y = 0; y < this.h; y++) {
        let x = 0;
        while (x < this.w) {
          if (this.get(x, y) !== key) {
            x++;
            continue;
          }
          let end = x;
          while (end < this.w && this.get(end, y) === key) end++;
          runs.push({ x, y, w: end - x });
          x = end;
        }
      }
      return { fill, opacity, runs };
    });
  }
}

/**
 * Looking out from under the trees: layers of foliage step from the dark
 * forest through moss and soft green to a pale mist, each layer hanging a
 * little lower and lighter, with dithered seams between them. Vines and a
 * few falling leaves drift down into the light.
 */
function canopy(fg: string, mid: string): Edge {
  const H = 30;
  const g = new Grid(W, H);
  const rnd = rng(5);
  type Blob = [number, number, number];
  const blobs = (
    yMin: number,
    ySpan: number,
    rMin: number,
    rMax: number,
    gap: number,
  ) => {
    const out: Blob[] = [];
    for (let x = -6; x < W + 6; x += gap * (0.5 + rnd() * 0.9)) {
      out.push([x, yMin + rnd() * ySpan, rMin + rnd() * (rMax - rMin)]);
    }
    return out;
  };
  const inBlob = (x: number, y: number, list: Blob[], s: number) =>
    list.some(([cx, cy, r]) => {
      const dx = x + 0.5 - cx;
      const dy = (y + 0.5 - cy) * 1.1;
      const rr = r + (hash(x >> 1, y >> 1, s) - 0.5) * 1.4;
      return dx * dx + dy * dy <= rr * rr;
    });

  // darkest first; each layer only fills what the ones above left empty
  const layers: { key: string; solid: number; list: Blob[] }[] = [
    { key: "f", solid: 1, list: blobs(1, 5, 3, 7.5, 8) },
    { key: "b", solid: 3, list: blobs(4, 7, 3.5, 7.5, 8) },
    { key: "c", solid: 6, list: blobs(8, 8, 3, 6.5, 8) },
    { key: "e", solid: 9, list: blobs(12, 9, 2.5, 5.5, 9) },
  ];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      for (const [i, L] of layers.entries()) {
        if (y <= L.solid || inBlob(x, y, L.list, 77 + i)) {
          g.set(x, y, L.key);
          break;
        }
      }
    }
  }

  // dither each seam: the darker layer frays into the lighter one below
  const order = ["f", "b", "c", "e"];
  for (let x = 0; x < W; x++) {
    for (let y = H - 2; y >= 1; y--) {
      const above = g.get(x, y - 1);
      const here = g.get(x, y);
      if (!above || above === here) continue;
      if (here && order.indexOf(above) > order.indexOf(here)) continue;
      if ((x + y) % 2 === 0) g.set(x, y, above);
      if ((x + y) % 2 === 1 && hash(x, y, 12) < 0.35) g.set(x, y + 1, above);
    }
  }

  // light catching the lower edges of the two darkest layers
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = g.get(x, y);
      const below = g.get(x, y + 1);
      if (c === "f" && below !== "f" && hash(x, y, 3) < 0.4) g.set(x, y, "l");
      else if (
        c === "b" &&
        below !== "b" &&
        below !== "f" &&
        hash(x, y, 4) < 0.3
      )
        g.set(x, y, "n");
    }
  }

  // vines, hanging from the dark canopy into the light
  for (let x = 6; x < W; x += 16 + Math.floor(rnd() * 26)) {
    let y = 0;
    while (y < H && (g.get(x, y) === "f" || g.get(x, y) === "l")) y++;
    const len = 5 + Math.floor(rnd() * 14);
    let vx = x;
    for (let k = 0; k < len && y + k < H - 1; k++) {
      if (k > 0 && k % 4 === 0) vx += rnd() < 0.5 ? -1 : 1;
      g.set(vx, y + k, "f");
      if (k % 3 === 1) g.set(vx + (k % 6 === 1 ? 1 : -1), y + k, "l");
    }
  }

  // a few falling leaves, out in the open
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rnd() * W);
    const y = 18 + Math.floor(rnd() * (H - 19));
    const key = rnd() < 0.5 ? "a" : "r";
    if (!g.get(x, y) && !g.get(x + 1, y - 1)) {
      g.set(x, y, key);
      g.set(x + 1, y - 1, key);
    }
  }

  return {
    width: W,
    height: H,
    anchor: "top",
    layers: g.toLayers({
      e: { fill: "#c9d5c1" },
      c: { fill: "#6f9a80" },
      b: { fill: mid },
      n: { fill: "#4f806a" },
      f: { fill: fg },
      l: { fill: "#009b77" },
      a: { fill: "#ffa800" },
      r: { fill: "#c95a2e" },
    }),
  };
}

/** A grassy meadow with a soft hill behind and little flowers. */
function meadow(fg: string, stem: string): Edge {
  const H = 18;
  const g = new Grid(W, H);
  const rnd = rng(17);
  const base = H - 3;
  for (let x = 0; x < W; x++) {
    const tuft = noise1(x, 7, 2);
    const h = Math.floor((hash(x, 0, 4) * 0.5 + tuft * 0.9) * 6);
    for (let y = base - h; y < H; y++) g.set(x, y, "f");
    if (hash(x, 1, 4) > 0.88) g.set(x, base - h - 1, "f");
    // darker blades scattered through the grass for texture
    if (h > 1 && hash(x, 5, 4) > 0.6) g.set(x, base - h + 1, "d");
    const hill = Math.round(
      H -
        7 -
        Math.sin(x / 30 + 1.3) * 4 -
        Math.sin(x / 13) * 1.2 -
        noise1(x, 24, 9) * 2,
    );
    for (let y = hill; y < H; y++) g.under(x, y, "b");
  }
  // a few small clusters of flowers, far apart, rather than an even row
  const flower = (x: number, top: number, petal: string) => {
    for (let y = top + 1; y < base; y++) g.set(x, y, "s");
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      g.set(x + dx, top + dy, petal);
    }
    g.set(x, top, "y");
  };
  for (let x = 20 + rnd() * 30; x < W - 6; x += 75 + rnd() * 90) {
    const petal = ["a", "c", "r"][Math.floor(rnd() * 3)];
    const count = 1 + Math.floor(rnd() * 2.4);
    for (let i = 0; i < count; i++) {
      const fx = Math.round(x + i * (4 + rnd() * 3));
      flower(fx, base - 3 - Math.floor(rnd() * 4), petal);
    }
  }
  return {
    width: W,
    height: H,
    anchor: "bottom",
    layers: g.toLayers({
      b: { fill: fg, opacity: 0.7 },
      f: { fill: fg },
      d: { fill: stem, opacity: 0.45 },
      s: { fill: stem },
      a: { fill: "#ffa800" },
      c: { fill: "#f3efe6" },
      r: { fill: "#c95a2e" },
      y: { fill: "#f2dca0" },
    }),
  };
}

/** A slice of ground: turf over crumbly topsoil, pebbles, a worm. */
function ground(fg: string): Edge {
  const H = 22;
  const g = new Grid(W, H);
  const rnd = rng(29);
  for (let x = 0; x < W; x++) {
    const b =
      2 + Math.floor(noise1(x, 10, 6) * 3) + (hash(x, 2, 6) > 0.8 ? 1 : 0);
    for (let y = 0; y < b; y++) g.set(x, y, "f");
    // crumbly topsoil, dithered
    for (let y = b; y < b + 2; y++) if ((x + y) % 2 === 0) g.set(x, y, "d");
  }
  // pebbles
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * W);
    const y = 8 + Math.floor(rnd() * (H - 9));
    if (g.get(x, y) || g.get(x + 1, y)) continue;
    g.set(x, y, "p");
    g.set(x + 1, y, "p");
    if (rnd() < 0.4) g.set(x, y - 1, "p");
  }
  // one worm, wriggling through
  const wx = Math.floor(W * 0.62);
  const wy = 15;
  for (const [dx, dy] of [
    [0, 0],
    [1, -1],
    [2, -1],
    [3, 0],
    [4, 0],
    [5, -1],
  ]) {
    g.set(wx + dx, wy + dy, "w");
  }
  return {
    width: W,
    height: H,
    anchor: "top",
    layers: g.toLayers({
      d: { fill: "#8a6a3e", opacity: 0.55 },
      p: { fill: "#c9b48e" },
      w: { fill: "#d98a8a" },
      f: { fill: fg },
    }),
  };
}

/** Night hills rising into the footer, with grass on the ridges and fireflies. */
function hills(fg: string): Edge {
  const H = 18;
  const g = new Grid(W, H);
  const rnd = rng(43);
  for (let x = 0; x < W; x++) {
    const top = Math.round(
      H -
        5 -
        Math.sin(x / 26 + 0.4) * 2 -
        Math.sin(x / 11) * 0.8 -
        noise1(x, 20, 11) * 2.5,
    );
    for (let y = top; y < H; y++) g.set(x, y, "f");
    const blades =
      hash(x, 3, 11) > 0.55 ? 1 + Math.floor(hash(x, 4, 11) * 2.5) : 0;
    for (let k = 1; k <= blades; k++) g.set(x, top - k, "f");
    const back = Math.round(
      H -
        9 -
        Math.sin(x / 30 + 2) * 5 -
        Math.sin(x / 13) * 1.2 -
        noise1(x, 24, 13) * 2,
    );
    for (let y = back; y < H; y++) g.under(x, y, "b");
  }
  for (let i = 0; i < 22; i++) {
    const x = 2 + Math.floor(rnd() * (W - 4));
    const y = 1 + Math.floor(rnd() * 8);
    if (g.get(x, y)) continue;
    g.set(x, y, "a");
    if (rnd() < 0.5) {
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
        g.under(x + dx, y + dy, "h");
    }
  }
  return {
    width: W,
    height: H,
    anchor: "bottom",
    layers: g.toLayers({
      b: { fill: fg, opacity: 0.5 },
      f: { fill: fg },
      h: { fill: "#ffa800", opacity: 0.3 },
      a: { fill: "#ffa800" },
    }),
  };
}

export function makeEdge(variant: Variant, fg: string, accent: string): Edge {
  switch (variant) {
    case "canopy":
      return canopy(fg, accent);
    case "meadow":
      return meadow(fg, accent);
    case "ground":
      return ground(fg);
    case "hills":
      return hills(fg);
  }
}
