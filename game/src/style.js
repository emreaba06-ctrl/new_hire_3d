/* =====================================================================
   STYLE: every department gets its own interior design, on a quality
   ladder: basic → standard → modern startup → premium (plus a dark SOC).
   Shared spaces (lobby, cafeteria) get the modern look from the
   reference photos: exposed ceilings, brick, moss wall, pendant lights.
   ===================================================================== */
const DEPT_STYLE = { wh: "basic", logi: "basic", support: "basic", retail: "basic", it: "standard", acct: "standard", hr: "standard", sales: "standard",
  dev: "startup", mkt: "startup", data: "startup", mgmt: "premium", bank: "premium", cyber: "soc", med: "clinical", chef: "kitchen" };
const STYLE_NAMES = { basic: "Budget floor", standard: "Classic office", startup: "Modern startup", premium: "Executive suite", soc: "Security operations", clinical: "Hospital ward", kitchen: "Restaurant kitchen" };

/* ---------- generated surface textures ---------- */
function brickSet() { const N = Math.min(512, texSize()); return genTex("brick:" + N, N, (() => { const nz = makeNoise(5, 64), fine = makeNoise(9, 256);
  return (u, v) => { const rows = 16, row = Math.floor(v * rows), off = row % 2 ? .5 / 6 : 0, cols = 6, cu = (u + off) * cols, col = Math.floor(cu), bu = cu - col, bv = v * rows - row;
    const mortar = bu < .05 || bv < .1; if (mortar) return [196, 190, 178, .1];
    const t = .78 + nz(((col * 7 + row * 13) % 64) / 64, .3) * .35, f = .9 + fine(u, v) * .18; return [168 * t * f, 72 * t * f, 52 * t * f, .6 + fine(u, v) * .3]; }; })(), 2.4); }
function slatSet(color) { const N = Math.min(512, texSize()); return genTex("slat:" + color + N, N, (() => { const base = hexRGB(color), g = octaves(31, 4, 3);
  return (u, v) => { const s = (u * 12) % 1, gap = s < .1; const k = gap ? .35 : .85 + fbm(g, u * 3, v * .5) * .25; return [...shadeRGB(base, k), gap ? .1 : .6]; }; })(), 2); }
function mossSet() { const N = Math.min(512, texSize()); return genTex("moss:" + N, N, (() => { const a = octaves(51, 8, 4), b = makeNoise(53, 128);
  return (u, v) => { const n = fbm(a, u, v), c = b(u, v), k = .55 + n * .7; const bump = Math.pow(c, 2); return [70 * k + bump * 30, 120 * k + bump * 40, 40 * k, .3 + n * .5 + bump * .4]; }; })(), 3); }
function surfMat(set, rx, ry, extra = {}) { const map = set.map.clone(), nm = set.normalMap.clone(); [map, nm].forEach(t => { t.needsUpdate = true; t.repeat.set(rx, ry); }); return new THREE.MeshStandardMaterial(Object.assign({ map, normalMap: nm, roughness: .9 }, extra)); }
/* panel flat against an inner wall. side: "n" north (z=-D/2), "s", "w", "e" */
function wallPanel(side, a0, a1, y0, y1, material, inset = .155) {
  const W = E.room.W, D = E.room.D, len = a1 - a0, h = y1 - y0, m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), material);
  if (side === "n") { m.position.set((a0 + a1) / 2, y0 + h / 2, -D / 2 + inset); }
  else if (side === "s") { m.position.set((a0 + a1) / 2, y0 + h / 2, D / 2 - inset); m.rotation.y = Math.PI; }
  else if (side === "w") { m.position.set(-W / 2 + inset, y0 + h / 2, (a0 + a1) / 2); m.rotation.y = Math.PI / 2; }
  else { m.position.set(W / 2 - inset, y0 + h / 2, (a0 + a1) / 2); m.rotation.y = -Math.PI / 2; }
  m.receiveShadow = true; E.world.add(m); return m;
}

/* ---------- ceilings ---------- */
function industrialCeiling(o = {}) {
  const W = E.room.W, D = E.room.D, H = E.room.H || 3.2;
  (E.ceilFix || []).forEach(m => m.visible = false); E.ceilLights = [];
  if (E.ceil) E.ceil.material = new THREE.MeshStandardMaterial({ color: lin(o.dark ? "#1c1f24" : "#3a3d42"), roughness: .95 });
  const duct = mat("#b8bcc2", { metal: .7, rough: .35 }), pipe = mat(o.dark ? "#2a2d33" : "#8a5a3b", { rough: .5 }), blk = mat("#16181c", { rough: .4 });
  for (const z of [-D / 4, D / 2 - 2.4]) { const d = new THREE.Mesh(cgeo(.2, .2, W - 1, 18), duct); d.rotation.z = Math.PI / 2; d.position.set(0, H - .3, z); E.world.add(d); for (let x = -W / 2 + 2; x < W / 2 - 1; x += 3.2) { const ring = new THREE.Mesh(cgeo(.212, .212, .05, 18), duct); ring.rotation.z = Math.PI / 2; ring.position.set(x, H - .3, z); E.world.add(ring); } }
  for (const z of [-D / 2 + 1.2, D / 2 - 1.4]) for (const dy of [0, .14]) { const p = new THREE.Mesh(cgeo(.05, .05, W - .6, 8), pipe); p.rotation.z = Math.PI / 2; p.position.set(0, H - .2 - dy, z); E.world.add(p); }
  for (let x = -W / 2 + 3; x < W / 2 - 2; x += o.dense ? 3.5 : 5) box(E.world, .3, .06, D - 2, "#5a5e66", x, H - .7, 0, { cast: false });
  const glow = new THREE.MeshBasicMaterial({ color: lin(o.warm ? "#ffe2b0" : "#f4f6ff") }); E.ceilLights.push(glow);
  for (let x = -W / 2 + 3.2; x < W / 2 - 2; x += 4.2) for (let z = -D / 2 + 3; z < D / 2 - 2; z += 4) {
    const g = group(x, z); box(g, 2.6, .08, .14, "#16181c", 0, H - .72, 0, { mat: blk }); const l = new THREE.Mesh(bgeo(2.5, .02, .1), glow); l.position.y = H - .73; g.add(l);
    for (const sx of [-1.1, 1.1]) { const c = new THREE.Mesh(cgeo(.006, .006, .66, 4), blk); c.position.set(sx, H - .36, 0); g.add(c); }
  }
}
function downlightCeiling(color = "#f3efe7") {
  const W = E.room.W, D = E.room.D, H = E.room.H || 3.2; (E.ceilFix || []).forEach(m => m.visible = false);
  if (E.ceil) E.ceil.material = new THREE.MeshStandardMaterial({ color: lin(color), roughness: .9 });
  const glow = new THREE.MeshBasicMaterial({ color: lin("#fff3dc") }); E.ceilLights = [glow];
  for (let x = -W / 2 + 2; x < W / 2 - 1; x += 2.5) for (let z = -D / 2 + 2; z < D / 2 - 1; z += 2.5) { const d = new THREE.Mesh(cgeo(.12, .12, .02, 16), glow); d.position.set(x, H - .012, z); E.world.add(d); }
  // cove light strip around the room
  const strip = new THREE.MeshBasicMaterial({ color: lin("#ffd9a0") }); [[0, -D / 2 + .25, W - .5, .04], [0, D / 2 - .25, W - .5, .04], [-W / 2 + .25, 0, .04, D - .5], [W / 2 - .25, 0, .04, D - .5]].forEach(([x, z, w, d]) => { const s = new THREE.Mesh(bgeo(w, .02, d), strip); s.position.set(x, H - .02, z); E.world.add(s); });
}
function pendant(x, z, color = "#16181c", drop = 1.25, glowC = "#ffd9a0") {
  drop = Math.min(drop * .62, .8); const H = E.room.H || 3.2, g = group(x, z); const c = new THREE.Mesh(cgeo(.008, .008, drop, 4), mat("#111")); c.position.y = H - drop / 2; g.add(c);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.22, .26, 18, 1, true), mat(color, { rough: .4, metal: .5 })); shade.material.side = THREE.DoubleSide; shade.position.y = H - drop - .1; g.add(shade);
  const bulb = new THREE.Mesh(sgeo(.07, 10, 8), new THREE.MeshBasicMaterial({ color: lin(glowC) })); bulb.position.y = H - drop - .2; g.add(bulb);
}

/* ---------- furniture from the references ---------- */
function booth(x, z, ry, leather = "#8a4b2a") {
  const g = group(x, z, ry), lm = mat(leather, { rough: .55 }), tbl = mat("#f4f4f2", { rough: .4 }), steel = mat("#1d1f24", { metal: .7, rough: .35 });
  for (const sz of [-.85, .85]) { box(g, 1.8, .45, .55, leather, 0, 0, sz, { mat: lm }); box(g, 1.8, .6, .16, leather, 0, .45, sz + Math.sign(sz) * .2, { mat: lm }); }
  const top = box(g, 1.6, .05, .75, "#f4f4f2", 0, .74, 0, { mat: tbl }); const leg = new THREE.Mesh(cgeo(.04, .04, .72, 8), steel); leg.position.y = .36; g.add(leg);
  // grid shelving behind (black metal frame with wood cubbies and little plants/books)
  const frame = new THREE.Group(); frame.position.set(-1.05, 0, 0); g.add(frame);
  for (const sz of [-1.15, 0, 1.15]) box(frame, .04, 2.2, .04, "#111", 0, 0, sz); for (const y of [0, .7, 1.4, 2.1]) box(frame, .04, .04, 2.3, "#111", 0, y, 0);
  const r = seeded("booth" + x + z); for (let i = 0; i < 6; i++) { const yy = [.72, 1.42][i % 2], zz = -.6 + Math.floor(i / 2) * .6; if (r() < .5) box(frame, .3, .4, .5, "#c9a87a", 0, yy, zz); else if (r() < .5) { const pot = new THREE.Mesh(cgeo(.07, .06, .12, 10), mat("#f4f4f2")); pot.position.set(0, yy + .06, zz); frame.add(pot); const pl = new THREE.Mesh(sgeo(.1, 8, 6), mat("#3d8b3d")); pl.position.set(0, yy + .2, zz); frame.add(pl); } else for (let k = 0; k < 4; k++) box(frame, .2, .28, .05, ["#c0392b", "#2c3e50", "#f1c40f", "#16a085"][k], 0, yy, zz - .1 + k * .06); }
  const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? 2.4 : 2.1, sw ? 2.1 : 2.4);
}
function puttingGreen(x, z, ry) {
  const g = group(x, z, ry); const turf = new THREE.Mesh(bgeo(3.2, .05, 1.3), mat("#4caf50", { rough: 1 })); turf.position.y = .025; g.add(turf); box(g, 3.3, .07, .06, "#1d1f24", 0, 0, .66); box(g, 3.3, .07, .06, "#1d1f24", 0, 0, -.66);
  const hole = new THREE.Mesh(cgeo(.06, .06, .01, 14), mat("#111")); hole.position.set(1.3, .056, 0); g.add(hole); const pole = new THREE.Mesh(cgeo(.008, .008, .6, 4), mat("#f4f4f2")); pole.position.set(1.3, .35, 0); g.add(pole); const flag = new THREE.Mesh(bgeo(.16, .1, .005), mat("#e74c3c")); flag.position.set(1.38, .6, 0); g.add(flag);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(sgeo(.022, 8, 6), mat("#fafafa")); b.position.set(-1.2 + Math.random() * 1.8, .075, (Math.random() - .5) * .9); g.add(b); }
  addInter({ name: "Putting green", verb: "Take a putt", x, z, r: 2, action: () => { const ok = Math.random() < .4; Sfx.tone(ok ? 880 : 300, .2, "sine", .05); toast(ok ? "Hole in one! Your coworkers clap. (−5 stress)" : "So close! It lipped out."); if (ok && SH) SH.stress = Math.max(0, SH.stress - 5); } });
}
function glassPod(x, z, r = 1.6) {
  const g = group(x, z); const H = 2.6, gm = new THREE.MeshStandardMaterial({ color: lin("#dfe9f2"), transparent: true, opacity: .22, roughness: .1, depthWrite: false, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 40, 1, true, .5, Math.PI * 2 - 1), gm); wall.position.y = H / 2; g.add(wall);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .04, 6, 40), mat("#dcdcdc")); ring.rotation.x = Math.PI / 2; ring.position.y = H; g.add(ring);
  const top = new THREE.Mesh(cgeo(r + .1, r + .1, .12, 40), mat("#f4f4f2", { rough: .7 })); top.position.y = H + .06; g.add(top);
  const tb = new THREE.Mesh(cgeo(.45, .45, .04, 24), mat("#f4f4f2")); tb.position.y = .74; g.add(tb); const tl = new THREE.Mesh(cgeo(.04, .04, .72, 8), mat("#888")); tl.position.y = .36; g.add(tl);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; const ch = group(x + Math.cos(a) * .85, z + Math.sin(a) * .85, -a + Math.PI / 2); box(ch, .5, .42, .5, "#2a7fd4", 0, 0, 0); box(ch, .5, .4, .08, "#2a7fd4", 0, .42, -.22); }
  // pendant inside + yellow pom-pom lights like the reference
  for (const [dx, dz] of [[.2, .1], [-.15, -.1]]) { const b = new THREE.Mesh(sgeo(.12, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffd23f" })); b.position.set(dx, 2.15, dz); g.add(b); }
  const steps = 24; for (let i = 0; i < steps; i++) { const a = .5 + i / steps * (Math.PI * 2 - 1); collider(x + Math.cos(a) * r, z - Math.sin(a) * r, .3, .3); }
}
function leatherLounge(x, z, ry) {
  const g = group(x, z, ry); const lm = mat("#9a5530", { rough: .5 }); box(g, 2, .42, .8, "#9a5530", 0, 0, 0, { mat: lm }); box(g, 2, .5, .2, "#9a5530", 0, .42, -.3, { mat: lm }); for (const sx of [-.95, .95]) box(g, .18, .6, .8, "#9a5530", sx, 0, 0, { mat: lm });
  const pillow = box(g, .4, .35, .12, "#c0392b", .5, .5, -.15); pillow.rotation.z = .1;
  for (const sx of [-1.7, 1.7]) { const c = group(x + Math.cos(ry) * sx, z - Math.sin(ry) * sx, ry); box(c, .75, .4, .75, "#3a3d42", 0, 0, .9); box(c, .75, .5, .14, "#3a3d42", 0, .4, .58); }
  const t = box(g, 1.2, .05, .6, "#1d1f24", 0, .42, 1.1); for (const sx of [-.55, .55]) box(g, .04, .4, .55, "#1d1f24", sx, 0, 1.1);
  const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z + (sw ? 0 : .5), sw ? 2.4 : 4.4, sw ? 4.4 : 2.4);
}
function rug(x, z, w, d, color, border = "#e8dcc4") { const g = group(x, z); const b = new THREE.Mesh(new THREE.PlaneGeometry(w + .2, d + .2), mat(border, { rough: 1 })); b.rotation.x = -Math.PI / 2; b.position.y = .012; g.add(b); const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { rough: 1 })); r.rotation.x = -Math.PI / 2; r.position.y = .014; g.add(r); }
function bulletinBoard(side, a, y = 1.2) { const W = E.room.W, D = E.room.D; const cork = canvasTex(256, 160, (c, w, h) => { c.fillStyle = "#b98a58"; c.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { c.save(); c.translate(20 + Math.random() * 200, 15 + Math.random() * 110); c.rotate((Math.random() - .5) * .3); c.fillStyle = ["#fff", "#fff9c4", "#ffccbc", "#c8e6c9", "#bbdefb"][i % 5]; c.fillRect(0, 0, 40, 34); c.fillStyle = "#555"; for (let k = 0; k < 4; k++) c.fillRect(5, 8 + k * 6, 26, 2); c.fillStyle = "#e53935"; c.beginPath(); c.arc(20, 3, 3, 0, 7); c.fill(); c.restore(); } });
  const m = new THREE.MeshStandardMaterial({ map: cork, roughness: .95 }); wallPanel(side, a - .9, a + .9, y, y + 1.1, m, .16); }
function deptStripe(color) { const W = E.room.W, D = E.room.D; const m = new THREE.MeshStandardMaterial({ color: lin(color), roughness: .8 }); wallPanel("n", -W / 2 + .2, -1.9, 1.02, 1.12, m, .157); wallPanel("n", 1.9, W / 2 - .2, 1.02, 1.12, m, .157); }

/* ---------- department styles ---------- */
function applyDeptStyle(job, lay, W, D, F) {
  const st = DEPT_STYLE[job.id] || "standard"; E.style = st;
  if (lay !== "office") { if (st === "basic") { bulletinBoard("n", -9.5); if (lay !== "open") { const f = E.ceilFix && E.ceilFix[3]; if (f) E.anims.push(() => f.visible = !(Math.random() < .04)); } } return; }
  if (st === "basic") {
    bulletinBoard("n", -10.5); const fl = E.ceilFix && E.ceilFix.filter((m, i) => i % 2 === 1)[4]; if (fl) E.anims.push(() => fl.visible = Math.sin(E.t * 23) > -.6 || Math.random() < .5);
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.25 + Math.random() * .3, 12), new THREE.MeshBasicMaterial({ color: "#c9b48a", transparent: true, opacity: .35 })); s.rotation.x = Math.PI / 2; s.position.set(-12 + Math.random() * 24, (E.room.H || 3.2) - .01, -9 + Math.random() * 18); E.world.add(s); }
    PROP.boxes(12.3, -6.5); PROP.boxes(-12.6, -8.6);
  } else if (st === "standard") {
    deptStripe(job.color); rug(0, -3, 2.2, 9, shade(job.color, -.35), "#d9d2c3");
  } else if (st === "startup") {
    industrialCeiling({ warm: true }); wallPanel("n", -W / 2 + .2, -1.9, 0, 3.2, surfMat(brickSet(), 3.5, 1.4)); wallPanel("n", 1.9, W / 2 - .2, 0, 3.2, surfMat(brickSet(), 3.5, 1.4));
    booth(-12.4, -7.6, 0);
    if (job.id === "mkt") { puttingGreen(5.5, 9.3, 0); wallPanel("w", -9.5, -5.5, .4, 2.6, surfMat(mossSet(), 2, 1.2, { roughness: 1 }), .16); }
    if (job.id === "data") { glassPod(5.6, 9.1, 1.4); wallPanel("w", -4.9, -1, .7, 2.5, new THREE.MeshStandardMaterial({ color: lin("#1f4fd1"), roughness: .3 }), .16); }
    if (job.id === "dev") { wallPanel("w", -4.9, -1, .7, 2.5, new THREE.MeshStandardMaterial({ color: lin("#1f4fd1"), roughness: .3 }), .16); }
    for (const x of [-10, -6, 6, 10]) pendant(x, 8.6, "#1d1f24", 1.2);
  } else if (st === "premium") {
    downlightCeiling(); const wood = surfMat(slatSet("#7a5232"), 9, 1, { roughness: .6 });
    wallPanel("n", -W / 2 + .2, -1.9, 0, 3.2, wood); wallPanel("n", 1.9, W / 2 - .2, 0, 3.2, wood);
    if (job.id === "bank") { wallPanel("s", -W / 2 + .2, W / 2 - .2, 0, .5, surfMat(slatSet("#5a3a22"), 12, 1), .157); }
    else { wallPanel("s", -W / 2 + .2, W / 2 - .2, 0, .5, surfMat(slatSet("#5a3a22"), 12, 1), .157); rug(6, -9.2, 4.4, 2.4, "#6d2f35"); }
    leatherLounge(-11.6, -7.2, Math.PI / 2); rug(-11.2, -7.2, 2.6, 4.6, "#3b4a5a");
    for (const x of [-10, -6, 6, 10]) for (const z of [-4.1, -.3]) pendant(x, z, "#c9a227", 1.1);
    frameArt(-13.8, 0, Math.PI / 2, "exec1", 1.5);
  } else if (st === "soc") {
    industrialCeiling({ dark: true, dense: true });
    const led = new THREE.MeshBasicMaterial({ color: "#2a7fd4" }); [[0, -D / 2 + .2, W - .6, .03], [0, D / 2 - .2, W - .6, .03], [-W / 2 + .2, 0, .03, D - .6], [W / 2 - .2, 0, .03, D - .6]].forEach(([x, z, w, d]) => { const s = new THREE.Mesh(bgeo(w, .03, d), led); s.position.set(x, .05, z); E.world.add(s); });
  }
}

/* ---------- shared spaces ---------- */
function styleLobby() {
  const W = E.room.W, D = E.room.D; industrialCeiling({ warm: true });
  wallPanel("n", -W / 2 + .2, -1.9, 0, 3.2, surfMat(brickSet(), 4.5, 1.4)); wallPanel("n", 1.9, W / 2 - .2, 0, 3.2, surfMat(brickSet(), 4.5, 1.4));
  rug(6.5, -6.6, 5.6, 2.6, "#4a4d52");
  for (const x of [-4, 0, 4]) pendant(x, 1.2, "#1d1f24", 1.3);
}
function styleCafe() {
  const W = E.room.W, D = E.room.D; industrialCeiling({ warm: true });
  wallPanel("w", -D / 2 + .3, D / 2 - .3, .2, 3, surfMat(mossSet(), 4, 1.2, { roughness: 1 }), .16);
  box(E.world, .08, 3, D - .6, "#5a3b28", -W / 2 + .2, 0, 0, { cast: false });
  // dark bar with orange stools along the south side
  const bar = group(6, 7.6); box(bar, 6, 1.05, .8, "#1d1f24", 0, 0, 0); box(bar, 6.1, .06, .95, "#9a9a9a", 0, 1.05, 0); const slats = surfMat(slatSet("#8a5a3b"), 6, 1); const sp = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), slats); sp.position.set(0, .52, -.41); sp.rotation.y = Math.PI; bar.add(sp); collider(6, 7.6, 6.1, .95);
  for (let i = 0; i < 6; i++) { const sx = 3.6 + i * .95, s = group(sx, 6.85); const seat = new THREE.Mesh(cgeo(.2, .2, .06, 14), mat("#e8743b", { rough: .5 })); seat.position.y = .78; s.add(seat); box(s, .36, .3, .05, "#e8743b", 0, .82, -.17); const leg = new THREE.Mesh(cgeo(.025, .03, .78, 8), mat("#111")); leg.position.y = .39; s.add(leg); }
  for (let i = 0; i < 6; i++) pendant(3.8 + i * .9, 7.6, "#d9d9d9", 1.1, "#fff3d6");
  for (const x of [-7, 0, 7]) for (const z of [-1.5, 4]) pendant(x, z, "#1d1f24", 1.3);
}
function styleTowerFloors(tower) {
  // warm lit floors, slabs and planters like the reference building
  const glow = new THREE.MeshStandardMaterial({ color: lin("#2b2620"), emissive: lin("#ffcf8a"), emissiveIntensity: .55, roughness: .6 });
  for (let y = 4.6; y < 25; y += 3.2) { const f = new THREE.Mesh(bgeo(17.6, 2.2, .05), glow); f.position.set(0, y + 1.1, 2.0); tower.add(f); box(tower, 18.6, .28, 4.6, "#eef0f2", 0, y - .14, 0);
    for (let x = -8; x <= 8; x += 2.3) { const p = new THREE.Mesh(sgeo(.35, 8, 6), mat("#3f8a3a")); p.position.set(x, y + .25, 2.25); p.scale.y = .7; tower.add(p); } }
  box(tower, 18.8, 1.2, 4.8, "#f4f4f2", 0, 26, 0);
}

/* ---------- more detailed street buildings ---------- */
function apartmentBlock(x, z, w, h, d, base, ry = 0, seed = "apt") {
  const g = group(x, z, ry), r = seeded(seed); const body = box(g, w, h, d, base, 0, 0, 0, { m: { rough: .85 } });
  const lit = new THREE.MeshStandardMaterial({ color: lin("#2d2a26"), emissive: lin("#ffcf8a"), emissiveIntensity: .45, roughness: .4 }), dark = mat("#2b3440", { rough: .2, metal: .3 });
  for (let y = 3.6; y < h - 1; y += 3) for (let xx = -w / 2 + 1.2; xx < w / 2 - .8; xx += 2.2) {
    const win = new THREE.Mesh(bgeo(1.3, 1.5, .05), r() < .35 ? lit : dark); win.position.set(xx, y + .9, d / 2 + .03); g.add(win);
    if (r() < .45) { box(g, 1.7, .08, .7, "#9aa0a8", xx, y, d / 2 + .35); for (let k = 0; k < 5; k++) box(g, .03, .55, .03, "#555", xx - .8 + k * .4, y, d / 2 + .68); if (r() < .4) { const p = new THREE.Mesh(sgeo(.18, 6, 5), mat("#3f8a3a")); p.position.set(xx - .5, y + .3, d / 2 + .5); g.add(p); } }
    if (r() < .3) box(g, .55, .4, .35, "#d9d9d9", xx + .85, y + .2, d / 2 + .2);
  }
  // rooftop clutter: water tank, AC units, antenna
  const tank = new THREE.Mesh(cgeo(.7, .7, 1.2, 14), mat("#8a8f98")); tank.position.set(-w / 4, h + .6, 0); g.add(tank); box(g, 1.1, .6, .8, "#c9ccd1", w / 4, h, 0); const ant = new THREE.Mesh(cgeo(.03, .03, 2.4, 4), mat("#444")); ant.position.set(w / 3, h + 1.2, -d / 4); g.add(ant);
  return g;
}
function shopRow(x0, z, count) {
  const names = ["PIZZA", "BOOKS", "PHARMACY", "DELI", "FLOWERS", "GYM", "SUSHI", "BAKERY"], cols = ["#c0392b", "#2c3e50", "#16a085", "#8e44ad", "#d35400", "#2980b9"];
  for (let i = 0; i < count; i++) { const x = x0 + i * 7.2, c = pick(cols); const g = group(x, z, Math.PI); box(g, 7, 4, 3, "#d8cfc0", 0, 0, 0);
    const win = new THREE.Mesh(bgeo(5, 2.2, .05), new THREE.MeshStandardMaterial({ color: lin("#f2e6c9"), emissive: lin("#ffd9a0"), emissiveIntensity: .3, roughness: .2 })); win.position.set(0, 1.5, 1.53); g.add(win);
    const aw = box(g, 7, .12, 1.3, c, 0, 2.9, 2.1); aw.rotation.x = .3; const sg = new THREE.Mesh(bgeo(3.4, .6, .06), new THREE.MeshBasicMaterial({ map: textTex([names[i % names.length]], { w: 512, h: 96, bg: c, fg: "#fff", size: 56, top: 48 }) })); sg.material.userData.own = true; sg.position.set(0, 3.5, 1.55); g.add(sg);
    apartmentBlock(x, z, 7, 14, 3, pick(["#b88d74", "#c9b79c", "#a7b6a4", "#8fa3b8"]), Math.PI, "shop" + i).position.y = 4; }
}
function streetBuildings() {
  apartmentBlock(-17, -14.5, 12, 18, 6, "#b88d74", 0, "aptL"); apartmentBlock(17, -14.5, 12, 22, 6, "#a7b6a4", 0, "aptR");
  apartmentBlock(-30, -10, 10, 26, 8, "#c9b79c", 0, "aptLL"); apartmentBlock(30, -10, 10, 16, 8, "#8fa3b8", 0, "aptRR");
  shopRow(-25, 12.6, 8);
}
