/* =====================================================================
   GAME: career, locations, shifts, coworkers, events, menus.
   ===================================================================== */
const SPM = .34; // real seconds per game minute while walking around
const DESK_RE = /phone|e-?mail|radio|chat|system|alert|report|testing|call|sla|invoice|ticket/i;
const SPOTS = [[-1.3, 4.6], [1.3, 4.6], [-1.3, 3], [1.3, 3], [0, 1.6], [-1.4, 1.2], [1.4, 1.2]];
const FIRST = ["Avery", "Blake", "Casey", "Devon", "Emerson", "Finley", "Harper", "Jamie", "Kai", "Logan", "Morgan", "Parker", "Quinn", "Reese", "Riley", "Rowan", "Sky", "Taylor", "Jordan", "Sasha", "Ari", "Drew", "Elliot", "Robin"];
const LAST = ["Adams", "Baker", "Chen", "Diaz", "Evans", "Fischer", "Garcia", "Hughes", "Ito", "Khan", "Lopez", "Moreau", "Nakamura", "Okafor", "Patel", "Reyes", "Singh", "Turner", "Vega", "Walsh"];
const CHATTER = ["Did you see the email about the potluck?", "The coffee machine is making that noise again.", "Is it Friday yet?", "I'm three meetings deep today.", "Who keeps microwaving fish?", "My cat sat on my keyboard and sent an email.", "Big deadline Thursday. No pressure.", "Nice shirt, by the way!", "The elevator music is stuck in my head.", "I brought cookies. They're by the printer."];
const MORNING = [
  { t: "Your coworkers left a 'Welcome to the team!' card on your desk. +3 reputation.", rep: 3 },
  { t: "You found $20 in an old jacket pocket.", money: 20 },
  { t: "A storm kept you up last night. You start your next shift at −5% performance.", perf: -5 },
  { t: "A news story praised Brightline. Everyone's in a great mood: +5% starting performance.", perf: 5 },
  { t: "Gym membership renewed automatically. −$30.", money: -30 },
  { t: "Mom sent a care package with cookies. +5% starting performance.", perf: 5 },
  { t: "The company ran a phishing test and you reported it right away. +3 reputation.", rep: 3 },
  { t: "Your phone screen cracked. Repair: −$60.", money: -60 },
  { t: "You helped a neighbor move. They paid you in pizza and $25.", money: 25 },
  { t: "Flat tire on the way in! −$40 and a stressful start.", money: -40, perf: -3, needCar: true }
];

/* ---------- state ---------- */
const KEY = "new-hire-3d.v1";
const fresh = () => ({ gfx: "hd", player: null, jobs: {}, money: 150, rep: 20, day: 1, phase: "morning", home: 0, car: 0, decor: {}, skills: {}, skillPts: 0, ach: {}, words: {}, friends: {}, talked: {}, certs: {}, projects: {}, daily: { day: 0, done: false, streak: 0, last: 0 }, stats: { shifts: 0, urgentWins: 0, coffees: 0, fiveStars: 0 }, weather: "sun", muted: false, music: true, musicVol: .5, voice: "real", voiceVol: .9, diff: "normal", offer: null, nextPerf: 0, workedToday: false, helped: false });
let S = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
const save = () => { try { S.savedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (typeof cloudSave === "function") cloudSave(); };
const jobState = id => (S.jobs[id] = Object.assign({ xp: 0, days: 0, done: {}, lessons: {}, best: 0, strikes: 0, firedUntil: 0, raise: 0, since: 0 }, S.jobs[id] || {}));
const has = id => !!S.skills[id];
const owns = id => !!S.decor[id];
const jobById = id => JOBS.find(j => j.id === id);
const titleFor = (job, xp) => `${LEVELS[lvl(xp)].name} ${job.role}`;
let SH = null, LOC = "title", CUR_JOB = null;
const hourNow = () => SH ? (SH.night ? (21 + SH.minute / 60) % 24 : 9 + SH.minute / 60) : S.phase === "evening" ? (LOC === "home" ? 20.5 : 17.6) : (LOC === "home" ? 7.5 : 8.6);
const stars = n => `<span class="stars" aria-label="${n} of 5 stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
const starsFor = p => p >= 90 ? 5 : p >= 75 ? 4 : p >= 60 ? 3 : p >= 40 ? 2 : 1;
const seeded = seed => { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const lookFor = name => { const a = hashAv(name); const f = genderFor(name) === "f"; const boss = JOBS.some(j => j.mentor.name === name) || /^Prof|CEO/.test(name); const h = hashStr(name);
  return { modular: /^Officer/.test(name) ? "Suit" : undefined, g: f ? "f" : "m", skin: a.skin, hair: /^Officer/.test(name) ? 0 : a.hair, shirt: /^Officer/.test(name) ? 5 : a.shirt, style: f ? [1, 2, 1, 0][a.style % 4] : [0, 3, 0, 2][a.style % 4], pants: (a.skin + a.hair) % 5, outfit: boss ? (f ? 1 : 0) : /^Officer/.test(name) ? 1 : f ? [2, 0, 1, 3, 2][h % 5] : [1, 2, 3, 1, 0][h % 5], h: .96 + (h >> 5) % 5 * .02 }; };
const fmtClock = h => { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`; };
const WEATHER_TXT = { sun: "Sunny", cloud: "Cloudy", rain: "Rainy" };

/* ---------- UI helpers ---------- */
function toast(html, kind = "") { const t = document.createElement("div"); t.className = "toast " + kind; t.innerHTML = html; $("#toasts").appendChild(t); setTimeout(() => t.classList.add("out"), 3600); setTimeout(() => t.remove(), 4100); }
function overlay(html, o = {}) {
  const ov = document.createElement("div"); ov.className = "overlay" + (o.cls ? " " + o.cls : ""); ov.innerHTML = html; $("#ui").appendChild(ov); E.uiOpen++; releaseLook(); E.keys = {};
  ov.close = () => { if (!ov.isConnected) return; ov.remove(); E.uiOpen = Math.max(0, E.uiOpen - 1); if (o.onClose) o.onClose(); };
  if (!o.sticky) ov.addEventListener("click", e => { if (e.target === ov) ov.close(); });
  const f = ov.querySelector("[autofocus], .btn.go, .btn"); if (f) setTimeout(() => f.focus(), 30);
  return ov;
}
function closeAll() { $$("#ui .overlay").forEach(o => o.close ? o.close() : o.remove()); }
function fade(fn, text) { const f = $("#fade"); $("#fadeTxt").textContent = text || ""; f.classList.add("on"); setTimeout(() => { fn(); setTimeout(() => f.classList.remove("on"), 120); }, 380); }
function checkAch() {
  if (typeof checkTrack === "function") checkTrack();
  const J = Object.values(S.jobs), maxL = J.reduce((m, j) => Math.max(m, lvl(j.xp)), 0), worked = J.filter(j => j.days > 0).length;
  const lessons = J.reduce((s, j) => s + Object.keys(j.lessons).length, 0);
  const tests = { first: S.stats.shifts >= 1, five: S.stats.fiveStars >= 1, urgent5: S.stats.urgentWins >= 5, coffee20: S.stats.coffees >= 20, promo: maxL >= 1, senior: maxL >= 3, lead: maxL >= 4, explore5: worked >= 5, all: worked >= JOBS.length, rich: S.money >= 10000, loft: S.home >= 4, car: S.car > 0, cert1: Object.keys(S.certs).length >= 1, cert5: Object.keys(S.certs).length >= 5, streak3: S.daily.streak >= 3, friend: Object.values(S.friends).some(h => h >= 5), words20: Object.keys(S.words).length >= 20, lessons50: lessons >= 50, skill: Object.keys(S.skills).length >= 1 };
  for (const [id, ok] of Object.entries(tests)) if (ok) award(id);
}
function award(id) { if (S.ach[id]) return; const a = ACH.find(x => x[0] === id); if (!a) return; S.ach[id] = S.day; save(); Sfx.promo(); toast(`<b>Achievement unlocked</b><br>${a[1]}: ${a[2]}`, "gold"); }

/* ---------- HUD ---------- */
function hud() {
  const h = $("#hud"); if (!S.player || LOC === "title") { h.hidden = true; $("#camctl").hidden = true; return; }
  h.hidden = false; $("#camctl").hidden = false;
  const job = CUR_JOB ? jobById(CUR_JOB) : null; const where = LOC === "home" ? HOMES[S.home].name : LOC === "lobby" ? "Lobby" : LOC === "training" ? "Training Center" : LOC === "cafe" ? "Cafeteria" : LOC === "roof" ? "Rooftop Garden" : LOC === "garage" ? "Parking garage" : LOC === "street" ? "Main Street" : job ? `Floor ${job.floor}: ${job.dept}` : "";
  $("#hudWho").innerHTML = `${avatar(S.player.look, 40)}<div><b>${esc(S.player.name)}</b><span>${playerTitle() ? `<i class="ptitle">${esc(playerTitle())}</i> · ` : ""}${where}</span></div>`;
  $("#hudDay").textContent = `${season().icon} Day ${S.day} · ${S.storm && S.weather === "rain" ? "Stormy" : WEATHER_TXT[S.weather]}${holiday() ? " · " + holiday().name : ""}`;
  $("#hudMoney").textContent = money(S.money); $("#hudRep").textContent = S.rep;
  $("#hudShift").hidden = !SH; $("#reqs").hidden = !SH;
  $("#muteB").textContent = "Settings";
}
function hudTick() {
  $("#hudClock").textContent = fmtClock(hourNow());
  if (!SH) return;
  const bar = (id, v, good) => { const el = $(id); el.style.width = clamp(v, 0, 100) + "%"; el.style.setProperty("--c", good ? (v < 35 ? "var(--bad)" : v < 60 ? "var(--warn)" : "var(--go)") : (v > 70 ? "var(--bad)" : v > 45 ? "var(--warn)" : "var(--go)")); };
  bar("#perfBar", SH.perf, true); bar("#enBar", SH.energy, true); bar("#stBar", SH.stress, false);
  $("#perfN").textContent = Math.round(SH.perf) + "%"; $("#xpN").textContent = "+" + SH.xp;
  const items = SH.list.filter(x => x.state === "active");
  if (LOC === "cafe") { $("#reqList").innerHTML = `<li class="quiet">Lunch break. Your shift is paused. Take the elevator back to ${esc(SH.job.dept)} when you're done.</li>`; $("#clockOut").hidden = true; return; }
  $("#reqList").innerHTML = items.length ? items.map(x => `<li class="${x.urgent ? "urgent" : ""}" data-i="${SH.list.indexOf(x)}"><b>${esc(x.t.from[0])}</b><span>${x.desk ? "At your desk" : "Waiting for you"}${x.urgent ? " · URGENT" : ""}${x.project ? " · Project" : ""}</span><div class="meter sm"><i style="width:${x.patienceRatio * 100}%;--c:${x.patienceRatio > .5 ? "var(--go)" : x.patienceRatio > .25 ? "var(--warn)" : "var(--bad)"}"></i></div></li>`).join("")
    : `<li class="quiet">${SH.list.every(x => x.state !== "wait") ? "All caught up! You can clock out early." : "Quiet moment. Grab a coffee or chat with a coworker."}</li>`;
  $("#clockOut").hidden = !SH.list.every(x => x.state === "done" || x.state === "missed");
}
function setupHud() {
  $("#muteB").addEventListener("click", () => { Sfx.init(); openSettings(); });
  $("#phoneB").addEventListener("click", () => openPhone());
  $("#helpB").addEventListener("click", () => openHelp());
  $("#menuB").addEventListener("click", () => openPause());
  $("#reqList").addEventListener("click", e => { const li = e.target.closest("li[data-i]"); if (!li) return; const x = SH.list[+li.dataset.i]; if (!x) return; if (x.desk) goNear(SH.deskPos, () => interactWith({ inter: SH.deskInter }), 1.2); else if (x.npc) goNear(x.npc.mesh.position, () => interactWith({ npc: x.npc })); });
  $("#clockOut").addEventListener("click", () => endShift(false));
  $("#rotL").addEventListener("click", () => E.yaw += Math.PI / 6); $("#rotR").addEventListener("click", () => E.yaw -= Math.PI / 6);
  $("#lookHint").addEventListener("click", () => { E.hintDone = true; });
  $("#promptBtn").addEventListener("click", () => interact());
}

/* ---------- interaction ---------- */
function candidates() {
  if (!Player.mesh) return null;
  if (E.aim) { const a = E.aim; if (a.npc && !a.npc.path.length && a.npc.mesh.position.distanceTo(Player.mesh.position) < 3.6) return a; if (a.inter && !(a.inter.hidden && a.inter.hidden())) return a; }
  const p = Player.mesh.position; let best = null, bd = 1e9;
  const fw = V3(-Math.sin(E.yaw), 0, -Math.cos(E.yaw)); const inFront = q => { const v = V3(q.x - p.x, 0, q.z - p.z); const L = v.length(); return L < .6 || v.divideScalar(L).dot(fw) > .35; };
  for (const n of E.npcs) { if (n.noTalk || n.path.length) continue; const r = n.task ? 2.4 : 2; const d = n.mesh.position.distanceTo(p); if (inFront(n.mesh.position) && d < r && d - (n.task ? 1 : 0) < bd) { bd = d - (n.task ? 1 : 0); best = { npc: n }; } }
  for (const it of E.inters) { if (it.hidden && it.hidden()) continue; const d = it.pos.distanceTo(p); if (inFront(it.pos) && d < it.r + .3 && d < bd) { bd = d; best = { inter: it }; } }
  return best;
}
function promptText(c) {
  if (c.npc) { const n = c.npc; return n.task ? `Help ${n.name}` : n.kind === "mentor" ? `Talk to ${n.name.split(" ")[0]}` : n.kind === "dog" ? "Pet the dog" : `Chat with ${n.name.split(" ")[0]}`; }
  return c.inter.verb || c.inter.name;
}
function interact() { const c = candidates(); if (c) interactWith(c); }
function interactWith(c) {
  if (E.uiOpen) return; E.wave = E.t;
  if (c.npc) {
    const n = c.npc; n.faceTarget = Player.mesh.position.clone();
    if (Player.mesh && !E.locked) { const dx = n.mesh.position.x - Player.mesh.position.x, dz = n.mesh.position.z - Player.mesh.position.z; E.yaw = Math.atan2(-dx, -dz); E.pitch = -.08; }
    if (n.task) return openShiftTask(n.task);
    if (n.onTalk) return n.onTalk(n);
    if (n.kind === "mentor") return mentorTalk(n);
    if (n.kind === "coworker") return coworkerTalk(n);
    npcSay(n, pick(CHATTER)); return;
  }
  if (c.inter && c.inter.action) c.inter.action(c.inter);
}

/* ---------- locations ---------- */
function goLocation(loc, opts = {}) {
  fade(() => {
    clearWorld(); E.F = null; LOC = loc; E.orbit = false;
    setLighting(hourNow(), S.weather);
    if (loc === "home") buildHome(opts);
    else if (loc === "lobby") buildLobby(opts);
    else if (loc === "training") buildTraining(opts);
    else if (loc === "floor") buildFloor(jobById(opts.job), opts);
    else if (loc === "cafe") buildCafe(opts);
    else if (loc === "roof") buildRoof(opts);
    else if (loc === "garage") buildGarage(opts);
    else if (loc === "street") buildStreet(opts);
    if (loc === "cafe" && opts.party) partyDecor(opts.party);
    decorate(); lobbySecret(); livingReset(); declutter(); feelOnLocation(loc, opts);
    if (S.partyPending === S.day && S.phase === "evening" && loc !== "cafe" && loc !== "home" && holiday()) { S.partyPending = 0; setTimeout(() => offerParty(holiday()), 1200); }
    setLighting(hourNow(), S.weather); hud(); hudTick(); Voice.stop(); Music.play(musicFor());
    if (opts.fromElevator || loc === "floor") { Sfx.tone(1318, .5, "sine", .05); Sfx.tone(1046, .7, "sine", .045, .32); }
    if (opts.after) opts.after();
  }, opts.text);
}
function sky(hour) { setLighting(hour, S.weather); }

function buildLobby(o) {
  CUR_JOB = null; const W = 26, D = 20; E.weather = S.weather; buildRoom(W, D, "marble", null, "#e8edf3", { southWindows: true });
  elevator(-D / 2); addInter({ name: "Elevator", verb: "Ride the elevator", x: 0, z: -D / 2 + 1.4, r: 2, h: 3.2, action: openElevator });
  const rd = group(0, 1.2); box(rd, 4.4, 1.1, 1, "#1d1f24", 0, 0, 0, { m: { rough: .4 } }); box(rd, 4.42, .5, 1.02, "#9a6b44", 0, 0, 0, { m: { rough: .6 } }); box(rd, 4.6, .08, 1.1, "#2b2e33", 0, 1.1, 0, { m: { rough: .3 } }); collider(0, 1.2, 4.6, 1.1);
  box(rd, 4.2, .05, .5, "#9a6b44", 0, .72, -.72, { m: { rough: .5 } }); for (const sx of [-2, 2]) box(rd, .06, .72, .45, "#1d1f24", sx, 0, -.72); box(rd, .55, .34, .04, "#20252c", -.2, .98, -.82); box(rd, .08, .2, .08, "#2b2f36", -.2, .77, -.82); box(rd, .45, .02, .15, "#2b2f36", -.2, .775, -.62); box(rd, .2, .12, .14, "#2b2f36", 1.2, 1.18, 0);
  PROP.chair(group(-.2, -.05, 0), 0, 0, "#2f4a6d");
  const pat = addNPC({ kind: "reception", name: "Pat Rivers", role: "Receptionist", look: lookFor("Pat Rivers"), x: -.2, z: -.05, ry: 0, sit: true });
  pat.onTalk = n => npcSay(n, pick([`Morning, ${S.player.name.split(" ")[0]}! It's ${WEATHER_TXT[S.weather].toLowerCase()} out.`, "The daily challenge kiosk has a new puzzle today.", "Training Center is through the door on the left.", "The elevator takes you to every department.", "Rumor is the CEO walks the floors on Fridays.", S.workedToday ? "Long day? The exit's behind you." : "Pick a floor and clock in when you're ready."]), 5);
  PROP.clock(-2.9, -D / 2 + .2, 0, 2.3, .38);
  PROP.board(-6.5, -D / 2 + .2, 0, ["BRIGHTLINE CORP", "Every job starts on day one"], { w: 4.4, h: 1.5, bg: "#1b5ea6", fg: "#fff" });
  directoryBoard(6.5, -D / 2 + .2);
  const td = PROP.door(-W / 2 + .15, 4, Math.PI / 2, "TRAINING", "#2a7fd4"); addInter({ name: "Training Center", verb: "Enter the Training Center", x: -W / 2 + 1.2, z: 4, r: 1.8, mesh: td, action: () => goLocation("training", { text: "Training Center" }) });
  const ex = PROP.door(W / 2 - .15, 7, -Math.PI / 2, "EXIT"); addInter({ name: "Exit", verb: "Leave the building", x: W / 2 - 1.2, z: 7, r: 1.8, mesh: ex, action: () => goLocation("street", { fromBuilding: true, text: "Main Street" }) });
  const kg = group(-5, 4.5); box(kg, .5, 1, .5, "#2b2f36", 0, 0, 0); const ks = new THREE.Mesh(bgeo(.8, .6, .05), new THREE.MeshBasicMaterial({ map: textTex(["DAILY", "CHALLENGE"], { w: 256, h: 192, bg: "#f08a12", size: 44, size2: 34 }) })); ks.material.userData.own = true; ks.position.set(0, 1.35, 0); ks.rotation.x = -.3; kg.add(ks); collider(-5, 4.5, .6, .6);
  addInter({ name: "Daily challenge", verb: "Play today's challenge", x: -5, z: 4.5, r: 1.7, mesh: kg, mark: () => S.daily.day !== S.day || !S.daily.done ? "!" : "", action: openDaily });
  const jb = PROP.board(W / 2 - .2, -2.5, -Math.PI / 2, ["JOB BOARD", "Careers · Offers · Paths"], { w: 3, h: 1.6, bg: "#3a9e2e", fg: "#fff" }); addInter({ name: "Job board", verb: "Check the job board", x: W / 2 - 1.3, z: -2.5, r: 1.8, mesh: jb, mark: () => S.offer ? "!" : "", action: () => openPhone("career") });
  PROP.board(W / 2 - .2, 2, -Math.PI / 2, ["WALL OF FAME", `${S.player ? esc(S.player.name) : "Your name here"}`, `${Object.keys(S.ach).length} achievements · ${S.stats.shifts} shifts`], { w: 3, h: 1.6, bg: "#20252c", fg: "#ffd23f", size: 40 });
  PROP.sofa(-9, -3, Math.PI / 2, "#c0392b"); PROP.sofa(-9, 1, Math.PI / 2, "#c0392b"); PROP.plant(-11.8, -8.6, 1.3); PROP.plant(11.8, -8.6, 1.3); PROP.plant(-11.8, 8.6, 1.2); PROP.plant(11.8, 8.6, 1.2); PROP.cooler(-9, 8.6); PROP.rug(0, 5.2, 6, 4, "#b03a3a");
  const guard = addNPC({ kind: "npc", name: "Officer Diaz", role: "Security", look: lookFor("Officer Diaz"), x: W / 2 - 2.2, z: 8.8, ry: -Math.PI / 2 }); guard.onTalk = n => npcSay(n, pick(["Badge looks good. Have a great day!", "Remember: don't hold the door for strangers. That's called tailgating.", "Saw someone try to sneak in yesterday. Security matters at every level."]));
  for (let i = 0; i < 2; i++) { const nm = `${pick(FIRST)} ${pick(LAST)}`; const v = addNPC({ kind: "npc", name: nm, role: "Visitor", look: lookFor(nm), x: -4 + i * 8, z: -4 }); wander(v, [[-6, -5], [6, -5], [5, 6], [-6, 6], [0, -7]]); }
  furnish("lobby", W, D); styleLobby();
  spawnPlayer(o.fromElevator ? 0 : W / 2 - 2, o.fromElevator ? -D / 2 + 1.8 : 7, o.fromElevator ? 0 : -Math.PI / 2);
  if (o.fromElevator) E.elevOpenUntil = E.t + 2.5;
 
}
function buildHome(o) {
  CUR_JOB = null; const tier = S.home; const size = [[10, 8], [12, 9], [12, 10], [14, 11], [18, 13]][tier]; const [W, D] = size;
  E.weather = S.weather; buildRoom(W, D, tier === 0 ? "carpet" : tier === 4 ? "wood" : "wood", tier === 0 ? "#8a7766" : tier === 4 ? "#6d4a2e" : "#b98a58", ["#e9dfc9", "#dfe6ea", "#f1ece2", "#e6edf2", "#f4f4f2"][tier], { southWindows: tier >= 3 });
  const door = PROP.door(W / 2 - 1.6, -D / 2 + .15, 0, "TO WORK"); addInter({ name: "Front door", verb: S.phase === "evening" ? "It's late. Sleep first." : "Go to work", x: W / 2 - 1.6, z: -D / 2 + 1.2, r: 1.8, mesh: door, action: () => { if (S.phase === "evening") { toast("It's evening. The office is closed. Get some sleep first."); return; } if (S.car >= 3) goLocation("garage", { text: `Commuting by ${CARS[S.car].name.toLowerCase()}...` }); else if (S.car >= 1) goLocation("street", { text: `Riding your ${CARS[S.car].name.toLowerCase()} to work...` }); else goLocation("street", { byBus: true, text: "Riding bus 42 to work..." }); } });
  let bed;
  if (tier === 0) { bed = PROP.sofa(-W / 2 + 2, -D / 2 + 1.2, 0, "#7a6a55", 2.4); PROP.boxes(.2, -D / 2 + .7); PROP.tv(-.6, D / 2 - 1.2, Math.PI); PROP.kitchen(W / 2 - .7, 1.4, -Math.PI / 2, 2.2);
    const mom = addNPC({ kind: "npc", name: "Mom", role: "Family", look: { g: "f", outfit: 2, skin: S.player.look.skin, hair: 4, shirt: 3, style: 1, pants: 1 }, x: W / 2 - 2, z: 1.4, ry: -Math.PI / 2 }); mom.onTalk = n => npcSay(n, pick(["Did you eat breakfast?", "So proud of my working kid!", "Save some money, sweetie. You can't live on my couch forever.", S.phase === "evening" ? "How was work? Tell me everything!" : "Don't forget your badge!"])); }
  else { bed = PROP.bed(-W / 2 + 1.6, -D / 2 + 1.4, 0, ["#2a7fd4", "#5fb320", "#c0392b", "#6a3fc1"][tier - 1], tier >= 3); PROP.kitchen(-1.2, -D / 2 + .7, 0, tier >= 3 ? 3 : 2); }
  if (tier === 1) { const rm = addNPC({ kind: "npc", name: "Sam", role: "Roommate", look: lookFor("Sam Roomie"), x: 2, z: 1, ry: 0 }); wander(rm, [[2, 1], [-1, 2], [3, -1]]); rm.onTalk = n => npcSay(n, pick(["Did you eat my yogurt? Kidding. Maybe.", "Rent's due when you sleep, right?", "Your job sounds cool. Mine is mostly spreadsheets."])); }
  if (tier >= 2) { PROP.tv(W / 2 - 1.2, -.4, -Math.PI / 2, tier >= 3); PROP.plant(W / 2 - .8, D / 2 - .8); }
  if (tier >= 3) { PROP.sofa(1.2, -.4, Math.PI / 2, "#4a6fa5"); PROP.bookshelf(-W / 2 + .4, -2.6, Math.PI / 2); PROP.rug(2.2, -.4, 3.5, 3, "#c8a46e"); PROP.plant(-W / 2 + .8, D / 2 - .8, 1.2); }
  if (tier >= 4) { PROP.sofa(2.4, 3, Math.PI, "#2c3e50", 3); PROP.plant(W / 2 - .8, -D / 2 + .8, 1.4); PROP.board(3, -D / 2 + .2, 0, ["SKYLINE"], { w: 3.6, h: 1.4, bg: "#1d2b4f", fg: "#ffd23f" }); }
  addInter({ name: tier === 0 ? "Couch" : "Bed", verb: "Sleep (end the day)", x: -W / 2 + (tier === 0 ? 2 : 1.6), z: -D / 2 + 1.4, r: 2, mark: () => S.phase === "evening" ? "z" : "", action: sleep });
  const pc = PROP.desk(-W / 2 + 1.6, D / 2 - 1.6, Math.PI, { screen: "#5fb320", top: "#c9b08a" }); addInter({ name: "Home computer", verb: S.phase === "evening" ? "Use your computer (side hustles, shop)" : isWfh() && !S.workedToday ? "Work from home today" : "Use your computer (shop, skills, goals)", x: -W / 2 + 1.6, z: D / 2 - 1.6, r: 1.8, mesh: pc.g, action: () => isWfh() && !S.workedToday ? openWfh() : S.phase === "evening" ? openHustles() : openPhone("shop") });
  const mx = W / 2 - 3.3; PROP.mirror(mx, -D / 2 + .2, 0); addInter({ name: "Mirror", verb: "Wardrobe and looks", x: mx, z: -D / 2 + 1.2, r: 1.5, action: () => openWardrobe() });
  PROP.clock(-W / 2 + .2, -1.8, Math.PI / 2, 2.2, .26);
  PROP.trophyShelf(W / 2 - 2.6, D / 2 - .6, Math.PI, Object.keys(S.ach).length); addInter({ name: `Trophies (${Object.keys(S.ach).length})`, verb: "Look at your trophies", x: W / 2 - 2.6, z: D / 2 - 1.2, r: 1.6, h: 2.4, action: () => openPhone("ach") });
  furnish("home", W, D, { tier }); spawnPet();
  spawnPlayer(W / 2 - 1.6, -D / 2 + 2, -Math.PI / 4);
  if (o.morningEvent) setTimeout(morningEvent, 600);
}
function buildTraining() {
  CUR_JOB = null; const W = 18, D = 14; buildRoom(W, D, "carpet", "#5d7ea6", "#eef2f6");
  PROP.board(0, -D / 2 + .2, 0, ["TRAINING CENTER", "Learn it here. Use it on the job."], { w: 6, h: 2.2, bg: "#1b5ea6", fg: "#fff", size: 54 });
  for (const x of [-4.5, -1.5, 1.5, 4.5]) for (const z of [-1, 2]) PROP.desk(x, z, Math.PI, { screen: "#5fb320", chair: "#c0392b" });
  const prof = addNPC({ kind: "npc", name: "Prof. Ellis", role: "Instructor", look: lookFor("Prof Ellis"), x: 0, z: -4.4, ry: 0, alwaysLabel: true }); prof.onTalk = () => openTraining();
  const ex = PROP.door(W / 2 - .15, 3, -Math.PI / 2, "LOBBY"); addInter({ name: "Back to lobby", verb: "Back to the lobby", x: W / 2 - 1.2, z: 3, r: 1.8, mesh: ex, action: () => goLocation("lobby", { text: "Lobby" }) });
  for (let i = 0; i < 3; i++) { const nm = `${pick(FIRST)} ${pick(LAST)}`; addNPC({ kind: "npc", name: nm, role: "Trainee", look: lookFor(nm), x: [-4.5, 1.5, 4.5][i], z: [-1, 2, -1][i] + .78, ry: Math.PI, sit: true }).onTalk = n => npcSay(n, pick(["These certificates actually help on the job.", "I failed the quiz twice. Third time's the charm!", "Prof. Ellis knows everything."])); }
  furnish("training", W, D);
  spawnPlayer(W / 2 - 2, 3, -Math.PI / 2);
}

/* ---------- department floors ---------- */
function roster(job) { const r = seeded(job.id + "crew"); const out = []; const used = new Set([job.mentor.name]); while (out.length < 8) { const nm = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`; if (used.has(nm)) continue; used.add(nm); out.push(nm); } return out; }
function buildFloor(job, o) {
  CUR_JOB = job.id; const th = THEMES[job.id] || THEMES.it; const lay = th.layout || "office";
  const W = lay === "office" ? 28 : 30, D = lay === "office" ? 22 : 24; E.weather = S.weather;
  buildRoom(W, D, th.floor, th.carpet, th.wall, { dim: th.dim });
  if (th.dim) { E.hemi.intensity = .55; }
  elevator(-D / 2); addInter({ name: "Elevator", verb: SH ? "Elevator (ends your shift)" : "Ride the elevator", x: 0, z: -D / 2 + 1.4, r: 2, h: 3.2, action: openElevator });
  const crew = roster(job); const F = { W, D, seats: [], coffee: null, sofa: null, printer: null, lunch: [], wander: [] };
  const premium = (typeof DEPT_STYLE !== "undefined" && DEPT_STYLE[job.id] === "premium");
  const deskOpts = premium ? { screen: job.color, top: "#5a3a22", chair: "#1d1d1d", exec: true } : { screen: job.color, cubicle: th.panel ? mutePanel(th.panel) : undefined };
  if (lay === "office") {
    const xs = [-10, -6, 6, 10], zs = [-6, -2.2, 1.6];
    xs.forEach(x => zs.forEach(z => { const d = PROP.desk(x, z, 0, deskOpts); F.seats.push(d); }));
    const md = PROP.desk(10, 8.4, 0, { screen: job.color, top: "#8a5a3b", chair: "#1d1d1d" }); F.mentorSeat = md;
    PROP.plant(12.6, 9.4); PROP.board(12.85, 6.3, -Math.PI / 2, [job.mentor.name.split(" ")[0] + "'s office"], { w: 1.8, h: .6, bg: "#20252c", fg: "#fff", size: 50 });
    F.coffee = PROP.coffee(-W / 2 + .7, 5.6, Math.PI / 2); F.coffeePos = [-W / 2 + 1.7, 5.6]; PROP.cooler(-W / 2 + .7, 3.6);
    F.sofa = PROP.sofa(-10, D / 2 - 1.1, Math.PI, "#c0392b"); F.sofaPos = [-10, D / 2 - 2.2]; PROP.plant(-12.8, D / 2 - .8);
    F.printerPos = [-5.6, D / 2 - .9]; F.printer = PROP.printer(-5.6, D / 2 - .9, Math.PI);
    F.lunch = [[-11.5, 7.5], [-10, 7.6], [-8.5, 7.5], [-12, 8.8], [-8, 8.8], [-9.2, 6.4], [-10.8, 6.4], [-7, 7]];
    F.corr = x => x < 0 ? -8 : 8; F.mainZ = 4.8;
    th.props.forEach(p => {
      if (p.startsWith("screen:")) PROP.screen(-6, -D / 2 + .25, 0, p.slice(7), job.color);
      if (p === "servers") for (let i = 0; i < 5; i++) PROP.server(W / 2 - .8, -9 + i * 1, -Math.PI / 2);
      if (p === "soc") { PROP.screen(6, -D / 2 + .25, 0, "ALERTS: 3 OPEN", "#ff4d4d"); for (let i = 0; i < 3; i++) PROP.server(W / 2 - .8, -9 + i, -Math.PI / 2); }
      if (p === "whiteboard") PROP.board(W / 2 - .2, -2, -Math.PI / 2, ["THIS WEEK", "• ship the fix", "• review PRs", "• demo Friday"], { w: 2.8, h: 1.7, size: 40 });
      if (p === "beanbags") { PROP.beanbag(12.2, 1.2, "#e2513a"); PROP.beanbag(12.4, 3, "#2a7fd4"); }
      if (p === "cabinets") for (let i = 0; i < 5; i++) PROP.cabinet(W / 2 - .5, -9.4 + i * .75, -Math.PI / 2);
      if (p === "meeting") PROP.table(6, -9.2, 0, 3.2, 6, "#5a3b28");
      if (p === "columns") for (const x of [-3, 3]) PROP.fm("Column_Round2", x, -D / 2 + 1.3, 0, { s: .8 });
      if (p === "vault") { PROP.board(W / 2 - .2, -6.5, -Math.PI / 2, ["VAULT"], { w: 2.2, h: 2.2, bg: "#8a8f98", fg: "#20252c", size: 60 }); }
      if (p === "posters") { PROP.poster(W / 2 - .2, -6, -Math.PI / 2, "THINK BIG", "#e2513a"); PROP.poster(W / 2 - .2, 1.5, -Math.PI / 2, "TEST IT", "#6a3fc1"); }
    });
    if (!th.props.some(p => p === "servers" || p === "soc" || p === "cabinets")) PROP.plant(W / 2 - .8, -9.6, 1.2);
  } else if (lay === "warehouse") {
    [-11, -7, 7, 11].forEach(x => PROP.shelf(x, -3, Math.PI / 2, 10));
    [[-4.5, 10.3], [4.5, 10.3], [12.5, 9.5], [-12.6, -10]].forEach(([x, z]) => PROP.pallet(x, z));
    PROP.forklift(-12.4, 7.5, 0);
    for (const x of [-2.8, 2.8]) box(E.world, .12, .02, 17, "#f2c41c", x, 0, -2.5, { cast: false });
    PROP.board(W / 2 - .2, 4, -Math.PI / 2, ["DOCK 3", "Receiving"], { w: 3.4, h: 2.4, bg: "#7d8794", fg: "#fff" });
    F.coffee = PROP.coffee(W / 2 - .7, -9.6, -Math.PI / 2); F.coffeePos = [W / 2 - 1.7, -9.6];
    F.sofa = PROP.sofa(10.5, D / 2 - 1.1, Math.PI, "#2f6fb5"); F.sofaPos = [10.5, D / 2 - 2.2];
    F.printerPos = [7, D / 2 - .9]; F.printer = PROP.printer(7, D / 2 - .9, Math.PI);
    F.lunch = [[9, 8.6], [10.5, 8.6], [12, 8.6], [9.6, 7.4], [11.4, 7.4], [8.2, 9.6], [12.8, 7.8], [10.5, 6.4]];
    F.wander = [[-9, -8], [-9, 1], [9, -8], [9, 1], [0, -6], [0, 1], [-4, 6], [4, 6]];
    F.corr = x => x; F.mainZ = 5.5;
  } else if (lay === "open") {
    F.coffee = PROP.coffee(-W / 2 + .7, 6.6, Math.PI / 2); F.coffeePos = [-W / 2 + 1.7, 6.6];
    F.sofa = PROP.sofa(-10, D / 2 - 1.1, Math.PI, "#2f6fb5"); F.sofaPos = [-10, D / 2 - 2.2];
    F.printerPos = [-5.5, D / 2 - .9]; F.printer = PROP.printer(-5.5, D / 2 - .9, Math.PI);
    F.lunch = [[-11.5, 8.2], [-10, 8.4], [-8.5, 8.2], [-12, 9.4], [-8, 9.4], [-9.2, 7.2], [-10.8, 7.2], [-7, 7.8]];
    F.wander = th.wander || [[-6, -6], [6, -6], [-6, 2], [6, 2], [0, -4], [-3, 5], [3, 5], [9, -2]];
    F.corr = x => x; F.mainZ = 5.5;
    if (th.build) th.build(W, D, job, F);
    th.props.forEach(p => { if (p.startsWith("screen:")) PROP.screen(-6, -D / 2 + .25, 0, p.slice(7), job.color); });
  } else {
    [-11, -7].forEach(x => [-6, -2, 2].forEach(z => F.seats.push(PROP.desk(x, z, 0, deskOpts))));
    PROP.truck(10.5, -1, 0); [[6.5, -7], [6.5, -5.4], [6.5, 4.6], [13.4, 7]].forEach(([x, z]) => PROP.pallet(x, z));
    PROP.board(W / 2 - .2, -9, -Math.PI / 2, ["LOADING BAY"], { w: 3, h: 1.2, bg: "#e07b1a", fg: "#fff" });
    F.mentorSeat = PROP.desk(-11, 8.4, 0, { screen: job.color, top: "#8a5a3b", chair: "#1d1d1d" });
    F.coffee = PROP.coffee(-W / 2 + .7, 4.6, Math.PI / 2); F.coffeePos = [-W / 2 + 1.7, 4.6];
    F.sofa = PROP.sofa(-6.5, D / 2 - 1.1, Math.PI, "#c0392b"); F.sofaPos = [-6.5, D / 2 - 2.2];
    F.printerPos = [-3.6, D / 2 - .9]; F.printer = PROP.printer(-3.6, D / 2 - .9, Math.PI);
    F.lunch = [[-8, 7.2], [-6.5, 7.4], [-5, 7.2], [-7.4, 8.6], [-5.6, 8.6], [-9, 8.2], [-4.2, 8.4], [-6.5, 6.2]];
    F.corr = () => -9; F.mainZ = 4.8; F.wander = [[4, -8], [4, 3], [8, 6], [3, 7]];
    th.props.forEach(p => { if (p.startsWith("screen:")) PROP.screen(-6, -D / 2 + .25, 0, p.slice(7), job.color); });
  }
  // your desk
  const pd = PROP.desk(0, 7.2, Math.PI, { phone: true, screen: job.color, chair: SHIRTS[S.player.look.shirt] });
  deptSignature(job, lay, W, D, F); applyDeptStyle(job, lay, W, D, F);
  PROP.myCubicle(0, 8.55, th.panel ? shade(th.panel, -.05) : "#6b4f3a"); PROP.clutter(pd.g, 1); PROP.clutter(pd.g, -1); collider(0, 8.55, 2.7, .2);
  PROP.clock(4.2, -D / 2 + .2, 0); PROP.cork(-W / 2 + .2, -6, Math.PI / 2); if (lay === "office") PROP.cork(-W / 2 + .2, 0.5, Math.PI / 2, 1.75, 1.5, .9);
  decorateDesk(pd.g); F.desk = pd; F.deskPos = V3(0, 0, 7.2);
  const deskInter = addInter({ name: "Your desk", verb: "Check your desk", x: 0, z: 7.2, r: 2, h: 1.9, mesh: pd.g, mark: () => { if (!SH) return ""; const d = SH.list.find(x => x.state === "active" && x.desk); return d ? (d.urgent ? "!!" : "!") : ""; }, action: deskAction });
  E.anims.push(dt => { if (SH && SH.list.some(x => x.state === "active" && x.desk) && pd.g.children.length) { const ph = pd.g.children.find(c => c.geometry && c.geometry.parameters.width === .22); if (ph) ph.rotation.z = Math.sin(E.t * 40) * .08 * (Math.sin(E.t * 3) > 0 ? 1 : 0); } });
  addInter({ name: "Coffee machine", verb: "Make a coffee (+energy, 10 min)", x: F.coffeePos[0], z: F.coffeePos[1], r: 1.6, h: 1.8, action: drinkCoffee });
  addInter({ name: "Break sofa", verb: "Take a break (−stress, 20 min)", x: F.sofaPos[0], z: F.sofaPos[1], r: 1.7, h: 1.4, action: takeBreak });
  // people
  const mentor = lay === "warehouse" || lay === "open"
    ? addNPC({ kind: "mentor", name: job.mentor.name, role: job.mentor.title, look: lookFor(job.mentor.name), x: -5, z: 7.4, ry: 0 })
    : addNPC({ kind: "mentor", name: job.mentor.name, role: job.mentor.title, look: lookFor(job.mentor.name), x: F.mentorSeat.seat.x, z: F.mentorSeat.seat.z, ry: 0, sit: true });
  F.mentor = mentor;
  const seatOrder = seeded(job.id + "seats");
  const seats = F.seats.slice().sort(() => seatOrder() - .5);
  crew.forEach((nm, i) => {
    const look = lookFor(nm);
    if (th.headset) look.headset = true;
    if (th.uniform) Object.assign(look, { shirtHex: th.uniform.shirt, pantsHex: th.uniform.pants, outfit: th.uniform.outfit ?? look.outfit, modular: th.uniform.mod });
    const standing = lay === "warehouse" || lay === "open";
    if (!standing && i < Math.min(7, seats.length)) { const s = seats[i]; const n = addNPC({ kind: "coworker", name: nm, role: job.dept, look, x: s.seat.x, z: s.seat.z, ry: s.ry, sit: true }); n.hearts = S.friends[nm] || 0; n.life = "desk"; n.next = 4 + Math.random() * 16; }
    else if (standing && i < 6) { const [x, z] = F.wander[i % F.wander.length]; const n = addNPC({ kind: "coworker", name: nm, role: job.dept, look, x, z }); n.hearts = S.friends[nm] || 0; n.life = "wander"; n.next = 2 + Math.random() * 8; }
  });
  E.F = F; if (lay === "office") furnish("office", W, D, { F });
  if (lay === "office" || lay === "logistics") scatterClutter(W, D, (x, z) => Math.abs(x) < 3 || E.colliders.some(b => x > b.minX - .2 && x < b.maxX + .2 && z > b.minZ - .2 && z < b.maxZ + .2));
  spawnPlayer(0, -D / 2 + 1.9, 0); E.elevOpenUntil = E.t + 2.5;
  if (!SH) setTimeout(() => { if (LOC === "floor" && CUR_JOB === job.id && !SH) npcSay(mentor, S.workedToday ? "You've worked today. Go home and rest!" : `Hey ${S.player.name.split(" ")[0]}! Come talk to me to clock in.`, 6); }, 900);
}
function decorateDesk(g) {
  const d = (w, h, dd, c, x, y, z, m) => box(g, w, h, dd, c, x, y, z, { m });
  if (owns("plant")) { d(.18, .18, .18, "#c2683a", .62, .8, .15); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 0), mat("#3f9a3a")); l.position.set(.62, 1.1, .15); g.add(l); }
  if (owns("monitor")) { d(.62, .38, .05, "#20252c", -.55, .95, .22); const s = new THREE.Mesh(bgeo(.56, .32, .01), new THREE.MeshBasicMaterial({ color: "#7cd17c" })); s.position.set(-.55, 1.14, .19); g.add(s); }
  if (owns("mug")) d(.1, .12, .1, "#e2513a", .35, .8, -.2);
  if (owns("lamp")) { d(.06, .45, .06, "#333", -.7, .8, -.25); d(.22, .1, .22, "#f5c518", -.7, 1.22, -.2, { emissive: "#ffb000", emissiveIntensity: .5 }); }
  if (owns("figure")) { d(.1, .14, .08, "#9aa4b0", .45, .8, .25); d(.08, .08, .08, "#c9d2db", .45, .94, .25); }
  if (owns("poster")) PROP.board(0, 8.25, Math.PI, ["YOU GOT THIS"], { w: 1, h: .6, bg: "#6a3fc1", fg: "#fff", size: 60 });
  if (Object.keys(S.ach).length >= 5) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .04, .14, 10), mat("#f5c518", { shininess: 120, specular: 0xffffff })); c.position.set(-.3, .9, .3); g.add(c); }
}

/* ---------- coworker life ---------- */
function wander(n, pts) { n.life = "wanderFree"; n.wpts = pts; n.next = 1 + Math.random() * 4; }
function lifeTick(dt) {
  const F = E.F;
  for (const n of E.npcs) {
    if (n.life === "wanderFree") { if (!n.path.length && (n.next -= dt) < 0) { const p = pickClear(n); if (p) walkTo(n, [p]); n.next = 3 + Math.random() * 6; } continue; }
    if (n.kind !== "coworker" || !F) continue;
    const lunchTime = SH && SH.minute >= 180 && SH.minute < 225;
    if (lunchTime && n.life !== "lunch" && n.life !== "lunchGo") { goLunch(n); continue; }
    if (!lunchTime && (n.life === "lunch")) { goBack(n); continue; }
    if (n.path.length || n.life === "lunchGo" || n.life === "back") continue;
    if ((n.next -= dt) > 0) continue;
    if (n.life === "desk") {
      const r = Math.random();
      if (r < .5 && F.coffeePos) { n.life = "coffee"; n.mode = "idle"; const [cx, cz] = F.coffeePos; walkTo(n, [[F.corr(n.home.x), n.home.z], [F.corr(n.home.x), F.mainZ], [cx + (Math.random() - .5), cz + .8]], m => { m.faceTarget = V3(cx - 1, 0, cz); npcSay(m, pick(["Coffee time.", "Ahh, caffeine.", "Third cup today..."]), 3); m.next = 6; }); }
      else { const other = pick(E.npcs.filter(m => m !== n && m.kind === "coworker" && m.life === "desk" && !m.path.length)); if (other) { n.life = "chat"; n.mode = "idle"; walkTo(n, [[F.corr(n.home.x), n.home.z], [F.corr(other.home.x), other.home.z], [other.home.x + (other.home.x > F.corr(other.home.x) ? -.9 : .9), other.home.z]], m => { m.faceTarget = other.mesh.position.clone(); other.faceTarget = m.mesh.position.clone(); other.mode = "talk"; m.mode = "talk"; npcSay(m, pick(CHATTER), 4); setTimeout(() => other.speech !== undefined && npcSay(other, pick(["Ha! Same.", "Tell me about it.", "No way!", "Totally."]), 3), 1800); m.next = 6; m.chatWith = other; }); } else n.next = 10; }
    } else if (n.life === "coffee" || n.life === "chat") { if (n.chatWith) { n.chatWith.mode = n.chatWith.home.mode; n.chatWith.faceTarget = null; n.chatWith = null; } goBack(n); }
    else if (n.life === "wander") { if (F.wander.length) { const [x, z] = pick(F.wander); walkTo(n, [[n.mesh.position.x, F.mainZ], [x, F.mainZ], [x, z]]); n.next = 4 + Math.random() * 8; n.mode = "idle"; } }
  }
}
function goLunch(n) { const F = E.F; n.life = "lunchGo"; n.mode = "idle"; const spot = F.lunch[E.npcs.filter(m => m.kind === "coworker").indexOf(n) % F.lunch.length]; const start = n.home.mode === "type" ? [[F.corr(n.home.x), n.home.z], [F.corr(n.home.x), F.mainZ]] : [[n.mesh.position.x, F.mainZ]]; walkTo(n, [...start, [spot[0], F.mainZ], spot], m => { m.life = "lunch"; m.mode = "talk"; m.faceTarget = V3(F.lunch[0][0] + 1, 0, F.lunch[0][1]); if (Math.random() < .5) npcSay(m, pick(["Lunch break!", "Pizza or salad?", "I'm starving.", "Did you try the new sandwich place?"]), 4); }); }
function goBack(n) { const F = E.F; n.faceTarget = null; n.mode = "idle"; if (n.home.mode !== "type") { n.life = "wander"; n.next = 1; return; } n.life = "back"; walkTo(n, [[n.mesh.position.x, F.mainZ], [F.corr(n.home.x), F.mainZ], [F.corr(n.home.x), n.home.z], [n.home.x, n.home.z]], m => { m.life = "desk"; m.mode = "type"; m.mesh.rotation.y = m.home.ry; m.next = 15 + Math.random() * 40; }); }
function coworkerTalk(n) {
  const job = jobById(CUR_JOB); const key = S.day + "|" + n.name; let msg;
  if (!S.talked[key]) { S.talked[key] = 1; n.hearts = Math.min(5, (S.friends[n.name] || 0) + 1 + (owns("figure") && Math.random() < .5 ? 1 : 0)); S.friends[n.name] = n.hearts; n.labelKey = ""; save(); if (SH) { SH.energy = Math.min(100, SH.energy + 3); SH.stress = Math.max(0, SH.stress - 5); } checkAch();
    const tasks = job ? job.tasks : []; msg = Math.random() < .55 && tasks.length ? "Tip: " + pick(tasks).lesson.split(". ")[0] + "." : pick(CHATTER);
    const mem = Math.random() < .5 && memoryLine(n); if (mem) msg = mem; else remember(n, msg);
    if (n.hearts === 3) msg = "You're alright! If you're swamped, I'll cover a visitor for you."; }
  else msg = pick(["Back to work!", "Good luck today!", "Let me know if you need anything.", n.hearts >= 3 ? "I've got your back today." : "Busy busy!"]);
  npcSay(n, msg, 5); Sfx.click();
}
function mentorTalk(n) {
  const job = jobById(CUR_JOB);
  if (SH) { npcSay(n, pick(["You're doing fine. Check who's waiting longest first.", "Don't forget coffee if you're running low on energy.", "Stressed? A short break helps you think clearly.", "Read the attachments. The answer is often right there."]), 5); return; }
  openClockIn(job);
}

/* ---------- elevator ---------- */
function openElevator() {
  const fl = JOBS.slice().sort((a, b) => b.floor - a.floor);
  const ov = overlay(`<div class="panel modal elev"><div class="bar">Elevator <span class="dots"><i></i><i></i><i></i></span></div><div class="m-body">
    ${SH && LOC === "cafe" ? `<div class="warnbox gold">On your lunch break. Pick your floor (${esc(SH.job.dept)}) to get back to work. Any other floor ends your shift.</div>` : SH ? `<div class="warnbox">You're on shift. ${isLunch() ? "It's lunch time: the Cafeteria won't end your shift." : "Leaving now ends your shift with no pay."}</div>` : ""}
    <div class="elev-grid">${fl.map(j => { const js = S.jobs[j.id]; const fired = js && js.firedUntil > S.day; return `<button class="ebtn ${CUR_JOB === j.id ? "here" : ""}" type="button" data-f="${j.id}" ${fired ? 'title="Fired"' : ""}><span class="enum">${j.floor}</span><span class="tile" style="--c:${j.color}">${icon(j.icon)}</span><span class="etxt"><b>${j.dept}</b><small>${fired ? `Fired until day ${js.firedUntil}` : js && js.days ? titleFor(j, js.xp) : "Not started"}</small></span></button>`; }).join("")}
      ${S.roof ? `<button class="ebtn ${LOC === "roof" ? "here" : ""}" type="button" data-f="roof"><span class="enum">R</span><span class="tile" style="--c:#2f6b3a">🌿</span><span class="etxt"><b>Rooftop Garden</b><small>Secret floor</small></span></button>` : ""}
      <button class="ebtn ${LOC === "cafe" ? "here" : ""}" type="button" data-f="cafe"><span class="enum">C</span><span class="tile" style="--c:#c0392b">${icon("pan")}</span><span class="etxt"><b>Cafeteria</b><small>${SH && isLunch() ? "Lunch is served!" : "Lunch at 12:00"}</small></span></button>
      <button class="ebtn ${LOC === "lobby" ? "here" : ""}" type="button" data-f="lobby"><span class="enum">G</span><span class="tile" style="--c:#7d8794">${icon("case")}</span><span class="etxt"><b>Lobby</b><small>Training, daily challenge, exit</small></span></button></div>
    <button class="btn grey" type="button" data-x>Stay here</button></div></div>`);
  $$("[data-f]", ov).forEach(b => b.addEventListener("click", () => {
    const f = b.dataset.f;
    if (SH && LOC === "cafe" && f === SH.job.id) { ov.close(); return backFromLunch(); }
    if (f === "cafe" && LOC === "cafe") return ov.close();
    if (f === "cafe" && SH && !canGoToLunch()) { toast(isLunch() ? "Finish helping the people waiting on you first." : "The Cafeteria is for lunch (12:00). Leaving now would end your shift.", "red"); return; }
    ov.close();
    if (f === "cafe") { Sfx.tone(988, .3, "sine", .05); return goCafe(); }
    if (SH) { SH = null; toast("You left your shift. No pay today."); S.workedToday = true; S.phase = "evening"; save(); }
    Sfx.tone(988, .3, "sine", .05); Sfx.tone(784, .4, "sine", .05, .25);
    rideTalk(() => elevatorRide(f === "roof" ? "R" : f === "lobby" ? "G" : jobById(f).floor, () => { if (f === "roof") goLocation("roof", { fromElevator: true, text: "Rooftop Garden" }); else if (f === "lobby") goLocation("lobby", { fromElevator: true, text: "Going down..." }); else goLocation("floor", { job: f, text: `Floor ${jobById(f).floor}: ${jobById(f).dept}` }); }));
  }));
  $("[data-x]", ov).addEventListener("click", () => ov.close());
}

/* ---------- clock in ---------- */
function openClockIn(job) {
  const js = jobState(job.id); const L = lvl(js.xp), next = LEVELS[L + 1]; const proj = PROJECTS[job.id]; const ps = S.projects[job.id] || 0;
  const fired = js.firedUntil > S.day;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">${job.dept}: talk with ${job.mentor.name}</div><div class="m-body">
    <div class="row"><div class="tile" style="--c:${job.color}">${icon(job.icon)}</div><div><b class="h">${titleFor(job, js.xp)}</b><div class="small">${js.days} shifts · best ${js.days ? stars(js.best) : "none yet"}${js.raise ? ` · raise +${Math.round(js.raise * 100)}%` : ""}</div></div></div>
    <div class="meter"><i style="width:${next ? (js.xp - LEVELS[L].xp) / (next.xp - LEVELS[L].xp) * 100 : 100}%;--c:${job.color}"></i></div><div class="small">${next ? `${js.xp}/${next.xp} XP to ${next.name}` : "Top level"}</div>
    <div class="bubble"><b class="name">${job.mentor.name.split(" ")[0]}:</b> ${fired ? `HR says you can come back on day ${js.firedUntil}. Use the time to train up.` : S.workedToday ? "You already worked today. Go home, sleep, and come back tomorrow." : job.mentor.hello.replace(/\{name\}/g, esc(S.player.name.split(" ")[0]))}</div>
    ${proj ? `<div class="small"><b>Project:</b> ${proj.name} · ${ps >= 3 ? "complete ✔" : `stage ${ps + 1} of 3 (shows up at your desk)`}</div>` : ""}
    ${js.strikes ? `<div class="warnbox">${js.strikes} bad shift${js.strikes > 1 ? "s" : ""} in a row. Three and you're fired.</div>` : ""}
    ${!fired && !S.workedToday ? `<div><span class="lbl">Difficulty</span><div class="seg" id="dseg">${Object.entries(DIFF).map(([k, v]) => `<button type="button" data-d="${k}" aria-pressed="${S.diff === k}">${v.name}</button>`).join("")}</div><div class="small" id="ddesc">${DIFF[S.diff].desc}</div></div>` : ""}
    ${S.day >= 5 && !fired && !S.workedToday ? `<label class="set"><input type="checkbox" id="nightCk"> 🌙 Night shift: +30% pay, quieter floor, a bit more tiring</label>` : ""}
    <div class="row wrap">${!fired && !S.workedToday ? `<button class="btn go big" type="button" id="ci">Clock in</button>` : ""}<button class="btn grey" type="button" id="jr">Journal</button><button class="btn grey" type="button" id="ask">Ask anything</button>${canAskRaise(js) && !fired ? `<button class="btn orange" type="button" id="raise">Ask for a raise</button>` : ""}<button class="btn grey" type="button" id="cx">Not yet</button></div></div></div>`);
  Voice.say(fired ? `HR says you can come back on day ${js.firedUntil}.` : S.workedToday ? "You already worked today. Go home, sleep, and come back tomorrow." : job.mentor.hello.split("{name}").join(S.player.name.split(" ")[0]), job.mentor.name, 2, !fired && !S.workedToday ? "hello|" + job.id : undefined);
  $$("#dseg button", ov).forEach(b => b.addEventListener("click", () => { S.diff = b.dataset.d; save(); $$("#dseg button", ov).forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#ddesc", ov).textContent = DIFF[S.diff].desc; Sfx.click(); }));
  const ci = $("#ci", ov); if (ci) ci.addEventListener("click", () => { ov.close(); const night = !!($("#nightCk", ov) && $("#nightCk", ov).checked); if (needsInterview(job)) openInterview(job, () => startShift(job, false, night)); else maybeOvertime(job, ot => startShift(job, ot, night)); });
  $("#jr", ov).addEventListener("click", () => { ov.close(); openPhone("journal", job.id); });
  $("#ask", ov).addEventListener("click", () => { ov.close(); openAskMentor(job); });
  const rb = $("#raise", ov); if (rb) rb.addEventListener("click", () => { ov.close(); openRaise(job); });
  $("#cx", ov).addEventListener("click", () => ov.close());
}

/* ---------- shift ---------- */
Object.assign(DIFF.easy, { patience: 150 }); Object.assign(DIFF.normal, { patience: 105 }); Object.assign(DIFF.hard, { patience: 75 });
function chooseTasks(job, js, n) {
  const maxTier = clamp(lvl(js.xp) + 1 + (S.diff === "hard" ? 1 : 0) + adaptiveTierShift(js), 1, 3);
  return job.tasks.filter(t => !t.curveball).map(t => ({ t, s: (t.tier > maxTier ? 10 * (t.tier - maxTier) : 0) + (js.done[t.id] === "ok" ? 4 : js.done[t.id] === "fail" ? -1 : 0) + Math.random() * 3 })).sort((a, b) => a.s - b.s).slice(0, n).map(x => x.t);
}
function startShift(job, ot, night) {
  const js = jobState(job.id); const diff = DIFF[S.diff]; const rush = S.stats.shifts > 0 && Math.random() < .15;
  const nReg = rush ? 7 : S.diff === "easy" ? 4 : 5; const gens = GENS[job.id] || [];
  const nGen = gens.length ? Math.min(2, Math.max(1, Math.floor(nReg / 3))) : 0;
  const tasks = chooseTasks(job, js, nReg - nGen).concat(Array.from({ length: nGen }, (_, i) => gens[i % gens.length]()));
  const list = tasks.map(t => ({ t, urgent: false }));
  const ps = S.projects[job.id] || 0; const proj = PROJECTS[job.id];
  if (proj && ps < 3 && js.days >= 1) { const base = job.tasks.find(t => t.id === proj.stages[ps]); if (base) list.push({ t: Object.assign({}, base, { subject: `Project: ${proj.name} (${ps + 1}/3)`, from: [job.mentor.name + " (project)", "Project email"] }), project: true, baseId: base.id }); }
  const nUrg = rush ? 2 : Math.random() < diff.curve ? 1 : 0;
  const cbs = shuffle(job.tasks.filter(t => t.curveball).concat(job.tasks.filter(t => t.tier === 3 && !t.curveball && !tasks.includes(t))));
  for (let i = 0; i < nUrg && cbs[i]; i++) list.push({ t: cbs[i], urgent: true });
  const regs = list.filter(x => !x.urgent && !x.project), last = rush ? 360 : 400;
  regs.forEach((x, i) => x.at = i === 0 ? 3 : i === 1 ? 18 : 18 + (last - 18) * (i - 1) / Math.max(1, regs.length - 2) + Math.random() * 15);
  list.filter(x => x.project).forEach(x => x.at = 60);
  list.filter(x => x.urgent).forEach((x, i) => x.at = 130 + i * 110 + Math.random() * 60);
  list.forEach(x => { x.state = "wait"; x.patienceRatio = 1; });
  const startPerf = 70 + HOMES[S.home].perf + (owns("chair") ? 5 : 0) + S.nextPerf; S.nextPerf = 0;
  SH = { job, js, diff, rush, list: list.sort((a, b) => a.at - b.at), minute: 0, perf: clamp(startPerf, 10, 100), energy: 100, stress: 10, xp: 0, bonus: 0, mistakes: 0, firstMistake: true, freeHints: (owns("monitor") ? 1 : 0) + (has("favorite") ? 1 : 0), covered: false, deskPos: E.F.deskPos, deskInter: E.inters.find(i => i.name === "Your desk"), event: Math.random() < .6 ? { kind: pick(["fire", "dog", "ceo", "pizza", "birthday", "badge", "pigeon"]), at: 140 + Math.random() * 180, done: false } : null, spot: {} };
  burnStart(SH); if (S.coffeeBuff === S.day) { SH.energy = Math.min(100, SH.energy + 10); S.coffeeBuff = 0; } if (ot) addOvertime(SH); if (night) nightStart(SH);
  save(); hud(); Sfx.ok(); standUp(job, SH);
  toast(rush ? `<b>${RUSH[job.id] || "Rush day"}!</b> Extra tasks, extra urgent, 1.5× pay.` : `Shift started. Help everyone who comes to you, and check your desk.`, rush ? "red" : "");
  if (S.weather === "rain") setTimeout(() => toast("It's raining. People are a bit grumpier today (less patience)."), 1800);
}
function spawnTask(x) {
  const t = x.t, job = SH.job; x.state = "active";
  const pat = SH.diff.patience * (x.urgent ? .55 : 1) * (has("people") ? 1.25 : 1) * (owns("watch") ? 1.2 : 1) * (S.weather === "rain" ? .9 : 1) * (x.project ? 2.5 : 1);
  x.patience = x.max = pat; x.patienceRatio = 1;
  if (x.urgent) { SH.stress = Math.min(100, SH.stress + 6); const n = $("#notif"); $("#notifBody").innerHTML = `<b>${esc(t.from[0])}:</b> ${esc(t.subject.replace(/^URGENT:\s*/, ""))}`; n.classList.add("show"); Sfx.alarm(); setTimeout(() => n.classList.remove("show"), 3800); }
  const isDesk = x.project || t.type === "code" || t.type === "terminal" || DESK_RE.test(t.from[1]);
  if (isDesk) { x.desk = true; if (!x.urgent) { Sfx.tone(1318, .12, "sine", .05); Sfx.tone(1046, .16, "sine", .05, .14); } toast(`<b>${x.urgent ? "URGENT at your desk" : "New at your desk"}:</b> ${esc(t.subject)}`, x.urgent ? "red" : ""); return; }
  if (t.from[0] === job.mentor.name && E.F.mentor) { x.npc = E.F.mentor; E.F.mentor.task = x; E.F.mentor.labelKey = ""; toast(`<b>${esc(job.mentor.name.split(" ")[0])}</b> needs you.`); return; }
  const spotIdx = SPOTS.findIndex((_, i) => !SH.spot[i]); const sp = SPOTS[spotIdx < 0 ? 0 : spotIdx]; SH.spot[spotIdx] = x;
  const D = E.room.D; const npc = addNPC({ kind: "visitor", name: t.from[0], role: t.from[1], look: lookFor(t.from[0]), x: 0, z: -D / 2 + 1.1, ry: 0 });
  npc.task = x; x.npc = npc; x.spotIdx = spotIdx; E.elevOpenUntil = E.t + 2;
  walkTo(npc, [[0, sp[1] - .01], [sp[0], sp[1]]], n => { n.faceTarget = V3(0, 0, 7.2); });
  if (x.urgent) npc.speed = 3.2;
}
function finishShiftTask(x, ok, score) {
      if (!SH) return 0; const job = SH.job; const js = SH.js; let xp = ok ? Math.round(x.t.tier * 10 * SH.diff.xp * (x.urgent ? 2 : 1) * (has("learner") ? 1.15 : 1)) : 2;
      SH.xp += xp; SH.energy = Math.max(0, SH.energy - 4);
      if (ok) { changePerf(SH.diff.right + (x.urgent ? 4 : 0)); if (x.urgent) { SH.bonus += 25; S.stats.urgentWins++; } SH.stress = Math.max(0, SH.stress - 4); }
      else { let w = SH.diff.wrong * (SH.stress > 70 ? 1.5 : 1); if (has("detail") && SH.firstMistake) w *= .5; SH.firstMistake = false; changePerf(w); SH.mistakes++; SH.stress = Math.min(100, SH.stress + 8); }
      const id = x.baseId || x.t.id; js.done[id] = ok ? "ok" : (js.done[id] === "ok" ? "ok" : "fail"); js.lessons[id] = { s: x.t.subject.replace(/^Project: /, ""), l: x.t.lesson, ok: ok || (js.lessons[id] && js.lessons[id].ok) };
      if (x.project && ok) { S.projects[job.id] = (S.projects[job.id] || 0) + 1; if (S.projects[job.id] >= 3) { S.money += 250; js.xp += 40; award("project"); toast(`<b>Project complete: ${PROJECTS[job.id].name}!</b> +$250, +40 XP`, "gold"); } else toast(`Project stage done. ${3 - S.projects[job.id]} to go.`); }
      if (ok) { Player.emote = "cheer"; Player.emoteUntil = E.t + 1.4; }
      resolveTask(x, ok); save(); checkAch();
      if (score !== null && score !== undefined && ok) xp = Math.round(xp * (.75 + score * .5));
      if (ok) { SH.combo = (SH.combo || 0) + 1; const m = 1 + Math.min(SH.combo - 1, 5) * .1; if (SH.combo > 1) { const extra = Math.round(xp * (m - 1)); xp += extra; SH.xp += extra; popText(`Combo ×${SH.combo}`, "gold"); } } else { if ((SH.combo || 0) >= 3) popText("Combo lost", "bad"); SH.combo = 0; }
      comboHud(); popText(`+${xp} XP`, ok ? "good" : "");
      return xp;
}
function resolveTask(x, ok) {
  x.state = ok === null ? "missed" : "done"; x.ok = !!ok;
  if (x.npc) {
    const n = x.npc; n.task = null; n.labelKey = "";
    if (n.kind === "visitor") { npcEmote(n, ok ? "cheer" : "sad", 1.6); if (ok === null) npcSay(n, "Forget it, I'll figure it out myself.", 3); else npcSay(n, ok ? pick(["Thank you so much!", "You're a lifesaver!", "Perfect, thanks!"]) : pick(["Hmm... that didn't really fix it.", "Okay... I guess.", "That wasn't what I needed."]), 3);
      setTimeout(() => { if (!n.mesh.parent) return; n.faceTarget = null; walkTo(n, [[0, n.mesh.position.z], [0, -E.room.D / 2 + 1]], m => { E.elevOpenUntil = E.t + 1.5; setTimeout(() => removeNPC(m), 700); }); }, 1600);
      if (x.spotIdx >= 0) SH.spot[x.spotIdx] = null; }
    else npcEmote(n, ok ? "cheer" : "sad", 1.6);
  }
}
function tick(dt) {
  Ambience.tick(dt); stormTick(dt); roomSounds(dt); if (LOC !== "floor" && LOC !== "title") wanderTick(dt); if (LOC === "floor" || LOC === "lobby") livingTick(dt); tutTick(dt); if (LOC !== "title") personalSpace(); feelTick(dt);
  if (E.F && LOC === "floor") lifeTick(dt);
  E.lightT = (E.lightT || 0) + dt; if (E.lightT > 1) { E.lightT = 0; if (LOC !== "title") setLighting(hourNow(), S.weather); if (CUR_JOB && THEMES[CUR_JOB] && THEMES[CUR_JOB].dim) E.hemi.intensity = .55; hudTick(); if (Music.out && Music.cur && musicFor() !== Music.want) Music.play(musicFor()); }
  const c = !E.uiOpen && LOC !== "title" ? candidates() : null; const pr = $("#prompt");
  if (c) { pr.hidden = false; const txt = promptText(c); if (pr.dataset.t !== txt) { pr.dataset.t = txt; $("#promptBtn").innerHTML = `<kbd>${E.touch ? "Tap" : "E"}</kbd> ${esc(txt)}`; } } else pr.hidden = true;
  if (!SH || E.uiOpen || LOC !== "floor") return;
  const active = SH.list.filter(x => x.state === "active"); const nextAt = (SH.list.find(x => x.state === "wait") || {}).at ?? 999;
  const ff = !active.length && nextAt > SH.minute + 8 ? 5 : 1;
  SH.minute += dt / SPM * ff;
  lunchCheck();
  SH.energy = Math.max(0, SH.energy - dt / SPM * ff * .1 * (has("stamina") ? .7 : 1));
  for (const x of SH.list) if (x.state === "wait" && x.at <= SH.minute) spawnTask(x);
  for (const x of active) {
    if ((x.npc && x.npc.path.length) || x.playing) continue;
    x.patience -= dt; x.patienceRatio = clamp(x.patience / x.max, 0, 1);
    SH.stress = Math.min(100, SH.stress + dt * (x.urgent ? .28 : .12) * (has("calm") ? .75 : 1) * (owns("poster") ? .9 : 1));
    if (x.patience <= 0) {
      const friend = !SH.covered && E.npcs.find(n => n.kind === "coworker" && (S.friends[n.name] || 0) >= 3);
      if (friend && !x.urgent) { SH.covered = true; resolveTask(x, true); x.covered = true; npcSay(friend, "I got this one for you!", 4); toast(`<b>${esc(friend.name.split(" ")[0])}</b> covered for you. That's what work friends are for.`, "gold"); }
      else { resolveTask(x, null); changePerf(-(S.diff === "hard" ? 14 : 10)); SH.stress = Math.min(100, SH.stress + 8); toast(`<b>${esc(x.t.from[0])}</b> gave up waiting.`, "red"); Sfx.bad(); }
    }
  }
  if (SH.event && !SH.event.done && SH.minute >= SH.event.at) startEvent(SH.event);
  if (SH.perf <= 0) return endShift(true);
  if (SH.minute >= 480) { SH.list.filter(x => x.state === "active").forEach(x => { resolveTask(x, null); }); return endShift(false); }
}
function changePerf(d) { SH.perf = clamp(SH.perf + d, 0, 100); const b = $("#perfBar"); if (!b) return; const r = b.getBoundingClientRect(); const f = document.createElement("div"); f.className = "floaty"; f.textContent = (d > 0 ? "+" : "") + Math.round(d) + "%"; f.style.color = d > 0 ? "var(--ok)" : "var(--bad)"; f.style.left = (r.left + r.width / 2 - 20) + "px"; f.style.top = (r.bottom + 6) + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1300); }
function deskAction() {
  if (!SH) { toast(LOC === "floor" ? "Your desk. Clock in with your mentor to start a shift." : "Nothing here."); return; }
  const x = SH.list.filter(y => y.state === "active" && y.desk).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))[0];
  if (x) openShiftTask(x); else toast("Your inbox is empty. Nice.");
}
function drinkCoffee() {
  if (!SH) { toast("Mmm, coffee. (It helps more during a shift.)"); return; }
  const gain = 25 * (has("coffee") ? 2 : 1) + (owns("mug") ? 5 : 0); SH.energy = Math.min(100, SH.energy + gain); SH.minute += 10; S.stats.coffees++; save(); checkAch();
  Player.emote = "cheer"; Player.emoteUntil = E.t + 1; Sfx.tone(300, .4, "sawtooth", .02); toast(`Coffee! +${gain} energy (10 minutes passed).`);
}
function takeBreak() {
  if (!SH) { toast("Comfy. Save it for when you're stressed at work."); return; }
  SH.stress = Math.max(0, SH.stress - 25); SH.energy = Math.min(100, SH.energy + 5); SH.minute += 20; toast("You took a short break. −25 stress (20 minutes passed)."); Sfx.click();
}

/* ---------- task window ---------- */
function openShiftTask(x) {
  if (x.playing) { toast("You're already working on this one. Follow the objective at the top."); return; }
  const job = SH.job;
  const timerBase = x.urgent ? SH.diff.urgent : SH.diff.timer;
  const timer = timerBase ? Math.round(timerBase * (owns("watch") ? 1 : 1) * (has("calm") ? 1.3 : 1) * (SH.energy < 30 && !has("unstoppable") ? .85 : 1)) : 0;
  const hintCost = SH.diff.hint * (SH.stress > 70 ? 2 : 1);
  const call = /phone|call|radio/i.test(x.t.from[1]);
  const pc = !call && x.desk ? (x.t.type === "code" ? ["CodePad", "#159a8a"] : x.t.type === "terminal" ? ["Terminal", "#20252c"] : x.t.type === "input" ? ["Sheets", "#3a9e2e"] : /chat/i.test(x.t.from[1]) ? ["LiveChat", "#d9a000"] : /ticket|system|alert|sla|testing/i.test(x.t.from[1]) ? ["Tickets", "#6a3fc1"] : ["Mail", "#2a7fd4"]) : null;
  const hk = handsOnFor(job, x); if (hk) { runHandsOn(hk, job, x, (ok, score) => finishShiftTask(x, ok, score)); return; }
  if (pc && E.F && E.F.deskPos) { Player.mesh.position.set(E.F.deskPos.x, 0, E.F.deskPos.z + .85); E.yaw = 0; E.pitch = -.22; E.seated = true; }
  openTaskWindow(x.t, { call, pc, color: x.urgent ? "#d6342c" : job.color, urgent: x.urgent, timer, mentor: job.mentor.name, hintCost, freeHint: () => SH.freeHints > 0 ? (SH.freeHints--, true) : false,
    onHint: c => { if (c) changePerf(c); },
    onFinish: ok => finishShiftTask(x, ok, null) });
}
function openTaskWindow(t, o) {
  let finished = false, hinted = false, timerId = null;
  const ov = overlay(`<div class="panel modal task"><div class="bar" style="--blue:${o.color}">${o.urgent ? "URGENT: " : ""}${esc(t.subject)}<span class="dots"><i></i><i></i><i></i></span></div>
    ${o.pc ? `<div class="osbar"><span class="oslogo">◆ Brightline OS</span><span class="osapp" style="--ac:${o.pc[1]}">${o.pc[0]}</span><span class="osclock">${fmtClock(hourNow())}</span></div>` : ""}
    <div class="win-body">
      ${o.call ? `<div class="callbar"><span class="cdot"></span>On the phone with ${esc(t.from[0].replace(/^(Caller|Driver|Radio|Picker):\s*/, ""))}<span class="small" style="margin-left:auto;color:#cfe">Line 1</span></div>` : ""}<div class="from">${avatar(hashAv(t.from[0]), 40)}<div><b>${esc(t.from[0])}</b><div class="small">${esc(t.from[1])} · ${"●".repeat(t.tier)}${"○".repeat(3 - t.tier)} difficulty</div></div><button class="btn grey sm listen" type="button" id="listenB" aria-label="Read the message aloud">🔊 Listen</button>${o.timer ? `<span class="timer" id="tmr">${o.timer}s</span>` : ""}</div>
      <div class="msg-text"><p>${t.msg}</p></div>
      ${t.doc ? `<details class="doc" open><summary>Attachment: ${t.doc.title}</summary><div class="doc-in">${t.doc.html}</div></details>` : ""}
      <div class="ask">${t.ask}</div><div id="widget"></div><div id="res"></div>
      <div class="bubble" id="mbub" hidden></div>
    </div>
    <div class="foot" id="foot">${o.mentor ? `<button class="btn orange sm" type="button" id="hintB">Ask ${esc(o.mentor.split(" ")[0])}${o.hintCost ? ` (${o.hintCost}%)` : " (free)"}</button>` : ""}<span class="warn" id="warn"></span><span style="flex:1"></span><button class="btn go" type="button" id="subB">Submit</button></div></div>`, { sticky: true, cls: "taskov" + (o.pc ? " pcov" : ""), onClose: () => { Voice.stop(); E.seated = false; } });
  glossify(ov);
  const readMsg = () => { Voice.phone = !!o.call; Voice.say(t.msg + " " + plain(t.ask), t.from[0], 2); Voice.phone = false; };
  if (o.call) { for (let i = 0; i < 2; i++) { Sfx.tone(1250, .4, "sine", .05, i * .7); Sfx.tone(1050, .4, "sine", .04, i * .7); } setTimeout(readMsg, 1500); } else setTimeout(readMsg, 250); $("#listenB", ov).addEventListener("click", () => { Sfx.init(); readMsg(); });
  const ctx = { finish(ok, msg) {
    if (finished) return; finished = true; clearInterval(timerId);
    const xp = o.onFinish ? o.onFinish(ok) : 0;
    if (ok) Sfx.ok(); else { Sfx.bad(); const p = $(".task", ov); p.classList.remove("shake"); void p.offsetWidth; if (!REDUCED) p.classList.add("shake"); }
    $("#res", ov).innerHTML = `<div class="result ${ok ? "good" : "bad"}"><h3>${ok ? pick(["Nice work!", "Nailed it!", "Great job!", "Solid!"]) : pick(["Oops, that's a mistake", "Not quite", "That didn't go well"])}</h3><div>${msg || ""}</div><div class="lesson"><b>What you learned:</b> ${t.lesson}</div></div>`;
    glossify($("#res", ov)); Voice.say((ok ? "Nice work. " : "Not quite. ") + t.lesson, o.mentor || "Narrator", 2);
    $("#foot", ov).innerHTML = `${xp ? `<span class="small">+${xp} XP</span>` : ""}<span style="flex:1"></span><button class="btn go" type="button" id="doneB">${o.doneLabel || "Back to work"}</button>`;
    const born = Date.now(); $("#doneB", ov).addEventListener("click", () => { if (Date.now() - born > 400) { ov.close(); if (o.after) o.after(ok); } });
    setTimeout(() => { const b = $("#doneB", ov); if (b) b.focus(); }, 450);
    $("#res", ov).scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
  } };
  const w = W[t.type]($("#widget", ov), t, ctx);
  if (w.noSubmit) $("#subB", ov).remove(); else $("#subB", ov).addEventListener("click", () => { const r = w.submit(); if (r.incomplete) { $("#warn", ov).textContent = r.incomplete; Sfx.bad(); return; } ctx.finish(r.ok, r.msg); });
  const hb = $("#hintB", ov); if (hb) hb.addEventListener("click", () => {
    if (finished || hinted) return; hinted = true; hb.disabled = true; const free = o.freeHint && o.freeHint();
    const mb = $("#mbub", ov); mb.hidden = false; mb.innerHTML = `<b class="name">${esc(o.mentor.split(" ")[0])}:</b> ${t.hint}${free ? " <i>(free hint)</i>" : ""}`; if (o.onHint && !free) o.onHint(o.hintCost); Sfx.click(); Voice.say(t.hint, o.mentor, 2);
  });
  if (o.timer) { const t0 = Date.now(); let last = o.timer; timerId = setInterval(() => { const el = $("#tmr", ov); if (!el) { clearInterval(timerId); return; } const left = Math.max(0, Math.ceil(o.timer - (Date.now() - t0) / 1000)); if (left !== last) { last = left; el.textContent = left + "s"; if (left <= 10) Sfx.tick(); } if (left <= 0) ctx.finish(false, "Time ran out. The problem got escalated over your head."); }, 250); }
  return ov;
}
function glossify(root) {
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length); const used = new Set();
  const walk = el => { for (const node of [...el.childNodes]) {
    if (node.nodeType === 3) { let txt = node.nodeValue; for (const term of terms) { if (used.has(term)) continue; const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}s?\\b`, term === term.toUpperCase() ? "" : "i"); const m = txt.match(re); if (m) { used.add(term); const before = txt.slice(0, m.index), after = txt.slice(m.index + m[0].length); const sp = document.createElement("button"); sp.type = "button"; sp.className = "gterm"; sp.textContent = m[0]; sp.dataset.term = term; node.parentNode.insertBefore(document.createTextNode(before), node); node.parentNode.insertBefore(sp, node); node.nodeValue = after; txt = after; } } }
    else if (node.nodeType === 1 && !/^(BUTTON|CODE|PRE|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(node.tagName) && !node.classList.contains("opt")) walk(node); } };
  $$(".msg-text, .ask, .doc-in, .lesson", root).forEach(walk); if (root.classList && root.classList.contains("lesson")) walk(root);
  $$(".gterm", root).forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const term = b.dataset.term; const first = !S.words[term]; S.words[term] = S.day; save(); checkAch(); $$(".gpop").forEach(p => p.remove());
    const p = document.createElement("div"); p.className = "gpop"; p.innerHTML = `<b>${esc(term)}</b> ${GLOSSARY[term][1]}${first ? '<div class="small">Added to your glossary.</div>' : ""}`; document.body.appendChild(p);
    const r = b.getBoundingClientRect(); p.style.left = clamp(r.left, 8, window.innerWidth - 300) + "px"; p.style.top = (r.bottom + 6) + "px"; setTimeout(() => document.addEventListener("click", () => p.remove(), { once: true }), 10); Sfx.click(); }));
}

/* ---------- funny events ---------- */
function startEvent(ev) {
  ev.done = true; const F = E.F; const D = E.room.D;
  if (funEvent(ev)) return;
  if (ev.kind === "pizza" && !F.sofaPos) return;
  if (ev.kind === "fire") {
    const fire = PROP.fire(F.printerPos[0], 1.15, F.printerPos[1]); let out = false; Sfx.alarm(); toast("<b>The printer is on fire!</b> Grab the extinguisher before it spreads!", "red");
    const it = addInter({ name: "Printer fire!", verb: "Put out the fire", x: F.printerPos[0], z: F.printerPos[1] - 1, r: 2, mark: () => "!!", action: () => { out = true; E.world.remove(fire); E.inters = E.inters.filter(i => i !== it); it.label.remove(); S.rep += 2; award("fire"); Player.emote = "cheer"; Player.emoteUntil = E.t + 1.5; toast("You put out the fire! Everyone cheers. +2 reputation.", "gold"); E.npcs.filter(n => n.kind === "coworker").forEach(n => npcEmote(n, "cheer", 1.5)); save(); } });
    setTimeout(() => { if (out || !SH) return; E.world.remove(fire); E.inters = E.inters.filter(i => i !== it); it.label.remove(); changePerf(-6); SH.minute += 20; toast("The fire alarm went off and everyone evacuated for 20 minutes.", "red"); }, 45000);
  } else if (ev.kind === "dog") {
    const dog = makeDog(); dog.position.set(0, 0, -D / 2 + 1.5); E.world.add(dog); E.elevOpenUntil = E.t + 2; toast("Someone brought their dog to work today!");
    const d = { pos: dog.position, tgt: V3(3, 0, 2), petted: false };
    E.anims.push(dt => { const v = V3(d.tgt.x - dog.position.x, 0, d.tgt.z - dog.position.z); if (v.length() < .2) d.tgt = V3((Math.random() - .5) * 8, 0, -4 + Math.random() * 9); else { v.normalize(); dog.position.addScaledVector(v, dt * 1.8); dog.rotation.y = Math.atan2(v.x, v.z); } dog.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(E.t * 12 + i * Math.PI) * .5); dog.userData.tail.rotation.y = Math.sin(E.t * 15) * .6; it.pos.copy(dog.position); });
    const it = addInter({ name: "Biscuit the dog", verb: "Pet the dog", x: 0, z: 0, r: 1.8, h: 1.3, mark: () => d.petted ? "" : "♥", action: () => { if (d.petted) { toast("Biscuit wags happily."); return; } d.petted = true; SH && (SH.stress = Math.max(0, SH.stress - 20)); award("dog"); Player.emote = "pet"; Player.emoteUntil = E.t + 1.5; Sfx.tone(880, .1, "sine", .05); Sfx.tone(1100, .1, "sine", .05, .1); toast("You pet Biscuit. Stress melts away (−20 stress)."); } });
  } else if (ev.kind === "ceo") {
    const job = SH.job; const qs = job.tasks.filter(t => t.type === "choice"); if (!qs.length) return; const q = pick(qs);
    const ceo = addNPC({ kind: "npc", name: "Victoria Lane", role: "CEO", look: { g: "f", outfit: 1, jacket: 4, skin: 2, hair: 4, shirt: 5, style: 1, pants: 2 }, x: 0, z: -D / 2 + 1.1 }); E.elevOpenUntil = E.t + 2; toast("<b>The CEO is walking the floor!</b> Make a good impression.", "gold");
    walkTo(ceo, [[0, 0], [1.5, .5]], n => { n.faceTarget = Player.mesh.position.clone(); npcSay(n, "Got a minute? I have a question for you.", 6); });
    let asked = false;
    ceo.onTalk = n => { if (asked) { npcSay(n, "Keep up the good work!"); return; } asked = true;
      const opts = shuffle(q.options); const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#3d4b5c">The CEO asks you a question</div><div class="m-body"><div class="from">${avatar({ skin: 2, hair: 4, shirt: 5, style: 1 }, 44)}<div><b>Victoria Lane</b><div class="small">CEO, Brightline Corp</div></div></div><p>"${q.msg.replace(/<[^>]+>/g, "")}"</p><div class="ask">${q.ask}</div><div class="opts">${opts.map((o, i) => `<button class="opt" type="button" data-i="${i}"><span class="box"></span><span>${o.t}</span></button>`).join("")}</div><div id="cres"></div></div></div>`, { sticky: true });
      Voice.say(q.msg + " " + plain(q.ask), "Victoria Lane", 2);
      $$(".opt", ov).forEach(b => b.addEventListener("click", () => { const o = opts[+b.dataset.i]; $$(".opt", ov).forEach((x, i) => { x.disabled = true; if (opts[i].ok) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        if (o.ok) { S.rep += 5; award("ceo"); changePerf(4); Sfx.promo(); } else { S.rep = Math.max(0, S.rep - 2); Sfx.bad(); } save();
        $("#cres", ov).innerHTML = `<div class="result ${o.ok ? "good" : "bad"}"><h3>${o.ok ? "\"Impressive. I'll remember your name.\" (+5 reputation)" : "\"Hmm. Keep learning.\" (−2 reputation)"}</h3><div class="lesson"><b>Lesson:</b> ${q.lesson}</div><button class="btn go" type="button" id="cok">Thanks!</button></div>`;
        $("#cok", ov).addEventListener("click", () => { ov.close(); walkTo(ceo, [[0, 0], [0, -D / 2 + 1]], m => setTimeout(() => removeNPC(m), 500)); }); })); };
    setTimeout(() => { if (!asked && ceo.mesh.parent) { npcSay(ceo, "Looks like you're busy. Another time!", 3); walkTo(ceo, [[0, 0], [0, -D / 2 + 1]], m => setTimeout(() => removeNPC(m), 500)); asked = true; } }, 60000);
  } else if (ev.kind === "pizza") {
    const [sx, sz] = F.sofaPos; const g = group(sx + 2, sz); for (let i = 0; i < 3; i++) box(g, .7, .1, .7, "#f2f2f2", 0, .75 + i * .1, 0); box(g, 1.2, .75, .9, "#8a5a3b", 0, 0, 0); collider(sx + 2, sz, 1.2, .9);
    let eaten = false; toast("<b>Free pizza</b> in the break area!", "gold");
    const it = addInter({ name: "Free pizza", verb: "Grab a slice (+energy)", x: sx + 2, z: sz - .9, r: 1.8, h: 1.4, mark: () => eaten ? "" : "!", action: () => { if (eaten) { toast("All gone. Someone took the last slice."); return; } eaten = true; SH.energy = Math.min(100, SH.energy + 25); SH.stress = Math.max(0, SH.stress - 10); toast("Pizza! +25 energy, −10 stress."); Player.emote = "cheer"; Player.emoteUntil = E.t + 1; } });
  }
}

/* ---------- morning stand-up ---------- */
function standUp(job, sh) {
  const crew = E.npcs.filter(n => n.kind === "coworker").slice(0, 4);
  const proj = sh.list.find(x => x.project), urg = sh.list.filter(x => x.urgent).length;
  const notes = [
    `${sh.list.filter(x => !x.urgent && !x.project).length} requests expected today. Help people before they give up waiting.`,
    sh.rush ? `It's ${RUSH[job.id] || "a rush day"}: expect extra urgent work. Pay is 1.5×.` : urg ? "Heads up: something urgent may land today." : "No emergencies planned. Keep it that way!",
    proj ? `Project: ${PROJECTS[job.id].name}, stage ${(S.projects[job.id] || 0) + 1} of 3 is on your desk.` : null,
    S.weather === "rain" ? "It's raining, so people are a little grumpier. Be patient with them." : null,
    "Keep your energy up with coffee, and take a break if stress climbs."
  ].filter(Boolean);
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">Morning stand-up · ${job.dept}</div><div class="m-body">
    <div class="row wrap">${[{ name: job.mentor.name, role: job.mentor.title }, ...crew.map(n => ({ name: n.name, role: job.dept }))].map(p => `<div class="attendee">${avatar(hashAv(p.name), 40)}<span>${esc(p.name.split(" ")[0])}</span></div>`).join("")}<div class="attendee">${avatar(S.player.look, 40)}<span>You</span></div></div>
    <div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> Morning, team! Here's today's plan.</div>
    <ul class="standup">${notes.map(n => `<li>${n}</li>`).join("")}</ul>
    <button class="btn go big" type="button" id="suGo">Let's get to work</button></div></div>`, { sticky: true });
  Voice.say("Morning, team! Here's today's plan. Let's have a great shift.", job.mentor.name, 2, "standup|" + job.id);
  $("#suGo", ov).addEventListener("click", () => { Voice.stop(); ov.close(); });
}

/* ---------- end of shift ---------- */
function endShift(sentHome) {
  const sh = SH; SH = null; if (!sh) return;
  const { job, js } = sh; const done = sh.list.filter(x => x.state === "done"), right = done.filter(x => x.ok && !x.covered).length, wrong = done.filter(x => !x.ok).length, missed = sh.list.filter(x => x.state === "missed").length;
  const before = lvl(js.xp); const st = sentHome ? 1 : starsFor(sh.perf);
  const pay = sentHome ? Math.round(LEVELS[before].pay * .3) : Math.round(LEVELS[before].pay * sh.diff.pay * (.5 + sh.perf / 200) * (1 + S.rep / 200) * (1 + js.raise) * (has("negotiator") ? 1.1 : 1) * (sh.rush ? 1.5 : 1)) + sh.bonus;
  js.xp += sh.xp; js.days++; js.best = Math.max(js.best || 0, st); js.since = (js.since || 0) + 1;
  const after = lvl(js.xp); const promoted = after > before; if (promoted) S.skillPts += after - before;
  const repD = [0, -3, -1, 0, 1, 3][st]; S.rep = clamp(S.rep + repD, 0, 100); S.money += pay;
  S.stats.shifts++; if (st === 5) S.stats.fiveStars++; S.workedToday = true; S.phase = "evening"; setTimeout(postScore, 1500); afterShift(job, st, pay, sentHome); burnAfterShift(sh.ot); S.lastJob = job.id; if (!sentHome) rivalAfterShift(st);
  if (!sentHome && wrong === 0 && missed === 0 && done.length >= 5) award("flawless"); if (sh.rush && st >= 4) award("rush");
  let fired = false; if (st <= 2) { js.strikes = (js.strikes || 0) + 1; if (js.strikes >= 3) { fired = true; js.firedUntil = S.day + 3; js.strikes = 0; S.rep = Math.max(0, S.rep - 8); } } else js.strikes = 0;
  if (!S.offer && st >= 4 && after >= 2 && Math.random() < .35) { const others = JOBS.filter(j => j.id !== job.id && lvl(jobState(j.id).xp) === 0); if (others.length) { const o = pick(others); S.offer = { job: o.id, from: job.id, bonus: 300 }; } }
  const review = js.since >= 5 && !fired; save(); checkAch();
  const learned = done.map(x => x.t);
  const ov = overlay(`<div class="panel modal review"><div class="bar" style="--blue:${job.color}">End of shift report: ${job.dept}, day ${S.day}</div><div class="m-body center">
    <div class="stamp ${sentHome || fired ? "badday" : ""}">${fired ? "FIRED" : sentHome ? "SENT HOME EARLY" : sh.rush ? "RUSH SURVIVED" : "SHIFT COMPLETE"}</div>
    <div style="font-size:30px">${stars(st)}</div>
    <p>${fired ? `Three bad shifts in a row. HR says you can come back to ${job.dept} on day ${js.firedUntil}. Try another department or hit the Training Center.` : sentHome ? `${job.mentor.name.split(" ")[0]} sent you home to reset. Every mistake taught you something.` : st >= 4 ? `${job.mentor.name.split(" ")[0]}: "Outstanding work today."` : st >= 3 ? `${job.mentor.name.split(" ")[0]}: "Good day. You're learning fast."` : `${job.mentor.name.split(" ")[0]}: "Rough one. Read your journal tonight."`}</p>
    ${promoted ? `<div class="promo">PROMOTED! You're now ${titleFor(job, js.xp)}. +1 skill point</div>` : ""}
    <table class="rv-table"><tr><td>Done right</td><td style="color:var(--ok)">${right}</td></tr><tr><td>Mistakes</td><td style="color:var(--bad)">${wrong}</td></tr><tr><td>Gave up waiting</td><td>${missed}</td></tr><tr><td>Performance</td><td>${Math.round(sh.perf)}%</td></tr><tr><td>XP</td><td>+${sh.xp}</td></tr><tr><td>Reputation</td><td>${repD >= 0 ? "+" : ""}${repD}</td></tr><tr><td>Paycheck${sh.rush ? " (rush 1.5×)" : ""}</td><td class="money">${money(pay)}</td></tr></table>
    ${S.offer && S.offer.from === job.id ? `<div class="warnbox gold">A headhunter called! ${jobById(S.offer.job).dept} wants you as a <b>Junior</b> (skip Trainee) plus a ${money(S.offer.bonus)} signing bonus. Check the job board in the lobby.</div>` : ""}
    <div class="lessons"><span class="lbl">What you learned today</span>${learned.map(t => `<div class="lesson"><b>${t.subject}:</b> ${t.lesson}</div>`).join("") || "<div class='small'>Nothing new today.</div>"}</div>
    <div class="row wrap center">${review ? `<button class="btn orange big" type="button" id="rvB">Performance review with ${job.mentor.name.split(" ")[0]}</button>` : `<button class="btn go big" type="button" id="homeB">Head home</button>`}<button class="btn grey" type="button" id="lobB">Stay at the office</button></div></div></div>`, { sticky: true });
  setTimeout(() => Voice.say(fired ? "Three bad shifts in a row. You are off this team for a few days." : sentHome ? "Go home and reset. Every mistake taught you something." : st >= 4 ? "Outstanding work today." : st >= 3 ? "Good day. You are learning fast." : "Rough one. Read your journal tonight.", job.mentor.name, 2), 700);
  if (promoted) { Sfx.promo(); setTimeout(() => Sfx.cash(), 900); } else Sfx.cash();
  const hb = $("#homeB", ov); if (hb) hb.addEventListener("click", () => { ov.close(); goLocation("home", { text: "Heading home..." }); });
  const rb = $("#rvB", ov); if (rb) rb.addEventListener("click", () => { ov.close(); bossReview(job); });
  $("#lobB", ov).addEventListener("click", () => { ov.close(); hud(); });
  hud(); hudTick();
}
function quizFor(job, n) {
  const qs = shuffle(job.tasks.filter(t => t.type === "choice")).slice(0, Math.min(3, n)).map(t => ({ q: t.ask, ctx: t.msg.replace(/<[^>]+>/g, "").slice(0, 220), opts: t.options.map(o => ({ t: o.t, ok: !!o.ok })), lesson: t.lesson }));
  const terms = Object.entries(GLOSSARY).filter(([, v]) => v[0] === job.id); const all = Object.keys(GLOSSARY);
  for (const [term, v] of shuffle(terms)) { if (qs.length >= n) break; const wrong = shuffle(all.filter(x => x !== term)).slice(0, 2); qs.push({ q: "Which term matches this definition?", ctx: v[1], opts: shuffle([{ t: term, ok: true }, ...wrong.map(w => ({ t: w, ok: false }))]), lesson: `${term}: ${v[1]}` }); }
  while (qs.length < n) { const [term, v] = pick(Object.entries(GLOSSARY)); const wrong = shuffle(all.filter(x => x !== term)).slice(0, 2); qs.push({ q: "Which term matches this definition?", ctx: v[1], opts: shuffle([{ t: term, ok: true }, ...wrong.map(w => ({ t: w, ok: false }))]), lesson: `${term}: ${v[1]}` }); }
  return shuffle(qs);
}
function runQuiz(title, color, qs, done, intro) {
  let i = 0, score = 0;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${color}">${title}</div><div class="m-body" id="qb"></div></div>`, { sticky: true });
  const show = () => {
    if (i >= qs.length) { done(score, ov); return; }
    const q = qs[i]; const opts = shuffle(q.opts);
    $("#qb", ov).innerHTML = `${i === 0 && intro ? `<div class="bubble">${intro}</div>` : ""}<div class="small">Question ${i + 1} of ${qs.length} · score ${score}</div><p class="ctx">${esc(q.ctx)}</p><div class="ask">${q.q}</div><div class="opts">${opts.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="box"></span><span>${o.t}</span></button>`).join("")}</div><div id="qr"></div>`;
    Voice.say(q.ctx + ". " + plain(q.q), title, 2);
    $$(".opt", ov).forEach(b => b.addEventListener("click", () => { const o = opts[+b.dataset.k]; if (o.ok) score++; $$(".opt", ov).forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); }); o.ok ? Sfx.ok() : Sfx.bad();
      $("#qr", ov).innerHTML = `<div class="lesson"><b>${o.ok ? "Correct!" : "Not quite."}</b> ${q.lesson}</div><button class="btn go" type="button" id="qn">${i + 1 < qs.length ? "Next question" : "See results"}</button>`; $("#qn", ov).addEventListener("click", () => { i++; show(); }); $("#qn", ov).focus(); }));
  };
  show();
}
function bossReview(job) {
  const js = jobState(job.id);
  runQuiz(`Performance review with ${job.mentor.name}`, job.color, quizFor(job, 3), (score, ov) => {
    js.since = 0; let msg;
    if (score === 3) { js.raise = (js.raise || 0) + .1; S.skillPts++; award("raise"); msg = `"Excellent. You clearly know this job." <b>+10% raise in ${job.dept} and +1 skill point!</b>`; Sfx.promo(); }
    else if (score === 2) { js.raise = (js.raise || 0) + .05; msg = `"Solid work. Keep it up." <b>+5% raise in ${job.dept}.</b>`; Sfx.cash(); }
    else { S.rep = Math.max(0, S.rep - 2); msg = `"I need to see more growth. Hit the Training Center." <b>−2 reputation.</b>`; Sfx.bad(); }
    save(); checkAch();
    $("#qb", ov).innerHTML = `<div class="center"><div class="stamp ${score < 2 ? "badday" : ""}">${score}/3</div><p>${msg}</p><button class="btn go big" type="button" id="rh">Head home</button></div>`;
    $("#rh", ov).addEventListener("click", () => { ov.close(); goLocation("home", { text: "Heading home..." }); });
  }, `<b class="name">${job.mentor.name.split(" ")[0]}:</b> You've worked five shifts with us. Let's see what you've learned. Answer well and you'll get a raise.`);
}

/* ---------- home & days ---------- */
function sleep() {
  if (S.phase === "morning" && !S.workedToday) { const ov = overlay(`<div class="panel modal"><div class="bar">Go back to bed?</div><div class="m-body"><p>You just woke up. Sleeping now skips today and you won't get paid. Rent is still due.</p><div class="row wrap"><button class="btn orange" type="button" id="sk">Skip the day</button><button class="btn grey" type="button" id="nn">Never mind</button></div></div></div>`); $("#sk", ov).addEventListener("click", () => { ov.close(); nextDay(); }); $("#nn", ov).addEventListener("click", () => ov.close()); return; }
  nextDay();
}
function nextDay() {
  burnOvernight(S.workedToday);
  const rent = HOMES[S.home].rent; S.money -= rent;
  let evicted = false; if (S.money < 0 && S.home > 0) { S.home = 0; evicted = true; S.money = Math.max(S.money, -50); }
  S.day++; S.phase = "morning"; S.workedToday = false; S.talked = {};
  const r = Math.random(); S.weather = r < .55 ? "sun" : r < .8 ? "cloud" : "rain";
  if (rent) ledger("Rent", -rent); onNewDay(); rollWfh(); bizMorning();
  if (S.daily.day && S.daily.last < S.day - 1) S.daily.streak = 0;
  save();
  goLocation("home", { text: `Day ${S.day}`, morningEvent: true, after: () => { setTimeout(storyCheck, 2600); if (rent) toast(`Rent paid: −${money(rent)}`); if (evicted) toast("You couldn't pay rent, so you moved back to Mom's couch.", "red"); } });
}
function morningEvent() {
  if (Math.random() > .4) return; const evs = MORNING.filter(e => !e.needCar || S.car > 0); const ev = pick(evs);
  if (ev.money) S.money += ev.money; if (ev.rep) S.rep = clamp(S.rep + ev.rep, 0, 100); if (ev.perf) S.nextPerf += ev.perf; save(); hud();
  Voice.say("Good morning! " + ev.t, "Narrator", 2);
  const ov = overlay(`<div class="panel modal"><div class="bar">Good morning!</div><div class="m-body"><p>${ev.t}</p><button class="btn go" type="button">Okay</button></div></div>`); $(".btn", ov).addEventListener("click", () => ov.close());
}

/* ---------- daily challenge ---------- */
function dailyTask() {
  const r = seeded("daily" + S.day); const pool = []; JOBS.forEach(j => j.tasks.forEach(t => { if (t.tier >= 2) pool.push([j, t]); }));
  return pool[Math.floor(r() * pool.length)];
}
function openDaily() {
  if (S.daily.day !== S.day) { S.daily.day = S.day; S.daily.done = false; save(); }
  const [job, t] = dailyTask();
  if (S.daily.done) { toast(`You've done today's challenge. Streak: ${S.daily.streak} day${S.daily.streak === 1 ? "" : "s"}. Come back tomorrow!`); return; }
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#f08a12">Daily challenge · Day ${S.day}</div><div class="m-body"><p>Today's challenge comes from <b>${job.dept}</b>. Get it right for <b>$150</b> and +2 reputation. You get one try.</p><p class="small">Current streak: ${S.daily.streak} day${S.daily.streak === 1 ? "" : "s"}</p><div class="row wrap"><button class="btn go big" type="button" id="dg">Start</button><button class="btn grey" type="button" id="dn">Later</button></div></div></div>`);
  $("#dn", ov).addEventListener("click", () => ov.close());
  $("#dg", ov).addEventListener("click", () => { ov.close(); openTaskWindow(t, { color: "#f08a12", doneLabel: "Done", onFinish: ok => { S.daily.done = true; if (ok) { S.money += 150; S.rep = Math.min(100, S.rep + 2); S.daily.streak = S.daily.last === S.day - 1 ? S.daily.streak + 1 : 1; S.daily.last = S.day; toast(`Daily challenge complete! +$150 · streak ${S.daily.streak}`, "gold"); } else S.daily.streak = 0; save(); checkAch(); hud(); return 0; } }); });
}

/* ---------- training ---------- */
function openTraining() {
  const ov = overlay(`<div class="panel modal wide"><div class="bar">Training Center: courses</div><div class="m-body"><div class="bubble"><b class="name">Prof. Ellis:</b> Each course is 5 questions. Score 4 or more to earn a certificate: +25 XP in that job and +1 skill point. You can retake any course.</div>
    <div class="course-grid">${JOBS.map(j => `<div class="course"><span class="tile" style="--c:${j.color}">${icon(j.icon)}</span><span><b>${j.dept}</b><small>${S.certs[j.id] ? "✔ 101 certified" : "101 not taken"}${(S.exams || {})[j.id] ? " · ✔ exam passed" : ""}</small><span class="row" style="gap:4px;margin-top:4px"><button class="btn sm" type="button" data-j="${j.id}">101 course</button><button class="btn sm orange" type="button" data-x="${j.id}">Practice exam</button></span></span></div>`).join("")}</div><button class="btn orange" type="button" id="tEnd">♾️ Endless drill${S.endlessBest ? ` (best ${S.endlessBest})` : ""}</button> <button class="btn grey" type="button" id="tc">Close</button></div></div>`);
  $("#tc", ov).addEventListener("click", () => ov.close());
  $("#tEnd", ov).addEventListener("click", () => { ov.close(); openEndless(); });
  $$("[data-x]", ov).forEach(b => b.addEventListener("click", () => { ov.close(); openExam(jobById(b.dataset.x)); }));
  $$("[data-j]", ov).forEach(b => b.addEventListener("click", () => { ov.close(); const job = jobById(b.dataset.j);
    runQuiz(`${job.dept} 101`, job.color, quizFor(job, 5), (score, qov) => {
      const pass = score >= 4, first = pass && !S.certs[job.id];
      if (first) { S.certs[job.id] = S.day; S.skillPts++; jobState(job.id).xp += 25; }
      save(); checkAch(); pass ? Sfx.promo() : Sfx.bad();
      $("#qb", qov).innerHTML = `<div class="center"><div class="stamp ${pass ? "" : "badday"}">${score}/5</div>${pass ? `<div class="cert"><small>Certificate of completion</small><b>${job.dept} 101</b><span>awarded to ${esc(S.player.name)} · Day ${S.day}</span></div>${first ? "<p>+25 XP in this job and +1 skill point!</p>" : "<p>You already had this certificate. Good refresher!</p>"}` : "<p>Not quite. You need 4 out of 5. Read the lessons and try again.</p>"}<button class="btn go" type="button" id="qd">Done</button></div>`;
      $("#qd", qov).addEventListener("click", () => qov.close());
    }); }));
}

/* ---------- phone / home computer ---------- */
function openPhone(tab = "shop", jobId) {
  S.tutPhone = true;
  const tabs = [["shop", "Shop"], ["skills", "Skills"], ["ach", "Trophies"], ["career", "Career"], ["tracks", "Goals"], ["story", "Story"], ["map", "Map"], ["report", "Report"], ["journal", "Journal"], ["words", "Glossary"], ["budget", "Budget"], ["biz", "Business"], ["stickers", "Stickers"], ["friends", "Leaderboard"]];
  const ov = overlay(`<div class="panel modal wide phone"><div class="bar">Brightline Phone<span class="dots"><i></i><i></i><i></i></span></div><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === tab}">${n}</button>`).join("")}</div><div class="m-body" id="pb"></div></div>`);
  const draw = t => { tab = t; $$(".tabs button", ov).forEach(b => b.setAttribute("aria-selected", String(b.dataset.t === t))); $("#pb", ov).innerHTML = PHONE[t](jobId); PHONE_WIRE[t] && PHONE_WIRE[t](ov, () => draw(t)); };
  $$(".tabs button", ov).forEach(b => b.addEventListener("click", () => { draw(b.dataset.t); Sfx.click(); }));
  draw(tab);
}
const PHONE = {
  shop: () => `<p class="small">Bank: <b class="money">${money(S.money)}</b>. Rent is charged when you sleep.</p>
    <h4>Home</h4><div class="shop">${HOMES.map((h, i) => `<div class="item ${S.home === i ? "own" : ""}"><b>${h.name}</b><span>${h.desc}</span><span class="small">${h.rent ? `${money(h.rent)}/day rent · move-in ${money(h.rent * 3)}` : "Free"}</span>${S.home === i ? '<span class="chip">You live here</span>' : `<button class="btn sm" type="button" data-home="${i}">Move in</button>`}</div>`).join("")}</div>
    <h4>Vehicle</h4><div class="shop">${CARS.map((c, i) => `<div class="item ${S.car >= i ? "own" : ""}"><b>${c.name}</b><span>${c.desc}</span><span class="small">${c.price ? money(c.price) : "Free"}</span>${S.car === i ? '<span class="chip">Yours</span>' : S.car > i ? "" : `<button class="btn sm" type="button" data-car="${i}">Buy</button>`}</div>`).join("")}</div>
    <h4>Pets <small class="small">(live in your home)</small></h4><div class="shop">${PETS.map(p => `<div class="item ${S.pet && S.pet.kind === p.id ? "own" : ""}"><b>${p.name}</b><span>${p.desc}</span><span class="small">${money(p.price)} adoption · $5/day food</span>${S.pet && S.pet.kind ? (S.pet.kind === p.id ? `<span class="chip">${esc(S.pet.name)}</span>` : "") : `<button class="btn sm" type="button" data-pet="${p.id}">Adopt</button>`}</div>`).join("")}</div>
    <h4>Desk upgrades <small class="small">(show up on your desk in every department)</small></h4><div class="shop">${DECOR.map(d => `<div class="item ${owns(d.id) ? "own" : ""}"><b>${d.name}</b><span>${d.desc}</span><span class="small">${money(d.price)}</span>${owns(d.id) ? '<span class="chip">Owned</span>' : `<button class="btn sm" type="button" data-dec="${d.id}">Buy</button>`}</div>`).join("")}</div>`,
  skills: () => `<p>Skill points: <b>${S.skillPts}</b>. Earn them from promotions, certificates and great performance reviews.</p><div class="skills">${SKILLS.map(s => { const got = has(s.id), can = !got && S.skillPts >= s.cost && (!s.req || has(s.req)); return `<div class="item ${got ? "own" : ""}"><b>${s.name}</b><span>${s.desc}</span><span class="small">${s.cost} point${s.cost > 1 ? "s" : ""}${s.req ? ` · needs ${SKILLS.find(x => x.id === s.req).name}` : ""}</span>${got ? '<span class="chip">Unlocked</span>' : `<button class="btn sm" type="button" data-sk="${s.id}" ${can ? "" : "disabled"}>Unlock</button>`}</div>`; }).join("")}</div>`,
  ach: () => `<p>${Object.keys(S.ach).length} of ${ACH.length} achievements. Trophies show on your shelf at home, and 5+ puts a gold cup on your desk.</p><div class="achs">${ACH.map(a => `<div class="ach ${S.ach[a[0]] ? "on" : ""}"><span class="cup">${S.ach[a[0]] ? "🏆" : "?"}</span><span><b>${a[1]}</b><small>${a[2]}</small></span></div>`).join("")}</div>`,
  career: () => { const o = S.offer; return `${o ? `<div class="warnbox gold"><b>Job offer!</b> ${jobById(o.job).dept} wants you to start as <b>Junior ${jobById(o.job).role}</b> with a ${money(o.bonus)} signing bonus.<div class="row wrap" style="margin-top:8px"><button class="btn go sm" type="button" data-offer="yes">Accept</button><button class="btn grey sm" type="button" data-offer="no">Decline</button></div></div>` : ""}
    <p class="small">Reputation ${S.rep}/100 boosts every paycheck (up to +50%). Salary ranges below are rough real-world US figures and vary a lot by location and experience.</p>
    <div class="career">${JOBS.map(j => { const js = S.jobs[j.id]; const L = js ? lvl(js.xp) : -1; return `<div class="cjob"><div class="row"><span class="tile sm" style="--c:${j.color}">${icon(j.icon)}</span><b>${j.dept}</b><span class="small" style="margin-left:auto">${js && js.days ? `${titleFor(j, js.xp)} · ${stars(js.best)}${js.firedUntil > S.day ? ` · <b style="color:var(--bad)">fired until day ${js.firedUntil}</b>` : ""}` : "Not started"}</span></div><div class="path">${PATHS[j.id].map((p, i) => `<span class="${i === 0 && L >= 0 ? "here" : ""}">${p[0]}<small>${p[1]}</small></span>`).join("<i>→</i>")}</div></div>`; }).join("")}</div>`; },
  journal: jobId => { const ids = jobId ? [jobId] : JOBS.map(j => j.id); const rows = ids.flatMap(id => Object.entries((S.jobs[id] || {}).lessons || {}).map(([tid, l]) => ({ id, ...l }))); return `<p>${rows.length} lessons learned. Every task you finish, right or wrong, adds one.</p>${rows.length ? rows.map(r => `<div class="lesson"><b>${jobById(r.id).dept} · ${r.s}</b> <span class="chip" style="--c:${r.ok ? "var(--ok)" : "var(--bad)"}">${r.ok ? "nailed it" : "learned the hard way"}</span><br>${r.l}</div>`).join("") : "<p>No lessons yet. Clock in somewhere!</p>"}`; },
  words: () => { const got = Object.keys(S.words); return `<p>${got.length} of ${Object.keys(GLOSSARY).length} terms collected. Tap underlined words in tasks to collect them.</p><div class="words">${Object.entries(GLOSSARY).map(([k, v]) => `<div class="word ${S.words[k] ? "on" : ""}"><b>${S.words[k] ? esc(k) : "? ? ?"}</b><span class="small">${jobById(v[0]) ? jobById(v[0]).dept : ""}</span>${S.words[k] ? `<span>${v[1]}</span>` : ""}</div>`).join("")}</div>`; }
};
const PHONE_WIRE = {
  shop: (ov, redraw) => {
    $$("[data-pet]", ov).forEach(b => b.addEventListener("click", () => { ov.close(); adoptPet(PETS.find(p => p.id === b.dataset.pet)); }));
    $$("[data-home]", ov).forEach(b => b.addEventListener("click", () => { const i = +b.dataset.home, cost = HOMES[i].rent * 3; if (S.money < cost) { toast("Not enough money for the move-in fee."); Sfx.bad(); return; } S.money -= cost; S.home = i; save(); checkAch(); Sfx.cash(); toast(`You moved into the ${HOMES[i].name}!`, "gold"); hud(); redraw(); if (LOC === "home") { ov.close(); goLocation("home", { text: "Moving day!" }); } }));
    $$("[data-car]", ov).forEach(b => b.addEventListener("click", () => { const i = +b.dataset.car, c = CARS[i]; if (S.money < c.price) { toast("Not enough money yet."); Sfx.bad(); return; } S.money -= c.price; S.car = i; if (c.rep) S.rep = Math.min(100, S.rep + c.rep); save(); checkAch(); Sfx.cash(); toast(`You bought a ${c.name}!`, "gold"); hud(); redraw(); }));
    $$("[data-dec]", ov).forEach(b => b.addEventListener("click", () => { const d = DECOR.find(x => x.id === b.dataset.dec); if (S.money < d.price) { toast("Not enough money yet."); Sfx.bad(); return; } S.money -= d.price; S.decor[d.id] = true; if (d.id === "plant") S.rep = Math.min(100, S.rep + 2); save(); Sfx.cash(); toast(`Bought: ${d.name}. It'll be on your desk.`); hud(); redraw(); }));
  },
  skills: (ov, redraw) => $$("[data-sk]", ov).forEach(b => b.addEventListener("click", () => { const s = SKILLS.find(x => x.id === b.dataset.sk); S.skillPts -= s.cost; S.skills[s.id] = true; save(); checkAch(); Sfx.promo(); redraw(); })),
  career: (ov, redraw) => $$("[data-offer]", ov).forEach(b => b.addEventListener("click", () => { const o = S.offer; if (b.dataset.offer === "yes") { const js = jobState(o.job); js.xp = Math.max(js.xp, LEVELS[1].xp); S.money += o.bonus; toast(`Offer accepted! You're now a Junior in ${jobById(o.job).dept}. +${money(o.bonus)}`, "gold"); Sfx.cash(); } S.offer = null; save(); hud(); redraw(); }))
};

/* ---------- character creator / title ---------- */
function showTitle() {
  LOC = "title"; hud(); clearWorld(); E.weather = "sun"; buildLobby({}); setLighting(10, "sun");
  if (!S.player) S.player = null;
  const look = S.player ? S.player.look : { skin: 1, hair: 0, shirt: 0, style: 0, pants: 0 };
  Player.mesh && E.scene.remove(Player.mesh); Player.mesh = makePerson(look); Player.mesh.position.set(0, 0, 5); E.scene.add(Player.mesh); E.orbit = true; Player.mesh.visible = true;
  const ov = overlay(`<div class="title-card"><div class="logo">New Hire<span class="logo3d">3D</span></div><div class="logo-sub">JOB SIMULATOR</div>
    <p>Walk into Brightline Corp on your first day. Pick a department, help coworkers, learn the job and build your career, from Mom's couch to the skyline loft.</p>
    <div class="row wrap center">${S.player ? `<button class="btn go big" type="button" id="cont">Continue as ${esc(S.player.name)}</button>` : ""}<button class="btn ${S.player ? "orange" : "go big"}" type="button" id="newc">${S.player ? "Start over" : "Start your career"}</button></div>
    <button class="btn grey sm" type="button" id="tm">Sound, music & voices</button></div>`, { sticky: true, cls: "titleov" });
  $("#tm", ov).addEventListener("click", () => { Sfx.init(); Music.play("title"); openSettings(); });
  Music.play("title");
  if (S.player) $("#cont", ov).addEventListener("click", () => { Sfx.init(); Sfx.ok(); ov.close(); E.orbit = false; goLocation(S.phase === "evening" && LOC !== "home" ? "home" : "home", { text: `Day ${S.day}` }); });
  $("#newc", ov).addEventListener("click", () => {
    Sfx.init(); Sfx.click();
    if (S.player) { const c = overlay(`<div class="panel modal"><div class="bar">Start over?</div><div class="m-body"><p>This erases your career: money, jobs, home, achievements. This can't be undone.</p><div class="row wrap"><button class="btn orange" type="button" id="y">Erase and start over</button><button class="btn grey" type="button" id="n">Keep my career</button></div></div></div>`); $("#y", c).addEventListener("click", () => { c.close(); ov.close(); S = fresh(); save(); openCreator(true); }); $("#n", c).addEventListener("click", () => c.close()); return; }
    ov.close(); openCreator(true);
  });
}
function openCreator(isNew) {
  const a = S.player ? Object.assign({ g: "m", outfit: 1 }, S.player.look) : { g: "m", outfit: 1, skin: 1, hair: 0, shirt: 0, style: 0, pants: 0 }; a.gi = a.g === "f" ? 1 : 0; const name = S.player ? S.player.name : "";
  E.orbit = true; const keepPos = Player.mesh ? Player.mesh.position.clone() : V3(0, 0, 4);
  const rebuild = () => { const p = Player.mesh ? Player.mesh.position.clone() : keepPos; const ry = Player.mesh ? Player.mesh.rotation.y : 0; if (Player.mesh) E.scene.remove(Player.mesh); Player.mesh = makePerson(a); Player.mesh.position.copy(p); Player.mesh.rotation.y = ry; E.scene.add(Player.mesh); };
  rebuild();
  const sw = (k, arr, lbl) => `<div class="field"><span class="lbl">${lbl}</span><div class="swatches" data-k="${k}">${arr.map((c, i) => `<button class="sw" type="button" style="background:${c}" data-v="${i}" aria-label="${lbl} ${i + 1}" aria-pressed="${a[k] === i}"></button>`).join("")}</div></div>`;
  const ov = overlay(`<div class="panel creator"><div class="bar">${isNew ? "New employee registration" : "Mirror"}</div><div class="m-body">
    <div class="field"><label for="pname">Your name</label><input type="text" id="pname" maxlength="18" value="${esc(name)}" placeholder="e.g. Sam Carter" autocomplete="off" ${isNew ? "" : "disabled"}></div>
    ${sw("skin", SKINS, "Skin tone")}${sw("hair", HAIRS, "Hair color")}
    <div class="field"><span class="lbl">Build</span><div class="seg" data-k="gi">${["Masculine", "Feminine"].map((s, i) => `<button type="button" data-v="${i}" aria-pressed="${a.gi === i}">${s}</button>`).join("")}</div></div>
    <div class="field"><span class="lbl">Outfit</span><div class="seg" data-k="outfit" id="outSeg">${OUTFIT_NAMES[a.g].map((s, i) => `<button type="button" data-v="${i}" aria-pressed="${a.outfit === i}">${s}</button>`).join("")}</div></div>
    ${sw("shirt", SHIRTS, "Shirt")}${sw("pants", PANTS, "Pants")}
    <div class="row wrap"><button class="btn go big" type="button" id="hire">${isNew ? "Get my badge" : "Looking good"}</button><span class="small" id="cerr"></span></div></div></div>`, { sticky: true, cls: "creatorov" });
  $$("[data-k]", ov).forEach(g => $$("button", g).forEach(b => b.addEventListener("click", () => { a[g.dataset.k] = +b.dataset.v; $$("button", g).forEach(x => x.setAttribute("aria-pressed", String(x === b))); if (g.dataset.k === "gi") { a.g = a.gi ? "f" : "m"; a.style = a.gi ? 1 : 0; $$("#outSeg button", ov).forEach((x, i) => x.textContent = OUTFIT_NAMES[a.g][i]); } rebuild(); Sfx.click(); })));
  $("#hire", ov).addEventListener("click", () => {
    const raw = $("#pname", ov).value.trim(); if (!raw) { $("#cerr", ov).textContent = "Type your name so HR can print your badge."; $("#pname", ov).focus(); return; }
    const n = cleanName(raw); if (!n) { $("#cerr", ov).textContent = "Pick a different name: letters and numbers only, nothing rude. Tip: use a nickname, not your full real name."; $("#pname", ov).focus(); return; }
    if (isNew) { const keep = { muted: S.muted, music: S.music, musicVol: S.musicVol, voice: S.voice, voiceVol: S.voiceVol, voicePick: S.voicePick, gfx: S.gfx }; S = Object.assign(fresh(), keep); S.player = { name: n, look: a }; tutStart(); } else S.player.look = a;
    save(); ov.close(); E.orbit = false; Sfx.ok();
    if (isNew) goLocation("home", { text: "Day 1", after: () => setTimeout(openHelp, 500) }); else { spawnPlayer(Player.mesh.position.x, Player.mesh.position.z, Player.mesh.rotation.y); hud(); }
  });
}
function openHelp() {
  const ov = overlay(`<div class="panel modal wide"><div class="bar">How to play</div><div class="m-body help">
    <div class="helpgrid"><div><b>Look around</b>Click the screen to control the camera with your mouse. Press Esc to get the cursor back. On touch screens, drag anywhere to look.</div><div><b>Move</b>WASD or arrow keys. On touch screens, use the joystick at the bottom left, or tap the floor to walk there.</div><div><b>Talk & use</b>Look at a person or object (the dot in the middle turns yellow) and press E, Space or click. Or tap the green button.</div><div><b>Phone</b>Shop, skills, trophies, career paths, journal and glossary, anywhere.</div></div>
    <h4>Your day</h4><p>Wake up at home → go to work → take the elevator to a department → talk to the mentor to clock in → help people who walk up (yellow <b>!</b>) and check your desk → get paid → go home and sleep. Rent is charged each night.</p>
    <h4>During a shift</h4><p>Watch <b>performance</b>, <b>energy</b> (coffee helps) and <b>stress</b> (breaks help; high stress makes mistakes hurt more). Red <b>!!</b> means urgent. If people wait too long, they give up. Coworkers you befriend (3 hearts) may cover for you once a shift.</p>
    <h4>Learning</h4><p>Every task teaches a real lesson. Tap <span class="gterm">underlined words</span> to collect glossary terms. The Training Center (lobby, left door) gives certificates. Every 5 shifts in a job, you get a performance review.</p>
    <button class="btn go big" type="button" id="hk">Let's go</button></div></div>`);
  $("#hk", ov).addEventListener("click", () => ov.close());
}

/* ---------- boot ---------- */
const Game = { tick, interact, interactWith, speedMul: () => (1 + CARS[S.car].speed) * (SH && SH.energy < 30 && !has("unstoppable") ? .7 : 1) };
function boot() {
  setupHud();
  if (!initEngine()) { $("#ui").innerHTML = `<div class="overlay"><div class="panel modal"><div class="bar">3D isn't available</div><div class="m-body"><p>Your browser couldn't start 3D graphics (WebGL). Try a recent version of Chrome, Edge, Firefox or Safari, or turn on hardware acceleration in your browser settings.</p></div></div></div>`; return; }
  const lov = overlay(`<div class="loadbox"><div class="ld-title">New Hire <sup>3D</sup></div><div id="ldTxt">Loading the office…</div><div class="meter"><i id="ldBar" style="width:0%"></i></div><div class="small" id="ldTip"></div></div>`, { sticky: true });
  let shown = false; const go = () => { if (shown) return; shown = true; clearInterval(tipT); lov.close(); if (disclaimerSeen()) showTitle(); else showDisclaimer(showTitle); };
  let cp = 0, ex = 0; const bar = () => { const b = $("#ldBar"); if (b) b.style.width = Math.round((cp * .6 + ex * .2) * 100) + "%"; const t = $("#ldTxt"); if (t) t.textContent = cp < 1 ? "Loading coworkers…" : ex < 2 ? "Loading furniture and people…" : "Almost ready…"; };
  const tip = () => { const el = $("#ldTip"); if (el) el.textContent = pick(LOAD_TIPS); }; tip(); const tipT = setInterval(tip, 3500);
  Promise.all([loadModels(p => { cp = p; bar(); }), loadExtraModels(() => { ex++; bar(); })]).then(go, go);
  setTimeout(go, 45000);
  initOnline(); autoDetectGfx();
}
window.__nh = { JOBS, plain, genderFor, get models() { return modelsReady; }, Music, Voice, get S() { return S; }, get SH() { return SH; }, E, Player, goLocation, startShift, jobById, interactWith, openShiftTask, endShift, nextDay, openPhone, openTraining, openDaily, openAskMentor: (...a) => openAskMentor(...a), validateSave: o => validateSave(o), openElevator, get LOC() { return LOC; }, openMenuNow: () => openMenu(todaysMenu()), openRaise: j => openRaise(j), afterShift: (...a) => afterShift(...a), jobState, openWfh: () => openWfh(), adoptPet: id => adoptPet(PETS.find(p => p.id === id)), rideTalk: f => rideTalk(f), openInterview: (j, f) => openInterview(j, f), startEvent: ev => startEvent(ev), openHustles: () => openHustles(), storyCheck: () => storyCheck(), bizDay: () => bizDay(), openEndless: () => openEndless(), get DECL() { return DECL; }, offerParty: h => offerParty(h), openWardrobe: () => openWardrobe(), updateNPC: (n, dt) => updateNPC(n, dt), tick: dt => tick(dt), get POST() { return POST; }, debugGfx: (g, lines) => { if (lines !== undefined) QUALITY[g].lines = lines; S.gfx = g; applyQuality(); } };
