/* =====================================================================
   LIFE 2: work-from-home days, overtime and burnout, elevator small talk,
   pets at home.
   ===================================================================== */

/* ---------- burnout ---------- */
const burn = () => clamp(S.burn || 0, 0, 100);
function burnAfterShift(ot) { S.burn = clamp(burn() + 9 + (ot ? 14 : 0), 0, 100); if (S.burn >= 70 && !S.burnWarned) { S.burnWarned = S.day; setTimeout(() => toast("You're getting burned out. Taking a day off (sleep through a day) helps a lot.", "red"), 3000); } }
function burnOvernight(worked) { S.burn = clamp(burn() - (worked ? 6 : 35), 0, 100); if (S.burn < 50) S.burnWarned = 0; }
function burnStart(sh) { const b = burn(); if (b > 40) { sh.energy = Math.max(40, 100 - (b - 40) * .9); sh.stress = Math.min(60, 10 + (b - 40) * .6); setTimeout(() => toast(`You feel ${b >= 75 ? "exhausted" : "a bit worn out"}. Burnout ${Math.round(b)}%: lower energy, higher stress today.`, "red"), 2500); } }

/* ---------- overtime offer at clock-in ---------- */
function maybeOvertime(job, start) {
  const js = jobState(job.id);
  if (js.days < 2 || Math.random() > .3) return start(false);
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">Overtime?</div><div class="m-body">
    <div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> We're short-staffed today. Want to pick up overtime? Two extra requests, and you earn 1.5× for the extra work.</div>
    <p class="small">Burnout: ${Math.round(burn())}%. Overtime pays more but wears you out faster. Real tip: in many places, hourly workers must be paid extra for overtime by law.</p>
    <div class="row wrap"><button class="btn go" type="button" id="otY">Yes, I'll stay late</button><button class="btn grey" type="button" id="otN">No thanks, normal shift</button></div></div></div>`, { sticky: true });
  $("#otY", ov).addEventListener("click", () => { ov.close(); start(true); });
  $("#otN", ov).addEventListener("click", () => { ov.close(); start(false); });
}
function addOvertime(sh) {
  sh.ot = true; const extra = shuffle(sh.job.tasks.filter(t => t.tier <= 2)).slice(0, 2);
  extra.forEach((t, i) => sh.list.push({ t, urgent: false, at: 300 + i * 70 + Math.random() * 20 }));
  sh.list.sort((a, b) => a.at - b.at);
  sh.bonus += Math.round(LEVELS[lvl(sh.js.xp)].pay * .5);
}

/* ---------- work-from-home days ---------- */
const isWfh = () => S.wfh === S.day;
function rollWfh() { const last = S.lastJob && jobById(S.lastJob); S.wfh = last && Math.random() < .2 && !["wh", "chef", "med", "retail", "logi"].includes(last.id) ? S.day : 0; if (S.wfh) setTimeout(() => toast(`<b>Work-from-home day!</b> ${esc(last.dept)} says you can work remotely today. Use your home computer.`, "gold"), 3200); }
function openWfh() {
  const job = jobById(S.lastJob); if (!job) return;
  if (S.workedToday) { toast("You already worked today."); return; }
  const js = jobState(job.id); const tasks = shuffle(chooseTasks(job, js, 3)).slice(0, 3); let i = 0, ok = 0;
  const next = () => {
    if (i >= tasks.length) {
      const pay = Math.round(LEVELS[lvl(js.xp)].pay * .75 * (ok + 1) / (tasks.length + 1) * (1 + js.raise)); const xp = ok * 8;
      js.xp += xp; js.days++; S.money += pay; S.workedToday = true; S.phase = "evening"; ledger(`${job.dept} (remote)`, pay); burnAfterShift(false); save(); hud(); checkAch();
      const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">Remote day done</div><div class="m-body"><p>You finished ${ok} of ${tasks.length} tasks from home. <b class="money">+${money(pay)}</b> · +${xp} XP</p><p class="small">Working from home tip: keep regular hours, take real breaks, and over-communicate with your team, since they can't see you working.</p><button class="btn go" type="button">Log off</button></div></div>`);
      $(".btn", ov).addEventListener("click", () => ov.close()); Sfx.cash(); return;
    }
    const t = tasks[i++];
    openTaskWindow(t, { color: job.color, mentor: job.mentor.name, hintCost: 0, pc: ["Remote desktop", job.color], doneLabel: i < tasks.length ? "Next task" : "Finish the day", onFinish: r => { if (r) { ok++; js.done[t.id] = "ok"; } else js.done[t.id] = js.done[t.id] || "fail"; return 0; }, after: next });
  };
  toast(`<b>Working from home</b> for ${esc(job.dept)}. ${tasks.length} tasks today.`); next();
}

/* ---------- elevator small talk ---------- */
const SMALLTALK = [
  { q: "Big plans for the weekend?", a: [["Just relaxing. Maybe a hike if the weather's nice. You?", 1], ["Why do you care?", -1], ["*stare at your phone*", 0]] },
  { q: "Can you believe this weather?", a: [["I know, right? Perfect excuse for a hot coffee.", 1], ["*sigh loudly*", 0], ["Weather talk is so boring.", -1]] },
  { q: "Are you new here? I don't think we've met.", a: [["I am! I'm still learning the ropes. Nice to meet you.", 1], ["Yeah.", 0], ["I'm kind of a big deal, actually.", -1]] },
  { q: "Ugh, Mondays, am I right?", a: [["Coffee helps! Hope your week goes smoothly.", 1], ["Every day is Monday to me.", 0], ["Stop complaining.", -1]] },
  { q: "I'm presenting to the boss today. Super nervous.", a: [["You've got this! Practice the first minute and the rest will flow.", 1], ["Good luck, I guess.", 0], ["Better you than me, ha.", -1]] },
  { q: "Did you try the new cafeteria special?", a: [["Not yet. Is it good? I'll try it at lunch.", 1], ["I bring my own food.", 0], ["Cafeteria food is gross.", -1]] }
];
let lastTalk = 0;
function rideTalk(go) {
  if (Math.random() > .3 || Date.now() - lastTalk < 60000 || !S.player) return go();
  lastTalk = Date.now(); const st = pick(SMALLTALK); const nm = `${pick(FIRST)} ${pick(LAST)}`;
  const ov = overlay(`<div class="panel modal elev"><div class="bar">Elevator <span class="dots"><i></i><i></i><i></i></span></div><div class="m-body">
    <div class="row"><span style="font-size:28px">${avatar(lookFor(nm), 40)}</span><div class="bubble" style="flex:1"><b class="name">${esc(nm.split(" ")[0])}:</b> ${esc(st.q)}</div></div>
    <div class="opts">${shuffle(st.a).map(([t, v]) => `<button class="opt" type="button" data-v="${v}"><span class="radio"></span>${esc(t)}</button>`).join("")}</div>
    <p class="small">Small talk builds your work reputation. Friendly and short works best.</p></div></div>`, { sticky: true });
  Voice.say(st.q, nm, 2);
  $$("[data-v]", ov).forEach(b => b.addEventListener("click", () => {
    const v = +b.dataset.v; S.rep = clamp(S.rep + v, 0, 100); save();
    toast(v > 0 ? `${esc(nm.split(" ")[0])} smiles. Nice chat! +1 reputation.` : v < 0 ? `That was awkward. ${esc(nm.split(" ")[0])} looks away. −1 reputation.` : "The ride continues in silence.", v < 0 ? "red" : "");
    if (v > 0) { S.stats.smalltalk = (S.stats.smalltalk || 0) + 1; if (S.stats.smalltalk >= 10) award("chatty"); }
    ov.close(); go();
  }));
}

/* ---------- pets ---------- */
const PETS = [{ id: "dog", name: "Dog", price: 300, desc: "Loyal, loves walks. Greets you at the door." }, { id: "cat", name: "Cat", price: 250, desc: "Independent, cuddly on its own terms." }];
function makeCat() {
  const g = new THREE.Group(); const fur = mat("#8c8c94", { rough: .9 }), dark = mat("#3a3a40");
  const M = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  M(sgeo(.16, 14, 10), fur, 0, .3, 0).scale.set(1, .9, 1.7); M(sgeo(.12, 14, 10), fur, 0, .46, .3);
  [-.06, .06].forEach(x => { const e = M(new THREE.ConeGeometry(.04, .09, 6), fur, x, .58, .3); e.rotation.z = x > 0 ? -.2 : .2; });
  [-.04, .04].forEach(x => M(sgeo(.018, 6, 6), mat("#9be15d"), x, .48, .41));
  const legs = [[-.08, -.17], [.08, -.17], [-.08, .17], [.08, .17]].map(([x, z]) => M(cgeo(.03, .03, .24, 6), fur, x, .12, z));
  const tail = M(cgeo(.02, .015, .4, 6), dark, 0, .45, -.3); tail.rotation.x = -.5;
  g.userData = { legs, tail }; return g;
}
function spawnPet() {
  if (!S.pet || !S.pet.kind || LOC !== "home") return;
  const W = E.room.W, D = E.room.D; const pet = S.pet.kind === "cat" ? makeCat() : makeDog(); pet.position.set(W / 2 - 2.4, 0, -D / 2 + 2.4); E.world.add(pet);
  const d = { tgt: V3(0, 0, 0), wait: 0 }; const fedToday = () => S.pet.fed === S.day, pettedToday = () => S.pet.petted === S.day;
  E.anims.push(dt => { if (d.wait > 0) { d.wait -= dt; pet.userData.legs.forEach(l => l.rotation.x = 0); } else { if (petMove(pet, d.tgt, S.pet.kind === "cat" ? 1 : 1.5, dt)) { d.tgt = V3((Math.random() - .5) * (W - 3), 0, (Math.random() - .5) * (D - 3)); d.wait = 2 + Math.random() * 4; } else { pet.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(E.t * 12 + i * Math.PI) * .5); } } pet.userData.tail.rotation.y = Math.sin(E.t * (S.pet.kind === "cat" ? 3 : 15)) * .6; it.pos.copy(pet.position); });
  const it = addInter({ name: S.pet.name, verb: !fedToday() ? `Feed ${S.pet.name}` : `Pet ${S.pet.name}`, x: 0, z: 0, r: 1.6, h: 1, mark: () => !fedToday() ? "!" : pettedToday() ? "" : "♥", action: () => {
    if (!fedToday()) { S.pet.fed = S.day; S.money -= 5; ledger("Pet food", -5); toast(`You fed ${esc(S.pet.name)}. (−$5)`); it.verb = `Pet ${S.pet.name}`; }
    else if (!pettedToday()) { S.pet.petted = S.day; S.pet.love = Math.min(10, (S.pet.love || 0) + 1); S.burn = clamp(burn() - 8, 0, 100); toast(`${esc(S.pet.name)} ${S.pet.kind === "cat" ? "purrs" : "wags happily"}. −8 burnout.`); Sfx.tone(880, .1, "sine", .05); Sfx.tone(1100, .1, "sine", .05, .1); if (S.pet.love >= 5) award("petpal"); }
    else toast(`${esc(S.pet.name)} is napping happily.`);
    E.wave = E.t; save(); } });
  if (!fedToday() && S.phase === "morning") setTimeout(() => toast(`${esc(S.pet.name)} looks hungry. Feed your pet before work.`), 1500);
}
function adoptPet(p) {
  if (S.money < p.price) { toast("Not enough money to adopt yet."); Sfx.bad(); return; }
  const ov = overlay(`<div class="panel modal"><div class="bar">Adopt a ${p.name.toLowerCase()}</div><div class="m-body"><p>Pick a name for your new ${p.name.toLowerCase()}. Pets need food every day ($5) and love you back.</p><input type="text" id="petName" maxlength="14" placeholder="${p.id === "cat" ? "e.g. Mochi" : "e.g. Biscuit"}" autocomplete="off" style="width:100%;padding:8px;border-radius:8px;border:1px solid #bbb;font:inherit"><div class="row wrap" style="margin-top:8px"><button class="btn go" type="button" id="pOk">Adopt for ${money(p.price)}</button><button class="btn grey" type="button" id="pNo">Cancel</button></div><span class="small" id="pErr"></span></div></div>`);
  $("#pOk", ov).addEventListener("click", () => { const nm = cleanName($("#petName", ov).value) || (p.id === "cat" ? "Mochi" : "Biscuit"); S.money -= p.price; ledger(`Adopted ${nm}`, -p.price); S.pet = { kind: p.id, name: nm, fed: 0, petted: 0, love: 0, since: S.day }; save(); Sfx.promo(); toast(`Welcome home, ${esc(nm)}!`, "gold"); ov.close(); if (LOC === "home") goLocation("home", { text: "Home" }); });
  $("#pNo", ov).addEventListener("click", () => ov.close());
}
