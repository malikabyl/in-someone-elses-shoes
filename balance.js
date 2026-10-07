#!/usr/bin/env node
/* Прогон баланса для игры «Колесо».

   Запуск:  node balance.js путь/к/index.html [число_зёрен]

   Движок и данные берутся прямо из index.html, поэтому прогон всегда идёт
   на тех параметрах, которые сейчас стоят в игре.

   Что делает: для каждой профессии и каждой стратегии играет партии со всех
   возможных стартов (0..E.MAX_START, сейчас их 20) и с N зёрнами на старт
   (по умолчанию 10), то есть 200 партий на пару «профессия × стратегия».

   Зёрна не случайные, а заданы формулой:  seed = k * 7919 + start,
   k = 1..N. 7919 — произвольное простое число, чтобы зёрна соседних стартов
   не шли подряд. Одни и те же зёрна используются для всех профессий и всех
   стратегий, поэтому прогон воспроизводим, а стратегии сравниваются на
   одинаковых личных событиях (сокращения, счета, повышения заданы зерном
   и не зависят от действий игрока).

   В игре старт выбирается как seed % 20; здесь старт передаётся явно,
   чтобы каждый стартовый квартал получил поровну партий. */
'use strict';
const fs = require('fs');
const vm = require('vm');

const file = process.argv[2];
const SEEDS = parseInt(process.argv[3] || '10', 10);
if (!file) { console.error('Укажите путь к index.html'); process.exit(1); }

/* ---------- достаём DATA и Engine из index.html ---------- */
const html = fs.readFileSync(file, 'utf8');
const box = {}; box.globalThis = box; vm.createContext(box);
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const code of blocks) {
  try { vm.runInContext(code, box); } catch (e) { /* блок интерфейса требует браузер — пропускаем */ }
  if (box.DATA && box.Engine) break;
}
if (!box.DATA || !box.Engine) { console.error('В файле не найдены DATA и Engine'); process.exit(1); }
const E = box.Engine, D = box.DATA;
E.init(D);

/* ---------- стратегии ---------- */

/* «Толковый игрок»: не знает будущего, смотрит только на текущие ставки. */
const human = { name: 'толковая', act(s) {
  for (let i = 0; i < s.houses.length; i++) E.refinance(s, i);          // рефинансирует, как только выгодно
  const exp = E.expenses(s), keep = exp * 0.5;                          // подушка: половина квартальных расходов
  if (s.loan && s.cash > exp) E.payLoan(s, s.cash - exp);               // сначала гасит заём на учёбу
  if (s.t >= 52) {                                                      // последние два года: в то, что платит больше
    for (let i = s.houses.length - 1; i >= 0; i--) {
      const equity = E.houseSale(s, i);
      if (E.houseNet(s.houses[i], s.q) * 4 / Math.max(equity, 1) < D.tb[s.q] / 100) E.sellHouse(s, i);
    }
    if (D.div[s.q] / D.sp[s.q] < D.tb[s.q] / 100) E.sellStock(s, 1);
    return;
  }
  for (let n = 0; n < 2; n++) {                                         // дома при ипотеке ниже 10,5%
    const k = E.houseQuote(s);
    if (k.ok && k.rate < 10.5 && s.cash - k.need > keep) E.buyHouse(s); else break;
  }
  if (D.tb[s.q] < 9 && s.cash > keep * 2) E.buyStock(s, s.cash - keep * 2);   // акции при ставке по счёту ниже 9%
  if (D.tb[s.q] >= 11 && s.units > 0) E.sellStock(s, 1);                       // при ставке от 11% уходит в деньги
} };

/* «Оракул»: знает цены следующего квартала (и цену дома на 2 года вперёд). Верхняя граница, не стратегия для людей. */
const oracle = { name: 'оракул', act(s) {
  for (let i = 0; i < s.houses.length; i++) E.refinance(s, i);
  const q = s.q, exp = E.expenses(s), keep = exp * 0.3;
  if (s.loan && s.cash > exp && D.tb[q] < 7) E.payLoan(s, s.cash - exp);
  if (s.t >= 55) {                                                      // перед финишем превращает капитал в доход
    for (let i = s.houses.length - 1; i >= 0; i--) {
      const equity = E.houseSale(s, i);
      if (E.houseNet(s.houses[i], q) * 4 / Math.max(equity, 1) < D.tb[q] / 100) E.sellHouse(s, i);
    }
    E.sellStock(s, 1); E.sellGold(s, 1);
    return;
  }
  const rc = D.tb[q] / 400;                                              // доходность счёта за квартал
  const rs = D.sp[q + 1] / D.sp[q] - 1 + D.div[q] / 4 / D.sp[q];         // акции: будущая цена плюс дивиденд
  const rg = D.gold[q + 1] / D.gold[q] - 1;                              // золото: будущая цена
  const q8 = Math.min(q + 8, D.house.length - 1);
  for (let n = 0; n < 3; n++) {                                          // дом, если за 2 года он подорожает больше чем на 12%
    const k = E.houseQuote(s);
    if (k.ok && D.house[q8] / D.house[q] > 1.12 && s.cash - k.need > keep) E.buyHouse(s); else break;
  }
  if (rs < rc - 0.01 && s.units > 0) E.sellStock(s, 1);
  if (rg < rc - 0.02 && s.oz > 0) E.sellGold(s, 1);
  const free = s.cash - keep; if (free <= 0) return;
  if (E.goldOpen(s) && rg > rs + 0.01 && rg > rc + 0.03) E.buyGold(s, free);
  else if (rs > rc + 0.015) E.buyStock(s, free);
} };

const bots = { 'депозит': E.BOTS.deposit, 'акции': E.BOTS.stocks, 'толковая': human, 'оракул': oracle };

/* ---------- прогон ---------- */
function quantiles(a) { a = a.slice().sort((x, y) => x - y); const n = a.length; return [a[Math.floor(n * 0.1)], a[Math.floor(n / 2)], a[Math.floor(n * 0.9)]]; }
const pct = x => (x * 100).toFixed(0).padStart(4) + '%';

console.log(`Стартов: ${E.MAX_START + 1}, зёрен на старт: ${SEEDS}, партий на строку: ${(E.MAX_START + 1) * SEEDS}`);
console.log('профессия            стратегия  свобода в конце p10/медиана/p90  капитал(медиана)  победы  год победы  банкротства');
for (const p of E.PROFS) {
  for (const [id, bot] of Object.entries(bots)) {
    const free = [], real = [], wonAt = []; let won = 0, bankrupt = 0, n = 0;
    for (let start = 0; start <= E.MAX_START; start++) {
      for (let k = 1; k <= SEEDS; k++) {
        const s = E.runBot(p.id, k * 7919 + start, start, bot);
        const last = s.hist[s.hist.length - 1];
        free.push(last.free); real.push(last.real);
        if (s.won) { won++; wonAt.push(s.wonAt); }
        if (s.bankrupt) bankrupt++;
        n++;
      }
    }
    const f = quantiles(free), r = quantiles(real);
    console.log(p.name.padEnd(20), id.padEnd(9), pct(f[0]), pct(f[1]), pct(f[2]), ' ', ('$' + Math.round(r[1])).padStart(9), '        ', pct(won / n),
      wonAt.length ? String(Math.ceil(quantiles(wonAt)[1] / 4)).padStart(8) : '       —', '    ', pct(bankrupt / n));
  }
}
/* Столбцы:
   свобода — пассивный доход / обязательные расходы на момент окончания партии;
   капитал — чистый капитал в ценах стартового квартала;
   победы — доля партий, где свобода держалась >= 100% четыре квартала подряд;
   год победы — медианный год карьеры, в котором засчитана победа. */
