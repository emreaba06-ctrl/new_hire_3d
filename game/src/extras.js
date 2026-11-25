/* =====================================================================
   EXTRAS: game controller support, accessibility options, photo mode.
   ===================================================================== */
const A11Y_DEF = { text: 1, contrast: false, motion: false, sens: 1, invert: false, captions: true };
const a11y = () => Object.assign({}, A11Y_DEF, S.a11y || {});
function applyA11y() {
  const a = a11y(); const r = document.documentElement;
  r.style.setProperty("--uiz", String(clamp(+a.text || 1, .9, 1.5)));
  document.body.classList.toggle("hc", !!a.contrast);
  document.body.classList.toggle("calm", !!a.motion);
}
function openAccess() {
  const a = a11y();
  const ov = overlay(`<div class="panel modal"><div class="bar">Accessibility</div><div class="m-body">
    <div><span class="lbl">Text and menu size</span><div class="seg" id="axT">${[[1, "Normal"], [1.15, "Large"], [1.3, "Extra large"]].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${a.text === v}">${n}</button>`).join("")}</div></div>
    <label class="set"><input type="checkbox" id="axC" ${a.contrast ? "checked" : ""}> High contrast labels and menus</label>
    <label class="set"><input type="checkbox" id="axM" ${a.motion ? "checked" : ""}> Reduce motion (no head bob or camera sway)</label>
    <label class="set"><input type="checkbox" id="axCap" ${a.captions ? "checked" : ""}> Captions for spoken lines</label>
    <label class="set">Look sensitivity <input type="range" id="axS" min=".3" max="2.5" step=".1" value="${a.sens}"></label>
    <label class="set"><input type="checkbox" id="axI" ${a.invert ? "checked" : ""}> Invert look up and down</label>
    <p class="small">Controls: WASD or arrow keys to move, mouse to look, E to interact, P for photo mode. Game controllers work too: left stick moves, right stick looks, A interacts, B goes back, Start opens your phone.</p>
    <button class="btn go" type="button" id="axOk">Done</button></div></div>`);
  const set = (k, v) => { S.a11y = Object.assign(a11y(), { [k]: v }); save(); applyA11y(); };
  $$("#axT button", ov).forEach(b => b.addEventListener("click", () => { set("text", +b.dataset.v); $$("#axT button", ov).forEach(x => x.setAttribute("aria-pressed", String(x === b))); }));
  $("#axC", ov).addEventListener("change", e => set("contrast", e.target.checked));
  $("#axM", ov).addEventListener("change", e => set("motion", e.target.checked));
  $("#axCap", ov).addEventListener("change", e => set("captions", e.target.checked));
  $("#axS", ov).addEventListener("input", e => set("sens", +e.target.value));
  $("#axI", ov).addEventListener("change", e => set("invert", e.target.checked));
  $("#axOk", ov).addEventListener("click", () => ov.close());
}

/* captions: show what's being said at the bottom of the screen */
let capTimer = null;
function caption(who, text) {
  if (!a11y().captions || !text) return;
  let el = $("#caption"); if (!el) { el = document.createElement("div"); el.id = "caption"; document.body.appendChild(el); }
  el.innerHTML = ""; const b = document.createElement("b"); b.textContent = (who || "").replace(/^Caller: |'/g, "") + ": "; el.append(b, document.createTextNode(String(text).slice(0, 220)));
  el.classList.toggle("top", E.uiOpen > 0); el.classList.add("show"); clearTimeout(capTimer); capTimer = setTimeout(() => el.classList.remove("show"), 1500 + String(text).length * 55);
}

/* ---------- game controller ---------- */
const Pad = { prev: [], active: false, nav: 0 };
function padTick(dt) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null;
  for (const p of pads) if (p && p.connected) { gp = p; break; }
  if (!gp) { if (Pad.active) { E.joy.x = E.joy.y = 0; Pad.active = false; } return; }
  const dz = v => Math.abs(v) < .18 ? 0 : v;
  const ax = gp.axes, lx = dz(ax[0] || 0), ly = dz(ax[1] || 0), rx = dz(ax[2] || 0), ry = dz(ax[3] || 0);
  const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed), press = i => btn(i) && !Pad.prev[i];
  if (lx || ly || rx || ry || gp.buttons.some(b => b.pressed)) Pad.active = true;
  if (Pad.active) {
    if (!E.uiOpen) {
      E.joy.x = lx; E.joy.y = ly;
      const a = a11y(); E.yaw -= rx * dt * 2.6 * a.sens; E.pitch = clamp(E.pitch - ry * dt * 2 * a.sens * (a.invert ? -1 : 1), -1.25, 1.2);
      if (press(0)) Game.interact();
      if (press(9)) openPhone();
      if (press(8)) openSettings();
      if (press(3) && LOC !== "title") photoMode(!document.body.classList.contains("photo"));
    } else {
      E.joy.x = E.joy.y = 0;
      const top = [...$$("#ui .overlay")].pop(); if (top) {
        const els = [...top.querySelectorAll("button:not([disabled]), input, select, a[href]")].filter(e => e.offsetParent);
        let i = els.indexOf(document.activeElement);
        const dir = (press(13) || press(15) || (ly > .6 && (Pad.nav -= dt) < 0)) ? 1 : (press(12) || press(14) || (ly < -.6 && (Pad.nav -= dt) < 0)) ? -1 : 0;
        if (Math.abs(ly) < .6) Pad.nav = 0; else if (dir) Pad.nav = .22;
        if (dir && els.length) { i = (i + dir + els.length) % els.length; els[i].focus(); els[i].scrollIntoView({ block: "nearest" }); }
        if (press(0) && document.activeElement && top.contains(document.activeElement)) document.activeElement.click();
        if (press(1)) { const back = top.querySelector("#cx, #mx, .btn.grey, [data-x], #qd, #setOk, #axOk"); if (back) back.click(); else if (!top.classList.contains("taskov")) top.close && top.close(); }
      }
    }
  }
  Pad.prev = gp.buttons.map(b => b.pressed);
}
window.addEventListener("gamepadconnected", () => toast("Controller connected. Left stick moves, right stick looks, A interacts, Start opens your phone."));

/* ---------- photo mode ---------- */
function photoMode(on) {
  document.body.classList.toggle("photo", on);
  if (E.hands) E.hands.visible = !on;
  let tip = $("#photoTip");
  if (on) { if (!tip) { tip = document.createElement("div"); tip.id = "photoTip"; tip.innerHTML = `Photo mode · <b>P</b> exit · <b>C</b> save picture`; document.body.appendChild(tip); } toast("Photo mode on. Press C to save a picture."); }
  else if (tip) tip.remove();
}
async function savePhoto() {
  try {
    E.renderer.render(E.scene, E.camera);
    const blob = await new Promise(r => E.renderer.domElement.toBlob(r, "image/png"));
    if (!blob) throw 0;
    const dl = window.claude && claude.use ? await claude.use("downloads") : null;
    const name = `brightline-day${S.day}.png`;
    if (dl) { await dl.save({ filename: name, data: blob }); }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    Sfx.cash(); S.stats.photos = (S.stats.photos || 0) + 1; giveSticker("photo"); save();
  } catch (e) { if (!(e && e.code === "dismissed")) toast("Couldn't save the picture here.", "red"); }
}
window.addEventListener("keydown", e => {
  if (e.target.matches && e.target.matches("input, textarea, select")) return;
  const k = e.key.toLowerCase();
  if (k === "p" && !E.uiOpen && LOC !== "title") photoMode(!document.body.classList.contains("photo"));
  else if (k === "c" && document.body.classList.contains("photo")) savePhoto();
});
applyA11y();
