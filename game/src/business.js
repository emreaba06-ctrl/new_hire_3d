/* =====================================================================
   BUSINESS: start your own company and hire a team (late game).
   Teaches revenue, costs, profit, pricing and payroll.
   ===================================================================== */
const BIZ_TYPES = [
  { id: "it", name: "Tech Support Co.", cost: 2000, base: 140, rent: 40, desc: "Fix computers for small businesses.", dept: ["it", "cyber", "dev", "support"] },
  { id: "cafe", name: "Corner Café", cost: 2500, base: 170, rent: 60, desc: "Coffee, pastries and good vibes.", dept: ["chef", "retail", "sales", "support"] },
  { id: "shop", name: "Online Store", cost: 1500, base: 110, rent: 20, desc: "Sell products online and ship them out.", dept: ["logi", "wh", "mkt", "data"] }
];
const BIZ_DECISIONS = [
  { q: "A supplier raised prices 10%. What do you do?", a: [["Raise your prices a little and explain why to customers.", 1.05, "Small, honest price increases usually keep customers."], ["Keep prices the same and eat the cost.", .95, "Your profit margin shrinks. Fine short-term, risky long-term."], ["Double your prices.", .7, "Customers leave. Big jumps scare people off."]] },
  { q: "A customer left a bad online review. How do you respond?", a: [["Reply politely, apologize and offer to make it right.", 1.08, "Other customers see you care. Reviews matter!"], ["Ignore it.", .98, "Unanswered bad reviews quietly cost sales."], ["Argue with them publicly.", .8, "Arguing in public hurts your reputation fast."]] },
  { q: "You have some extra cash this week. Where should it go?", a: [["Save it as an emergency fund.", 1, "Smart. Most small businesses fail from running out of cash."], ["Spend it on targeted ads.", 1.06, "Good marketing can bring in new customers."], ["Buy a fancy office chair for yourself.", .97, "Nice chair, but it doesn't make money."]] },
  { q: "An employee asks for a day off for a family event.", a: [["Say yes and plan coverage.", 1.03, "Happy employees work harder and stay longer."], ["Say no, it's a busy week.", .96, "Morale drops. People remember how they're treated."]] },
  { q: "A big client wants a 30% discount for a large order.", a: [["Negotiate to 10–15% for the bigger order.", 1.07, "Volume discounts work when you still make a profit."], ["Accept 30% right away.", .94, "You might lose money on every sale."], ["Refuse any discount.", .99, "You keep your margin, but maybe lose the deal."]] }
];
const biz = () => S.biz && S.biz.type ? S.biz : null;
const bizType = () => biz() && BIZ_TYPES.find(t => t.id === S.biz.type);
const canStartBiz = () => Object.values(S.jobs).some(j => lvl(j.xp) >= 3) || S.money >= 3000;
function bizTeamSkill() { return (biz().team || []).reduce((s, m) => s + m.skill, 0); }
function bizDay() {
  const b = biz(); if (!b || b.last === S.day) return null; b.last = S.day;
  const T = bizType(); const team = b.team || []; const mult = b.mult || 1;
  const revenue = Math.round((T.base + bizTeamSkill() * 45) * mult * (0.85 + Math.random() * .3) * (1 + Math.min(.5, b.days * .01)));
  const payroll = team.reduce((s, m) => s + m.pay, 0), rent = T.rent; const profit = revenue - payroll - rent;
  b.days = (b.days || 0) + 1; b.total = (b.total || 0) + profit; b.hist = (b.hist || []).concat({ d: S.day, r: revenue, c: payroll + rent, p: profit }).slice(-14);
  b.mult = 1 + (mult - 1) * .6; // decisions fade over time
  S.money += profit; ledger(`${T.name} profit`, profit);
  if (b.total >= 2000) award("tycoon");
  return { revenue, payroll, rent, profit };
}
function openStartBiz() {
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#1a7f37">Start a business</div><div class="m-body">
    <p>Pick a business. You pay the startup cost once, then earn profit every day (revenue minus rent and payroll). Hire friends from work to grow it.</p>
    <div class="shop">${BIZ_TYPES.map(t => `<div class="item"><b>${t.name}</b><span>${t.desc}</span><span class="small">Startup ${money(t.cost)} · rent ${money(t.rent)}/day · about ${money(t.base)}/day revenue to start</span><button class="btn sm go" type="button" data-b="${t.id}">Open for ${money(t.cost)}</button></div>`).join("")}</div>
    <p class="small">Real tip: most businesses take months to make a profit. Keep savings for emergencies before you start.</p>
    <button class="btn grey" type="button" id="bx">Not yet</button></div></div>`);
  $$("[data-b]", ov).forEach(b => b.addEventListener("click", () => { const T = BIZ_TYPES.find(t => t.id === b.dataset.b); if (S.money < T.cost) { toast("Not enough money yet."); Sfx.bad(); return; } S.money -= T.cost; ledger(`Started ${T.name}`, -T.cost); S.biz = { type: T.id, since: S.day, team: [], days: 0, total: 0, mult: 1, hist: [] }; save(); hud(); Sfx.promo(); toast(`<b>${T.name} is open for business!</b> Check the Business tab in your phone.`, "gold"); award("founder"); ov.close(); openPhone("biz"); }));
  $("#bx", ov).addEventListener("click", () => ov.close());
}
PHONE.biz = () => {
  const b = biz();
  if (!b) return `<p>Dream of being your own boss? ${canStartBiz() ? "You're ready to start a business!" : "Reach Senior level (level 3) in any department, or save $3,000, to unlock this."}</p>${canStartBiz() ? `<button class="btn go" type="button" id="bzStart">Start a business</button>` : ""}<div class="lesson"><b>Business basics:</b> <b>Revenue</b> is money coming in. <b>Costs</b> are rent, wages and supplies. <b>Profit = revenue − costs.</b> If costs are bigger than revenue, you're losing money.</div>`;
  const T = bizType(), last = (b.hist || []).slice(-1)[0];
  const friends = Object.entries(S.friends).filter(([n, h]) => h >= 3 && !(b.team || []).some(m => m.name === n)).slice(0, 6);
  return `<p><b>${T.name}</b> · open ${b.days} days · total profit <b class="${b.total >= 0 ? "money" : ""}">${money(b.total)}</b></p>
    ${last ? `<table class="rv-table"><tr><td>Yesterday's revenue</td><td>${money(last.r)}</td></tr><tr><td>Costs (rent + payroll)</td><td>−${money(last.c)}</td></tr><tr><td><b>Profit</b></td><td><b style="color:${last.p >= 0 ? "var(--ok)" : "var(--bad)"}">${money(last.p)}</b></td></tr></table>` : "<p class=\"small\">Your first daily report arrives tomorrow morning.</p>"}
    <div class="bars">${(b.hist || []).map(h => `<i title="Day ${h.d}: ${money(h.p)}" style="height:${clamp(Math.abs(h.p) / 4, 4, 60)}px;background:${h.p >= 0 ? "var(--go)" : "var(--bad)"}"></i>`).join("")}</div>
    <h4>Your team (${(b.team || []).length}/5)</h4>
    ${(b.team || []).length ? `<table class="rv-table">${b.team.map((m, i) => `<tr><td>${esc(m.name)}</td><td>Skill ${"★".repeat(m.skill)}</td><td>${money(m.pay)}/day</td><td><button class="btn sm grey" type="button" data-fire="${i}">Let go</button></td></tr>`).join("")}</table>` : "<p class=\"small\">No employees yet. It's just you!</p>"}
    <h4>Hire a friend from work</h4>
    ${(b.team || []).length >= 5 ? "<p class=\"small\">Your team is full.</p>" : friends.length ? `<div class="shop">${friends.map(([n, h]) => { const sk = clamp(Math.ceil(h / 2), 1, 5), pay = 30 + sk * 18; return `<div class="item"><b>${esc(n)}</b><span>Friendship ${"♥".repeat(Math.min(5, h))}</span><span class="small">Skill ${"★".repeat(sk)} · wants ${money(pay)}/day</span><button class="btn sm go" type="button" data-hire="${esc(n)}|${sk}|${pay}">Hire</button></div>`; }).join("")}</div>` : "<p class=\"small\">Make friends at work (chat with coworkers, 3+ hearts) and they'll want to join you.</p>"}
    <div class="lesson">Each employee adds revenue based on their skill, but costs a daily wage. Hire when the extra revenue is bigger than the wage. That's how real owners think!</div>`;
};
PHONE_WIRE.biz = (ov, redraw) => {
  const s = $("#bzStart", ov); if (s) s.addEventListener("click", () => { ov.close(); openStartBiz(); });
  $$("[data-hire]", ov).forEach(b => b.addEventListener("click", () => { const [name, sk, pay] = b.dataset.hire.split("|"); S.biz.team = (S.biz.team || []).concat({ name, skill: +sk, pay: +pay, since: S.day }); save(); Sfx.cash(); toast(`${esc(name)} joined your team!`, "gold"); if (S.biz.team.length >= 3) award("boss"); redraw(); }));
  $$("[data-fire]", ov).forEach(b => b.addEventListener("click", () => { const m = S.biz.team[+b.dataset.fire]; S.biz.team.splice(+b.dataset.fire, 1); if (m) S.friends[m.name] = Math.max(0, (S.friends[m.name] || 0) - 2); save(); toast(`You let ${esc(m.name)} go. They understood, but it stung a little.`); redraw(); }));
};
function bizMorning() {
  const r = bizDay(); if (!r) return;
  setTimeout(() => {
    toast(`<b>${esc(bizType().name)}</b> yesterday: ${money(r.revenue)} revenue − ${money(r.payroll + r.rent)} costs = <b>${r.profit >= 0 ? "+" : ""}${money(r.profit)}</b>`, r.profit >= 0 ? "gold" : "red");
    if (Math.random() < .5) {
      const d = pick(BIZ_DECISIONS);
      const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#1a7f37">Business decision</div><div class="m-body"><p></p><div class="opts">${d.a.map((a, i) => `<button class="opt" type="button" data-i="${i}"><span class="radio"></span><span class="ct"></span></button>`).join("")}</div></div></div>`, { sticky: true });
      $("p", ov).textContent = d.q; $$(".ct", ov).forEach((el, i) => el.textContent = d.a[i][0]);
      $$("[data-i]", ov).forEach(b => b.addEventListener("click", () => { const a = d.a[+b.dataset.i]; S.biz.mult = (S.biz.mult || 1) * a[1]; save();
        $(".m-body", ov).innerHTML = `<div class="lesson">${esc(a[2])}</div><p class="small">${a[1] > 1 ? "Sales should go up for a few days." : a[1] < 1 ? "Sales may dip for a few days." : "No big change."}</p><button class="btn go" type="button" id="bd">Okay</button>`; $("#bd", ov).addEventListener("click", () => ov.close()); }));
    }
  }, 4200);
}
