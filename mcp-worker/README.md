# In Someone Else's Shoes MCP (prototype)

Cloudflare Worker implementing stateless Streamable HTTP JSON-RPC MCP at /mcp. This is a discovery/launcher integration, **not** the full game simulation. The existing GitHub Pages games and their URLs are unchanged.

## Deploy
1. Connect this repository to Cloudflare Workers or install Node.js and run `npm install` in this folder.
2. Authenticate with `npx wrangler login` and run `npm run deploy`.
3. Test GET /health, then POST /mcp with `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`.
4. Register the deployed Worker URL ending in /mcp in your MCP client. No Worker URL is live until deployment succeeds.

## Monetization
Keep the games free during validation. An optional donation button can be added after the company's verified donation/payment checkout URL is available. Do not embed bank credentials or unverified payment links.

## Next
To make actual turn-by-turn gameplay available through MCP, extract and test the browser simulation engine into a shared module and implement persistent game sessions (e.g., Durable Objects). Do not pretend that launcher tools are a complete playable MCP game.
