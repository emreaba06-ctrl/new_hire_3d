/* =====================================================================
   PLAY: hands-on job gameplay instead of quiz windows.
   Shared core (combos, grades, juice, embedded questions) plus games:
     talk   — live conversation with a mood meter (support, sales, bank, hr, retail)
     cook   — kitchen stations with timing meters (chef)
     pick   — in-world pick & pack: walk, grab, carry, deliver (warehouse)
     fixit  — troubleshoot a fake desktop (it)
   The job's real question is woven into each game when it is multiple choice;
   other task types (typing, ordering, sorting) open their normal hands-on window after.
   ===================================================================== */
const PLAY_GAMES = { support: "talk", sales: "talk", bank: "talk", hr: "talk", retail: "talk", chef: "cook", wh: "pick", it: "fixit" };
const PLAY = { active: null };
function handsOnFor(job, x) {
  const g = PLAY_GAMES[job.id]; if (!g || x.project || S.handsOn === false) return null;
  if (g === "talk" && x.desk && !/phone|call|chat/i.test(x.t.from[1])) return null; // emails stay as screens
  return g;
}
/* ---------- juice ---------- */
function popText(text, cls = "") { const el = document.createElement("div"); el.className = "pop " + cls; el.textContent = text; el.style.top = `calc(38% + ${document.querySelectorAll(".pop").length * 40}px)`; document.body.appendChild(el); setTimeout(() => el.remove(), 1400); }
function confetti(n = 40) {
  if (a11y().motion) return; const box = document.createElement("div"); box.className = "confetti"; document.body.appendChild(box);
  for (let i = 0; i < n; i++) { const p = document.createElement("i"); p.style.left = (50 + (Math.random() - .5) * 40) + "%"; p.style.background = pick(["#ffd23f", "#2a7fd4", "#5fb320", "#e74c3c", "#b48cff"]); p.style.setProperty("--dx", ((Math.random() - .5) * 600) + "px"); p.style.setProperty("--dy", (-200 - Math.random() * 300) + "px"); p.style.animationDelay = (Math.random() * .15) + "s"; box.appendChild(p); }
  setTimeout(() => box.remove(), 1600);
}
const gradeOf = s => s >= .9 ? "S" : s >= .75 ? "A" : s >= .55 ? "B" : s >= .35 ? "C" : "D";
function comboHud() { let el = $("#combo"); if (!el) { el = document.createElement("div"); el.id = "combo"; document.body.appendChild(el); } const c = SH ? SH.combo || 0 : 0; el.hidden = c < 2; el.innerHTML = `🔥 <b>${c}</b> combo · ×${(1 + Math.min(c - 1, 5) * .1).toFixed(1)} XP`; }
/* show the result card, then hand back to the shift */
function playResult(job, x, res, after) {
  const g = gradeOf(res.score), ok = res.ok;
  const ov = overlay(`<div class="panel modal result"><div class="bar" style="--blue:${job.color}">${ok ? "Task complete" : "Not quite"}</div><div class="m-body center">
    <div class="grade g${g}">${g}</div><p class="res-line">${esc(res.line || "")}</p>
    <div class="res-stats">${(res.stats || []).map(([k, v]) => `<div><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join("")}</div>
    ${x.t.lesson ? `<div class="lesson"><b>What you learned:</b> ${x.t.lesson}</div>` : ""}
    <button class="btn go big" type="button" id="prc">Continue</button></div></div>`, { sticky: true });
  Sfx[ok ? "ok" : "bad"](); if (g === "S") { confetti(60); popText("PERFECT!", "gold"); } else if (ok) confetti(24);
  $("#prc", ov).addEventListener("click", () => { ov.close(); after(); });
}
/* ---------- embedded multiple-choice moment ---------- */
function embeddedChoice(box, t, opts, done) {
  const options = shuffle(t.options.map(o => ({ t: o.t, ok: !!o.ok, fb: o.fb || "" })));
  box.innerHTML = `${opts.who ? `<div class="bubble"><b class="name">${esc(opts.who)}:</b> <span class="q"></span></div>` : `<div class="ask q"></div>`}<div class="opts">${options.map((o, i) => `<button class="opt" type="button" data-i="${i}"><span class="radio"></span><span class="ot"></span></button>`).join("")}</div><div id="ecR"></div>`;
  $(".q", box).textContent = plain(t.ask); $$(".ot", box).forEach((el, i) => el.textContent = options[i].t);
  if (opts.who) Voice.say(plain(t.ask), opts.who, 2);
  $$(".opt", box).forEach(b => b.addEventListener("click", () => { const o = options[+b.dataset.i]; $$(".opt", box).forEach((q, i) => { q.disabled = true; if (options[i].ok) q.classList.add("right"); else if (q === b) q.classList.add("wrong"); }); o.ok ? Sfx.ok() : Sfx.bad(); if (o.fb) { const f = document.createElement("div"); f.className = "warnbox" + (o.ok ? " gold" : ""); f.textContent = o.fb; $("#ecR", box).appendChild(f); } setTimeout(() => done(o.ok), o.fb ? 1600 : 700); }));
}
/* ---------- entry point from openShiftTask ---------- */
function runHandsOn(kind, job, x, finish) {
  x.playing = true; PLAY.active = { kind, x };
  const end = res => { x.playing = false; PLAY.active = null;
    const wrap = () => playResult(job, x, res, () => finish(res.ok, res.score));
    if (res.needsTask) { openTaskWindow(x.t, { color: job.color, mentor: job.mentor.name, hintCost: SH.diff.hint, doneLabel: "Finish", onFinish: ok => { res.ok = ok && res.ok !== false; res.score = (res.score + (ok ? 1 : 0)) / 2; return 0; }, after: wrap }); }
    else wrap(); };
  ({ talk: playTalk, cook: playCook, pick: playPick, fixit: playFixit })[kind](job, x, end);
}

/* ================= TALK: live conversation with a mood meter ================= */
const TALK_LINES = {
  open: [["I'm sorry you're dealing with that. Let's sort it out together.", 15], ["Okay. What's the problem?", 0], ["That's not really my job, but fine.", -20]],
  open2: [["Thanks for your patience. I'm on it right now.", 15], ["Mm-hm. Go on.", 0], ["Can you make it quick? I'm busy.", -20]],
  probe: [["Can you tell me exactly what happened, step by step?", 12], ["Did you try turning it off and on?", 2], ["You probably did something wrong.", -22]],
  close: [["Is there anything else I can help you with today?", 12], ["Okay, bye.", 0], ["Next time, read the instructions first.", -25]]
};
function playTalk(job, x, end) {
  const t = x.t, who = t.from[0].replace(/^Caller: |'/g, ""), choice = t.type === "choice" && t.options;
  let mood = x.urgent ? 35 : 55, turn = 0, taskOk = !choice, timer = null, t0 = performance.now(), best = 0;
  const turns = [pick(["open", "open2"]), choice ? "task" : "probe", "close"];
  const ov = overlay(`<div class="panel modal talk"><div class="bar" style="--blue:${job.color}">${/phone|call/i.test(t.from[1]) ? "📞 Call" : "💬 Customer"}: ${esc(who)}</div><div class="m-body">
    <div class="talk-top"><div class="talk-face" id="tf">${avatar(hashAv(who), 64)}<span id="tEmoji">😐</span></div><div style="flex:1"><div class="small">Mood</div><div class="meter mood"><i id="tMood"></i></div><div class="small">Patience</div><div class="meter sm"><i id="tPat"></i></div></div></div>
    <div id="tBody"></div></div></div>`, { sticky: true, onClose: () => clearInterval(timer) });
  const moodUI = () => { const m = clamp(mood, 0, 100); $("#tMood", ov).style.width = m + "%"; $("#tMood", ov).style.setProperty("--c", m > 66 ? "var(--go)" : m > 33 ? "var(--warn)" : "var(--bad)"); $("#tEmoji", ov).textContent = m > 80 ? "😄" : m > 60 ? "🙂" : m > 40 ? "😐" : m > 20 ? "😟" : "😡"; };
  let pat = 1; const startPatience = () => { clearInterval(timer); pat = 1; timer = setInterval(() => { pat -= .1 / (x.urgent ? 9 : 13); mood -= x.urgent ? .5 : .3; moodUI(); $("#tPat", ov).style.width = clamp(pat * 100, 0, 100) + "%"; if (pat <= 0) { clearInterval(timer); mood -= 15; popText("Too slow!", "bad"); next(); } }, 100); };
  const nudge = d => { mood = clamp(mood + d, 0, 100); moodUI(); popText(d > 0 ? `+${d} mood` : d < 0 ? `${d} mood` : "…", d > 0 ? "good" : d < 0 ? "bad" : ""); const f = $("#tf", ov); f.classList.remove("shake", "bounce"); void f.offsetWidth; f.classList.add(d < 0 ? "shake" : "bounce"); };
  const next = () => {
    const body = $("#tBody", ov); if (!body) return;
    if (turn >= turns.length || mood <= 0) {
      clearInterval(timer); const secs = Math.round((performance.now() - t0) / 1000), ok = taskOk && mood > 25;
      const score = clamp((mood / 100) * .6 + (taskOk ? .4 : 0), 0, 1); ov.close();
      return end({ ok, score, needsTask: !choice && t.type !== "choice", line: mood <= 0 ? `${who} hung up on you.` : ok ? `${who} is ${mood > 75 ? "delighted" : "satisfied"}.` : `${who} left unhappy.`, stats: [["final mood", Math.round(mood) + "%"], ["seconds", secs], ["best reply", best ? "+" + best : "none"]] });
    }
    const kind = turns[turn++];
    if (kind === "task") { startPatience(); embeddedChoice(body, t, { who }, ok => { taskOk = ok; nudge(ok ? 25 : -25); if (ok) best = Math.max(best, 25); next(); }); return; }
    const line = turn === 1 ? plain(t.msg).slice(0, 220) : kind === "probe" ? "Hmm, okay. So what do we do now?" : "Alright, I think that's it.";
    const opts = shuffle(TALK_LINES[kind]);
    body.innerHTML = `<div class="bubble"><b class="name">${esc(who.split(" ")[0])}:</b> <span class="ln"></span></div><div class="opts">${opts.map((o, i) => `<button class="opt" type="button" data-i="${i}"><span class="radio"></span><span class="ot"></span></button>`).join("")}</div>`;
    $(".ln", body).textContent = line; $$(".ot", body).forEach((el, i) => el.textContent = opts[i][0]); Voice.say(line, t.from[0], 2);
    startPatience();
    $$(".opt", body).forEach(b => b.addEventListener("click", () => { clearInterval(timer); const d = opts[+b.dataset.i][1]; nudge(d); best = Math.max(best, d); setTimeout(next, 450); }));
  };
  moodUI(); next();
}

/* ================= COOK: kitchen stations ================= */
const DISHES_K = [["Chicken stir-fry", ["chop", "grill", "season"]], ["Classic burger", ["grill", "chop", "plate"]], ["Garden salad", ["chop", "season", "plate"]], ["Pasta primavera", ["chop", "grill", "plate"]], ["Grilled salmon", ["grill", "season", "plate"]]];
const SEASON_OK = { "Chicken stir-fry": "Soy sauce", "Garden salad": "Vinaigrette", "Grilled salmon": "Lemon and dill" };
function playCook(job, x, end) {
  const t = x.t, choice = t.type === "choice" && t.options; const [dish, steps] = pick(DISHES_K);
  let i = 0, acc = [], t0 = performance.now(), raf = null;
  const ov = overlay(`<div class="panel modal cook"><div class="bar" style="--blue:${job.color}">🍳 Order up: ${esc(dish)}</div><div class="m-body">
    <div class="ticket"><b>TICKET #${100 + Math.floor(Math.random() * 900)}</b><span>${esc(dish)}</span><ol>${steps.map((s, k) => `<li id="st${k}">${({ chop: "Chop", grill: "Grill", season: "Season", plate: "Plate" })[s]}</li>`).join("")}${choice ? `<li id="stQ">Chef's check</li>` : ""}</ol></div>
    <div id="cBody"></div></div></div>`, { sticky: true, onClose: () => cancelAnimationFrame(raf) });
  const body = () => $("#cBody", ov);
  const mark = (k, a) => { const li = $("#st" + k, ov); if (li) { li.classList.add("done"); li.dataset.a = a >= .85 ? "★" : a >= .5 ? "✓" : "✗"; } };
  /* a needle sweeps a bar; hit the button when it's inside the zone */
  const meter = (title, help, hits, speed, zoneW, done) => {
    let pos = 0, dir = 1, got = [], zone = .2 + Math.random() * (.6 - zoneW);
    body().innerHTML = `<h3>${title}</h3><p class="small">${help}</p><div class="meterbar"><div class="zone" style="left:${zone * 100}%;width:${zoneW * 100}%"></div><div class="needle" id="ndl"></div></div><div class="row center"><button class="btn go big" type="button" id="hit">${hits > 1 ? "Chop!" : "Now!"}</button><span id="hits" class="small"></span></div>`;
    const loop = () => { pos += dir * speed / 60; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } const n = $("#ndl", ov); if (n) n.style.left = (pos * 100) + "%"; raf = requestAnimationFrame(loop); }; loop();
    const press = () => { const c = zone + zoneW / 2, d = Math.abs(pos - c) / (zoneW / 2); const a = d <= .35 ? 1 : d <= 1 ? .7 : Math.max(0, .4 - (d - 1) * .4); got.push(a); popText(a >= 1 ? "Perfect!" : a >= .7 ? "Good" : "Miss", a >= .7 ? "good" : "bad"); Sfx.tone(a >= .7 ? 880 : 220, .08, "triangle", .05); $("#hits", ov).textContent = `${got.length}/${hits}`; zone = .1 + Math.random() * (.8 - zoneW); const z = $(".zone", ov); if (z) z.style.left = zone * 100 + "%"; if (got.length >= hits) { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); setTimeout(() => done(got.reduce((s, v) => s + v, 0) / hits), 350); } };
    const key = e => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); press(); } };
    document.addEventListener("keydown", key); $("#hit", ov).addEventListener("click", press);
  };
  const stations = {
    chop: d => meter("🔪 Chop the vegetables", "Hit Chop (or Space) when the knife is over the green zone. 4 cuts.", 4, 1.6, .2, d),
    grill: d => meter("🔥 Grill it", "Stop the heat in the green zone: too early is raw, too late is burnt.", 1, 1.1, .16, d),
    season: d => { const want = SEASON_OK[dish] || "Salt and pepper"; const opts = shuffle([want, ...shuffle(["Soy sauce", "Vinaigrette", "Lemon and dill", "Salt and pepper", "Chocolate syrup", "Ketchup"].filter(s => s !== want)).slice(0, 3)]);
      body().innerHTML = `<h3>🧂 Season it</h3><p class="small">The ticket says: <b>${esc(dish)}</b>. Which seasoning fits?</p><div class="opts">${opts.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="radio"></span>${esc(o)}</button>`).join("")}</div>`;
      $$(".opt", body()).forEach(b => b.addEventListener("click", () => { const ok = opts[+b.dataset.k] === want; ok ? Sfx.ok() : Sfx.bad(); popText(ok ? "Tasty!" : "Hmm…", ok ? "good" : "bad"); setTimeout(() => d(ok ? 1 : .2), 400); })); },
    plate: d => { const items = shuffle(["Plate", "Main", "Side", "Garnish"]), order = ["Plate", "Main", "Side", "Garnish"]; let k = 0, err = 0;
      body().innerHTML = `<h3>🍽 Plate it</h3><p class="small">Build the plate in order: <b>${order.join(" → ")}</b></p><div class="row wrap center">${items.map(it => `<button class="btn" type="button" data-it="${it}">${it}</button>`).join("")}</div>`;
      $$("[data-it]", body()).forEach(b => b.addEventListener("click", () => { if (b.dataset.it === order[k]) { k++; b.disabled = true; Sfx.tick(); if (k === 4) { popText(err ? "Plated" : "Beautiful!", "good"); setTimeout(() => d(Math.max(.3, 1 - err * .25)), 300); } } else { err++; Sfx.bad(); b.classList.add("wrongflash"); setTimeout(() => b.classList.remove("wrongflash"), 300); } })); }
  };
  const next = () => {
    if (i < steps.length) { const k = i; stations[steps[i]](a => { acc.push(a); mark(k, a); i++; next(); }); return; }
    const finish = taskOk => { const secs = (performance.now() - t0) / 1000, cook = acc.reduce((s, v) => s + v, 0) / acc.length, speed = clamp(1.4 - secs / 45, .4, 1);
      const score = clamp(cook * .55 + speed * .15 + (taskOk ? .3 : 0), 0, 1); ov.close();
      end({ ok: taskOk && cook >= .45, score, needsTask: !choice && t.type !== "choice", line: cook >= .85 ? "The customer sends compliments to the chef!" : cook >= .45 ? "Order served." : "The plate came back to the kitchen.", stats: [["cooking", Math.round(cook * 100) + "%"], ["seconds", Math.round(secs)], ["dish", dish]] }); };
    if (choice) { const li = $("#stQ", ov); embeddedChoice(body(), t, { who: job.mentor.name.split(" ")[0] }, ok => { if (li) { li.classList.add("done"); li.dataset.a = ok ? "★" : "✗"; } finish(ok); }); }
    else finish(true);
  };
  next();
}

/* ================= PICK: walk, grab, carry, deliver (warehouse) ================= */
function playPick(job, x, end) {
  const t = x.t, choice = t.type === "choice" && t.options; const W = E.room.W;
  const lanes = [[-9, -1.05, -11], [-9, 1.05, -7], [9, -1.05, 7], [9, 1.05, 11]]; // [aisleX, side offset, shelfX]
  const picks = shuffle(lanes).slice(0, 2).map(([ax, off, sx]) => { const z = -7 + Math.random() * 8; return { ax, z, sx: ax + off * .55, got: false }; });
  const par = 40, t0 = performance.now(); let held = 0, done = false; const marks = [];
  const glow = new THREE.MeshBasicMaterial({ color: "#ffd23f" });
  picks.forEach((p, k) => { const b = new THREE.Mesh(bgeo(.45, .35, .45), mat("#c9a06a")); b.position.set(p.sx, 1.05, p.z); E.world.add(b); const ring = new THREE.Mesh(new THREE.TorusGeometry(.38, .03, 6, 24), glow); ring.rotation.x = Math.PI / 2; ring.position.set(p.ax, .03, p.z); E.world.add(ring); const arrow = new THREE.Mesh(new THREE.ConeGeometry(.12, .25, 10), glow); arrow.rotation.x = Math.PI; arrow.position.set(p.sx, 1.6, p.z); E.world.add(arrow); marks.push({ b, ring, arrow });
    E.anims.push(() => { arrow.position.y = 1.6 + Math.sin(E.t * 4 + k) * .08; });
    p.it = addInter({ name: `Pick item ${k + 1}`, verb: "Grab the box", x: p.ax, z: p.z, r: 1.3, mark: () => p.got ? "" : "!", action: () => { if (p.got || done) return; p.got = true; held++; E.world.remove(b); E.world.remove(arrow); ring.visible = false; E.inters = E.inters.filter(q => q !== p.it); p.it.label.remove(); carryBox(held); Sfx.tick(); popText(`Picked ${held}/2`, "good"); hudPick(); } }); });
  const st = group(W / 2 - 1.6, 4.2); box(st, 1.4, .85, .8, "#7d8794", 0, 0, 0); const sglow = new THREE.Mesh(new THREE.TorusGeometry(.6, .04, 6, 28), glow); sglow.rotation.x = Math.PI / 2; sglow.position.y = .02; st.add(sglow); collider(W / 2 - 1.6, 4.2, 1.4, .8);
  const pack = addInter({ name: "Packing station", verb: "Pack and ship", x: W / 2 - 1.6, z: 3.1, r: 1.5, mark: () => held >= 2 ? "!" : "", action: () => { if (done) return; if (held < 2) return toast(`Grab ${2 - held} more item${held === 1 ? "" : "s"} first. Follow the yellow markers.`); finishPick(); } });
  const hud = document.createElement("div"); hud.id = "objHud"; document.body.appendChild(hud);
  const hudPick = () => { const s = Math.round((performance.now() - t0) / 1000); hud.innerHTML = `<b>📦 Pick &amp; pack for ${esc(t.from[0])}</b><span>${held < 2 ? `Grab the boxes at the yellow markers (${held}/2)` : "Bring them to the PACKING STATION by Dock 3"}</span><span class="small">⏱ ${s}s (target ${par}s)</span>`; };
  const tick = setInterval(() => { if (!SH) { cleanup(); return; } hudPick(); }, 250); hudPick();
  toast(`<b>Pick order:</b> grab 2 boxes from the shelves and pack them at Dock 3.`);
  function cleanup() { clearInterval(tick); hud.remove(); marks.forEach(m => { E.world.remove(m.b); E.world.remove(m.ring); E.world.remove(m.arrow); }); picks.forEach(p => { if (!p.got && p.it) { E.inters = E.inters.filter(q => q !== p.it); p.it.label.remove(); } }); E.inters = E.inters.filter(q => q !== pack); pack.label.remove(); E.world.remove(st); carryBox(0); }
  function finishPick() {
    done = true; const secs = (performance.now() - t0) / 1000; cleanup(); Sfx.cash(); const speed = clamp(1.25 - secs / (par * 2), .2, 1);
    const wrap = taskOk => end({ ok: taskOk, score: clamp(speed * .6 + (taskOk ? .4 : 0), 0, 1), needsTask: !choice && t.type !== "choice", line: secs <= par ? "Shipped ahead of schedule!" : "Order shipped.", stats: [["seconds", Math.round(secs)], ["target", par + "s"], ["items", 2]] });
    if (choice) { const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">📋 Packing slip check</div><div class="m-body" id="pk"></div></div>`, { sticky: true }); embeddedChoice($("#pk", ov), t, { who: t.from[0].replace(/^Picker: /, "") }, ok => { ov.close(); wrap(ok); }); }
    else wrap(true);
  }
}
let carried = null;
function carryBox(n) {
  if (carried) { E.camera.remove(carried); carried = null; } if (!n) return;
  carried = new THREE.Group(); for (let i = 0; i < n; i++) { const b = new THREE.Mesh(bgeo(.24, .15, .2), mat("#c9a06a")); b.position.set(.18, -.42 + i * .155, -.75); carried.add(b); const tape = new THREE.Mesh(bgeo(.245, .01, .05), mat("#8a6a3a")); tape.position.set(.18, -.345 + i * .155, -.75); carried.add(tape); } E.camera.add(carried);
}

/* ================= FIXIT: troubleshoot a fake desktop (IT) ================= */
const FIXIT = [
  { sym: "My internet stopped working. The Wi-Fi icon has a red X.", app: "Network", fix: "wifi", clue: "Wi-Fi adapter: OFF" },
  { sym: "I can't print anything. It says the printer is offline.", app: "Devices", fix: "printer", clue: "Office printer: Offline (paused)" },
  { sym: "It says my account is locked after I typed my password wrong.", app: "Accounts", fix: "unlock", clue: "Account status: LOCKED (5 failed attempts)" },
  { sym: "My computer is super slow, the fan is really loud.", app: "System", fix: "endtask", clue: "CPU 99%: 'CoinMinerHelper.exe'" }
];
function playFixit(job, x, end) {
  const t = x.t, choice = t.type === "choice" && t.options, sc = pick(FIXIT), who = t.from[0];
  let clicks = 0, wrong = 0, fixed = false; const t0 = performance.now();
  const apps = { Network: [["Wi-Fi adapter", sc.fix === "wifi" ? "OFF" : "ON", "wifi"], ["Ethernet", "Disconnected", "eth"], ["VPN", "Off", "vpn"]], Devices: [["Office printer", sc.fix === "printer" ? "Offline (paused)" : "Ready", "printer"], ["Webcam", "OK", "cam"], ["Headset", "OK", "head"]],
    Accounts: [[`${who.split(" ")[0]}'s account`, sc.fix === "unlock" ? "LOCKED" : "Active", "unlock"], ["Password policy", "90 days", "pol"], ["MFA", "Enabled", "mfa"]], System: [[sc.fix === "endtask" ? "CoinMinerHelper.exe" : "Browser", sc.fix === "endtask" ? "CPU 99%" : "CPU 4%", "endtask"], ["Updates", "Up to date", "upd"], ["Disk", "62% used", "disk"]] };
  const ov = overlay(`<div class="panel modal fixit"><div class="bar" style="--blue:${job.color}">🖥 Remote desktop: ${esc(who)}'s PC</div>
    <div class="osbar"><span class="oslogo">◆ Brightline OS</span><span class="osapp" style="--ac:${job.color}">Remote Support</span></div><div class="m-body">
    <div class="bubble"><b class="name">${esc(who.split(" ")[0])}:</b> ${esc(sc.sym)}</div>
    <div class="fx-desk"><div class="fx-apps">${Object.keys(apps).map(a => `<button class="fx-app" type="button" data-a="${a}"><span>${({ Network: "📶", Devices: "🖨", Accounts: "👤", System: "⚙" })[a]}</span>${a}</button>`).join("")}</div><div class="fx-win" id="fxw"><p class="small">Open a panel to investigate. Look for anything that matches the problem.</p></div></div>
    <p class="small">Tip: investigate first, then fix. Every wrong change annoys the user.</p></div></div>`, { sticky: true });
  Voice.say(sc.sym, who, 2);
  $$(".fx-app", ov).forEach(b => b.addEventListener("click", () => { clicks++; $$(".fx-app", ov).forEach(q => q.classList.toggle("on", q === b)); const rows = apps[b.dataset.a];
    $("#fxw", ov).innerHTML = `<h4>${b.dataset.a}</h4>${rows.map(r => `<div class="fx-row"><span>${esc(r[0])}</span><b class="${r[2] === sc.fix ? "bad" : ""}">${esc(r[1])}</b><button class="btn sm" type="button" data-f="${r[2]}">${r[2] === "unlock" ? "Unlock" : r[2] === "endtask" ? "End task" : r[2] === "printer" ? "Resume" : r[2] === "wifi" ? "Turn on" : "Change"}</button></div>`).join("")}`;
    $$("[data-f]", ov).forEach(f => f.addEventListener("click", () => { if (fixed) return; if (f.dataset.f === sc.fix) { fixed = true; Sfx.ok(); popText("Fixed!", "good"); f.closest(".fx-row").querySelector("b").textContent = "✓ OK"; setTimeout(after, 700); } else { wrong++; Sfx.bad(); popText(`${who.split(" ")[0]}: "That didn't help…"`, "bad"); } })); }));
  function after() {
    const secs = (performance.now() - t0) / 1000, eff = clamp(1 - wrong * .25 - Math.max(0, clicks - 2) * .05, .2, 1);
    const wrap = taskOk => { ov.close(); end({ ok: taskOk, score: clamp(eff * .6 + (taskOk ? .4 : 0), 0, 1), needsTask: !choice && t.type !== "choice", line: wrong ? "Fixed, after a little trial and error." : "Clean fix on the first try!", stats: [["wrong changes", wrong], ["seconds", Math.round(secs)], ["problem", sc.app]] }); };
    if (choice) { $("#fxw", ov).closest(".m-body").innerHTML = `<div class="warnbox gold">✓ ${esc(sc.clue)}: fixed. Now close out the ticket:</div><div id="fxq"></div>`; embeddedChoice($("#fxq", ov), t, { who: who.split(" ")[0] }, wrap); }
    else wrap(true);
  }
}
