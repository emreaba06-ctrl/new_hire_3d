/* =====================================================================
   STORY CAMPAIGN: six chapters unlocked by shifts worked. Choices set
   flags that change later chapters and the ending. Features a work
   rival (Jax Vance) and mistakes with real consequences.
   ===================================================================== */
const RIVAL = "Jax Vance";
const CHAPTERS = [
  { at: 1, title: "Chapter 1: The Other New Hire", who: RIVAL,
    text: f => `Another new hire, Jax, started the same week as you. In the break room, Jax is staring at a frozen screen and muttering. "This system hates me."`,
    choices: [
      { t: "Show Jax the trick you learned for that screen.", set: { jax: 2 }, rep: 1, out: "Jax looks surprised. \"Huh. Thanks. I owe you one.\"" },
      { t: "Say \"good luck\" and keep walking.", set: { jax: 0 }, out: "Jax shrugs. \"Yeah. Whatever.\"" },
      { t: "Joke that maybe Jax isn't cut out for this.", set: { jax: -2 }, rep: -1, out: "Jax's face goes cold. \"We'll see who's cut out for it.\"" }] },
  { at: 3, title: "Chapter 2: The Spreadsheet", who: "Narrator",
    text: f => `You realize the report you sent your boss yesterday had a wrong number in it. Nobody has noticed yet.`,
    choices: [
      { t: "Tell your boss right away and send a corrected version.", set: { honest: 1 }, rep: 3, out: "Your boss nods. \"Thanks for catching it. That's exactly what I want from my team.\"" },
      { t: "Quietly fix the file and hope nobody noticed.", set: { hid: 1 }, out: "You swap the file. Your heart is pounding, but it seems fine. For now." },
      { t: "Say Jax must have changed the numbers.", set: { blamed: 1, jax: -3 }, rep: -2, out: "Jax hears about it by lunch. The look Jax gives you could freeze coffee." }],
    lesson: "Owning mistakes early builds trust. Hiding or blaming almost always comes back around." },
  { at: 6, title: "Chapter 3: Credit Where It's Due", who: RIVAL,
    text: f => f.jax > 0 ? `In the team meeting, Jax presents an idea and adds, "This was actually ${S.player.name.split(" ")[0]}'s idea." The boss looks impressed.` : `In the team meeting, Jax presents the idea you mentioned at lunch yesterday as their own. The boss loves it.`,
    choices: f => f.jax > 0 ? [
      { t: "Thank Jax and offer to work on it together.", set: { team: 1, jax: 3 }, rep: 2, out: "You and Jax become an unstoppable duo." },
      { t: "Take the spotlight and present the rest yourself.", set: { jax: -1 }, rep: 1, out: "The boss is impressed, but Jax goes quiet for the rest of the meeting." }] : [
      { t: "Talk to Jax privately and calmly after the meeting.", set: { calm: 1, jax: 2 }, rep: 1, out: "Jax admits it. \"You're right. I panicked. I'll tell the boss.\" And Jax does." },
      { t: "Call Jax out in front of everyone.", set: { jax: -2 }, rep: -2, out: "The room gets awkward. The boss frowns at both of you." },
      { t: "Say nothing and let it go.", set: { quiet: 1 }, out: "You let it slide. It stings a little." }],
    lesson: "When someone takes your credit, a calm private talk usually works better than a public fight." },
  { at: 10, title: "Chapter 4: The Audit", who: "Narrator",
    text: f => f.hid ? `Finance is auditing last month's reports. They found the original file with the wrong number, and the swap you made.` : f.blamed ? `Finance is auditing last month's reports. The logs show Jax never touched that file.` : `Finance is auditing last month's reports. Your corrected report is held up as an example of good work.`,
    choices: f => f.hid || f.blamed ? [
      { t: "Come clean and apologize.", set: { owned: 1 }, rep: -2, out: "It's an uncomfortable meeting, but your boss says, \"I appreciate the honesty, even if it's late.\"" },
      { t: "Insist it was a system error.", set: { liar: 1 }, rep: -6, out: "Nobody believes you. Your reputation takes a big hit." }] : [
      { t: "Offer to help train others on checking their reports.", set: { mentor: 1 }, rep: 3, out: "Your boss asks you to run a short training. People start coming to you for help." }],
    lesson: "Most workplaces keep version history and logs. Honesty is also the safest strategy." },
  { at: 15, title: "Chapter 5: The Promotion", who: "Narrator",
    text: f => `A team lead position opened up. Both you and Jax applied. Your boss asks you for a recommendation for a big upcoming project lead.`,
    choices: [
      { t: f => f.jax > 0 ? "Recommend Jax for the project. Jax earned it." : "Recommend Jax anyway. Fair is fair.", set: { generous: 1, jax: 2 }, rep: 2, out: "Your boss raises an eyebrow. \"That says a lot about you.\"" },
      { t: "Recommend yourself, with a list of your wins.", set: { ambitious: 1 }, rep: 1, out: "\"Solid case,\" your boss says, taking notes." },
      { t: "Point out Jax's mistakes to make yourself look better.", set: { jax: -3, sneaky: 1 }, rep: -3, out: "Your boss frowns. \"Let's keep this about your work, not theirs.\"" }] },
  { at: 20, title: "Chapter 6: The Big Client", who: "Narrator",
    text: f => `Your biggest client's system crashes at 4:55 PM on a Friday. Everyone is packing up. ${f.jax > 2 ? "Jax looks at you: \"Together?\"" : "Jax is already heading for the elevator."}`,
    choices: f => [
      { t: "Rally the team and split up the work.", set: { lead: 1 }, rep: 3, out: "With everyone pitching in, you fix it by 7. The client sends pizza on Monday." },
      { t: "Stay late and fix it all yourself.", set: { solo: 1 }, rep: 2, out: "You fix it at midnight, alone and exhausted." },
      { t: "Leave it for Monday. It's not your problem.", set: { left: 1 }, rep: -4, out: "On Monday, the client is furious, and everyone remembers who left." }] }
];
const ENDINGS = {
  leader: { t: "Ending: Team Leader", d: "You built trust, owned your mistakes and lifted others up. You're promoted to Team Lead, with Jax as your right hand. Real leaders are made from exactly these choices." },
  star: { t: "Ending: Lone Star", d: "You're brilliant and you get results, but you went it alone. You're promoted, but your team keeps its distance. Maybe next time, bring people with you." },
  fresh: { t: "Ending: Fresh Start", d: "Some choices caught up with you. HR suggests a transfer to a new department, which is a clean slate. Everyone gets second chances, and the lessons are yours to keep." }
};
function storyEnding(f) { const score = (f.honest || f.owned ? 2 : 0) + (f.jax > 2 ? 2 : f.jax > 0 ? 1 : 0) + (f.lead ? 2 : 0) + (f.generous || f.team || f.mentor ? 1 : 0) - (f.liar ? 3 : 0) - (f.left ? 3 : 0) - (f.sneaky ? 2 : 0); return score >= 5 ? "leader" : score >= 1 ? "star" : "fresh"; }
const storyFlags = () => (S.story = S.story && typeof S.story === "object" ? S.story : { ch: 0, f: { jax: 0 }, log: [] });
function storyCheck() {
  if (E.uiOpen) { setTimeout(storyCheck, 1500); return false; }
  const st = storyFlags(); const ch = CHAPTERS[st.ch]; if (!ch || S.stats.shifts < ch.at || !S.player) return false;
  const f = st.f; const choices = typeof ch.choices === "function" ? ch.choices(f) : ch.choices;
  const ov = overlay(`<div class="panel modal"><div class="bar" style="--blue:#7a1f2b">📖 ${esc(ch.title)}</div><div class="m-body">
    <p class="story-text"></p><div class="opts">${choices.map((c, i) => `<button class="opt" type="button" data-i="${i}"><span class="radio"></span><span class="ct"></span></button>`).join("")}</div>
    <p class="small">Your choices shape the story and its ending.</p></div></div>`, { sticky: true });
  $(".story-text", ov).textContent = ch.text(f); $$(".ct", ov).forEach((el, i) => { const t = choices[i].t; el.textContent = typeof t === "function" ? t(f) : t; });
  Voice.say(ch.text(f), "Narrator", 2);
  $$("[data-i]", ov).forEach(b => b.addEventListener("click", () => {
    const c = choices[+b.dataset.i]; for (const [k, v] of Object.entries(c.set || {})) f[k] = k === "jax" ? (f.jax || 0) + v : v;
    if (c.rep) S.rep = clamp(S.rep + c.rep, 0, 100);
    st.log.push({ ch: st.ch, t: $$(".ct", ov)[+b.dataset.i].textContent, d: S.day }); st.ch++;
    const last = st.ch >= CHAPTERS.length; let endKey = null; if (last) { endKey = storyEnding(f); st.end = endKey; award("story"); giveSticker("book"); if (endKey === "leader") { S.money += 500; ledger("Team Lead bonus", 500); } }
    save(); hud();
    $(".m-body", ov).innerHTML = `<p>${esc(c.out)}</p>${c.rep ? `<p class="small">${c.rep > 0 ? "+" : ""}${c.rep} reputation</p>` : ""}${ch.lesson ? `<div class="lesson"><b>Real-world lesson:</b> ${esc(ch.lesson)}</div>` : ""}
      ${last ? `<div class="warnbox gold"><b>${ENDINGS[endKey].t}</b><br>${esc(ENDINGS[endKey].d)}${endKey === "leader" ? "<br>+$500 bonus!" : ""}</div><p class="small">You can replay the story from the Story tab in your phone to see other endings.</p>` : `<p class="small">The story continues after more shifts (next chapter at ${CHAPTERS[st.ch].at} shifts).</p>`}
      <button class="btn go" type="button" id="sd">Continue</button>`;
    $("#sd", ov).addEventListener("click", () => ov.close());
  }));
  return true;
}
PHONE.story = () => { const st = storyFlags(); const f = st.f;
  return `<p><b>The Brightline Story</b>: ${st.ch} of ${CHAPTERS.length} chapters. ${st.ch < CHAPTERS.length ? `Next chapter after ${CHAPTERS[st.ch].at} total shifts (you have ${S.stats.shifts}).` : `Finished: <b>${ENDINGS[st.end].t}</b>.`}</p>
  <p>Your relationship with Jax: <b>${f.jax > 2 ? "Close friends 🤝" : f.jax > 0 ? "Friendly 🙂" : f.jax < -2 ? "Bitter rivals 😠" : f.jax < 0 ? "Tense 😐" : "Strangers"}</b></p>
  <ol class="steps">${st.log.map(l => `<li class="done"><b>${esc(CHAPTERS[l.ch].title)}</b><br><span class="small">You chose: ${esc(l.t)}</span></li>`).join("") || "<li>Work your first shift to begin.</li>"}</ol>
  ${st.ch >= CHAPTERS.length ? `<button class="btn orange" type="button" id="stR">Replay the story</button>` : ""}`; };
PHONE_WIRE.story = (ov, redraw) => { const b = $("#stR", ov); if (b) b.addEventListener("click", () => { S.story = { ch: 0, f: { jax: 0 }, log: [], replay: (S.story.replay || 0) + 1 }; save(); redraw(); toast("The story will replay as you keep working. Chapters unlock from your total shifts, so the first ones come right away."); }); };

/* rival scoreboard after each shift */
function rivalAfterShift(st) {
  const f = storyFlags().f; if (storyFlags().ch < 1) return;
  const jax = clamp(Math.round(2.5 + Math.random() * 2.2 + (f.jax < 0 ? .3 : 0)), 1, 5);
  S.rivalWins = (S.rivalWins || 0) + (st > jax ? 1 : 0);
  setTimeout(() => toast(st > jax ? `You beat Jax today: ${st}★ vs ${jax}★.` : st === jax ? `Tied with Jax: ${st}★ each.` : `Jax edged you out today: ${jax}★ vs ${st}★.`, st > jax ? "gold" : ""), 4200);
  if (S.rivalWins >= 5) award("rival");
}
