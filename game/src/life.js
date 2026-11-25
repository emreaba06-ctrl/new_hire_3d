/* =====================================================================
   LIFE: seasons and holidays, storms, bills and budgeting, asking for a
   raise, Employee of the Week, collectible stickers.
   ===================================================================== */

/* ---------- seasons + holidays (a 56-day year: 14 days per season) ---------- */
const SEASONS = [
  { name: "Spring", icon: "🌷", tint: "#7fc46a" }, { name: "Summer", icon: "☀️", tint: "#f2b632" },
  { name: "Fall", icon: "🍂", tint: "#d9792b" }, { name: "Winter", icon: "❄️", tint: "#9fc4e8" }];
const HOLIDAYS = {
  7: { name: "Earth Day", sticker: "earth", say: "It's Earth Day! The office is going green: recycle, unplug, and enjoy the plants." },
  18: { name: "Summer BBQ", sticker: "bbq", say: "It's the company Summer BBQ! Finish your shift and grab a burger on the house." },
  38: { name: "Halloween", sticker: "pumpkin", say: "Happy Halloween! Costumes are encouraged and there's candy at every desk." },
  52: { name: "Winter Holidays", sticker: "gift", say: "Happy holidays! There's a party after your shift and everyone gets a little gift." },
  56: { name: "New Year's Eve", sticker: "party", say: "It's the last day of the year! Set a career goal for next year in your phone." }
};
const yearDay = () => (S.day - 1) % 56 + 1;
const season = () => SEASONS[Math.floor((yearDay() - 1) / 14)];
const holiday = () => HOLIDAYS[yearDay()] || null;
const year = () => Math.floor((S.day - 1) / 56) + 1;

function decorate() {
  if (LOC === "title" || !E.room) return;
  const h = holiday(), sn = season(), W = E.room.W, D = E.room.D;
  const lights = (cols) => { for (let i = 0; i < 18; i++) { const x = -W / 2 + .3 + (W - .6) * i / 17; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: cols[i % cols.length] })); b.position.set(x, 2.95 - Math.abs(Math.sin(i * .9)) * .12, -D / 2 + .12); E.world.add(b); } };
  if (h && h.sticker === "pumpkin") { for (const [x, z] of [[-3, -D / 2 + 1.2], [3, -D / 2 + 1.2], [-W / 2 + 1, 0], [W / 2 - 1, 2]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), mat("#e8761c")); p.scale.y = .78; p.position.set(x, .17, z); E.world.add(p); const st = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .1, 6), mat("#4b6b2a")); st.position.set(x, .38, z); E.world.add(st); } lights(["#ff7a1a", "#8e44ad"]); }
  else if (h && (h.sticker === "gift" || h.sticker === "party") || sn.name === "Winter") {
    lights(["#e74c3c", "#2ecc71", "#f1c40f", "#3498db"]);
    if (h) { const tx = W / 2 - 1.6, tz = -D / 2 + 1.6; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.75 - i * .16, .7, 12), mat("#1f7a3e")); c.position.set(tx, .55 + i * .45, tz); E.world.add(c); } const star = new THREE.Mesh(new THREE.OctahedronGeometry(.13), new THREE.MeshBasicMaterial({ color: "#ffd23f" })); star.position.set(tx, 2.35, tz); E.world.add(star); E.anims.push(() => star.rotation.y += .02);
      for (let i = 0; i < 4; i++) box(group(tx - .6 + i * .4, tz + .7, i), .3, .26, .3, ["#c0392b", "#2980b9", "#f1c40f", "#8e44ad"][i], 0, 0, 0); collider(tx, tz, 1.5, 1.5); }
  }
  else if (h && h.sticker === "bbq") lights(["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff"]);
  else if (h && h.sticker === "earth") for (const [x, z] of [[-2, -D / 2 + 1], [2, -D / 2 + 1]]) PROP.plant(x, z, 1.1);
  else if (sn.name === "Fall") lights(["#d9792b", "#b5452b", "#f2b632"]);
  if (LOC === "lobby" && S.eowDay && S.day - S.eowDay < 7 && S.player) PROP.board(-W / 2 + .2, -5.5, Math.PI / 2, ["EMPLOYEE OF THE WEEK", S.player.name, `Day ${S.eowDay} · Thank you!`], { w: 2.6, h: 1.4, bg: "#7a1f2b", fg: "#ffd23f", size: 46 });
}

/* ---------- storms ---------- */
function stormTick(dt) {
  if (!S.storm || S.weather !== "rain" || !E.room || LOC === "title") return;
  E.boltT = (E.boltT ?? 8 + Math.random() * 20) - dt;
  if (E.boltT < 0) {
    E.boltT = 15 + Math.random() * 30; const base = E.hemi.intensity; const flash = a11y().motion ? .6 : 2.2;
    E.hemi.intensity = base + flash; setTimeout(() => { E.hemi.intensity = base + flash * .4; }, 90); setTimeout(() => { E.hemi.intensity = base; }, 220);
    setTimeout(thunder, 600 + Math.random() * 1400);
  }
}
function thunder() {
  if (S.muted || !Sfx.ctx) return;
  try { const c = Sfx.ctx, len = c.sampleRate * 2.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let v = 0; for (let i = 0; i < len; i++) { v = v * .985 + (Math.random() * 2 - 1) * .15; d[i] = v * Math.pow(1 - i / len, 2); }
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = "lowpass"; f.frequency.value = 260; g.gain.value = .9 * (S.musicVol ?? .5 + .3); s.connect(f).connect(g).connect(c.destination); s.start(); } catch (e) {}
}

/* ---------- ledger + weekly bills ---------- */
function ledger(label, amt) { S.ledger = (S.ledger || []).concat({ d: S.day, l: label, a: Math.round(amt) }).slice(-80); }
const BILLS = () => [["Phone plan", 25], ["Groceries", 45 + S.home * 15], ["Utilities", [0, 20, 35, 50, 70][S.home] || 0], ["Car insurance", S.car ? 20 + S.car * 10 : 0], ["Bus pass", S.car ? 0 : 15]].filter(b => b[1] > 0);
function payBills() {
  if (S.day % 7 !== 0) return null;
  const bills = BILLS(); const total = bills.reduce((s, b) => s + b[1], 0); S.money -= total; bills.forEach(b => ledger(b[0], -b[1]));
  return total;
}
PHONE.budget = () => {
  const L = (S.ledger || []).filter(e => e.d > S.day - 7); const inc = L.filter(e => e.a > 0).reduce((s, e) => s + e.a, 0), out = -L.filter(e => e.a < 0).reduce((s, e) => s + e.a, 0);
  const weekBills = BILLS().reduce((s, b) => s + b[1], 0) + HOMES[S.home].rent * 7; const goal = S.saveGoal || 0;
  return `<p><b>Burnout:</b> ${Math.round(burn())}% <span class="small">${burn() >= 70 ? "(take a day off soon!)" : burn() >= 40 ? "(getting tired)" : "(feeling fresh)"}</span></p><div class="meter sm"><i style="width:${burn()}%;--c:${burn() >= 70 ? "var(--bad)" : burn() >= 40 ? "var(--warn)" : "var(--go)"}"></i></div>
  <p><b>Last 7 days:</b> earned <b class="money">${money(inc)}</b>, spent <b>${money(out)}</b>, so you ${inc - out >= 0 ? `saved <b class="money">${money(inc - out)}</b>` : `lost <b style="color:var(--bad)">${money(out - inc)}</b>`}.</p>
  <div class="warnbox gold"><b>The 50/30/20 rule</b><br>A simple budget real people use: <b>50%</b> of your pay for needs (rent, food, bills), <b>30%</b> for wants (fun stuff, upgrades), and <b>20%</b> for savings. ${inc ? `For you that's about ${money(inc * .5)} needs, ${money(inc * .3)} wants and ${money(inc * .2)} savings this week.` : "Work a few shifts to see your numbers."}</div>
  <p><b>Weekly bills</b> (charged every 7th day, next on day ${Math.ceil(S.day / 7) * 7 + (S.day % 7 === 0 ? 7 : 0)}):</p>
  <table class="rv-table">${BILLS().map(b => `<tr><td>${b[0]}</td><td>${money(b[1])}</td></tr>`).join("")}<tr><td>Rent (${money(HOMES[S.home].rent)} × 7 nights)</td><td>${money(HOMES[S.home].rent * 7)}</td></tr><tr><td><b>Total per week</b></td><td><b>${money(weekBills)}</b></td></tr></table>
  <p><b>Savings goal:</b> ${goal ? `${money(Math.max(0, S.money))} of ${money(goal)} <div class="meter sm"><i style="width:${clamp(S.money / goal * 100, 0, 100)}%;--c:var(--go)"></i></div>` : "none yet"}</p>
  <div class="row wrap">${[500, 1500, 5000].map(g => `<button class="btn sm" type="button" data-goal="${g}">Goal: ${money(g)}</button>`).join("")}</div>
  <p class="small">Recent activity:</p><table class="rv-table">${(S.ledger || []).slice(-8).reverse().map(e => `<tr><td>Day ${e.d}</td><td>${esc(e.l)}</td><td style="color:${e.a < 0 ? "var(--bad)" : "var(--ok)"}">${e.a < 0 ? "−" : "+"}${money(Math.abs(e.a))}</td></tr>`).join("") || "<tr><td>No activity yet.</td></tr>"}</table>`;
};
PHONE_WIRE.budget = (ov, redraw) => $$("[data-goal]", ov).forEach(b => b.addEventListener("click", () => { S.saveGoal = +b.dataset.goal; save(); redraw(); }));
function checkGoal() { if (S.saveGoal && S.money >= S.saveGoal && !S.goalHit) { S.goalHit = S.saveGoal; giveSticker("piggy"); toast(`<b>Savings goal reached!</b> You saved ${money(S.saveGoal)}.`, "gold"); Sfx.promo(); } if (S.goalHit && S.saveGoal !== S.goalHit) S.goalHit = 0; }

/* ---------- ask for a raise ---------- */
function canAskRaise(js) { return js.days >= 5 && (!js.raiseAsk || S.day - js.raiseAsk >= 5) && js.raise < .3; }
function openRaise(job) {
  const js = jobState(job.id); const recent = js.best || 0;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:${job.color}">Asking ${esc(job.mentor.name)} for a raise</div><div class="m-body">
    <div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> Sure, let's talk. Why do you think you deserve a raise?</div>
    <div class="opts">${shuffle([
      ["data", `"In ${js.days} shifts I've earned up to ${recent} stars, and I've been learning new tasks. I'd like my pay to reflect that."`],
      ["need", `"My rent is really expensive and I need more money."`],
      ["threat", `"Give me a raise or I'm going to quit."`],
      ["compare", `"I heard someone else got a raise, so I should get one too."`]
    ]).map(([k, t]) => `<button class="opt" type="button" data-k="${k}"><span class="radio"></span>${esc(t)}</button>`).join("")}</div>
    <p class="small">Tip: in real life, raises go to people who show results with evidence.</p></div></div>`);
  $$("[data-k]", ov).forEach(b => b.addEventListener("click", () => {
    js.raiseAsk = S.day; const k = b.dataset.k; const strong = recent >= 4 && S.rep >= 25;
    let ok = false, msg;
    if (k === "data") { ok = strong; msg = ok ? "That's a great case. Your results speak for themselves. I'm giving you a 5% raise!" : "I like how you made your case with facts. Get a few more 4-star shifts and ask me again."; }
    else if (k === "need") msg = "I understand money is tight, but pay is based on the value of your work, not your expenses. Show me results and we'll talk.";
    else if (k === "threat") { msg = "Ultimatums don't work well here. Let's keep this professional."; S.rep = Math.max(0, S.rep - 3); }
    else msg = "I can't talk about other people's pay. Let's focus on what you've accomplished.";
    if (ok) { js.raise = Math.min(.3, (js.raise || 0) + .05); giveSticker("raise"); Sfx.promo(); } else Sfx.bad();
    $(".m-body", ov).innerHTML = `<div class="bubble"><b class="name">${esc(job.mentor.name.split(" ")[0])}:</b> ${esc(msg)}</div>
      <div class="lesson"><b>How to ask for a raise for real:</b> keep a list of your wins with numbers, research the typical pay for your job, pick a good time (like after a big success), and ask calmly. Never use threats or compare yourself to coworkers.</div>
      <button class="btn go" type="button" id="rd">Okay</button>`;
    Voice.say(msg, job.mentor.name, 2); save();
    $("#rd", ov).addEventListener("click", () => ov.close());
  }));
}

/* ---------- Employee of the Week ---------- */
function weekStars(st) { S.wk = S.wk && S.wk.w === Math.ceil(S.day / 7) ? S.wk : { w: Math.ceil(S.day / 7), s: [] }; S.wk.s.push(st); }
function employeeOfWeek() {
  if (S.day % 7 !== 0 || !S.wk || S.wk.w !== Math.ceil(S.day / 7)) return false;
  const s = S.wk.s, avg = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
  if (s.length >= 3 && avg >= 4) { S.eow = (S.eow || 0) + 1; S.eowDay = S.day; S.money += 150; ledger("Employee of the Week bonus", 150); giveSticker("star"); if (S.eow >= 1) award("eow"); return true; }
  return false;
}

/* ---------- stickers ---------- */
const STICKERS = {
  first: ["🎫", "First Shift", "Work your first shift."], star: ["🌟", "Employee of the Week", "Average 4+ stars over a week (3+ shifts)."],
  five: ["⭐", "Five Stars", "Get a 5-star shift."], raise: ["💸", "Got a Raise", "Win a raise by making your case."],
  piggy: ["🐷", "Saver", "Reach a savings goal."], lunch: ["🍱", "Lunch Buddy", "Eat in the cafeteria."],
  photo: ["📸", "Shutterbug", "Save a photo in photo mode."], storm: ["⛈️", "Storm Chaser", "Work during a thunderstorm."],
  earth: ["🌍", "Earth Day", "Work on Earth Day."], bbq: ["🍔", "BBQ Day", "Work on the Summer BBQ."],
  pumpkin: ["🎃", "Spooky Shift", "Work on Halloween."], gift: ["🎁", "Holiday Spirit", "Work during the Winter Holidays."],
  party: ["🎉", "New Year", "Work on New Year's Eve."], depts5: ["🏢", "Explorer", "Work in 5 different departments."],
  depts10: ["🗺️", "Jack of All Trades", "Work in 10 different departments."], exam: ["🎓", "Exam Ace", "Pass a practice exam."],
  friend: ["🤝", "Best Friends", "Max out a friendship."], night: ["🌙", "Night Owl", "Play on day 30 or later."], secret: ["🗝️", "Secret Finder", "Find the hidden keycard."], garden: ["🌻", "Green Thumb", "Tend the rooftop garden 5 times."], phish: ["🎣", "Phish Finder", "Get 10/10 in Inbox Defender."], book: ["📖", "Storyteller", "Finish the Brightline Story."]
};
function giveSticker(id) { S.stickers = S.stickers && typeof S.stickers === "object" ? S.stickers : {}; if (S.stickers[id] || !STICKERS[id]) return; S.stickers[id] = S.day; toast(`<b>New sticker!</b> ${STICKERS[id][0]} ${esc(STICKERS[id][1])}`, "gold"); Sfx.ok(); save(); }
PHONE.stickers = () => { const have = S.stickers || {}; const n = Object.keys(have).length;
  return `<p>${n} of ${Object.keys(STICKERS).length} stickers collected.</p><div class="stickers">${Object.entries(STICKERS).map(([k, [e, nm, how]]) => `<div class="stk ${have[k] ? "got" : ""}" title="${esc(how)}"><span>${have[k] ? e : "?"}</span><b>${have[k] ? esc(nm) : "Locked"}</b><small>${esc(how)}</small></div>`).join("")}</div>`; };

/* ---------- hooks ---------- */
function afterShift(job, st, pay, sentHome) {
  ledger(`${job.dept} shift`, pay); weekStars(st);
  giveSticker("first"); if (st === 5) giveSticker("five");
  const worked = Object.values(S.jobs).filter(j => j.days > 0).length; if (worked >= 5) giveSticker("depts5"); if (worked >= 10) giveSticker("depts10");
  const h = holiday(); if (h && !sentHome) { giveSticker(h.sticker); if (h.sticker === "bbq" || h.sticker === "gift" || h.sticker === "party") { S.money += 50; ledger(h.name + " party gift", 50); S.partyPending = S.day; setTimeout(() => toast(`<b>${h.name} party!</b> Everyone got a $50 gift card. There's a party in the cafeteria tonight!`, "gold"), 2500); } }
  if (S.storm && S.weather === "rain") giveSticker("storm");
  if (Object.values(S.friends).some(v => v >= 5)) giveSticker("friend");
  if (S.exams && Object.keys(S.exams).length) giveSticker("exam");
  if (S.day >= 30) giveSticker("night");
  checkGoal();
}
function onNewDay() {
  S.storm = S.weather === "rain" && Math.random() < .4;
  const bills = payBills(); const eow = employeeOfWeek();
  setTimeout(() => {
    if (bills) toast(`Weekly bills paid: −${money(bills)}. See the Budget tab in your phone.`);
    if (eow) { toast(`<b>You're Employee of the Week!</b> +$150 bonus. Your photo is up in the lobby.`, "gold"); Sfx.promo(); }
    const h = holiday(); if (h) { toast(`<b>${season().icon} ${h.name}!</b> ${h.say}`, "gold"); Voice.say(h.say, "Narrator", 1); }
    else if (yearDay() % 14 === 1) toast(`<b>${season().icon} ${season().name} is here!</b>`);
    if (S.storm) toast("⛈️ Thunderstorms today. Stay dry!");
  }, 2200);
  checkGoal();
}
