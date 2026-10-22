# Playable ChatGPT MCP — implementation contract

## Goal
Play the original USA (1971–1991) and Japan (1980–2005) historical financial simulations through ChatGPT without opening the browser. Preserve both existing GitHub Pages games and their URLs. The current Cloudflare Worker is a **discovery-only** MCP server; it is not yet playable.

## Source of truth
- USA: `index.html` embedded `DATA` and JavaScript game rules.
- Japan: `japan/index.html` embedded `DATA` and JavaScript game rules.
- MCP entrypoint: `mcp-worker/src/index.js`.
Extract deterministic simulation logic and historical datasets into shared testable modules; do **not** invent replacement market prices, salaries, events, or gameplay rules.

## MCP tools
- `list_games()` — preserve existing response.
- `open_game(country)` — preserve existing response.
- `game_guide(country)` — preserve existing response.
- `start_game(country, profession)` — create a new session and return initial state, valid actions, and session ID.
- `get_status(session_id)` — return quarter, profession, holdings, cash, debts, income, expenses, net worth, and current events.
- `make_decision(session_id, action, asset?, amount?)` — validate and execute one legal financial action, with explicit error on invalid/insufficient funds; no automatic quarter advance.
- `next_turn(session_id)` — advance exactly one quarter, apply original historical prices/events and cash flows, return a before/after summary.
- `end_game(session_id)` — finish and report real and nominal outcomes.

## Sessions and security
Persist per-game state across independent MCP calls; avoid relying on Cloudflare isolate memory. Durable Objects or another persistent store is acceptable only after confirming free-tier compatibility and costs. Use unguessable session IDs, bounded TTL, request validation, and idempotency tokens for mutating calls to prevent double-buying on retries. A user must not be able to manipulate another user's session. No user accounts or payments in v1.

## Acceptance tests
1. Both countries start with valid professions from the original game.
2. Invalid country/profession/session/action returns a structured error.
3. Initial financial state matches the browser version.
4. Same initial conditions and action sequence produce the same quarter-by-quarter outputs as the browser version (fixtures for each country).
5. Buy/sell cannot exceed available cash/holdings; no negative quantities.
6. `get_status` does not mutate the game; `next_turn` advances exactly one quarter.
7. Session survives worker restart and separate requests.
8. Original `list_games`, `open_game`, and `game_guide` remain compatible.
9. Browser game pages and original URLs remain untouched.
10. Live Cloudflare deployment and ChatGPT connection are separately verified before declaring playable.

## Rollout
1. Extract engine/data and write parity fixtures for USA.
2. Add persistent MCP session and decision tools; test locally.
3. Extend to Japan with parity fixtures.
4. Deploy Worker via authenticated Cloudflare account and smoke test live MCP.
5. Package private ChatGPT plugin, test gameplay end to end, then prepare public submission.
