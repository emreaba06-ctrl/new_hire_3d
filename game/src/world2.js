/* =====================================================================
   WORLD 2: office parties, parking garage, sounds per room, wardrobe.
   ===================================================================== */

/* ---------- office parties (holiday evenings, in the cafeteria) ---------- */
function offerParty(h) {
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#c0392b">🎉 ${esc(h.name)} party!</div><div class="m-body"><p>The whole company is celebrating in the cafeteria. Want to stop by before heading home?</p><div class="row wrap"><button class="btn go" type="button" id="pY">Join the party</button><button class="btn grey" type="button" id="pN">Head home</button></div></div></div>`);
  $("#pY", ov).addEventListener("click", () => { ov.close(); goLocation("cafe", { party: h, text: `${h.name} party` }); });
  $("#pN", ov).addEventListener("click", () => ov.close());
}
function partyDecor(h) {
  E.partyOn = true;
  const W = E.room.W, D = E.room.D; const cols = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
  for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(sgeo(.18, 10, 8), mat(cols[i % cols.length], { rough: .3 })); b.scale.y = 1.2; const x = -W / 2 + 1 + Math.random() * (W - 2), z = -D / 2 + 1 + Math.random() * (D - 2); b.position.set(x, 2.6 + Math.random() * .4, z); E.world.add(b); const ph = Math.random() * 6; E.anims.push(() => b.position.y = 2.7 + Math.sin(E.t + ph) * .08); }
  PROP.board(0, D / 2 - .2, Math.PI, [`HAPPY ${h.name.toUpperCase()}!`, "Thanks for a great year, team"], { w: 6, h: 1.4, bg: "#c0392b", fg: "#fff", size: 50 });
  const dancers = []; for (let i = 0; i < 6; i++) { const nm = `${pick(FIRST)} ${pick(LAST)}`; const n = addNPC({ kind: "npc", name: nm, role: "Party guest", look: lookFor(nm), x: -3 + (i % 3) * 3, z: 7 + Math.floor(i / 3) * 1.4, ry: Math.PI }); n.onTalk = m => npcSay(m, pick(["Great party, right?", "The DJ is my cousin. He's... trying.", "Best year at Brightline yet!", "Have you tried the cake?"]), 4); dancers.push(n); }
  E.anims.push(() => { if (Math.random() < .03) npcEmote(pick(dancers), "cheer", 1.2); });
  let toasted = false;
  addInter({ name: "Microphone", verb: "Give a toast", x: 0, z: D / 2 - 1.4, r: 1.6, mark: () => toasted ? "" : "!", action: () => {
    if (toasted) return toast("You already gave a toast. Enjoy the party!");
    const ov = overlay(`<div class="panel modal"><div class="bar">Give a toast</div><div class="m-body"><p>Everyone turns to you, holding their drinks. What do you say?</p><div class="opts">${shuffle([["Thank the team for their hard work, and name a few people who helped you.", 3], ["Tell a long story about yourself.", 0], ["Make an inside joke only two people get.", -1]]).map(([t, v]) => `<button class="opt" type="button" data-v="${v}"><span class="radio"></span>${esc(t)}</button>`).join("")}</div></div></div>`);
    $$("[data-v]", ov).forEach(b => b.addEventListener("click", () => { toasted = true; const v = +b.dataset.v; S.rep = clamp(S.rep + v, 0, 100); save(); ov.close(); toast(v > 0 ? "Cheers all around! +3 reputation." : v < 0 ? "Crickets. Only two people laughed. −1 reputation." : "Polite applause."); if (v > 0) { dancers.forEach(n => npcEmote(n, "cheer", 1.5)); award("party"); } }));
  } });
}

/* ---------- parking garage (if you own a vehicle) ---------- */
function buildGarage() {
  CUR_JOB = null; const W = 24, D = 18; E.weather = "cloud"; buildRoom(W, D, "concrete", "#8c8f94", "#a9adb3", { noLamps: false, blinds: false });
  elevator(-D / 2); addInter({ name: "Elevator", verb: "Take the elevator up", x: 0, z: -D / 2 + 1.4, r: 2, h: 3.2, action: openElevator });
  PROP.board(-6, -D / 2 + .2, 0, ["P2 · BRIGHTLINE PARKING", "Employees only"], { w: 4.2, h: 1.2, bg: "#f1c40f", fg: "#1d1d1d", size: 44 });
  for (const x of [-8, 0, 8]) for (const z of [-2, 5]) { if (x === 0 && z === -2) continue; box(E.world, .6, 3.2, .6, "#b8bcc2", x, 0, z); collider(x, z, .6, .6); }
  const lineMat = new THREE.MeshBasicMaterial({ color: "#f4f4f2" });
  for (let i = 0; i < 9; i++) { const x = -10 + i * 2.5; for (const z of [1.5, 8]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.1, 4), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(x, .012, z); E.world.add(l); } }
  const spots = []; for (let i = 0; i < 8; i++) for (const z of [1.5, 8]) spots.push([-8.75 + i * 2.5, z]);
  const mine = spots[2]; const kind = S.car;
  shuffle(spots.filter(s => s !== mine)).slice(0, 7).forEach(([x, z]) => parkedCar(x, z, pick(["#c0392b", "#2c3e50", "#ecf0f1", "#7f8c8d", "#2980b9", "#16a085"]), 3));
  if (kind >= 3) parkedCar(mine[0], mine[1], kind === 4 ? "#ffd23f" : "#3a7bd5", kind, true);
  else { const g = group(mine[0], mine[1]); box(g, .1, .9, 1.4, "#333", 0, .1, 0); box(g, .1, .1, 1.4, kind === 1 ? "#27ae60" : "#e67e22", 0, .9, 0); const wheel = new THREE.TorusGeometry(.32, .05, 8, 18); [-.6, .6].forEach(z => { const w = new THREE.Mesh(wheel, mat("#1d1d1d")); w.position.set(0, .34, z); w.rotation.y = Math.PI / 2; g.add(w); }); }
  addInter({ name: `Your ${CARS[kind].name.toLowerCase()}`, verb: "Admire your ride", x: mine[0], z: mine[1] - 2.2, r: 1.8, action: () => toast(pick([`Looking good. Remember: car insurance and gas are real monthly costs.`, `Parked perfectly. Mostly.`, `Your ${CARS[kind].name.toLowerCase()} gleams under the garage lights.`])) });
  spawnPlayer(mine[0] + 1.25, 4.8, Math.PI);
}
function parkedCar(x, z, color, tier, mine) {
  const g = group(x, z, Math.PI); const paint = mat(color, { rough: .25, metal: .5 }), glass = mat("#1e2a38", { rough: .1, metal: .4 }), tire = mat("#1b1b1b", { rough: .9 });
  box(g, 1.7, .55, 3.9, color, 0, .3, 0, { mat: paint }); box(g, 1.5, .5, 2, color, 0, .85, -.1, { mat: paint }); box(g, 1.52, .4, 1.9, "#000", 0, .9, -.1, { mat: glass });
  for (const [wx, wz] of [[-.8, -1.2], [.8, -1.2], [-.8, 1.25], [.8, 1.25]]) { const w = new THREE.Mesh(cgeo(.33, .33, .22, 16), tire); w.rotation.z = Math.PI / 2; w.position.set(wx, .33, wz); g.add(w); }
  const hl = new THREE.MeshBasicMaterial({ color: "#fff6d5" }); [-.55, .55].forEach(lx => { const l = new THREE.Mesh(bgeo(.3, .1, .02), hl); l.position.set(lx, .55, 1.96); g.add(l); });
  collider(x, z, 1.8, 4);
}

/* ---------- sounds per room ---------- */
let roomSfxT = 3;
function roomSounds(dt) {
  if (S.muted || !Sfx.ctx || E.uiOpen) return; roomSfxT -= dt; if (roomSfxT > 0) return;
  if (LOC === "roof") { roomSfxT = 2 + Math.random() * 5; const f = 2200 + Math.random() * 1400; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) Sfx.tone(f + Math.random() * 300, .06, "sine", .015, i * .09, f * 1.3); }
  else if (LOC === "garage") { roomSfxT = 6 + Math.random() * 10; if (Math.random() < .5) { Sfx.tone(1050, .12, "square", .015); Sfx.tone(1050, .12, "square", .015, .18); } else Sfx.tone(55, 1.6, "sawtooth", .02, 0, 40); }
  else if (LOC === "cafe") { roomSfxT = 1 + Math.random() * 3; Sfx.tone(3200 + Math.random() * 1500, .04, "triangle", .01); }
  else if (LOC === "home") { roomSfxT = 1; if (S.phase === "evening" && Math.random() < .15) Sfx.tone(1900, .02, "sine", .006); }
  else roomSfxT = 5;
}

/* ---------- wardrobe ---------- */
const WARDROBE = [
  { id: "hoodie", name: "Hacker hoodie", hex: "#22262e", price: 60 }, { id: "blazer", name: "Gold blazer", hex: "#c9a227", price: 150 },
  { id: "hawaii", name: "Vacation red", hex: "#d64545", price: 45 }, { id: "mint", name: "Mint polo", hex: "#7fd1b9", price: 40 },
  { id: "lav", name: "Lavender button-up", hex: "#a98fd8", price: 50 }, { id: "orange", name: "Safety orange", hex: "#ff7a1a", price: 35 },
  { id: "navy", name: "Navy suit shirt", hex: "#1f3a68", price: 80 }, { id: "pink", name: "Hot pink tee", hex: "#ff5fa2", price: 40 }
];
function openWardrobe() {
  const owned = S.outfits && typeof S.outfits === "object" && !Array.isArray(S.outfits) ? S.outfits : {}; const cur = S.player.look.shirtHex || "";
  const ov = overlay(`<div class="panel modal"><div class="bar">👕 Wardrobe</div><div class="m-body"><p>Buy new shirts and wear them anywhere (department uniforms still apply at work).</p>
    <div class="shop">${WARDROBE.map(w => `<div class="item ${owned[w.id] ? "own" : ""}"><b><span class="swatch" style="background:${w.hex}"></span> ${esc(w.name)}</b><span class="small">${owned[w.id] ? "Owned" : money(w.price)}</span>${owned[w.id] ? (cur === w.hex ? '<span class="chip">Wearing</span>' : `<button class="btn sm go" type="button" data-wear="${w.id}">Wear</button>`) : `<button class="btn sm" type="button" data-buy="${w.id}">Buy</button>`}</div>`).join("")}</div>
    <div class="row wrap"><button class="btn grey" type="button" id="wDef">Wear my regular shirt</button><button class="btn grey" type="button" id="wMir">Change my look</button><button class="btn grey" type="button" id="wx">Close</button></div></div></div>`);
  const redo = () => { ov.close(); spawnPlayerKeep(); openWardrobe(); };
  $$("[data-buy]", ov).forEach(b => b.addEventListener("click", () => { const w = WARDROBE.find(x => x.id === b.dataset.buy); if (S.money < w.price) { toast("Not enough money."); Sfx.bad(); return; } S.money -= w.price; ledger("Clothes: " + w.name, -w.price); S.outfits = Object.assign({}, owned, { [w.id]: S.day }); S.player.look.shirtHex = w.hex; save(); hud(); Sfx.cash(); if (Object.keys(S.outfits).length >= 4) award("fashion"); redo(); }));
  $$("[data-wear]", ov).forEach(b => b.addEventListener("click", () => { S.player.look.shirtHex = WARDROBE.find(x => x.id === b.dataset.wear).hex; save(); hud(); redo(); }));
  $("#wDef", ov).addEventListener("click", () => { delete S.player.look.shirtHex; save(); hud(); redo(); });
  $("#wMir", ov).addEventListener("click", () => { ov.close(); openCreator(false); });
  $("#wx", ov).addEventListener("click", () => ov.close());
}
function spawnPlayerKeep() { if (!Player.mesh) return; const p = Player.mesh.position.clone(), yaw = E.yaw; spawnPlayer(p.x, p.z, 0); E.yaw = yaw; }
