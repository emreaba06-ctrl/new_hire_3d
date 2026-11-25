/* =====================================================================
   LEARNING: career tracks with real certifications and job links,
   progress report with weak-spot practice, adaptive difficulty,
   certification-style practice exams.
   ===================================================================== */
const CAREER_TRACKS = [
  { id: "sec", name: "Help Desk → Security Analyst", certs: ["CompTIA A+", "CompTIA Security+", "CompTIA CySA+"], q: "SOC analyst",
    steps: [{ job: "it", lvl: 2 }, { cert: "it" }, { job: "cyber", lvl: 1 }, { cert: "cyber" }, { job: "cyber", lvl: 3 }] },
  { id: "code", name: "Junior Developer → Data Scientist", certs: ["freeCodeCamp certificates", "Google Data Analytics", "AWS Cloud Practitioner"], q: "junior software developer",
    steps: [{ job: "dev", lvl: 2 }, { cert: "dev" }, { job: "data", lvl: 1 }, { cert: "data" }, { job: "data", lvl: 3 }] },
  { id: "ops", name: "Warehouse → Operations Manager", certs: ["OSHA 10", "Forklift certification", "APICS CSCP"], q: "warehouse associate",
    steps: [{ job: "wh", lvl: 2 }, { cert: "wh" }, { job: "logi", lvl: 2 }, { job: "mgmt", lvl: 1 }, { job: "mgmt", lvl: 3 }] },
  { id: "biz", name: "Sales Rep → Marketing Manager", certs: ["HubSpot Inbound", "Google Ads", "Salesforce Associate"], q: "sales representative",
    steps: [{ job: "sales", lvl: 2 }, { cert: "sales" }, { job: "mkt", lvl: 1 }, { cert: "mkt" }, { job: "mkt", lvl: 3 }] },
  { id: "fin", name: "Teller → Accountant", certs: ["Bank teller training", "QuickBooks Certified User", "CPA (later)"], q: "bank teller",
    steps: [{ job: "bank", lvl: 2 }, { cert: "bank" }, { job: "acct", lvl: 1 }, { cert: "acct" }, { job: "acct", lvl: 3 }] },
  { id: "care", name: "Nursing Assistant → Nurse", certs: ["CPR / BLS", "CNA certification", "RN license (nursing degree)"], q: "nursing assistant",
    steps: [{ job: "med", lvl: 1 }, { cert: "med" }, { job: "med", lvl: 2 }, { job: "support", lvl: 1 }, { job: "med", lvl: 4 }] },
  { id: "food", name: "Line Cook → Restaurant Manager", certs: ["ServSafe Food Handler", "ServSafe Manager", "Hospitality management"], q: "line cook",
    steps: [{ job: "chef", lvl: 2 }, { cert: "chef" }, { job: "support", lvl: 1 }, { job: "mgmt", lvl: 1 }, { job: "chef", lvl: 4 }] },
  { id: "people", name: "Retail Associate → HR Manager", certs: ["Customer service certificate", "SHRM-CP", "PHR"], q: "retail sales associate",
    steps: [{ job: "retail", lvl: 2 }, { cert: "retail" }, { job: "hr", lvl: 1 }, { cert: "hr" }, { job: "hr", lvl: 3 }] }
];
const stepDone = st => st.cert ? !!S.certs[st.cert] : lvl((S.jobs[st.job] || { xp: 0 }).xp) >= st.lvl;
const stepLabel = st => st.cert ? `Earn the ${jobById(st.cert).dept} 101 certificate` : `Reach ${LEVELS[st.lvl].name} in ${jobById(st.job).dept}`;
function checkTrack() {
  const t = CAREER_TRACKS.find(x => x.id === S.track); if (!t) return;
  S.trackDone = S.trackDone || {};
  t.steps.forEach((st, i) => { const k = t.id + i; if (stepDone(st) && !S.trackDone[k]) { S.trackDone[k] = S.day; S.money += 200; toast(`<b>Career step complete!</b> ${esc(stepLabel(st))}. +$200`, "gold"); } });
  if (t.steps.every(stepDone) && !S.ach.track) { S.ach.track = S.day; toast(`<b>Career track finished: ${esc(t.name)}!</b>`, "gold"); Sfx.promo(); }
  save();
}
const jobLinks = q => `<a href="https://www.indeed.com/jobs?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Indeed</a> · <a href="https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}" target="_blank" rel="noopener">LinkedIn</a>`;

/* ---------- phone tabs: career tracks + progress report ---------- */
PHONE.tracks = () => {
  const cur = CAREER_TRACKS.find(x => x.id === S.track);
  return `<p>Pick a goal. Each track mixes departments the way real careers do. Every step pays a $200 bonus. Certifications listed are the real ones people earn for these jobs.</p>
  ${cur ? `<div class="warnbox gold"><b>Your goal: ${esc(cur.name)}</b><ol class="steps">${cur.steps.map(st => `<li class="${stepDone(st) ? "done" : ""}">${stepDone(st) ? "✔ " : ""}${esc(stepLabel(st))}</li>`).join("")}</ol><div class="small">Real certifications: ${cur.certs.join(" · ")}<br>Real job listings: ${jobLinks(cur.q)}</div></div>` : ""}
  <div class="tracks">${CAREER_TRACKS.map(t => `<div class="item ${S.track === t.id ? "own" : ""}"><b>${esc(t.name)}</b><span class="small">${t.certs.join(" · ")}</span><span class="small">${t.steps.filter(stepDone).length}/${t.steps.length} steps · ${jobLinks(t.q)}</span>${S.track === t.id ? '<span class="chip">Current goal</span>' : `<button class="btn sm" type="button" data-track="${t.id}">Set as goal</button>`}</div>`).join("")}</div>`;
};
PHONE_WIRE.tracks = (ov, redraw) => $$("[data-track]", ov).forEach(b => b.addEventListener("click", () => { S.track = b.dataset.track; save(); checkTrack(); Sfx.click(); redraw(); }));
function jobStats(id) {
  const js = S.jobs[id]; if (!js) return null;
  const vals = Object.values(js.done); const ok = vals.filter(v => v === "ok").length, fail = vals.filter(v => v === "fail").length;
  return { ok, fail, acc: ok + fail ? Math.round(ok / (ok + fail) * 100) : null, weak: Object.entries(js.done).filter(([, v]) => v === "fail").map(([k]) => k) };
}
PHONE.report = () => {
  const rows = JOBS.map(j => ({ j, s: jobStats(j.id) })).filter(r => r.s && r.s.ok + r.s.fail);
  if (!rows.length) return "<p>Work a shift and your progress report will appear here.</p>";
  const best = rows.slice().sort((a, b) => b.s.acc - a.s.acc)[0], worst = rows.slice().sort((a, b) => a.s.acc - b.s.acc)[0];
  const tot = rows.reduce((t, r) => [t[0] + r.s.ok, t[1] + r.s.fail], [0, 0]);
  return `<p><b>Overall accuracy: ${Math.round(tot[0] / Math.max(1, tot[0] + tot[1]) * 100)}%</b> (${tot[0]} right, ${tot[1]} still to master). Strongest: ${esc(best.j.dept)}. Needs practice: ${esc(worst.j.dept)}.</p>
  <div class="report">${rows.map(({ j, s }) => `<div class="cjob"><div class="row"><span class="tile sm" style="--c:${j.color}">${icon(j.icon)}</span><b>${j.dept}</b><span style="margin-left:auto" class="small">${s.acc}% accurate</span></div>
    <div class="meter sm" style="margin:6px 0"><i style="width:${s.acc}%;--c:${s.acc >= 75 ? "var(--go)" : s.acc >= 50 ? "var(--warn)" : "var(--bad)"}"></i></div>
    ${s.weak.length ? `<div class="small">Weak spots:</div><div class="row wrap">${s.weak.map(id => { const t = j.tasks.find(x => x.id === id); return t ? `<button class="btn sm orange" type="button" data-prac="${j.id}|${id}">Practice: ${esc(t.subject)}</button>` : ""; }).join("")}</div>` : '<div class="small">No weak spots. Nice!</div>'}</div>`).join("")}</div>`;
};
PHONE_WIRE.report = (ov, redraw) => $$("[data-prac]", ov).forEach(b => b.addEventListener("click", () => {
  const [jid, tid] = b.dataset.prac.split("|"); const job = jobById(jid), t = job.tasks.find(x => x.id === tid); ov.close();
  openTaskWindow(t, { color: job.color, mentor: job.mentor.name, hintCost: 0, doneLabel: "Back to my report", onFinish: ok => { if (ok) { jobState(jid).done[tid] = "ok"; save(); toast("Weak spot mastered!", "gold"); } return 0; }, after: () => openPhone("report") });
}));

/* ---------- adaptive difficulty: recent accuracy moves the tier up or down ---------- */
function adaptiveTierShift(js) {
  const vals = Object.values(js.done); if (vals.length < 4) return 0;
  const acc = vals.filter(v => v === "ok").length / vals.length;
  return acc >= .85 ? 1 : acc < .5 ? -1 : 0;
}

/* ---------- certification-style practice exams (10 questions, pass at 8) ---------- */
function openExam(job) {
  runQuiz(`${job.dept} practice exam`, job.color, quizFor(job, 10), (score, qov) => {
    const pass = score >= 8; S.exams = S.exams || {};
    const first = pass && !S.exams[job.id]; if (first) { S.exams[job.id] = S.day; S.skillPts++; S.money += 100; giveSticker("exam"); }
    save(); pass ? Sfx.promo() : Sfx.bad();
    $("#qb", qov).innerHTML = `<div class="center"><div class="stamp ${pass ? "" : "badday"}">${score}/10</div>${pass ? `<p>Passed! ${first ? "+1 skill point and $100." : "Great refresher."}</p>` : "<p>You need 8 out of 10. Review your journal and try again.</p>"}<p class="small">Practice in the style of beginner certification exams. It isn't an official exam.</p><button class="btn go" type="button" id="qd">Done</button></div>`;
    $("#qd", qov).addEventListener("click", () => qov.close());
  }, `<b class="name">Prof. Ellis:</b> Ten questions, like a real certification exam. Score 8 or more to pass.`);
}
