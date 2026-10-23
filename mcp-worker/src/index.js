import USA from "./engine-usa.js";
import Japan from "./engine-japan.js";
import {marketData} from "./market-data.js";
import {PROF as JA_PROF,NOTES as JA_NOTES} from "./japan-text.js";

const games={usa:{title:"In Someone Else's Shoes — USA",period:"1971–1991",url:"https://malikabyl.github.io/in-someone-elses-shoes/"},japan:{title:"In Someone Else's Shoes — Japan",period:"1980–2005",url:"https://malikabyl.github.io/in-someone-elses-shoes/japan/"}};
const engines={usa:USA,japan:Japan};
for(const country of Object.keys(engines))engines[country].init(marketData[country]);
const obj={type:"object",additionalProperties:false};
const str={type:"string"};
const country={...str,enum:["usa","japan"]};
const sid={...str,description:"Session ID returned by start_game."};
const rid={...str,minLength:8,maxLength:128,description:"Unique ID for this action; a retry with the same ID returns the first result instead of acting twice."};
const money={type:"number",exclusiveMinimum:0,description:"Amount of game money, at most the cash on hand."};
const fraction={type:"number",exclusiveMinimum:0,maximum:1,description:"Share of the holding to sell, from 0 to 1 (1 = all)."};
const houseIndex={type:"integer",minimum:0,description:"Index of an owned house in get_status.houses."};
// MCP tool annotations: the service only reads and writes its own game storage, never the outside world.
const READ={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const CREATE={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const ACT={readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const FINAL={readOnlyHint:false,destructiveHint:true,idempotentHint:true,openWorldHint:false};
const tool=(name,title,description,properties,required,annotations)=>({name,title,description,inputSchema:{...obj,properties,required},annotations:{title,...annotations}});
const tools=[
tool("list_games","List games","List the available historical financial simulation games.",{},[],READ),
tool("open_game","Open browser game","Return the URL of the playable browser version of a game.",{country},["country"],READ),
tool("game_guide","Game guide","Explain how to start and play a historical financial simulation.",{country},["country"],READ),
tool("list_professions","List professions","List the professions available in a country's game, with pay and risk notes.",{country},["country"],READ),
tool("start_game","Start game","Start a new game in the chosen country with a profession from list_professions. Returns a session_id.",{country,profession:{...str,description:"Profession id from list_professions."}},["country","profession"],CREATE),
tool("get_status","Get status","Read the game: quarter, money, holdings, debts, income, net worth and this quarter's prices and bank terms. Changes nothing.",{session_id:sid},["session_id"],READ),
tool("buy_stock","Buy stocks","Buy stock-index shares with game money at this quarter's price (broker commission applies).",{session_id:sid,request_id:rid,amount:money},["session_id","request_id","amount"],ACT),
tool("sell_stock","Sell stocks","Sell a share of the stock holding at this quarter's price.",{session_id:sid,request_id:rid,fraction},["session_id","request_id","fraction"],ACT),
tool("buy_gold","Buy gold","Buy gold with game money at this quarter's price (not allowed in the USA before 1975).",{session_id:sid,request_id:rid,amount:money},["session_id","request_id","amount"],ACT),
tool("sell_gold","Sell gold","Sell a share of the gold holding at this quarter's price.",{session_id:sid,request_id:rid,fraction},["session_id","request_id","fraction"],ACT),
tool("buy_house","Buy a home","Buy a home with a mortgage if the bank approves (see get_status.market.house_quote).",{session_id:sid,request_id:rid},["session_id","request_id"],ACT),
tool("sell_house","Sell a home","Sell an owned home; the mortgage is repaid from the proceeds.",{session_id:sid,request_id:rid,house_index:houseIndex},["session_id","request_id","house_index"],ACT),
tool("refinance","Refinance mortgage","Refinance an owned home's mortgage when a lower rate is offered (see get_status.market.refinance_offers).",{session_id:sid,request_id:rid,house_index:houseIndex},["session_id","request_id","house_index"],ACT),
tool("pay_loan","Repay student loan","Repay part of the student loan with game money.",{session_id:sid,request_id:rid,amount:money},["session_id","request_id","amount"],ACT),
tool("next_turn","Next quarter","Advance exactly one historical quarter: pay, expenses, market moves and life events.",{session_id:sid,request_id:rid},["session_id","request_id"],ACT),
tool("end_game","End game","Finish the game and report nominal and inflation-adjusted net worth. No further moves are possible.",{session_id:sid,request_id:rid},["session_id","request_id"],FINAL),
tool("delete_game","Delete game","Permanently delete the game session and all its stored data now. Cannot be undone.",{session_id:sid},["session_id"],FINAL)
];
const ACTIONS=["buy_stock","sell_stock","buy_gold","sell_gold","buy_house","sell_house","refinance","pay_loan"];
const ok=(id,value)=>({jsonrpc:"2.0",id,result:value});
const err=(id,code,message)=>({jsonrpc:"2.0",id,error:{code,message}});
const response=(data,isError=false)=>({content:[{type:"text",text:JSON.stringify(data)}],...(isError?{isError:true}:{})});
const validSession=id=>typeof id==="string"&&/^[0-9a-f]{32}$/.test(id);
const SESSION_TTL_MS=30*24*3600*1000;
// Profession names and quarter notes as the browser pages show them (Japan keeps its texts in the page, not the engine).
const commas=x=>Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
function professions(country){
 return engines[country].PROFS.map(p=>country==="japan"?{id:p.id,name:JA_PROF[p.id]?.[0]??p.id,note:JA_PROF[p.id]?.[1]??""}:{id:p.id,name:p.name,note:p.note});
}
function withText(country,report){
 if(!report||country!=="japan")return report;
 return {...report,notes:report.notes.map(n=>{let t=JA_NOTES[n.key]||n.key;if(n.v)t=t.replace("{0}",/^cost|^gain/.test(n.key)?(n.v[0]<-0.5?"−":"")+"¥"+commas(Math.abs(n.v[0])):n.v[0]);return {...n,text:t};})};
}
// Same start as the browser game: newOffer() picks seed in 1..2^31-1 and start = seed % (MAX_START+1).
function newSeed(E){const seed=1+Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*2147483647);return {seed,start:seed%(E.MAX_START+1)};}
function market(E,s){
 const D=E.D,q=s.q,k=E.houseQuote(s);
 return {stock_index:D.sp[q],stock_fee:E.stockFee(q),gold_price:D.gold[q],gold_open:E.goldOpen(s),house_price:D.house[q],mortgage_rate:D.mort[q],deposit_rate:D.tb[q],
  house_quote:{ok:k.ok,refused_because:k.why,cash_needed:k.need,price:k.price,quarterly_payment:k.pay},
  refinance_offers:s.houses.map((h,i)=>{const r=E.refiQuote(s,i);return {house_index:i,offered:r.offered,ok:r.ok,rate:r.rate,fee:r.fee,new_payment:r.pay};})};
}
function status(country,s){
 const E=engines[country],date=E.label(s.q),passive=E.passive(s);
 return {country,currency:country==="japan"?"JPY":"USD",game_seed:s.seed,start_quarter_index:s.start,profession:s.prof,quarter:`${date.y}Q${date.k}`,turn:s.t,total_turns:E.LEN,employed:s.employed,cash:s.cash,stock_units:s.units,gold_ounces:s.oz,houses:s.houses,student_loan:s.loan,net_worth:E.netWorth(s),real_net_worth:E.snapshot(s).real,quarterly_expenses:E.expenses(s),passive_income:passive,financial_freedom_ratio:E.freedom(s),won:s.won,won_at_turn:s.wonAt,over:s.over,bankrupt:s.bankrupt,market:market(E,s)};
}
function outcome(country,s){
 const E=engines[country],snap=E.snapshot(s),a=E.label(s.start),b=E.label(s.q);
 return {result:s.bankrupt?"bankrupt":s.won?"won":"finished",period:`${a.y}Q${a.k}–${b.y}Q${b.k}`,turns_played:s.t,net_worth_nominal:snap.nw,net_worth_real_start_prices:snap.real,financial_freedom_ratio:snap.free,won_in_year:s.won?Math.ceil(s.wonAt/4):null};
}
// Why a decision was refused, in the engine's own terms; null when the engine accepts it.
function refusal(E,s,action,amount,house_index){
 const finite=Number.isFinite(amount),house=Number.isInteger(house_index)&&house_index>=0&&house_index<s.houses.length;
 if(["buy_stock","buy_gold","pay_loan"].includes(action)){
  if(!finite||amount<=0)return "amount must be a positive number of money";
  if(amount>s.cash)return `insufficient funds: amount ${amount} exceeds cash ${s.cash}`;
 }
 if(["sell_stock","sell_gold"].includes(action)&&(!finite||amount<=0||amount>1))return "amount must be a fraction between 0 and 1";
 if(action==="sell_stock"&&s.units<=0)return "no stocks to sell";
 if(action==="sell_gold"&&s.oz<=0)return "no gold to sell";
 if((action==="buy_gold"||action==="sell_gold")&&!E.goldOpen(s))return "gold ownership is not legal yet in this quarter";
 if(action==="pay_loan"&&!s.loan)return "no student loan to pay";
 if(action==="buy_house"){const k=E.houseQuote(s);if(!k.ok)return k.why==="cash"?`insufficient funds: need ${k.need}, cash ${s.cash}`:k.why==="job"?"the bank refuses: you are unemployed":"the bank refuses: total mortgage payments would exceed the income limit";}
 if((action==="sell_house"||action==="refinance")&&!house)return "house_index must point to an owned house";
 if(action==="refinance"){const r=E.refiQuote(s,house_index);if(!r.ok)return r.offered?`insufficient funds for refinancing fee ${r.fee}`:"no refinancing offer: market rate is not at least 1 point below your rate";}
 return null;
}
export class GameSession{
 constructor(state,env){this.state=state;this.env=env;}
 async alarm(){await this.state.storage.deleteAll();}
 async fetch(request){
  const {op,args={}}=await request.json();
  return await this.state.blockConcurrencyWhile(async()=>{
   let saved=await this.state.storage.get("game");
   if(op==="start"){
    if(saved)return Response.json({error:"Session already exists"},{status:409});
    const {country,profession}=args,E=engines[country];
    if(!E||!E.prof(profession))return Response.json({error:"Invalid country or profession"},{status:400});
    const {seed,start}=newSeed(E);
    const s=E.newGame(profession,seed,start);
    saved={country,s,finished:false,requests:{}};
    await this.state.storage.put("game",saved);
    await this.state.storage.setAlarm(Date.now()+SESSION_TTL_MS);
    return Response.json({state:status(country,s)});
   }
   if(!saved)return Response.json({error:"Session not found"},{status:404});
   if(op==="delete"){await this.state.storage.deleteAlarm();await this.state.storage.deleteAll();return Response.json({deleted:true});}
   const {country,s}=saved,E=engines[country];
   if(op==="status")return Response.json({state:status(country,s),...(saved.finished||s.over||s.won?{outcome:outcome(country,s)}:{})});
   const key=args.request_id;
   if(typeof key!=="string"||key.length<8||key.length>128)return Response.json({error:"request_id must be 8–128 characters"},{status:400});
   const cached=saved.requests[key],opKey=op==="decision"?args.action:op;
   if(cached){
    if(cached.op&&cached.op!==opKey)return Response.json({error:`request_id already used for a different operation (${cached.op})`},{status:409});
    return Response.json({...cached.result,replayed:true});
   }
   let result;
   if(op==="end"){saved.finished=true;result={finished:true,outcome:outcome(country,s),state:status(country,s)};}
   else if(saved.finished||s.over||s.won)return Response.json({error:"Game is finished; call end_game for the outcome",state:status(country,s)},{status:409});
   else if(op==="next"){const report=withText(country,E.step(s));result={report,state:status(country,s)};if(s.over||s.won)result.outcome=outcome(country,s);}
   else if(op==="decision"){
    const {action,amount,house_index}=args;
    const why=refusal(E,s,action,amount,house_index);
    if(why)return Response.json({error:why,state:status(country,s)},{status:400});
    const done={buy_stock:()=>E.buyStock(s,amount),sell_stock:()=>E.sellStock(s,amount),buy_gold:()=>E.buyGold(s,amount),sell_gold:()=>E.sellGold(s,amount),buy_house:()=>E.buyHouse(s),sell_house:()=>E.sellHouse(s,house_index),refinance:()=>E.refinance(s,house_index),pay_loan:()=>E.payLoan(s,amount)}[action]?.();
    if(done!==true)return Response.json({error:"Invalid or unavailable action",state:status(country,s)},{status:400});
    result={action,executed:true,state:status(country,s)};
   }else return Response.json({error:"Unknown operation"},{status:400});
   saved.requests[key]={op:opKey,result};
   const ids=Object.keys(saved.requests);if(ids.length>100)delete saved.requests[ids[0]];
   await this.state.storage.put("game",saved);
   await this.state.storage.setAlarm(Date.now()+SESSION_TTL_MS);
   return Response.json(result);
  });
 }
}
async function invoke(env,name,args){
 if(name==="list_games")return response(games);
 if(name==="open_game"||name==="game_guide"){
  const game=games[args.country];if(!game)return response({error:"Invalid country"},true);
  return response(name==="open_game"?game:{...game,instructions:"Open the browser game, select a profession, invest, and advance one quarter at a time. Or use start_game to play directly in ChatGPT."});
 }
 if(name==="list_professions"){
  return engines[args.country]?response(professions(args.country)):response({error:"Invalid country"},true);
 }
 if(!env.GAME_SESSIONS)return response({error:"Persistent GAME_SESSIONS binding is not configured"},true);
 let sessionId=args.session_id;
 if(name==="start_game"){
  if(!engines[args.country]||!engines[args.country].prof(args.profession))return response({error:"Invalid country or profession. Use list_professions."},true);
  sessionId=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
 }else if(!validSession(sessionId))return response({error:"Invalid session_id"},true);
 const id=env.GAME_SESSIONS.idFromName(sessionId),stub=env.GAME_SESSIONS.get(id);
 const op=ACTIONS.includes(name)?"decision":{start_game:"start",get_status:"status",next_turn:"next",end_game:"end",delete_game:"delete"}[name];
 if(!op)return response({error:"Unknown tool"},true);
 // One tool per action; sells take `fraction`, the engine calls it amount.
 const opArgs=op==="decision"?{request_id:args.request_id,action:name,amount:name==="sell_stock"||name==="sell_gold"?args.fraction:args.amount,house_index:args.house_index}:args;
 const res=await stub.fetch("https://session.internal/",{method:"POST",body:JSON.stringify({op,args:opArgs})});
 const result=await res.json();
 return response(res.ok?{session_id:sessionId,...result}:result,!res.ok);
}
async function dispatch(msg,env){
 const id=msg?.id??null,method=msg?.method;
 if(method==="notifications/initialized")return null;
 if(method==="initialize")return ok(id,{protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"someone-elses-shoes",title:"In Someone Else's Shoes",version:"0.2.0"}});
 if(method==="ping")return ok(id,{});
 if(method==="tools/list")return ok(id,{tools});
 if(method==="tools/call"){try{return ok(id,await invoke(env,msg.params?.name,msg.params?.arguments||{}))}catch(e){return ok(id,response({error:"Game operation failed"},true))}}
 return err(id,-32601,"Method not found");
}
export default {async fetch(request,env){
 const headers={"access-control-allow-origin":"*","access-control-allow-methods":"POST,GET,OPTIONS","access-control-allow-headers":"content-type,mcp-protocol-version","access-control-expose-headers":"mcp-session-id","cache-control":"no-store"};
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 const path=new URL(request.url).pathname;
 if(path==="/health")return Response.json({ok:true,service:"someone-elses-shoes-mcp"},{headers});
 // OpenAI Apps domain verification: the token from the developer portal lives in the OPENAI_APPS_CHALLENGE variable.
 if(path==="/.well-known/openai-apps-challenge"){const t=(env?.OPENAI_APPS_CHALLENGE||"").trim();return t?new Response(t,{headers:{"content-type":"text/plain","cache-control":"no-store"}}):new Response("Not found",{status:404,headers});}
 if(path!=="/mcp")return new Response("Not found",{status:404,headers});
 if(request.method==="GET")return new Response("Use POST JSON-RPC",{status:405,headers});
 if(request.method!=="POST")return new Response("Method not allowed",{status:405,headers});
 let body;try{body=await request.json()}catch{return Response.json(err(null,-32700,"Parse error"),{status:400,headers})}
 const batch=Array.isArray(body),messages=batch?body:[body];
 if(!messages.length)return Response.json(err(null,-32600,"Invalid Request"),{status:400,headers});
 const results=await Promise.all(messages.map(m=>dispatch(m,env))),responses=results.filter(Boolean);
 if(!responses.length)return new Response(null,{status:202,headers});
 return Response.json(batch?responses:responses[0],{headers:{"content-type":"application/json",...headers}});
}};
