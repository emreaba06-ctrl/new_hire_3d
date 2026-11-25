/* =====================================================================
   UI: pause menu, guided first day (tutorial with a 3D waypoint arrow),
   loading tips. The visual refresh lives in head.html (".ui2" styles).
   ===================================================================== */

/* ---------- pause menu ---------- */
function openPause() {
  if (E.uiOpen || LOC === "title") return;
  const desktop = /Electron/i.test(navigator.userAgent);
  const ov = overlay(`<div class="panel modal pause"><div class="bar">Paused</div><div class="m-body">
    <div class="pause-grid">
      <button class="btn go big" type="button" id="pR">▶ Resume</button>
      <button class="btn" type="button" id="pS">⚙ Settings</button>
      <button class="btn" type="button" id="pA">♿ Accessibility</button>
      <button class="btn" type="button" id="pH">❓ How to play</button>
      <button class="btn grey" type="button" id="pB">ℹ About this game</button>
      <button class="btn grey" type="button" id="pT">💾 Save and go to title</button>
      ${desktop ? `<button class="btn orange" type="button" id="pQ">⏻ Save and quit</button>` : ""}
    </div>
    <p class="small center">Your game saves automatically. ${SH ? "The shift clock is paused while this menu is open." : ""}</p></div></div>`);
  const close = () => ov.close();
  $("#pR", ov).addEventListener("click", close);
  $("#pS", ov).addEventListener("click", () => { close(); openSettings(); });
  $("#pA", ov).addEventListener("click", () => { close(); openAccess(); });
  $("#pH", ov).addEventListener("click", () => { close(); openHelp(); });
  $("#pT", ov).addEventListener("click", () => { if (SH && !confirm("You're on a shift. Going to the title screen ends it with no pay. Continue?")) return; if (SH) { SH = null; S.workedToday = true; S.phase = "evening"; } save(); close(); showTitle(); });
  $("#pB", ov).addEventListener("click", () => { close(); showDisclaimer(); });
  const q = $("#pQ", ov); if (q) q.addEventListener("click", () => { save(); window.close(); });
}
window.addEventListener("keydown", e => {
  if (e.key !== "Escape" || (e.target.matches && e.target.matches("input, textarea, select"))) return;
  if (document.body.classList.contains("photo")) { photoMode(false); return; }
  if (!E.locked && !E.uiOpen && LOC !== "title") { e.preventDefault(); openPause(); }
});

/* ---------- guided first day ---------- */
const TUT = [
  { t: "Look around: move your mouse (or drag on a touch screen).", done: s => Math.abs(E.yaw - s.yaw0) > .7 || Math.abs(E.pitch - s.pitch0) > .4 },
  { t: "Walk with W A S D or the arrow keys.", done: s => Player.mesh && Player.mesh.position.distanceTo(s.pos0) > 2.2 },
  { t: "Time for work! Walk to the front door and press E.", target: () => interByName("Front door"), done: () => LOC !== "home" },
  { t: "Walk into the Brightline building.", target: () => interByName("Brightline entrance") || interByName("Elevator"), done: () => LOC === "lobby" || LOC === "floor" },
  { t: "Ride the elevator (press E) and pick any department.", target: () => interByName("Elevator"), done: () => LOC === "floor" },
  { t: "Talk to your mentor to clock in. Mentors have a name tag with their title.", target: () => E.F && E.F.mentor && E.F.mentor.mesh.position, done: () => !!SH },
  { t: "Help someone: look for a yellow ! and press E. Desk tasks show up in the list on the right.", target: () => { const x = SH && SH.list.find(q => q.state === "active"); return x ? (x.npc ? x.npc.mesh.position : x.desk && E.F && E.F.deskPos) : null; }, done: () => !SH || SH.list.some(q => q.state === "done") },
  { t: "Open your Phone (top right) to see your goals, skills and the shop.", done: () => S.tutPhone }
];
const interByName = n => { const it = E.inters.find(i => i.name === n); return it ? it.pos : null; };
let tutState = null, tutT = 0;
function tutStart() { S.tut = 0; S.tutPhone = false; save(); tutState = null; }
function tutTick(dt) {
  if (typeof S.tut !== "number" || S.tut >= TUT.length || LOC === "title" || !Player.mesh) { tutHide(); return; }
  if (!tutState) tutState = { yaw0: E.yaw, pitch0: E.pitch, pos0: Player.mesh.position.clone() };
  const now = performance.now(); if (now - tutT < 250) return; tutT = now;
  const step = TUT[S.tut];
  if (step.done(tutState)) { S.tut++; tutState = { yaw0: E.yaw, pitch0: E.pitch, pos0: Player.mesh.position.clone() }; Sfx.ok(); save();
    if (S.tut >= TUT.length) { S.money += 50; ledger("First-day bonus", 50); hud(); toast("<b>First day complete!</b> You know the basics. +$50 welcome bonus.", "gold"); Sfx.promo(); tutHide(); return; } }
  tutShow(TUT[S.tut], S.tut);
  const tg = TUT[S.tut].target && TUT[S.tut].target(); tutArrow(tg);
}
function tutShow(step, i) {
  let el = $("#tut"); if (!el) { el = document.createElement("div"); el.id = "tut"; el.innerHTML = `<div class="tut-h"><b>Your first day</b><span id="tutN"></span><button type="button" id="tutX" title="Skip the tutorial">Skip</button></div><div id="tutT"></div><div class="meter sm"><i id="tutM"></i></div>`; document.body.appendChild(el); $("#tutX", el).addEventListener("click", () => { S.tut = 99; save(); tutHide(); }); }
  if (el.dataset.i !== String(i)) { el.dataset.i = i; $("#tutT", el).textContent = step.t; $("#tutN", el).textContent = `Step ${i + 1} of ${TUT.length}`; $("#tutM", el).style.width = `${i / TUT.length * 100}%`; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  el.hidden = E.uiOpen > 0 || document.body.classList.contains("photo");
}
function tutHide() { const el = $("#tut"); if (el) el.hidden = true; tutArrow(null); }
let tutMesh = null;
function tutArrow(pos) {
  if (!pos) { if (tutMesh) tutMesh.visible = false; return; }
  if (!tutMesh || !tutMesh.parent) { tutMesh = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 16), new THREE.MeshBasicMaterial({ color: "#ffd23f" })); tutMesh.rotation.x = Math.PI; E.world.add(tutMesh); E.anims.push(() => { if (tutMesh) { tutMesh.position.y = 2.7 + Math.sin(E.t * 4) * .12; tutMesh.rotation.y += .04; } }); }
  tutMesh.visible = true; tutMesh.position.x = pos.x; tutMesh.position.z = pos.z;
}

/* ---------- loading tips ---------- */
const LOAD_TIPS = ["Tip: press P for photo mode.", "Tip: the cafeteria serves lunch at 12:00. Your shift pauses while you eat.", "Tip: coworkers remember your conversations.", "Tip: press Esc for the pause menu.", "Tip: Visual effects can be turned off in Settings for more speed.", "Tip: side hustles on your home computer earn extra cash in the evening.", "Tip: ask your mentor anything with the 'Ask anything' button."];

/* ---------- disclaimer: shown on first launch, and from Menu → About ---------- */
const DISC_KEY = "new-hire-3d.disclaimer.v1";
function disclaimerSeen() { try { return localStorage.getItem(DISC_KEY) === "1"; } catch (e) { return false; } }
function showDisclaimer(then) {
  const ov = overlay(`<div class="panel modal about"><div class="bar">A note before you play</div><div class="m-body">
    <p><b>New Hire 3D</b> was made with the help of AI.</p>
    <p>It started as a personal project, something built to learn and grow, and over time it has turned into a full game.</p>
    <p>Thanks for playing!</p>
    <button class="btn go big" type="button" id="dOk">${then ? "Continue" : "Close"}</button></div></div>`, { sticky: true });
  $("#dOk", ov).addEventListener("click", () => { try { localStorage.setItem(DISC_KEY, "1"); } catch (e) {} ov.close(); if (then) then(); });
}
