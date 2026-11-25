/* =====================================================================
   FUN: job interviews, achievement titles, silly random events, and the
   secret rooftop garden.
   ===================================================================== */

/* ---------- job interviews (first day in a department) ---------- */
const INTERVIEW_Q = [
  { q: "Tell me about yourself.", a: [["A short summary: what I'm learning, what I'm good at, and why this job interests me.", 2], ["My whole life story, starting from kindergarten.", 0], ["Uh, it's all on my résumé.", 0]] },
  { q: "Tell me about a time you made a mistake.", a: [["I explain the situation, what I did, what happened, and what I learned (the STAR method).", 2], ["I never make mistakes.", 0], ["It was my coworker's fault, honestly.", 0]] },
  { q: "Why do you want to work here?", a: [["I researched the team, and I like that this role helps people and teaches real skills.", 2], ["I need money.", 1], ["I don't really know.", 0]] },
  { q: "What's your biggest weakness?", a: [["I sometimes take on too much, so now I use a to-do list and ask for help early.", 2], ["I'm a perfectionist. That's it.", 1], ["I'm lazy.", 0]] },
  { q: "How do you handle a stressful day?", a: [["I prioritize the most urgent tasks, stay calm, and communicate with my team.", 2], ["I just leave early.", 0], ["I work faster and skip breaks every time.", 1]] },
  { q: "Do you have any questions for us?", a: [["Yes: what does a great first month look like in this role?", 2], ["How much vacation do I get?", 1], ["Nope.", 0]] }
];
function needsInterview(job) { const js = S.jobs[job.id]; return (!js || !js.days) && !(S.hired || {})[job.id]; }
function openInterview(job, then) {
  const qs = shuffle(INTERVIEW_Q).slice(0, 3); let i = 0, score = 0;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">Job interview: ${esc(job.dept)}</div><div class="m-body" id="ivb"></div></div>`, { sticky: true });
  const draw = () => {
    const box = $("#ivb", ov);
    if (i >= qs.length) {
      S.hired = Object.assign({}, S.hired, { [job.id]: S.day }); const great = score >= 5, ok = score >= 3;
      S.nextPerf += great ? 10 : ok ? 0 : -8; save();
      box.innerHTML = `<div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> ${great ? "Fantastic interview. You're hired, and I can tell you'll do great!" : ok ? "Good interview. Welcome to the team!" : "Hmm, that was a bit rough, but everyone deserves a chance. Welcome aboard."}</div>
        <div class="lesson"><b>Real interview tips:</b> research the company, answer with the STAR method (Situation, Task, Action, Result), be honest about weaknesses and how you're improving, and always ask a question at the end.</div>
        <p class="small">First impression: ${great ? "+10% starting performance" : ok ? "normal start" : "−8% starting performance"}.</p>
        <button class="btn go" type="button" id="ivd">Start my first day</button>`;
      Voice.say(great ? "Fantastic interview. You're hired!" : "Welcome to the team!", job.mentor.name, 2);
      if (great) award("interview");
      $("#ivd", ov).addEventListener("click", () => { ov.close(); then(); }); return;
    }
    const q = qs[i];
    box.innerHTML = `<div class="small">Question ${i + 1} of ${qs.length}</div><div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> ${esc(q.q)}</div>
      <div class="opts">${shuffle(q.a).map(([t, v]) => `<button class="opt" type="button" data-v="${v}"><span class="radio"></span>${esc(t)}</button>`).join("")}</div>`;
    Voice.say(q.q, job.mentor.name, 2);
    $$("[data-v]", box).forEach(b => b.addEventListener("click", () => { const v = +b.dataset.v; score += v; Sfx[v === 2 ? "ok" : "click"](); i++; draw(); }));
  };
  draw();
}

/* ---------- titles from achievements ---------- */
const playerTitle = () => { const a = S.titleSel && S.ach[S.titleSel] && ACH.find(x => x[0] === S.titleSel); return a ? a[1] : ""; };
function wireTitles(ov, redraw) {
  $$(".ach.on", ov).forEach((el, idx) => {
    const id = ACH.filter(a => S.ach[a[0]])[idx][0]; const b = document.createElement("button"); b.type = "button"; b.className = "btn sm" + (S.titleSel === id ? " go" : "");
    b.textContent = S.titleSel === id ? "Your title ✔" : "Use as title"; b.style.marginLeft = "auto";
    b.addEventListener("click", () => { S.titleSel = S.titleSel === id ? "" : id; save(); hud(); redraw(); }); el.appendChild(b);
  });
}

/* ---------- silly random events ---------- */
const FUN_EVENTS = ["birthday", "badge", "pigeon"];
function funEvent(ev) {
  const F = E.F; if (!FUN_EVENTS.includes(ev.kind)) return false;
  const spot = (F.wander && F.wander.length ? pick(F.wander) : [0, 2]);
  if (ev.kind === "birthday") {
    const nm = pick(E.npcs.filter(n => n.kind === "coworker")) || { name: "Someone" }; const [x, z] = spot;
    const g = group(x, z); box(g, .5, .7, .5, "#8a5a3b", 0, 0, 0); const cake = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .14, 18), mat("#f7c6d9")); cake.position.y = .78; g.add(cake);
    const fl = new THREE.Mesh(sgeo(.025, 6, 6), new THREE.MeshBasicMaterial({ color: "#ffb703" })); fl.position.y = .92; g.add(fl); E.anims.push(() => fl.scale.setScalar(1 + Math.sin(E.t * 20) * .3));
    let had = false; toast(`<b>It's ${esc(nm.name.split(" ")[0])}'s birthday!</b> There's cake.`, "gold");
    addInter({ name: "Birthday cake", verb: "Have a slice (+energy)", x, z: z + .6, r: 1.6, h: 1.2, mark: () => had ? "" : "!", action: () => { if (had) return toast("You already had a slice. Save some for others!"); had = true; if (SH) { SH.energy = Math.min(100, SH.energy + 15); SH.stress = Math.max(0, SH.stress - 8); } toast("Happy birthday! +15 energy, −8 stress."); E.npcs.filter(n => n.kind === "coworker").forEach(n => npcEmote(n, "cheer", 1.5)); } });
  } else if (ev.kind === "badge") {
    const owner = pick(E.npcs.filter(n => n.kind === "coworker")); if (!owner) return true; const [x, z] = spot;
    const card = new THREE.Mesh(bgeo(.12, .01, .08), mat("#1b5ea6")); card.position.set(x + .8, .01, z); E.world.add(card);
    let found = false, back = false; toast("Someone dropped their ID badge. Keep an eye out!");
    const it = addInter({ name: "ID badge", verb: "Pick up the badge", x: x + .8, z, r: 1.4, h: .4, mark: () => found ? "" : "?", action: () => { if (found) return; found = true; E.world.remove(card); it.label.remove(); E.inters = E.inters.filter(q => q !== it); toast(`It's ${esc(owner.name)}'s badge. Bring it back to them!`); } });
    const old = owner.onTalk; owner.onTalk = n => { if (found && !back) { back = true; S.rep = Math.min(100, S.rep + 2); npcSay(n, "My badge! Thank you so much. Security would've been a nightmare.", 5); toast("You returned the badge. +2 reputation. (Real tip: always report lost badges, since they open secure doors.)", "gold"); save(); owner.onTalk = old; } else if (old) old(n); };
  } else if (ev.kind === "pigeon") {
    const bird = new THREE.Group(); const body = new THREE.Mesh(sgeo(.12, 10, 8), mat("#8d96a3")); body.scale.set(1, .9, 1.4); bird.add(body); const head = new THREE.Mesh(sgeo(.07, 8, 6), mat("#5b6878")); head.position.set(0, .1, .14); bird.add(head);
    bird.position.set(0, 2.2, 0); E.world.add(bird); let caught = false; toast("<b>A pigeon flew in through a window!</b> Shoo it out gently.", "gold");
    E.anims.push(() => { if (caught) return; bird.position.set(Math.sin(E.t * .7) * 5, 2 + Math.sin(E.t * 3) * .4, Math.cos(E.t * .5) * 3); bird.rotation.y = E.t * .7 + Math.PI / 2; it.pos.set(bird.position.x, 0, bird.position.z); });
    const it = addInter({ name: "Pigeon", verb: "Shoo the pigeon out", x: 0, z: 0, r: 2.6, h: 2.6, mark: () => caught ? "" : "!", action: () => { if (caught) return; caught = true; E.world.remove(bird); it.label.remove(); E.inters = E.inters.filter(q => q !== it); S.rep = Math.min(100, S.rep + 1); toast("You guided the pigeon outside. The office applauds! +1 reputation."); E.npcs.filter(n => n.kind === "coworker").forEach(n => npcEmote(n, "cheer", 1.5)); award("pigeon"); save(); } });
  }
  return true;
}

/* ---------- secret: rooftop garden ---------- */
function lobbySecret() {
  if (LOC !== "lobby" || S.roof) return;
  const W = E.room.W, D = E.room.D, x = -W / 2 + 1.1, z = D / 2 - 1.4;
  const key = new THREE.Mesh(bgeo(.1, .01, .07), mat("#ffd23f", { metal: .6, rough: .3 })); key.position.set(x, .02, z); E.world.add(key);
  E.anims.push(() => { key.rotation.y += .03; });
  const it = addInter({ name: "Something shiny", verb: "Pick it up", x, z, r: 1.3, h: .3, action: () => { S.roof = S.day; save(); E.world.remove(key); it.label.remove(); E.inters = E.inters.filter(q => q !== it); giveSticker("secret"); Sfx.promo(); toast("<b>You found a keycard marked “R”!</b> A new button appeared in the elevator: the Rooftop Garden.", "gold"); } });
}
function buildRoof() {
  CUR_JOB = null; const W = 20, D = 16; E.weather = S.weather; buildRoom(W, D, "wood", "#9a7b55", "#e3efe3", { southWindows: true, noLamps: true });
  E.ceil.material = new THREE.MeshStandardMaterial({ color: lin("#d8f0ff"), transparent: true, opacity: .25, roughness: .05, depthWrite: false });
  elevator(-D / 2); addInter({ name: "Elevator", verb: "Ride the elevator", x: 0, z: -D / 2 + 1.4, r: 2, h: 3.2, action: openElevator });
  PROP.board(-6, -D / 2 + .2, 0, ["ROOFTOP GARDEN", "Breathe. Stretch. Grow something."], { w: 4.4, h: 1.4, bg: "#2f6b3a", fg: "#fff", size: 46 });
  const beds = [[-6, -1], [-6, 3.5], [6, -1], [6, 3.5]];
  beds.forEach(([x, z], i) => {
    box(group(x, z), 3, .5, 1.2, "#6b4a32", 0, 0, 0); box(group(x, z), 2.9, .06, 1.1, "#3b2a1a", 0, .5, 0); collider(x, z, 3, 1.2);
    const grown = clamp(Math.floor(((S.garden || {}).n || 0) / 2) + 1, 1, 5);
    for (let k = 0; k < 5; k++) { const h = .15 + .08 * grown + Math.random() * .1; const pl = new THREE.Mesh(new THREE.ConeGeometry(.12, h, 6), mat(["#4c9a3a", "#6bbf4a", "#3d7d2f"][k % 3])); pl.position.set(x - 1.1 + k * .55, .53 + h / 2, z); E.world.add(pl);
      if (grown >= 3) { const fl = new THREE.Mesh(sgeo(.05, 6, 6), mat(["#e84a5f", "#ffd23f", "#b48cff", "#ff8c42"][(k + i) % 4])); fl.position.set(x - 1.1 + k * .55, .55 + h, z); E.world.add(fl); } }
  });
  for (const [x, z] of [[0, 1], [0, 5]]) PROP.sofa(x, z, Math.PI, "#7a8a5a", 2.2);
  PROP.plant(-W / 2 + .8, D / 2 - .8, 1.4); PROP.plant(W / 2 - .8, D / 2 - .8, 1.4); PROP.plant(-W / 2 + .8, -D / 2 + 1.5, 1.2); PROP.plant(W / 2 - .8, -D / 2 + 1.5, 1.2);
  const watered = () => (S.garden || {}).d === S.day;
  addInter({ name: "Garden beds", verb: "Water the garden", x: -6, z: 1.2, r: 2.4, mark: () => watered() ? "" : "!", action: () => {
    if (watered()) return toast("The garden is watered for today. Come back tomorrow!");
    S.garden = { d: S.day, n: ((S.garden || {}).n || 0) + 1 }; S.burn = clamp((S.burn || 0) - 10, 0, 100); if (SH) SH.stress = Math.max(0, SH.stress - 15);
    toast(`You watered the plants. −10 burnout. Days tended: ${S.garden.n}.`); Sfx.ok(); if (S.garden.n >= 5) giveSticker("garden"); save(); } });
  addInter({ name: "Stretch spot", verb: "Do a 2-minute stretch", x: 0, z: -2.5, r: 1.8, action: () => { S.burn = clamp((S.burn || 0) - 3, 0, 100); toast("Neck rolls, shoulder shrugs, reach for the sky. You feel looser. (Real tip: stretch every hour at a desk job.)"); save(); } });
  const nm = "Iris Park"; const g = addNPC({ kind: "npc", name: nm, role: "Gardener", look: lookFor(nm), x: 6, z: 1.3, ry: Math.PI }); g.onTalk = n => npcSay(n, pick(["Plants are like careers: water them a little every day.", "This garden supplies herbs to the cafeteria.", "Not many people know about this place. Welcome!", "Fresh air and sunlight help you focus. Science says so."]), 6);
  spawnPlayer(0, -D / 2 + 2.6, 0);
}

PHONE_WIRE.ach = wireTitles;
