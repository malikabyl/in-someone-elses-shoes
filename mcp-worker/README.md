# In Someone Else's Shoes MCP

Cloudflare Worker implementing stateless Streamable HTTP JSON-RPC MCP at `/mcp`, with game sessions persisted in a SQLite-backed Durable Object (`GAME_SESSIONS` → `GameSession`). The USA and Japan games are fully playable through MCP tools; the simulation is the original browser engine and historical data, extracted verbatim. The existing GitHub Pages games and their URLs are unchanged.

Live endpoint: https://someone-elses-shoes-mcp.someone-elses-shoes-mcp.workers.dev/mcp

## Tools
- `list_games`, `open_game(country)`, `game_guide(country)` — discovery, unchanged.
- `list_professions(country)` — the 10 professions of each game (Japan names and texts come from `japan/index.html`, see `src/japan-text.js`).
- `start_game(country, profession)` — new session; start quarter chosen as in the browser (`start = seed % (MAX_START+1)`).
- `get_status(session_id)` — read-only state, including the quarter's market prices, mortgage quote and refinance offers.
- One tool per action, each with `session_id` and `request_id`: `buy_stock(amount)`, `buy_gold(amount)`, `pay_loan(amount)` take game money; `sell_stock(fraction)`, `sell_gold(fraction)` take a share 0–1; `buy_house()`; `sell_house(house_index)`, `refinance(house_index)`. Refusals name the reason.
- `delete_game(session_id)` — erase the session immediately.

Every tool carries explicit `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` annotations (`openWorldHint` is false everywhere: the service only touches its own storage).
- `next_turn(session_id, request_id)` — exactly one quarter of the original engine; quarter notes include text.
- `end_game(session_id, request_id)` — final nominal and real outcome; works after the natural end too.

Mutating calls are idempotent by `request_id` (a key reused for another operation is refused). Sessions idle for 30 days are deleted by a Durable Object alarm.

## Develop and deploy
1. `npm install` in this folder.
2. `npm run check` — syntax checks, engine tests and MCP integration tests (`test/mcp.test.js` replays every MCP game in the original engine and compares each quarter).
3. `npx wrangler login`, then `npx wrangler deploy`.
4. Smoke test: `GET /health`, then POST `/mcp` with `initialize` and `tools/list`.

`src/japan-text.js` is generated from `japan/index.html` (`PROF.en`, `NOTES.en`); regenerate it if those texts change.

## Monetization
Keep the games free during validation. An optional donation button can be added after the company's verified donation/payment checkout URL is available. Do not embed bank credentials or unverified payment links.
