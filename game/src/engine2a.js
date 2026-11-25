/* =====================================================================
   3D ENGINE v2 (part A): HD renderer, PBR materials, sky, city, rooms.
   ===================================================================== */
const E = { colliders: [], walls: [], npcs: [], inters: [], anims: [], clickables: [], keys: {}, yaw: 0, pitch: -.05, yawT: 0, zoom: 15, target: null, onArrive: null, t: 0, uiOpen: 0, ok: false, room: { W: 28, D: 22 }, weather: "sun", locked: false, joy: { x: 0, y: 0 }, aim: null };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lin = c => new THREE.Color(c).convertSRGBToLinear();
const MATS = {}, GEOS = {};
const QUALITY = {
  perf: { name: "Performance", lines: 0, shadow: 1024, tex: 256, aniso: 2 },
  hd: { name: "HD 1080p", lines: 1080, shadow: 2048, tex: 512, aniso: 8 },
  ultra: { name: "Ultra 1440p", lines: 1440, shadow: 4096, tex: 1024, aniso: 16 },
  max: { name: "4K", lines: 2160, shadow: 4096, tex: 1024, aniso: 16 }
};
const Q = () => QUALITY[(typeof S !== "undefined" && S.gfx) || "hd"] || QUALITY.hd;
function mat(color, o) {
  const k = color + (o ? JSON.stringify(o) : "");
  if (MATS[k]) return MATS[k];
  o = o || {};
  const m = new THREE.MeshStandardMaterial({ color: lin(color), roughness: o.rough ?? (o.shininess ? clamp(1 - o.shininess / 140, .08, .95) : .72), metalness: o.metal ?? (o.shininess >= 90 ? .35 : 0) });
  if (o.emissive) { m.emissive = lin(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; }
  if (o.transparent) { m.transparent = true; m.opacity = o.opacity ?? .5; }
  return (MATS[k] = m);
}
function basicMat(o) { const m = new THREE.MeshBasicMaterial(Object.assign({}, o)); if (o.color) m.color = lin(o.color); return m; }
function stdMat(o) { const c = o.color; const m = new THREE.MeshStandardMaterial({ map: o.map || null, roughness: o.shininess ? clamp(1 - o.shininess / 140, .05, .95) : .7, metalness: o.shininess >= 120 ? .5 : 0, transparent: !!o.transparent, opacity: o.opacity ?? 1 }); if (c) m.color = lin(c); if (o.emissive) { m.emissive = lin(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; } return m; }
function bgeo(w, h, d) { const k = w + "|" + h + "|" + d; return GEOS[k] || (GEOS[k] = new THREE.BoxGeometry(w, h, d)); }
function sgeo(r, ws = 18, hs = 14, a, b, c, d) { const k = ["s", r, ws, hs, a, b, c, d].join("|"); return GEOS[k] || (GEOS[k] = new THREE.SphereGeometry(r, ws, hs, a, b, c, d)); }
function cgeo(rt, rb, h, seg = 16) { const k = ["c", rt, rb, h, seg].join("|"); return GEOS[k] || (GEOS[k] = new THREE.CylinderGeometry(rt, rb, h, seg)); }
function box(parent, w, h, d, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(bgeo(w, h, d), o.mat || mat(color, o.m));
  m.position.set(x, y + h / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = true;
  parent.add(m); return m;
}
function collider(x, z, w, d) { E.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }); }
function group(x, z, ry = 0, parent = E.world) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); return g; }
function shade(hex, amt) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt, 0, 1)); return "#" + c.getHexString(); }
function canvasTex(w, h, draw, scale = true) {
  const k = scale ? Q().tex / 256 : 1; const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d"); g.scale(k, k); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(Q().aniso, E.maxAniso || 4); return t;
}
function noise(g, w, h, n, a) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } }
function floorTex(kind, color) {
  const t = canvasTex(256, 256, (g, w, h) => {
    if (kind === "marble") { g.fillStyle = "#eef1f5"; g.fillRect(0, 0, w, h); g.fillStyle = "#dde3ea"; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); g.strokeStyle = "rgba(120,130,150,.16)"; g.lineWidth = 1; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(Math.random() * w, 0); g.bezierCurveTo(Math.random() * w, h * .3, Math.random() * w, h * .6, Math.random() * w, h); g.stroke(); } g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 1.2; g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2); }
    else if (kind === "wood") { for (let y = 0; y < h; y += 32) { g.fillStyle = shade(color || "#b98a58", (Math.random() - .5) * .07); g.fillRect(0, y, w, 32); for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(70,40,15,.12)"; g.beginPath(); const yy = y + 4 + Math.random() * 24; g.moveTo(0, yy); g.bezierCurveTo(w * .3, yy + 3, w * .6, yy - 3, w, yy); g.stroke(); } g.fillStyle = "rgba(50,25,8,.4)"; g.fillRect(0, y, w, 1.5); g.fillRect(Math.random() * w, y, 1.5, 32); } }
    else if (kind === "concrete") { g.fillStyle = "#b3b5b0"; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, .06); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(0,0,0,.035)"; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 0, 7); g.fill(); } g.strokeStyle = "rgba(0,0,0,.2)"; g.strokeRect(0, 0, w, h); }
    else if (kind === "ceiling") { g.fillStyle = "#ddd4c6"; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, .03); g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }
    else { const c1 = color || "#555a66", c2 = shade(c1, -.07); [[0, 0, c1], [128, 0, c2], [0, 128, c2], [128, 128, c1]].forEach(([x, y, c]) => { g.fillStyle = shade(c, (Math.random() - .5) * .03); g.fillRect(x, y, 128, 128); }); noise(g, w, h, 14000, .06); for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(0,0,0,.05)"; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + 8, y + (Math.random() - .5) * 8); g.stroke(); } g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = 1.5; for (const v of [0, 128]) { g.strokeRect(v, 0, 128, h); g.strokeRect(0, v, w, 128); } }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function textTex(lines, o = {}) {
  const w = o.w || 512, h = o.h || 256;
  return canvasTex(w, h, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, o.bg || "#123a6b"); grd.addColorStop(1, o.bg2 || shade(o.bg || "#123a6b", -.12)); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    if (o.draw) o.draw(g, w, h);
    g.fillStyle = o.fg || "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((l, i) => { g.font = `${i === 0 ? "bold " : ""}${i === 0 ? (o.size || 52) : (o.size2 || 30)}px Ubuntu, Trebuchet MS, sans-serif`; g.fillText(l, w / 2, (o.top || h / (lines.length + 1)) * (i + 1)); });
  });
}
function screenTex(kind, color) {
  const k = kind.toUpperCase();
  return textTex([k], { bg: "#0d1b2e", fg: "#e9f3ff", size: 40, top: 40, draw: (g, w, h) => {
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 4;
    if (/MAP/.test(k)) { g.fillStyle = "#24476e"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(60 + Math.random() * 390, 110 + Math.random() * 110, 30 + Math.random() * 40, 16 + Math.random() * 20, 0, 0, 7); g.fill(); } g.fillStyle = "#ff4d4d"; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(40 + Math.random() * 430, 100 + Math.random() * 130, 5, 0, 7); g.fill(); } }
    else if (/SALES|DASHBOARD|CASH|GOALS/.test(k)) { for (let i = 0; i < 8; i++) { const bh = 30 + Math.random() * 120; g.fillStyle = i % 2 ? color : shade(color, .2); g.fillRect(50 + i * 52, 230 - bh, 34, bh); } g.beginPath(); g.moveTo(40, 200); for (let i = 0; i < 9; i++) g.lineTo(40 + i * 54, 200 - i * 12 - Math.random() * 20); g.strokeStyle = "#ffd23f"; g.stroke(); }
    else if (/QUEUE/.test(k)) { g.font = "bold 110px Ubuntu, sans-serif"; g.textAlign = "center"; g.fillStyle = "#ffd23f"; g.fillText(String(3 + Math.floor(Math.random() * 9)), w / 2, 170); }
    else { for (let i = 0; i < 7; i++) { g.fillStyle = i === 3 ? "#ffd23f" : "#4fd27a"; g.fillRect(50, 85 + i * 22, 30 + Math.random() * 380, 12); } }
  } });
}
const UI_TEX = {};
function screenUI(color) {
  if (UI_TEX[color]) return UI_TEX[color];
  const t = canvasTex(256, 144, (g, w, h) => {
    g.fillStyle = "#eef3f8"; g.fillRect(0, 0, w, h); g.fillStyle = color; g.fillRect(0, 0, w, 16); g.fillStyle = "#fff"; g.fillRect(6, 5, 40, 6);
    g.fillStyle = "#dfe7ef"; g.fillRect(0, 16, 54, h); for (let i = 0; i < 6; i++) { g.fillStyle = i === 1 ? color : "#b8c6d4"; g.fillRect(6, 24 + i * 16, 40, 7); }
    for (let i = 0; i < 7; i++) { g.fillStyle = "#c6d2de"; g.fillRect(64, 26 + i * 15, 60 + Math.random() * 120, 6); }
    g.fillStyle = shade(color, .25); g.fillRect(190, 100, 54, 30);
  });
  return (UI_TEX[color] = new THREE.MeshBasicMaterial({ map: t }));
}

/* ---------- renderer ---------- */
function initEngine() {
  const canvas = $("#stage");
  try { E.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { E.ok = false; return false; }
  E.maxAniso = E.renderer.capabilities.getMaxAnisotropy();
  E.renderer.outputEncoding = THREE.sRGBEncoding; E.renderer.toneMapping = THREE.ACESFilmicToneMapping; E.renderer.toneMappingExposure = .88;
  E.renderer.shadowMap.enabled = true; E.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  E.scene = new THREE.Scene(); E.scene.fog = new THREE.Fog("#cfe6f7", 70, 190);
  E.camera = new THREE.PerspectiveCamera(70, 1, .05, 400);
  E.hemi = new THREE.HemisphereLight(0xffe4c2, 0x3b3029, .5); E.scene.add(E.hemi);
  E.sun = new THREE.DirectionalLight(0xffffff, 1.6); E.sun.castShadow = true;
  Object.assign(E.sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 }); E.sun.shadow.bias = -.0004; E.sun.shadow.normalBias = .02;
  E.scene.add(E.sun); E.scene.add(E.sun.target);
  applyQuality();
  // soft studio environment for reflections
  try {
    const env = new THREE.Scene(); const room = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: 0x5f6873, side: THREE.BackSide })); env.add(room);
    [[0, 4.9, 0, 12, .1, 12, 0xd8dde3], [-9.9, 2, 0, .1, 4, 10, 0xb9c9db], [9.9, 2, 0, .1, 4, 10, 0xd9cdb9]].forEach(([x, y, z, w, h, d, c]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); p.position.set(x, y, z); env.add(p); });
    const pm = new THREE.PMREMGenerator(E.renderer); E.scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
  } catch (e) {}
  // sky dome
  E.skyMat = new THREE.ShaderMaterial({ uniforms: { top: { value: new THREE.Color("#5ea9ea") }, bottom: { value: new THREE.Color("#d8ecfa") } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP - cameraPosition).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-.05, .55, h)), 1.); }" });
  E.sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), E.skyMat); E.sky.renderOrder = -1; E.scene.add(E.sky);
  E.world = new THREE.Group(); E.scene.add(E.world); E.scene.add(E.camera);
  E.ray = new THREE.Raycaster();
  E.ring = new THREE.Mesh(new THREE.RingGeometry(.25, .38, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: .9, side: THREE.DoubleSide }));
  E.ring.rotation.x = -Math.PI / 2; E.ring.visible = false; E.scene.add(E.ring);
  window.addEventListener("resize", resize); resize(); setupInput();
  E.ok = true; E.last = performance.now(); requestAnimationFrame(loop);
  return true;
}
function applyQuality() { if (!E.sun) return; const q = Q(); E.sun.shadow.mapSize.set(q.shadow, q.shadow); if (E.sun.shadow.map) { E.sun.shadow.map.dispose(); E.sun.shadow.map = null; } resize(); if (typeof setupPost === "function") setupPost(); }
function resize() {
  if (!E.renderer) return; const w = window.innerWidth, h = window.innerHeight, q = Q(), dpr = window.devicePixelRatio || 1;
  const pr = q.lines ? clamp(Math.max(dpr, q.lines / h), 1, 3) : Math.min(dpr, 1.25);
  E.renderer.setPixelRatio(pr); E.renderer.setSize(w, h, false); E.camera.aspect = w / h;
  E.camera.fov = w / h < .8 ? 76 : 64; E.camera.updateProjectionMatrix();
  E.res = `${Math.round(w * pr)}×${Math.round(h * pr)}`;
  if (typeof postResize === "function") postResize();
}
function setLighting(hour, weather) {
  const k = clamp((hour - 6) / 14, 0, 1), ang = Math.PI * k;
  const rain = weather === "rain", cloud = weather === "cloud", night = hour >= 20, dusk = hour >= 18 && !night;
  E.sunDir = V3(Math.cos(ang) * 22, 7 + Math.sin(ang) * 20, 8);
  const warm = new THREE.Color("#ff9a4a"), noon = new THREE.Color("#ffe8c8"), moon = new THREE.Color("#7f92c8");
  const c = night ? moon : warm.clone().lerp(noon, Math.sin(ang) * .55);
  E.sun.color.copy(c); E.sun.intensity = (night ? .3 : 1.45) * (rain ? .4 : cloud ? .65 : 1);
  const top = night ? "#0c1630" : dusk ? "#4a6fb5" : rain ? "#6f7d8e" : cloud ? "#93a6ba" : "#3f8fdc";
  const bot = night ? "#26324f" : dusk ? "#f6a96b" : rain ? "#a8b3bf" : cloud ? "#cfd8e1" : "#d9eefc";
  E.skyMat.uniforms.top.value.set(top); E.skyMat.uniforms.bottom.value.set(bot); E.scene.fog.color.set(bot);
  E.hemi.intensity = (night ? .16 : .3) * (rain ? .85 : 1); (E.lamps || []).forEach(l => l.intensity = night ? 1.1 : .85);
  E.scene.environment && (E.envLevel = night ? .35 : .8);
  (E.cityMats || []).forEach(m => m.emissiveIntensity = night ? 1.2 : dusk ? .5 : 0);
  if (E.beamMat) E.beamMat.opacity = night || rain ? 0 : (cloud ? .03 : .085) * (1 - Math.abs(k - .5) * .6);
  (E.ceilLights || []).forEach(m => m.color.copy(lin(night ? "#ffe9b8" : "#e4ebf2")));
  E.weather = weather;
}

/* ---------- world management ---------- */
function clearWorld() {
  while (E.world.children.length) E.world.remove(E.world.children[0]);
  E.npcs.forEach(n => n.label && n.label.remove()); E.inters.forEach(i => i.label && i.label.remove());
  E.colliders = []; E.walls = []; E.npcs = []; E.inters = []; E.anims = []; E.clickables = []; E.target = null; E.onArrive = null; E.ring.visible = false; E.rain = null; E.cityMats = []; E.ceilLights = [];
}
function buildOutside(elev, dim) {
  const out = new THREE.Group(); out.position.y = -elev; E.world.add(out);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(dim ? "#4b5a4a" : "#6f9a4f", { rough: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.06; ground.receiveShadow = true; out.add(ground);
  const road = mat("#4a4d52", { rough: .9 }), walk = mat("#bdbab2", { rough: .9 });
  [[0, 34, 600, 9], [0, -34, 600, 9], [34, 0, 9, 600], [-34, 0, 9, 600]].forEach(([x, z, w, d]) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), road); r.rotation.x = -Math.PI / 2; r.position.set(x, -.03, z); out.add(r); });
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), walk); pad.rotation.x = -Math.PI / 2; pad.position.y = -.04; out.add(pad);
  const r = seeded("city"); const variants = ["#8fa3b8", "#c9b79c", "#a7b6a4", "#d7d2c8", "#7d8a99", "#b88d74"].map((col, i) => {
    const map = canvasTex(128, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let y = 8; y < h - 4; y += 16) for (let x = 6; x < w - 4; x += 14) { g.fillStyle = "#2d4058"; g.fillRect(x, y, 9, 10); g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(x, y, 9, 3); } });
    const em = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); for (let y = 8; y < h - 4; y += 16) for (let x = 6; x < w - 4; x += 14) if (Math.random() < .45) { g.fillStyle = Math.random() < .8 ? "#ffd98a" : "#cfe8ff"; g.fillRect(x, y, 9, 10); } });
    map.wrapS = map.wrapT = em.wrapS = em.wrapT = THREE.RepeatWrapping;
    const m = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: new THREE.Color(1, .92, .75), emissiveIntensity: 0, roughness: .6, metalness: .1 }); E.cityMats.push(m); return m;
  });
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, rad = 46 + r() * 110, w = 8 + r() * 14, d = 8 + r() * 14, h = 10 + r() * (rad < 80 ? 70 : 110);
    const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 9, uv.getY(k) * h / 18);
    const b = new THREE.Mesh(geo, variants[i % variants.length]); b.position.set(Math.cos(a) * rad, h / 2, Math.sin(a) * rad); b.rotation.y = r() * .3; out.add(b);
  }
  const trunk = mat("#6b4a32"), leaf = mat("#3f8a3a", { rough: .9 });
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, rad = 24 + (i % 3) * 2.5; const tg = new THREE.Group(); tg.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); const t = new THREE.Mesh(cgeo(.18, .24, 2.2, 8), trunk); t.position.y = 1.1; tg.add(t); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), leaf); f.position.y = 3; f.castShadow = true; tg.add(f); out.add(tg); }
}
function wallSeg(g, len, H, T, color, windows) {
  const wm = S.gfx !== "perf" && typeof richWallMat === "function" ? richWallMat(color) : mat(color, { rough: .92 });
  if (!windows) { box(g, len, H, T, color, 0, 0, 0, { mat: wm }); return; }
  const ww = 2.6, ps = []; for (let p = -len / 2 + 2.4; p < len / 2 - 1.6; p += 3.6) ps.push(p);
  const wb = .55, wt = Math.min(H - .3, 2.9), wh = wt - wb;
  box(g, len, wb, T, color, 0, 0, 0, { mat: wm }); box(g, len, H - wt, T, color, 0, wt, 0, { mat: wm });
  let x0 = -len / 2;
  for (const p of ps) {
    const a = p - ww / 2; if (a > x0) box(g, a - x0, wh, T, color, (x0 + a) / 2, wb, 0, { mat: wm });
    const glass = new THREE.Mesh(bgeo(ww, wh, .03), E.windowMat); glass.position.set(p, wb + wh / 2, 0); g.add(glass);
    box(g, ww + .1, .06, T + .08, "#e9edf1", p, wb - .03, 0, { cast: false, m: { rough: .4 } }); box(g, .06, wh, .05, "#e9edf1", p, wb, 0, { cast: false });
    if (E.beamMat) { const bm = new THREE.Mesh(new THREE.PlaneGeometry(ww * .95, 4.2), E.beamMat); bm.position.set(p, 1.35, T / 2 + 1.45); bm.rotation.x = -.72; bm.renderOrder = 2; g.add(bm); }
    if (E.blinds) { const sm = mat("#e8dcc4", { rough: .6 }); for (let y = wt - .95; y < wt - .05; y += .1) { const sl = new THREE.Mesh(bgeo(ww, .012, .07), sm); sl.position.set(p, y, T / 2 + .06); sl.rotation.x = .75; sl.castShadow = true; g.add(sl); } box(g, ww + .1, .08, .1, "#d9cdb6", p, wt - .08, T / 2 + .06, { cast: false }); }
    x0 = p + ww / 2;
  }
  if (len / 2 > x0) box(g, len / 2 - x0, 1.7, T, color, (x0 + len / 2) / 2, 1.0, 0, { mat: wm });
}
function buildRoom(W, D, floorKind, floorColor, wallColor, o = {}) {
  E.room = { W, D }; const H = o.high ? 6 : 3.2, T = .3; E.room.H = H; E.blinds = o.blinds !== false;
  if (!E.beamTex) E.beamTex = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(.2, "rgba(0,0,0,0)"); gx.addColorStop(.8, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); }, false);
  E.beamMat = new THREE.MeshBasicMaterial({ color: lin("#ffc98a"), map: E.beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const ft = floorTex(floorKind, floorColor); const rep = floorKind === "marble" ? 4 : floorKind === "carpet" ? 1.7 : 3; ft.repeat.set(W / rep, D / rep);
  const fm = (S.gfx !== "perf" && typeof richFloorMat === "function" && richFloorMat(floorKind, floorColor, W, D)) || new THREE.MeshStandardMaterial({ map: ft, roughness: { marble: .18, wood: .5, concrete: .85 }[floorKind] ?? .95, metalness: 0 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), fm); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.userData.floor = true; E.world.add(fl); E.clickables.push(fl); E.floor = fl;
  const ct = floorTex("ceiling"); ct.repeat.set(W / 4, D / 4);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ct, roughness: .95 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; E.world.add(ceil); E.ceil = ceil;
  const lm = new THREE.MeshBasicMaterial({ color: lin("#fff1d6") }); E.ceilLights.push(lm); const housing = mat("#8f8a80", { rough: .5, metal: .3 });
  for (let x = -W / 2 + 4; x <= W / 2 - 3.5; x += 6) for (let z = -D / 2 + 2.5; z <= D / 2 - 2; z += 3.4) { const hs = new THREE.Mesh(bgeo(3.6, .07, .34), housing); hs.position.set(x, H - .035, z); E.world.add(hs); const l = new THREE.Mesh(bgeo(3.4, .02, .22), lm); l.position.set(x, H - .075, z); E.world.add(l); }
  E.lamps = [];
  if (!o.noLamps) for (const x of [-W / 4, W / 4]) for (const z of [-D / 4, D / 5]) { const pl = new THREE.PointLight(0xffd9a6, .55, 16, 2); pl.position.set(x, H - .4, z); E.world.add(pl); E.lamps.push(pl); }
  E.windowMat = new THREE.MeshStandardMaterial({ color: lin("#bfe0ff"), transparent: true, opacity: .22, roughness: .05, metalness: .2, depthWrite: false });
  const mk = (x, z, len, rotY, normal, windows) => { const g = group(x, z, rotY); wallSeg(g, len, H, T, wallColor, windows); box(g, len, .12, T + .04, shade(wallColor, -.25), 0, 0, 0, { cast: false }); E.walls.push({ g, normal, h: 1 }); };
  mk(0, -D / 2, W + T, 0, V3(0, 0, -1), false);
  mk(0, D / 2, W + T, Math.PI, V3(0, 0, 1), o.southWindows);
  mk(-W / 2, 0, D, Math.PI / 2, V3(-1, 0, 0), true);
  mk(W / 2, 0, D, -Math.PI / 2, V3(1, 0, 0), true);
  collider(0, -D / 2, W + 2, T * 2); collider(0, D / 2, W + 2, T * 2); collider(-W / 2, 0, T * 2, D + 2); collider(W / 2, 0, T * 2, D + 2);
  buildOutside(o.elev || 0, o.dim);
  if (E.weather === "rain") {
    const n = 900, pos = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, rr = Math.max(W, D) / 2 + 1 + Math.random() * 14; const x = Math.cos(a) * rr, y = Math.random() * 10 - 2, z = Math.sin(a) * rr; pos.set([x, y, z, x, y - .6, z], i * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xdfe9f5, transparent: true, opacity: .5 })); E.world.add(ln); E.rain = ln;
  }
}
function elevator(z) {
  const g = group(0, z + .2); const steel = { rough: .25, metal: .8 };
  box(g, 3, 3, .4, "#b8c1ca", 0, 0, 0, { m: steel });
  box(g, 2.3, 2.6, .3, "#222831", 0, 0, .08);
  const L = box(g, 1.1, 2.5, .08, "#d5dce3", -.56, 0, .26, { m: { rough: .18, metal: .9 } });
  const R = box(g, 1.1, 2.5, .08, "#d5dce3", .56, 0, .26, { m: { rough: .18, metal: .9 } });
  box(g, .5, .18, .06, "#ffd23f", 0, 2.68, .24, { m: { emissive: "#ffb000", emissiveIntensity: 1.5 } });
  box(g, .14, .3, .06, "#5d6873", 1.3, 1.1, .24); box(g, .07, .07, .04, "#7dff9a", 1.3, 1.28, .28, { m: { emissive: "#3cff7a", emissiveIntensity: 1.5 } });
  E.elev = { L, R, open: 0 };
  E.anims.push(dt => { const p = Player.mesh ? Player.mesh.position : V3(0, 0, 99); const want = (p.distanceTo(V3(0, 0, z + 1)) < 3.2 || E.elevOpenUntil > E.t) ? 1 : 0; E.elev.open += (want - E.elev.open) * Math.min(1, dt * 4); L.position.x = -.56 - E.elev.open * .95; R.position.x = .56 + E.elev.open * .95; });
  return g;
}
