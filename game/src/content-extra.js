/* =====================================================================
   EXTRA CONTENT (3D edition): new departments, task generators,
   glossary, career paths, skills, achievements, projects, events.
   ===================================================================== */
ICONS.megaphone = '<path d="M3 10v4h3l6 4V6L6 10z"/><path d="M15 9a4 4 0 010 6M18 6a8 8 0 010 12"/>';
ICONS.bars = '<path d="M4 20V11M10 20V5M16 20v-8M21 20H3"/>';

/* Rename a few senders so they make sense as people walking up to you. */
const PATCH_FROM = { "it-ransom": ["Pat Rivers", "Reception"], "wh-fork": ["Radio: Aisle C", "Radio"], "wh-damage": ["Rick Dawson", "Receiving dock"], "mg-conflict": ["Riley Brooks", "Your team"], "hr-complaint": ["Casey Morgan", "Private meeting"], "lg-weight": ["Marco Silva", "Dock team"] };
JOBS.forEach(j => j.tasks.forEach(t => { if (PATCH_FROM[t.id]) t.from = PATCH_FROM[t.id]; }));

/* ---------- Marketing ---------- */
JOBS.push({
  id: "mkt", dept: "Marketing", floor: 11, icon: "megaphone", color: "#e2513a", role: "Marketing Coordinator",
  blurb: "Plan campaigns, read the numbers, grow the brand.",
  mentor: { name: "Mia Torres", title: "Marketing Director", hello: "Welcome to Marketing, {name}! Creativity is fun, but the numbers decide what works. Know your audience, test everything, and never fake a claim." },
  tasks: [
    { id: "mk-audience", tier: 1, type: "choice", from: ["Mia Torres", "Marketing Director"], subject: "Who are we selling to?",
      msg: "We're launching the <b>Brightline Student</b>, a $399 laptop for college students. Where should most of the ad budget go?", ask: "Pick the best channel.",
      hint: "Go where the target audience already spends time.",
      lesson: "Start every campaign with the target audience: who they are, where they spend time, and what they care about. The right channel beats a bigger budget.",
      options: [{ t: "Short videos on social apps students use, plus campus partnerships", ok: true, fb: "Right audience, right place. Clicks are cheap and relevant." }, { t: "Full-page ads in a business newspaper", fb: "Expensive, and very few students read it." }, { t: "Billboards near retirement communities", fb: "Wrong audience entirely." }, { t: "Spread it equally everywhere", fb: "Spreading thin wastes most of the budget on people who won't buy." }] },
    { id: "mk-channels", tier: 1, type: "sort", from: ["Mia Torres", "Marketing Director"], subject: "Paid, owned or earned?",
      msg: "<b>Paid</b> = you pay for the space. <b>Owned</b> = channels you control. <b>Earned</b> = attention others give you for free.", ask: "Sort each channel.",
      hint: "If you write it on your own platform, you own it. If someone else chooses to talk about you, you earned it.",
      lesson: "Paid media (ads) buys reach. Owned media (website, email, blog) builds long-term value. Earned media (press, reviews, shares) is the most trusted.",
      buckets: ["Paid", "Owned", "Earned"],
      items: [{ t: "Search ads", b: 0 }, { t: "Sponsored social post", b: 0 }, { t: "Company blog", b: 1 }, { t: "Email newsletter", b: 1 }, { t: "News article about us", b: 2 }, { t: "Customer review", b: 2 }] },
    { id: "mk-ab", tier: 2, type: "choice", from: ["Jamie Fox", "Web team"], subject: "Which landing page won?",
      msg: "A/B test results after one morning:<br>Version A: 50 visitors, 2 sign-ups (4%)<br>Version B: 50 visitors, 3 sign-ups (6%)<br>The team wants to switch everything to B right now.",
      ask: "What do you recommend?", hint: "Is one extra sign-up enough evidence?",
      lesson: "A/B tests need enough data. With tiny samples, differences are often luck. Decide your sample size before the test and wait for it.",
      options: [{ t: "Keep the test running until there's enough traffic to trust the result", ok: true, fb: "A week later, A and B are basically tied. Good call." }, { t: "Switch to B, it's 50% better", fb: "That '50% better' is one extra person. The result flipped the next day." }, { t: "Switch to A, it's the original", fb: "There's no evidence for A either." }, { t: "Stop testing, tests are a waste", fb: "Testing is how marketers learn what works." }] },
    { id: "mk-launch", tier: 2, type: "order", from: ["Mia Torres", "Marketing Director"], subject: "Plan the launch campaign",
      msg: "Put the campaign steps in order.", ask: "Order the steps.", hint: "You can't measure results before you set a goal.",
      lesson: "Campaign cycle: research the audience → set goals and budget → create content → launch → measure and optimize. Then repeat.",
      items: ["Research the audience", "Set the goal and budget", "Create the ads and content", "Launch the campaign", "Measure results and optimize"] },
    { id: "mk-claim", tier: 2, type: "multi", from: ["Legal team", "Email"], subject: "Ad copy review",
      msg: "Legal wants a check on the ad copy before it runs.", ask: "Select every claim that could get us in trouble.",
      hint: "Claims need proof. Absolutes like 'best' and 'never' are risky.",
      lesson: "Advertising claims must be true and provable. Superlatives and guarantees need evidence, and fake reviews or hidden fees are illegal in many countries.",
      items: [{ t: "\"The #1 laptop in the world\" (no data to back it)", ok: true }, { t: "\"Battery never dies\"", ok: true }, { t: "Made-up 5-star quotes from 'customers'", ok: true }, { t: "\"Only $399\" when there's a required $80 setup fee", ok: true }, { t: "\"Weighs 1.2 kg\" (measured)", ok: false }, { t: "\"Free shipping on orders over $50\" (true)", ok: false }] },
    { id: "mk-crisis", tier: 3, curveball: true, type: "choice", from: ["Social media alert", "Alert"], subject: "URGENT: a post went viral, badly",
      msg: "A scheduled post went out during a real-world tragedy and looks tone-deaf. It's being shared thousands of times with angry comments.",
      ask: "First move?", hint: "Stop making it worse, then own it.",
      lesson: "In a brand crisis: pause scheduled posts, acknowledge quickly, apologize sincerely without excuses, then fix the process that caused it.",
      options: [{ t: "Pause all scheduled posts, take it down, and post a short, sincere apology", ok: true, fb: "The story fades within a day. People respect the quick, honest response." }, { t: "Delete it and say nothing", fb: "Screenshots exist. Silence looks like hiding." }, { t: "Argue with the commenters", fb: "Now that's the story." }, { t: "Keep posting as if nothing happened", fb: "Your next cheerful post made everything worse." }] }
  ]
});

/* ---------- Data analytics ---------- */
JOBS.push({
  id: "data", dept: "Data Analytics", floor: 12, icon: "bars", color: "#3b5bdb", role: "Data Analyst",
  blurb: "Turn messy data into answers people can act on.",
  mentor: { name: "Noor Haddad", title: "Analytics Lead", hello: "Hi {name}, welcome to Analytics! Our rule: clean data, honest charts, clear answers. If the data is shaky, say so." },
  tasks: [
    { id: "da-chart", tier: 1, type: "choice", from: ["Jordan Blake", "Sales"], subject: "What chart should I use?",
      msg: "I want to show how monthly sales changed over the last 12 months.", ask: "Best chart type?",
      hint: "Change over time is a line.",
      lesson: "Pick the chart for the question: line for trends over time, bar for comparing categories, pie only for a few parts of one whole, scatter for relationships.",
      options: [{ t: "Line chart", ok: true, fb: "Trends over time read best as a line." }, { t: "Pie chart", fb: "Pies show parts of a whole, not change over time." }, { t: "Table of 12 numbers", fb: "Accurate, but nobody sees the trend at a glance." }, { t: "3D exploding donut chart", fb: "Pretty and very hard to read." }] },
    { id: "da-cause", tier: 1, type: "choice", from: ["Victor Chen", "Operations"], subject: "Ice cream causes sunburn?",
      msg: "A report says: \"When ice cream sales go up, sunburns go up too. Should we stop selling ice cream?\"", ask: "What's going on?",
      hint: "Is there a third thing that causes both?",
      lesson: "Correlation isn't causation. Two things can rise together because a third factor (here, hot sunny weather) drives both.",
      options: [{ t: "Hot weather causes both. They're correlated, not cause and effect", ok: true, fb: "Exactly. Look for the hidden third factor." }, { t: "Ice cream causes sunburn", fb: "Nothing in the data shows one causes the other." }, { t: "Sunburn makes people buy ice cream", fb: "Still confusing correlation with causation." }, { t: "The data must be wrong", fb: "The data is fine. The conclusion is wrong." }] },
    { id: "da-types", tier: 1, type: "sort", from: ["Noor Haddad", "Analytics Lead"], subject: "Numbers or categories?",
      msg: "Before analyzing, label each column type. <b>Numeric</b> = you can do math on it. <b>Categorical</b> = labels or groups.", ask: "Sort the columns.",
      hint: "Can you calculate an average of it?",
      lesson: "Numeric data can be averaged and summed. Categorical data is counted and grouped. Mixing them up breaks your analysis.",
      buckets: ["Numeric", "Categorical"],
      items: [{ t: "Age", b: 0 }, { t: "Price", b: 0 }, { t: "Temperature", b: 0 }, { t: "City", b: 1 }, { t: "Product color", b: 1 }, { t: "Department", b: 1 }] },
    { id: "da-clean", tier: 2, type: "multi", from: ["Noor Haddad", "Analytics Lead"], subject: "Clean the customer data",
      msg: `<table class="tbl"><tr><th>#</th><th>Name</th><th>City</th><th>Age</th></tr><tr><td>1</td><td>Ana Ruiz</td><td>Boston</td><td>34</td></tr><tr><td>2</td><td>Ana Ruiz</td><td>Boston</td><td>34</td></tr><tr><td>3</td><td>Lee Park</td><td>Nwe York</td><td>29</td></tr><tr><td>4</td><td>Sam Cole</td><td>Denver</td><td></td></tr><tr><td>5</td><td>Kim Hale</td><td>Austin</td><td>230</td></tr><tr><td>6</td><td>Jo Banks</td><td>Seattle</td><td>41</td></tr></table>`,
      ask: "Select every row with a data problem.", hint: "Look for repeats, typos, blanks and impossible values.",
      lesson: "Data cleaning comes first: remove duplicates, fix typos, handle missing values and check impossible outliers. Bad data in means bad answers out.",
      items: [{ t: "Row 2: exact duplicate of row 1", ok: true }, { t: "Row 3: city typo", ok: true }, { t: "Row 4: missing age", ok: true }, { t: "Row 5: age 230 is impossible", ok: true }, { t: "Row 6", ok: false }, { t: "Row 1", ok: false }] },
    { id: "da-avg", tier: 2, type: "code", from: ["Noor Haddad", "Analytics Lead"], subject: "Write an average function",
      msg: "The dashboard needs a function that returns the average of a list of numbers. An empty list should return 0, not crash.", ask: "Write average(nums).",
      hint: "Add them up in a loop, then divide by <code>nums.length</code>. Check <code>if (nums.length === 0) return 0;</code> first.",
      lesson: "Mean = sum ÷ count. Always handle the empty case, or you'll divide by zero and get NaN on your dashboard.",
      fn: "average", starter: `function average(nums) {
  // return the mean of nums, or 0 if the list is empty
  return 0;
}
`,
      tests: [{ args: [[2, 4, 6]], want: 4 }, { args: [[10]], want: 10 }, { args: [[]], want: 0 }, { args: [[1, 2, 3, 4]], want: 2.5 }] },
    { id: "da-deadline", tier: 3, curveball: true, type: "choice", from: ["CEO's assistant", "Email"], subject: "URGENT: numbers for the board, by noon",
      msg: "The CEO needs last month's revenue for the board meeting at noon. One week of data is missing because of a system bug.", ask: "What do you send?",
      hint: "Never present a guess as a fact.",
      lesson: "Be transparent about data quality. Report what you know, flag the gap clearly, and give an estimate only if it's labeled as one.",
      options: [{ t: "The numbers you have, with a clear note about the missing week and a labeled estimate", ok: true, fb: "The CEO thanks you for the honesty. The board appreciates it too." }, { t: "Fill the missing week with made-up numbers so it looks complete", fb: "The real data came back different. Your credibility took a big hit." }, { t: "Send nothing until the data is fixed", fb: "The board met with no numbers at all." }, { t: "Send the partial total without mentioning the gap", fb: "Revenue looked 25% lower. Panic followed." }] }
  ]
});

/* ---------- random task generators: endless variety ---------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const r2 = n => Math.round(n * 100) / 100;
const fmtTime = mins => { mins = ((mins % 1440) + 1440) % 1440; return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`; };
const timeAnswers = mins => { const t = fmtTime(mins); const [h, m] = t.split(":"); return [t, h.padStart(2, "0") + ":" + m, h + "." + m, h.padStart(2, "0") + m]; };
const GENS = {
  it: [
    () => { const p = pick([24, 25, 27, 28, 29]), host = 32 - p, last = 256 - 2 ** host;
      return { id: "gen-it-subnet", tier: 2, type: "input", from: ["Raj Mehta", "Network Engineer"], subject: `Subnet a /${p} network`,
        msg: `A new team needs a <b>/${p}</b> network. Work out the numbers for the router.`, doc: { title: "Formula", html: "Host bits = 32 − prefix. Usable hosts = 2<sup>host bits</sup> − 2. Mask last octet = 256 − 2<sup>host bits</sup>." },
        ask: "Fill in the config.", hint: `32 − ${p} = ${host} host bits.`, lesson: "Usable hosts = 2^(32 − prefix) − 2. Smaller prefixes mean bigger networks.",
        fields: [{ label: "Usable hosts", answer: 2 ** host - 2 }, { label: "Subnet mask", answer: `255.255.255.${last === 256 ? 0 : last}` }] }; },
    () => { const gb = pick([2, 4, 5, 8, 10]), mbps = pick([40, 50, 80, 100, 200]);
      return { id: "gen-it-download", tier: 1, type: "input", from: ["Nina Park", "Marketing"], subject: "How long will this download take?",
        msg: `I need to download a ${gb} GB video file. Our connection is ${mbps} Mbps. How long will it take?`, doc: { title: "Bits vs bytes", html: "Internet speed is in megaBITS per second. Files are in BYTES. 1 byte = 8 bits, so 1 GB = 8,000 megabits." },
        ask: "Time in seconds?", hint: `${gb} × 8,000 ÷ ${mbps}.`, lesson: "Network speeds are in bits, file sizes in bytes. Multiply bytes by 8 before dividing by speed.",
        fields: [{ label: "Seconds", answer: gb * 8000 / mbps }] }; }
  ],
  cyber: [
    () => { const pin = Math.random() < .5, n = pin ? pick([4, 6]) : pick([4, 5]); const total = (pin ? 10 : 26) ** n;
      return { id: "gen-cy-combos", tier: 1, type: "input", from: ["Marcus Lee", "Security Lead"], subject: "How many guesses?",
        msg: `How many possible combinations does a ${n}-${pin ? "digit PIN (0–9)" : "letter password using only lowercase a–z"} have?`,
        ask: "Number of combinations.", hint: `${pin ? 10 : 26} choices per position, multiplied ${n} times.`, lesson: "Combinations = choices^length. Each extra character multiplies the work for an attacker, which is why length matters so much.",
        fields: [{ label: "Combinations", answer: total }] }; },
    () => { const w = pick(["FIREWALL", "PASSWORD", "MALWARE", "PHISHING", "SECURITY", "NETWORK", "BACKUP", "ENCRYPT"]), k = rnd(1, 6);
      const ct = w.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65));
      return { id: "gen-cy-caesar", tier: 2, type: "input", from: ["Marcus Lee", "Security Lead"], subject: "Decode the attacker's note",
        msg: `We found this word in a hacker's notes, scrambled with a Caesar cipher (each letter shifted forward by ${k}): <b><code>${ct}</code></b>`,
        ask: "What's the original word?", hint: `Shift every letter back by ${k}. A shifted back by 1 is Z.`, lesson: "The Caesar cipher shifts letters by a fixed amount. With only 25 possible keys, it's trivial to break, so never use homemade crypto.",
        fields: [{ label: "Word", answer: w }] }; }
  ],
  dev: [
    () => { if (Math.random() < .5) { const a = rnd(2, 9), b = rnd(1, 9), c = rnd(2, 4);
        return { id: "gen-dv-trace", tier: 1, type: "input", from: ["Sam Rivera", "Senior Engineer"], subject: "What does this print?", msg: "Read the code line by line.",
          doc: { title: "snippet.js", html: `<pre class="code">let x = ${a};\nx = x + ${b};\nx = x * ${c};\nconsole.log(x);</pre>` }, ask: "What number is printed?", hint: `Start with ${a}, add ${b}, then multiply by ${c}.`,
          lesson: "Trace code like a computer: track each variable's value one line at a time.", fields: [{ label: "Output", answer: (a + b) * c }] }; }
      const n = rnd(3, 8);
      return { id: "gen-dv-loop", tier: 2, type: "input", from: ["Sam Rivera", "Senior Engineer"], subject: "Trace the loop", msg: "What does this print?",
        doc: { title: "loop.js", html: `<pre class="code">let total = 0;\nfor (let i = 1; i &lt;= ${n}; i++) {\n  total += i;\n}\nconsole.log(total);</pre>` }, ask: "Output?", hint: `It adds 1 + 2 + ... + ${n}.`,
        lesson: "A for loop repeats code. Here it adds every number from 1 to n. Tracing loops by hand is a key debugging skill.", fields: [{ label: "Output", answer: n * (n + 1) / 2 }] }; },
    () => pick([
      { id: "gen-dv-temp", tier: 1, type: "code", from: ["Weather team", "Ticket"], subject: "Celsius to Fahrenheit", msg: "The weather widget needs a converter. Formula: F = C × 9 ÷ 5 + 32.", ask: "Write celsiusToF(c).", hint: "<code>return c * 9 / 5 + 32;</code>", lesson: "Turning a formula into code is mostly about operator order. Multiplication and division happen before addition.", fn: "celsiusToF", starter: "function celsiusToF(c) {\n  return 0;\n}\n", tests: [{ args: [0], want: 32 }, { args: [100], want: 212 }, { args: [-40], want: -40 }] },
      { id: "gen-dv-even", tier: 1, type: "code", from: ["QA Bot", "Testing"], subject: "Even or odd?", msg: "Write isEven(n) that returns true for even numbers.", ask: "Write isEven(n).", hint: "The remainder operator: <code>n % 2 === 0</code>.", lesson: "% gives the remainder of a division. n % 2 is 0 for even numbers. It's used everywhere, like striping table rows.", fn: "isEven", starter: "function isEven(n) {\n  return false;\n}\n", tests: [{ args: [4], want: true }, { args: [7], want: false }, { args: [0], want: true }] },
      { id: "gen-dv-max", tier: 2, type: "code", from: ["Data team", "Ticket"], subject: "Find the biggest sale", msg: "Write maxOf(list) that returns the largest number in a list. Don't use Math.max. Practice the loop!", ask: "Write maxOf(list).", hint: "Start with <code>let best = list[0];</code> then loop and replace best when you see something bigger.", lesson: "Keep a 'best so far' variable while looping. The same pattern finds minimums, longest names or top sellers.", fn: "maxOf", starter: "function maxOf(list) {\n  // no Math.max!\n  return 0;\n}\n", tests: [{ args: [[3, 9, 2]], want: 9 }, { args: [[-5, -2, -9]], want: -2 }, { args: [[7]], want: 7 }] },
      { id: "gen-dv-vowels", tier: 2, type: "code", from: ["Content team", "Ticket"], subject: "Count the vowels", msg: "Write countVowels(text) that counts a, e, i, o, u (upper or lower case).", ask: "Write countVowels(text).", hint: "Loop over <code>text.toLowerCase()</code> and check <code>\"aeiou\".includes(ch)</code>.", lesson: "Normalize text (lowercase) before checking it, and use includes() to test membership.", fn: "countVowels", starter: "function countVowels(text) {\n  let count = 0;\n  return count;\n}\n", tests: [{ args: ["hello"], want: 2 }, { args: ["AEIOU"], want: 5 }, { args: ["rhythm"], want: 0 }] }
    ])
  ],
  logi: [
    () => { const dep = pick([360, 390, 420, 450, 480, 510, 540]), sp = pick([60, 75, 80, 90]), h = pick([2, 2.5, 3, 3.5, 4]), br = pick([0, 30, 45]);
      const arr = dep + h * 60 + br;
      return { id: "gen-lg-eta", tier: 2, type: "input", from: ["Customer call", "Phone"], subject: "Customer wants an ETA",
        msg: `A truck leaves at ${fmtTime(dep)}, drives ${sp * h} km at ${sp} km/h${br ? `, and takes a ${br}-minute break` : " with no breaks"}.`,
        ask: "Arrival time (24-hour, like 13:05)?", hint: `${sp * h} ÷ ${sp} = ${h} hours of driving.`, lesson: "ETA = departure + distance ÷ speed + breaks. Always include required driver breaks.",
        fields: [{ label: "Arrival", answer: timeAnswers(arr) }] }; },
    () => { const pal = rnd(30, 95), cap = pick([22, 24, 26, 30]);
      return { id: "gen-lg-trucks", tier: 1, type: "input", from: ["Rosa Delgado", "Logistics Manager"], subject: "Book the trucks",
        msg: `This order is ${pal} pallets. Each trailer fits ${cap} pallets.`, ask: "How many trucks?", hint: `${pal} ÷ ${cap}, rounded up.`,
        lesson: "When you can't split a vehicle, always round up. Then look for ways to fill the empty space.", fields: [{ label: "Trucks", answer: Math.ceil(pal / cap) }] }; }
  ],
  wh: [
    () => { let sys, pct, k; do { sys = pick([100, 150, 200, 250, 300, 400, 500]); pct = pick([2, 4, 5, 6, 10]); k = sys * pct / 100; } while (!Number.isInteger(k));
      return { id: "gen-wh-shrink", tier: 2, type: "input", from: ["Inventory system", "Alert"], subject: "Count doesn't match",
        msg: `The system says this bin has ${sys} units. You counted ${sys - k}.`, doc: { title: "Formulas", html: "Variance = counted − system. Shrink % = missing ÷ system × 100." },
        ask: "Variance and shrink %?", hint: `${sys - k} − ${sys}. Then ${k} ÷ ${sys} × 100.`, lesson: "Variance shows how far off the count is. Shrink % compares it to the expected amount so bins of different sizes can be compared.",
        fields: [{ label: "Variance", answer: -k }, { label: "Shrink", answer: pct, suffix: "%" }] }; },
    () => { const per = rnd(6, 12), lay = rnd(3, 6), pp = per * lay, order = pp * rnd(2, 5) + rnd(1, pp - 1);
      return { id: "gen-wh-pallet", tier: 1, type: "input", from: ["Lou Martin", "Shift Supervisor"], subject: "Build the pallets",
        msg: `Each pallet layer holds ${per} boxes and we stack ${lay} layers high. The order is ${order} boxes.`, ask: "Fill in the plan.",
        hint: `Boxes per pallet = ${per} × ${lay}. Then divide the order and round up.`, lesson: "Pallet planning: boxes per layer × layers = boxes per pallet. Round the pallet count up, since a partial pallet still ships.",
        fields: [{ label: "Boxes per pallet", answer: pp }, { label: "Pallets needed", answer: Math.ceil(order / pp) }] }; }
  ],
  sales: [
    () => { const s = rnd(12, 45) * 1000, rate = pick([3, 4, 5, 6, 8]), bonus = s > 20000 ? 200 : 0;
      return { id: "gen-sl-comm", tier: 1, type: "input", from: ["Helen Park", "Accounting"], subject: "Commission check",
        msg: `You sold $${s.toLocaleString()} this month. Commission is ${rate}%, plus a $200 bonus if sales are over $20,000.`, ask: "Total commission?",
        hint: `${s.toLocaleString()} × ${rate / 100}${bonus ? ", plus 200" : ". No bonus this time"}.`, lesson: "Commission = sales × rate, plus any bonuses. Knowing your pay plan tells you which deals matter most.",
        fields: [{ label: "Commission", answer: s * rate / 100 + bonus, prefix: "$" }] }; },
    () => { const list = pick([800, 1250, 1500, 2400, 3200]), pct = pick([5, 10, 12, 15, 20]);
      return { id: "gen-sl-floor", tier: 2, type: "input", from: ["Prospect", "Email"], subject: "Best price request",
        msg: `List price is $${list.toLocaleString()}. You can discount up to ${pct}%.`, ask: "Lowest price you can quote?", hint: `${list} × (1 − ${pct / 100}).`,
        lesson: "Know your walk-away price before negotiating, and trade discounts for something in return.", fields: [{ label: "Lowest price", answer: r2(list * (1 - pct / 100)), prefix: "$" }] }; }
  ],
  acct: [
    () => { const items = [["Desk chair", rnd(1, 5), pick([95, 120, 150])], ["Monitor", rnd(1, 4), pick([160, 180, 220])], ["Notebook", rnd(5, 20), pick([3, 4, 5])]]; const tax = pick([5, 6, 8, 10]);
      const sub = items.reduce((s, i) => s + i[1] * i[2], 0), tx = r2(sub * tax / 100);
      return { id: "gen-ac-invoice", tier: 1, type: "input", from: ["Sales desk", "Invoice request"], subject: "Build an invoice",
        msg: "Please total up this order.", doc: { title: "Order", html: `<table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${items.map(i => `<tr><td>${i[0]}</td><td>${i[1]}</td><td>$${i[2]}</td></tr>`).join("")}</table><p>Sales tax: ${tax}%</p>` },
        ask: "Fill in the invoice.", hint: "Add up qty × price for each line, then tax = subtotal × rate.", lesson: "Invoice math: line totals → subtotal → tax → total. Rounding tax to the cent matters.",
        fields: [{ label: "Subtotal", answer: sub, prefix: "$" }, { label: "Tax", answer: tx, prefix: "$" }, { label: "Total", answer: r2(sub + tx), prefix: "$" }] }; },
    () => { const cost = rnd(10, 60) * 1000, salv = pick([0, 1000, 2000, 5000]), life = pick([4, 5, 8, 10]);
      return { id: "gen-ac-dep", tier: 2, type: "input", from: ["Helen Park", "Controller"], subject: "Depreciation",
        msg: `New equipment cost $${cost.toLocaleString()}, lasts ${life} years, and will be worth $${salv.toLocaleString()} at the end.`, doc: { title: "Straight-line", html: "(Cost − salvage) ÷ years" },
        ask: "Depreciation per year?", hint: `(${cost} − ${salv}) ÷ ${life}.`, lesson: "Straight-line depreciation spreads an asset's cost evenly over its useful life.",
        fields: [{ label: "Per year", answer: r2((cost - salv) / life), prefix: "$" }] }; }
  ],
  hr: [
    () => { const rate = rnd(15, 32), h = rnd(41, 52);
      return { id: "gen-hr-ot", tier: 2, type: "input", from: ["Payroll", "System"], subject: "Overtime pay",
        msg: `Hourly rate $${rate}. Worked ${h} hours. Overtime is 1.5× for hours over 40.`, ask: "Gross pay?", hint: `40 × ${rate} + ${h - 40} × ${rate * 1.5}.`,
        lesson: "Overtime pay = regular hours × rate + overtime hours × 1.5 × rate. Payroll errors destroy trust fast.", fields: [{ label: "Gross pay", answer: r2(40 * rate + (h - 40) * rate * 1.5), prefix: "$" }] }; },
    () => { const acc = pick([1, 1.25, 1.5, 1.75, 2]), mo = rnd(3, 12), used = rnd(0, Math.floor(acc * mo));
      return { id: "gen-hr-pto", tier: 1, type: "input", from: ["Employee question", "Email"], subject: "Vacation balance",
        msg: `An employee earns ${acc} days of PTO per month, has worked ${mo} months and used ${used} days.`, ask: "Balance?", hint: `${acc} × ${mo} − ${used}.`,
        lesson: "PTO balance = days earned − days used.", fields: [{ label: "Days left", answer: r2(acc * mo - used) }] }; }
  ],
  mgmt: [
    () => { const b = pick([40000, 50000, 80000, 120000]), p = pick([-10, -5, 4, 8, 12, 15, 20]);
      return { id: "gen-mg-var", tier: 2, type: "input", from: ["Finance", "Report"], subject: "Budget variance",
        msg: `Budget: $${b.toLocaleString()}. Actual spending: $${(b * (1 + p / 100)).toLocaleString()}.`, ask: "Variance % (use a minus sign if under budget)?",
        hint: "(actual − budget) ÷ budget × 100.", lesson: "Budget variance % shows how far spending is from plan. Explain big variances early.", fields: [{ label: "Variance", answer: p, suffix: "%" }] }; },
    () => { const A = rnd(2, 5), B = rnd(3, 8), C = rnd(2, 8), D = rnd(2, 5);
      return { id: "gen-mg-cpm", tier: 2, type: "input", from: ["Victor Chen", "Operations Director"], subject: "Project timeline",
        msg: "How soon can this project finish?", doc: { title: "Plan", html: `<table><tr><th>Task</th><th>Days</th><th>After</th></tr><tr><td>A</td><td>${A}</td><td>start</td></tr><tr><td>B</td><td>${B}</td><td>A</td></tr><tr><td>C</td><td>${C}</td><td>A</td></tr><tr><td>D</td><td>${D}</td><td>B and C</td></tr></table>` },
        ask: "Minimum days?", hint: "A, then the longer of B or C, then D.", lesson: "The critical path is the longest chain of dependent tasks. Speeding up anything else doesn't change the finish date.",
        fields: [{ label: "Days", answer: A + Math.max(B, C) + D }] }; }
  ],
  support: [
    () => { const open = rnd(96, 186) * 5, h = pick([1, 2, 4]);
      return { id: "gen-su-sla", tier: 1, type: "input", from: ["Ticket system", "SLA alert"], subject: "SLA deadline",
        msg: `A ticket arrived at ${fmtTime(open)}. Our SLA promises a first reply within ${h} hour${h > 1 ? "s" : ""}.`, ask: "Reply by (24-hour)?",
        hint: `Add ${h} hour${h > 1 ? "s" : ""} to ${fmtTime(open)}.`, lesson: "SLAs are promises with deadlines. Track the clock on every ticket.", fields: [{ label: "Reply by", answer: timeAnswers(open + h * 60) }] }; },
    () => { const days = rnd(5, 90), broken = Math.random() < .3;
      const right = broken ? 2 : days <= 30 ? 0 : days <= 60 ? 1 : 3;
      const labels = ["Full refund", "Store credit", "Free warranty repair or replacement", "Politely decline the return"];
      return { id: "gen-su-refund", tier: 2, type: "choice", from: ["Customer email", "Email"], subject: "Return request",
        msg: `A customer bought a speaker ${days} days ago. ${broken ? "It stopped working (a defect)." : "It works fine; they just changed their mind."}`,
        doc: { title: "Return policy", html: "Days 0–30: full refund. Days 31–60: store credit. After 60 days: no returns. Defective items: free repair or replacement for 1 year." },
        ask: "What do you offer?", hint: broken ? "Defects have their own rule." : `Find day ${days} in the policy.`, lesson: "Apply policy consistently: it's fair to every customer. Defects under warranty are handled separately from change-of-mind returns.",
        options: labels.map((t, i) => ({ t, ok: i === right, fb: i === right ? "Correct per policy." : "That doesn't match the policy for this case." })) }; }
  ],
  mkt: [
    () => { const imp = pick([20000, 50000, 80000, 120000]), ctr = pick([0.5, 1, 1.5, 2, 2.5, 3]);
      return { id: "gen-mk-ctr", tier: 1, type: "input", from: ["Ads dashboard", "Report"], subject: "Click-through rate",
        msg: `Our ad was shown ${imp.toLocaleString()} times and clicked ${(imp * ctr / 100).toLocaleString()} times.`, ask: "CTR (%)?", hint: "clicks ÷ impressions × 100.",
        lesson: "CTR (click-through rate) = clicks ÷ impressions. It tells you how appealing an ad is to people who see it.", fields: [{ label: "CTR", answer: ctr, suffix: "%" }] }; },
    () => { const spend = pick([500, 1000, 2000, 2500]), x = pick([0.5, 1.5, 2, 3, 4, 5]);
      return { id: "gen-mk-roas", tier: 2, type: "input", from: ["Mia Torres", "Marketing Director"], subject: "Was the campaign worth it?",
        msg: `We spent $${spend.toLocaleString()} on ads and they brought in $${(spend * x).toLocaleString()} in sales.`, ask: "ROAS (revenue ÷ ad spend)?",
        hint: `${spend * x} ÷ ${spend}.`, lesson: "ROAS (return on ad spend) = revenue ÷ spend. Below 1 means the ads lost money before even counting product costs.", fields: [{ label: "ROAS", answer: x, suffix: "×" }] }; }
  ],
  data: [
    () => { const n = pick([5, 6]); const a = Array.from({ length: n }, () => rnd(2, 40)); const s = a.slice().sort((x, y) => x - y);
      const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; const mean = r2(a.reduce((x, y) => x + y, 0) / n);
      return { id: "gen-da-stats", tier: 1, type: "input", from: ["Noor Haddad", "Analytics Lead"], subject: "Mean and median",
        msg: `Daily orders this week: <b>${a.join(", ")}</b>`, ask: "Work out the mean and median.", hint: "Mean = sum ÷ count. Median = middle value after sorting (average the two middle ones if the count is even).",
        lesson: "Mean is sensitive to outliers; median isn't. That's why house prices and salaries are usually reported as medians.",
        fields: [{ label: "Mean", answer: mean, tol: .02 }, { label: "Median", answer: med }] }; },
    () => { const o = rnd(20, 90) * 100, n = rnd(15, 120) * 100;
      return { id: "gen-da-pct", tier: 1, type: "input", from: ["Jordan Blake", "Sales"], subject: "Percent change",
        msg: `Website visits went from ${o.toLocaleString()} last month to ${n.toLocaleString()} this month.`, ask: "Percent change (1 decimal, minus if it dropped)?",
        hint: "(new − old) ÷ old × 100.", lesson: "Percent change = (new − old) ÷ old × 100. Always divide by the OLD number.", fields: [{ label: "Change", answer: Math.round((n - o) / o * 1000) / 10, tol: .11, suffix: "%" }] }; }
  ]
};

/* ---------- multi-day projects (3 stages, one per shift) ---------- */
const PROJECTS = {
  it: { name: "Open the new branch office", stages: ["it-subnet", "it-ports", "it-triage"] },
  cyber: { name: "Stop the phishing campaign", stages: ["cy-phish", "cy-alerts", "cy-ir"] },
  dev: { name: "Black Friday checkout", stages: ["dv-cart", "dv-disc", "dv-git"] },
  logi: { name: "Expand to Canada", stages: ["lg-intl", "lg-trucks", "lg-rop"] },
  wh: { name: "Redesign the warehouse", stages: ["wh-zones", "wh-route", "wh-count"] },
  sales: { name: "Land the BigCo account", stages: ["sl-open", "sl-obj", "sl-floor"] },
  acct: { name: "Year-end close", stages: ["ac-3way", "ac-rec", "ac-dep"] },
  hr: { name: "Hire a new team", stages: ["hr-hire", "hr-legal", "hr-onboard"] },
  mgmt: { name: "Deliver the Q3 project", stages: ["mg-smart", "mg-cpm", "mg-budget"] },
  support: { name: "Clear the refund backlog", stages: ["su-route", "su-refund", "su-sla"] },
  mkt: { name: "Launch the Brightline Student", stages: ["mk-audience", "mk-launch", "mk-ab"] },
  data: { name: "Build the sales dashboard", stages: ["da-clean", "da-avg", "da-chart"] }
};

/* ---------- rush days ---------- */
const RUSH = { it: "Company-wide outage", cyber: "Active attack day", dev: "Launch day", logi: "Peak season", wh: "Black Friday rush", sales: "End of quarter", acct: "Audit week", hr: "Hiring fair", mgmt: "Reorg week", support: "Product recall", mkt: "Product launch", data: "Board meeting prep" };

/* ---------- career paths (rough US salary ranges, vary a lot by location) ---------- */
const PATHS = {
  it: [["IT Support Technician", "$40k–60k"], ["Systems Administrator", "$65k–90k"], ["Network Engineer", "$80k–120k"], ["IT Manager", "$110k–160k"]],
  cyber: [["SOC Analyst", "$55k–80k"], ["Security Engineer", "$100k–150k"], ["Security Architect", "$140k–190k"], ["CISO", "$180k+"]],
  dev: [["Junior Developer", "$65k–95k"], ["Software Engineer", "$100k–140k"], ["Senior Engineer", "$140k–190k"], ["Engineering Manager", "$180k+"]],
  logi: [["Logistics Coordinator", "$40k–55k"], ["Logistics Analyst", "$55k–75k"], ["Supply Chain Manager", "$85k–120k"], ["Supply Chain Director", "$130k+"]],
  wh: [["Warehouse Associate", "$32k–42k"], ["Shift Supervisor", "$45k–60k"], ["Warehouse Manager", "$60k–85k"], ["Operations Manager", "$80k–110k"]],
  sales: [["Sales Rep", "$40k–60k + commission"], ["Account Executive", "$60k–90k + commission"], ["Sales Manager", "$100k–150k"], ["VP of Sales", "$170k+"]],
  acct: [["Accounts Clerk", "$38k–50k"], ["Staff Accountant", "$55k–70k"], ["Senior Accountant", "$70k–90k"], ["Controller", "$110k–160k"]],
  hr: [["HR Coordinator", "$42k–55k"], ["HR Generalist", "$55k–75k"], ["HR Manager", "$80k–115k"], ["HR Director", "$120k+"]],
  mgmt: [["Team Lead", "$60k–85k"], ["Manager", "$85k–120k"], ["Senior Manager", "$110k–150k"], ["Director", "$140k+"]],
  support: [["Support Agent", "$33k–45k"], ["Tier 2 Specialist", "$45k–58k"], ["Support Team Lead", "$55k–75k"], ["Support Manager", "$75k–110k"]],
  mkt: [["Marketing Coordinator", "$42k–58k"], ["Marketing Specialist", "$55k–75k"], ["Marketing Manager", "$85k–130k"], ["Marketing Director", "$140k+"]],
  data: [["Data Analyst", "$60k–80k"], ["Senior Analyst", "$85k–110k"], ["Data Scientist", "$110k–150k"], ["Analytics Manager", "$130k+"]]
};

/* ---------- glossary ---------- */
const GLOSSARY = {
  "DNS": ["it", "Domain Name System: the internet's phone book that turns names like brightline.com into IP addresses."],
  "IP address": ["it", "A number that identifies a device on a network, like 10.0.4.57."],
  "subnet": ["it", "A smaller slice of a network. The /number says how many addresses it holds."],
  "port": ["it", "A numbered door on a computer for a specific service, like 443 for HTTPS."],
  "firewall": ["it", "A filter that allows or blocks network traffic based on rules."],
  "ticket": ["support", "A logged request for help that's tracked until it's solved."],
  "phishing": ["cyber", "Fake messages that trick people into clicking links, opening files or giving up passwords."],
  "ransomware": ["cyber", "Malware that encrypts files and demands payment to unlock them."],
  "brute force": ["cyber", "Guessing passwords over and over until one works."],
  "SQL injection": ["cyber", "Sneaking database commands into a form field to attack a database."],
  "MFA": ["cyber", "Multi-factor authentication: proving it's you with two things, like a password plus a phone code."],
  "hash": ["cyber", "A one-way fingerprint of data. You can't turn it back into the original."],
  "false positive": ["cyber", "An alert that looks like a threat but isn't."],
  "incident response": ["cyber", "The step-by-step plan for handling a security breach."],
  "git": ["dev", "A tool that tracks every change to code so teams can work together and undo mistakes."],
  "branch": ["dev", "A separate copy of the code where you can work without affecting everyone else."],
  "pull request": ["dev", "A request for teammates to review your code changes before they're merged."],
  "function": ["dev", "A reusable block of code that takes inputs and returns an output."],
  "loop": ["dev", "Code that repeats, like going through every item in a list."],
  "lead time": ["logi", "How long it takes from placing an order until it arrives."],
  "reorder point": ["logi", "The stock level that tells you it's time to order more."],
  "safety stock": ["logi", "Extra inventory kept in case demand spikes or deliveries are late."],
  "freight": ["logi", "Large shipments moved by truck, train, ship or plane."],
  "customs": ["logi", "Government checks on goods crossing a border, with paperwork and fees."],
  "ETA": ["logi", "Estimated time of arrival."],
  "SKU": ["wh", "Stock keeping unit: a unique code for each product."],
  "FEFO": ["wh", "First expired, first out: ship the stock that expires soonest."],
  "cycle count": ["wh", "Counting a small part of inventory regularly instead of everything at once."],
  "shrink": ["wh", "Inventory lost to theft, damage or mistakes."],
  "hazmat": ["wh", "Hazardous materials, like chemicals or lithium batteries, that need special handling."],
  "pallet": ["wh", "A flat wooden or plastic base that goods are stacked on for moving with a forklift."],
  "pipeline": ["sales", "All the deals in progress, organized by stage."],
  "commission": ["sales", "Pay based on a percentage of the sales you make."],
  "objection": ["sales", "A concern a customer raises before buying, like price."],
  "asset": ["acct", "Something the company owns that has value, like cash or equipment."],
  "liability": ["acct", "Something the company owes, like a loan or unpaid bills."],
  "debit": ["acct", "The left side of a journal entry. Increases assets and expenses."],
  "credit": ["acct", "The right side of a journal entry. Increases liabilities and income."],
  "depreciation": ["acct", "Spreading an asset's cost over the years it's used."],
  "invoice": ["acct", "A bill sent to a customer listing what they owe."],
  "reconciliation": ["acct", "Checking two sets of records (like books and bank) match, and explaining differences."],
  "PTO": ["hr", "Paid time off: vacation or personal days you're paid for."],
  "overtime": ["hr", "Hours worked beyond the normal week, often paid at 1.5×."],
  "onboarding": ["hr", "Everything that helps a new hire get set up and productive."],
  "SMART": ["mgmt", "Goals that are Specific, Measurable, Achievable, Relevant and Time-bound."],
  "critical path": ["mgmt", "The longest chain of dependent tasks; it sets the project finish date."],
  "budget": ["mgmt", "A plan for how much money can be spent."],
  "SLA": ["support", "Service level agreement: a promised response or fix time."],
  "refund": ["support", "Money given back to a customer."],
  "escalate": ["support", "Pass an issue up to someone with more authority or expertise."],
  "A/B test": ["mkt", "Showing two versions to different people to see which performs better."],
  "CTR": ["mkt", "Click-through rate: clicks ÷ times shown."],
  "ROAS": ["mkt", "Return on ad spend: revenue ÷ ad cost."],
  "conversion": ["mkt", "When someone does what you wanted, like buying or signing up."],
  "median": ["data", "The middle value when numbers are sorted."],
  "mean": ["data", "The average: sum ÷ count."],
  "outlier": ["data", "A value far from the others, sometimes an error."],
  "correlation": ["data", "Two things changing together. It doesn't prove one causes the other."],
  "dashboard": ["data", "A screen of charts and numbers that shows how things are going."]
};

/* ---------- skills ---------- */
const SKILLS = [
  { id: "learner", name: "Fast Learner", desc: "+15% XP from every task", cost: 1 },
  { id: "people", name: "People Person", desc: "Visitors wait 25% longer", cost: 1 },
  { id: "coffee", name: "Coffee Lover", desc: "Coffee restores twice the energy", cost: 1 },
  { id: "detail", name: "Detail Oriented", desc: "Your first mistake each shift costs half", cost: 2, req: "learner" },
  { id: "calm", name: "Calm Under Pressure", desc: "Urgent timers +30%, stress builds 25% slower", cost: 2, req: "people" },
  { id: "stamina", name: "Stamina", desc: "Energy drains 30% slower", cost: 2, req: "coffee" },
  { id: "favorite", name: "Mentor's Favorite", desc: "One free mentor hint every shift", cost: 3, req: "detail" },
  { id: "negotiator", name: "Negotiator", desc: "+10% pay on every shift", cost: 3, req: "calm" },
  { id: "unstoppable", name: "Unstoppable", desc: "Low energy no longer slows you down", cost: 3, req: "stamina" }
];

/* ---------- shop ---------- */
const HOMES = [
  { name: "Mom's couch", rent: 0, perf: 0, desc: "Free. Mom asks about your day. A lot." },
  { name: "Shared flat", rent: 35, perf: 2, desc: "Your own room, a roommate who eats your food. +2% starting performance." },
  { name: "Studio apartment", rent: 70, perf: 4, desc: "All yours. Small but cozy. +4% starting performance." },
  { name: "Downtown 1-bedroom", rent: 130, perf: 7, desc: "Short commute, real kitchen. +7% starting performance." },
  { name: "Skyline loft", rent: 220, perf: 10, desc: "Huge windows over the city. +10% starting performance." }
];
const CARS = [
  { name: "Bus pass", price: 0, speed: 0, desc: "Gets you there. Eventually." },
  { name: "Bicycle", price: 250, speed: .08, desc: "Arrive energized: +8% walking speed at work." },
  { name: "Scooter", price: 900, speed: .15, desc: "+15% walking speed at work." },
  { name: "Used hatchback", price: 2800, speed: .22, rep: 3, desc: "+22% walking speed, +3 reputation." },
  { name: "Electric sports car", price: 12000, speed: .3, rep: 10, desc: "+30% walking speed, +10 reputation." }
];
const DECOR = [
  { id: "plant", name: "Desk plant", price: 40, desc: "+2 reputation. It's a plant." },
  { id: "mug", name: "Favorite mug", price: 15, desc: "Coffee breaks restore +5 extra energy." },
  { id: "poster", name: "Motivational poster", price: 60, desc: "Stress builds 10% slower." },
  { id: "lamp", name: "Desk lamp", price: 80, desc: "Looks great at overtime." },
  { id: "figure", name: "Robot figurine", price: 120, desc: "Coworkers ask about it. +1 heart when you chat." },
  { id: "monitor", name: "Second monitor", price: 450, desc: "First mentor hint each shift is free." },
  { id: "chair", name: "Ergonomic chair", price: 300, desc: "+5% starting performance." },
  { id: "watch", name: "Smart watch", price: 600, desc: "Visitors wait 20% longer." }
];

/* ---------- achievements ---------- */
const ACH = [
  ["first", "First Day Done", "Finish your first shift."], ["five", "Five Stars", "Earn a 5-star shift."], ["flawless", "Flawless", "Finish a shift with 5+ tasks and no mistakes."],
  ["urgent5", "Firefighter", "Handle 5 urgent tasks correctly."], ["coffee20", "Coffee Addict", "Drink 20 coffees."], ["dog", "Good Boy", "Pet the office dog."],
  ["fire", "Hero of Floor " + "?", "Put out the printer fire."], ["ceo", "CEO Approved", "Answer the CEO's question correctly."], ["promo", "Moving Up", "Get promoted."],
  ["senior", "Seasoned Pro", "Reach Senior in any job."], ["lead", "Leader", "Reach Lead in any job."], ["explore5", "Jack of All Trades", "Work in 5 departments."],
  ["all", "Company Legend", "Work in every department."], ["rich", "Nest Egg", "Have $10,000 in the bank."], ["loft", "Living the Dream", "Move into the Skyline loft."],
  ["car", "Got Wheels", "Buy any vehicle."], ["cert1", "Certified", "Earn a training certificate."], ["cert5", "Lifelong Learner", "Earn 5 certificates."],
  ["streak3", "On a Roll", "Complete the daily challenge 3 days in a row."], ["project", "Project Finisher", "Complete a multi-day project."], ["raise", "Raise Earned", "Ace a boss review."],
  ["friend", "Work Bestie", "Reach 5 hearts with a coworker."], ["rush", "Rush Survivor", "Get 4+ stars on a rush day."], ["words20", "Wordsmith", "Collect 20 glossary terms."],
  ["lessons50", "Walking Manual", "Learn 50 lessons."], ["skill", "Specialist", "Unlock your first skill."], ["track", "Career Climber", "Finish a career track."], ["salad", "Eats the Greens", "Pick 5 healthy lunches."], ["eow", "Employee of the Week", "Earn Employee of the Week."], ["chatty", "Elevator Pitch", "Have 10 friendly elevator chats."], ["petpal", "Best Friend", "Get your pet to 5 love."], ["interview", "Nailed It", "Ace a job interview."], ["pigeon", "Pigeon Whisperer", "Shoo a pigeon out of the office."], ["hustler", "Side Hustler", "Finish 10 side hustles."], ["story", "The End?", "Finish the story campaign."], ["rival", "Friendly Competition", "Beat Jax 5 times."], ["founder", "Founder", "Start your own business."], ["boss", "The Boss", "Hire 3 people."], ["tycoon", "Tycoon", "Make $2,000 total business profit."], ["endless", "Unstoppable Mind", "Score 25 in the Endless Drill."], ["party", "Life of the Party", "Give a great toast at an office party."], ["fashion", "Fashionista", "Own 4 wardrobe items."]
];
ACH[6][1] = "Fire Marshal";

/* ---------- department scenes ---------- */
const THEMES = {
  it: { floor: "carpet", carpet: "#4f5563", wall: "#cdb79b", panel: "#5b5f9e", headset: true, props: ["servers", "screen:NETWORK STATUS"] },
  cyber: { floor: "carpet", carpet: "#34364f", wall: "#3a3d52", panel: "#3c3f6e", headset: true, dim: true, props: ["soc", "screen:THREAT MAP"] },
  dev: { floor: "wood", wall: "#d8c3a5", panel: "#4f8a7f", props: ["whiteboard", "beanbags", "screen:BUILD PASSING"] },
  logi: { floor: "concrete", wall: "#c7b79c", panel: "#7a6a9e", layout: "logistics", props: ["screen:DISPATCH"] },
  wh: { floor: "concrete", wall: "#bfae92", layout: "warehouse", props: [] },
  sales: { floor: "carpet", carpet: "#555a52", wall: "#d4bc98", panel: "#6a5aa8", headset: true, props: ["screen:Q4 SALES", "whiteboard"] },
  acct: { floor: "carpet", carpet: "#565c5e", wall: "#cbb89e", panel: "#4f7f78", props: ["cabinets", "screen:CASH FLOW"] },
  hr: { floor: "carpet", carpet: "#5e5459", wall: "#d8bfae", panel: "#8a5a7a", props: ["meeting", "screen:WELCOME NEW HIRES"] },
  mgmt: { floor: "wood", wall: "#cdbda6", panel: "#5a6577", props: ["meeting", "screen:Q3 GOALS"] },
  support: { floor: "carpet", carpet: "#57534f", wall: "#d6bb92", panel: "#5b5f9e", headset: true, props: ["screen:CALLS IN QUEUE", "cabinets"] },
  mkt: { floor: "wood", wall: "#dcc0a8", panel: "#a8574a", props: ["posters", "beanbags", "screen:LAUNCH WEEK"] },
  data: { floor: "carpet", carpet: "#4d5265", wall: "#c9b9a2", panel: "#4c5fa8", props: ["screen:DASHBOARD", "servers"] }
};
