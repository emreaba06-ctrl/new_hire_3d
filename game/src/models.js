/* =====================================================================
   REAL CHARACTER MODELS: rigged, animated .glb people (converted from the
   uploaded character pack). Each NPC gets a recolored clone with its own
   animation mixer. Falls back to the built-in procedural people if the
   models can't load.
   ===================================================================== */
const MODEL_FILES = { m: ["Male_Suit", "Male_Shirt", "Male_LongSleeve", "Male_Casual"], f: ["Female_Dress", "Female_Alternative", "Female_Casual", "Female_TankTop"] };
const OUTFIT_NAMES = { m: ["Suit", "Dress shirt", "Long sleeve", "Casual"], f: ["Dress", "Blazer", "Casual", "Tank top"] };
const REAL_SKIN = ["#f1c9a5", "#dca47c", "#bd8159", "#8a5838", "#5a3722"];
const JACKETS = ["#2b3445", "#3b3f46", "#5a5f68", "#7a6a55", "#1f2430", "#4a3b35"];
const MODELS = {}; let modelsReady = false;
function loadModels(onProgress) {
  return new Promise(res => {
    if (!THREE.GLTFLoader || !THREE.SkeletonUtils) { res(false); return; }
    const loader = new THREE.GLTFLoader(); const names = [...MODEL_FILES.m, ...MODEL_FILES.f]; let done = 0, ok = 0;
    const fin = () => { done++; if (onProgress) onProgress(done / names.length); if (done === names.length) { modelsReady = ok > 0; res(modelsReady); } };
    names.forEach(n => loader.load(`models/${n}.json`, g => {
      const box = new THREE.Box3().setFromObject(g.scene);
      MODELS[n] = { scene: g.scene, clips: g.animations, h: box.max.y - box.min.y, minY: box.min.y }; ok++; fin();
    }, undefined, err => { console.warn("Model failed to load:", n, err && err.message); fin(); }));
  });
}
function makePerson(look) {
  const g = look.g === "f" ? "f" : "m"; const list = MODEL_FILES[g]; const name = list[(look.outfit || 0) % list.length];
  const M = modelsReady && (MODELS[name] || MODELS[list.find(n => MODELS[n])]);
  if (!M) return makePersonProc(look);
  const inner = THREE.SkeletonUtils.clone(M.scene);
  const s = (g === "f" ? 1.66 : 1.78) * (look.h || 1) / M.h; inner.scale.setScalar(s); inner.position.y = -M.minY * s;
  const hair = HAIRS[look.hair] || HAIRS[0], shirt = look.shirtHex || SHIRTS[look.shirt] || SHIRTS[0], jacket = JACKETS[(look.jacket ?? look.shirt + look.pants) % JACKETS.length];
  const suit = name === "Male_Suit";
  const cols = { Skin: REAL_SKIN[look.skin] || REAL_SKIN[1], Hair: hair, Hair2: shade(hair, .06), HairBase: shade(hair, -.06), Eyebrows: shade(hair, -.12),
    Shirt: suit ? jacket : shirt, Shirt2: shade(shirt, .22), Pants: suit ? jacket : (look.pantsHex || PANTS[look.pants || 0]), Dress: shirt, Jacket: jacket, LightJacket: shade(jacket, .14), TieTexture: shirt, Socks: "#2e2e2e" };
  inner.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.frustumCulled = false;
    const arr = Array.isArray(o.material) ? o.material : [o.material];
    const out = arr.map(m => { const c = m.clone(); if (cols[m.name]) c.color = lin(cols[m.name]); c.roughness = m.name === "Skin" ? .55 : m.name === "Eyes" ? .2 : .82; c.metalness = 0; return c; });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  const root = new THREE.Group(); root.add(inner);
  const mixer = new THREE.AnimationMixer(inner); const acts = {};
  M.clips.forEach(c => { acts[c.name] = mixer.clipAction(c); });
  const bone = n => inner.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n)) || inner.getObjectByName(n);
  const bones = { head: bone("Head"), neck: bone("Neck"), torso: bone("Torso"), uaR: bone("UpperArm.R"), laR: bone("LowerArm.R"), uaL: bone("UpperArm.L"), laL: bone("LowerArm.L") };
  const rest = {}; for (const k in bones) if (bones[k]) rest[k] = bones[k].quaternion.clone();
  root.userData = { model: true, mixer, acts, cur: null, bones, rest, phase: Math.random() * 6, eyes: [], mouth: null, born: E.t };
  return root;
}
const TYPE_POSE = { ua: .62, la: .42 }; // Z-axis bend: left arm negative, right arm positive (mirrored bones)
const MODE_CLIP = { walk: "Walk", run: "Run", sit: "Sitting", type: "Sitting", cheer: "Clapping", pet: "Sitting" };
function animPerson(p, mode, dt, talking) {
  const u = p.userData; if (!u.model) return animPersonProc(p, mode, dt, talking);
  const want = u.clipMap ? (u.clipMap[mode] || u.clipMap.idle) : (MODE_CLIP[mode] || "Idle");
  if (u.cur !== want) {
    const next = u.acts[want] || u.acts.Idle, prev = u.cur && u.acts[u.cur];
    next.reset(); next.enabled = true; next.setEffectiveWeight(1);
    if (want === "Sitting") { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; if (!u.cur) next.time = next.getClip().duration - .001; }
    else next.setLoop(THREE.LoopRepeat, Infinity);
    next.play(); if (prev) prev.crossFadeTo(next, want === "Sitting" || u.cur === "Sitting" ? .45 : .25, false);
    u.cur = want;
  }
  if (want === "Walk" || want === "Run") (u.acts[want] || {}).timeScale = 1.05;
  for (const k in u.rest) u.bones[k].quaternion.copy(u.rest[k]); // undo last frame's extra turn; the animation then sets any bone it drives
  u.mixer.update(dt);
  const t = E.t + u.phase, B = u.bones;
  if (B.head) {
    if (talking) { B.head.rotateX(Math.sin(t * 6) * .07); B.head.rotateY(Math.sin(t * 2.1) * .08); }
    else if (mode === "sad") B.head.rotateX(.35);
    else if (mode === "talk") B.head.rotateY(Math.sin(t * 1.7) * .12);
    else if (want === "Idle") B.head.rotateY(Math.sin(t * .6) * .15);
  }
  if (talking && B.laR && B.uaR && want !== "Walk" && mode !== "type") { B.uaR.rotateZ(.25); B.laR.rotateZ(.35 + Math.abs(Math.sin(t * 3.5)) * .35); }
  if (mode === "type" && !u.modular && B.uaL && B.uaR && B.laL && B.laR) {
    // Rest pose has hands in the lap: lift upper arms forward and bend forearms over the keyboard, with small alternating taps.
    const tap = Math.sin(t * 14), tap2 = Math.sin(t * 14 + 2.1);
    B.uaL.rotateZ(-TYPE_POSE.ua); B.uaR.rotateZ(TYPE_POSE.ua);
    B.laL.rotateZ(-(TYPE_POSE.la + tap * .07)); B.laR.rotateZ(TYPE_POSE.la + tap2 * .07);
    if (B.head) B.head.rotateX(.12);
  }
}
