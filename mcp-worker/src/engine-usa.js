// Extracted from index.html; source engine rules are unchanged.
const __engineRoot = {};
/* Game engine: pure functions over the game state. Runs in the browser and in Node. */
(function (root) {
  'use strict';
  var E = {};
  var D = null;
  E.init = function (data) { D = data; E.D = data; };

  E.LEN = 60;            // one game: 15 years, quarter by quarter
  E.MAX_START = 19;      // start no later than 1976Q1 so the data lasts to the end
  E.GOLD_LEGAL = 15;     // 1975Q1: from Dec 31, 1974 US citizens may own gold again
  E.stockFee = function (q) { return q < 19 ? 0.02 : 0.015; };   // broker commission each way: fixed NYSE rates until 1975, cheaper from 1976
  E.GOLD_FEE = 0.02;     // dealer markup on purchase
  E.DOWN = 0.25;         // down payment
  E.CLOSING = 0.02;      // closing costs on purchase
  E.SELL_COST = 0.06;    // realtor and fees on sale
  E.REFI_FEE = 0.02;     // refinancing cost as a share of the balance
  E.RENT_YIELD = 0.07;   // annual rent to house price in 1971; afterwards rent follows CPI Rent
  E.RENT_KEEP = 0.65;    // share of rent left after property tax, repairs, insurance, vacancy
  E.CARD_RATE = 18;     // credit card: 18% a year (Fed G.19, 1972-1991: 16.9-18.9%)
  E.BENEFIT = 0.50;      // unemployment benefit: half of gross pay (untaxed until 1979)...
  E.BENEFIT_CAP = 864.6; // ...up to a cap: $66.51 a week in July 1972, indexed to wages
  E.CREEP = 0.35;        // share of real pay growth that goes into lifestyle
  E.KIDS = [1, 1.25, 1.45]; // expenses with 0, 1, 2 children (BLS equivalence scale, 1968)
  E.LOAN_RATE = 7;       // student loan, % per year
  E.WIN_STREAK = 4;      // quarters in a row passive income must cover expenses

  /* 10 careers. base: entry-level annual pay before tax in 1971 dollars.
     curve: [[until year of experience, real growth per year], ...]; jump: step up after residency. */
  E.PROFS = [
    { id: 'seller',  name: 'Retail clerk',        age: 18, base: 4200,  share: 0.77, sens: 1.0,  debt: 0,    curve: [[10, 0.015]],
      note: 'The most common job in the country. Low pay, slow raises.' },
    { id: 'factory', name: 'Auto worker',         age: 18, base: 8800,  share: 0.67, sens: 2.2,  debt: 0,    curve: [[3, 0.03], [15, 0.005]],
      note: 'Good money from day one, but first to go in a downturn.' },
    { id: 'trucker', name: 'Truck driver',        age: 21, base: 8000,  share: 0.70, sens: 1.3,  debt: 0,    curve: [[8, 0.05]],
      note: 'Starts on local routes and works up to long haul in 8 years.' },
    { id: 'nurse',   name: 'Nurse',               age: 21, base: 7600,  share: 0.70, sens: 0.3,  debt: 0,    curve: [[8, 0.03]],
      note: 'There is always work, but the pay ceiling is close.' },
    { id: 'teacher', name: 'Teacher',             age: 22, base: 7060,  share: 0.70, sens: 0.4,  debt: 1500, curve: [[11, 0.035]],
      note: 'A step raise every year, layoffs are rare.' },
    { id: 'police',  name: 'Police officer',      age: 21, base: 8000,  share: 0.69, sens: 0.25, debt: 0,    curve: [[4, 0.05], [15, 0.015]],
      note: 'Steady in any economy, fast raises in the first 5 years.' },
    { id: 'account', name: 'Accountant',          age: 22, base: 10150, share: 0.65, sens: 0.5,  debt: 1500, curve: [[10, 0.06], [15, 0.007]],
      note: 'College graduate. Pay nearly doubles in 10 years.' },
    { id: 'engineer',name: 'Engineer',            age: 22, base: 10600, share: 0.63, sens: 0.6,  debt: 1500, curve: [[10, 0.05], [15, 0.015]],
      note: 'High starting pay, but the industry lives on contracts and the cycle.' },
    { id: 'lawyer',  name: 'Lawyer',              age: 25, base: 12000, share: 0.65, sens: 0.35,  debt: 4000, curve: [[10, 0.09], [15, 0.03]],
      note: 'Law school debt, but the steepest raises.' },
    { id: 'doctor',  name: 'Doctor',              age: 26, base: 9000,  share: 0.70, sens: 0.1,  debt: 6000, curve: [[4, 0.03], [12, 0.025]], jumpAt: 4, jump: 3.6,
      note: '4 years of residency on a stipend, then income jumps several times over.' }
  ];
  E.prof = function (id) { for (var i = 0; i < E.PROFS.length; i++) if (E.PROFS[i].id === id) return E.PROFS[i]; return null; };

  function rng(seed) {            // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  E.career = function (p, years) {
    var m = 1, prev = 0;
    for (var i = 0; i < p.curve.length; i++) {
      var until = p.curve[i][0], g = p.curve[i][1];
      var span = Math.min(years, until) - prev;
      if (span > 0) m *= Math.pow(1 + g, span);
      prev = until;
      if (years <= until) break;
    }
    if (p.jumpAt != null && years >= p.jumpAt) m *= p.jump;
    return m;
  };
  E.taxRate = function (g71) { return Math.max(clamp(0.10 + 0.085 * Math.log(g71 / 5000) / Math.LN2, 0.08, 0.38), Math.min(0.20, 0.145 + 0.06 * Math.log(g71 / 4200) / Math.LN2)); };

  /* Quarterly pay: {gross, net} when employed */
  E.pay = function (s, q, t) {
    var p = E.prof(s.prof);
    if (q == null) q = s.q;
    if (t == null) t = s.t;
    var g71 = p.base * E.career(p, t / 4) * s.promo;
    var gross = g71 * D.ahe[q] / D.ahe[0] / 4;
    return { gross: gross, net: gross * (1 - E.taxRate(g71)) };
  };
  E.benefit = function (s, q) { if (q == null) q = s.q; return Math.min(E.BENEFIT * E.pay(s, q).gross, E.BENEFIT_CAP * D.ahe[q] / D.ahe[5]); };
  E.expenses = function (s, q) {
    if (q == null) q = s.q;
    return s.life * D.cpi[q] / D.cpi[s.start] * E.KIDS[s.kids];
  };
  E.rentQ = function (q) { return 3 * D.house[0] * E.RENT_YIELD / 12 * D.rent[q] / D.rent[0]; };
  E.mortPay = function (bal, rate) {          // quarterly payment, 30 years
    var r = rate / 1200;
    return 3 * bal * r / (1 - Math.pow(1 + r, -360));
  };
  function amortize(h) {
    var r = h.rate / 1200, m = h.pay / 3;
    for (var k = 0; k < 3; k++) { h.bal = Math.max(0, h.bal * (1 + r) - m); }
  }
  E.houseNet = function (h, q) { return E.rentQ(q) * E.RENT_KEEP - h.pay; };

  E.newGame = function (profId, seed, start) {
    var r = rng(seed);
    if (start == null) start = Math.floor(r() * (E.MAX_START + 1));
    var rolls = [];
    for (var i = 0; i < E.LEN; i++) rolls.push([r(), r(), r(), r()]);
    var p = E.prof(profId);
    var s = {
      prof: profId, seed: seed, start: start, t: 0, q: start,
      cash: 0, units: 0, oz: 0, houses: [], loan: null,
      employed: true, off: 0, promo: 1, kids: 0, life: 0, life0: 0, net0: 0,
      streak: 0, won: false, wonAt: null, over: false, bankrupt: false,
      rolls: rolls, hist: [], log: [], cost: { units: 0, oz: 0 }
    };
    var pay = E.pay(s);
    s.net0 = pay.net;
    s.life0 = s.life = p.share * pay.net;
    s.cash = Math.round(pay.net * 0.5);
    if (p.debt) {
      var bal = Math.round(p.debt * D.ahe[start] / D.ahe[0] / 100) * 100;
      var rr = E.LOAN_RATE / 400;
      s.loan = { bal: bal, pay: bal * rr / (1 - Math.pow(1 + rr, -40)) };
    }
    s.hist.push(E.snapshot(s));
    return s;
  };

  E.netWorth = function (s) {
    var q = s.q, nw = s.cash + s.units * D.sp[q] + s.oz * D.gold[q];
    for (var i = 0; i < s.houses.length; i++) nw += D.house[q] - s.houses[i].bal;
    if (s.loan) nw -= s.loan.bal;
    return nw;
  };
  E.passive = function (s) {
    var q = s.q;
    var interest = s.cash > 0 ? s.cash * D.tb[q] / 400 : 0;
    var div = s.units * D.div[q] / 4;
    var rent = 0;
    for (var i = 0; i < s.houses.length; i++) rent += E.houseNet(s.houses[i], q);
    return { interest: interest, div: div, rent: rent, total: interest + div + rent };
  };
  E.required = function (s) { return E.expenses(s) + (s.loan ? Math.min(s.loan.pay, s.loan.bal * (1 + E.LOAN_RATE / 400)) : 0); };
  E.freedom = function (s) { return E.passive(s).total / E.required(s); };
  E.snapshot = function (s) {
    var nw = E.netWorth(s);
    return { t: s.t, nw: nw, real: nw * D.cpi[s.start] / D.cpi[s.q], free: E.freedom(s) };
  };

  /* ---------- player actions (at start-of-quarter prices) ---------- */
  E.buyStock = function (s, amount) {
    amount = Math.min(amount, s.cash); if (amount <= 0) return false;
    s.units += amount * (1 - E.stockFee(s.q)) / D.sp[s.q]; s.cash -= amount; s.cost.units += amount; return true;
  };
  E.sellStock = function (s, frac) {
    if (s.units <= 0) return false;
    var u = s.units * frac; s.cash += u * D.sp[s.q] * (1 - E.stockFee(s.q)); s.cost.units *= (1 - frac); s.units -= u;
    if (s.units < 1e-9) { s.units = 0; s.cost.units = 0; } return true;
  };
  E.goldOpen = function (s) { return s.q >= E.GOLD_LEGAL; };
  E.buyGold = function (s, amount) {
    if (!E.goldOpen(s)) return false;
    amount = Math.min(amount, s.cash); if (amount <= 0) return false;
    s.oz += amount * (1 - E.GOLD_FEE) / D.gold[s.q]; s.cash -= amount; s.cost.oz += amount; return true;
  };
  E.sellGold = function (s, frac) {
    if (s.oz <= 0) return false;
    var o = s.oz * frac; s.cash += o * D.gold[s.q]; s.cost.oz *= (1 - frac); s.oz -= o;
    if (s.oz < 1e-9) { s.oz = 0; s.cost.oz = 0; } return true;
  };
  /* House purchase terms: what it takes and whether the bank approves */
  E.houseQuote = function (s) {
    var q = s.q, price = D.house[q], rate = D.mort[q];
    var loan = price * (1 - E.DOWN), pay = E.mortPay(loan, rate);
    var need = price * (E.DOWN + E.CLOSING);
    var rent = E.rentQ(q), sumPay = pay, n = s.houses.length + 1;
    for (var i = 0; i < s.houses.length; i++) sumPay += s.houses[i].pay;
    var limit = (q >= 55 ? 0.22 : 0.20) * E.pay(s).gross + 0.75 * rent * n;
    var why = null;
    if (!s.employed) why = 'job';
    else if (s.cash < need) why = 'cash';
    else if (sumPay > limit) why = 'bank';
    return { price: price, rate: rate, loan: loan, pay: pay, need: need, rent: rent, net: rent * E.RENT_KEEP - pay, ok: !why, why: why, sumPay: sumPay, limit: limit };
  };
  E.buyHouse = function (s) {
    var k = E.houseQuote(s); if (!k.ok) return false;
    s.cash -= k.need;
    s.houses.push({ bought: s.q, price: k.price, bal: k.loan, rate: k.rate, pay: k.pay });
    return true;
  };
  E.houseSale = function (s, i) { var h = s.houses[i]; return D.house[s.q] * (1 - E.SELL_COST) - h.bal; };
  E.sellHouse = function (s, i) {
    if (!s.houses[i]) return false;
    s.cash += E.houseSale(s, i); s.houses.splice(i, 1); return true;
  };
  E.refiQuote = function (s, i) {
    var h = s.houses[i], rate = D.mort[s.q], fee = h.bal * E.REFI_FEE;
    var pay = E.mortPay(h.bal, rate);
    return { rate: rate, fee: fee, pay: pay, saves: h.pay - pay, ok: rate <= h.rate - 1 && s.cash >= fee && h.bal > 0, offered: rate <= h.rate - 1 && h.bal > 0 };
  };
  E.refinance = function (s, i) {
    var k = E.refiQuote(s, i); if (!k.ok) return false;
    var h = s.houses[i]; s.cash -= k.fee; h.rate = k.rate; h.pay = k.pay; return true;
  };
  E.payLoan = function (s, amount) {
    if (!s.loan) return false;
    amount = Math.min(amount, s.cash, s.loan.bal); if (amount <= 0) return false;
    s.cash -= amount; s.loan.bal -= amount; if (s.loan.bal < 0.5) s.loan = null; return true;
  };

  var COSTS = ['The car broke down, repairs', 'A bill from the dentist', 'A week in the hospital, insurance didn’t cover it all', 'A crash on the road, a fine and repairs', 'An emergency flight home to family', 'A break-in at the apartment'];
  var GAINS = ['Tax refund', 'Year-end bonus', 'A small inheritance from an aunt', 'Weekend side job'];

  /* ---------- a turn: live through one quarter ---------- */
  E.step = function (s) {
    if (s.over) return null;
    var q = s.q, roll = s.rolls[s.t], p = E.prof(s.prof);
    var pay = E.pay(s), wasEmployed = s.employed;
    var f = {};
    f.salary = wasEmployed ? pay.net : E.benefit(s, q);
    f.expenses = E.expenses(s, q);
    f.interest = s.cash > 0 ? s.cash * D.tb[q] / 400 : s.cash * E.CARD_RATE / 400;
    f.div = s.units * D.div[q] / 4;
    f.rent = 0;
    for (var i = 0; i < s.houses.length; i++) { f.rent += E.houseNet(s.houses[i], q); amortize(s.houses[i]); }
    f.loan = 0;
    if (s.loan) {
      var due = s.loan.bal * (1 + E.LOAN_RATE / 400);
      f.loan = Math.min(s.loan.pay, due);
      s.loan.bal = due - f.loan;
      if (s.loan.bal < 0.5) s.loan = null;
    }
    f.event = 0;
    var notes = [];

    // a personal event
    var r = roll[1];
    if (r < 0.07) {
      f.event = -(0.25 + 0.45 * roll[2]) * f.expenses;
      notes.push({ kind: 'bad', text: COSTS[Math.floor(roll[3] * COSTS.length)] + ': −$' + fmt(-f.event) });
    } else if (r < 0.10) {
      f.event = (0.2 + 0.3 * roll[2]) * pay.net;
      notes.push({ kind: 'good', text: GAINS[Math.floor(roll[3] * GAINS.length)] + ': +$' + fmt(f.event) });
    } else if (r < 0.125 && s.kids < 2 && s.t >= 4 && s.t < 36) {
      s.kids++;
      notes.push({ kind: 'life', text: 'A baby was born into the family. Expenses went up ' + Math.round((E.KIDS[s.kids] / E.KIDS[s.kids - 1] - 1) * 100) + '%.' });
    } else if (r < 0.145 && wasEmployed && s.t >= 2) {
      s.promo *= 1.07;
      notes.push({ kind: 'good', text: 'Promotion: pay +7%.' });
    }

    // the job: layoff odds follow the country's real unemployment rate
    if (wasEmployed) {
      var inResidency = p.jumpAt != null && s.t / 4 < p.jumpAt;
      var pj = clamp((D.un[q] - 3.5) * 0.008, 0.004, 0.07) * p.sens;
      if (!inResidency && s.t >= 2 && roll[0] < pj) {
        s.employed = false;
        s.off = 1 + (D.un[q] > 7.5 ? 1 : 0) + (roll[3] < 0.3 ? 1 : 0);
        notes.push({ kind: 'bad', text: 'You were laid off. While you look for work, you live on unemployment: half your pay before tax, up to the state cap.' });
      }
    } else {
      s.off--;
      if (s.off <= 0) { s.employed = true; notes.push({ kind: 'good', text: 'You are back at work.' }); }
    }

    f.total = f.salary - f.expenses + f.interest + f.div + f.rent - f.loan + f.event;
    s.cash += f.total;

    var prev = q;
    s.q = q + 1; s.t += 1;

    // lifestyle catches up with real pay growth
    var now = E.pay(s);
    var realNet = now.net * D.cpi[s.start] / D.cpi[s.q];
    var target = s.life0 + E.CREEP * Math.max(0, realNet - s.net0);
    var lifeUp = false;
    if (target > s.life * 1.0005) { lifeUp = target > s.life * 1.15; s.life = target; }
    if (p.jumpAt != null && s.t / 4 === p.jumpAt) notes.push({ kind: 'good', text: 'Residency is over. You are a practicing physician and your income has grown several times over. Your expenses grew with it.' });
    else if (lifeUp) notes.push({ kind: 'life', text: 'Your income went up, and so did your lifestyle.' });

    // forced sale if credit card debt goes over the limit
    var limit = 2 * now.net;
    if (s.cash < -limit) {
      if (s.oz > 0) { E.sellGold(s, 1); notes.push({ kind: 'bad', text: 'The bank called in your debt: your gold was sold.' }); }
      if (s.cash < -limit && s.units > 0) { E.sellStock(s, 1); notes.push({ kind: 'bad', text: 'The bank called in your debt: your stocks were sold.' }); }
      while (s.cash < -limit && s.houses.length) { E.sellHouse(s, 0); notes.push({ kind: 'bad', text: 'The bank called in your debt: a house was sold.' }); }
      if (s.cash < -limit) { s.over = true; s.bankrupt = true; notes.push({ kind: 'bad', text: 'Your debts are more than you can carry. Bankruptcy.' }); }
    }

    var free = E.freedom(s);
    if (free >= 1) s.streak++; else s.streak = 0;
    if (!s.won && s.streak >= E.WIN_STREAK) { s.won = true; s.wonAt = s.t; }
    if (s.t >= E.LEN) s.over = true;
    s.hist.push(E.snapshot(s));

    var rep = {
      q: prev, t: s.t - 1, flows: f, notes: notes,
      d: {
        sp: D.sp[s.q] / D.sp[prev] - 1, gold: D.gold[s.q] / D.gold[prev] - 1,
        house: D.house[s.q] / D.house[prev] - 1, cpi: D.cpi[s.q] / D.cpi[prev] - 1
      },
      goldOpened: s.q === E.GOLD_LEGAL
    };
    s.log.push(rep);
    return rep;
  };

  function fmt(x) { return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  E.fmt = fmt;
  E.label = function (q) {      // {y: 1973, k: 2}
    var n = D.q0 - 1 + q, y = D.y0 + Math.floor(n / 4), k = n % 4;
    return { y: y, k: k + 1 };
  };

  /* ---------- simple strategies to compare against ---------- */
  E.BOTS = {
    deposit: { name: 'Everything in the bank', act: function () {} },
    stocks: { name: 'All spare cash into stocks', act: function (s) { var keep = E.expenses(s); if (s.cash > keep) E.buyStock(s, s.cash - keep); } },
    houses: { name: 'Buy a house as soon as the bank says yes', act: function (s) { var keep = E.expenses(s) * 0.5; var k = E.houseQuote(s); if (k.ok && s.cash - k.need > keep) E.buyHouse(s); } }
  };
  E.runBot = function (profId, seed, start, bot) {
    var s = E.newGame(profId, seed, start);
    while (!s.over) { bot.act(s); E.step(s); }
    return s;
  };

  root.Engine = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(__engineRoot);

export default __engineRoot.Engine;
