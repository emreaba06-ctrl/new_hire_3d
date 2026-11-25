/* =====================================================================
   FIXES: keep characters from walking through furniture or each other,
   wandering that only picks clear paths, a proper trophy cabinet.
   ===================================================================== */
const blockedAt = (x, z, r = .28) => E.colliders.some(c => x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ);
function segClear(ax, az, bx, bz) { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / .25)); for (let i = 1; i <= n; i++) { const t = i / n; if (blockedAt(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }
function pickClear(n) {
  const p = n.mesh.position;
  for (const w of shuffle(n.wpts || [])) if (segClear(p.x, p.z, w[0], w[1])) return w;
  // try a nearby random spot as a fallback
  for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, d = 1 + Math.random() * 2.5, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (Math.abs(x) < E.room.W / 2 - .6 && Math.abs(z) < E.room.D / 2 - .6 && segClear(p.x, p.z, x, z)) return [x, z]; }
  return null;
}
/* wandering visitors work in every location (not just department floors) */
function wanderTick(dt) {
  for (const n of E.npcs) if (n.life === "wanderFree" && !n.path.length && (n.next -= dt) < 0) { const w = pickClear(n); if (w) walkTo(n, [w]); n.next = 3 + Math.random() * 6; }
}
/* called after an NPC takes a step */
function npcStep(n, p, prev) {
  if (n.life === "wanderFree" && blockedAt(p.x, p.z, .25)) { p.copy(prev); n.path = []; n.next = .5; return; }
  for (const m of E.npcs) {
    if (m === n) continue; const q = m.mesh.position, dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz), r = m.mode === "sit" || m.mode === "type" ? .45 : .55;
    if (d < r && d > 1e-4) { const idle = !m.path.length && m.mode !== "sit" && m.mode !== "type" && m.kind !== "mentor" && m.kind !== "reception";
      if (idle) { const mx = q.x - dx / d * .03, mz = q.z - dz / d * .03; if (!blockedAt(mx, mz, .25)) { q.x = mx; q.z = mz; } }
      const nx = q.x + dx / d * r, nz = q.z + dz / d * r; if (n.life !== "wanderFree" || !blockedAt(nx, nz, .25)) { p.x = nx; p.z = nz; } }
  }
}
/* pets also avoid furniture */
function petMove(pet, tgt, speed, dt) {
  const v = V3(tgt.x - pet.position.x, 0, tgt.z - pet.position.z); if (v.length() < .2) return true;
  v.normalize(); const nx = pet.position.x + v.x * dt * speed, nz = pet.position.z + v.z * dt * speed;
  if (blockedAt(nx, nz, .2)) return true; pet.position.set(nx, 0, nz); pet.rotation.y = Math.atan2(v.x, v.z); return false;
}
/* trophy shelf becomes a real cabinet instead of two floating planks */
{ const orig = PROP.trophyShelf; PROP.trophyShelf = function (x, z, ry, n) {
  orig.call(PROP, x, z, ry, n); const g = group(x, z, ry); const wood = "#6b4a32";
  box(g, 2.3, 2.1, .04, "#5a3e2b", 0, 0, -.24); box(g, .06, 2.1, .5, wood, -1.13, 0, 0); box(g, .06, 2.1, .5, wood, 1.13, 0, 0); box(g, 2.3, .08, .5, wood, 0, 2.1, 0); box(g, 2.2, .55, .48, wood, 0, 0, 0);
  if (!n) { const t = textTex(["TROPHIES", "Earn achievements to fill me!"], { w: 512, h: 128, bg: "#3b2a1a", fg: "#f5c518", size: 40, size2: 22 }); const lab = new THREE.Mesh(bgeo(1.2, .3, .01), new THREE.MeshBasicMaterial({ map: t })); lab.material.userData.own = true; lab.position.set(0, .3, .25); g.add(lab); }
  const sw = Math.abs(Math.sin(ry)) > .7; collider(x, z, sw ? .55 : 2.3, sw ? 2.3 : .55);
}; }

/* lobby directory: every floor fits, two columns */
function directoryBoard(x, z) {
  const fl = JOBS.slice().sort((a, b) => a.floor - b.floor); const half = Math.ceil(fl.length / 2);
  const t = canvasTex(1024, 500, (g, w, h) => {
    g.fillStyle = "#20252c"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffd23f"; g.font = "bold 54px system-ui, sans-serif"; g.textAlign = "center"; g.fillText("DIRECTORY", w / 2, 62);
    g.textAlign = "left"; g.font = "29px system-ui, sans-serif"; g.fillStyle = "#f4f4f2";
    fl.forEach((j, i) => { const col = i < half ? 0 : 1, row = i < half ? i : i - half; g.fillText(`${j.floor}  ${j.dept}`, 60 + col * 490, 112 + row * 44); });
    g.fillText("C  Cafeteria", 60 + 490, 112 + (fl.length - half) * 44);
  });
  const grp = group(x, z, 0); box(grp, 3.76, 1.91, .08, "#9aa4b0", 0, 1.12, 0);
  const m = new THREE.Mesh(bgeo(3.6, 1.75, .02), new THREE.MeshBasicMaterial({ map: t })); m.material.userData.own = true; m.position.set(0, 1.2 + .875, .05); grp.add(m);
}
