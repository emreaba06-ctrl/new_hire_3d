/* =====================================================================
   FURNITURE + MODULAR PEOPLE (Quaternius house interior pack and the
   modular men pack). Furniture is a library of named models placed by
   PROP.fm(); modular men dress standing male characters.
   ===================================================================== */
const FURN = {}; let HUM = null; const FS = .5; // furniture pack is ~2x real-world size
function loadExtraModels(onEach) {
  const L = new THREE.GLTFLoader();
  const one = (file, fn) => new Promise(res => L.load(file, g => { try { fn(g); } catch (e) { console.warn(e); } onEach && onEach(); res(true); }, undefined, () => { onEach && onEach(); res(false); }));
  return Promise.all([
    one("models/Furniture.json", g => g.scene.children.forEach(n => {
      n.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(n); const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
      n.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.roughness = Math.max(m.roughness ?? .7, .55); m.metalness = Math.min(m.metalness ?? 0, .2); }); } });
      FURN[n.name] = { node: n, c, s, minY: b.min.y };
    })),
    one("models/Humans.json", g => { const b = new THREE.Box3().setFromObject(g.scene); HUM = { scene: g.scene, clips: g.animations, h: b.max.y - b.min.y, minY: b.min.y }; })
  ]);
}
// Place a furniture model with its footprint centered on (x, z). Returns the group, or null if the pack isn't loaded.
PROP.fm = function (name, x, z, ry = 0, o = {}) {
  const F = FURN[name]; if (!F) return null;
  const s = (o.s || 1) * FS; const g = group(x, z, ry, o.parent || E.world); if (o.y) g.position.y = o.y;
  const inner = F.node.clone(true); inner.position.set(-F.c.x * s, -F.minY * s * (o.hang ? 0 : 1), -F.c.z * s); inner.scale.setScalar(s); g.add(inner);
  if (o.tint) inner.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = lin(o.tint); } });
  if (o.collide !== false && !o.parent) { const sw = Math.abs(Math.sin(ry)) > .7; const w = F.s.x * s, d = F.s.z * s; collider(x, z, (sw ? d : w) * .92, (sw ? w : d) * .92); }
  return g;
};
const has3D = name => !!FURN[name];

/* ---------- modular men ---------- */
const MOD_SETS = ["Casual", "Casual2", "Suit", "Worker", "Punk"];
function makeModular(look) {
  if (!HUM) return null;
  const set = look.modular; const headSet = set === "Worker" || set === "Punk" ? set : (look.modHead || set);
  const keep = n => n.startsWith(set + "_Body") || n.startsWith(set + "_Legs") || n.startsWith(set + "_Feet") || n.startsWith(headSet + "_Head");
  const inner = THREE.SkeletonUtils.clone(HUM.scene); const rm = [];
  inner.traverse(o => { if (o.isMesh && !keep(o.name)) rm.push(o); });
  rm.forEach(o => o.parent && o.parent.remove(o));
  const s = 1.78 * (look.h || 1) / HUM.h; inner.scale.setScalar(s); inner.position.y = -HUM.minY * s;
  const hair = HAIRS[look.hair] || HAIRS[0], shirt = look.shirtHex || SHIRTS[look.shirt] || SHIRTS[0], jacket = JACKETS[(look.jacket ?? look.shirt + look.pants) % JACKETS.length];
  const cols = { Skin: REAL_SKIN[look.skin] || REAL_SKIN[1], Skin_Darker: shade(REAL_SKIN[look.skin] || REAL_SKIN[1], -.08), Hair: hair, Eyebrows: shade(hair, -.1), Moustache: hair,
    Purple: shirt, LightBrown: set === "Casual2" ? shirt : "#8a6a4a", LightBlue: look.pantsHex || (PANTS[look.pants || 0] === "#2f3e52" ? "#3d5a80" : PANTS[look.pants || 0]), Suit: jacket, Tie: shirt };
  inner.traverse(o => {
    if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
    const arr = Array.isArray(o.material) ? o.material : [o.material];
    const out = arr.map(m => { const c = m.clone(); if (cols[m.name]) c.color = lin(cols[m.name]); c.roughness = m.name === "Skin" ? .55 : .82; c.metalness = 0; return c; });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  const root = new THREE.Group(); root.add(inner);
  const mixer = new THREE.AnimationMixer(inner); const acts = {}; HUM.clips.forEach(c => { acts[c.name] = mixer.clipAction(c); });
  const bone = n => inner.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n)) || inner.getObjectByName(n);
  const bones = { head: bone("Head"), neck: bone("Neck") }; const rest = {}; for (const k in bones) if (bones[k]) rest[k] = bones[k].quaternion.clone(); else delete bones[k];
  root.userData = { model: true, modular: true, mixer, acts, cur: null, bones, rest, phase: Math.random() * 6, eyes: [], mouth: null,
    clipMap: { walk: "Walk", run: "Walk", cheer: "Wave", talk: "Idle_Neutral", idle: "Idle_Neutral", sad: "Idle_Neutral", pet: "Interact", interact: "Interact" } };
  return root;
}
function modularFor(o) {
  // Standing / walking men get the modular pack: hi-vis on industrial floors, suits for bosses, a casual mix otherwise.
  const look = o.look; if (!HUM || o.sit || look.g === "f" || look.modular === false) return null;
  const th = CUR_JOB && THEMES[CUR_JOB]; const h = hashStr(o.name || "x");
  let set = look.modular;
  if (!set) set = th && (th.layout === "warehouse" || th.layout === "logistics") ? "Worker" : (look.outfit === 0 ? "Suit" : ["Casual2", "Casual", "Casual2", "Suit", "Punk", "Casual2", "Casual"][h % 7]);
  return makeModular(Object.assign({}, look, { modular: set, modHead: set === "Suit" ? "Suit" : ["Casual", "Casual2", "Suit"][h % 3] }));
}

/* ---------- swap hand-built props for real models when the pack is loaded ---------- */
const _plant = PROP.plant, _sofa = PROP.sofa, _bed = PROP.bed, _bookshelf = PROP.bookshelf, _kitchen = PROP.kitchen;
const FACE = { couch: 0, bed: 0, kitchen: 0, shelf: 0 }; // per-family yaw fix if a model faces the other way
PROP.plant = (x, z, s = 1) => PROP.fm(pick(["Houseplant_4", "Houseplant_8", "Houseplant_6", "Houseplant_3", "Houseplant_7"]), x, z, Math.random() * 6, { s: 1.15 * s }) || _plant(x, z, s);
PROP.sofa = (x, z, ry, color, len = 2.2) => PROP.fm(len >= 2.8 ? "Couch_Large2" : len >= 2.3 ? "Couch_Medium1" : pick(["Couch_Medium1", "Couch_Medium2", "Couch_Small1"]), x, z, ry + FACE.couch) || _sofa(x, z, ry, color, len);
PROP.bed = (x, z, ry, color, big) => PROP.fm(big ? "Bed_King" : "Bed_Single", x, z, ry + FACE.bed) || _bed(x, z, ry, color, big);
PROP.bookshelf = (x, z, ry) => PROP.fm("Bookshelf", x, z, ry + FACE.shelf) || _bookshelf(x, z, ry);
PROP.kitchen = (x, z, ry, len = 3) => {
  if (!has3D("Kitchen_Sink")) return _kitchen(x, z, ry, len);
  const g = group(x, z, ry); const n = Math.max(2, Math.round(len / .5)); const seq = ["Kitchen_Cabinet1", "Kitchen_Sink", "Kitchen_3Drawers", "Kitchen_Oven", "Kitchen_2Drawers", "Kitchen_Cabinet2"];
  for (let i = 0; i < n; i++) PROP.fm(seq[i % seq.length], -len / 2 + .25 + i * .505, 0, FACE.kitchen, { parent: g });
  PROP.fm("Kitchen_Fridge", len / 2 + .4, 0, FACE.kitchen, { parent: g });
  const sw = Math.abs(Math.sin(ry)) > .7; collider(x + (sw ? 0 : .4), z, sw ? .6 : len + .9, sw ? len + .9 : .6); return g;
};
function furnish(where, W, D, extra = {}) {
  if (!has3D("Houseplant_1")) return;
  const tall = (n, x, z, ry, o) => PROP.fm(n, x, z, ry, o);
  if (where === "lobby") {
    tall("Carpet_2", -9, -1, Math.PI / 2, { collide: false }); tall("Table_RoundSmall", -10.6, -1, 0, { s: .7 });
    tall("Light_Floor1", -11.8, -5, 0); tall("Light_Floor1", -11.8, 3, 0);
    for (const x of [-3.2, 3.2]) tall("Column_Round2", x, -D / 2 + 1.1, 0, { s: .8 });
    tall("Trashcan_Cylindric", 2.6, 2.4, 0, { s: .7 }); tall("Houseplant_6", 8, -8.4, 0, { s: 1.4 }); tall("Houseplant_7", -6, 8.6, 0, { s: 1.3 });
    tall("Couch_Small2", 4.6, -6.6, Math.PI / 2); tall("Couch_Small2", 8.4, -6.6, -Math.PI / 2); tall("Table_RoundSmall", 6.5, -6.6, 0, { s: .7 });
  } else if (where === "home") {
    const t = extra.tier;
    tall("Carpet_Round", 0, .6, 0, { collide: false, s: t >= 3 ? 1.1 : .8 });
    tall(pick(["Light_Floor1", "Light_Floor3"]), -W / 2 + .5, D / 2 - .5, 0);
    if (t >= 1) { tall("NightStand_1", -W / 2 + .5, -D / 2 + 3.2, Math.PI / 2, { s: .9 }); tall("Drawer_1", -1.2, D / 2 - .55, Math.PI, { s: .9 }); }
    if (t >= 2) { tall("Table_RoundSmall2", 2.2, 2.4, 0, { s: .65 }); tall("Chair_2", 2.2, 3.15, Math.PI); tall("Chair_2", 2.2, 1.65, 0); tall("Bathroom_Toilet2", -W / 2 + .6, 3.6, Math.PI / 2, { s: .9 }); tall("Bathroom_Sink", -W / 2 + .45, 2.5, Math.PI / 2, { s: .8 }); }
    if (t >= 3) { tall("Shelf_Large", 1.5, D / 2 - .4, Math.PI, { s: .8 }); tall("Curtains_Double", 0, -D / 2 + .3, 0, { collide: false, s: .75 }); }
    if (t >= 4) { tall("Fireplace", -4, D / 2 - .5, Math.PI); tall("Couch_L", -3.5, 1.2, 0); tall("Light_Chandelier", 0, 0, 0, { y: (E.room.H || 3.2) - .05, hang: true, collide: false }); }
  } else if (where === "office") {
    const F = extra.F;
    if (F && F.coffeePos) { tall("Kitchen_Fridge", -W / 2 + .55, F.coffeePos[1] + 1.7, Math.PI / 2, { s: .95 }); tall("Kitchen_Sink", -W / 2 + .45, F.coffeePos[1] - 1.05, Math.PI / 2); tall("Trashcan_Large", -W / 2 + .5, F.coffeePos[1] - 2, 0, { s: .55 }); }
    tall("Shelf_Small1", -W / 2 + .2, -3, Math.PI / 2, { y: 1.5, collide: false, s: .9 });
    tall("Light_Floor1", W / 2 - .6, D / 2 - .6, 0); tall("Houseplant_8", W / 2 - .6, 4.5, 0);
  } else if (where === "training") {
    tall("Bookshelf", -W / 2 + .45, -2, Math.PI / 2); tall("Houseplant_6", -W / 2 + .8, D / 2 - .8, 0); tall("Houseplant_6", W / 2 - .8, -D / 2 + .8, 0);
  }
}
