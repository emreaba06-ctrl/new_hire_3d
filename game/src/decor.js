/* =====================================================================
   DECOR: signature props that make every department look different,
   plus general decoration that fills rooms with life.
   ===================================================================== */
function chartTex(title, kind, color) {
  return canvasTex(512, 288, (g, w, h) => {
    g.fillStyle = "#0e1726"; g.fillRect(0, 0, w, h); g.fillStyle = "#cfe3ff"; g.font = "bold 26px system-ui, sans-serif"; g.fillText(title, 18, 36);
    g.strokeStyle = "rgba(255,255,255,.12)"; for (let y = 70; y < h - 20; y += 40) { g.beginPath(); g.moveTo(18, y); g.lineTo(w - 18, y); g.stroke(); }
    if (kind === "bars") for (let i = 0; i < 10; i++) { const v = 40 + Math.random() * 150; g.fillStyle = i % 3 ? color : "#ffd23f"; g.fillRect(28 + i * 47, h - 24 - v, 30, v); }
    else if (kind === "line") { g.strokeStyle = color; g.lineWidth = 5; g.beginPath(); let y = 200; for (let x = 20; x < w - 10; x += 24) { y = clamp(y + (Math.random() - .55) * 40, 70, 250); x === 20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    else if (kind === "pie") { let a = 0; ["#4dd0e1", "#ffd23f", "#ff7a59", "#8bc34a", "#b48cff"].forEach((c, i) => { const s = (.12 + Math.random() * .25) * Math.PI * 2; g.fillStyle = c; g.beginPath(); g.moveTo(150, 170); g.arc(150, 170, 95, a, a + s); g.fill(); a += s; }); g.fillStyle = "#cfe3ff"; g.font = "22px system-ui"; ["North", "South", "East", "West"].forEach((t, i) => g.fillText(t, 300, 110 + i * 40)); }
    else if (kind === "map") { g.fillStyle = "#1d3b2a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(60 + Math.random() * 400, 80 + Math.random() * 170, 30 + Math.random() * 50, 20 + Math.random() * 30, Math.random(), 0, 7); g.fill(); } g.strokeStyle = color; g.lineWidth = 3; g.setLineDash([8, 6]); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(256, 170); g.quadraticCurveTo(200 + Math.random() * 100, 40, 40 + Math.random() * 430, 80 + Math.random() * 170); g.stroke(); } g.setLineDash([]); g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(256, 170, 8, 0, 7); g.fill(); }
    else if (kind === "leader") { g.font = "24px system-ui"; ["Riley", "Jordan", "You", "Casey", "Morgan"].forEach((n, i) => { const v = 380 - i * 55 - Math.random() * 20; g.fillStyle = n === "You" ? "#ffd23f" : "#cfe3ff"; g.fillText(`${i + 1}. ${n}`, 22, 84 + i * 42); g.fillStyle = n === "You" ? "#ffd23f" : color; g.fillRect(170, 66 + i * 42, v * .8, 22); }); }
    else if (kind === "big") { g.fillStyle = color; g.font = "bold 110px system-ui"; g.textAlign = "center"; g.fillText(kindLabel(title), w / 2, 190); }
  });
}
const kindLabel = t => ({ "CUSTOMER SATISFACTION": "94%", "TAX DAY IN": "12 DAYS", "UPTIME": "99.9%" }[t] || "★");
function wallScreen(x, z, ry, title, kind, color, w = 2.4, h = 1.35, y = 1.5) {
  const g = group(x, z, ry); box(g, w + .12, h + .12, .08, "#15181d", 0, y - .06, 0);
  const m = new THREE.Mesh(bgeo(w, h, .01), new THREE.MeshBasicMaterial({ map: chartTex(title, kind, color) })); m.material.userData.own = true; m.position.set(0, y + h / 2, .05); g.add(m); return g;
}
function frameArt(x, z, ry, seed, y = 1.6) {
  const r = seeded("art" + seed); const g = group(x, z, ry); const w = .7 + r() * .5, h = .5 + r() * .4;
  box(g, w + .08, h + .08, .04, "#2b2622", 0, y, 0);
  const t = canvasTex(256, 192, (c, W, H) => { const hue = Math.floor(r() * 360); c.fillStyle = `hsl(${hue},45%,82%)`; c.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { c.fillStyle = `hsla(${(hue + r() * 140) % 360},60%,${40 + r() * 30}%,.85)`; c.beginPath(); r() < .5 ? c.arc(r() * W, r() * H, 18 + r() * 50, 0, 7) : c.rect(r() * W, r() * H, 30 + r() * 90, 20 + r() * 60); c.fill(); } });
  const m = new THREE.Mesh(bgeo(w, h, .01), new THREE.MeshStandardMaterial({ map: t, roughness: .7 })); m.position.set(0, y + .04 + h / 2 - .04, .025); g.add(m);
}
function stanchions(x0, x1, z) { for (let x = x0; x <= x1 + .01; x += 1.2) { const g = group(x, z); box(g, .07, .95, .07, "#c9a227", 0, 0, 0, { m: { metal: .8, rough: .3 } }); const base = new THREE.Mesh(cgeo(.16, .18, .04, 16), mat("#c9a227", { metal: .8, rough: .3 })); base.position.y = .02; g.add(base); if (x + 1.2 <= x1 + .01) { const rope = new THREE.Mesh(cgeo(.025, .025, 1.2, 8), mat("#8e1b2b", { rough: .8 })); rope.rotation.z = Math.PI / 2; rope.position.set(.6, .85, 0); g.add(rope); } } collider((x0 + x1) / 2, z, x1 - x0 + .3, .25); }
function conveyor(x, z0, z1) {
  const len = z1 - z0, g = group(x, (z0 + z1) / 2); box(g, .9, .1, len, "#2b2f36", 0, .62, 0); box(g, 1, .62, .12, "#7d8794", 0, 0, -len / 2 + .1); box(g, 1, .62, .12, "#7d8794", 0, 0, len / 2 - .1);
  for (const sx of [-.48, .48]) box(g, .04, .14, len, "#f2c41c", sx, .66, 0);
  const boxes = []; for (let i = 0; i < 6; i++) { const b = box(g, .45, .35, .45, "#c9a06a", 0, .72, -len / 2 + i * len / 6); boxes.push(b); }
  E.anims.push(dt => boxes.forEach(b => { b.position.z += dt * .6; if (b.position.z > len / 2 - .3) b.position.z = -len / 2 + .3; }));
  collider(x, (z0 + z1) / 2, 1, len);
}
function workbench(x, z, ry) {
  const g = group(x, z, ry); box(g, 2.4, .08, .8, "#8a6a48", 0, .86, 0); for (const sx of [-1.1, 1.1]) box(g, .08, .86, .7, "#555", sx, 0, 0);
  box(g, .5, .03, .35, "#2b2f36", -.6, .9, 0); box(g, .48, .3, .02, "#2b2f36", -.6, .92, -.15); box(g, .35, .12, .3, "#9aa4b0", .3, .9, .05); box(g, .25, .25, .2, "#3a7bd5", .8, .9, -.1);
  for (let i = 0; i < 5; i++) box(g, .06, .02, .3, ["#e74c3c", "#2ecc71", "#3498db", "#f1c40f", "#9b59b6"][i], -.2 + i * .08, .9, .25);
  const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? .9 : 2.5, sw ? 2.5 : .9); return g;
}
function gong(x, z) { const g = group(x, z, 0); box(g, .08, 1.6, .08, "#5a3b28", -.55, 0, 0); box(g, .08, 1.6, .08, "#5a3b28", .55, 0, 0); box(g, 1.2, .08, .08, "#5a3b28", 0, 1.6, 0);
  const d = new THREE.Mesh(cgeo(.42, .42, .04, 32), mat("#c9a227", { metal: .9, rough: .25 })); d.rotation.x = Math.PI / 2; d.position.y = 1.05; g.add(d); E.anims.push(() => d.rotation.z = Math.sin(E.t * 1.3) * .04); collider(x, z, 1.3, .4);
  addInter({ name: "Sales gong", verb: "Bang the gong", x, z: z - 1, r: 1.6, action: () => { Sfx.tone(110, 2.2, "sine", .09, 0, 90); Sfx.tone(220, 1.6, "triangle", .03); E.npcs.filter(n => n.kind === "coworker").forEach(n => npcEmote(n, "cheer", 1.4)); toast("GONNNG! The sales floor cheers. (Real sales teams ring a bell or gong when they close a deal.)"); } }); }
function glassWall(x, z, len, ry) { const g = group(x, z, ry); const gm = new THREE.MeshStandardMaterial({ color: lin("#cfe8ff"), transparent: true, opacity: .18, roughness: .05, metalness: .1, depthWrite: false }); const p = new THREE.Mesh(bgeo(len, 2.6, .03), gm); p.position.y = 1.3; g.add(p); box(g, len, .06, .06, "#9aa4b0", 0, 2.6, 0); box(g, len, .05, .06, "#9aa4b0", 0, 0, 0); const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? .1 : len, sw ? len : .1); }
function photoWall(x, z, ry, names) { const g = group(x, z, ry); box(g, 3.2, 1.4, .03, "#f4ede2", 0, 1.1, 0);
  const t = canvasTex(512, 224, (c, W, H) => { c.fillStyle = "#f4ede2"; c.fillRect(0, 0, W, H); c.fillStyle = "#7a1f2b"; c.font = "bold 26px system-ui"; c.textAlign = "center"; c.fillText("OUR TEAM", W / 2, 30);
    names.slice(0, 8).forEach((n, i) => { const px = 40 + (i % 4) * 118, py = 48 + Math.floor(i / 4) * 86; c.fillStyle = "#fff"; c.fillRect(px - 4, py - 4, 88, 78); c.fillStyle = `hsl(${(i * 47) % 360},40%,70%)`; c.fillRect(px, py, 80, 54); c.fillStyle = "#c78e5d"; c.beginPath(); c.arc(px + 40, py + 24, 13, 0, 7); c.fill(); c.fillRect(px + 24, py + 38, 32, 16); c.fillStyle = "#333"; c.font = "13px system-ui"; c.fillText(n.split(" ")[0], px + 40, py + 68); }); });
  const m = new THREE.Mesh(bgeo(3.1, 1.36, .01), new THREE.MeshStandardMaterial({ map: t, roughness: .8 })); m.position.set(0, 1.1 + .68, .025); g.add(m); }
function deskExtras(F) {
  const r = seeded("deskx" + (CUR_JOB || ""));
  (F.seats || []).forEach(d => { if (!d.g) return; const k = r();
    if (k < .35) { const pot = new THREE.Mesh(cgeo(.06, .05, .09, 10), mat(["#c0392b", "#f4f4f2", "#2c3e50"][Math.floor(r() * 3)])); pot.position.set(.62, .8, .22); d.g.add(pot); const pl = new THREE.Mesh(sgeo(.08, 8, 6), mat("#3d8b3d")); pl.scale.y = 1.2; pl.position.set(.62, .9, .22); d.g.add(pl); }
    else if (k < .6) { for (let i = 0; i < 3; i++) box(d.g, .26, .03, .2, "#f2efe6", -.55, .78 + i * .03, .25 - i * .01); }
    else if (k < .75) { const duck = new THREE.Mesh(sgeo(.04, 8, 6), mat("#ffd23f")); duck.position.set(.55, .8, .1); d.g.add(duck); }
    if (r() < .3) { const pic = box(d.g, .12, .1, .015, "#2b2622", .4, .79, .3); pic.rotation.x = -.25; }
  });
}
function deptSignature(job, lay, W, D, F) {
  const id = job.id, n = -D / 2 + .12, s = D / 2 - .12, crew = roster(job).slice(0, 8);
  if (lay === "office") {
    deskExtras(F);
    const art = (x) => frameArt(x, n, 0, id + x);
    if (id === "it") { workbench(5.2, D / 2 - .7, Math.PI); PROP.board(5.2, s, Math.PI, ["TECH BAR", "Walk-up help · No ticket needed"], { w: 2.6, h: .8, bg: "#1b5ea6", fg: "#fff", size: 40 }); wallScreen(-10.5, n, 0, "UPTIME", "big", "#4dd0e1"); }
    else if (id === "cyber") { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) wallScreen(-11.6 + i * 1.25, n, 0, ["FIREWALL", "LOGINS", "ALERTS"][i], j ? "line" : "bars", j ? "#ff4d4d" : "#4dd0e1", 1.15, .65, 1.2 + j * .72);
      PROP.door(11, -D / 2 + .15, 0, "SECURE AREA", "#3a3d52"); box(group(12.2, -D / 2 + .15, 0), .12, .18, .04, "#1d1d1d", 0, 1.2, .05); }
    else if (id === "dev") { wallScreen(-10.5, n, 0, "COMMITS THIS WEEK", "bars", "#8bc34a"); const g = group(5.3, 9.3); box(g, 2.6, .06, 1.4, "#1f6b3a", 0, .74, 0); box(g, .04, .14, 1.4, "#f4f4f2", 0, .8, 0); for (const sx of [-1.1, 1.1]) for (const sz of [-.55, .55]) box(g, .06, .74, .06, "#333", sx, 0, sz); collider(5.3, 9.3, 2.6, 1.4); }
    else if (id === "sales") { gong(4.6, D / 2 - .7); wallScreen(-10.5, n, 0, "DEALS CLOSED", "leader", "#4caf50"); }
    else if (id === "acct") { wallScreen(-10.5, n, 0, "TAX DAY IN", "big", "#ffd23f"); (F.seats || []).forEach((d, i) => { if (i % 2) for (let k = 0; k < 4; k++) box(d.g, .3, .05, .22, "#f2efe6", .45, .78 + k * .05, .2); }); }
    else if (id === "hr") { photoWall(5.2, s, Math.PI, crew); art(-10.5); PROP.plant(3.2, D / 2 - .8, 1.3); PROP.plant(7.3, D / 2 - .8, 1.3); }
    else if (id === "mgmt") { glassWall(6, -7.5, 5.2, 0); glassWall(3.4, -9.25, 3.5, Math.PI / 2); PROP.board(5.2, s, Math.PI, ["ORG CHART", "CEO → Directors → Managers → Teams"], { w: 3.2, h: 1.1, bg: "#20252c", fg: "#ffd23f", size: 36 }); art(-10.5); }
    else if (id === "support") { wallScreen(-10.5, n, 0, "CUSTOMER SATISFACTION", "big", "#8bc34a"); const t = group(4.2, D / 2 - .6); box(t, .12, 1.8, .12, "#555", 0, 0, 0); ["#e74c3c", "#f1c40f", "#2ecc71"].forEach((c, i) => { const l = new THREE.Mesh(cgeo(.1, .1, .16, 12), new THREE.MeshBasicMaterial({ color: c })); l.position.y = 1.85 + i * .18; t.add(l); }); collider(4.2, D / 2 - .6, .3, .3); }
    else if (id === "mkt") { const g = group(5.2, s, Math.PI); box(g, 3.2, 1.5, .03, "#fafafa", 0, 1, 0); for (let i = 0; i < 14; i++) { const c = box(g, .3 + Math.random() * .3, .25 + Math.random() * .3, .01, `hsl(${Math.random() * 360},65%,60%)`, -1.3 + (i % 7) * .43, 1.15 + Math.floor(i / 7) * .6, .025); c.rotation.z = (Math.random() - .5) * .3; } wallScreen(-10.5, n, 0, "CAMPAIGN REACH", "line", "#ff7a59"); }
    else if (id === "data") { wallScreen(-11.8, n, 0, "REVENUE", "line", "#4dd0e1", 1.6, .9); wallScreen(-10, n, 0, "SEGMENTS", "pie", "#ffd23f", 1.6, .9); PROP.plant(4.5, D / 2 - .8, 1.4); }
    else if (id === "bank") { stanchions(-3.6, -1.2, -4); stanchions(1.2, 3.6, -4); const atm = group(-W / 2 + .45, 1, Math.PI / 2); box(atm, .8, 1.7, .6, "#2c3e50", 0, 0, 0); const sc = new THREE.Mesh(bgeo(.4, .3, .01), new THREE.MeshBasicMaterial({ color: "#4dd0e1" })); sc.position.set(0, 1.25, .31); atm.add(sc); collider(-W / 2 + .45, 1, .6, .8); PROP.board(-W / 2 + .2, 1, Math.PI / 2, ["ATM"], { w: .8, h: .3, bg: "#1b5ea6", fg: "#fff", size: 60 }); }
    else art(-10.5);
    // general: fire extinguisher, coat rack, exit sign, more plants
    const ex = group(2.3, n + .08); const cyl = new THREE.Mesh(cgeo(.08, .08, .45, 12), mat("#c0392b", { rough: .4 })); cyl.position.y = .55; ex.add(cyl);
    const cr = group(-2.4, -D / 2 + .5); box(cr, .05, 1.8, .05, "#4a3728", 0, 0, 0); for (let i = 0; i < 4; i++) { const hk = box(cr, .25, .03, .03, "#4a3728", 0, 1.7, 0); hk.rotation.y = i * Math.PI / 4; } collider(-2.4, -D / 2 + .5, .3, .3);
  } else if (lay === "warehouse") {
    conveyor(-13.1, -8, 1); wallScreen(10.5, n, 0, "ORDERS PICKED", "bars", "#f1c40f");
    PROP.board(-W / 2 + .2, -3.5, Math.PI / 2, ["SAFETY FIRST", "Lift with your legs"], { w: 2.4, h: 1, bg: "#f1c40f", fg: "#1d1d1d", size: 40 });
  } else if (lay === "logistics") {
    wallScreen(-10.5, n, 0, "DELIVERY ROUTES", "map", "#ffd23f", 3, 1.6);
  }
}
