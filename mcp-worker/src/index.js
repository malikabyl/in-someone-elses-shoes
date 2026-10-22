import USA from "./engine-usa.js";
import Japan from "./engine-japan.js";
import {marketData} from "./market-data.js";

const games={usa:{title:"In Someone Else's Shoes — USA",period:"1971–1991",url:"https://malikabyl.github.io/in-someone-elses-shoes/"},japan:{title:"In Someone Else's Shoes — Japan",period:"1980–2005",url:"https://malikabyl.github.io/in-someone-elses-shoes/japan/"}};
const engines={usa:USA,japan:Japan};
for(const country of Object.keys(engines))engines[country].init(marketData[country]);
const obj={type:"object",additionalProperties:false};
const str={type:"string"};
const tools=[
{name:"list_games",description:"List the available historical financial simulation games.",inputSchema:{...obj,properties:{}}},
{name:"open_game",description:"Return the URL of the actual playable browser game.",inputSchema:{...obj,properties:{country:{...str,enum:["usa","japan"]}},required:["country"]}},
{name:"game_guide",description:"Explain how to start a historical financial simulation.",inputSchema:{...obj,properties:{country:{...str,enum:["usa","japan"]}},required:["country"]}},
{name:"start_game",description:"Start a new playable historical finance game. Call with country and profession from list_professions.",inputSchema:{...obj,properties:{country:{...str,enum:["usa","japan"]},profession:str},required:["country","profession"]}},
{name:"list_professions",description:"List authentic professions available for a country.",inputSchema:{...obj,properties:{country:{...str,enum:["usa","japan"]}},required:["country"]}},
{name:"get_status",description:"Read current game status. Does not advance time.",inputSchema:{...obj,properties:{session_id:str},required:["session_id"]}},
{name:"make_decision",description:"Trade assets in the current quarter. Actions: buy_stock, sell_stock, buy_gold, sell_gold, buy_house, sell_house, refinance, pay_loan. For buys and loan payments amount is money; for sells amount is a fraction 0–1; house actions use house_index.",inputSchema:{...obj,properties:{session_id:str,action:{...str,enum:["buy_stock","sell_stock","buy_gold","sell_gold","buy_house","sell_house","refinance","pay_loan"]},amount:{type:"number"},house_index:{type:"integer",minimum:0},request_id:str},required:["session_id","action","request_id"]}},
{name:"next_turn",description:"Advance exactly one historical quarter. Provide a unique request_id to avoid duplicate turns.",inputSchema:{...obj,properties:{session_id:str,request_id:str},required:["session_id","request_id"]}},
{name:"end_game",description:"Finish the current session and get nominal and inflation-adjusted net worth.",inputSchema:{...obj,properties:{session_id:str,request_id:str},required:["session_id","request_id"]}}
];
const ok=(id,value)=>({jsonrpc:"2.0",id,result:value});
const err=(id,code,message)=>({jsonrpc:"2.0",id,error:{code,message}});
const response=(data,isError=false)=>({content:[{type:"text",text:JSON.stringify(data)}],...(isError?{isError:true}:{})});
const validSession=id=>typeof id==="string"&&/^[0-9a-f]{32}$/.test(id);
function status(country,s){
 const E=engines[country],date=E.label(s.q),passive=E.passive(s);
 return {country,profession:s.prof,quarter:`${date.y}Q${date.k}`,turn:s.t,total_turns:E.LEN,employed:s.employed,cash:s.cash,stock_units:s.units,gold_ounces:s.oz,houses:s.houses,student_loan:s.loan,net_worth:E.netWorth(s),real_net_worth:E.snapshot(s).real,quarterly_expenses:E.expenses(s),passive_income:passive,financial_freedom_ratio:E.freedom(s),won:s.won,over:s.over,bankrupt:s.bankrupt};
}
export class GameSession{
 constructor(state,env){this.state=state;this.env=env;}
 async fetch(request){
  const {op,args={}}=await request.json();
  return await this.state.blockConcurrencyWhile(async()=>{
   let saved=await this.state.storage.get("game");
   if(op==="start"){
    if(saved)return Response.json({error:"Session already exists"},{status:409});
    const {country,profession}=args,E=engines[country];
    if(!E||!E.prof(profession))return Response.json({error:"Invalid country or profession"},{status:400});
    const seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;
    const s=E.newGame(profession,seed);
    saved={country,s,finished:false,requests:{}};
    await this.state.storage.put("game",saved);
    return Response.json({state:status(country,s)});
   }
   if(!saved)return Response.json({error:"Session not found"},{status:404});
   const {country,s}=saved,E=engines[country];
   if(op==="status")return Response.json({state:status(country,s)});
   const key=args.request_id;
   if(typeof key!=="string"||key.length<8||key.length>128)return Response.json({error:"request_id must be 8–128 characters"},{status:400});
   if(saved.requests[key])return Response.json(saved.requests[key]);
   if(saved.finished||s.over||s.won)return Response.json({error:"Game is finished",state:status(country,s)},{status:409});
   let result;
   if(op==="end"){saved.finished=true;result={finished:true,state:status(country,s)};}
   else if(op==="next"){const report=E.step(s);result={report,state:status(country,s)};}
   else if(op==="decision"){
    const {action,amount,house_index}=args;
    const cash=s.cash,finite=Number.isFinite(amount);
    let done=false;
    if(action==="buy_stock"&&finite&&amount>0&&amount<=cash)done=E.buyStock(s,amount);
    else if(action==="sell_stock"&&finite&&amount>0&&amount<=1)done=E.sellStock(s,amount);
    else if(action==="buy_gold"&&finite&&amount>0&&amount<=cash)done=E.buyGold(s,amount);
    else if(action==="sell_gold"&&finite&&amount>0&&amount<=1)done=E.sellGold(s,amount);
    else if(action==="buy_house")done=E.buyHouse(s)===true;
    else if(action==="sell_house"&&Number.isInteger(house_index)&&house_index>=0&&house_index<s.houses.length)done=E.sellHouse(s,house_index);
    else if(action==="refinance"&&Number.isInteger(house_index)&&house_index>=0&&house_index<s.houses.length)done=E.refinance(s,house_index);
    else if(action==="pay_loan"&&finite&&amount>0&&amount<=cash&&s.loan&&amount<=s.loan.bal)done=E.payLoan(s,amount);
    if(!done)return Response.json({error:"Invalid or unavailable action, amount, or insufficient funds",state:status(country,s)},{status:400});
    result={action,executed:true,state:status(country,s)};
   }else return Response.json({error:"Unknown operation"},{status:400});
   saved.requests[key]=result;
   const ids=Object.keys(saved.requests);if(ids.length>100)delete saved.requests[ids[0]];
   await this.state.storage.put("game",saved);
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
  const E=engines[args.country];return E?response(E.PROFS.map(({id,name,note})=>({id,name,note}))):response({error:"Invalid country"},true);
 }
 if(!env.GAME_SESSIONS)return response({error:"Persistent GAME_SESSIONS binding is not configured"},true);
 let sessionId=args.session_id;
 if(name==="start_game"){
  if(!engines[args.country]||!engines[args.country].prof(args.profession))return response({error:"Invalid country or profession. Use list_professions."},true);
  sessionId=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
 }else if(!validSession(sessionId))return response({error:"Invalid session_id"},true);
 const id=env.GAME_SESSIONS.idFromName(sessionId),stub=env.GAME_SESSIONS.get(id);
 const op={start:"start",get_status:"status",make_decision:"decision",next_turn:"next",end_game:"end"}[name];
 if(!op)return response({error:"Unknown tool"},true);
 const res=await stub.fetch("https://session.internal/",{method:"POST",body:JSON.stringify({op,args})});
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
