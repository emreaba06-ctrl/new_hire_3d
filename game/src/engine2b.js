/* =====================================================================
   3D ENGINE v2 (part B): better props, characters with faces,
   first-person camera and controls.
   ===================================================================== */
PROP.desk = function (x, z, ry = 0, o = {}) {
  const g = group(x, z, ry);
  box(g, 1.7, .05, .85, o.top || "#d9c6a5", 0, .72, 0, { m: { rough: .45 } });
  box(g, .05, .72, .8, "#6f7a86", -.82, 0, 0, { m: { metal: .6, rough: .35 } }); box(g, .05, .72, .8, "#6f7a86", .82, 0, 0, { m: { metal: .6, rough: .35 } }); box(g, 1.6, .38, .03, "#8f99a5", 0, .32, .38);
  box(g, .06, .2, .06, "#2a2e33", 0, .77, .2, { m: { metal: .7, rough: .3 } }); box(g, .26, .015, .18, "#2a2e33", 0, .77, .2, { m: { metal: .7, rough: .3 } });
  box(g, .76, .45, .035, "#16191d", 0, .95, .22, { m: { rough: .3 } });
  const scr = new THREE.Mesh(bgeo(.7, .39, .005), o.cubicle && Math.random() < .55 ? screenRings() : screenUI(o.screen || "#2a7fd4")); scr.position.set(0, 1.175, .2); scr.rotation.y = Math.PI; g.add(scr);
  box(g, .46, .02, .15, "#2b2f36", 0, .77, -.12, { m: { rough: .5 } }); box(g, .07, .025, .11, "#2b2f36", .36, .77, -.12);
  box(g, .09, .11, .09, pick(["#e2513a", "#2a7fd4", "#f5f5f5", "#3a9e2e"]), -.6, .77, -.18);
  if (o.cubicle && Math.random() < .7) PROP.clutter(g, Math.random() < .5 ? 1 : -1);
  if (!o.noChair) PROP.chair(g, 0, -.8, o.chair || "#5a5148");
  if (o.phone || o.cubicle) { box(g, .24, .06, .2, "#e9e4da", -.58, .77, .08, { m: { rough: .4 } }); const hs = box(g, .22, .05, .06, "#e9e4da", -.58, .83, .14, { m: { rough: .4 } }); box(g, .05, .02, .05, "#3a3a3a", -.62, .83, .03); }
  if (o.cubicle) {
    const fab = S.gfx !== "perf" ? fabricMat(o.cubicle) : mat(o.cubicle, { rough: .95 }), trim = mat("#c8bfae", { rough: .5 });
    const back = new THREE.Mesh(bgeo(1.82, 1.22, .06), fab); back.position.set(0, .61, .47); back.castShadow = back.receiveShadow = true; g.add(back);
    const side = new THREE.Mesh(bgeo(.06, 1.22, .95), fab); side.position.set(.9, .61, 0); side.castShadow = side.receiveShadow = true; g.add(side);
    box(g, 1.86, .04, .08, "#c8bfae", 0, 1.22, .47, { mat: trim, cast: false }); box(g, .08, .04, .99, "#c8bfae", .9, 1.22, 0, { mat: trim, cast: false });
    const notes = ["#ffe066", "#ff9ec7", "#9fe6a0", "#8fd3ff"]; for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++) { const n = new THREE.Mesh(bgeo(.09, .09, .004), mat(pick(notes), { rough: .9 })); n.position.set(-.75 + Math.random() * 1.5, .95 + Math.random() * .2, .438); n.rotation.z = (Math.random() - .5) * .3; g.add(n); }
    for (let i = 0; i < 2; i++) { const pp = new THREE.Mesh(bgeo(.22, .005, .3), mat("#f7f5ef", { rough: .9 })); pp.position.set(.45 + i * .03, .752 + i * .006, -.05); pp.rotation.y = (Math.random() - .5) * .4; g.add(pp); }
    PROP.bin(g, .62, -.55);
  }
  const w = Math.abs(Math.sin(ry)) > .7; const cw = o.cubicle ? 1.9 : 1.75, cd = o.cubicle ? 1.05 : .95; collider(x, z, w ? cd : cw, w ? cw : cd);
  const seat = new THREE.Vector3(0, 0, -.8).applyAxisAngle(V3(0, 1, 0), ry).add(V3(x, 0, z));
  return { g, seat, ry, screen: scr };
};
let RINGS = null;
function screenRings() {
  if (RINGS) return RINGS;
  const t = canvasTex(256, 144, (g, w, h) => { g.fillStyle = "#1a1030"; g.fillRect(0, 0, w, h); ["#ff3fa4", "#ffd23f", "#3fd2ff", "#7dff6a", "#b45cff"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.arc(70 + i * 30, 72 + (i % 2 ? 14 : -10), 30, 0, 7); g.stroke(); }); });
  return (RINGS = new THREE.MeshBasicMaterial({ map: t }));
}
PROP.bin = function (parent, x, z) { const b = new THREE.Mesh(cgeo(.15, .12, .34, 14), mat("#e6e6e2", { rough: .6 })); b.position.set(x, .17, z); b.castShadow = true; parent.add(b); const r = new THREE.Mesh(new THREE.TorusGeometry(.15, .012, 6, 18), mat("#cfcfca")); r.rotation.x = Math.PI / 2; r.position.set(x, .34, z); parent.add(r); };
function scatterClutter(W, D, avoid) {
  const paper = mat("#f4f2ea", { rough: .95 });
  for (let i = 0; i < 26; i++) { const x = (Math.random() - .5) * (W - 2), z = (Math.random() - .5) * (D - 2); if (avoid && avoid(x, z)) continue;
    if (Math.random() < .6) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.06 + Math.random() * .03, 0), paper); ball.position.set(x, .06, z); ball.rotation.set(Math.random() * 3, Math.random() * 3, 0); ball.castShadow = true; E.world.add(ball); }
    else { const sh = new THREE.Mesh(bgeo(.22, .003, .3), paper); sh.position.set(x, .004, z); sh.rotation.y = Math.random() * 3; E.world.add(sh); } }
  for (let i = 0; i < 4; i++) { const x = (i % 2 ? 1 : -1) * (W / 2 - .6), z = -D / 4 + (i > 1 ? D / 2.5 : 0); PROP.bin(E.world, x, z); }
}
PROP.chair = function (parent, x, z, color) {
  const c = new THREE.Group(); c.position.set(x, 0, z); parent.add(c);
  const fab = mat(color, { rough: .85 }), dark = mat("#1e2125", { rough: .4, metal: .4 });
  const seat = new THREE.Mesh(bgeo(.5, .08, .48), fab); seat.position.y = .46; seat.castShadow = true; c.add(seat);
  const back = new THREE.Mesh(bgeo(.48, .55, .07), fab); back.position.set(0, .8, -.24); back.rotation.x = -.08; back.castShadow = true; c.add(back);
  const pole = new THREE.Mesh(cgeo(.03, .03, .36, 8), dark); pole.position.y = .25; c.add(pole);
  for (let i = 0; i < 5; i++) { const leg = new THREE.Mesh(bgeo(.04, .03, .3), dark); const a = i / 5 * Math.PI * 2; leg.position.set(Math.sin(a) * .15, .06, Math.cos(a) * .15); leg.rotation.y = a; c.add(leg); const wh = new THREE.Mesh(sgeo(.03, 8, 6), dark); wh.position.set(Math.sin(a) * .29, .03, Math.cos(a) * .29); c.add(wh); }
  return c;
};
PROP.plant = function (x, z, s = 1) {
  const g = group(x, z); const pot = new THREE.Mesh(cgeo(.24 * s, .18 * s, .45 * s, 16), mat("#c2683a", { rough: .8 })); pot.position.y = .225 * s; pot.castShadow = true; g.add(pot);
  const soil = new THREE.Mesh(cgeo(.22 * s, .22 * s, .02, 16), mat("#3b2a1c")); soil.position.y = .44 * s; g.add(soil);
  const leaf = mat("#3f9a3a", { rough: .7 }), leaf2 = mat("#57b34a", { rough: .7 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.random() * .3, up = .5 + Math.random() * .5; const l = new THREE.Mesh(sgeo(.14 * s, 8, 6), i % 2 ? leaf : leaf2); l.scale.set(.45, 1.6, .2); l.position.set(Math.sin(a) * .16 * s, (.45 + up * .45) * s, Math.cos(a) * .16 * s); l.rotation.set(Math.cos(a) * .6, 0, -Math.sin(a) * .6); l.castShadow = true; g.add(l); }
  collider(x, z, .55 * s, .55 * s);
};

PROP.clock = function (x, z, ry, y = 2.35, r = .32) {
  const g = group(x, z, ry); g.position.y = y;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .045, 10, 32), mat("#2a7fd4", { rough: .3 })); g.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 32), basicMat({ map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#fbfbf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#222"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 30px Ubuntu, sans-serif"; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(i, 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); } for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; c.fillRect(128 + Math.sin(a) * 118 - 1, 128 - Math.cos(a) * 118 - 1, 2, i % 5 ? 2 : 6); } }) })); face.position.z = .01; g.add(face);
  const hm = mat("#1d1d1d"); const hh = new THREE.Group(), mh = new THREE.Group(); [hh, mh].forEach(p => { p.position.z = .02; g.add(p); });
  const a1 = new THREE.Mesh(bgeo(.025, r * .55, .01), hm); a1.position.y = r * .25; hh.add(a1); const a2 = new THREE.Mesh(bgeo(.016, r * .8, .01), hm); a2.position.y = r * .38; mh.add(a2);
  const sec = new THREE.Group(); sec.position.z = .025; g.add(sec); const s1 = new THREE.Mesh(bgeo(.006, r * .85, .005), mat("#d6342c")); s1.position.y = r * .4; sec.add(s1);
  E.anims.push(() => { const hr = typeof hourNow === "function" ? hourNow() : 9; hh.rotation.z = -((hr % 12) / 12) * Math.PI * 2; mh.rotation.z = -((hr % 1)) * Math.PI * 2; sec.rotation.z = -(E.t % 60) / 60 * Math.PI * 2; });
};
PROP.cork = function (x, z, ry, y = 1.75, w = 1.3, h = .85) {
  const g = group(x, z, ry); box(g, w + .08, h + .08, .04, "#8a6a48", 0, y - (h + .08) / 2, 0); const cork = box(g, w, h, .02, "#c79a62", 0, y - h / 2, .025, { m: { rough: 1 } });
  const notes = ["#ffe066", "#ff9ec7", "#9fe6a0", "#8fd3ff", "#ffffff"]; for (let i = 0; i < 6; i++) { const n = new THREE.Mesh(bgeo(.16, .16, .005), mat(pick(notes), { rough: .9 })); n.position.set(-w / 2 + .15 + Math.random() * (w - .3), y - .15 - Math.random() * (h - .3), .04); n.rotation.z = (Math.random() - .5) * .35; g.add(n); const pin = new THREE.Mesh(sgeo(.012, 6, 4), mat(pick(["#d6342c", "#2a7fd4", "#f5b800"]))); pin.position.set(n.position.x, n.position.y + .06, .05); g.add(pin); }
  return g;
};
PROP.clutter = function (g, side = 1) {
  const items = [
    () => { const s = box(g, .2, .06, .06, "#d6342c", .5 * side, .77, -.25, { m: { rough: .35 } }); s.rotation.y = .3; },
    () => { const p = new THREE.Mesh(cgeo(.06, .05, .09, 10), mat("#c2683a")); p.position.set(.62 * side, .82, .2); g.add(p); const c = new THREE.Mesh(cgeo(.035, .04, .14, 8), mat("#4f9a3a", { rough: .8 })); c.position.set(.62 * side, .93, .2); g.add(c); },
    () => { const d = new THREE.Mesh(new THREE.TorusGeometry(.055, .028, 10, 20), mat("#f4b8d0", { rough: .6 })); d.rotation.x = Math.PI / 2; d.position.set(.3 * side, .8, -.28); g.add(d); },
    () => { for (let i = 0; i < 3; i++) box(g, .16, .04, .23, pick(["#2a7fd4", "#c0392b", "#27ae60", "#f39c12"]), -.45 * side, .77 + i * .04, .22, { m: { rough: .8 } }); },
    () => { const l = new THREE.Group(); l.position.set(-.7 * side, .77, .25); g.add(l); const lm = mat("#2f6fb5", { rough: .3, metal: .3 }); const b = new THREE.Mesh(cgeo(.08, .09, .03, 14), lm); l.add(b); const arm = new THREE.Mesh(cgeo(.012, .012, .42, 6), lm); arm.position.set(0, .2, 0); arm.rotation.z = .35 * side; l.add(arm); const sh = new THREE.Mesh(new THREE.ConeGeometry(.09, .12, 14, 1, true), lm); sh.position.set(-.08 * side, .4, -.05); sh.rotation.x = 2.4; l.add(sh); const bulb = new THREE.Mesh(sgeo(.03, 8, 6), mat("#fff6d0", { emissive: "#ffe6a0", emissiveIntensity: 2 })); bulb.position.set(-.08 * side, .37, -.02); l.add(bulb); }
  ];
  shuffle(items).slice(0, 2 + Math.floor(Math.random() * 2)).forEach(f => f());
};
PROP.myCubicle = function (x, z, color) {
  const g = group(x, z, Math.PI); const fab = mat(color || "#6b4f3a", { rough: .95 });
  const back = new THREE.Mesh(bgeo(2.6, 1.6, .07), fab); back.position.set(0, .8, 0); back.castShadow = back.receiveShadow = true; g.add(back);
  box(g, 2.64, .05, .1, "#c8bfae", 0, 1.6, 0, { cast: false });
  const cork = new THREE.Group(); cork.position.set(-.55, 0, .04); g.add(cork); box(cork, 1.06, .66, .02, "#c79a62", 0, .85, 0, { m: { rough: 1 } }); box(cork, 1.12, .72, .015, "#8a6a48", 0, .82, -.01);
  ["#ffe066", "#ff9ec7", "#9fe6a0", "#8fd3ff"].forEach((c, i) => { const n = new THREE.Mesh(bgeo(.17, .17, .005), mat(c, { rough: .9 })); n.position.set(-.35 + i * .23, 1.2 - (i % 2) * .25, .02); n.rotation.z = (Math.random() - .5) * .3; cork.add(n); });
  const shelf = new THREE.Group(); shelf.position.set(.65, 1.2, .14); g.add(shelf); box(shelf, .9, .04, .22, "#a07850", 0, 0, 0);
  for (let i = 0; i < 4; i++) box(shelf, .07, .24 + Math.random() * .06, .17, pick(["#c0392b", "#2980b9", "#27ae60", "#8e44ad"]), -.38 + i * .08, .04, 0, { m: { rough: .8 } });
  const mug = new THREE.Mesh(cgeo(.045, .04, .1, 12), mat("#2a7fd4", { rough: .3 })); mug.position.set(.05, .09, 0); shelf.add(mug);
  const ball = new THREE.Mesh(sgeo(.06, 16, 12), mat("#1d1d1d", { rough: .15, metal: .2 })); ball.position.set(.25, .1, 0); shelf.add(ball);
  const cact = new THREE.Mesh(cgeo(.03, .035, .13, 8), mat("#4f9a3a")); cact.position.set(.38, .11, 0); shelf.add(cact);
  E._myClockPos = [x, z]; return g;
};
function buildHands(look) {
  if (E.hands) E.camera.remove(E.hands);
  const h = new THREE.Group(); const skin = mat(SKINS[look.skin] || SKINS[0], { rough: .6 }), sleeve = mat(look.shirtHex || SHIRTS[look.shirt] || SHIRTS[0], { rough: .85 });
  const mk = side => { const a = new THREE.Group(); const sl = new THREE.Mesh(cgeo(.055, .06, .3, 12), sleeve); sl.rotation.x = Math.PI / 2; sl.position.z = .14; a.add(sl);
    const palm = new THREE.Mesh(sgeo(.06, 14, 10), skin); palm.scale.set(1, .55, 1.3); a.add(palm); const th = new THREE.Mesh(sgeo(.024, 8, 6), skin); th.scale.set(1, 1, 1.8); th.position.set(-.055 * side, .01, -.03); a.add(th);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(cgeo(.014, .013, .07, 6), skin); f.rotation.x = Math.PI / 2; f.position.set((-.03 + i * .02) * side, .01, -.1); a.add(f); }
    a.position.set(.27 * side, -.3, -.5); a.rotation.set(-.15, .25 * side, 0); h.add(a); return a; };
  h.userData = { R: mk(1), L: mk(-1) }; if (typeof handsGear === "function") handsGear(h); E.hands = h; E.camera.add(h);
}
/* ---------- people ---------- */
const PANTS = ["#2f3e52", "#5b4636", "#1f1f24", "#6d7f91", "#3a5a40"];
function makePerson(look) {
  const g = new THREE.Group();
  const skinHex = SKINS[look.skin] || SKINS[0];
  const skin = mat(skinHex, { rough: .6 }), shirt = mat(SHIRTS[look.shirt] || SHIRTS[0], { rough: .85 }), pants = mat(PANTS[look.pants || 0], { rough: .85 }), hair = mat(HAIRS[look.hair] || HAIRS[0], { rough: .55 }), shoe = mat("#1b1b1b", { rough: .35 }), white = mat("#ffffff", { rough: .3 }), iris = mat(["#4a2e1a", "#2f5f8a", "#3b6b3a", "#1d1d1d"][look.skin % 4], { rough: .2 });
  const M = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; (p || g).add(o); return o; };
  const body = new THREE.Group(); g.add(body);
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-.11, .84, 0); legR.position.set(.11, .84, 0); body.add(legL, legR);
  [legL, legR].forEach(l => { M(cgeo(.085, .07, .8, 12), pants, 0, -.4, 0, l); const sh = M(sgeo(.08, 12, 8), shoe, 0, -.8, .05, l); sh.scale.set(1, .55, 1.7); });
  const torso = M(cgeo(.24, .2, .6, 16), shirt, 0, 1.13, 0, body); torso.scale.z = .72;
  M(cgeo(.205, .205, .06, 16), mat("#2b2b2b", { rough: .5 }), 0, .85, 0, body).scale.z = .74;
  [-.23, .23].forEach(x => M(sgeo(.1, 12, 10), shirt, x, 1.38, 0, body));
  const collar = M(cgeo(.09, .12, .06, 12), white, 0, 1.44, .01, body); collar.scale.z = .8;
  M(cgeo(.06, .065, .1, 10), skin, 0, 1.48, 0, body);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-.29, 1.37, 0); armR.position.set(.29, 1.37, 0); body.add(armL, armR);
  [armL, armR].forEach(a => { M(cgeo(.065, .055, .56, 10), shirt, 0, -.28, 0, a); M(sgeo(.06, 10, 8), skin, 0, -.59, 0, a); });
  const head = new THREE.Group(); head.position.set(0, 1.5, 0); head.scale.setScalar(1.32); body.add(head);
  const skull = M(sgeo(.19, 24, 18), skin, 0, .19, 0, head); skull.scale.set(1, 1.1, 1);
  [-.19, .19].forEach(x => M(sgeo(.045, 10, 8), skin, x, .18, -.01, head).scale.set(.5, 1, .8));
  M(sgeo(.022, 10, 8), mat(shade(skinHex, -.03), { rough: .6 }), 0, .165, .188, head).scale.set(1, 1.15, 1.1);
  const eyes = [-.07, .07].map(x => { const e = new THREE.Group(); e.position.set(x, .22, .158); head.add(e); const w = M(sgeo(.036, 14, 10), white, 0, 0, 0, e); w.scale.z = .55; M(sgeo(.019, 10, 8), iris, 0, 0, .017, e); M(sgeo(.008, 6, 4), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: .5 }), .007, .007, .028, e); return e; });
  [-.07, .07].forEach(x => { const b = M(bgeo(.075, .014, .02), hair, x, .275, .17, head); b.rotation.z = x > 0 ? -.12 : .12; });
  const mouth = M(sgeo(.034, 12, 8), mat("#7a2e2a", { rough: .5 }), 0, .1, .168, head); mouth.scale.set(1, .25, .45);
  const st = look.style || 0;
  const cap = M(sgeo(.205, 24, 14, 0, Math.PI * 2, 0, Math.PI * (st === 3 ? .42 : .52)), hair, 0, .2, -.008, head); cap.scale.set(1, 1.12, 1.04);
  if (st === 0) { M(sgeo(.2, 16, 10, Math.PI * .6, Math.PI * .8, 0, Math.PI * .7), hair, 0, .19, -.01, head).scale.set(1.04, 1.1, 1.05); }
  if (st === 1) { const back = M(cgeo(.2, .16, .42, 16, ), hair, 0, .04, -.05, head); back.scale.z = .75; M(sgeo(.2, 16, 10, Math.PI * .55, Math.PI * .9, 0, Math.PI * .75), hair, 0, .19, -.01, head).scale.set(1.06, 1.12, 1.06); }
  if (st === 2) { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; M(sgeo(.07, 10, 8), hair, Math.sin(a) * .16, .3 + Math.cos(i * 1.7) * .04, Math.cos(a) * .14 - .02, head); } M(sgeo(.09, 10, 8), hair, 0, .4, 0, head); }
  if (look.headset) { const hm = mat("#2a2a2e", { rough: .4 }); const band = new THREE.Mesh(new THREE.TorusGeometry(.215, .014, 8, 20, Math.PI), hm); band.position.set(0, .2, 0); head.add(band); [-.205, .205].forEach(x => { const cup = M(cgeo(.055, .055, .04, 14), hm, x, .18, 0, head); cup.rotation.z = Math.PI / 2; }); const boom = M(bgeo(.012, .012, .2), hm, -.17, .1, .1, head); boom.rotation.y = -.6; M(sgeo(.02, 8, 6), hm, -.1, .09, .19, head); }
  if (look.glasses) { const fr = mat("#1d1d1d", { rough: .3 }); [-.07, .07].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(.04, .006, 6, 16), fr); r.position.set(x, .22, .185); head.add(r); }); M(bgeo(.05, .006, .006), fr, 0, .225, .19, head); }
  g.userData = { body, legL, legR, armL, armR, head, eyes, mouth, phase: Math.random() * 6, blink: 2 + Math.random() * 4 };
  return g;
}
function animPerson(p, mode, dt, talking) {
  const u = p.userData, t = E.t + u.phase;
  let lx = 0, rx = 0, al = 0, ar = 0, by = 0, hx = 0, az = 0, hy = 0;
  if (mode === "walk" || mode === "run") { const s = Math.sin(t * (mode === "run" ? 13 : 9)) * .55; lx = s; rx = -s; al = -s * .8; ar = s * .8; by = Math.abs(Math.cos(t * 9)) * .04; }
  else if (mode === "sit" || mode === "type") { lx = rx = -1.5; by = -.36; if (mode === "type") { al = -1.15 + Math.sin(t * 13) * .1; ar = -1.15 + Math.sin(t * 13 + 2) * .1; hx = .15; } }
  else if (mode === "cheer") { al = ar = -2.9; az = .25; by = Math.abs(Math.sin(t * 8)) * .3; }
  else if (mode === "sad") { hx = .35; al = ar = .05; }
  else if (mode === "talk") { ar = -.45 + Math.sin(t * 5) * .35; hx = Math.sin(t * 3) * .05; hy = Math.sin(t * 1.7) * .15; }
  else if (mode === "pet") { lx = rx = -1.2; by = -.35; ar = -1 + Math.sin(t * 8) * .3; }
  else { by = Math.sin(t * 2) * .01; al = Math.sin(t * 1.3) * .04; ar = -al; hy = Math.sin(t * .6) * .12; }
  if (talking) { hx += Math.sin(t * 6) * .04; ar = Math.min(ar, -.3 + Math.sin(t * 4) * .3); }
  const k = Math.min(1, dt * 14);
  u.legL.rotation.x += (lx - u.legL.rotation.x) * k; u.legR.rotation.x += (rx - u.legR.rotation.x) * k;
  u.armL.rotation.x += (al - u.armL.rotation.x) * k; u.armR.rotation.x += (ar - u.armR.rotation.x) * k;
  u.armL.rotation.z += (-az - u.armL.rotation.z) * k; u.armR.rotation.z += (az - u.armR.rotation.z) * k;
  u.head.rotation.x += (hx - u.head.rotation.x) * k; u.head.rotation.y += (hy - u.head.rotation.y) * k * .5; u.body.position.y += (by - u.body.position.y) * k;
  u.blink -= dt; const closed = u.blink < .12; if (u.blink < 0) u.blink = 2 + Math.random() * 4;
  u.eyes.forEach(e => e.scale.y = closed ? .1 : 1);
  u.mouth.scale.y = talking ? .25 + Math.abs(Math.sin(t * 17)) * .9 : .25;
}
function makeDog() {
  const g = new THREE.Group(); const fur = mat("#c98b4a", { rough: .9 }), dark = mat("#4a2e18", { rough: .6 });
  const M = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  M(sgeo(.25, 16, 12), fur, 0, .5, 0).scale.set(1, .9, 1.7); const head = M(sgeo(.18, 16, 12), fur, 0, .72, .45); M(sgeo(.09, 10, 8), fur, 0, .68, .6).scale.set(1, .8, 1.3); M(sgeo(.04, 8, 6), dark, 0, .7, .71);
  [-.1, .1].forEach(x => M(sgeo(.06, 8, 6), dark, x, .86, .4).scale.set(.6, 1.4, .5)); [-.07, .07].forEach(x => M(sgeo(.025, 8, 6), dark, x, .76, .6));
  const legs = [[-.12, -.26], [.12, -.26], [-.12, .26], [.12, .26]].map(([x, z]) => M(cgeo(.05, .045, .4, 8), fur, x, .2, z));
  const tail = M(cgeo(.03, .02, .32, 8), fur, 0, .66, -.48); tail.rotation.x = -.8;
  g.userData = { legs, tail, head }; return g;
}

/* ---------- NPCs ---------- */
function addNPC(o) {
  const look = Object.assign({}, o.look); if (look.glasses === undefined) look.glasses = hashStr(o.name) % 5 === 0;
  const mesh = modularFor(Object.assign({}, o, { look })) || makePerson(look); mesh.position.set(o.x, 0, o.z); mesh.rotation.y = o.ry || 0; E.world.add(mesh);
  const npc = Object.assign({ mesh, mode: o.sit ? "type" : "idle", path: [], speed: 2.2, hearts: 0, home: { x: o.x, z: o.z, ry: o.ry || 0, mode: o.sit ? "type" : "idle" } }, o);
  mesh.traverse(m => { m.userData.npc = npc; }); E.clickables.push(mesh);
  npc.label = document.createElement("div"); npc.label.className = "w-label"; $("#labels").appendChild(npc.label);
  E.npcs.push(npc); return npc;
}
function removeNPC(npc) { E.world.remove(npc.mesh); npc.label.remove(); E.npcs = E.npcs.filter(n => n !== npc); E.clickables = E.clickables.filter(c => c !== npc.mesh); }
function walkTo(npc, pts, then) { npc.path = pts.map(p => V3(p[0], 0, p[1])); npc.then = then; }
function pushFromNPCs(p) { for (const n of E.npcs) { const q = n.mesh.position, dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz), r = (n.mode === "type" || n.mode === "sit") ? .35 : .5; if (d < r && d > 1e-4) { p.x = q.x + dx / d * r; p.z = q.z + dz / d * r; } } }
function updateNPC(n, dt) {
  const talking = Voice.speaking && Voice.who === n.name;
  if (Player.mesh) n.mesh.visible = E.orbit || n.mesh.position.distanceTo(Player.mesh.position) > .38;
  if (n.path.length) {
    const p = n.mesh.position, tgt = n.path[0]; const d = V3(tgt.x - p.x, 0, tgt.z - p.z); const L = d.length();
    if (L < .08) { n.path.shift(); if (!n.path.length) { const f = n.then; n.then = null; if (f) f(n); } }
    else { d.normalize(); const prev = p.clone(); p.addScaledVector(d, Math.min(L, n.speed * dt)); npcStep(n, p, prev); n.mesh.rotation.y = lerpAngle(n.mesh.rotation.y, Math.atan2(d.x, d.z), dt * 10); }
    animPerson(n.mesh, "walk", dt, talking);
  } else animPerson(n.mesh, n.emoteMode && n.emoteUntil > E.t ? n.emoteMode : (talking && n.mode === "idle" ? "talk" : n.mode), dt, talking);
  const pp = Player.mesh && Player.mesh.position; const near = pp && !n.path.length && n.mode !== "type" && n.mode !== "sit" && n.mesh.position.distanceTo(pp) < 3;
  const ft = near ? pp : n.faceTarget;
  if (ft && !n.path.length) n.mesh.rotation.y = lerpAngle(n.mesh.rotation.y, Math.atan2(ft.x - n.mesh.position.x, ft.z - n.mesh.position.z), dt * 5);
}
function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * Math.min(1, t); }
function npcSay(n, text, secs = 4) { n.speech = text; n.speechUntil = E.t + secs; if (Player.mesh && n.mesh) { const d = n.mesh.position.distanceTo(Player.mesh.position); if (d < 7) Voice.say(text, n.name, d < 3.5 ? 1 : 0); } }
function npcEmote(n, mode, secs = 2) { n.emoteMode = mode; n.emoteUntil = E.t + secs; }

/* ---------- player (first person) ---------- */
const Player = { mesh: null, speed: 4.2, r: .32 };
function spawnPlayer(x, z, ry = Math.PI) {
  if (Player.mesh) E.scene.remove(Player.mesh);
  Player.mesh = makePerson(S.player ? S.player.look : { skin: 1, hair: 0, shirt: 0, style: 0, pants: 0 }); Player.mesh.position.set(x, 0, z); Player.mesh.rotation.y = ry; E.scene.add(Player.mesh);
  Player.mesh.visible = !!E.orbit; E.yaw = ry + Math.PI; E.pitch = -.06; buildHands(S.player ? S.player.look : { skin: 1, shirt: 0 });
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
  Player.mesh.visible = !!E.orbit;
  const p = Player.mesh.position; const k = E.keys;
  let f = 0, s = 0, turn = 0;
  if (!E.uiOpen && !E.orbit) {
    f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0); s = (k.d ? 1 : 0) - (k.a ? 1 : 0); turn = (k.arrowleft ? 1 : 0) - (k.arrowright ? 1 : 0);
    f += -E.joy.y; s += E.joy.x;
  }
  if (turn) E.yaw += turn * dt * 2.2;
  let mv = V3(0, 0, 0);
  const fw = V3(-Math.sin(E.yaw), 0, -Math.cos(E.yaw)), rt = V3(Math.cos(E.yaw), 0, -Math.sin(E.yaw));
  if (Math.abs(f) > .05 || Math.abs(s) > .05) { E.target = null; E.onArrive = null; E.ring.visible = false; mv.addScaledVector(fw, f).addScaledVector(rt, s); if (mv.length() > 1) mv.normalize(); }
  else if (E.target && !E.uiOpen) {
    const d = V3(E.target.x - p.x, 0, E.target.z - p.z);
    if (d.length() < (E.arriveR || .15)) { E.target = null; E.ring.visible = false; const cb = E.onArrive; E.onArrive = null; if (cb) cb(); }
    else { mv = d.normalize(); E.yaw = lerpAngle(E.yaw, Math.atan2(-mv.x, -mv.z), dt * 6); }
  }
  E.moving = mv.lengthSq() > .01;
  if (E.moving) {
    const before = p.clone(); p.addScaledVector(mv, Player.speed * Game.speedMul() * dt); resolve(p, Player.r); pushFromNPCs(p);
    if (E.target) { if (p.distanceTo(before) < .004) { E.stuck = (E.stuck || 0) + dt; if (E.stuck > .4) { E.target = null; E.ring.visible = false; E.stuck = 0; const cb = E.onArrive; E.onArrive = null; if (cb && E.nearPos && p.distanceTo(E.nearPos) < 2.6) cb(); } } else E.stuck = 0; }
    E.bob = (E.bob || 0) + dt * 9 * mv.length();
    E.step = (E.step || 0) + dt * mv.length(); if (E.step > .38) { E.step = 0; Sfx.tone(120 + Math.random() * 40, .035, "sine", .025); }
  }
  Player.mesh.rotation.y = E.yaw + Math.PI;
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  if (!Player.mesh) return;
  const p = Player.mesh.position;
  if (E.orbit) {
    const a = E.t * .15; E.camera.position.set(p.x + Math.sin(a) * 4.2, 2.1, p.z + Math.cos(a) * 4.2); E.camera.lookAt(p.x, 1.35, p.z);
    animPerson(Player.mesh, "idle", dt, false);
  } else {
    const bob = E.moving && !document.body.classList.contains("calm") ? Math.sin(E.bob) * .035 : 0;
    E.camY = (E.camY ?? 1.62) + (((E.seated ? 1.22 : 1.62) + bob) - (E.camY ?? 1.62)) * Math.min(1, dt * 6);
    E.camera.position.set(p.x, E.camY, p.z);
    E.camera.rotation.order = "YXZ"; E.camera.rotation.set(E.pitch, E.yaw, 0);
    if (E.hands) { const u = E.hands.userData, sw = E.moving ? Math.sin(E.bob) : 0, wv = clamp(1 - (E.t - (E.wave || -9)) * 1.6, 0, 1);
      E.hands.visible = !E.uiOpen; u.R.position.set(.27, -.3 + Math.abs(sw) * .02 + wv * .14, -.5 + sw * .02); u.L.position.set(-.27, -.31 + Math.abs(sw) * .02, -.5 - sw * .02); u.R.rotation.z = wv * Math.sin(E.t * 14) * .4; u.R.rotation.x = -.15 + wv * .6; }
  }
  if (E.hands && (E.orbit || E.uiOpen)) E.hands.visible = false;
  const camDir = V3(E.camera.position.x - p.x, 0, E.camera.position.z - p.z).normalize();
  for (const w of E.walls) { const want = E.orbit && w.normal.dot(camDir) > .3 ? .1 : 1; w.h += (want - w.h) * Math.min(1, dt * 6); w.g.scale.y = w.h; }
  if (E.ceil) E.ceil.visible = !E.orbit || E.camera.position.y < (E.room.H || 3.2);
  E.sky.position.copy(E.camera.position);
  if (E.sunDir) { E.sun.position.copy(p).add(E.sunDir); E.sun.target.position.copy(p); }
  // what am I looking at?
  E.aim = null;
  if (!E.orbit && !E.uiOpen) {
    E.ray.setFromCamera({ x: 0, y: 0 }, E.camera); E.ray.far = 3.6;
    const hits = E.ray.intersectObjects(E.clickables, true);
    for (const h of hits) { const u = h.object.userData; if (u.npc) { E.aim = { npc: u.npc }; break; } if (u.inter) { E.aim = { inter: u.inter }; break; } if (u.floor) break; }
  }
  const cr = $("#cross"); if (cr) { cr.hidden = E.orbit || E.uiOpen > 0; cr.classList.toggle("on", !!E.aim); }
  const lh = $("#lookHint"); if (lh) lh.hidden = E.orbit || E.uiOpen > 0 || E.locked || E.touch || E.hintDone;
}

/* ---------- labels ---------- */
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
    const show = !E.orbit && (task || speaking || d < 4 || n.alwaysLabel);
    if (!show) { n.label.style.display = "none"; continue; }
    const key = [task ? task.urgent + "|" + Math.round(task.patienceRatio * 10) : "", speaking ? n.speech : "", n.name, n.hearts, d < 4].join("~");
    if (key !== n.labelKey) {
      n.labelKey = key;
      const ratio = task ? task.patienceRatio : 1; const col = ratio > .5 ? "#f5b800" : ratio > .25 ? "#f08a12" : "#d6342c";
      n.label.innerHTML = `${speaking ? `<div class="w-speech">${esc(n.speech)}</div>` : ""}${task ? `<div class="w-mark ${task.urgent ? "urgent" : ""}" style="--mc:${task.urgent ? "#d6342c" : col}">${task.urgent ? "!!" : "!"}</div>` : ""}${(d < 4 || task) ? `<div class="w-name">${esc(n.name)}${n.role ? `<small>${esc(n.role)}</small>` : ""}${n.hearts ? `<span class="w-hearts">${"♥".repeat(n.hearts)}</span>` : ""}</div>` : ""}`;
    }
    placeLabel(n.label, n.mesh.position, n.mode === "type" || n.mode === "sit" ? 1.65 : 2.05);
  }
  for (const it of E.inters) {
    if (!it.label) continue;
    const d = it.pos.distanceTo(pp); const mark = it.mark && it.mark();
    const show = !E.orbit && (d < 5 || mark);
    if (!show) { it.label.style.display = "none"; continue; }
    const key = (mark || "") + it.name;
    if (key !== it.labelKey) { it.labelKey = key; it.label.innerHTML = `${mark ? `<div class="w-mark ${mark === "!!" ? "urgent" : ""}" style="--mc:${mark === "!!" ? "#d6342c" : "#f5b800"}">${mark}</div>` : ""}<div class="w-name">${esc(it.name)}</div>`; }
    placeLabel(it.label, it.pos, it.h || 2.2);
  }
}
function addInter(o) { const it = Object.assign({ r: 1.8, h: 2.2 }, o); it.pos = V3(o.x, 0, o.z); if (o.name) { it.label = document.createElement("div"); it.label.className = "w-label"; $("#labels").appendChild(it.label); } if (o.mesh) { o.mesh.traverse(m => m.userData.inter = it); E.clickables.push(o.mesh); } E.inters.push(it); return it; }

/* ---------- input: mouse-look, keys, touch joystick ---------- */
function releaseLook() { if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {} }
function setupInput() {
  E.touch = matchMedia("(pointer: coarse)").matches;
  window.addEventListener("keydown", e => {
    if (e.target.matches && e.target.matches("input, textarea, select")) return;
    const k = e.key.toLowerCase(); E.keys[k] = true;
    if (E.uiOpen) return;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === " " || k === "enter" || k === "e" || k === "f") Game.interact();
  });
  window.addEventListener("keyup", e => { E.keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => { E.keys = {}; });
  const cv = $("#stage");
  document.addEventListener("pointerlockchange", () => { E.locked = document.pointerLockElement === cv; if (E.locked) E.hintDone = true; });
  document.addEventListener("pointerlockerror", () => { E.noLock = true; });
  document.addEventListener("mousemove", e => { if (!E.locked || E.uiOpen) return; const A = a11y(); E.yaw -= e.movementX * .0022 * A.sens; E.pitch = clamp(E.pitch - e.movementY * .0022 * A.sens * (A.invert ? -1 : 1), -1.25, 1.2); });
  let drag = null;
  cv.addEventListener("pointerdown", e => {
    if (E.uiOpen || E.orbit) return;
    if (e.pointerType === "mouse" && !E.locked && !E.noLock) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { E.noLock = true; }); } catch (err) { E.noLock = true; } }
    drag = { x: e.clientX, y: e.clientY, yaw: E.yaw, pitch: E.pitch, moved: false, id: e.pointerId, t: performance.now() };
  });
  cv.addEventListener("pointermove", e => { if (!drag || drag.id !== e.pointerId || E.locked) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; E.yaw = drag.yaw - dx * .005; E.pitch = clamp(drag.pitch - dy * .005, -1.25, 1.2); });
  cv.addEventListener("pointerup", e => {
    const d = drag; drag = null; if (!d || E.uiOpen || E.orbit) return;
    if (E.locked && e.pointerType === "mouse") { Game.interact(); return; }
    if (!d.moved && performance.now() - d.t < 350) { if (E.aim) Game.interactWith(E.aim); else if (E.touch || E.noLock) tapMove(e.clientX, e.clientY); }
  });
  // joystick
  const joy = $("#joy"), knob = $("#joyKnob"); if (!joy) return;
  joy.hidden = !E.touch; let jid = null, cx = 0, cy = 0;
  joy.addEventListener("pointerdown", e => { jid = e.pointerId; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.setPointerCapture(jid); move(e); e.preventDefault(); });
  const move = e => { if (e.pointerId !== jid) return; let x = (e.clientX - cx) / 45, y = (e.clientY - cy) / 45; const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; } E.joy.x = x; E.joy.y = y; knob.style.transform = `translate(${x * 34}px,${y * 34}px)`; };
  joy.addEventListener("pointermove", move);
  const end = e => { if (e.pointerId !== jid) return; jid = null; E.joy.x = E.joy.y = 0; knob.style.transform = ""; };
  joy.addEventListener("pointerup", end); joy.addEventListener("pointercancel", end);
}
function tapMove(x, y) {
  const m = new THREE.Vector2(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  E.ray.setFromCamera(m, E.camera); E.ray.far = 40;
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
    padTick(dt); updatePlayer(dt); E.npcs.forEach(n => updateNPC(n, dt)); E.anims.forEach(f => f(dt));
    if (E.rain) { const a = E.rain.geometry.attributes.position; for (let i = 0; i < a.count; i += 2) { let y = a.getY(i) - dt * 16; if (y < -2) y += 10; a.setY(i, y); a.setY(i + 1, y - .6); } a.needsUpdate = true; }
    if (E.ring.visible) E.ring.rotation.z += dt * 2;
    Game.tick(dt); updateCamera(dt); updateLabels();
    renderFrame();
  } catch (err) { console.error(err); }
  requestAnimationFrame(loop);
}
