/* =====================================================================
   DECLUTTER: runs after every room is built.
   1. Removes props that overlap other props (smaller one goes).
   2. Keeps walkways clear in front of doors, the elevator and the spawn.
   3. Spaces out standing people so nobody spawns inside furniture or
      inside another person.
   ===================================================================== */
const DECL = { removed: 0, moved: 0 };
const cArea = c => (c.maxX - c.minX) * (c.maxZ - c.minZ);
const cOverlap = (a, b) => Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)) * Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
const cCenter = c => [(c.minX + c.maxX) / 2, (c.minZ + c.maxZ) / 2];
function hideObjectsAt(x, z, rad) {
  let n = 0; const npcMeshes = new Set(E.npcs.map(q => q.mesh));
  for (const o of E.world.children) {
    if (!o.isGroup || !o.visible || npcMeshes.has(o) || o.userData.keep) continue;
    if (Math.hypot(o.position.x - x, o.position.z - z) < rad && Math.abs(o.position.y) < .1) { o.visible = false; n++; }
  }
  return n;
}
function declutter() {
  if (!E.room || LOC === "title") return;
  const W = E.room.W, D = E.room.D, big = c => cArea(c) > 14 || (c.maxX - c.minX) > W * .6 || (c.maxZ - c.minZ) > D * .6;
  DECL.removed = 0; DECL.moved = 0;
  // 1. overlapping props
  const props = E.colliders.filter(c => !big(c));
  const dead = new Set();
  for (let i = 0; i < props.length; i++) for (let j = i + 1; j < props.length; j++) {
    const a = props[i], b = props[j]; if (dead.has(a) || dead.has(b)) continue;
    const ov = cOverlap(a, b), sm = Math.min(cArea(a), cArea(b)); if (ov < .04 || ov < sm * .3) continue;
    const victim = cArea(a) < cArea(b) ? a : b; const [vx, vz] = cCenter(victim);
    if (hideObjectsAt(vx, vz, .35)) { dead.add(victim); DECL.removed++; }
  }
  // 2. keep clearances
  const zones = [];
  E.inters.forEach(it => { if (/Elevator|door|Door|Exit|entrance|Training|Back to lobby/.test(it.name || "")) zones.push([it.pos.x, it.pos.z, 1.1]); });
  if (Player.mesh) zones.push([Player.mesh.position.x, Player.mesh.position.z, .9]);
  for (const c of props) { if (dead.has(c)) continue; const [cx, cz] = cCenter(c);
    for (const [zx, zz, r] of zones) { const nx = clamp(zx, c.minX, c.maxX), nz = clamp(zz, c.minZ, c.maxZ); if (Math.hypot(nx - zx, nz - zz) < r && cArea(c) < 3) { if (hideObjectsAt(cx, cz, .35)) { dead.add(c); DECL.removed++; } break; } } }
  E.colliders = E.colliders.filter(c => !dead.has(c));
  // 3. people: free spot for everyone standing
  const blocked = (x, z, r) => E.colliders.some(c => x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) || Math.abs(x) > W / 2 - .5 || Math.abs(z) > D / 2 - .5;
  const placed = [];
  for (const n of E.npcs) {
    const p = n.mesh.position, sitting = n.mode === "sit" || n.mode === "type";
    if (sitting) { placed.push(p); continue; }
    const crowded = (x, z) => placed.some(q => Math.hypot(q.x - x, q.z - z) < .75) || (Player.mesh && Math.hypot(Player.mesh.position.x - x, Player.mesh.position.z - z) < 1);
    if (blocked(p.x, p.z, .25) || crowded(p.x, p.z)) {
      let best = null;
      for (let r = .5; r < 6 && !best; r += .4) for (let a = 0; a < 16; a++) { const x = p.x + Math.cos(a / 16 * Math.PI * 2) * r, z = p.z + Math.sin(a / 16 * Math.PI * 2) * r; if (!blocked(x, z, .3) && !crowded(x, z)) { best = [x, z]; break; } }
      if (best) { p.x = best[0]; p.z = best[1]; if (n.home) { n.home.x = best[0]; n.home.z = best[1]; } DECL.moved++; }
    }
    placed.push(p);
  }
}
/* standing people keep personal space every frame (not just walkers) */
function personalSpace() {
  const list = E.npcs.filter(n => !n.path.length && n.mode !== "sit" && n.mode !== "type" && n.kind !== "reception");
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i].mesh.position, b = list[j].mesh.position, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d < .6 && d > 1e-4) { const push = (.6 - d) / 2 * .2, ux = dx / d, uz = dz / d;
      if (!blockedAt(a.x - ux * push, a.z - uz * push, .22)) { a.x -= ux * push; a.z -= uz * push; }
      if (!blockedAt(b.x + ux * push, b.z + uz * push, .22)) { b.x += ux * push; b.z += uz * push; } }
  }
}
