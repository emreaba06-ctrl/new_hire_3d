/* =====================================================================
   SIDE HUSTLES (evening mini-games on the home computer)
   Typing Sprint · Inbox Defender (phishing) · Flip It (profit math)
   ===================================================================== */
const HUSTLES = [
  { id: "type", name: "Typing Sprint", job: "Freelance transcription", desc: "Type real sentences in 40 seconds. $1 per correct word.", icon: "⌨️" },
  { id: "inbox", name: "Inbox Defender", job: "Virtual assistant", desc: "Sort 10 emails: legit, spam, or phishing. $6 per right answer.", icon: "📧" },
  { id: "flip", name: "Flip It", job: "Online reselling", desc: "Work out the profit on 6 deals. $8 per right answer.", icon: "📦" }
];
const TYPE_LINES = [
  "Always lock your computer when you step away from your desk.",
  "A strong password is long and unique for every account.",
  "Customers remember how you made them feel, not just what you said.",
  "Save your work often and keep a backup somewhere safe.",
  "Ask questions early, because guessing usually takes longer.",
  "The quickest way to learn a new job is to take good notes.",
  "Double check the email address before you send an invoice.",
  "Lift with your legs and keep the load close to your body.",
  "Every expert was once a beginner who kept practicing.",
  "Read the error message slowly, then search for the exact words."
];
const EMAILS = [
  ["IT Support <it-helpdesk@brightline.com>", "Scheduled maintenance Saturday 2am. No action needed.", "legit"],
  ["PayPa1 Security <alert@paypa1-verify.net>", "Your account is LOCKED. Click here within 1 hour to verify your password!", "phish"],
  ["Mom", "Don't forget dinner Sunday! Bring the salad.", "legit"],
  ["WINNER NOTICE <prizes@lucky-draw.biz>", "You won a FREE cruise!!! Reply with your bank details to claim.", "phish"],
  ["Daily Deals <deals@shopmart.com>", "50% off garden hoses this weekend only. Unsubscribe anytime.", "spam"],
  ["CEO Victoria Lane <victoria.lane@brightIine-corp.co>", "I need you to buy 5 gift cards urgently and send me the codes. Keep this quiet.", "phish"],
  ["HR <hr@brightline.com>", "Open enrollment for benefits starts Monday. Details on the intranet.", "legit"],
  ["Crypto King <moon@getrich.io>", "Turn $50 into $5,000 overnight. Limited spots!!!", "spam"],
  ["Delivery Service <track@dhl-parcels-redelivery.info>", "Package held. Pay a $1.99 fee at this link to release it.", "phish"],
  ["Weekly Newsletter <news@techdigest.com>", "This week: 10 keyboard shortcuts that save hours.", "spam"],
  ["Your Team Lead", "Great job on the report today. Let's sync at 10 tomorrow.", "legit"],
  ["Microsoft 365 <no-reply@m1crosoft-login.com>", "Your mailbox is full. Sign in here to keep receiving email.", "phish"],
  ["Gym <members@fitzone.com>", "New spin classes added on Tuesdays. See you there!", "spam"],
  ["Bank <alerts@yourbank.com>", "Your monthly statement is ready. Log in through our app to view it.", "legit"]
];
const PHISH_TIPS = { phish: "Phishing: fake sender address, urgency, and a request for passwords, money, or gift cards.", spam: "Spam: unwanted marketing, but not trying to steal from you. Just delete or unsubscribe.", legit: "Legit: expected sender, real company domain, no pressure to click or pay." };
function flipDeal() {
  const buy = 5 * (2 + Math.floor(Math.random() * 18)), sell = buy + 5 * (1 + Math.floor(Math.random() * 12)), feePct = pick([10, 12, 15]), ship = pick([0, 4, 6, 8]);
  const fee = Math.round(sell * feePct) / 100, profit = Math.round((sell - buy - fee - ship) * 100) / 100;
  const item = pick(["vintage jacket", "used textbook", "retro game console", "pair of sneakers", "desk lamp", "graphing calculator", "skateboard", "headphones"]);
  const wrong = shuffle([profit + ship, sell - buy, Math.round((sell - buy - ship) * 100) / 100, Math.round((profit - 3) * 100) / 100].filter(v => v !== profit)).slice(0, 3);
  return { q: `You buy a ${item} for $${buy} and sell it for $${sell}. The site keeps a ${feePct}% fee and shipping costs $${ship}. What's your profit?`, ans: profit, opts: shuffle([profit, ...wrong]), how: `Profit = sell − buy − fee − shipping = ${sell} − ${buy} − ${fee.toFixed(2)} − ${ship} = $${profit.toFixed(2)}` };
}

function openHustles() {
  const done = S.hustle && S.hustle.d === S.day ? S.hustle.ids : [];
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#6a3fc1">Side hustles</div><div class="m-body">
    <p>Evenings are for side hustles. Each one can be done once per day. Real people do these jobs to earn extra money!</p>
    <div class="shop">${HUSTLES.map(h => `<div class="item ${done.includes(h.id) ? "own" : ""}"><b>${h.icon} ${h.name}</b><span>${h.job}</span><span class="small">${h.desc}</span>${done.includes(h.id) ? '<span class="chip">Done today</span>' : `<button class="btn sm go" type="button" data-h="${h.id}">Start</button>`}</div>`).join("")}</div>
    <div class="row wrap"><button class="btn grey" type="button" id="hShop">Open the shop instead</button><button class="btn grey" type="button" id="hx">Close</button></div></div></div>`);
  $$("[data-h]", ov).forEach(b => b.addEventListener("click", () => { ov.close(); ({ type: hustleType, inbox: hustleInbox, flip: hustleFlip })[b.dataset.h](); }));
  $("#hShop", ov).addEventListener("click", () => { ov.close(); openPhone("shop"); });
  $("#hx", ov).addEventListener("click", () => ov.close());
}
function hustlePaid(id, amt, label) {
  S.hustle = S.hustle && S.hustle.d === S.day ? S.hustle : { d: S.day, ids: [] }; S.hustle.ids.push(id);
  S.money += amt; ledger(label, amt); S.burn = clamp((S.burn || 0) + 3, 0, 100); S.stats.hustles = (S.stats.hustles || 0) + 1;
  if (S.stats.hustles >= 10) award("hustler"); save(); hud(); if (amt) Sfx.cash();
}
function hustleType() {
  const lines = shuffle(TYPE_LINES); let li = 0, words = 0, left = 40, timer = null;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#6a3fc1">⌨️ Typing Sprint <span id="tyT" style="margin-left:auto">40s</span></div><div class="m-body">
    <p class="small">Type the line exactly, then press Enter. Every correct word earns $1.</p>
    <div class="typeline" id="tyL"></div><input type="text" id="tyIn" autocomplete="off" spellcheck="false" style="width:100%;padding:10px;font:16px ui-monospace,monospace;border-radius:8px;border:1px solid #bbb">
    <p id="tyS" class="small">Correct words: 0</p></div></div>`, { sticky: true, onClose: () => clearInterval(timer) });
  const L = $("#tyL", ov), inp = $("#tyIn", ov); const show = () => { L.textContent = lines[li % lines.length]; };
  show(); setTimeout(() => inp.focus(), 50);
  inp.addEventListener("input", () => { const t = lines[li % lines.length]; inp.style.borderColor = t.startsWith(inp.value) ? "#5fb320" : "#d6342c"; });
  inp.addEventListener("keydown", e => { if (e.key !== "Enter") return; const want = lines[li % lines.length].split(" "), got = inp.value.trim().split(/\s+/); want.forEach((w, i) => { if (got[i] === w) words++; }); li++; inp.value = ""; show(); $("#tyS", ov).textContent = `Correct words: ${words}`; Sfx.tick(); });
  timer = setInterval(() => { left--; $("#tyT", ov).textContent = left + "s"; if (left <= 0) { clearInterval(timer); finish(); } }, 1000);
  const finish = () => { const wpm = Math.round(words * 1.5); hustlePaid("type", words, "Freelance transcription");
    $(".m-body", ov).innerHTML = `<div class="center"><div class="stamp">${money(words)}</div><p>${words} correct words, about <b>${wpm} words per minute</b>.</p><p class="small">The average typist does about 40 WPM. Practicing 10 minutes a day can double your speed in a few weeks.</p><button class="btn go" type="button" id="tyD">Done</button></div>`;
    $("#tyD", ov).addEventListener("click", () => ov.close()); };
}
function hustleInbox() {
  const mails = shuffle(EMAILS).slice(0, 10); let i = 0, right = 0; const missed = [];
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#1b5ea6">📧 Inbox Defender</div><div class="m-body" id="ib"></div></div>`, { sticky: true });
  const draw = () => {
    const box = $("#ib", ov);
    if (i >= mails.length) { const pay = right * 6; hustlePaid("inbox", pay, "Virtual assistant work"); if (right === 10) giveSticker("phish");
      box.innerHTML = `<div class="center"><div class="stamp">${right}/10</div><p>You earned <b class="money">${money(pay)}</b>.</p></div>${missed.length ? `<div class="lesson"><b>Review:</b><br>${missed.map(m => `• ${esc(m[1])}: it was <b>${m[2]}</b>. ${PHISH_TIPS[m[2]]}`).join("<br>")}</div>` : `<div class="lesson">Perfect! You'd make a great security analyst.</div>`}<button class="btn go" type="button" id="ibD">Done</button>`;
      $("#ibD", ov).addEventListener("click", () => ov.close()); return; }
    const [from, body, kind] = mails[i];
    box.innerHTML = `<div class="small">Email ${i + 1} of 10 · score ${right}</div><div class="mail"><div><b>From:</b> <span id="mf"></span></div><p id="mb"></p></div>
      <div class="row wrap"><button class="btn go" type="button" data-k="legit">✔ Legit</button><button class="btn orange" type="button" data-k="spam">🗑 Spam</button><button class="btn" style="background:#d6342c;color:#fff" type="button" data-k="phish">🎣 Phishing</button></div>`;
    $("#mf", box).textContent = from; $("#mb", box).textContent = body;
    $$("[data-k]", box).forEach(b => b.addEventListener("click", () => { if (b.dataset.k === kind) { right++; Sfx.ok(); } else { missed.push(mails[i]); Sfx.bad(); } i++; draw(); }));
  };
  draw();
}
function hustleFlip() {
  const deals = Array.from({ length: 6 }, flipDeal); let i = 0, right = 0;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#e08a12">📦 Flip It</div><div class="m-body" id="fb"></div></div>`, { sticky: true });
  const draw = (fb) => {
    const box = $("#fb", ov);
    if (i >= deals.length) { const pay = right * 8; hustlePaid("flip", pay, "Reselling profits");
      box.innerHTML = `<div class="center"><div class="stamp">${right}/6</div><p>You earned <b class="money">${money(pay)}</b>.</p><p class="small">Real resellers always count fees and shipping. A sale that looks profitable can lose money!</p><button class="btn go" type="button" id="fD">Done</button></div>`;
      $("#fD", ov).addEventListener("click", () => ov.close()); return; }
    const d = deals[i];
    box.innerHTML = `${fb ? `<div class="warnbox ${fb[0] ? "gold" : ""}">${fb[0] ? "Correct!" : "Not quite."} ${esc(fb[1])}</div>` : ""}<div class="small">Deal ${i + 1} of 6 · score ${right}</div><p>${esc(d.q)}</p>
      <div class="opts">${d.opts.map(v => `<button class="opt" type="button" data-v="${v}"><span class="radio"></span>$${v.toFixed(2)}</button>`).join("")}</div>`;
    $$("[data-v]", box).forEach(b => b.addEventListener("click", () => { const ok = +b.dataset.v === d.ans; if (ok) { right++; Sfx.ok(); } else Sfx.bad(); i++; draw([ok, d.how]); }));
  };
  draw();
}
