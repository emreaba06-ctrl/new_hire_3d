/* =====================================================================
   MODES: endless drill (training center), night shift helpers,
   first-person gear on your hands.
   ===================================================================== */

/* ---------- endless drill: questions from every department until 3 misses ---------- */
function openEndless() {
  let score = 0, lives = 3, streak = 0; const best = S.endlessBest || 0;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#6a3fc1">♾️ Endless Drill <span id="enH" style="margin-left:auto"></span></div><div class="m-body" id="enB"></div></div>`, { sticky: true });
  const head = () => { $("#enH", ov).textContent = `Score ${score} · ${"❤".repeat(lives)}${"♡".repeat(3 - lives)}`; };
  const next = () => {
    head(); const box = $("#enB", ov);
    if (lives <= 0) {
      const nb = score > best; if (nb) S.endlessBest = score; S.money += score * 3; ledger("Endless drill prize", score * 3); save(); hud();
      if (score >= 25) award("endless");
      box.innerHTML = `<div class="center"><div class="stamp">${score}</div><p>${nb ? "<b>New personal best!</b>" : `Your best: ${best}`}</p><p>Prize: <b class="money">${money(score * 3)}</b> ($3 per correct answer)</p><p class="small">Tip: the questions you missed are great to review in your journal.</p><div class="row wrap center"><button class="btn go" type="button" id="enA">Play again</button><button class="btn grey" type="button" id="enX">Done</button></div></div>`;
      $("#enA", ov).addEventListener("click", () => { ov.close(); openEndless(); }); $("#enX", ov).addEventListener("click", () => ov.close()); return;
    }
    const job = pick(JOBS); const q = quizFor(job, 1)[0]; const opts = shuffle(q.opts);
    box.innerHTML = `<div class="row"><span class="tile sm" style="--c:${job.color}">${icon(job.icon)}</span><span class="small">${esc(job.dept)}${streak >= 3 ? ` · 🔥 ${streak} in a row` : ""}</span></div><p class="ctx"></p><div class="ask">${q.q}</div><div class="opts">${opts.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="radio"></span><span class="ot"></span></button>`).join("")}</div><div id="enR"></div>`;
    $(".ctx", box).textContent = q.ctx; $$(".ot", box).forEach((el, k) => el.textContent = opts[k].t);
    $$(".opt", box).forEach(b => b.addEventListener("click", () => {
      const o = opts[+b.dataset.k]; $$(".opt", box).forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      if (o.ok) { score++; streak++; Sfx.ok(); setTimeout(next, 650); }
      else { lives--; streak = 0; Sfx.bad(); head(); $("#enR", box).innerHTML = `<div class="lesson"><b>Not quite.</b> ${q.lesson}</div><button class="btn go" type="button" id="enN">${lives > 0 ? "Keep going" : "See results"}</button>`; $("#enN", box).addEventListener("click", next); }
    }));
  };
  next();
}

/* ---------- night shift ---------- */
function nightStart(sh) {
  sh.night = true; sh.bonus += Math.round(LEVELS[lvl(sh.js.xp)].pay * .3); S.burn = clamp((S.burn || 0) + 5, 0, 100);
  setTimeout(() => toast("🌙 Night shift: quieter floor, +30% pay. Real tip: night workers need extra sleep and steady meal times."), 2000);
  if (E.npcs) E.npcs.filter(n => n.kind === "coworker").forEach((n, i) => { if (i % 2) { n.mesh.visible = false; n.label && (n.label.style.display = "none"); n.hiddenNight = true; } });
}

/* ---------- gear on your first-person hands ---------- */
function handsGear(h) {
  const L = h.userData.L, R = h.userData.R;
  const th = CUR_JOB && THEMES[CUR_JOB] && THEMES[CUR_JOB].uniform; if (th && th.shirt) [L, R].forEach(a => { const sl = a.children[0]; if (sl && sl.material) sl.material = mat(th.shirt, { rough: .85 }); });
  if (th && th.shirt === "#3aa6a0") { const glove = mat("#7fb3e6", { rough: .4 }); [L, R].forEach(a => a.children.slice(1).forEach(c => c.material = glove)); } // nurse gloves
  if (owns("watch")) { const band = new THREE.Mesh(cgeo(.062, .062, .025, 14), mat("#2b2b2b", { rough: .5 })); band.rotation.x = Math.PI / 2; band.position.z = .05; L.add(band); const face = new THREE.Mesh(cgeo(.028, .028, .012, 16), mat("#d9dde3", { metal: .7, rough: .25 })); face.position.set(0, .06, .05); L.add(face); const gl = new THREE.Mesh(cgeo(.022, .022, .004, 16), new THREE.MeshBasicMaterial({ color: "#1b5ea6" })); gl.position.set(0, .067, .05); L.add(gl); }
  if (S.ach && Object.keys(S.ach).length >= 10) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.013, .004, 6, 14), mat("#f5c518", { metal: .9, rough: .2 })); ring.rotation.x = Math.PI / 2; ring.position.set(-.01, .012, -.085); R.add(ring); }
}
