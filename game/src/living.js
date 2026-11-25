/* =====================================================================
   LIVING BUILDING: guests who arrive by elevator and walk around,
   coworkers chatting with each other, lobby foot traffic, and coworkers
   who remember what you talked about.
   ===================================================================== */
const GUEST_TYPES = [
  { role: "Delivery driver", lines: ["Package for this floor!", "Sign here, please.", "Third delivery today!"], carry: "#c9a06a" },
  { role: "IT technician", lines: ["Just swapping a network switch.", "Have you tried turning it off and on?", "Don't mind me, cable work."], carry: "#3a7bd5" },
  { role: "Client", lines: ["I have a meeting with your manager.", "Nice office!", "Is the coffee always this good?"] },
  { role: "Intern", lines: ["Is it always this busy?", "Where's the printer again?", "First week! So nervous."] },
  { role: "Facilities", lines: ["Checking the AC.", "Watch your step, floor's a bit wet.", "Replacing a light."], carry: "#7d8794" },
  { role: "Recruiter", lines: ["We're hiring, tell your friends!", "Love the energy on this floor.", "Anyone seen HR?"] }
];
const GUESTS = { next: 12, list: [] };
function guestTargets() {
  const F = E.F; const t = [];
  if (F.coffeePos) t.push(F.coffeePos); if (F.printerPos) t.push([F.printerPos[0], F.printerPos[1] - 1]); if (F.sofaPos) t.push(F.sofaPos);
  if (F.mentor) t.push([F.mentor.mesh.position.x - .9, F.mentor.mesh.position.z - .9]);
  (F.wander || []).forEach(w => t.push(w)); return t;
}
function routeTo(from, to) {
  const F = E.F; if (F.corr && F.mainZ !== undefined && Math.abs(F.mainZ) < 20) return [[from[0], F.mainZ], [to[0], F.mainZ], to];
  return [to];
}
function spawnGuest() {
  if (!E.F || LOC !== "floor" || !E.room) return; const D = E.room.D; const type = pick(GUEST_TYPES); const nm = `${pick(FIRST)} ${pick(LAST)}`;
  const n = addNPC({ kind: "guest", name: nm, role: type.role, look: lookFor(nm), x: 0, z: -D / 2 + .9, ry: 0 }); n.speed = 1.6 + Math.random() * .5;
  E.elevOpenUntil = E.t + 2.2; GUESTS.list.push(n);
  if (type.carry) { const b = new THREE.Mesh(bgeo(.35, .25, .3), mat(type.carry)); b.position.set(0, 1, .28); n.mesh.add(b); }
  const targets = guestTargets().filter(t => segClear(0, -D / 2 + 1.6, t[0], t[1]) || E.F.mainZ !== undefined);
  const goal = pick(targets.length ? targets : [[0, 0]]);
  n.onTalk = m => npcSay(m, pick(type.lines), 4);
  walkTo(n, [[0, E.F.mainZ !== undefined ? Math.min(E.F.mainZ, -D / 2 + 3) : -D / 2 + 3], ...routeTo([0, -D / 2 + 3], goal)], m => {
    m.mode = "idle"; if (Math.random() < .5) npcSay(m, pick(type.lines), 4);
    setTimeout(() => { if (!m.mesh.parent) return; walkTo(m, [...routeTo([m.mesh.position.x, m.mesh.position.z], [0, -D / 2 + 3]).slice(0, -1), [0, -D / 2 + 3], [0, -D / 2 + .7]], q => { E.elevOpenUntil = E.t + 1.6; setTimeout(() => { removeNPC(q); GUESTS.list = GUESTS.list.filter(g => g !== q); }, 600); }); }, 4000 + Math.random() * 7000);
  });
}
/* lobby foot traffic: people come in the front, take the elevator up, others leave */
function spawnLobbyWalker() {
  if (LOC !== "lobby" || !E.room) return; const W = E.room.W, D = E.room.D, nm = `${pick(FIRST)} ${pick(LAST)}`; const inbound = Math.random() < .55;
  const door = [W / 2 - 1.2, 7], elev = [0, -D / 2 + .8], mid = [W / 2 - 3.5, -4];
  const start = inbound ? door : elev; const n = addNPC({ kind: "guest", name: nm, role: pick(["Employee", "Visitor", "Courier", "Contractor"]), look: lookFor(nm), x: start[0], z: start[1] }); n.speed = 1.7 + Math.random() * .4; GUESTS.list.push(n);
  if (!inbound) E.elevOpenUntil = E.t + 2;
  const path = inbound ? [[W / 2 - 3.5, 7], mid, [1.5, -D / 2 + 2.2], elev] : [[1.5, -D / 2 + 2.2], mid, [W / 2 - 3.5, 7], door];
  walkTo(n, path, m => { if (inbound) E.elevOpenUntil = E.t + 1.5; setTimeout(() => { removeNPC(m); GUESTS.list = GUESTS.list.filter(g => g !== m); }, 500); });
}
/* coworkers chat with each other in short back-and-forths */
const BANTER = [
  ["Did you finish the report?", "Almost. Just checking the numbers twice."], ["Lunch at noon?", "Cafeteria has tacos today!"],
  ["The new system is so much faster.", "Right? No more spinning wheel."], ["How was your weekend?", "Relaxing. I finally slept in."],
  ["Can you look at this for me?", "Sure, give me two minutes."], ["The boss liked your idea.", "Really? That's great to hear!"],
  ["Coffee machine is fixed!", "Best news all week."], ["Big meeting at three.", "I'll bring the slides."]
];
function banterTick() {
  if (LOC !== "floor") return;
  for (const n of E.npcs) if (n.life === "chat" && n.chatWith && !n.path.length && !n.bantered) {
    n.bantered = true; const [a, b] = pick(BANTER); const o = n.chatWith;
    npcSay(n, a, 3.5); setTimeout(() => { if (o.mesh.parent) npcSay(o, b, 3.5); }, 2600);
    setTimeout(() => { n.bantered = false; }, 45000);
  }
}
function livingTick(dt) {
  if (E.uiOpen) return;
  GUESTS.next -= dt; banterTick();
  if (GUESTS.next <= 0) {
    GUESTS.list = GUESTS.list.filter(g => g.mesh.parent);
    if (LOC === "floor" && GUESTS.list.length < 2) spawnGuest();
    else if (LOC === "lobby" && GUESTS.list.length < 3) spawnLobbyWalker();
    GUESTS.next = LOC === "lobby" ? 8 + Math.random() * 10 : 20 + Math.random() * 25;
  }
}
function livingReset() { GUESTS.list = []; GUESTS.next = LOC === "lobby" ? 3 : 10 + Math.random() * 8; }

/* coworkers remember your conversations */
function memoryLine(n) {
  const m = (S.memory || {})[n.name]; if (!m) return null;
  const days = S.day - m.d; if (days < 1) return null;
  const ago = days === 1 ? "yesterday" : `${days} days ago`;
  return pick([`Hey! I was thinking about what I told you ${ago}: "${m.t.slice(0, 60)}${m.t.length > 60 ? "…" : ""}" Did it help?`, `Good to see you again! ${days === 1 ? "Yesterday" : "Last time"} we talked about work stuff. Any luck since then?`, `${S.player.name.split(" ")[0]}! You're becoming a regular around here.`]);
}
function remember(n, text) { S.memory = Object.assign({}, S.memory, { [n.name]: { d: S.day, t: String(text).slice(0, 120) } }); const keys = Object.keys(S.memory); if (keys.length > 60) delete S.memory[keys[0]]; }
