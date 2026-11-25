/* =====================================================================
   FEEL: the "45 recommendations" pass. Atmosphere, life, camera, audio
   and presentation touches. Every effect is cheap or quality-gated.
   ===================================================================== */
const hiQ = () => S.gfx !== "perf";

/* ---------- 2. contact shadows (soft dark blobs under people and furniture) ---------- */
let BLOB_TEX = null;
function blobTex() { return BLOB_TEX || (BLOB_TEX = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(.6, "rgba(0,0,0,.22)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }, false)); }
function blobUnder(parent, w, d, y = .015) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 1; m.userData.noOutline = true; parent.add(m); return m; }
function contactShadows() {
  if (!hiQ() || !E.room) return;
  for (const n of E.npcs) if (!n.blob) { n.blob = blobUnder(n.mesh, .9, .9); }
  for (const c of E.colliders) { const w = c.maxX - c.minX, d = c.maxZ - c.minZ; if (w * d > 10 || w > 6 || d > 6) continue; const g = new THREE.Group(); g.position.set((c.minX + c.maxX) / 2, 0, (c.minZ + c.maxZ) / 2); E.world.add(g); blobUnder(g, w * 1.35, d * 1.35, .012); }
}
/* ---------- 3. dust motes in the sun ---------- */
function dustMotes() {
  if (!hiQ() || !E.room || LOC === "street" || LOC === "garage" || hourNow() >= 18 || S.weather === "rain") return;
  const W = E.room.W, D = E.room.D, N = 260, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * W * .9; pos[i * 3 + 1] = .4 + Math.random() * 2.4; pos[i * 3 + 2] = (Math.random() - .5) * D * .9; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: lin("#fff3d6"), size: .025, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); E.world.add(pts);
  E.anims.push(dt => { const a = g.attributes.position.array; for (let i = 0; i < N; i++) { a[i * 3 + 1] += Math.sin(E.t * .3 + i) * dt * .02; a[i * 3] += Math.cos(E.t * .2 + i * 1.7) * dt * .015; } g.attributes.position.needsUpdate = true; });
}
/* ---------- 6. rain running down the windows ---------- */
let RAIN_TEX = null;
function windowRain() {
  if (!E.windowMat || S.weather !== "rain") { if (E.windowMat) { E.windowMat.map = null; E.windowMat.needsUpdate = true; } return; }
  RAIN_TEX = RAIN_TEX || canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, l = 6 + Math.random() * 22; g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1 + Math.random() * 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.random() * 2, y + l); g.stroke(); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(x, y + l, 1.6, 0, 7); g.fill(); } }, false);
  RAIN_TEX.wrapS = RAIN_TEX.wrapT = THREE.RepeatWrapping; RAIN_TEX.repeat.set(2, 1.5);
  E.windowMat.map = RAIN_TEX; E.windowMat.opacity = .38; E.windowMat.needsUpdate = true; E.anims.push(dt => { RAIN_TEX.offset.y += dt * .25; });
}
/* ---------- 7. outdoor haze ---------- */
function streetHaze() { if (!E.scene.fog) return; if (LOC === "street") { E.scene.fog.near = 25; E.scene.fog.far = 170; } else { E.scene.fog.near = 60; E.scene.fog.far = 340; } }
/* ---------- 8. light switch at home ---------- */
function homeSwitch() {
  if (LOC !== "home") return; const W = E.room.W, D = E.room.D, x = W / 2 - 3.1, z = -D / 2 + .17;
  box(group(x, z), .1, .16, .02, "#f4f4f2", 0, 1.25, 0);
  addInter({ name: "Light switch", verb: S.lightsOff ? "Turn the lights on" : "Turn the lights off", x, z: z + .9, r: 1.2, action: it => { S.lightsOff = !S.lightsOff; applyLights(); it.verb = S.lightsOff ? "Turn the lights on" : "Turn the lights off"; Sfx.tone(1400, .03, "square", .03); save(); } });
  applyLights();
}
function applyLights() { const off = LOC === "home" && S.lightsOff; (E.lamps || []).forEach(l => l.visible = !off); (E.ceilLights || []).forEach(m => m.color.set(off ? "#3a3530" : "#fff1d6")); }
/* ---------- 9. colored screen glow ---------- */
function screenGlow() {
  if (!hiQ() || LOC !== "floor" || !E.F) return; const col = E.style === "soc" ? 0x3a7bff : 0x9fc9ff;
  (E.F.seats || []).slice(0, 4).forEach(d => { if (!d.g) return; const l = new THREE.PointLight(col, E.style === "soc" ? .9 : .35, 2.2, 2); l.position.set(0, 1.25, .1); d.g.add(l); });
}
/* ---------- 11/12/16. character variety, holiday hats, name badges ---------- */
function dressPeople() {
  const h = typeof holiday === "function" && holiday(), sn = typeof season === "function" && season();
  for (const n of E.npcs) {
    if (n.dressed || !n.mesh) continue; n.dressed = true; const r = seeded("v" + n.name);
    n.mesh.scale.setScalar(.95 + r() * .1);
    if ((h && (h.sticker === "gift" || h.sticker === "party")) || (sn && sn.name === "Winter" && r() < .3)) { const hat = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(.12, .28, 12), mat(h && h.sticker === "party" ? pick(["#9b59b6", "#f1c40f", "#3498db"]) : "#c0392b")); c.position.y = .14; hat.add(c); const pom = new THREE.Mesh(sgeo(.04, 8, 6), mat("#fafafa")); pom.position.y = .3; hat.add(pom); hat.position.y = n.mode === "sit" || n.mode === "type" ? 1.48 : 1.82; n.mesh.add(hat); }
    if (h && h.sticker === "pumpkin" && r() < .4) { const mask = new THREE.Mesh(sgeo(.13, 10, 8), mat("#e8761c")); mask.scale.set(1, .85, .6); mask.position.set(0, n.mode === "sit" || n.mode === "type" ? 1.32 : 1.66, .1); n.mesh.add(mask); }
    if (n.kind === "coworker" || n.kind === "mentor") { const b = new THREE.Mesh(bgeo(.07, .09, .01), mat("#f4f4f2")); b.position.set(.09, n.mode === "sit" || n.mode === "type" ? 1.02 : 1.3, .16); const clip = new THREE.Mesh(bgeo(.07, .02, .012), mat(CUR_JOB ? jobById(CUR_JOB).color : "#2a7fd4")); clip.position.y = .045; b.add(clip); n.mesh.add(b); }
  }
}
/* ---------- 18. scrolling monitor content ---------- */
function liveScreens() {
  if (LOC !== "floor") return; const seen = new Set();
  E.world.traverse(o => { if (o.isMesh && o.material && o.material.map && o.geometry && o.geometry.parameters && Math.abs((o.geometry.parameters.width || 0) - .7) < .01 && !seen.has(o.material)) seen.add(o.material); });
  const mats = [...seen].slice(0, 6); mats.forEach((m, i) => { const t = m.map.clone(); t.needsUpdate = true; t.wrapT = THREE.RepeatWrapping; m.map = t; E.anims.push(dt => { t.offset.y = (t.offset.y + dt * (.02 + i * .004)) % 1; }); });
}
/* ---------- 19. swaying plants and a lobby fish tank ---------- */
function swayPlants() { E.world.children.forEach((o, i) => { if (o.userData.fm && /Houseplant/.test(o.userData.fm)) E.anims.push(() => { o.rotation.z = Math.sin(E.t * .8 + i) * .015; }); }); }
function fishTank() {
  if (LOC !== "lobby") return; const x = -E.room.W / 2 + .55, z = -2.2, g = group(x, z, Math.PI / 2);
  box(g, 1.8, .8, .5, "#2b2f36", 0, 0, 0); const water = new THREE.Mesh(bgeo(1.7, .75, .42), new THREE.MeshStandardMaterial({ color: lin("#5fb6e6"), transparent: true, opacity: .35, roughness: .05 })); water.position.y = 1.18; g.add(water); box(g, 1.8, .06, .5, "#2b2f36", 0, 1.56, 0);
  const fish = []; for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(sgeo(.04, 8, 6), mat(pick(["#ff7a1a", "#ffd23f", "#e74c3c", "#3498db"]))); f.scale.set(1.8, 1, .6); g.add(f); fish.push({ f, ph: Math.random() * 6, sp: .4 + Math.random() * .5, y: .95 + Math.random() * .45 }); }
  E.anims.push(() => fish.forEach(q => { const t = E.t * q.sp + q.ph; q.f.position.set(Math.sin(t) * .7, q.y + Math.sin(t * 2.3) * .04, Math.cos(t * .7) * .12); q.f.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI; }));
  collider(x, z, .55, 1.85); addInter({ name: "Fish tank", verb: "Watch the fish", x: x + 1, z, r: 1.4, action: () => { if (SH) SH.stress = Math.max(0, SH.stress - 3); toast("The fish drift peacefully. You feel a little calmer."); } });
}
/* ---------- 20. mess builds up during a shift ---------- */
function messTick() { if (!SH || LOC !== "floor" || !E.F || !E.F.seats) return; const want = Math.floor(SH.minute / 60); SH.mess = SH.mess || 0;
  while (SH.mess < want && SH.mess < 8) { const d = pick(E.F.seats); if (d && d.g) { const cup = new THREE.Mesh(cgeo(.035, .03, .1, 10), mat(pick(["#f4f4f2", "#c0392b", "#8a5a3b"]))); cup.position.set(-.3 + Math.random() * .6, .82, .1 + Math.random() * .15); d.g.add(cup); } SH.mess++; } }
/* ---------- 23. live meetings at meeting tables ---------- */
function liveMeeting(job) {
  const th = THEMES[job.id]; if (!th || !th.props || !th.props.includes("meeting") || E.style === "premium") return;
  const seats = [[4.8, -10.15, 0], [6, -10.15, 0], [7.2, -10.15, 0], [6, -8.25, Math.PI]];
  seats.forEach(([x, z, ry], i) => { if (i > 2 && Math.random() < .5) return; const nm = `${pick(FIRST)} ${pick(LAST)}`; const n = addNPC({ kind: "npc", name: nm, role: "In a meeting", look: lookFor(nm), x, z, ry: ry + Math.PI, sit: true }); n.mode = n.home.mode = "sit"; n.onTalk = m => npcSay(m, pick(["We're in a meeting, can it wait?", "Next slide, please.", "Let's take this offline."]), 3); });
  E.anims.push(() => { const ms = E.npcs.filter(n => n.role === "In a meeting"); if (ms.length && Math.random() < .004) npcSay(pick(ms), pick(["What does the data say?", "Who owns this action item?", "Great point.", "Let's circle back on that."]), 3); });
}
/* ---------- 24. building map (phone tab) ---------- */
PHONE.map = () => `<p>Brightline Corp: ${JOBS.length} floors plus the lobby, cafeteria${S.roof ? ", rooftop garden" : ""} and garage.</p><div class="bmap">${JOBS.slice().sort((a, b) => b.floor - a.floor).map(j => `<div class="bfl ${CUR_JOB === j.id ? "here" : ""}" style="--c:${j.color}"><b>${j.floor}</b><span>${esc(j.dept)}</span><small>${esc(STYLE_NAMES[DEPT_STYLE[j.id] || "standard"] || "")}</small></div>`).join("")}<div class="bfl ${LOC === "lobby" ? "here" : ""}" style="--c:#7d8794"><b>G</b><span>Lobby</span><small>Reception · Training · Daily challenge</small></div><div class="bfl" style="--c:#c0392b"><b>C</b><span>Cafeteria</span><small>Lunch at 12:00</small></div></div>`;
/* ---------- 26. moving clouds + blinking aircraft lights ---------- */
function skyLife() {
  if (!hiQ()) return; const tex = canvasTex(256, 128, (g, w, h) => { for (let i = 0; i < 14; i++) { const r = g.createRadialGradient(40 + Math.random() * 176, 50 + Math.random() * 30, 0, 128, 64, 60); g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(40 + Math.random() * 176, 50 + Math.random() * 30, 18 + Math.random() * 26, 0, 7); g.fill(); } }, false);
  const clouds = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: S.weather === "rain" ? .9 : .7, depthWrite: false, fog: false })); s.scale.set(60, 26, 1); s.position.set(-200 + Math.random() * 400, 70 + Math.random() * 40, -150 - Math.random() * 120); E.world.add(s); clouds.push(s); }
  E.anims.push(dt => clouds.forEach(c => { c.position.x += dt * 2.2; if (c.position.x > 230) c.position.x = -230; }));
  const blink = []; for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(sgeo(.6, 6, 4), new THREE.MeshBasicMaterial({ color: "#ff3b30", fog: false })); const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 100; b.position.set(Math.cos(a) * r, 60 + Math.random() * 50, Math.sin(a) * r); E.world.add(b); blink.push([b, Math.random() * 6]); }
  E.anims.push(() => { const night = hourNow() >= 18 || hourNow() < 7; blink.forEach(([b, p]) => b.visible = night && Math.sin(E.t * 2 + p) > .7); });
}
/* ---------- 30. field of view ---------- */
{ const rs = resize; resize = function () { rs(); if (E.camera && S.fov) { E.camera.fov = clamp(+S.fov, 55, 95); E.camera.updateProjectionMatrix(); } }; }
/* ---------- 31. footsteps that match the floor ---------- */
let stepPhase = 0;
function footsteps() {
  if (S.muted || !Sfx.ctx || !E.moving || E.uiOpen || LOC === "title") return; const ph = Math.floor((E.bob || 0) / Math.PI); if (ph === stepPhase) return; stepPhase = ph;
  const kind = LOC === "street" || LOC === "garage" ? "hard" : LOC === "home" || (CUR_JOB && /carpet/.test((THEMES[CUR_JOB] || {}).floor || "")) ? "soft" : "tile";
  const c = Sfx.ctx, len = c.sampleRate * .08, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, kind === "soft" ? 6 : 3);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = "lowpass"; f.frequency.value = kind === "soft" ? 500 : kind === "tile" ? 2400 : 1600; g.gain.value = (kind === "soft" ? .05 : .09) * (S.voiceVol ?? .9); s.connect(f).connect(g).connect(c.destination); s.start();
}
/* ---------- 33. cinematic title camera ---------- */
function titleCam() {}
/* ---------- 34. floor intro card ---------- */
function introCard(job) {
  const el = document.createElement("div"); el.className = "introcard"; el.style.setProperty("--c", job.color);
  el.innerHTML = `<small>Floor ${job.floor}</small><b></b><span></span>`; $("b", el).textContent = job.dept; $("span", el).textContent = STYLE_NAMES[DEPT_STYLE[job.id] || "standard"] || ""; document.body.appendChild(el); setTimeout(() => el.remove(), 3200);
}
/* ---------- 37. elevator ride transition ---------- */
function elevatorRide(toFloor, then) {
  const from = CUR_JOB ? jobById(CUR_JOB).floor : 0; const ov = document.createElement("div"); ov.className = "elevride"; ov.innerHTML = `<div class="elev-doors"><i></i><i></i></div><div class="elev-num" id="evn">${from || "G"}</div>`; document.body.appendChild(ov);
  Sfx.tone(988, .3, "sine", .05); let f = from; const target = toFloor === "G" || toFloor === "C" || toFloor === "R" ? 0 : toFloor; const steps = Math.min(8, Math.abs(target - f)) || 1; let k = 0;
  const iv = setInterval(() => { k++; f = Math.round(from + (target - from) * k / steps); $("#evn", ov).textContent = k >= steps ? toFloor : (f || "G"); Sfx.tone(1700, .02, "sine", .02); if (k >= steps) { clearInterval(iv); Sfx.tone(1318, .5, "sine", .05); then(); setTimeout(() => { ov.classList.add("open"); setTimeout(() => ov.remove(), 700); }, 450); } }, 160);
}
/* ---------- 40/42. department music moods + floor ambience ---------- */
function floorAmbience(dt) {
  if (S.muted || !Sfx.ctx || LOC !== "floor" || E.uiOpen) return; E.ambT = (E.ambT ?? 3) - dt; if (E.ambT > 0) return;
  const id = CUR_JOB; E.ambT = 3 + Math.random() * 5;
  if (["it", "cyber", "data"].includes(id)) Sfx.tone(60, 2.8, "sine", .012);
  else if (id === "chef") { const c = Sfx.ctx, len = c.sampleRate * .6, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * .5 * (1 - i / len); const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = "highpass"; f.frequency.value = 3000; g.gain.value = .03; s.connect(f).connect(g).connect(c.destination); s.start(); }
  else if (["wh", "logi"].includes(id)) { Sfx.tone(1200, .1, "square", .012); Sfx.tone(1200, .1, "square", .012, .25); }
  else if (["bank", "mgmt"].includes(id)) { E.ambT += 6; }
  else if (id === "med") Sfx.tone(880, .08, "sine", .015);
}
/* ---------- 44. pick graphics settings for this PC on first launch ---------- */
function autoDetectGfx() {
  if (S.gfxAuto) return; S.gfxAuto = true;
  try { const gl = E.renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"), name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    const strong = /RTX|GTX 1[6-9]|GTX 10[7-8]|RX [5-7][0-9]{3}|Radeon Pro|Apple M[1-9] (Pro|Max|Ultra)|Arc A7/i.test(name), weak = /SwiftShader|llvmpipe|Intel\(R\) (HD|UHD) Graphics [1-6]|Mali|Adreno [1-5]/i.test(name) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    S.gfx = strong ? "ultra" : weak ? "perf" : "hd"; save(); applyQuality();
    setTimeout(() => toast(`Graphics set to <b>${QUALITY[S.gfx].name}</b> for your device. Change it anytime in Settings.`), 1200);
  } catch (e) {}
}
/* ---------- hook it all up ---------- */
function feelOnLocation(loc, opts) {
  contactShadows(); dustMotes(); windowRain(); streetHaze(); homeSwitch(); screenGlow(); dressPeople(); liveScreens(); swayPlants(); fishTank(); skyLife();
  if (loc === "floor" && E.F) { const job = jobById(CUR_JOB); liveMeeting(job); dressPeople(); introCard(job); }
}
function feelTick(dt) { footsteps(); titleCam(dt); messTick(); floorAmbience(dt); if (E.npcs.some(n => !n.dressed)) dressPeople(); if (hiQ()) for (const n of E.npcs) if (!n.blob && n.mesh) n.blob = blobUnder(n.mesh, .9, .9); }

/* 29. third-person toggle (V) */
window.addEventListener("keydown", e => { if (e.target.matches && e.target.matches("input, textarea, select")) return; if (e.key.toLowerCase() === "v" && !E.uiOpen && LOC !== "title") { E.third = !E.third; toast(E.third ? "Third-person view. Press V to go back." : "First-person view."); } });
/* tag furniture with its model name (for swaying plants) */
{ const fm2 = PROP.fm; PROP.fm = function (name, x, z, ry, o = {}) { const g = fm2.call(PROP, name, x, z, ry, o); if (g) g.userData.fm = name; return g; }; }
