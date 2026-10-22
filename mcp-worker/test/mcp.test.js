// MCP integration tests: JSON-RPC through the Worker fetch handler, with an in-memory Durable Object
// stand-in, and a parity replay of every MCP game against the original engine called directly.
import assert from "node:assert/strict";
import test from "node:test";
import worker, {GameSession} from "../src/index.js";
import USA from "../src/engine-usa.js";
import Japan from "../src/engine-japan.js";

function fakeNamespace() {
  const objects = new Map();
  return {
    idFromName: name => name,
    get(id) {
      if (!objects.has(id)) {
        const data = new Map();
        const state = {
          storage: {get: async k => structuredClone(data.get(k)), put: async (k, v) => { data.set(k, structuredClone(v)); }, setAlarm: async () => {}, deleteAll: async () => data.clear()},
          blockConcurrencyWhile: fn => fn()
        };
        objects.set(id, new GameSession(state, {}));
      }
      const obj = objects.get(id);
      return {fetch: (url, init) => obj.fetch(new Request(url, init))};
    }
  };
}
const env = {GAME_SESSIONS: fakeNamespace()};
let n = 0;
async function rpc(method, params) {
  const res = await worker.fetch(new Request("https://x/mcp", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({jsonrpc: "2.0", id: ++n, method, params})}), env);
  return res.status === 202 ? null : res.json();
}
async function call(name, args) {
  const r = await rpc("tools/call", {name, arguments: args});
  return {isError: !!r.result.isError, data: JSON.parse(r.result.content[0].text)};
}
const rid = () => "req-" + Math.random().toString(36).slice(2) + Date.now();

test("initialize and tools/list", async () => {
  const init = await rpc("initialize", {protocolVersion: "2025-06-18", capabilities: {}, clientInfo: {name: "t", version: "1"}});
  assert.equal(init.result.serverInfo.name, "someone-elses-shoes");
  const names = (await rpc("tools/list")).result.tools.map(t => t.name);
  for (const t of ["list_games", "open_game", "game_guide", "list_professions", "start_game", "get_status", "make_decision", "next_turn", "end_game"]) assert.ok(names.includes(t), t);
});

test("professions have names for both countries", async () => {
  for (const c of ["usa", "japan"]) {
    const {data} = await call("list_professions", {country: c});
    assert.ok(data.length >= 10);
    for (const p of data) assert.ok(p.name && p.name !== p.id && p.note, c + " " + p.id);
  }
});

for (const [country, E, prof] of [["usa", USA, "teacher"], ["japan", Japan, "salary"]]) {
  test(country + ": full game through MCP matches the original engine replay", async () => {
    const st = await call("start_game", {country, profession: prof});
    assert.equal(st.isError, false, JSON.stringify(st.data));
    const sid = st.data.session_id, s0 = st.data.state;
    assert.match(sid, /^[0-9a-f]{32}$/);
    assert.equal(s0.start_quarter_index, s0.game_seed % (E.MAX_START + 1), "start chosen as in the browser");
    // replay with the engine directly, same seed/start, same actions
    const ref = E.newGame(prof, s0.game_seed, s0.start_quarter_index);
    assert.equal(s0.cash, ref.cash); assert.equal(s0.net_worth, E.netWorth(ref));

    // get_status does not mutate
    const g1 = await call("get_status", {session_id: sid}), g2 = await call("get_status", {session_id: sid});
    assert.deepEqual(g1.data, g2.data); assert.equal(g1.data.state.turn, 0);

    // insufficient funds
    const tooMuch = await call("make_decision", {session_id: sid, action: "buy_stock", amount: s0.cash + 1, request_id: rid()});
    assert.equal(tooMuch.isError, true); assert.match(tooMuch.data.error, /insufficient funds/);

    // buy stock, idempotent by request_id
    const amt = Math.floor(s0.cash / 2), key = rid();
    const b1 = await call("make_decision", {session_id: sid, action: "buy_stock", amount: amt, request_id: key});
    assert.equal(b1.isError, false, JSON.stringify(b1.data));
    E.buyStock(ref, amt);
    const b2 = await call("make_decision", {session_id: sid, action: "buy_stock", amount: amt, request_id: key});
    assert.equal(b2.data.replayed, true);
    assert.equal(b2.data.state.stock_units, b1.data.state.stock_units, "retry did not buy twice");
    assert.equal((await call("get_status", {session_id: sid})).data.state.cash, ref.cash);
    // same request_id for another operation is refused
    const clash = await call("next_turn", {session_id: sid, request_id: key});
    assert.equal(clash.isError, true);

    // play quarters, replaying in the reference engine; idempotent next_turn
    let turns = 0, capitalChanged = false, last = b1.data.state;
    while (true) {
      const k = rid();
      const t = await call("next_turn", {session_id: sid, request_id: k});
      if (t.isError) { assert.match(t.data.error, /finished/); break; }
      E.step(ref); turns++;
      const again = await call("next_turn", {session_id: sid, request_id: k});
      assert.equal(again.data.state.turn, t.data.state.turn, "retry did not advance twice");
      assert.equal(t.data.state.turn, ref.t);
      assert.equal(t.data.state.cash, ref.cash, "cash parity at turn " + ref.t);
      assert.equal(t.data.state.net_worth, E.netWorth(ref), "net worth parity at turn " + ref.t);
      for (const note of t.data.report.notes) assert.ok(typeof note.text === "string" && note.text.length > 3, "note has text: " + JSON.stringify(note));
      if (t.data.state.net_worth !== last.net_worth) capitalChanged = true;
      last = t.data.state;
      // keep investing a little each year while possible
      if (ref.t % 4 === 0 && ref.cash > 100 && !ref.over && !ref.won) {
        const a = Math.floor(ref.cash / 4);
        const d = await call("make_decision", {session_id: sid, action: "buy_stock", amount: a, request_id: rid()});
        assert.equal(d.isError, false, JSON.stringify(d.data)); E.buyStock(ref, a);
      }
      if (ref.over || ref.won) { assert.ok(t.data.outcome, "outcome reported at the end"); }
    }
    assert.ok(turns >= 1 && turns <= E.LEN);
    assert.ok(capitalChanged);
    const end = await call("end_game", {session_id: sid, request_id: rid()});
    assert.equal(end.isError, false, JSON.stringify(end.data));
    assert.ok(["won", "finished", "bankrupt"].includes(end.data.outcome.result));
    assert.equal(end.data.outcome.net_worth_nominal, E.netWorth(ref));
    const after = await call("make_decision", {session_id: sid, action: "buy_stock", amount: 1, request_id: rid()});
    assert.equal(after.isError, true);
  });
}

test("errors: bad session, bad profession, ended early game", async () => {
  assert.equal((await call("get_status", {session_id: "0".repeat(32)})).isError, true);
  assert.equal((await call("get_status", {session_id: "nope"})).isError, true);
  assert.equal((await call("start_game", {country: "usa", profession: "astronaut"})).isError, true);
  const st = await call("start_game", {country: "usa", profession: "nurse"});
  const sid = st.data.session_id;
  const e = await call("end_game", {session_id: sid, request_id: rid()});
  assert.equal(e.data.outcome.turns_played, 0);
  assert.equal((await call("next_turn", {session_id: sid, request_id: rid()})).isError, true);
  assert.equal((await call("make_decision", {session_id: sid, action: "buy_stock", amount: 10})).isError, true, "request_id required");
});
