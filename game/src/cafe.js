/* =====================================================================
   COMPANY CAFETERIA + DAILY SCHEDULE
   12:00 is lunch. Everyone from every department heads to the cafeteria
   (via the elevator). Your shift pauses while you're there. A daily menu
   changes every day; food restores energy and lowers stress.
   ===================================================================== */
const SCHEDULE = [[0, "9:00", "Morning stand-up"], [180, "12:00", "Lunch in the Cafeteria"], [225, "12:45", "Back to work"], [360, "15:00", "Coffee break"], [480, "17:00", "Clock out"]];
const DISHES = [
  { name: "Grilled chicken salad", price: 9, energy: 25, stress: 10, healthy: true },
  { name: "Veggie stir-fry", price: 8, energy: 25, stress: 10, healthy: true },
  { name: "Turkey and avocado wrap", price: 8, energy: 22, stress: 8, healthy: true },
  { name: "Lentil soup and bread", price: 6, energy: 20, stress: 12, healthy: true },
  { name: "Salmon rice bowl", price: 11, energy: 30, stress: 12, healthy: true },
  { name: "Cheeseburger and fries", price: 10, energy: 30, stress: 5, healthy: false },
  { name: "Pepperoni pizza slice", price: 5, energy: 18, stress: 8, healthy: false },
  { name: "Mac and cheese", price: 7, energy: 22, stress: 10, healthy: false },
  { name: "Taco Tuesday plate", price: 8, energy: 25, stress: 12, healthy: false },
  { name: "Pasta primavera", price: 9, energy: 25, stress: 10, healthy: true }
];
const todaysMenu = () => { const r = seeded("menu" + S.day); const a = DISHES.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 3); };
const isLunch = () => SH && SH.minute >= 180 && SH.minute < 225;
const CAFE_TALK = [
  "Lunch is the best meeting of the day.", "Have you tried the soup? It's secretly the best thing here.", "I always sit by the window. Free vitamin D.",
  "Pro tip: eat something green. You'll crash less at 3 PM.", "I heard the CEO eats here on Fridays.", "My team is crushing it this week.",
  "Taking real breaks makes you better at your job. Science says so.", "I switched departments last year. Best decision ever."
];

function buildCafe() {
  CUR_JOB = null; E.partyOn = false; const W = 24, D = 18; buildRoom(W, D, "wood", "#b07a4a", "#f3ead8");
  elevator(-D / 2); addInter({ name: "Elevator", verb: SH ? "Elevator (back to work)" : "Ride the elevator", x: 0, z: -D / 2 + 1.4, r: 2, h: 3.2, action: openElevator });
  // serving line on the left of the elevator, menu above it
  PROP.kitchen(-7, -D / 2 + .5, 0, 5);
  const menu = todaysMenu();
  PROP.board(-7, -D / 2 + .2, 0, ["TODAY'S MENU", ...menu.map(d => `${d.name}  $${d.price}`)], { w: 4.6, h: 2, bg: "#2a2d33", fg: "#ffd23f", size: 46 });
  PROP.board(7, -D / 2 + .2, 0, ["DAILY SCHEDULE", ...SCHEDULE.map(s => `${s[1]}  ${s[2]}`)], { w: 4.6, h: 2.2, bg: "#1b5ea6", fg: "#fff", size: 40 });
  PROP.cooler(W / 2 - .6, -D / 2 + 1.5); PROP.coffee(W / 2 - .7, -D / 2 + 3.4, -Math.PI / 2);
  PROP.plant(-W / 2 + .8, D / 2 - .8); PROP.plant(W / 2 - .8, D / 2 - .8); PROP.plant(-W / 2 + .8, -D / 2 + 1.6);
  const cook = addNPC({ kind: "npc", name: "Rosa Martinez", role: "Cafeteria", look: lookFor("Rosa Martinez"), x: -7, z: -D / 2 + 1.5, ry: 0, alwaysLabel: true });
  cook.onTalk = () => openMenu(menu);
  // long tables + diners from every department
  const tables = []; for (const x of [-7, 0, 7]) for (const z of [-1.5, 4]) { cafeTable(x, z); tables.push([x, z]); }
  const seats = []; tables.forEach(([x, z]) => { for (let i = 0; i < 3; i++) { const px = x - 1.2 + i * 1.2; seats.push([px, z - .78, 0], [px, z + .78, Math.PI]); } });
  seats.forEach(([x, z, ry]) => PROP.fm("Chair_2", x, z, ry, { collide: false }) || box(group(x, z, ry), .45, .46, .45, "#2f4a6d", 0, 0, 0));
  const r = seeded("cafe" + S.day); const order = seats.map((s, i) => [r(), s]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const busy = isLunch(); const n = busy ? 18 : 5; const used = new Set();
  for (let i = 0; i < n && i < order.length; i++) {
    const job = JOBS[Math.floor(r() * JOBS.length)]; let nm = i < 3 && busy ? job.mentor.name : `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    if (used.has(nm)) continue; used.add(nm);
    const [x, z, ry] = order[i];
    const p = addNPC({ kind: "npc", name: nm, role: job.dept, look: lookFor(nm), x, z, ry, sit: true });
    p.mode = p.home.mode = "sit";
    p.onTalk = who => cafeChat(who, job);
  }
  furnish("training", W, D); styleCafe();
  spawnPlayer(0, -D / 2 + 2.6, 0);
  setTimeout(() => { if (LOC !== "cafe") return; if (busy) npcSay(cook, "Lunch is served! Come grab a tray.", 5); else if (!E.partyOn) toast("The cafeteria is quiet right now. The lunch rush is at 12:00 during your shift."); }, 900);
}

function cafeTable(x, z) {
  const g = group(x, z, 0); const top = "#c8a27a";
  box(g, 3.6, .06, 1.1, top, 0, .72, 0, { m: { roughness: .5 } }); box(g, 3.66, .03, 1.16, "#9b7652", 0, .7, 0);
  for (const sx of [-1.6, 1.6]) for (const sz of [-.42, .42]) box(g, .07, .7, .07, "#5b5f66", sx, 0, sz);
  // trays and food
  const r = seeded("tbl" + x + z + S.day);
  for (let i = 0; i < 3; i++) for (const sz of [-.3, .3]) if (r() < .7) { const px = -1.2 + i * 1.2; box(g, .42, .02, .3, pick(["#e46b3c", "#3c8de4", "#55b06a"]), px, .75, sz); const plate = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .02, 16), mat("#f6f6f2")); plate.position.set(px - .05, .77, sz); g.add(plate); const food = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), mat(pick(["#c9852d", "#7fb24a", "#d8b45a", "#b5452b"]))); food.scale.y = .5; food.position.set(px - .05, .79, sz); g.add(food); }
  collider(x, z, 3.6, 1.1);
}

function cafeChat(n, job) {
  const k = "cafe:" + n.name + ":" + S.day; const first = !S.talked[k];
  const t = job.tasks[Math.floor(Math.random() * job.tasks.length)];
  const line = Math.random() < .5 && t && t.lesson ? `I work in ${job.dept}. Something I learned: ${t.lesson.split(". ")[0]}.` : pick(CAFE_TALK);
  npcSay(n, line, 7);
  if (first) { S.talked[k] = 1; S.friends[n.name] = (S.friends[n.name] || 0) + 1; if (SH) SH.stress = Math.max(0, SH.stress - 5); toast(`You had a nice chat with ${esc(n.name.split(" ")[0])}. +1 friendship${SH ? ", −5 stress" : ""}.`); save(); }
}

function openMenu(menu) {
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#c0392b">Cafeteria: today's menu</div><div class="m-body">
    <div class="bubble"><b class="name">Rosa:</b> ${isLunch() ? "What can I get you, hon?" : "Kitchen's open for snacks. The full lunch is at noon."}</div>
    <div class="menu">${menu.map((d, i) => `<button class="item" type="button" data-i="${i}"><b>${esc(d.name)}</b><span class="small">+${d.energy} energy · −${d.stress} stress${d.healthy ? " · 🥗 healthy choice" : ""}</span><span class="chip">${money(d.price)}</span></button>`).join("")}
      <button class="item" type="button" data-i="w"><b>Glass of water</b><span class="small">+5 energy. Staying hydrated helps you focus.</span><span class="chip">Free</span></button></div>
    <p class="small">Healthy meals keep your energy steady through the afternoon. Heavy meals give a quick boost, then a slump.</p>
    <button class="btn grey" type="button" id="mx">Maybe later</button></div></div>`);
  Voice.say(isLunch() ? "What can I get you, hon?" : "Kitchen's open for snacks. The full lunch is at noon.", "Rosa Martinez", 2);
  $$("[data-i]", ov).forEach(b => b.addEventListener("click", () => {
    const d = b.dataset.i === "w" ? { name: "water", price: 0, energy: 5, stress: 0, healthy: true } : menu[+b.dataset.i];
    if (S.money < d.price) { toast("Not enough money for that.", "red"); Sfx.bad(); return; }
    if (d.price) giveSticker("lunch"); if (d.price) ledger("Lunch: " + d.name, -d.price);
    S.money -= d.price; S.stats.meals = (S.stats.meals || 0) + 1; if (d.healthy && d.price) S.stats.healthy = (S.stats.healthy || 0) + 1;
    if (SH) { SH.energy = Math.min(100, SH.energy + d.energy); SH.stress = Math.max(0, SH.stress - d.stress); if (d.price) SH.ate = d.healthy ? "healthy" : "heavy"; }
    Sfx.cash(); toast(`Enjoyed the ${esc(d.name)}.${SH ? ` +${d.energy} energy.` : ""}`); ov.close(); save(); hud();
    if ((S.stats.healthy || 0) >= 5 && !S.ach.salad) award("salad");
  }));
  $("#mx", ov).addEventListener("click", () => ov.close());
}

/* called from the shift timer every frame */
function lunchCheck() {
  if (!SH) return;
  if (SH.minute >= 180 && !SH.lunchAnn) {
    SH.lunchAnn = true; Sfx.tone(784, .2, "sine", .05); Sfx.tone(988, .3, "sine", .05, .2);
    const n = $("#notif"); $("#notifBody").innerHTML = `<b>${SH.night ? "Midnight" : "12:00"} lunch break!</b> Take the elevator to the Cafeteria. Your shift pauses while you eat.`; n.classList.add("show"); setTimeout(() => n.classList.remove("show"), 5000);
    if (E.F && E.F.mentor) npcSay(E.F.mentor, "Lunch time! Go grab something at the cafeteria.", 5);
  }
  if (SH.minute >= 225 && !SH.lunchDone) {
    SH.lunchDone = true;
    if (!SH.ate) { SH.energy = Math.max(0, SH.energy - 15); toast("You skipped lunch. −15 energy. Your body needs fuel to think!", "red"); }
    else if (SH.ate === "heavy") { SH.energy = Math.max(0, SH.energy - 8); toast("That heavy lunch is making you sleepy. −8 energy."); }
  }
}

/* elevator from/to the cafeteria during a shift */
function canGoToLunch() {
  if (!SH) return true;
  if (!isLunch()) return false;
  return !SH.list.some(x => x.state === "active" && !x.desk);
}
function goCafe() {
  if (SH) SH.wasMinute = SH.minute;
  goLocation("cafe", { fromElevator: true, text: "Cafeteria" });
}
function backFromLunch() {
  const job = SH.job; SH.minute = Math.max(SH.minute, 225); SH.spot = {};
  lunchCheck();
  goLocation("floor", { job: job.id, text: `Floor ${job.floor}: ${job.dept}`, after: () => { if (SH && SH.deskPos === undefined) SH.deskPos = E.F.deskPos; if (SH) { SH.deskPos = E.F.deskPos; SH.deskInter = E.inters.find(i => i.name === "Your desk"); } } });
}
