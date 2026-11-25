/* =====================================================================
   AUDIO: character voices and procedural background music.
   ===================================================================== */
const hashStr = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const plain = html => { const d = document.createElement("div"); d.innerHTML = html; return (d.textContent || "").replace(/\s+/g, " ").trim(); };

/* ---------- voices ---------- */
// Pre-recorded ElevenLabs lines, keyed "speaker|exact text". Missing lines fall back to device voices.
let VO = null;
try { fetch("vo/index.json").then(r => r.ok ? r.json() : null).then(j => { VO = j; }).catch(() => {}); } catch (e) {}
const F_NAMES = /^(dana|rosa|helen|alicia|kim|mia|noor|pat|victoria|mom|nina|lena|priya|jo|ana|lisa|casey|harper|quinn|sasha|robin|sky|riley|avery|morgan|emerson|finley|reese|taylor|rowan|ari)\b/i;
const M_NAMES = /^(marcus|sam|lou|jordan|victor|greg|raj|rick|marco|tom|ben|officer|prof|blake|devon|kai|logan|parker|jamie|drew|elliot|driver|caller)\b/i;
function genderFor(name) { const n = String(name || "").replace(/^(dr|mr|ms)\.?\s+/i, ""); if (F_NAMES.test(n)) return "f"; if (M_NAMES.test(n)) return "m"; return hashStr(n) % 2 ? "f" : "m"; }
const VF = /female|woman|aria|jenny|zira|samantha|victoria|karen|moira|tessa|fiona|serena|susan|hazel|libby|sonia|emma|ava|allison|joanna|salli|kendra|kimberly|ivy|michelle|clara|natasha|catherine|nicky|martha|kate|google us english|google uk english female|sara|jessa|ana\b/i;
const VM = /\bmale|\bman\b|guy|david|mark|daniel|alex|fred|george|ryan|thomas|oliver|arthur|aaron|\btom\b|james|christopher|eric|roger|brian|justin|matthew|joey|davis|tony|steffan|google uk english male|william|liam|rishi|gordon|lee\b/i;
const vScore = v => (/natural|neural|online|premium|enhanced|wavenet|siri/i.test(v.name) ? 10 : 0) + (/google/i.test(v.name) ? 4 : 0) + (/en[-_]us/i.test(v.lang) ? 2 : /en[-_]gb/i.test(v.lang) ? 1 : 0) + (v.localService === false ? 1 : 0) - (/espeak|compact|novelty|whisper|bad news|bells|boing|bubbles|cellos|deranged|hysterical|organ|trinoids|zarvox|albert|jester|superstar|wobble|junior|ralph|bahh/i.test(v.name) ? 20 : 0);
const Voice = {
  list: [], speaking: false, prio: 0,
  canSpeak: () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
  init() {
    if (!this.canSpeak()) return;
    const load = () => { try { const all = speechSynthesis.getVoices(); let en = all.filter(v => /^en/i.test(v.lang)); if (!en.length) en = all; en = en.filter(v => vScore(v) > -10).sort((a, b) => vScore(b) - vScore(a)); this.list = en; this.f = en.filter(v => VF.test(v.name)); this.m = en.filter(v => VM.test(v.name) && !VF.test(v.name)); this.best = en[0]; } catch (e) {} };
    load(); try { speechSynthesis.addEventListener("voiceschanged", load); } catch (e) {}
  },
  mode() { const m = S.voice || "real"; if (m === "real" && (!this.canSpeak() || !this.list.length)) return "babble"; return m; },
  say(text, who, prio = 1, key) {
    if ((S.voice || "real") === "off" || !text) return;
    const t = plain(text).slice(0, 320); if (!t) return;
    if (this.speaking && prio < this.prio) return;
    if (typeof caption === "function") caption(who, t);
    if ((S.voice || "real") === "real" && VO) {
      const w = who || "Narrator", seq = [];
      const hit = (key && VO[key]) || VO[w + "|" + t];
      if (hit) seq.push(hit);
      else { const mm = t.match(/^(Nice work\.|Not quite\.) (.+)$/); if (mm && VO[w + "|" + mm[1]] && VO[w + "|" + mm[2]]) seq.push(VO[w + "|" + mm[1]], VO[w + "|" + mm[2]]); }
      if (seq.length) return this.playSeq(seq, who, prio);
    }
    const m = this.mode(); if (m === "off") return;
    if (m === "babble") return this.babble(t, who);
    try {
      speechSynthesis.cancel();
      const v = this.voiceFor(who), h = hashStr(who || "narrator");
      const parts = t.match(/[^.!?]+[.!?]*["')]*\s*/g) || [t]; const chunks = []; for (const p of parts) { if (chunks.length && (chunks[chunks.length - 1] + p).length < 140) chunks[chunks.length - 1] += p; else chunks.push(p); }
      this.speaking = true; this.prio = prio; this.who = who; Music.duck(true); const myRun = (this.run = (this.run || 0) + 1);
      chunks.forEach((c, i) => { const u = new SpeechSynthesisUtterance(c.trim()); if (v) { u.voice = v; u.lang = v.lang; } u.pitch = v && v.shared ? (genderFor(who) === "f" ? 1.12 : .86) : .96 + (h % 5) * .025; u.rate = .98 + ((h >> 3) % 4) * .025; u.volume = S.voiceVol ?? .9;
        if (i === chunks.length - 1) u.onend = u.onerror = () => { if (this.run === myRun) { this.speaking = false; this.prio = 0; this.who = null; Music.duck(false); } };
        speechSynthesis.speak(u); });
    } catch (e) { this.babble(t, who); }
  },
  voiceFor(who) {
    if (S.voicePick && S.voicePick !== "auto" && (!who || who === "Narrator")) { const v = this.list.find(x => x.name === S.voicePick); if (v) return v; }
    const g = genderFor(who), h = hashStr(who || "narrator"); const pool = (g === "f" ? this.f : this.m) || [];
    if (pool.length) { const top = pool.slice(0, Math.min(pool.length, 3)); return top[h % top.length]; }
    const v = this.best || this.list[0]; if (v) v.shared = true; return v;
  },
  babble(t, who) {
    if (!Sfx.ctx) return; this.who = who; this.speaking = true; clearTimeout(this.bt); this.bt = setTimeout(() => { this.speaking = false; this.who = null; }, Math.min(16, Math.max(3, Math.ceil(t.length / 7))) * 85 + 200); const h = hashStr(who || "x"); const base = 170 + (h % 8) * 38; const n = Math.min(16, Math.max(3, Math.ceil(t.length / 7)));
    const vol = .028 * (S.voiceVol ?? .9);
    for (let i = 0; i < n; i++) { const c = t.charCodeAt(i * 3 % t.length) || 0; Sfx.voiceTone(base * (1 + (c % 5) * .07), .065, i * .085, vol, h % 2 ? "square" : "triangle"); }
  },
  playSeq(files, who, prio) {
    this.stop(); const myRun = (this.run = (this.run || 0) + 1);
    this.speaking = true; this.prio = prio; this.who = who; Music.duck(true); let i = 0;
    const next = () => {
      if (this.run !== myRun) return;
      if (i >= files.length) { this.speaking = false; this.prio = 0; this.who = null; this.audio = null; Music.duck(false); return; }
      const a = new Audio("vo/" + files[i++]); a.volume = S.voiceVol ?? .9; this.audio = a; a.onended = next; a.onerror = next;
      if (this.phone && Sfx.ctx) { try { const src = Sfx.ctx.createMediaElementSource(a), bp = Sfx.ctx.createBiquadFilter(), hp = Sfx.ctx.createBiquadFilter(), g = Sfx.ctx.createGain(); bp.type = "lowpass"; bp.frequency.value = 3200; hp.type = "highpass"; hp.frequency.value = 380; g.gain.value = 1.4; src.connect(hp).connect(bp).connect(g).connect(Sfx.ctx.destination); } catch (e) {} }
      const p = a.play(); if (p && p.catch) p.catch(next);
    };
    next();
  },
  stop() { this.run = (this.run || 0) + 1; if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; } try { if (this.canSpeak()) speechSynthesis.cancel(); } catch (e) {} this.speaking = false; this.prio = 0; Music.duck(false); }
};
Sfx.voiceTone = function (f, d, t0, v, type) {
  if (!this.ctx) return;
  try { const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.06, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02); } catch (e) {}
};

/* ---------- music ---------- */
const N = n => 440 * Math.pow(2, (n - 69) / 12);
const TRACKS = {
  title:  { bpm: 104, prog: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 67]], style: "pop", mel: [72, 74, 76, 79, 76, 74, 72, 67] },
  lobby:  { bpm: 96, prog: [[60, 64, 67, 71], [62, 65, 69, 72], [64, 67, 71, 74], [57, 60, 64, 67]], style: "bossa", mel: [76, 74, 72, 71, 72, 74, 76, 79] },
  office: { bpm: 112, prog: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], style: "pop", mel: [72, 76, 79, 76, 74, 72, 74, 76] },
  home:   { bpm: 78, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 65]], style: "lofi", mel: [76, 72, 69, 72, 74, 72, 69, 67] },
  night:  { bpm: 66, prog: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65]], style: "lofi", mel: [72, 69, 67, 64, 65, 67, 69, 72] },
  rush:   { bpm: 138, prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], style: "drive", mel: [69, 72, 76, 72, 74, 72, 69, 67] }
};
const Music = {
  out: null, cur: null, want: null, step: 0, nextT: 0, timer: null, noise: null, ducked: false,
  ensure() {
    if (!Sfx.ctx) return false;
    if (!this.out) {
      const c = Sfx.ctx; this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(c.destination);
      const len = c.sampleRate * .5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = buf;
      this.timer = setInterval(() => this.tick(), 60);
    }
    return true;
  },
  level() { return S.music === false ? 0 : (S.musicVol ?? .5) * .16 * (this.ducked ? .45 : 1); },
  apply() { if (!this.out) return; const c = Sfx.ctx; this.out.gain.cancelScheduledValues(c.currentTime); this.out.gain.linearRampToValueAtTime(this.level(), c.currentTime + .4); },
  duck(on) { this.ducked = on; this.apply(); },
  play(name) {
    this.want = name; if (!this.ensure()) return;
    if (this.cur === name) { this.apply(); return; }
    const c = Sfx.ctx; this.out.gain.cancelScheduledValues(c.currentTime); this.out.gain.linearRampToValueAtTime(0, c.currentTime + .35);
    setTimeout(() => { this.cur = name; this.step = 0; this.nextT = Sfx.ctx.currentTime + .05; this.apply(); }, 380);
  },
  tick() {
    if (!this.cur || !Sfx.ctx || Sfx.ctx.state !== "running") return;
    const tr = TRACKS[this.cur], c = Sfx.ctx, eighth = 60 / tr.bpm / 2;
    if (this.nextT < c.currentTime - .5) this.nextT = c.currentTime + .05;
    while (this.nextT < c.currentTime + .25) { this.note(tr, this.step, this.nextT, eighth); this.nextT += eighth; this.step++; }
  },
  osc(f, t, d, v, type = "triangle", attack = .01) {
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + d + .05);
  },
  hit(t, v, hp, d) { const c = Sfx.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.noise; f.type = "highpass"; f.frequency.value = hp; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f).connect(g).connect(this.out); s.start(t); s.stop(t + d + .02); },
  kick(t, v) { const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g).connect(this.out); o.start(t); o.stop(t + .25); },
  note(tr, step, t, e) {
    const bar = Math.floor(step / 8) % tr.prog.length, s = step % 8, ch = tr.prog[bar], root = ch[0];
    if (s === 0) ch.forEach(n => this.osc(N(n), t, e * 8.5, tr.style === "drive" ? .05 : .07, "sine", .25));
    const bassHits = { bossa: [0, 3, 4, 7], pop: [0, 2, 4, 6], lofi: [0, 5], drive: [0, 1, 2, 3, 4, 5, 6, 7] }[tr.style];
    if (bassHits.includes(s)) this.osc(N(root - 24 + (tr.style === "bossa" && (s === 3 || s === 7) ? 7 : 0)), t, e * (tr.style === "lofi" ? 3 : 1.4), .22, "triangle");
    if (tr.style === "pop" || tr.style === "drive") { if (s % 2 === 1) this.hit(t, .05, 7000, .05); if (s % 4 === 0) this.kick(t, .5); if (s === 4) this.hit(t, .09, 1500, .12); }
    if (tr.style === "bossa") { if ([0, 3, 6].includes(s)) this.hit(t, .05, 3000, .04); if (s % 2 === 0) this.hit(t, .025, 8000, .03); }
    if (tr.style === "lofi") { if (s === 0) this.kick(t, .35); if (s === 4) this.hit(t, .06, 1800, .15); if (s % 2 === 1) this.hit(t, .02, 7000, .04); }
    const arp = tr.style === "drive" || s % 2 === 0; if (arp && step % 32 < 24) this.osc(N(ch[(s >> (tr.style === "drive" ? 0 : 1)) % ch.length] + 12), t, e * 1.2, .035, "sine");
    if (step % 32 >= 16 && s % 2 === 0) this.osc(N(tr.mel[(step / 2) % 8 | 0]), t, e * 1.8, .05, tr.style === "lofi" ? "sine" : "triangle");
  }
};
function musicFor() {
  if (LOC === "title") return "title";
  if (LOC === "cafe") return "lobby";
  if (LOC === "roof") return "home";
  if (LOC === "home") return S.phase === "evening" ? "night" : "home";
  if (LOC === "floor") return SH && (SH.rush || SH.list.some(x => x.state === "active" && x.urgent)) ? "rush" : "office";
  return "lobby";
}
document.addEventListener("pointerdown", () => { Sfx.init(); if (Music.ensure() && !Music.cur && typeof LOC !== "undefined") Music.play(musicFor()); });
document.addEventListener("keydown", () => { Sfx.init(); if (Music.ensure() && !Music.cur && typeof LOC !== "undefined") Music.play(musicFor()); });

/* ---------- office ambience ---------- */
const Ambience = {
  t: 0, nextPhone: 20, room: null, roomGain: null,
  ensureRoom() {
    if (this.room || !Sfx.ctx) return; const c = Sfx.ctx, len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; this.roomGain = c.createGain(); this.roomGain.gain.value = 0;
    s.connect(f).connect(this.roomGain).connect(c.destination); s.start(); this.room = s;
  },
  tick(dt) {
    if (!Sfx.ctx || S.muted) { if (this.roomGain) this.roomGain.gain.value = 0; return; }
    this.ensureRoom(); const onFloor = LOC === "floor", busy = LOC === "floor" || LOC === "lobby" || LOC === "cafe";
    if (this.roomGain) this.roomGain.gain.value += ((busy ? (onFloor ? .05 : .035) : .012) - this.roomGain.gain.value) * Math.min(1, dt);
    if (!onFloor || !Player.mesh) return; this.t -= dt; this.nextPhone -= dt;
    const p = Player.mesh.position;
    if (this.t <= 0) { this.t = .09 + Math.random() * .25;
      const typist = E.npcs.find(n => n.mode === "type" && !n.path.length && n.mesh.position.distanceTo(p) < 5);
      if (typist) { const d = typist.mesh.position.distanceTo(p); Sfx.tone(1400 + Math.random() * 900, .012, "square", .006 * (1 - d / 5)); } }
    if (this.nextPhone <= 0) { this.nextPhone = 25 + Math.random() * 35; for (let i = 0; i < 2; i++) { Sfx.tone(1250, .35, "sine", .008, i * .55); Sfx.tone(1050, .35, "sine", .006, i * .55); } }
    if (E.F && E.F.printerPos && Math.random() < dt * .03) { const d = Math.hypot(p.x - E.F.printerPos[0], p.z - E.F.printerPos[1]); if (d < 7) for (let i = 0; i < 6; i++) Sfx.tone(180 + i * 15, .12, "sawtooth", .006 * (1 - d / 7), i * .13); }
  }
};
function openSettings() {
  const ov = overlay(`<div class="panel modal"><div class="bar">Settings</div><div class="m-body">
    <label class="set"><input type="checkbox" id="setSfx" ${S.muted ? "" : "checked"}> Sound effects</label>
    <label class="set"><input type="checkbox" id="setMus" ${S.music === false ? "" : "checked"}> Music</label>
    <label class="set">Music volume <input type="range" id="setMusV" min="0" max="1" step=".05" value="${S.musicVol ?? .5}"></label>
    <div><span class="lbl">Voices</span><div class="seg" id="setVo">${[["real", "Voice actors (ElevenLabs)"], ["babble", "Game babble"], ["off", "Off"]].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${(S.voice || "real") === k}">${n}</button>`).join("")}</div>
    <div class="small">${Voice.canSpeak() && Voice.list.length ? "Real voices use your device's built-in speech voices, so they sound different on every device." : "Your browser has no speech voices, so characters use game babble instead."}</div></div>
    ${Voice.list.length ? `<label class="set">Narrator voice <select id="setVp"><option value="auto">Automatic (best available)</option>${Voice.list.slice(0, 40).map(v => `<option ${S.voicePick === v.name ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label><div class="small">Found ${Voice.list.length} voices: ${Voice.f.length} female, ${Voice.m.length} male. For the most natural voices, use Microsoft Edge ("Natural" voices) or download "Enhanced" voices in your phone or computer's speech settings.</div>` : ""}
    <div><span class="lbl">Visual effects</span><div class="seg" id="setFx">${[["auto", "On (soft shadows, glow, color)"], ["off", "Off (faster)"]].map(([k, n]) => `<button type="button" data-fx="${k}" aria-pressed="${(S.fx || "auto") === k}">${n}</button>`).join("")}</div></div>
    <div><span class="lbl">Graphics quality</span><div class="seg" id="setGfx">${Object.entries(QUALITY).map(([k, q]) => `<button type="button" data-g="${k}" aria-pressed="${(S.gfx || "hd") === k}">${q.name}</button>`).join("")}</div><div class="small" id="gfxNote">Rendering at ${E.res || ""} pixels. Lower this if the game feels slow.</div></div>
    <label class="set">Voice volume <input type="range" id="setVoV" min="0" max="1" step=".05" value="${S.voiceVol ?? .9}"></label>
    <div class="row wrap"><button class="btn sm" type="button" id="setTest">Test voice</button><button class="btn sm" type="button" id="setAx">Accessibility</button><button class="btn go" type="button" id="setOk">Done</button></div></div></div>`);
  const upd = () => { save(); Music.apply(); hud(); };
  $("#setSfx", ov).addEventListener("change", e => { S.muted = !e.target.checked; upd(); Sfx.click(); });
  $("#setMus", ov).addEventListener("change", e => { S.music = e.target.checked; Sfx.init(); if (S.music) Music.play(musicFor()); upd(); });
  $("#setMusV", ov).addEventListener("input", e => { S.musicVol = +e.target.value; upd(); });
  $("#setVoV", ov).addEventListener("input", e => { S.voiceVol = +e.target.value; save(); });
  $$("#setVo button", ov).forEach(b => b.addEventListener("click", () => { S.voice = b.dataset.v; save(); $$("#setVo button", ov).forEach(x => x.setAttribute("aria-pressed", String(x === b))); }));
  const vp = $("#setVp", ov); if (vp) vp.addEventListener("change", e => { S.voicePick = e.target.value; save(); });
  $$("#setGfx button", ov).forEach(b => b.addEventListener("click", () => { S.gfx = b.dataset.g; save(); $$("#setGfx button", ov).forEach(x => x.setAttribute("aria-pressed", String(x === b))); for (const k in UI_TEX) delete UI_TEX[k]; applyQuality(); $("#gfxNote", ov).textContent = `Rendering at ${E.res} pixels. Textures sharpen next time you change rooms.`; }));
  $("#setTest", ov).addEventListener("click", () => { Sfx.init(); Voice.say(`Hi ${S.player ? S.player.name.split(" ")[0] : "there"}! Welcome to Brightline. Ready for your shift?`, "Pat Rivers", 2); });
  $("#setOk", ov).addEventListener("click", () => ov.close());
  $$("#setFx button", ov).forEach(b => b.addEventListener("click", () => { S.fx = b.dataset.fx; save(); $$("#setFx button", ov).forEach(x => x.setAttribute("aria-pressed", String(x === b))); setupPost(); }));
  $("#setAx", ov).addEventListener("click", () => { ov.close(); openAccess(); });
}
Voice.init();
