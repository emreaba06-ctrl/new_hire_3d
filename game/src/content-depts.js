/* =====================================================================
   NEW DEPARTMENTS: Hospital, Restaurant Kitchen, Retail Store, Bank.
   ===================================================================== */
ICONS.cross = '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>';
ICONS.pan = '<circle cx="10" cy="13" r="6"/><path d="M16 13h6M7 9c0-2 1-3 0-5M11 9c0-2 1-3 0-5"/>';
ICONS.cart = '<path d="M3 4h2l2.5 11h11L21 8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>';
ICONS.bank = '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>';

/* ---------- Hospital ---------- */
JOBS.push({
  id: "med", dept: "Hospital Ward", floor: 13, icon: "cross", color: "#d64545", role: "Nursing Assistant",
  blurb: "Care for patients, take vital signs, keep everyone safe.",
  mentor: { name: "Grace Adeyemi", title: "Charge Nurse", hello: "Welcome to the ward, {name}! Patients come first, safety always. Wash your hands, check ID bands, and if something looks wrong, tell me right away." },
  tasks: [
    { id: "med-hygiene", tier: 1, type: "choice", from: ["Grace Adeyemi", "Charge Nurse"], subject: "Hand hygiene check",
      msg: "Infection control is auditing the ward today.", ask: "When should you clean your hands?",
      hint: "Germs travel from patient to patient on hands.",
      lesson: "Clean your hands before and after every patient contact, before clean procedures, and after touching body fluids or patient surroundings. It's the single best way to stop infections spreading.",
      options: [{ t: "Before and after every patient contact", ok: true, fb: "Exactly. That's the core rule of infection control." }, { t: "Only when they look dirty", fb: "Most germs are invisible." }, { t: "At the start and end of the shift", fb: "You'd carry germs between every patient in between." }, { t: "Gloves mean you never need to", fb: "Gloves can tear and get contaminated. Clean hands before and after using them." }] },
    { id: "med-vitals", tier: 1, type: "order", from: ["Grace Adeyemi", "Charge Nurse"], subject: "Taking vital signs",
      msg: "Room 4 needs a full set of vital signs.", ask: "Put the steps in order.",
      hint: "Make sure you have the right patient first.",
      lesson: "Vital signs routine: confirm the patient's identity, explain, clean your hands, measure (temperature, pulse, breathing, blood pressure, oxygen), then record and report anything abnormal.",
      items: ["Introduce yourself and check the patient's ID band", "Explain what you're going to do", "Clean your hands", "Measure temperature, pulse, breathing, blood pressure and oxygen", "Record the results and report anything abnormal"] },
    { id: "med-sort", tier: 2, type: "sort", from: ["Grace Adeyemi", "Charge Nurse"], subject: "Normal or report it?",
      msg: "Here are this morning's adult readings. Which ones should you report to the nurse right away?",
      doc: { title: "Typical adult resting ranges", html: "Temperature: 36.1–37.2 °C<br>Pulse: 60–100 beats per minute<br>Breathing: 12–20 per minute<br>Blood pressure: under 130/80<br>Oxygen saturation: 95–100%" },
      ask: "Sort each reading.", hint: "Compare each one to the ranges in the attachment.",
      lesson: "Know normal ranges so you can spot trouble early. When a reading is out of range, report it right away. Nursing assistants observe and report; nurses assess and decide.",
      buckets: ["Normal", "Report it"],
      items: [{ t: "Temperature 36.8 °C", b: 0 }, { t: "Pulse 72", b: 0 }, { t: "Breathing 16 per minute", b: 0 }, { t: "Oxygen 98%", b: 0 }, { t: "Temperature 39.4 °C", b: 1 }, { t: "Pulse 128 at rest", b: 1 }, { t: "Blood pressure 182/110", b: 1 }, { t: "Oxygen 88%", b: 1 }] },
    { id: "med-intake", tier: 2, type: "input", from: ["Grace Adeyemi", "Charge Nurse"], subject: "Fluid intake record",
      msg: "Mr. Lopez is on fluid monitoring. Today he drank: 240 mL of juice and 180 mL of coffee at breakfast, then 350 mL of water and 120 mL of soup at lunch.",
      ask: "Total intake so far?", hint: "Add all four amounts.",
      lesson: "Intake and output records help nurses spot dehydration or fluid overload. Measure carefully and write it down right away, not from memory at the end of the shift.",
      fields: [{ label: "Total", answer: 890, suffix: "mL" }] },
    { id: "med-fall", tier: 2, type: "choice", from: ["Mrs. Patel (patient)", "Room 7"], subject: "\"I'll just walk to the bathroom\"",
      msg: "Mrs. Patel has a red 'high fall risk' band. She says: \"I don't want to bother anyone, I'll walk to the bathroom by myself.\"", ask: "What do you do?",
      hint: "What does the red band mean?",
      lesson: "Falls are a top cause of hospital injury. For fall-risk patients: stay with them, use non-slip socks, keep the call light in reach, and never leave them to walk alone.",
      options: [{ t: "Kindly tell her you'll help, put on non-slip socks, and walk with her", ok: true, fb: "She gets there safely and thanks you." }, { t: "Let her go, she seems steady", fb: "She slipped on the way. A preventable fall." }, { t: "Tell her to wait until the nurse is free", fb: "She tried anyway when you left." }, { t: "Give her a walker and leave", fb: "Equipment helps, but fall-risk patients need supervision." }] },
    { id: "med-fallen", tier: 3, curveball: true, type: "choice", from: ["Visitor", "Hallway"], subject: "URGENT: patient on the floor",
      msg: "A visitor shouts: \"Someone's on the floor in room 9!\" You find an elderly patient lying beside the bed.", ask: "First move?",
      hint: "Your safety and the patient's both matter. Don't do it alone.",
      lesson: "If a patient falls: call for help (call light), check if they respond and are breathing, stay with them, and don't lift them alone. Moving them wrongly can make injuries worse.",
      options: [{ t: "Press the call light for help, check they're responsive and breathing, and stay with them", ok: true, fb: "The nurse arrives in seconds and assesses them safely." }, { t: "Lift them back into bed yourself right away", fb: "Lifting alone can worsen a hip fracture and hurt your back." }, { t: "Go find a nurse and leave them alone", fb: "Never leave a fallen patient alone. Use the call light." }, { t: "Tell the visitor to help you lift", fb: "Untrained lifting risks injury to everyone." }] }
  ]
});

/* ---------- Restaurant kitchen ---------- */
JOBS.push({
  id: "chef", dept: "Restaurant Kitchen", floor: 14, icon: "pan", color: "#e67e22", role: "Line Cook",
  blurb: "Cook fast, cook safe, keep the tickets moving.",
  mentor: { name: "Antonio Reyes", title: "Head Chef", hello: "Yes chef! Welcome to my kitchen, {name}. Clean as you go, temps matter, and when I call an order, you answer. Let's cook." },
  tasks: [
    { id: "chef-zone", tier: 1, type: "choice", from: ["Antonio Reyes", "Head Chef"], subject: "The danger zone",
      msg: "Health inspector visit next week. Quick quiz.", ask: "In what temperature range do bacteria grow fastest?",
      hint: "It's between fridge-cold and cooking-hot.",
      lesson: "The danger zone is about 5–60 °C (40–140 °F). Keep cold food cold, hot food hot, and don't leave food sitting in between for more than two hours.",
      options: [{ t: "5–60 °C (40–140 °F)", ok: true, fb: "Correct. Keep food out of that range." }, { t: "Below 0 °C", fb: "Freezing stops bacteria from growing." }, { t: "Above 75 °C", fb: "That's cooking temperature: it kills bacteria." }, { t: "Only at room temperature exactly", fb: "The danger zone is a wide range, not one temperature." }] },
    { id: "chef-boards", tier: 1, type: "sort", from: ["Antonio Reyes", "Head Chef"], subject: "Color-coded cutting boards",
      msg: "Our kitchen uses color-coded boards to stop cross-contamination.", ask: "Which board for each food?",
      doc: { title: "Our board colors", html: "Red: raw meat · Yellow: raw poultry · Blue: raw fish · Green: fruit and vegetables" },
      hint: "Read the chart in the attachment.",
      lesson: "Color coding keeps raw meat juices away from ready-to-eat food. Color systems vary by kitchen, so learn your kitchen's chart.",
      buckets: ["Red", "Yellow", "Blue", "Green"],
      items: [{ t: "Ground beef", b: 0 }, { t: "Pork chops", b: 0 }, { t: "Chicken breast", b: 1 }, { t: "Turkey", b: 1 }, { t: "Salmon", b: 2 }, { t: "Shrimp", b: 2 }, { t: "Lettuce", b: 3 }, { t: "Tomatoes", b: 3 }] },
    { id: "chef-ticket", tier: 2, type: "order", from: ["Antonio Reyes", "Head Chef"], subject: "Ticket to plate",
      msg: "A new ticket just printed: two burgers, medium.", ask: "Put the steps in order.",
      hint: "You can't plate what you haven't cooked.",
      lesson: "Line flow: read the ticket, gather your prepped ingredients (mise en place), cook to a safe temperature, plate and check quality, then call it for pickup.",
      items: ["Read the ticket", "Grab your prepped ingredients (mise en place)", "Cook to a safe temperature", "Plate it and check quality", "Call \"order up\" for pickup"] },
    { id: "chef-scale", tier: 2, type: "input", from: ["Antonio Reyes", "Head Chef"], subject: "Scale the recipe",
      msg: "Our pasta recipe serves 4 and uses 300 g of pasta. We have a party of 10.", ask: "How much pasta do we need?",
      hint: "Find the amount per person, then multiply by 10.",
      lesson: "Scaling a recipe: divide by the original servings to get the amount per serving, then multiply by the new servings. 300 ÷ 4 × 10 = 750 g.",
      fields: [{ label: "Pasta", answer: 750, suffix: "g" }] },
    { id: "chef-temp", tier: 2, type: "choice", from: ["Antonio Reyes", "Head Chef"], subject: "Is the chicken done?",
      msg: "You're checking a chicken breast with a probe thermometer.", ask: "What's the minimum safe internal temperature?",
      hint: "Poultry needs the highest temperature of the common meats.",
      lesson: "Chicken must reach 74 °C (165 °F) inside. Always check with a thermometer in the thickest part; color alone doesn't tell you.",
      options: [{ t: "74 °C (165 °F)", ok: true, fb: "Right. Safe to serve." }, { t: "55 °C (130 °F)", fb: "That's rare beef territory. Unsafe for chicken." }, { t: "63 °C (145 °F)", fb: "That's for whole cuts of beef or pork, not poultry." }, { t: "When it looks white", fb: "Color isn't reliable. Use a thermometer." }] },
    { id: "chef-fire", tier: 3, curveball: true, type: "choice", from: ["Line cook", "Kitchen"], subject: "URGENT: grease fire!",
      msg: "A pan of oil on the stove just burst into flames.", ask: "What do you do?",
      hint: "Water and hot oil explode.",
      lesson: "Grease fire: turn off the heat, cover the pan with a metal lid to smother it, or use a Class K extinguisher. Never use water: it makes burning oil explode.",
      options: [{ t: "Turn off the heat and smother it with a metal lid (or use the Class K extinguisher)", ok: true, fb: "Fire's out. Nobody hurt." }, { t: "Throw water on it", fb: "The oil exploded in a fireball. Never use water on grease." }, { t: "Carry the pan to the sink", fb: "Moving burning oil spreads the fire and burns you." }, { t: "Fan the flames to blow them out", fb: "More oxygen makes the fire bigger." }] }
  ]
});

/* ---------- Retail store ---------- */
JOBS.push({
  id: "retail", dept: "Retail Store", floor: 15, icon: "cart", color: "#7b4bb5", role: "Sales Associate",
  blurb: "Help shoppers, run the register, keep the shelves full.",
  mentor: { name: "Tasha Brooks", title: "Store Manager", hello: "Welcome to the store, {name}! Greet everyone, keep the shelves tidy, and count change back carefully. Happy customers come back." },
  tasks: [
    { id: "retail-greet", tier: 1, type: "choice", from: ["Tasha Brooks", "Store Manager"], subject: "A shopper walks in",
      msg: "A customer walks in and starts looking around.", ask: "Best way to greet them?",
      hint: "Friendly, quick, and not pushy.",
      lesson: "Greet customers within about 10 seconds with a friendly, open question. It makes them feel welcome and also discourages shoplifting.",
      options: [{ t: "Smile and say \"Hi! Let me know if you're looking for anything special.\"", ok: true, fb: "They smile back and ask you about headphones." }, { t: "Ignore them until they ask", fb: "They felt invisible and left." }, { t: "Follow them around every aisle", fb: "Too pushy. They left uncomfortable." }, { t: "Ask \"Can I help you?\" from across the store", fb: "Most people say \"just looking\" to a closed question." }] },
    { id: "retail-change", tier: 1, type: "input", from: ["Customer", "Register 2"], subject: "Make change",
      msg: "The total is $17.35. The customer hands you a $20 bill.", ask: "How much change do you give back?",
      hint: "20.00 − 17.35.",
      lesson: "Change = amount paid − total. Count it back to the customer from the total up to what they paid, so both of you can check it.",
      fields: [{ label: "Change", answer: 2.65, prefix: "$" }] },
    { id: "retail-stock", tier: 2, type: "sort", from: ["Tasha Brooks", "Store Manager"], subject: "Stock the shelves",
      msg: "A delivery came in. Put each item in the right department.", ask: "Sort the items.",
      hint: "Where would you look for it as a shopper?",
      lesson: "Stores follow a planogram: a map of where every product goes. Correct placement helps customers find things and makes stock counts accurate.",
      buckets: ["Electronics", "Health & beauty", "Grocery", "Hardware"],
      items: [{ t: "AA batteries", b: 0 }, { t: "Phone charger", b: 0 }, { t: "Shampoo", b: 1 }, { t: "Toothpaste", b: 1 }, { t: "Cereal", b: 2 }, { t: "Pasta sauce", b: 2 }, { t: "Hammer", b: 3 }, { t: "Light bulbs", b: 3 }] },
    { id: "retail-return", tier: 2, type: "choice", from: ["Customer", "Service desk"], subject: "A return with no receipt",
      msg: "A customer wants to return a lamp. No receipt, but it's unused and in the box.",
      doc: { title: "Return policy", html: "With receipt: full refund within 30 days.<br>Without receipt: store credit at the lowest recent selling price, with photo ID." },
      ask: "What do you offer?", hint: "Read the second line of the policy.",
      lesson: "Apply the return policy consistently. Receipt-less returns usually get store credit, which helps prevent return fraud.",
      options: [{ t: "Store credit at the lowest recent price, after checking photo ID", ok: true, fb: "Fair and by the book. The customer is satisfied." }, { t: "A full cash refund", fb: "That breaks policy and invites return fraud." }, { t: "Refuse the return", fb: "Policy allows store credit." }, { t: "Tell them to come back with a receipt or nothing", fb: "Unhelpful, and stricter than policy." }] },
    { id: "retail-open", tier: 2, type: "order", from: ["Tasha Brooks", "Store Manager"], subject: "Opening the store",
      msg: "You're on the opening shift.", ask: "Put the opening tasks in order.",
      hint: "The doors open last.",
      lesson: "Opening routine: count the cash drawer, power up registers and lights, check and face the shelves, unlock at opening time, and greet the first customers.",
      items: ["Count the starting cash in the drawer", "Turn on registers and lights", "Check the shelves and face the products", "Unlock the doors at opening time", "Greet the first customers"] },
    { id: "retail-theft", tier: 3, curveball: true, type: "choice", from: ["Coworker", "Aisle 6"], subject: "URGENT: possible shoplifter",
      msg: "A coworker whispers: \"That guy in aisle 6 just put headphones in his jacket.\"", ask: "What do you do?",
      hint: "Your safety matters more than merchandise.",
      lesson: "Most stores forbid staff from chasing or touching suspected shoplifters. Stay visible, offer help (great service deters theft), and tell your manager or security.",
      options: [{ t: "Tell the manager or security, and go offer friendly help in that aisle", ok: true, fb: "He put the headphones back and left." }, { t: "Tackle him at the door", fb: "Dangerous, and against policy. Someone could get hurt." }, { t: "Loudly accuse him in front of everyone", fb: "What if you're wrong? That's a serious problem." }, { t: "Chase him into the parking lot", fb: "Never chase. No product is worth your safety." }] }
  ]
});

/* ---------- Bank ---------- */
JOBS.push({
  id: "bank", dept: "Bank Branch", floor: 16, icon: "bank", color: "#b8860b", role: "Bank Teller",
  blurb: "Handle cash, help customers, spot fraud.",
  mentor: { name: "Daniel Osei", title: "Branch Manager", hello: "Welcome to the branch, {name}. In banking, trust is everything. Count twice, verify every customer, and when something feels off, come get me." },
  tasks: [
    { id: "bank-verify", tier: 1, type: "choice", from: ["Customer", "Teller window"], subject: "\"I forgot my card\"",
      msg: "A customer wants to withdraw $900 in cash. \"I forgot my card and ID at home, but I've banked here for years!\"", ask: "What do you do?",
      hint: "How do you know it's really their account?",
      lesson: "Always verify identity before releasing money, following your bank's procedure (usually valid photo ID). Being friendly never replaces verification.",
      options: [{ t: "Politely explain you need valid photo ID to make the withdrawal", ok: true, fb: "They come back with ID an hour later. Procedure protects them too." }, { t: "Give them the cash, they seem nice", fb: "It wasn't the account owner. The bank had to cover the loss." }, { t: "Ask a few questions about the account instead", fb: "Personal details can be stolen. Follow the ID procedure." }, { t: "Call security right away", fb: "No need to escalate. Just follow procedure kindly." }] },
    { id: "bank-count", tier: 1, type: "input", from: ["Customer", "Teller window"], subject: "Count the deposit",
      msg: "A customer is depositing: three $100 bills, seven $20 bills, four $5 bills and nine $1 bills.", ask: "Total deposit?",
      hint: "300 + 140 + 20 + 9.",
      lesson: "Count by denomination, largest first, and count twice. Teller drawers have to balance to the cent at the end of the day.",
      fields: [{ label: "Total", answer: 469, prefix: "$" }] },
    { id: "bank-struct", tier: 2, type: "choice", from: ["Daniel Osei", "Branch Manager"], subject: "An unusual pattern",
      msg: "The same customer has deposited $9,500 in cash three days in a row. In many countries, cash deposits over $10,000 trigger an automatic report.", ask: "What should you do?",
      hint: "Why would someone stay just under the limit?",
      lesson: "Splitting cash to stay under reporting limits is called structuring, and banks must report suspicious patterns. Follow your bank's procedure quietly and never warn the customer.",
      options: [{ t: "Follow the suspicious-activity procedure and tell the compliance team, without tipping off the customer", ok: true, fb: "Exactly by the book. Compliance takes it from here." }, { t: "Ask the customer why they keep doing it", fb: "Tipping off a customer can be illegal." }, { t: "Ignore it, each deposit is under the limit", fb: "That's the point of structuring. It must be reported." }, { t: "Refuse all future deposits", fb: "That's not your decision to make. Report it." }] },
    { id: "bank-interest", tier: 2, type: "input", from: ["Customer", "Desk 2"], subject: "How much interest?",
      msg: "A customer puts $2,000 in a savings account paying 3% simple interest per year.", ask: "Interest earned after 2 years?",
      hint: "2,000 × 0.03 × 2.",
      lesson: "Simple interest = principal × rate × time. Compound interest also earns interest on past interest, so it grows faster over time.",
      fields: [{ label: "Interest", answer: 120, prefix: "$" }] },
    { id: "bank-balance", tier: 2, type: "order", from: ["Daniel Osei", "Branch Manager"], subject: "Balancing your drawer",
      msg: "End of day. Time to balance your cash drawer.", ask: "Put the steps in order.",
      hint: "Count first, compare second.",
      lesson: "Balancing: count cash by denomination, total the checks and transactions, compare with the system, investigate and report any difference, then lock everything in the vault.",
      items: ["Count all the cash by denomination", "Total the checks and transactions", "Compare your total with the system", "Investigate and report any difference", "Lock the cash in the vault"] },
    { id: "bank-elder", tier: 3, curveball: true, type: "choice", from: ["Elderly customer", "Teller window"], subject: "URGENT: a worrying request",
      msg: "An elderly customer, visibly upset, wants to wire $8,000 right now. \"My grandson called. He's in jail and needs bail money. He said not to tell anyone!\"",
      ask: "What do you do?", hint: "Secrecy and urgency are classic scam signs.",
      lesson: "The 'grandparent scam' targets older people with fake emergencies and demands for secrecy. Gently ask questions, slow things down, involve your manager, and follow your bank's elder-protection procedures.",
      options: [{ t: "Gently ask questions, slow things down, and bring in the branch manager", ok: true, fb: "She calls her grandson's real number. He's fine. You saved her $8,000." }, { t: "Send the wire, it's her money", fb: "It was a scam. The money is gone." }, { t: "Tell her she's being stupid", fb: "Unkind, and she left to send it elsewhere." }, { t: "Refuse and call the police without talking to her", fb: "Talk to her first and involve your manager." }] }
  ]
});

/* ---------- generators ---------- */
Object.assign(GENS, {
  med: [() => { const b = rnd(15, 30);
    return { id: "gen-med-pulse", tier: 1, type: "input", from: ["Grace Adeyemi", "Charge Nurse"], subject: "Count the pulse",
      msg: `You count ${b} heartbeats in 15 seconds.`, ask: "What's the pulse in beats per minute?", hint: `${b} × 4.`,
      lesson: "Pulse per minute = beats in 15 seconds × 4. For an irregular pulse, count for a full minute.", fields: [{ label: "Pulse", answer: b * 4, suffix: "bpm" }] }; }],
  chef: [() => { const s0 = pick([2, 4, 6]), s1 = pick([8, 10, 12, 15, 20]), g = pick([120, 200, 240, 300, 360]);
    return { id: "gen-chef-scale", tier: 2, type: "input", from: ["Antonio Reyes", "Head Chef"], subject: "Scale it up",
      msg: `A recipe for ${s0} uses ${g} g of rice. We need ${s1} servings.`, ask: "How much rice?", hint: `${g} ÷ ${s0} × ${s1}.`,
      lesson: "Scale recipes by finding the amount per serving first.", fields: [{ label: "Rice", answer: r2(g / s0 * s1), suffix: "g" }] }; }],
  retail: [() => { const price = pick([12, 20, 35, 48, 60, 80, 125]), pct = pick([10, 15, 20, 25, 30, 40]);
    return { id: "gen-retail-sale", tier: 1, type: "input", from: ["Customer", "Register 1"], subject: "What's the sale price?",
      msg: `A jacket is $${price}. It's ${pct}% off today.`, ask: "Sale price?", hint: `${price} × (1 − ${pct / 100}).`,
      lesson: "Sale price = original × (1 − discount %). Double-check the register matches the shelf tag.", fields: [{ label: "Sale price", answer: r2(price * (1 - pct / 100)), prefix: "$" }] }; }],
  bank: [() => { const p = pick([1000, 1500, 2500, 4000, 5000]), r = pick([2, 3, 4, 5]), t = pick([1, 2, 3]);
    return { id: "gen-bank-int", tier: 2, type: "input", from: ["Customer", "Desk 2"], subject: "Interest question",
      msg: `$${p.toLocaleString()} at ${r}% simple interest for ${t} year${t > 1 ? "s" : ""}.`, ask: "Interest earned?", hint: `${p} × ${r / 100} × ${t}.`,
      lesson: "Simple interest = principal × rate × time.", fields: [{ label: "Interest", answer: r2(p * r / 100 * t), prefix: "$" }] }; }]
});

/* ---------- projects, rush days, career paths, glossary ---------- */
Object.assign(PROJECTS, {
  med: { name: "Flu season prep", stages: ["med-hygiene", "med-vitals", "med-sort"] },
  chef: { name: "Launch the new menu", stages: ["chef-scale", "chef-ticket", "chef-temp"] },
  retail: { name: "Holiday season prep", stages: ["retail-open", "retail-stock", "retail-return"] },
  bank: { name: "Branch audit", stages: ["bank-count", "bank-balance", "bank-verify"] }
});
Object.assign(RUSH, { med: "Flu outbreak", chef: "Saturday dinner rush", retail: "Holiday sale", bank: "Payday Friday" });
Object.assign(PATHS, {
  med: [["Nursing Assistant", "$35k–45k"], ["Licensed Practical Nurse", "$50k–65k"], ["Registered Nurse", "$75k–100k"], ["Nurse Manager", "$100k–140k"]],
  chef: [["Line Cook", "$32k–42k"], ["Sous Chef", "$45k–60k"], ["Head Chef", "$55k–80k"], ["Executive Chef", "$75k–110k"]],
  retail: [["Sales Associate", "$28k–36k"], ["Shift Supervisor", "$34k–45k"], ["Assistant Manager", "$42k–58k"], ["Store Manager", "$55k–90k"]],
  bank: [["Bank Teller", "$33k–42k"], ["Personal Banker", "$42k–58k"], ["Assistant Branch Manager", "$55k–75k"], ["Branch Manager", "$70k–110k"]]
});
Object.assign(GLOSSARY, {
  "vital signs": ["med", "Key body measurements: temperature, pulse, breathing rate, blood pressure and oxygen level."],
  "PPE": ["med", "Personal protective equipment: gloves, masks, gowns and eye protection."],
  "fall risk": ["med", "A patient more likely to fall, usually marked with a colored wristband."],
  "intake": ["med", "Everything a patient drinks or receives as fluid, measured and recorded."],
  "mise en place": ["chef", "French for 'everything in its place': all ingredients prepped and ready before cooking."],
  "cross-contamination": ["chef", "Germs spreading from one food or surface to another, like raw chicken juice onto salad."],
  "danger zone": ["chef", "The temperature range (about 5–60 °C / 40–140 °F) where bacteria grow fastest."],
  "planogram": ["retail", "A map showing exactly where every product goes on the shelves."],
  "POS": ["retail", "Point of sale: the register system where purchases are rung up."],
  "markdown": ["retail", "A permanent price reduction on an item."],
  "structuring": ["bank", "Splitting cash deposits to stay under reporting limits. Banks must report it."],
  "simple interest": ["bank", "Interest paid only on the original amount: principal × rate × time."],
  "wire transfer": ["bank", "Sending money electronically from one bank account to another. Hard to reverse."]
});

/* ---------- 3D rooms ---------- */
const cnt = (x, z, w, d, h = .95, color = "#c9ced4") => { box(E.world, w, h, d, color, x, 0, z, { m: { rough: .35, metal: .5 } }); collider(x, z, w, d); };
Object.assign(THEMES, {
  med: { uniform: { shirt: "#3aa6a0", pants: "#3aa6a0", outfit: 2, mod: "Casual2" }, floor: "marble", wall: "#e4eef0", layout: "open", props: ["screen:WARD STATUS"],
    build(W, D) {
      for (const [x, ry] of [[-W / 2 + 1.3, Math.PI / 2], [W / 2 - 1.3, -Math.PI / 2]]) for (const z of [-8, -4, 0]) {
        PROP.fm("Bed_Single", x, z, ry) || PROP.bed(x, z, ry, "#9fd3ff", false);
        PROP.fm("Curtains_Single", x + (x < 0 ? 1.4 : -1.4), z - 1.25, x < 0 ? Math.PI / 2 : -Math.PI / 2, { collide: false, s: .7 });
        PROP.fm("NightStand_2", x + (x < 0 ? .1 : -.1), z + 1.25, ry, { s: .7 });
      }
      cnt(4, 3, 4, .8, 1.05, "#f4f6f8"); PROP.board(4, 3.55, Math.PI, ["NURSES' STATION"], { w: 2.4, h: .5, bg: "#d64545", fg: "#fff", size: 54 });
      const st = group(4, 3, Math.PI); box(st, .7, .42, .04, "#16191d", 0, 1.1, 0); const sc = new THREE.Mesh(bgeo(.64, .36, .01), screenUI("#d64545")); sc.position.set(0, 1.31, -.03); sc.rotation.y = Math.PI; st.add(sc);
      for (const [x, ry] of [[-W / 2 + 1.3, 1], [W / 2 - 1.3, -1]]) for (const z of [-8, -4, 0]) { const ix = x + ry * 1.25; box(E.world, .04, 1.9, .04, "#b8c1ca", ix, 0, z - .9, { m: { metal: .7 } }); box(E.world, .16, .24, .06, "#cfe8ff", ix, 1.6, z - .9, { m: { rough: .2, transparent: true, opacity: .7 } }); }
    } },
  chef: { uniform: { shirt: "#f4f4f2", pants: "#2b2b2b", outfit: 2, mod: "Casual2" }, floor: "concrete", wall: "#ece6dc", layout: "open", props: ["screen:ORDERS"],
    build(W, D) {
      PROP.kitchen(-8, -D / 2 + .9, 0, 5); PROP.kitchen(7, -D / 2 + .9, 0, 5);
      for (const x of [-6, 6]) cnt(x, -3, 4.5, 1.2, .95); cnt(0, -1, 1.2, 4, .95);
      for (const x of [-7.5, -6, -4.5]) { box(E.world, 1.3, .06, .9, "#2b2f36", x, .95, -3, { cast: false }); for (const dx of [-.3, .3]) { const b = box(E.world, .28, .03, .28, "#111", x + dx, 1.01, -3.1, { cast: false }); } }
      for (const x of [-7, -5]) box(E.world, .9, .9, .5, "#9aa2ab", x, 2.2, -D / 2 + .5, { m: { metal: .6, rough: .4 } });
      PROP.fm("Shelf_2", W / 2 - .6, -3, -Math.PI / 2, { s: .9 }); PROP.fm("Shelf_2", W / 2 - .6, -1, -Math.PI / 2, { s: .9 }); PROP.fm("Trashcan_Large", W / 2 - .8, 2, 0, { s: .6 });
      PROP.board(0, -D / 2 + .2, 0, ["TICKETS: 4 OPEN"], { w: 3, h: .8, bg: "#20252c", fg: "#ffd23f", size: 50 });
    } },
  retail: { uniform: { shirt: "#7b4bb5", pants: "#2f3e52", outfit: 2, mod: "Casual2" }, floor: "marble", wall: "#efe8f6", layout: "open", props: ["screen:HOLIDAY SALE"],
    wander: [[-9, -7], [-9, 1], [0, -6], [0, 1], [9, -7], [9, 1], [-4, 5], [4, 5]],
    build(W, D) {
      for (const x of [-11, -5, 5, 11]) PROP.shelf(x, -3, Math.PI / 2, 9);
      for (const x of [-3, 3]) { cnt(x, 4.2, 2, .8, .95, "#7b4bb5"); box(E.world, .4, .3, .3, "#20252c", x - .5, .95, 4.2); }
      PROP.board(-8, -D / 2 + .2, 0, ["SALE", "Up to 40% off"], { w: 3, h: 1.4, bg: "#d64545", fg: "#fff" });
    } },
  bank: { uniform: { outfit: 0, mod: "Suit" }, floor: "marble", wall: "#efe6d2", panel: "#7a6a4a", props: ["screen:TODAY'S RATES", "columns", "vault"] }
});
