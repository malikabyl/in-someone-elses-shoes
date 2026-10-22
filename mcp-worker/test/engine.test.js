import assert from "node:assert/strict";
import test from "node:test";
import USA from "../src/engine-usa.js";
import Japan from "../src/engine-japan.js";
import {marketData} from "../src/market-data.js";
for (const [country,E] of Object.entries({usa:USA,japan:Japan})) {
 test(country+" engine reproduces deterministic simulation",()=>{
  E.init(marketData[country]);
  assert.ok(E.PROFS.length>=5);
  const p=E.PROFS[0].id;
  const a=E.newGame(p,12345,0),b=E.newGame(p,12345,0);
  assert.deepEqual(a,b);
  assert.equal(a.t,0);
  assert.equal(E.buyStock(a,Math.min(a.cash,10)),true);
  assert.ok(a.units>0);
  assert.equal(E.step(a)!=null,true);
  assert.equal(a.t,1);
  assert.equal(E.step(b)!=null,true);
  assert.equal(b.t,1);
  assert.ok(Number.isFinite(E.netWorth(a)));
 });
}
