/* Game engine, Japan 1980–2005: pure functions over the game state. Runs in the browser and in Node.
   Same API as the US version, so balance.js works unchanged. Notes are stored as {kind, key, v}
   and turned into text by the interface, in the chosen language. */
(function (root) {
  'use strict';
  var E = {};
  var D = null;
  E.init = function (data) { D = data; E.D = data; };

  E.LEN = 60;            // one game: 15 years, quarter by quarter
  E.MAX_START = 43;      // start no later than 1990Q4 so the data lasts to 2005Q4
  E.GOLD_LEGAL = 0;      // no ban on gold in Japan
  E.DOWN = 0.20;         // banks lend up to 80% of the price (公庫 融資率 80%)
  E.CLOSING = 0.06;      // estimate: registration and acquisition taxes, stamp duty, broker 3% + ¥60,000
  E.SELL_COST = 0.035;   // estimate: broker 3% + ¥60,000
  E.REFI_FEE = 0.02;     // estimate
  E.LOAN_YEARS = 25;     // estimate: bank loans for rental flats were shorter than 公庫's 35 years
  E.RENT_YIELD = 0.055;  // estimate: gross rent / price of a new small flat in 1980Q1; afterwards rent follows CPI rent
  E.RENT_KEEP = 0.65;    // estimate: after 管理費・修繕積立金, property tax, vacancy, repairs
  E.AGE_LOSS = 0.018;    // a flat loses about half its price per m² by 26–30 years (REINS); rent loses 1% a year
  E.CARD_RATE = 25;      // estimate: revolving credit and consumer loans, % a year
  E.INT_TAX_FROM = 33;   // = 1988Q2: マル優 ends for most savers, interest taxed at a flat 20%
  E.DIV_TAX = 0.20;      // estimate: withholding tax on dividends
  E.CREEP = 0.35;        // share of real pay growth that goes into lifestyle (same as the US version)
  E.KIDS = [1, 1.20, 1.36]; // estimate: expenses with 0, 1, 2 children
  E.WIN_STREAK = 4;
  E.REHIRE = 0.90;       // estimate: mid-career hires start lower than people who never left (中途採用)

  /* 10 careers. base: monthly pay before tax in 1980 yen (scaled by the wage index for later starts).
     bonus: multiplier on the typical number of bonus months that year. curve: [[until year, real growth a year]].
     share: living costs as a share of average take-home pay (家計調査: 67–85% by income in 2000). */
  E.PROFS = [
    { id: 'salary',  age: 22, base: 118500, bonus: 1.10, share: 0.68, sens: 0.30, curve: [[15, 0.043]] },
    { id: 'bank',    age: 22, base: 124000, bonus: 1.25, share: 0.68, sens: 0.20, curve: [[15, 0.047]], bankRisk: true },
    { id: 'city',    age: 22, base: 101600, bonus: 1.00, share: 0.70, sens: 0.03, curve: [[15, 0.036]] },
    { id: 'teacher', age: 22, base: 116100, bonus: 1.00, share: 0.70, sens: 0.03, curve: [[15, 0.038]] },
    { id: 'nurse',   age: 21, base: 110000, bonus: 0.85, share: 0.72, sens: 0.10, curve: [[15, 0.020]] },
    { id: 'auto',    age: 18, base: 100000, bonus: 1.00, share: 0.74, sens: 0.60, curve: [[15, 0.023]] },
    { id: 'build',   age: 18, base: 120000, bonus: 0.25, share: 0.78, sens: 1.80, curve: [[10, 0.027]] },
    { id: 'shop',    age: 18, base: 85000,  bonus: 0.20, share: 0.82, sens: 1.50, curve: [[15, 0.010]] },
    { id: 'prog',    age: 22, base: 118500, bonus: 0.90, share: 0.70, sens: 0.60, curve: [[15, 0.044]] },
    { id: 'doctor',  age: 24, base: 130000, bonus: 0.60, share: 0.72, sens: 0.03, curve: [[2, 0.03], [15, 0.03]], jumpAt: 2, jump: 2.3 }
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
  function lerpTable(tab, x) {   // tab: [[x, y], ...] sorted by x; linear, flat outside
    if (x <= tab[0][0]) return tab[0][1];
    for (var i = 1; i < tab.length; i++) if (x <= tab[i][0]) {
      var a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    }
    return tab[tab.length - 1][1];
  }
  E.label = function (q) { var n = D.q0 - 1 + q; return { y: D.y0 + Math.floor(n / 4), k: n % 4 + 1 }; };
  function qi(y, k) { return (y - 1980) * 4 + k - 1; }   // quarter index; data start 1980Q1

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

  /* Income tax + resident tax as a share of annual pay, by law period (MOF tables, single person;
     1984–87 and 1995 figures shifted from family to single). Points above ¥8m are extrapolated. */
  var TAX = {
    A: [[1e6, 1.5], [2e6, 5.5], [3e6, 7.7], [5e6, 12.5], [8e6, 19.8], [12e6, 27], [20e6, 38], [40e6, 50]],   // to 1987Q3
    B: [[1e6, 0.8], [2e6, 4.5], [3e6, 5.1], [5e6, 8.0], [8e6, 11.7], [12e6, 17], [20e6, 25], [40e6, 36]],    // 1987Q4–1998
    C: [[1e6, 0.5], [2e6, 4.3], [3e6, 5.1], [5e6, 6.9], [8e6, 10.7], [12e6, 15], [20e6, 21], [40e6, 30]]     // 1999– (定率減税)
  };
  E.taxRate = function (annual, q) {
    var tab = q < qi(1987, 4) ? TAX.A : q < qi(1999, 1) ? TAX.B : TAX.C;
    return lerpTable(tab, annual) / 100;
  };
  /* Employee social insurance (pension + health + employment), % of regular pay and of bonuses.
     Before 2003 bonuses were mostly exempt (a 1% special levy from 1995). */
  var SOCIAL = [
    [0, 9.85, 0], [qi(1985, 4), 10.85, 0], [qi(1991, 1), 11.9, 0], [qi(1993, 2), 11.75, 0],
    [qi(1994, 4), 12.75, 0], [qi(1995, 2), 12.75, 1.0], [qi(1996, 4), 13.3, 1.0],
    [qi(2001, 2), 13.5, 1.0], [qi(2002, 4), 13.6, 1.0], [qi(2003, 2), 11.6, 11.6], [qi(2005, 1), 11.7, 11.7], [qi(2005, 4), 12.0, 12.0]
  ];
  E.social = function (q) { var r = SOCIAL[0]; for (var i = 0; i < SOCIAL.length; i++) if (q >= SOCIAL[i][0]) r = SOCIAL[i]; return { reg: r[1] / 100, bon: r[2] / 100 }; };

  /* Pay for one quarter. Bonuses are paid in the summer (Q2) and winter (Q4). */
  E.pay = function (s, q, t) {
    var p = E.prof(s.prof);
    if (q == null) q = s.q;
    if (t == null) t = s.t;
    var monthly = p.base * E.career(p, t / 4) * s.promo * D.wage[q] / D.wage[0];
    var months = D.bonus[q] * p.bonus;
    if (p.jumpAt != null && t / 4 < p.jumpAt) months = 0;          // residents get no bonus
    var k = E.label(q).k, bonusQ = (k === 2 || k === 4) ? monthly * months / 2 : 0;
    var regular = monthly * 3, annual = monthly * (12 + months);
    var tax = E.taxRate(annual, q), soc = E.social(q);
    var gross = regular + bonusQ;
    var net = gross * (1 - tax) - regular * soc.reg - bonusQ * soc.bon;
    var avgNet = annual / 4 * (1 - tax) - regular * soc.reg - months / 4 * monthly * soc.bon;
    return { gross: gross, net: net, regular: regular, bonus: bonusQ, monthly: monthly, annual: annual, avgNet: avgNet, months: months };
  };
  /* Unemployment benefit for a quarter: 60–80% of regular pay (50–80% from 2003), untaxed, with a daily cap. */
  E.benefit = function (s, q) {
    if (q == null) q = s.q;
    var pay = E.pay(s, q), q2000 = qi(2000, 2);
    var m2000 = pay.monthly * D.wage[q2000] / D.wage[q];
    var low = q >= qi(2003, 2) ? 0.5 : 0.6;
    var rate = m2000 <= 130000 ? 0.8 : m2000 >= 300000 ? low : 0.8 - (0.8 - low) * (m2000 - 130000) / 170000;
    var capDay = q >= qi(2003, 2) ? 7500 : 10000;                     // yen a day in 2000 money
    var cap = capDay * 91 * D.wage[q] / D.wage[q2000];
    return Math.min(rate * pay.regular, cap);
  };
  E.expenses = function (s, q) {
    if (q == null) q = s.q;
    return s.life * D.cpi[q] / D.cpi[s.start] * E.KIDS[s.kids];
  };
  E.intTax = function (q) { return q >= E.INT_TAX_FROM ? 0.20 : 0; };
  E.stockFee = function (q) { return q < qi(1999, 4) ? 0.012 : 0.005; };   // estimate: fixed commissions and transfer tax until Oct 1999
  E.GOLD_SPREAD = 0.03;                                                    // estimate: dealer buys back below its selling price

  /* Rental flats. A new flat costs D.house[q]; a flat bought earlier loses value and rent with age. */
  E.ageLoss = function (h, q) { return Math.max(0.4, 1 - E.AGE_LOSS * (q - h.bought) / 4); };
  E.rentQ = function (q, h) {
    var r = D.house[0] * E.RENT_YIELD / 4 * D.rent[q] / D.rent[0];
    return h ? r * Math.max(0.6, 1 - 0.01 * (q - h.bought) / 4) : r;
  };
  E.houseValue = function (h, q) { return D.house[q] * E.ageLoss(h, q); };
  E.mortPay = function (bal, rate) {
    var r = rate / 1200, n = E.LOAN_YEARS * 12;
    return 3 * bal * r / (1 - Math.pow(1 + r, -n));
  };
  function amortize(h) {
    var r = h.rate / 1200, m = h.pay / 3;
    for (var k = 0; k < 3; k++) { h.bal = Math.max(0, h.bal * (1 + r) - m); }
  }
  E.houseNet = function (h, q) { return E.rentQ(q, h) * E.RENT_KEEP - h.pay; };

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
    s.net0 = pay.avgNet;
    s.life0 = s.life = p.share * pay.avgNet;
    s.cash = Math.round(pay.avgNet * 0.5 / 1000) * 1000;
    s.hist.push(E.snapshot(s));
    return s;
  };

  E.netWorth = function (s) {
    var q = s.q, nw = s.cash + s.units * D.sp[q] + s.oz * D.gold[q];
    for (var i = 0; i < s.houses.length; i++) nw += E.houseValue(s.houses[i], q) - s.houses[i].bal;
    return nw;
  };
  E.passive = function (s) {
    var q = s.q;
    var interest = s.cash > 0 ? s.cash * D.tb[q] / 400 * (1 - E.intTax(q)) : 0;
    var div = s.units * D.div[q] / 4 * (1 - E.DIV_TAX);
    var rent = 0;
    for (var i = 0; i < s.houses.length; i++) rent += E.houseNet(s.houses[i], q);
    return { interest: interest, div: div, rent: rent, total: interest + div + rent };
  };
  E.required = function (s) { return E.expenses(s); };
  /* Goal of the Japan version: net worth covers GOAL_YEARS of living costs (貯蓄が生活費の何年分か).
     With deposit rates near zero after 1995, passive income could not cover expenses for anyone. */
  E.GOAL_YEARS = 10;
  E.cover = function (s) { return E.netWorth(s) / (E.expenses(s) * 4); };   // years of living costs saved
  E.freedom = function (s) { return E.cover(s) / E.GOAL_YEARS; };
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
  E.goldOpen = function () { return true; };
  E.buyGold = function (s, amount) {
    amount = Math.min(amount, s.cash); if (amount <= 0) return false;
    s.oz += amount / D.gold[s.q]; s.cash -= amount; s.cost.oz += amount; return true;
  };
  E.sellGold = function (s, frac) {
    if (s.oz <= 0) return false;
    var o = s.oz * frac; s.cash += o * D.gold[s.q] * (1 - E.GOLD_SPREAD); s.cost.oz *= (1 - frac); s.oz -= o;
    if (s.oz < 1e-9) { s.oz = 0; s.cost.oz = 0; } return true;
  };
  E.houseQuote = function (s) {
    var q = s.q, price = D.house[q], rate = D.mort[q];
    var loan = price * (1 - E.DOWN), pay = E.mortPay(loan, rate);
    var need = price * (E.DOWN + E.CLOSING);
    var rent = E.rentQ(q), sumPay = pay;
    for (var i = 0; i < s.houses.length; i++) sumPay += s.houses[i].pay;
    var rentAll = rent; for (var j = 0; j < s.houses.length; j++) rentAll += E.rentQ(q, s.houses[j]);
    var limit = 0.30 * E.pay(s).annual / 4 + 0.75 * rentAll;
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
  E.houseSale = function (s, i) { var h = s.houses[i]; return E.houseValue(h, s.q) * (1 - E.SELL_COST) - h.bal; };
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
  E.payLoan = function () { return false; };   // no student loans in this version

  var COSTS = 6, GAINS = 4;

  /* ---------- a turn: live through one quarter ---------- */
  E.step = function (s) {
    if (s.over) return null;
    var q = s.q, roll = s.rolls[s.t], p = E.prof(s.prof);
    var pay = E.pay(s), wasEmployed = s.employed;
    var f = {};
    f.salary = wasEmployed ? pay.net : E.benefit(s, q);
    f.bonus = wasEmployed ? pay.bonus : 0;
    f.expenses = E.expenses(s, q);
    f.interest = s.cash > 0 ? s.cash * D.tb[q] / 400 * (1 - E.intTax(q)) : s.cash * E.CARD_RATE / 400;
    f.div = s.units * D.div[q] / 4 * (1 - E.DIV_TAX);
    f.rent = 0;
    for (var i = 0; i < s.houses.length; i++) { f.rent += E.houseNet(s.houses[i], q); amortize(s.houses[i]); }
    f.event = 0;
    var notes = [];

    // a personal event
    var r = roll[1];
    if (r < 0.07) {
      f.event = -(0.25 + 0.45 * roll[2]) * f.expenses;
      notes.push({ kind: 'bad', key: 'cost' + Math.floor(roll[3] * COSTS), v: [-f.event] });
    } else if (r < 0.10) {
      f.event = (0.2 + 0.3 * roll[2]) * pay.avgNet;
      notes.push({ kind: 'good', key: 'gain' + Math.floor(roll[3] * GAINS), v: [f.event] });
    } else if (r < 0.125 && s.kids < 2 && s.t >= 4 && s.t < 36) {
      s.kids++;
      notes.push({ kind: 'life', key: 'baby', v: [Math.round((E.KIDS[s.kids] / E.KIDS[s.kids - 1] - 1) * 100)] });
    } else if (r < 0.14 && wasEmployed && s.t >= 4) {
      s.promo *= 1.05;
      notes.push({ kind: 'good', key: 'promo' });
    }

    // the job: layoff odds follow real unemployment; banks and brokers were failing in 1997–99
    if (wasEmployed) {
      var inResidency = p.jumpAt != null && s.t / 4 < p.jumpAt;
      var pj = clamp((D.un[q] - 1.0) * 0.006, 0.003, 0.04) * p.sens;
      if (p.bankRisk && q >= qi(1997, 4) && q <= qi(1999, 1)) pj += 0.04;
      if (!inResidency && s.t >= 2 && roll[0] < pj) {
        s.employed = false;
        s.off = 1 + (D.un[q] > 4 ? 1 : 0) + (roll[3] < 0.3 ? 1 : 0);
        notes.push({ kind: 'bad', key: p.bankRisk && q >= qi(1997, 4) && q <= qi(1999, 1) ? 'bankFail' : 'laidOff' });
      }
    } else {
      s.off--;
      if (s.off <= 0) { s.employed = true; s.promo *= E.REHIRE; notes.push({ kind: 'good', key: 'rehired' }); }
    }

    f.total = f.salary - f.expenses + f.interest + f.div + f.rent + f.event;
    s.cash += f.total;

    var prev = q;
    s.q = q + 1; s.t += 1;

    // lifestyle catches up with real pay growth
    var now = E.pay(s);
    var realNet = now.avgNet * D.cpi[s.start] / D.cpi[s.q];
    var target = s.life0 + E.CREEP * Math.max(0, realNet - s.net0);
    var lifeUp = false;
    if (target > s.life * 1.0005) { lifeUp = target > s.life * 1.15; s.life = target; }
    if (p.jumpAt != null && s.t / 4 === p.jumpAt) notes.push({ kind: 'good', key: 'residencyDone' });
    else if (lifeUp) notes.push({ kind: 'life', key: 'lifeUp' });

    // forced sale if consumer debt goes over the limit
    var limit = 2 * now.avgNet;
    if (s.cash < -limit) {
      if (s.oz > 0) { E.sellGold(s, 1); notes.push({ kind: 'bad', key: 'soldGold' }); }
      if (s.cash < -limit && s.units > 0) { E.sellStock(s, 1); notes.push({ kind: 'bad', key: 'soldStocks' }); }
      while (s.cash < -limit && s.houses.length) { E.sellHouse(s, 0); notes.push({ kind: 'bad', key: 'soldHouse' }); }
      if (s.cash < -limit) { s.over = true; s.bankrupt = true; notes.push({ kind: 'bad', key: 'bankrupt' }); }
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
      }
    };
    s.log.push(rep);
    return rep;
  };

  /* ---------- simple strategies to compare against ---------- */
  E.BOTS = {
    deposit: { key: 'botDeposit', act: function () {} },
    stocks: { key: 'botStocks', act: function (s) { var keep = E.expenses(s); if (s.cash > keep) E.buyStock(s, s.cash - keep); } },
    houses: { key: 'botHouses', act: function (s) { var keep = E.expenses(s) * 0.5; var k = E.houseQuote(s); if (k.ok && s.cash - k.need > keep) E.buyHouse(s); } }
  };
  E.runBot = function (profId, seed, start, bot) {
    var s = E.newGame(profId, seed, start);
    while (!s.over) { bot.act(s); E.step(s); }
    return s;
  };

  root.Engine = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
