/* =====================================================================
   PLAY 2: hands-on games for the remaining departments.
     spot  — find every problem in a list (cyber logs, invoices, data, code)
     match — pair items with the right partner (marketing, management)
     seq   — put steps in the right order (logistics routes, hospital triage)
   ===================================================================== */
Object.assign(PLAY_GAMES, { cyber: "spot", acct: "spot", data: "spot", dev: "spot", mkt: "match", mgmt: "match", logi: "seq", med: "seq" });

const SPOT_SETS = {
  cyber: { title: "🛡 Threat hunt: login log", help: "Click every suspicious line. There are", rows: () => shuffle([
    ["09:02  alex.r   login OK    office-wifi", 0], ["09:05  mia.t    login OK    office-wifi", 0], ["03:14  ceo      login OK    unknown device (Russia)", 1],
    ["09:10  admin    20 FAILED logins in 60s", 1], ["09:12  sam.k    password changed", 0], ["09:15  guest    downloaded payroll.xlsx", 1],
    ["09:20  jo.p     login OK    VPN", 0], ["09:21  printer  firmware check OK", 0], ["02:50  backup   copied 40GB to unknown-server.biz", 1]]),
    why: "Red flags: logins at odd hours from strange places, many failed attempts in a row, guests touching sensitive files, and data sent to unknown servers." },
  acct: { title: "🧾 Audit the invoices", help: "Click every invoice with a problem. There are", rows: () => shuffle([
    ["#1041  Office Depot   $240.00   approved", 0], ["#1042  SteelCorp      $8,900.00  approved", 0], ["#1042  SteelCorp      $8,900.00  approved (again)", 1],
    ["#1043  CleanCo        $1,200 · 3 × $400 = $1,500", 1], ["#1044  PaperPlus      $95.50    approved", 0], ["#1045  Unknown vendor $4,999   no PO number", 1],
    ["#1046  Coffee Supply  $310.00   approved", 0], ["#1047  WebHost        $59.00    approved", 0]]),
    why: "Classic accounting problems: duplicate payments, math that doesn't add up, and payments to unknown vendors without a purchase order." },
  data: { title: "📊 Clean the dataset", help: "Click every row that looks wrong. There are", rows: () => shuffle([
    ["Store 12 · Mon · 412 sales", 0], ["Store 12 · Tue · 398 sales", 0], ["Store 12 · Wed · 40,100 sales", 1], ["Store 12 · Thu · -15 sales", 1],
    ["Store 12 · Fri · 455 sales", 0], ["Store 12 · Sat · (blank)", 1], ["Store 12 · Sun · 389 sales", 0], ["Store 12 · Fri · 455 sales (duplicate row)", 1]]),
    why: "Before analyzing, clean the data: outliers that are probably typos, impossible values (negative sales), missing values and duplicate rows." },
  dev: { title: "🐞 Code review", help: "Click every line with a bug. There are", rows: () => shuffle([
    ["let total = 0;", 0], ["for (let i = 0; i <= items.length; i++) {", 1], ["  total += items[i].price;", 0], ["}", 0],
    ["if (user.age = 18) { allow(); }", 1], ["const tax = total * 0.08;", 0], ["return totl + tax;", 1], ["// TODO: add tests", 0]]),
    why: "Common bugs: off-by-one loops (<= instead of <), using = instead of === in comparisons, and typos in variable names." }
};
function playSpot(job, x, end) {
  const set = SPOT_SETS[job.id], rows = set.rows(), need = rows.filter(r => r[1]).length; let found = 0, wrong = 0; const t0 = performance.now();
  const ov = overlay(`<div class="panel modal spot"><div class="bar" style="--blue:${job.color}">${set.title}</div><div class="m-body">
    <p class="small">${set.help} <b>${need}</b>. Wrong clicks cost points.</p><div class="spot-list">${rows.map((r, i) => `<button class="spot-row" type="button" data-i="${i}"></button>`).join("")}</div>
    <div class="row"><span id="spF" class="small">Found 0/${need}</span><span style="flex:1"></span><button class="btn go" type="button" id="spD">Done</button></div></div></div>`, { sticky: true });
  $$(".spot-row", ov).forEach((b, i) => { b.textContent = rows[i][0]; b.addEventListener("click", () => { if (b.disabled) return; b.disabled = true; if (rows[i][1]) { found++; b.classList.add("hit"); Sfx.ok(); popText("Found one!", "good"); } else { wrong++; b.classList.add("miss"); Sfx.bad(); popText("That one's fine", "bad"); } $("#spF", ov).textContent = `Found ${found}/${need}`; if (found === need) setTimeout(finish, 500); }); });
  $("#spD", ov).addEventListener("click", finish);
  let done = false;
  function finish() { if (done) return; done = true; $$(".spot-row", ov).forEach((b, i) => { if (rows[i][1] && !b.classList.contains("hit")) b.classList.add("missed"); });
    const acc = clamp(found / need - wrong * .15, 0, 1), secs = (performance.now() - t0) / 1000;
    const body = $(".m-body", ov); const why = document.createElement("div"); why.className = "lesson"; why.textContent = set.why; body.appendChild(why);
    const after = taskOk => { ov.close(); end({ ok: taskOk && acc >= .5, score: clamp(acc * .6 + (taskOk ? .4 : 0), 0, 1), needsTask: x.t.type !== "choice", line: acc >= .9 ? "Nothing gets past you!" : acc >= .5 ? "Most issues caught." : "Several problems slipped through.", stats: [["found", `${found}/${need}`], ["wrong clicks", wrong], ["seconds", Math.round(secs)]] }); };
    setTimeout(() => { if (x.t.type === "choice") { $$(".spot-list, .seq-list, .match-grid", ov).forEach(el => el.hidden = true); const q = document.createElement("div"); body.appendChild(q); q.scrollIntoView({ block: "nearest" }); embeddedChoice(q, x.t, { who: x.t.from[0] }, after); } else after(true); }, 900); }
}

const MATCH_SETS = {
  mkt: { title: "🎯 Match each audience to the best channel", pairs: [["Teenagers", "Short-video app"], ["Busy parents", "Email newsletter"], ["Business buyers", "Professional network"], ["Local neighbors", "Community flyers"]], why: "Great marketing reaches people where they already spend their time." },
  mgmt: { title: "👥 Assign each task to the right teammate", pairs: [["Fix the server outage", "Priya (IT expert)"], ["Plan the budget", "Marcus (finance)"], ["Welcome the new hire", "Jen (people skills)"], ["Design the poster", "Leo (designer)"]], why: "Good managers match work to people's strengths, which gets better results and keeps the team motivated." }
};
function playMatch(job, x, end) {
  const set = MATCH_SETS[job.id], left = shuffle(set.pairs.map(p => p[0])), right = shuffle(set.pairs.map(p => p[1])); let sel = null, good = 0, bad = 0; const t0 = performance.now();
  const ov = overlay(`<div class="panel modal match"><div class="bar" style="--blue:${job.color}">${set.title}</div><div class="m-body">
    <p class="small">Click an item on the left, then its match on the right.</p><div class="match-grid"><div>${left.map(l => `<button class="mt-l" type="button"></button>`).join("")}</div><div>${right.map(r => `<button class="mt-r" type="button"></button>`).join("")}</div></div></div></div>`, { sticky: true });
  $$(".mt-l", ov).forEach((b, i) => { b.textContent = left[i]; b.addEventListener("click", () => { if (b.disabled) return; $$(".mt-l", ov).forEach(q => q.classList.toggle("sel", q === b)); sel = left[i]; }); });
  $$(".mt-r", ov).forEach((b, i) => { b.textContent = right[i]; b.addEventListener("click", () => { if (!sel || b.disabled) return; const ok = set.pairs.some(p => p[0] === sel && p[1] === right[i]);
    if (ok) { good++; b.disabled = true; b.classList.add("hit"); const l = $$(".mt-l", ov).find(q => q.textContent === sel); l.disabled = true; l.classList.remove("sel"); l.classList.add("hit"); Sfx.ok(); popText("Match!", "good"); sel = null; if (good === set.pairs.length) setTimeout(finish, 500); }
    else { bad++; b.classList.add("wrongflash"); setTimeout(() => b.classList.remove("wrongflash"), 300); Sfx.bad(); } }); });
  function finish() { const acc = clamp(1 - bad * .15, 0, 1), secs = (performance.now() - t0) / 1000, body = $(".m-body", ov); const why = document.createElement("div"); why.className = "lesson"; why.textContent = set.why; body.appendChild(why);
    const after = taskOk => { ov.close(); end({ ok: taskOk, score: clamp(acc * .6 + (taskOk ? .4 : 0), 0, 1), needsTask: x.t.type !== "choice", line: bad ? "All matched, with a few mix-ups." : "Perfect matching!", stats: [["mix-ups", bad], ["seconds", Math.round(secs)]] }); };
    setTimeout(() => { if (x.t.type === "choice") { $$(".spot-list, .seq-list, .match-grid", ov).forEach(el => el.hidden = true); const q = document.createElement("div"); body.appendChild(q); embeddedChoice(q, x.t, { who: x.t.from[0] }, after); } else after(true); }, 800); }
}

const SEQ_SETS = {
  logi: { title: "🚚 Plan the delivery route", help: "Tap the stops in the best order. The truck leaves from the depot.", steps: ["Load truck at the depot", "Hospital (urgent medicine, 9 AM deadline)", "Downtown office (10 AM)", "Mall (noon)", "Return to depot"], why: "Plan routes by deadline and urgency first, then distance. Always finish back at the depot." },
  med: { title: "🚑 Triage the waiting room", help: "Tap patients from MOST urgent to least urgent.", steps: ["Not breathing well, lips turning blue", "Deep cut, bleeding heavily", "Broken arm, in pain but stable", "Fever and sore throat", "Needs a prescription refill"], why: "Triage treats life-threatening problems first: airway and breathing, then severe bleeding, then everything else." }
};
function playSeq(job, x, end) {
  const set = SEQ_SETS[job.id], items = shuffle(set.steps.slice()); let k = 0, err = 0; const t0 = performance.now();
  const ov = overlay(`<div class="panel modal seq"><div class="bar" style="--blue:${job.color}">${set.title}</div><div class="m-body">
    <p class="small">${set.help}</p><div class="seq-list">${items.map(() => `<button class="seq-it" type="button"></button>`).join("")}</div></div></div>`, { sticky: true });
  $$(".seq-it", ov).forEach((b, i) => { b.textContent = items[i]; b.addEventListener("click", () => { if (b.disabled) return; if (items[i] === set.steps[k]) { k++; b.disabled = true; b.dataset.n = k; b.classList.add("hit"); Sfx.tick(); if (k === set.steps.length) setTimeout(finish, 400); } else { err++; b.classList.add("wrongflash"); setTimeout(() => b.classList.remove("wrongflash"), 300); Sfx.bad(); popText("Not yet", "bad"); } }); });
  function finish() { const acc = clamp(1 - err * .15, 0, 1), secs = (performance.now() - t0) / 1000, body = $(".m-body", ov); const why = document.createElement("div"); why.className = "lesson"; why.textContent = set.why; body.appendChild(why); popText(err ? "Done" : "Perfect order!", "good");
    const after = taskOk => { ov.close(); end({ ok: taskOk && acc >= .4, score: clamp(acc * .6 + (taskOk ? .4 : 0), 0, 1), needsTask: x.t.type !== "choice", line: err ? `Sorted with ${err} wrong pick${err > 1 ? "s" : ""}.` : "Flawless order!", stats: [["wrong picks", err], ["seconds", Math.round(secs)]] }); };
    setTimeout(() => { if (x.t.type === "choice") { $$(".spot-list, .seq-list, .match-grid", ov).forEach(el => el.hidden = true); const q = document.createElement("div"); body.appendChild(q); embeddedChoice(q, x.t, { who: x.t.from[0] }, after); } else after(true); }, 800); }
}
{ const run = runHandsOn; runHandsOn = function (kind, job, x, finish) { if (kind === "spot" || kind === "match" || kind === "seq") { x.playing = true; PLAY.active = { kind, x };
    const end = res => { x.playing = false; PLAY.active = null; const wrap = () => playResult(job, x, res, () => finish(res.ok, res.score));
      if (res.needsTask) openTaskWindow(x.t, { color: job.color, mentor: job.mentor.name, hintCost: SH.diff.hint, doneLabel: "Finish", onFinish: ok => { res.ok = ok && res.ok !== false; res.score = (res.score + (ok ? 1 : 0)) / 2; return 0; }, after: wrap }); else wrap(); };
    ({ spot: playSpot, match: playMatch, seq: playSeq })[kind](job, x, end); return; } run(kind, job, x, finish); }; }
