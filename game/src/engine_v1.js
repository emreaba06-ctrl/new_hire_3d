/* =====================================================================
   3D ENGINE: renderer, rooms, props, people, camera, input.
   ===================================================================== */
const E = { colliders: [], walls: [], npcs: [], inters: [], anims: [], clickables: [], keys: {}, yaw: 0, yawT: 0, zoom: 15, target: null, onArrive: null, t: 0, uiOpen: 0, ok: false, room: { W: 28, D: 22 }, weather: "sun" };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MATS = {}, GEOS = {};
function mat(color, o) { const k = color + (o ? JSON.stringify(o) : ""); return MATS[k] || (MATS[k] = new THREE.MeshPhongMaterial(Object.assign({ color, shininess: 28, specular: 0x1e1e1e }, o || {}))); }
function bgeo(w, h, d) { const k = w + "|" + h + "|" + d; return GEOS[k] || (GEOS[k] = new THREE.BoxGeometry(w, h, d)); }
function box(parent, w, h, d, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(bgeo(w, h, d), o.mat || mat(color, o.m));
  m.position.set(x, y + h / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = true;
  parent.add(m); return m;
}
function collider(x, z, w, d) { E.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }); }
function group(x, z, ry = 0, parent = E.world) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); return g; }
function shade(hex, amt) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt, 0, 1)); return "#" + c.getHexString(); }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
function noise(g, w, h, n, a) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
function floorTex(kind, color) {
  const t = canvasTex(256, 256, (g, w, h) => {
    if (kind === "marble") { g.fillStyle = "#eef1f5"; g.fillRect(0, 0, w, h); g.fillStyle = "#d9dfe7"; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); g.strokeStyle = "rgba(120,130,150,.18)"; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * w, 0); g.bezierCurveTo(Math.random() * w, h * .3, Math.random() * w, h * .6, Math.random() * w, h); g.stroke(); } g.strokeStyle = "rgba(0,0,0,.12)"; g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2); }
    else if (kind === "wood") { for (let y = 0; y < h; y += 32) { g.fillStyle = shade(color || "#b98a58", (Math.random() - .5) * .08); g.fillRect(0, y, w, 32); g.fillStyle = "rgba(60,30,10,.35)"; g.fillRect(0, y, w, 2); const off = Math.random() * w; g.fillRect(off, y, 2, 32); } noise(g, w, h, 1500, .05); }
    else if (kind === "concrete") { g.fillStyle = "#aeb0ab"; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, .07); for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(0,0,0,.04)"; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 0, 7); g.fill(); } g.strokeStyle = "rgba(0,0,0,.2)"; g.strokeRect(0, 0, w, h); }
    else { g.fillStyle = color || "#6b88aa"; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, .08); g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }
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

/* ---------- renderer ---------- */
function initEngine() {
  const canvas = $("#stage");
  try { E.renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { E.ok = false; return false; }
  E.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  E.renderer.shadowMap.enabled = true; E.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  E.scene = new THREE.Scene(); E.scene.background = new THREE.Color("#a9d4f5"); E.scene.fog = new THREE.Fog("#a9d4f5", 40, 90);
  E.camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
  E.hemi = new THREE.HemisphereLight(0xffffff, 0x9aa7b8, .78); E.scene.add(E.hemi);
  E.sun = new THREE.DirectionalLight(0xffffff, .62); E.sun.castShadow = true; E.sun.shadow.mapSize.set(2048, 2048);
  Object.assign(E.sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 }); E.sun.shadow.bias = -.0006;
  E.scene.add(E.sun); E.scene.add(E.sun.target);
  E.world = new THREE.Group(); E.scene.add(E.world);
  E.ray = new THREE.Raycaster();
  E.ring = new THREE.Mesh(new THREE.RingGeometry(.25, .38, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: .9, side: THREE.DoubleSide }));
  E.ring.rotation.x = -Math.PI / 2; E.ring.visible = false; E.scene.add(E.ring);
  window.addEventListener("resize", resize); resize(); setupInput();
  E.ok = true; E.last = performance.now(); requestAnimationFrame(loop);
  return true;
}
function resize() { const w = window.innerWidth, h = window.innerHeight; const nz = w / h < .8 ? 22 : 16; if (E.zoomAuto !== nz) { E.zoom = nz; E.zoomAuto = nz; } E.renderer.setSize(w, h, false); E.camera.aspect = w / h; E.camera.updateProjectionMatrix(); }
function setLighting(hour, weather) {
  // hour 6..22. Sun arcs east to west; warm at the ends of the day.
  const k = clamp((hour - 6) / 14, 0, 1), ang = Math.PI * k;
  const rain = weather === "rain", cloud = weather === "cloud";
  E.sunDir = V3(Math.cos(ang) * 18, 6 + Math.sin(ang) * 18, 10);
  const warm = new THREE.Color("#ffb070"), noon = new THREE.Color("#fffaf0"), night = new THREE.Color("#5a6fa8");
  let c; if (hour >= 19) c = night.clone().lerp(warm, clamp((21 - hour) / 2, 0, 1)); else c = warm.clone().lerp(noon, Math.sin(ang));
  E.sun.color.copy(c); E.sun.intensity = (hour >= 20 ? .2 : .62) * (rain ? .45 : cloud ? .7 : 1);
  const sky = hour >= 20 ? new THREE.Color("#1d2b4f") : hour >= 18 ? new THREE.Color("#f2a46b") : rain ? new THREE.Color("#8b98a8") : cloud ? new THREE.Color("#b8c7d6") : new THREE.Color("#a9d4f5");
  E.scene.background.copy(sky); E.scene.fog.color.copy(sky);
  E.hemi.intensity = (hour >= 20 ? .55 : .78) * (rain ? .8 : 1);
  E.windowMat && E.windowMat.color.copy(sky.clone().lerp(new THREE.Color("#ffffff"), .25));
  E.weather = weather;
}

/* ---------- world management ---------- */
function clearWorld() {
  E.world.traverse(o => { if (o.material && o.material.map && o.material.userData.own) o.material.map.dispose(); });
  while (E.world.children.length) E.world.remove(E.world.children[0]);
  E.npcs.forEach(n => n.label && n.label.remove()); E.inters.forEach(i => i.label && i.label.remove());
  E.colliders = []; E.walls = []; E.npcs = []; E.inters = []; E.anims = []; E.clickables = []; E.target = null; E.onArrive = null; E.ring.visible = false; E.rain = null;
}
function buildRoom(W, D, floorKind, floorColor, wallColor, o = {}) {
  E.room = { W, D };
  const ft = floorTex(floorKind, floorColor); ft.repeat.set(W / (floorKind === "marble" ? 4 : 3), D / (floorKind === "marble" ? 4 : 3));
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshPhongMaterial({ map: ft, shininess: floorKind === "marble" ? 70 : 8, specular: floorKind === "marble" ? 0x555555 : 0x111111 }));
  fl.material.userData.own = true; fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.userData.floor = true; E.world.add(fl); E.clickables.push(fl); E.floor = fl;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(o.dim ? "#3c4a5c" : "#8fb06a")); ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; E.world.add(ground);
  E.windowMat = new THREE.MeshPhongMaterial({ color: "#cfe9ff", emissive: "#4a6a8a", emissiveIntensity: .35, shininess: 90, specular: 0xffffff });
  const H = 3.2, T = .3;
  const mk = (x, z, len, rotY, normal, windows) => {
    const g = group(x, z, rotY); box(g, len, H, T, wallColor, 0, 0, 0);
    box(g, len, .14, T + .04, shade(wallColor, -.25), 0, 0, 0, { cast: false });
    if (windows) for (let p = -len / 2 + 2.4; p < len / 2 - 1.6; p += 3.6) { const wp = new THREE.Mesh(bgeo(2.4, 1.5, .06), E.windowMat); wp.position.set(p, 1.85, -T / 2 - .01); g.add(wp); box(g, 2.6, .1, .12, "#f4f6f8", p, 1.05, -T / 2 - .03, { cast: false }); }
    E.walls.push({ g, normal: normal, h: 1 });
  };
  mk(0, -D / 2, W + T, 0, V3(0, 0, -1), false);
  mk(0, D / 2, W + T, Math.PI, V3(0, 0, 1), o.southWindows);
  mk(-W / 2, 0, D, Math.PI / 2, V3(-1, 0, 0), true);
  mk(W / 2, 0, D, -Math.PI / 2, V3(1, 0, 0), true);
  collider(0, -D / 2, W + 2, T * 2); collider(0, D / 2, W + 2, T * 2); collider(-W / 2, 0, T * 2, D + 2); collider(W / 2, 0, T * 2, D + 2);
  // rain outside the windows
  if (E.weather === "rain") {
    const n = 500, pos = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; const x = side * (W / 2 + 1 + Math.random() * 8), y = Math.random() * 8, z = (Math.random() - .5) * (D + 10); pos.set([x, y, z, x, y - .5, z], i * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xd8e6f5, transparent: true, opacity: .55 })); E.world.add(ln); E.rain = ln;
  }
}
function elevator(z) {
  const g = group(0, z + .2);
  box(g, 3, 3, .4, "#a8b2bd", 0, 0, 0, { m: { shininess: 90, specular: 0x888888 } });
  box(g, 2.3, 2.6, .3, "#222831", 0, 0, .08);
  const L = box(g, 1.1, 2.5, .08, "#c9d2db", -.56, 0, .26, { m: { shininess: 120, specular: 0xaaaaaa } });
  const R = box(g, 1.1, 2.5, .08, "#c9d2db", .56, 0, .26, { m: { shininess: 120, specular: 0xaaaaaa } });
  const lamp = box(g, .5, .18, .06, "#ffd23f", 0, 2.68, .24, { m: { emissive: "#ffb000", emissiveIntensity: .8 } });
  box(g, .14, .3, .06, "#5d6873", 1.3, 1.1, .24); box(g, .07, .07, .04, "#7dff9a", 1.3, 1.28, .28, { m: { emissive: "#3cff7a", emissiveIntensity: .8 } });
  E.elev = { L, R, open: 0 };
  E.anims.push(dt => { const p = Player.mesh ? Player.mesh.position : V3(0, 0, 99); const want = (p.distanceTo(V3(0, 0, z + 1)) < 3.2 || E.elevOpenUntil > E.t) ? 1 : 0; E.elev.open += (want - E.elev.open) * Math.min(1, dt * 4); L.position.x = -.56 - E.elev.open * .95; R.position.x = .56 + E.elev.open * .95; });
  return g;
}

/* ---------- props ---------- */
const PROP = {
  desk(x, z, ry = 0, o = {}) {
    const g = group(x, z, ry);
    box(g, 1.7, .08, .85, o.top || "#e9e2d4", 0, .72, 0); box(g, .06, .72, .8, "#7d8794", -.8, 0, 0); box(g, .06, .72, .8, "#7d8794", .8, 0, 0); box(g, 1.6, .4, .04, "#9aa4b0", 0, .3, .38);
    box(g, .08, .22, .08, "#333", 0, .8, .2); box(g, .3, .02, .2, "#333", 0, .8, .2);
    box(g, .78, .46, .05, "#20252c", 0, 1.0, .22);
    const scr = new THREE.Mesh(bgeo(.7, .38, .01), new THREE.MeshBasicMaterial({ color: o.screen || "#5fa8ff" })); scr.position.set(0, 1.23, .19); g.add(scr);
    box(g, .5, .03, .16, "#3a3f47", 0, .8, -.12);
    if (!o.noChair) { const c = group(0, -.78, 0, g); box(c, .52, .1, .5, o.chair || "#2f4a6d", 0, .42, 0); box(c, .52, .62, .1, o.chair || "#2f4a6d", 0, .5, -.24); box(c, .08, .4, .08, "#555", 0, 0, 0); }
    if (o.phone) { o.phoneMesh = box(g, .22, .08, .16, "#2b2f36", -.55, .8, .05); }
    const w = Math.abs(Math.sin(ry)) > .7; collider(x, z, w ? .95 : 1.75, w ? 1.75 : .95);
    const seat = new THREE.Vector3(0, 0, -.78).applyAxisAngle(V3(0, 1, 0), ry).add(V3(x, 0, z));
    return { g, seat, ry, screen: scr };
  },
  server(x, z, ry = 0) {
    const g = group(x, z, ry); box(g, .9, 2.3, .9, "#1f242c", 0, 0, 0, { m: { shininess: 60 } });
    for (let r = 0; r < 7; r++) { box(g, .8, .02, .02, "#3b424d", 0, .3 + r * .28, .46, { cast: false });
      for (let c = 0; c < 4; c++) { const led = box(g, .04, .04, .02, "#3cff7a", -.3 + c * .08, .38 + r * .28, .47, { cast: false, mat: new THREE.MeshBasicMaterial({ color: Math.random() < .2 ? "#ffb000" : "#3cff7a" }) }); E.anims.push(() => { led.visible = Math.sin(E.t * (3 + c) + r * 7 + x) > -.6; }); } }
    collider(x, z, .95, .95);
  },
  screen(x, z, ry, label, color, w = 4, h = 2.2) {
    const g = group(x, z, ry); box(g, w + .2, h + .2, .12, "#20252c", 0, 1.1, 0);
    const m = new THREE.Mesh(bgeo(w, h, .02), new THREE.MeshBasicMaterial({ map: screenTex(label, color) })); m.material.userData.own = true; m.position.set(0, 1.2 + h / 2, .07); g.add(m);
  },
  board(x, z, ry, lines, o = {}) {
    const g = group(x, z, ry); box(g, (o.w || 3) + .16, (o.h || 1.6) + .16, .08, o.frame || "#9aa4b0", 0, 1.2, 0);
    const m = new THREE.Mesh(bgeo(o.w || 3, o.h || 1.6, .02), new THREE.MeshPhongMaterial({ map: textTex(lines, { bg: o.bg || "#ffffff", bg2: o.bg || "#f2f4f7", fg: o.fg || "#25456b", size: o.size || 44, size2: 26 }) }));
    m.material.userData.own = true; m.position.set(0, 1.28 + (o.h || 1.6) / 2, .05); g.add(m); return g;
  },
  plant(x, z, s = 1) { const g = group(x, z); box(g, .5 * s, .5 * s, .5 * s, "#c2683a", 0, 0, 0); const leaf = mat("#3f9a3a", { shininess: 10 });
    [[0, .9, 0, .45], [.2, .7, .1, .32], [-.18, .75, -.1, .3]].forEach(([a, b, c, r]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), leaf); m.position.set(a * s, b * s, c * s); m.castShadow = true; g.add(m); });
    collider(x, z, .55 * s, .55 * s); },
  sofa(x, z, ry, color = "#4a6fa5", len = 2.2) { const g = group(x, z, ry); box(g, len, .42, .9, color, 0, 0, 0); box(g, len, .5, .22, shade(color, -.08), 0, .42, -.34); box(g, .2, .32, .9, shade(color, -.08), -len / 2 + .1, .42, 0); box(g, .2, .32, .9, shade(color, -.08), len / 2 - .1, .42, 0);
    const w = Math.abs(Math.sin(ry)) > .7; collider(x, z, w ? .95 : len, w ? len : .95); return g; },
  cabinet(x, z, ry = 0) { const g = group(x, z, ry); box(g, .6, 1.3, .65, "#8c96a3", 0, 0, 0); for (let i = 0; i < 3; i++) box(g, .5, .02, .02, "#5f6874", 0, .3 + i * .4, .33, { cast: false }); collider(x, z, .65, .7); },
  shelf(x, z, ry, len) { const g = group(x, z, ry);
    for (let p = -len / 2; p <= len / 2 + .01; p += len / Math.round(len / 2.4)) box(g, .1, 3, .1, "#e8742a", p, 0, -.45), box(g, .1, 3, .1, "#e8742a", p, 0, .45);
    for (let lv = 0; lv < 3; lv++) { box(g, len, .08, 1, "#2f6fb5", 0, .25 + lv * 1, 0); for (let p = -len / 2 + .5; p < len / 2 - .3; p += .75) if (Math.random() < .8) { const s = .4 + Math.random() * .25; box(g, s, s, s * 1.2, pick(["#c9a06a", "#b88b52", "#d8b47c", "#a7794a"]), p, .33 + lv * 1, (Math.random() - .5) * .3); } }
    const w = Math.abs(Math.sin(ry)) > .7; collider(x, z, w ? 1.1 : len, w ? len : 1.1); },
  pallet(x, z, ry = 0) { const g = group(x, z, ry); box(g, 1.2, .15, 1, "#b48a5a", 0, 0, 0); const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) box(g, 1, .45, .8, pick(["#c9a06a", "#b88b52"]), 0, .15 + i * .45, 0); collider(x, z, 1.25, 1.05); },
  forklift(x, z, ry = 0) { const g = group(x, z, ry); box(g, 1.1, .8, 1.6, "#f2c41c", 0, .2, 0, { m: { shininess: 80 } }); box(g, 1, .08, 1, "#333", 0, 2, -.1);
    for (const a of [-.45, .45]) for (const b of [-.55, .35]) box(g, .08, 1.8, .08, "#333", a, .4, b);
    box(g, .9, 2.2, .1, "#555", 0, .1, .85); box(g, .12, .06, 1.1, "#777", -.3, .15, 1.4); box(g, .12, .06, 1.1, "#777", .3, .15, 1.4);
    for (const a of [-.55, .55]) for (const b of [-.5, .5]) box(g, .2, .45, .45, "#1d1d1d", a, 0, b);
    collider(x, z, 1.6, 2.6); },
  truck(x, z, ry = 0) { const g = group(x, z, ry); box(g, 2.3, 2.6, 6.5, "#f4f6f8", 0, .7, -1); box(g, 2.3, 2.2, 2, "#c0392b", 0, .5, 3.4, { m: { shininess: 80 } }); box(g, 2.1, .8, .06, "#bfe3ff", 0, 1.8, 4.42, { mat: E.windowMat });
    for (const zz of [-3.4, -2.2, 3.4]) for (const xx of [-1.1, 1.1]) box(g, .3, .9, .9, "#1d1d1d", xx, 0, zz);
    const w = Math.abs(Math.sin(ry)) > .7; collider(x, z, w ? 9 : 2.5, w ? 2.5 : 9); },
  table(x, z, ry = 0, len = 3, chairs = 6, color = "#8a5a3b") { const g = group(x, z, ry); box(g, len, .08, 1.3, color, 0, .72, 0, { m: { shininess: 70 } }); box(g, .2, .72, .2, "#555", -len / 2 + .4, 0, 0); box(g, .2, .72, .2, "#555", len / 2 - .4, 0, 0);
    for (let i = 0; i < chairs / 2; i++) { const px = -len / 2 + .5 + i * (len - 1) / Math.max(1, chairs / 2 - 1); box(g, .45, .45, .45, "#2f4a6d", px, 0, -.95); box(g, .45, .45, .45, "#2f4a6d", px, 0, .95); }
    const w = Math.abs(Math.sin(ry)) > .7; collider(x, z, w ? 1.4 : len, w ? len : 1.4); },
  coffee(x, z, ry = 0) { const g = group(x, z, ry); box(g, 1.2, .9, .6, "#7a5537", 0, 0, 0); box(g, .5, .6, .4, "#2b2f36", -.2, .9, 0, { m: { shininess: 90 } }); box(g, .14, .1, .02, "#ff4d4d", -.2, 1.3, .21, { mat: new THREE.MeshBasicMaterial({ color: "#ff4d4d" }) }); box(g, .12, .14, .12, "#fff", .3, .9, 0); collider(x, z, 1.25, .65); return g; },
  cooler(x, z) { const g = group(x, z); box(g, .45, 1, .45, "#e8eef4", 0, 0, 0); const b = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .5, 12), new THREE.MeshPhongMaterial({ color: "#7cc4ff", transparent: true, opacity: .7, shininess: 100 })); b.position.y = 1.25; g.add(b); collider(x, z, .5, .5); },
  printer(x, z, ry = 0) { const g = group(x, z, ry); box(g, 1, .9, .7, "#d9dee4", 0, 0, 0); box(g, .9, .25, .6, "#bfc6ce", 0, .9, 0); box(g, .6, .02, .3, "#fff", 0, 1.16, .1); collider(x, z, 1.05, .75); return g; },
  beanbag(x, z, color) { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), mat(color, { shininess: 50 })); m.scale.y = .55; m.position.set(x, .28, z); m.castShadow = true; E.world.add(m); collider(x, z, .9, .9); },
  poster(x, z, ry, text, color) { PROP.board(x, z, ry, [text], { w: 1.4, h: 1.9, bg: color, fg: "#fff", size: 40, frame: "#222" }); },
  rug(x, z, w, d, color) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { shininess: 4 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .01, z); m.receiveShadow = true; E.world.add(m); },
  bed(x, z, ry, color, big) { const g = group(x, z, ry); const w = big ? 2 : 1.2; box(g, w, .45, 2.1, "#6b4a32", 0, 0, 0); box(g, w - .1, .2, 2, "#f4f4f4", 0, .45, 0); box(g, w - .1, .08, 1.3, color, 0, .65, .35); box(g, w * .7, .14, .4, "#fff", 0, .65, -.75); box(g, w, .9, .12, "#6b4a32", 0, 0, -1.05);
    const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? 2.2 : w + .1, sw ? w + .1 : 2.2); return g; },
  tv(x, z, ry, big) { const g = group(x, z, ry); box(g, big ? 2 : 1.2, .5, .5, "#3b2f2a", 0, 0, 0); box(g, big ? 1.8 : .9, big ? 1 : .7, .08, "#111", 0, .55, 0); const s = new THREE.Mesh(bgeo(big ? 1.7 : .8, big ? .9 : .6, .01), new THREE.MeshBasicMaterial({ color: "#3a7bd5" })); s.position.set(0, .55 + (big ? .5 : .35), .05); g.add(s);
    E.anims.push(() => s.material.color.setHSL((E.t * .05) % 1, .5, .45)); const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? .55 : (big ? 2 : 1.2), sw ? (big ? 2 : 1.2) : .55); },
  bookshelf(x, z, ry) { const g = group(x, z, ry); box(g, 1.6, 2, .4, "#6b4a32", 0, 0, 0); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) if (Math.random() < .85) box(g, .14, .34, .28, pick(["#c0392b", "#2980b9", "#27ae60", "#f39c12", "#8e44ad", "#ecf0f1"]), -.65 + i * .16, .1 + r * .48, .04, { cast: false }); const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? .45 : 1.65, sw ? 1.65 : .45); },
  kitchen(x, z, ry, len = 3) { const g = group(x, z, ry); box(g, len, .9, .7, "#f2f2f2", 0, 0, 0); box(g, len, .06, .74, "#3b3f46", 0, .9, 0); box(g, .8, 1.9, .7, "#d5dbe1", len / 2 + .4, 0, 0, { m: { shininess: 90 } }); const sw = Math.abs(Math.sin(ry)) > .7; collider(x + (sw ? 0 : .4), z, sw ? .75 : len + .9, sw ? len + .9 : .75); },
  boxes(x, z) { for (let i = 0; i < 3; i++) box(E.world, .6, .5, .6, "#c9a06a", x + (i % 2) * .3, i * .5, z + (i === 1 ? .1 : 0)); collider(x + .15, z, .9, .7); },
  trophyShelf(x, z, ry, n) { const g = group(x, z, ry); box(g, 2.2, .1, .5, "#6b4a32", 0, 1.2, 0); box(g, 2.2, .1, .5, "#6b4a32", 0, 1.8, 0); const gold = mat("#f5c518", { shininess: 120, specular: 0xffffff });
    for (let i = 0; i < Math.min(n, 12); i++) { const tg = new THREE.Group(); tg.position.set(-.9 + (i % 6) * .36, i < 6 ? 1.3 : 1.9, 0); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.09, .05, .16, 10), gold); cup.position.y = .16; tg.add(cup); const base = new THREE.Mesh(bgeo(.12, .06, .12), mat("#3b2f2a")); base.position.y = .03; tg.add(base); g.add(tg); } },
  mirror(x, z, ry) { const g = group(x, z, ry); box(g, .9, 1.8, .06, "#c9a06a", 0, .3, 0); const m = new THREE.Mesh(bgeo(.78, 1.66, .02), new THREE.MeshPhongMaterial({ color: "#dbe9f5", shininess: 150, specular: 0xffffff })); m.position.set(0, 1.2, .04); g.add(m); },
  door(x, z, ry, label, color = "#7a5537") { const g = group(x, z, ry); box(g, 1.8, 2.6, .2, color, 0, 0, 0); box(g, .1, .1, .1, "#f5c518", .65, 1.2, .14);
    const sign = new THREE.Mesh(bgeo(1.6, .4, .03), new THREE.MeshBasicMaterial({ map: textTex([label], { w: 512, h: 128, bg: "#1a7f37", size: 64, top: 64 }) })); sign.material.userData.own = true; sign.position.set(0, 2.9, .05); g.add(sign); return g; },
  fire(x, y, z) { const g = group(x, z); g.position.y = y; const ms = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(bgeo(.2, .3, .2), new THREE.MeshBasicMaterial({ color: i % 2 ? "#ff7a1a" : "#ffd23f" })); g.add(m); ms.push(m); }
    E.anims.push(() => ms.forEach((m, i) => { m.position.set(Math.sin(E.t * 7 + i) * .2, (E.t * 2 + i * .3) % 1, Math.cos(E.t * 5 + i) * .2); m.scale.setScalar(1 - ((E.t * 2 + i * .3) % 1)); })); return g; }
};

/* ---------- people ---------- */
const PANTS = ["#2f3e52", "#5b4636", "#1f1f24", "#6d7f91", "#3a5a40"];
function makePerson(look) {
  const g = new THREE.Group();
  const skin = mat(SKINS[look.skin] || SKINS[0]), shirt = mat(SHIRTS[look.shirt] || SHIRTS[0], { shininess: 20 }), pants = mat(PANTS[look.pants || 0]), hair = mat(HAIRS[look.hair] || HAIRS[0], { shininess: 40 }), shoe = mat("#1b1b1b");
  const add = (p, w, h, d, m, x, y, z) => { const b = new THREE.Mesh(bgeo(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; p.add(b); return b; };
  const body = new THREE.Group(); g.add(body);
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-.13, .74, 0); legR.position.set(.13, .74, 0); body.add(legL, legR);
  [legL, legR].forEach(l => { add(l, .22, .66, .26, pants, 0, -.33, 0); add(l, .24, .1, .34, shoe, 0, -.69, .04); });
  add(body, .58, .62, .34, shirt, 0, 1.05, 0); add(body, .62, .1, .36, shirt, 0, 1.33, 0);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-.38, 1.3, 0); armR.position.set(.38, 1.3, 0); body.add(armL, armR);
  [armL, armR].forEach(a => { add(a, .16, .48, .18, shirt, 0, -.24, 0); add(a, .14, .14, .16, skin, 0, -.54, 0); });
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); body.add(head);
  add(head, .52, .5, .48, skin, 0, .27, 0);
  add(head, .08, .1, .02, mat("#1d1d1d"), -.11, .3, .245); add(head, .08, .1, .02, mat("#1d1d1d"), .11, .3, .245);
  add(head, .14, .03, .02, mat("#9b4a3a"), 0, .15, .245);
  const st = look.style || 0;
  add(head, .56, .14, .52, hair, 0, .56, 0);
  if (st === 0) { add(head, .56, .3, .1, hair, 0, .42, -.22); add(head, .56, .08, .1, hair, 0, .48, .22); }
  if (st === 1) { add(head, .58, .52, .12, hair, 0, .3, -.24); add(head, .1, .44, .5, hair, -.28, .32, -.02); add(head, .1, .44, .5, hair, .28, .32, -.02); }
  if (st === 2) { for (let i = 0; i < 7; i++) add(head, .2, .2, .2, hair, -.22 + (i % 4) * .15, .62 + (i > 3 ? .1 : 0), -.12 + (i > 3 ? .14 : 0)); add(head, .56, .26, .12, hair, 0, .42, -.22); }
  g.userData = { body, legL, legR, armL, armR, head, phase: Math.random() * 6 };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function animPerson(p, mode, dt) {
  const u = p.userData, t = E.t + u.phase;
  let lx = 0, rx = 0, al = 0, ar = 0, ax = 0, by = 0, hx = 0, az = 0;
  if (mode === "walk" || mode === "run") { const s = Math.sin(t * (mode === "run" ? 14 : 10)) * .6; lx = s; rx = -s; al = -s * .8; ar = s * .8; by = Math.abs(Math.cos(t * 10)) * .05; }
  else if (mode === "sit" || mode === "type") { lx = rx = -1.45; by = -.3; if (mode === "type") { al = -1.1 + Math.sin(t * 13) * .12; ar = -1.1 + Math.sin(t * 13 + 2) * .12; hx = .12; } }
  else if (mode === "cheer") { al = ar = -2.9; az = .3; by = Math.abs(Math.sin(t * 8)) * .35; }
  else if (mode === "sad") { hx = .35; al = ar = .1; }
  else if (mode === "talk") { ar = -.5 + Math.sin(t * 5) * .4; hx = Math.sin(t * 3) * .05; by = Math.sin(t * 2) * .01; }
  else if (mode === "pet") { lx = rx = -1.2; by = -.35; ar = -1 + Math.sin(t * 8) * .3; }
  else { by = Math.sin(t * 2) * .012; al = Math.sin(t * 1.3) * .04; ar = -al; }
  const k = Math.min(1, dt * 14);
  u.legL.rotation.x += (lx - u.legL.rotation.x) * k; u.legR.rotation.x += (rx - u.legR.rotation.x) * k;
  u.armL.rotation.x += (al - u.armL.rotation.x) * k; u.armR.rotation.x += (ar - u.armR.rotation.x) * k;
  u.armL.rotation.z += (-az - u.armL.rotation.z) * k; u.armR.rotation.z += (az - u.armR.rotation.z) * k;
  u.head.rotation.x += (hx - u.head.rotation.x) * k; u.body.position.y += (by - u.body.position.y) * k;
}
function makeDog() {
  const g = new THREE.Group(); const fur = mat("#c98b4a"), dark = mat("#5a3a20");
  const b = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(bgeo(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  b(.4, .32, .8, fur, 0, .45, 0); const head = b(.32, .3, .34, fur, 0, .68, .48); b(.16, .12, .14, dark, 0, .64, .7);
  b(.08, .14, .06, dark, -.12, .86, .44); b(.08, .14, .06, dark, .12, .86, .44);
  const legs = [[-.13, -.28], [.13, -.28], [-.13, .28], [.13, .28]].map(([x, z]) => b(.1, .3, .1, fur, x, .15, z));
  const tail = b(.07, .07, .3, fur, 0, .62, -.5); tail.rotation.x = .6;
  g.userData = { legs, tail, head }; return g;
}

/* ---------- NPCs ---------- */
function addNPC(o) {
  const mesh = makePerson(o.look); mesh.position.set(o.x, 0, o.z); mesh.rotation.y = o.ry || 0; E.world.add(mesh);
  const npc = Object.assign({ mesh, mode: o.sit ? "type" : "idle", path: [], speed: 2.2, hearts: 0, home: { x: o.x, z: o.z, ry: o.ry || 0, mode: o.sit ? "type" : "idle" } }, o);
  mesh.traverse(m => { m.userData.npc = npc; }); E.clickables.push(mesh);
  npc.label = document.createElement("div"); npc.label.className = "w-label"; $("#labels").appendChild(npc.label);
  E.npcs.push(npc); return npc;
}
function removeNPC(npc) { E.world.remove(npc.mesh); npc.label.remove(); E.npcs = E.npcs.filter(n => n !== npc); E.clickables = E.clickables.filter(c => c !== npc.mesh); }
function walkTo(npc, pts, then) { npc.path = pts.map(p => V3(p[0], 0, p[1])); npc.then = then; }
function updateNPC(n, dt) {
  if (n.path.length) {
    const p = n.mesh.position, tgt = n.path[0]; const d = V3(tgt.x - p.x, 0, tgt.z - p.z); const L = d.length();
    if (L < .08) { n.path.shift(); if (!n.path.length) { const f = n.then; n.then = null; if (f) f(n); } }
    else { d.normalize(); p.addScaledVector(d, Math.min(L, n.speed * dt)); const want = Math.atan2(d.x, d.z); n.mesh.rotation.y = lerpAngle(n.mesh.rotation.y, want, dt * 10); }
    animPerson(n.mesh, "walk", dt);
  } else animPerson(n.mesh, n.emoteMode && n.emoteUntil > E.t ? n.emoteMode : n.mode, dt);
  if (n.faceTarget && !n.path.length) n.mesh.rotation.y = lerpAngle(n.mesh.rotation.y, Math.atan2(n.faceTarget.x - n.mesh.position.x, n.faceTarget.z - n.mesh.position.z), dt * 6);
}
function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * Math.min(1, t); }
function npcSay(n, text, secs = 4) { n.speech = text; n.speechUntil = E.t + secs; if (Player.mesh && n.mesh) { const d = n.mesh.position.distanceTo(Player.mesh.position); if (d < 7) Voice.say(text, n.name, d < 3.5 ? 1 : 0); } }
function npcEmote(n, mode, secs = 2) { n.emoteMode = mode; n.emoteUntil = E.t + secs; }

/* ---------- player ---------- */
const Player = { mesh: null, speed: 4.4, r: .34 };
function spawnPlayer(x, z, ry = Math.PI) {
  if (Player.mesh) E.scene.remove(Player.mesh);
  Player.mesh = makePerson(S.player ? S.player.look : { skin: 1, hair: 0, shirt: 0, style: 0, pants: 0 }); Player.mesh.position.set(x, 0, z); Player.mesh.rotation.y = ry; E.scene.add(Player.mesh);
}
function resolve(p, r) {
  for (const b of E.colliders) {
    const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ); const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) { if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      else { const l = p.x - b.minX, rr = b.maxX - p.x, t = p.z - b.minZ, bb = b.maxZ - p.z, m = Math.min(l, rr, t, bb); if (m === l) p.x = b.minX - r; else if (m === rr) p.x = b.maxX + r; else if (m === t) p.z = b.minZ - r; else p.z = b.maxZ + r; } }
  }
}
function updatePlayer(dt) {
  if (!Player.mesh) return;
  const p = Player.mesh.position; const k = E.keys;
  let f = 0, s = 0;
  if (!E.uiOpen) { f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0); s = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0); }
  let mv = V3(0, 0, 0);
  if (f || s) { E.target = null; E.onArrive = null; E.ring.visible = false; const fw = V3(-Math.sin(E.yaw), 0, -Math.cos(E.yaw)), rt = V3(Math.cos(E.yaw), 0, -Math.sin(E.yaw)); mv.addScaledVector(fw, f).addScaledVector(rt, s).normalize(); }
  else if (E.target && !E.uiOpen) {
    const d = V3(E.target.x - p.x, 0, E.target.z - p.z);
    if (d.length() < (E.arriveR || .15)) { E.target = null; E.ring.visible = false; const cb = E.onArrive; E.onArrive = null; if (cb) cb(); }
    else mv = d.normalize();
  }
  if (mv.lengthSq() > 0) {
    const before = p.clone(); p.addScaledVector(mv, Player.speed * Game.speedMul() * dt); resolve(p, Player.r);
    if (E.target) { if (p.distanceTo(before) < .004) { E.stuck = (E.stuck || 0) + dt; if (E.stuck > .4) { E.target = null; E.ring.visible = false; E.stuck = 0; const cb = E.onArrive; E.onArrive = null; if (cb && E.nearPos && p.distanceTo(E.nearPos) < 2.4) cb(); } } else E.stuck = 0; }
    Player.mesh.rotation.y = lerpAngle(Player.mesh.rotation.y, Math.atan2(mv.x, mv.z), dt * 12);
    animPerson(Player.mesh, "walk", dt);
    E.step = (E.step || 0) + dt; if (E.step > .32) { E.step = 0; Sfx.tone(140 + Math.random() * 40, .03, "sine", .02); }
  } else animPerson(Player.mesh, Player.emoteUntil > E.t ? Player.emote : "idle", dt);
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  if (!Player.mesh) return;
  E.yaw = lerpAngle(E.yaw, E.yawT, dt * 6);
  const p = Player.mesh.position, pitch = .88, dist = E.zoom;
  const cx = p.x + Math.sin(E.yaw) * Math.cos(pitch) * dist, cz = p.z + Math.cos(E.yaw) * Math.cos(pitch) * dist, cy = Math.sin(pitch) * dist + 1;
  if (E.orbit) { const a = E.t * .15; E.camera.position.set(p.x + Math.sin(a) * 6, 2.9, p.z + Math.cos(a) * 6); E.camera.lookAt(p.x, 2.1, p.z); }
  else { E.camera.position.lerp(V3(cx, cy, cz), Math.min(1, dt * 8)); E.camera.lookAt(p.x, 1, p.z); }
  const camDir = V3(E.camera.position.x - p.x, 0, E.camera.position.z - p.z).normalize();
  for (const w of E.walls) { const want = w.normal.dot(camDir) > .3 ? .1 : 1; w.h += (want - w.h) * Math.min(1, dt * 6); w.g.scale.y = w.h; }
  if (E.sunDir) { E.sun.position.copy(p).add(E.sunDir); E.sun.target.position.copy(p); }
}

/* ---------- labels (HTML over the 3D scene) ---------- */
const _v = new THREE.Vector3();
function placeLabel(el, pos, yOff) {
  _v.set(pos.x, pos.y + yOff, pos.z).project(E.camera);
  if (_v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) { el.style.display = "none"; return; }
  el.style.display = ""; el.style.transform = `translate(-50%,-100%) translate(${(_v.x + 1) / 2 * window.innerWidth}px,${(1 - _v.y) / 2 * window.innerHeight}px)`;
}
function updateLabels() {
  const pp = Player.mesh ? Player.mesh.position : V3();
  for (const n of E.npcs) {
    const d = n.mesh.position.distanceTo(pp); const task = n.task; const speaking = n.speechUntil > E.t;
    const show = !E.orbit && (task || speaking || d < 4.5 || n.alwaysLabel);
    if (!show) { n.label.style.display = "none"; continue; }
    const key = [task ? task.urgent + "|" + Math.round(task.patienceRatio * 10) : "", speaking ? n.speech : "", n.name, n.hearts, d < 4.5].join("~");
    if (key !== n.labelKey) {
      n.labelKey = key;
      const ratio = task ? task.patienceRatio : 1; const col = ratio > .5 ? "#f5b800" : ratio > .25 ? "#f08a12" : "#d6342c";
      n.label.innerHTML = `${speaking ? `<div class="w-speech">${n.speech}</div>` : ""}${task ? `<div class="w-mark ${task.urgent ? "urgent" : ""}" style="--mc:${task.urgent ? "#d6342c" : col}">${task.urgent ? "!!" : "!"}</div>` : ""}${(d < 4.5 || task) ? `<div class="w-name">${esc(n.name)}${n.role ? `<small>${esc(n.role)}</small>` : ""}${n.hearts ? `<span class="w-hearts">${"♥".repeat(n.hearts)}</span>` : ""}</div>` : ""}`;
    }
    placeLabel(n.label, n.mesh.position, n.mode === "type" || n.mode === "sit" ? 1.95 : 2.25);
  }
  for (const it of E.inters) {
    if (!it.label) continue;
    const d = it.pos.distanceTo(pp); const mark = it.mark && it.mark();
    const show = !E.orbit && (d < 6 || mark);
    if (!show) { it.label.style.display = "none"; continue; }
    const key = (mark || "") + it.name;
    if (key !== it.labelKey) { it.labelKey = key; it.label.innerHTML = `${mark ? `<div class="w-mark ${mark === "!!" ? "urgent" : ""}" style="--mc:${mark === "!!" ? "#d6342c" : "#f5b800"}">${mark}</div>` : ""}<div class="w-name">${esc(it.name)}</div>`; }
    placeLabel(it.label, it.pos, it.h || 2.2);
  }
}
function addInter(o) { const it = Object.assign({ r: 1.8, h: 2.2 }, o); it.pos = V3(o.x, 0, o.z); if (o.name) { it.label = document.createElement("div"); it.label.className = "w-label"; $("#labels").appendChild(it.label); } if (o.mesh) { o.mesh.traverse(m => m.userData.inter = it); E.clickables.push(o.mesh); } E.inters.push(it); return it; }

/* ---------- input ---------- */
function setupInput() {
  window.addEventListener("keydown", e => {
    if (e.target.matches && e.target.matches("input, textarea, select")) return;
    const k = e.key.toLowerCase(); E.keys[k] = true;
    if (E.uiOpen) return;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === "q") E.yawT += Math.PI / 4; if (k === "e") E.yawT -= Math.PI / 4;
    if (k === " " || k === "enter" || k === "f") Game.interact();
  });
  window.addEventListener("keyup", e => { E.keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => { E.keys = {}; });
  const cv = $("#stage"); let down = null;
  cv.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, yaw: E.yawT, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 8 || Math.abs(e.clientY - down.y) > 8) down.moved = true; if (down.moved) E.yawT = down.yaw - dx * .008; });
  cv.addEventListener("pointerup", e => { const d = down; down = null; if (!d || d.moved || E.uiOpen || E.orbit) return; clickWorld(e.clientX, e.clientY); });
  cv.addEventListener("wheel", e => { e.preventDefault(); E.zoom = clamp(E.zoom + Math.sign(e.deltaY) * 1.2, 8, 26); }, { passive: false });
}
function clickWorld(x, y) {
  const m = new THREE.Vector2(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  E.ray.setFromCamera(m, E.camera);
  const hits = E.ray.intersectObjects(E.clickables, true);
  for (const h of hits) {
    const u = h.object.userData;
    if (u.npc) { const n = u.npc; goNear(n.mesh.position, () => Game.interactWith({ npc: n })); return; }
    if (u.inter) { const it = u.inter; goNear(it.pos, () => Game.interactWith({ inter: it }), it.r * .7); return; }
    if (u.floor) { E.target = h.point.clone(); E.arriveR = .15; E.onArrive = null; E.ring.position.set(h.point.x, .03, h.point.z); E.ring.visible = true; return; }
  }
}
function goNear(pos, cb, r = 1.3) {
  const p = Player.mesh.position; if (p.distanceTo(pos) <= r + .3) { cb(); return; }
  const dir = V3(p.x - pos.x, 0, p.z - pos.z).normalize();
  E.nearPos = pos; E.target = V3(pos.x + dir.x * r, 0, pos.z + dir.z * r); E.arriveR = .25; E.onArrive = cb; E.ring.position.set(E.target.x, .03, E.target.z); E.ring.visible = true;
}

/* ---------- main loop ---------- */
function loop(now) {
  const dt = Math.min(.05, (now - E.last) / 1000); E.last = now; E.t += dt;
  try {
    updatePlayer(dt); E.npcs.forEach(n => updateNPC(n, dt)); E.anims.forEach(f => f(dt));
    if (E.rain) { const a = E.rain.geometry.attributes.position; for (let i = 0; i < a.count; i += 2) { let y = a.getY(i) - dt * 14; if (y < 0) y += 8; a.setY(i, y); a.setY(i + 1, y - .5); } a.needsUpdate = true; }
    if (E.ring.visible) E.ring.rotation.z += dt * 2;
    Game.tick(dt); updateCamera(dt); updateLabels();
    E.renderer.render(E.scene, E.camera);
  } catch (err) { console.error(err); }
  requestAnimationFrame(loop);
}
