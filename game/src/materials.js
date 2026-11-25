/* =====================================================================
   MATERIALS: detailed generated textures with normal maps (wood planks,
   carpet tiles, marble, concrete, plaster, fabric). Everything is drawn
   in code so it works offline; textures tile seamlessly and are cached.
   ===================================================================== */
const MAT_CACHE = {};
function texSize() { return { perf: 256, hd: 512, ultra: 1024, max: 1024 }[S.gfx || "hd"] || 512; }
/* periodic value noise so every texture tiles without seams */
function makeNoise(seed, cells) {
  let s = seed >>> 0; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rnd();
  return (x, y) => { // x,y in [0,1)
    const fx = x * cells, fy = y * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), m = c => ((c % cells) + cells) % cells;
    const a = g[m(y0) * cells + m(x0)], b = g[m(y0) * cells + m(x0 + 1)], c = g[m(y0 + 1) * cells + m(x0)], d = g[m(y0 + 1) * cells + m(x0 + 1)];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(noises, x, y) { let v = 0, amp = .5, tot = 0; for (const n of noises) { v += n(x, y) * amp; tot += amp; amp *= .5; } return v / tot; }
const octaves = (seed, base, n = 4) => Array.from({ length: n }, (_, i) => makeNoise(seed + i * 101, base << i));
function hexRGB(h) { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; }
/* build color + normal textures from a per-pixel function returning [r,g,b,height] */
function genTex(key, N, fn, normalStrength = 2) {
  if (MAT_CACHE[key]) return MAT_CACHE[key];
  const col = new Uint8ClampedArray(N * N * 4), hgt = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const o = fn(x / N, y / N, x, y); const i = y * N + x; col[i * 4] = o[0]; col[i * 4 + 1] = o[1]; col[i * 4 + 2] = o[2]; col[i * 4 + 3] = 255; hgt[i] = o[3]; }
  const nrm = new Uint8ClampedArray(N * N * 4), H = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * normalStrength * N / 256, dy = (H(x, y + 1) - H(x, y - 1)) * normalStrength * N / 256; const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4; nrm[i] = (-dx / l * .5 + .5) * 255; nrm[i + 1] = (dy / l * .5 + .5) * 255; nrm[i + 2] = (1 / l * .5 + .5) * 255; nrm[i + 3] = 255; }
  const mk = (data, srgb) => { const c = document.createElement("canvas"); c.width = c.height = N; c.getContext("2d").putImageData(new ImageData(data, N, N), 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(Q().aniso, E.renderer ? E.renderer.capabilities.getMaxAnisotropy() : 4); if (srgb) t.encoding = THREE.sRGBEncoding; t.userData = { own: false }; return t; };
  return (MAT_CACHE[key] = { map: mk(col, true), normalMap: mk(nrm, false) });
}
const shadeRGB = (rgb, k) => [rgb[0] * k, rgb[1] * k, rgb[2] * k];

const GEN = {
  wood(color, N) { // 4 planks per tile, staggered seams, grain and knots
    const base = hexRGB(color || "#b98a58"), grain = octaves(11, 3), fine = octaves(29, 16, 2), r = makeNoise(7, 64);
    const seams = [.13, .61, .37, .86];
    return (u, v) => { const p = Math.floor(v * 4), pv = v * 4 - p, tone = .82 + r(p / 64, .5) * .3;
      const g = fbm(grain, u * .5 + p * .27, v * 2), ring = .5 + .5 * Math.sin((v * 4 + g * 3.2) * 38 + u * 6), f = fbm(fine, u, v);
      let k = tone * (.91 + ring * .07) * (.95 + f * .08); let h = .55 + ring * .08 + f * .05;
      const seamU = Math.abs(((u - seams[p] + 1) % 1)), edge = Math.min(pv, 1 - pv);
      if (edge < .025 || seamU < .006) { k *= .55; h = .1; }
      return [...shadeRGB(base, k), h]; };
  },
  carpet(color, N) { // 2x2 carpet tiles with alternating pile direction
    const base = hexRGB(color || "#555a66"), fib = makeNoise(5, 256), lo = octaves(3, 4, 3);
    return (u, v, x, y) => { const tx = Math.floor(u * 2), ty = Math.floor(v * 2), alt = (tx + ty) % 2;
      const stripe = .5 + .5 * Math.sin((alt ? u : v) * Math.PI * 2 * 48), n = fib(u * (alt ? 1 : 3), v * (alt ? 3 : 1)), l = fbm(lo, u, v);
      let k = (.86 + stripe * .08 + n * .12) * (.95 + l * .1) * (alt ? 1 : .94); let h = .4 + n * .4 + stripe * .15;
      const eu = Math.min(u * 2 % 1, 1 - u * 2 % 1), ev = Math.min(v * 2 % 1, 1 - v * 2 % 1); if (eu < .006 || ev < .006) { k *= .78; h = .15; }
      return [...shadeRGB(base, k), h]; };
  },
  marble(color, N) { // big polished tiles with soft veins and grout
    const vein = octaves(17, 2, 5), cloud = octaves(41, 3, 3);
    return (u, v) => { const t = Math.floor(u * 2) + Math.floor(v * 2) * 2, w = fbm(vein, u + t * .31, v + t * .17);
      const vn = Math.pow(1 - Math.abs(Math.sin((u * 1.6 + v * .9 + w * 2.6) * Math.PI * 2)), 26), cl = fbm(cloud, u, v);
      const bright = 238 - cl * 20 - vn * 28; let r = bright, g = bright + 2, b = bright + 6, h = .7;
      const eu = Math.min(u * 2 % 1, 1 - u * 2 % 1), ev = Math.min(v * 2 % 1, 1 - v * 2 % 1); if (eu < .004 || ev < .004) { r = g = b = 170; h = .1; }
      return [r, g, b, h]; };
  },
  concrete(color, N) {
    const lo = octaves(23, 3, 4), sp = makeNoise(77, 512), pores = makeNoise(91, 128);
    return (u, v) => { const l = fbm(lo, u, v), s = sp(u, v), p = pores(u, v); let k = 168 + l * 34 + (s - .5) * 16; let h = .5 + l * .2 + s * .1;
      if (p > .82) { k -= 30; h -= .3; } return [k, k + 1, k - 2, h]; };
  },
  plaster(color, N) { // near-white so the wall color tints it
    const lo = octaves(61, 8, 3), hi = makeNoise(63, 256);
    return (u, v) => { const n = fbm(lo, u, v), f = hi(u, v); const k = 238 + (n - .5) * 14 + (f - .5) * 8; return [k, k, k, n * .6 + f * .4]; };
  },
  fabric(color, N) {
    const base = hexRGB(color || "#5a6a80"), lo = octaves(83, 4, 2);
    return (u, v) => { const a = Math.sin(u * Math.PI * 2 * 96), b = Math.sin(v * Math.PI * 2 * 96), w = (a > 0) !== (b > 0) ? Math.abs(a) : Math.abs(b), l = fbm(lo, u, v);
      return [...shadeRGB(base, .82 + w * .16 + l * .06), w]; };
  }
};
const ROUGH = { wood: .55, carpet: .98, marble: .16, concrete: .88, plaster: .93, fabric: .95 };
function richFloorMat(kind, color, W, D) {
  const g = GEN[kind === "tile" ? "carpet" : kind] || (kind === "carpet" || !kind ? GEN.carpet : null); if (!g) return null;
  const N = texSize(), k = kind in GEN ? kind : "carpet"; const set = genTex(`floor:${k}:${color}:${N}`, N, g(color, N), k === "marble" ? .6 : k === "carpet" ? 1.4 : 2.2);
  const rep = { wood: 3.2, carpet: 2.4, marble: 4, concrete: 4 }[k] || 3;
  const map = set.map.clone(), normalMap = set.normalMap.clone(); [map, normalMap].forEach(t => { t.needsUpdate = true; t.repeat.set(W / rep, D / rep); });
  return new THREE.MeshStandardMaterial({ map, normalMap, normalScale: new THREE.Vector2(.9, .9), roughness: ROUGH[k], metalness: 0, envMapIntensity: k === "marble" ? 1.2 : .6 });
}
const WALL_MATS = {};
function richWallMat(color) {
  if (WALL_MATS[color]) return WALL_MATS[color];
  const N = Math.min(512, texSize()), set = genTex(`plaster:${N}`, N, GEN.plaster(null, N), 1.2);
  const map = set.map.clone(), nm = set.normalMap.clone(); [map, nm].forEach(t => { t.needsUpdate = true; t.repeat.set(1.5, 1); });
  return (WALL_MATS[color] = new THREE.MeshStandardMaterial({ color: lin(color), map, normalMap: nm, normalScale: new THREE.Vector2(.5, .5), roughness: .93 }));
}
function fabricMat(color) {
  const key = "fab:" + color; if (WALL_MATS[key]) return WALL_MATS[key];
  const N = Math.min(512, texSize()), set = genTex(`fabric:${color}:${N}`, N, GEN.fabric(color, N), 1.5);
  const map = set.map.clone(), nm = set.normalMap.clone(); [map, nm].forEach(t => { t.needsUpdate = true; t.repeat.set(2, 2); });
  return (WALL_MATS[key] = new THREE.MeshStandardMaterial({ map, normalMap: nm, roughness: .96 }));
}
function resetMaterialCache() { for (const k in MAT_CACHE) { MAT_CACHE[k].map.dispose(); MAT_CACHE[k].normalMap.dispose(); delete MAT_CACHE[k]; } for (const k in WALL_MATS) delete WALL_MATS[k]; }
