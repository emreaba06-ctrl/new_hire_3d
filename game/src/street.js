/* =====================================================================
   STREET: Main Street outside Brightline. Bus stop, café, parking
   entrance, moving traffic and pedestrians. The commute now goes
   home → bus or car → street → lobby, and back again.
   ===================================================================== */
function buildStreet(o = {}) {
  CUR_JOB = null; const W = 44, D = 30; E.room = { W, D, H: 30 }; E.weather = S.weather;
  buildOutside(0, false);
  const flat = (w, d, color, x, z, y = 0, rough = .9) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { rough })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; E.world.add(m); return m; };
  // ground: sidewalk (with generated concrete if available), road, far sidewalk
  const walk = flat(120, 9, "#c9c5bc", 0, -3.5, .01); if (S.gfx !== "perf" && typeof richFloorMat === "function") { const m = richFloorMat("concrete", null, 120, 9); if (m) walk.material = m; }
  flat(120, 7.4, "#3d4046", 0, 4.2, .005, .8); flat(120, 3, "#c9c5bc", 0, 9.4, .01);
  box(E.world, 120, .14, .25, "#9a968c", 0, 0, .5); box(E.world, 120, .14, .25, "#9a968c", 0, 0, 7.9);
  for (let x = -58; x < 60; x += 4) box(E.world, 2, .01, .14, "#f2e6a6", x, .012, 4.2, { cast: false });
  for (let i = 0; i < 7; i++) box(E.world, .5, .012, 6.8, "#f4f4f2", 3 + i * .9, .011, 4.2, { cast: false });
  // Brightline tower facade with entrance
  const tower = group(0, -9); const glass = new THREE.MeshStandardMaterial({ color: lin("#7fa7c9"), roughness: .08, metalness: .6, envMapIntensity: 1.3 });
  const tw = new THREE.Mesh(bgeo(18, 26, 4), glass); tw.position.y = 13; tower.add(tw);
  for (let y = 3.2; y < 26; y += 3.2) box(tower, 18.1, .12, 4.1, "#d9dde3", 0, y, 0);
  for (let x = -9; x <= 9; x += 1.8) box(tower, .1, 26, 4.1, "#d9dde3", x, 0, 0);
  box(tower, 18.4, .5, 4.4, "#20252c", 0, 0, 0); styleTowerFloors(tower); streetBuildings();
  const sign = new THREE.Mesh(bgeo(8, 1.2, .1), new THREE.MeshBasicMaterial({ map: textTex(["BRIGHTLINE CORP"], { w: 1024, h: 160, bg: "#1b5ea6", fg: "#fff", size: 96, top: 80 }) })); sign.material.userData.own = true; sign.position.set(0, 4.4, 2.08); tower.add(sign);
  const door = new THREE.Group(); door.position.set(0, 0, 2.1); tower.add(door); box(door, 3.2, 3, .2, "#1b2433", 0, 0, 0); const dg = new THREE.Mesh(bgeo(2.8, 2.6, .05), glass); dg.position.set(0, 1.4, .12); door.add(dg);
  box(door, 4, .15, 1.6, "#9aa4b0", 0, 3.05, .8);
  collider(0, -9, 18.4, 4.4); collider(-11, -7, 4, .4); collider(11, -7, 4, .4);
  addInter({ name: "Brightline entrance", verb: S.phase === "evening" ? "Go back inside" : "Walk into Brightline", x: 0, z: -6.2, r: 2, h: 3.2, action: () => goLocation("lobby", { text: "Brightline Corp" }) });
  // café
  const cafe = group(-15.5, -8.2); box(cafe, 9, 4.2, 2.4, "#8a5a3b", 0, 0, 0); const cw = new THREE.Mesh(bgeo(6, 2.2, .05), new THREE.MeshStandardMaterial({ color: lin("#f7e2b5"), emissive: lin("#ffcf8a"), emissiveIntensity: .35, roughness: .2 })); cw.position.set(-.8, 1.6, 1.23); cafe.add(cw);
  const aw = new THREE.Mesh(bgeo(9.2, .12, 1.6), mat("#c0392b")); aw.position.set(0, 3.1, 1.9); aw.rotation.x = .25; cafe.add(aw);
  const cs = new THREE.Mesh(bgeo(5, .8, .08), new THREE.MeshBasicMaterial({ map: textTex(["BEAN THERE CAFÉ"], { w: 768, h: 128, bg: "#2b1d14", fg: "#ffd23f", size: 64, top: 64 }) })); cs.material.userData.own = true; cs.position.set(0, 3.7, 1.25); cafe.add(cs);
  collider(-15.5, -8.2, 9, 2.4);
  for (const x of [-18, -14.5]) { const t = group(x, -5.2); box(t, .8, .05, .8, "#f4f4f2", 0, .74, 0); box(t, .08, .74, .08, "#333", 0, 0, 0); for (const sx of [-.6, .6]) box(t, .4, .45, .4, "#2c3e50", sx, 0, 0); collider(x, -5.2, 1.6, .9); }
  addInter({ name: "Bean There Café", verb: "Grab a coffee to go ($4)", x: -15.5, z: -6.2, r: 2, action: () => { if (S.money < 4) return toast("Not enough money."); S.money -= 4; ledger("Café coffee", -4); S.coffeeBuff = S.day; save(); hud(); Sfx.cash(); toast("Fresh coffee! You'll start your next shift with +10 energy."); } });
  // parking entrance
  const pk = group(16, -8.2); box(pk, 7, 3.6, 2.4, "#7d8794", 0, 0, 0); box(pk, 4, 2.6, .1, "#1d1f24", 0, 0, 1.22);
  const ps = new THREE.Mesh(bgeo(1.4, 1.4, .1), new THREE.MeshBasicMaterial({ map: textTex(["P"], { w: 256, h: 256, bg: "#1b5ea6", fg: "#fff", size: 180, top: 128 }) })); ps.material.userData.own = true; ps.position.set(2.8, 3, 1.25); pk.add(ps);
  collider(16, -8.2, 7, 2.4);
  if (S.car >= 1) addInter({ name: "Parking garage", verb: S.phase === "evening" ? "Get your car and drive home" : "Go to the parking garage", x: 16, z: -6.4, r: 2, action: () => S.phase === "evening" ? goLocation("home", { text: "Driving home..." }) : goLocation("garage", { text: "Parking garage" }) });
  // bus stop
  const bs = group(10, -.6); box(bs, 3, .08, 1.2, "#5d6d7e", 0, 2.4, 0); box(bs, .08, 2.4, .08, "#5d6d7e", -1.45, 0, -.5); box(bs, .08, 2.4, .08, "#5d6d7e", 1.45, 0, -.5);
  const back = new THREE.Mesh(bgeo(2.9, 1.8, .03), new THREE.MeshStandardMaterial({ color: lin("#cfe8ff"), transparent: true, opacity: .3, roughness: .05 })); back.position.set(0, 1.4, -.55); bs.add(back); box(bs, 2.4, .08, .4, "#8a6a48", 0, .45, -.3);
  const bsg = new THREE.Mesh(bgeo(.5, .5, .04), new THREE.MeshBasicMaterial({ map: textTex(["BUS", "42"], { w: 128, h: 128, bg: "#e67e22", fg: "#fff", size: 40, size2: 46 }) })); bsg.material.userData.own = true; bsg.position.set(1.7, 2.6, 0); bs.add(bsg); box(bs, .06, 2.6, .06, "#555", 1.7, 0, 0);
  collider(10, -1.1, 3, .3);
  addInter({ name: "Bus stop", verb: S.phase === "evening" ? "Take the bus home" : "Wait for the bus", x: 10, z: -1.6, r: 2, action: () => { if (S.phase === "evening") goLocation("home", { text: "Riding bus 42 home..." }); else toast("You just got off the bus. Brightline's entrance is right behind you!"); } });
  // street furniture
  for (let x = -20; x <= 20; x += 8) { const l = group(x, .1); box(l, .12, 4.5, .12, "#2b2f36", 0, 0, 0); box(l, .9, .1, .2, "#2b2f36", .4, 4.4, 0); const bulb = new THREE.Mesh(sgeo(.14, 10, 8), new THREE.MeshBasicMaterial({ color: "#fff3cf" })); bulb.position.set(.8, 4.3, 0); l.add(bulb); collider(x, .1, .25, .25); }
  for (const x of [-6, 6, -22, 22]) { const t = group(x, -2.2); box(t, 1.4, .5, 1.4, "#7d8794", 0, 0, 0); const tr = new THREE.Mesh(cgeo(.15, .2, 2.4, 8), mat("#6b4a32")); tr.position.y = 1.6; t.add(tr); const lf = new THREE.Mesh(sgeo(1.2, 12, 10), mat("#3f8a3a", { rough: .9 })); lf.position.y = 3.2; lf.scale.y = 1.2; t.add(lf); collider(x, -2.2, 1.4, 1.4); }
  for (const x of [-3, 3]) { const bn = group(x, -1.4, Math.PI); box(bn, 1.6, .08, .45, "#8a6a48", 0, .45, 0); box(bn, 1.6, .5, .06, "#8a6a48", 0, .5, -.22); for (const sx of [-.7, .7]) box(bn, .06, .45, .4, "#2b2f36", sx, 0, 0); collider(x, -1.4, 1.6, .5); }
  const hyd = group(-9, .1); const hc = new THREE.Mesh(cgeo(.14, .17, .7, 10), mat("#c0392b")); hc.position.y = .35; hyd.add(hc);
  // bounds: keep the player on this side of the street
  collider(0, 1.1, 120, .4); collider(-W / 2 - .5, -3, 1, 14); collider(W / 2 + .5, -3, 1, 14); collider(-30, -9.5, 20, 1); collider(30, -9.5, 20, 1);
  // moving traffic
  const cars = []; const colors = ["#c0392b", "#2c3e50", "#ecf0f1", "#2980b9", "#f1c40f", "#16a085", "#7f8c8d"];
  for (let i = 0; i < 6; i++) { const dir = i % 2 ? 1 : -1, g = movingCar(pick(colors), Math.random() < .2); g.position.set(-50 + i * 18, 0, dir > 0 ? 2.4 : 6); g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; cars.push({ g, dir, v: 7 + Math.random() * 5 }); }
  E.anims.push(dt => cars.forEach(c => { c.g.position.x += c.dir * c.v * dt; if (c.g.position.x > 60) c.g.position.x = -60; if (c.g.position.x < -60) c.g.position.x = 60; }));
  // bus pulls away when you arrive by bus
  if (o.byBus) { const bus = movingCar("#e67e22", true); bus.position.set(10, 0, 2.4); bus.rotation.y = Math.PI / 2; let t = 0; E.anims.push(dt => { t += dt; if (t > 1.5) bus.position.x += dt * Math.min(10, (t - 1.5) * 4); }); }
  // pedestrians
  const sx0 = o.byBus ? 10 : o.fromBuilding ? 0 : 6;
  for (let i = 0; i < 6; i++) { const nm = `${pick(FIRST)} ${pick(LAST)}`; let x = -19 + i * 7.5; if (Math.abs(x - sx0) < 4) x += 5; const p = addNPC({ kind: "guest", name: nm, role: pick(["Pedestrian", "Commuter", "Jogger", "Tourist", "Dog walker"]), look: lookFor(nm), x, z: -3.4 - (i % 2) * 1.6 }); p.speed = 1.3 + Math.random() * .7; wander(p, [[-20, -3], [-10, -4.5], [0, -3.5], [8, -4], [18, -3.2], [20, -4.8], [-4, -5]]); p.onTalk = n => npcSay(n, pick(["Nice day for a walk!", "Brightline's hiring, I heard.", "Best coffee on the street is right there.", "Bus 42 is always on time. Mostly."]), 4); }
  spawnPlayer(sx0, o.byBus ? -2.6 : o.fromBuilding ? -5.4 : -3, o.byBus ? 1 - Math.PI : o.fromBuilding ? 0 : Math.PI);
}
function movingCar(color, big) {
  const g = new THREE.Group(); E.world.add(g); const L = big ? 9 : 4, H = big ? 2.6 : .55, paint = mat(color, { rough: .25, metal: .5 }), glass = mat("#1e2a38", { rough: .1, metal: .4 }), tire = mat("#1b1b1b", { rough: .9 });
  box(g, 1.8, H, L, color, 0, .3, 0, { mat: paint }); if (!big) { box(g, 1.55, .5, 2, color, 0, .85, -.1, { mat: paint }); box(g, 1.57, .4, 1.9, "#000", 0, .9, -.1, { mat: glass }); } else box(g, 1.82, .7, L - 1, "#000", 0, 1.7, 0, { mat: glass });
  for (const [wx, wz] of [[-.85, -L / 3], [.85, -L / 3], [-.85, L / 3], [.85, L / 3]]) { const w = new THREE.Mesh(cgeo(.33, .33, .22, 14), tire); w.rotation.z = Math.PI / 2; w.position.set(wx, .33, wz); g.add(w); }
  return g;
}
