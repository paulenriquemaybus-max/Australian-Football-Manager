
/* ==========================================================
   AUSTRALIAN FOOTBALL MANAGER V6 FULL ENGINE
   ========================================================== */
(function(){
"use strict";

const KEY="AFM_V6_FULL_SAVE";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);

const V6={
 version:"V6",
 maxGames:34,
 tiers:3,
 formations:{
  "4-3-3":["GK","LB","CB","CB","RB","CM","CM","CM","LW","ST","RW"],
  "4-2-3-1":["GK","LB","CB","CB","RB","CDM","CDM","LW","CAM","RW","ST"],
  "4-4-2":["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"],
  "3-5-2":["GK","CB","CB","CB","LM","CM","CM","CM","RM","ST","ST"],
  "5-3-2":["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"],
  "4-4-1-1":["GK","LB","CB","CB","RB","LM","CM","CM","RM","CAM","ST"]
 },
 rarities:[
  ["Common",55],["Uncommon",25],["Rare",12],["Elite",6],
  ["World Class",1.8],["Legendary",0.2]
 ],
 tactics:["Balanced","Attacking","Defensive","High Press","Counter Attack","Possession"],
 upgradeCosts:{pace:1,shooting:1,passing:1,dribbling:1,physical:1,defending:1,goalkeeping:1},
 ratingOverrides:{"Cristiano Ronaldo":95,"Lionel Messi":94},

 state:{
  saveVersion:6,
  manager:{name:"Manager",reputation:50},
  club:{name:"My Club",money:10000000,transferBudget:5000000,trainingPoints:100},
  season:{year:2026,round:1,phase:"regular"},
  teams:[],
  players:[],
  news:[],
  bids:[],
  history:[],
  saves:{},
  timelineId:"main"
 },

 normalizePlayer(p){
  if(!p) return null;
  const q={...p};
  q.id=String(q.id||q.playerId||q.name||uid());
  q.name=q.name||"Unknown Player";
  q.position=(q.position||q.pos||"CM").toUpperCase();
  q.ovr=clamp(num(q.ovr??q.rating??q.overall,60),1,99);
  q.potential=clamp(num(q.potential,q.ovr),q.ovr,99);
  q.value=Math.max(0,num(q.value??q.marketValue,100000));
  q.wage=Math.max(0,num(q.wage,5000));
  q.contractYears=num(q.contractYears,2);
  q.fitness=clamp(num(q.fitness,100),0,100);
  q.form=clamp(num(q.form,70),1,100);
  q.morale=clamp(num(q.morale,75),1,100);
  q.trainingPoints=num(q.trainingPoints,0);
  if(V6.ratingOverrides[q.name]) q.ovr=V6.ratingOverrides[q.name];
  q.rarity=q.rarity||V6.rarityForRating(q.ovr);
  return q;
 },

 rarityForRating(r){
  r=num(r,60);
  if(r>=90)return"Legendary";
  if(r>=85)return"World Class";
  if(r>=80)return"Elite";
  if(r>=75)return"Rare";
  if(r>=68)return"Uncommon";
  return"Common";
 },

 chanceRarity(){
  let x=Math.random()*100;
  for(const [name,chance] of V6.rarities){if(x<chance)return name;x-=chance;}
  return"Common";
 },

 generatePlayer(opts={}){
  const rarity=opts.rarity||V6.chanceRarity();
  const range={Common:[55,67],Uncommon:[64,72],Rare:[70,79],Elite:[77,85],"World Class":[84,92],Legendary:[90,96]}[rarity]||[55,67];
  const ovr=Math.round(range[0]+Math.random()*(range[1]-range[0]));
  const names=["Alex","Jordan","Luca","Noah","Leo","Ethan","Kai","Mason","Oscar","Ryan","Mateo","Daniel","Adam","Jack","Sam"];
  const surnames=["Smith","Williams","Brown","Taylor","Wilson","Martin","Jones","Miller","Anderson","Davis","Clark","Walker","Hall","Young","King"];
  const pos=["GK","LB","CB","RB","CDM","CM","CAM","LW","RW","ST"][Math.floor(Math.random()*10)];
  return V6.normalizePlayer({
   id:uid(),name:names[Math.floor(Math.random()*names.length)]+" "+surnames[Math.floor(Math.random()*surnames.length)],
   position:pos,ovr,potential:Math.min(99,ovr+Math.floor(Math.random()*18)),rarity,
   value:Math.round((ovr**3)*15),wage:Math.round(ovr*250)
  });
 },

 validXI(players,formation="4-3-3"){
  const slots=V6.formations[formation]||V6.formations["4-3-3"];
  const pool=(players||[]).map(V6.normalizePlayer).filter(Boolean);
  const used=new Set(), xi=[];
  const compatible=(p,slot)=>{
   if(slot==="GK")return p.position==="GK";
   if(p.position==="GK")return false;
   if(slot==="ST"||slot==="CF")return ["ST","CF","LW","RW","CAM"].includes(p.position);
   if(["LW","RW","LM","RM"].includes(slot))return ["LW","RW","LM","RM","CAM"].includes(p.position);
   if(["CM","CDM","CAM","LM","RM"].includes(slot))return ["CM","CDM","CAM","LM","RM"].includes(p.position);
   return ["LB","LWB","CB","RB","RWB","DEF"].includes(p.position);
  };
  for(const slot of slots){
   let candidates=pool.filter(p=>!used.has(p.id)&&compatible(p,slot));
   if(!candidates.length && slot==="GK") candidates=pool.filter(p=>!used.has(p.id)&&p.position==="GK");
   if(!candidates.length) candidates=pool.filter(p=>!used.has(p.id)&&p.position!=="GK");
   candidates.sort((a,b)=>b.ovr-a.ovr);
   if(candidates[0]){used.add(candidates[0].id);xi.push({...candidates[0],assignedPosition:slot});}
  }
  return xi;
 },

 bestXI(players,formation="4-3-3"){return V6.validXI(players,formation);},

 teamStrength(players,formation="4-3-3",tactic="Balanced"){
  const xi=V6.validXI(players,formation);
  if(!xi.length)return 45;
  const avg=xi.reduce((s,p)=>s+p.ovr,0)/xi.length;
  const fit=xi.filter(p=>p.assignedPosition===p.position).length;
  const morale=xi.reduce((s,p)=>s+p.morale,0)/xi.length;
  const fitness=xi.reduce((s,p)=>s+p.fitness,0)/xi.length;
  const tacticBonus=tactic==="Balanced"?0:tactic==="Attacking"?1:tactic==="Defensive"?1.5:0.5;
  return clamp(Math.round(avg+(fit/11)*3+((morale-70)/20)+((fitness-80)/20)+tacticBonus),1,99);
 },

 matchProbability(home,away){
  const diff=home-away;
  const homeWin=clamp(.50+diff*.018,.05,.9);
  const draw=clamp(.27-Math.abs(diff)*.005,.08,.27);
  const awayWin=1-homeWin-draw;
  return {homeWin,draw,awayWin};
 },

 simulateMatch(homeTeam,awayTeam,opts={}){
  const hs=V6.teamStrength(homeTeam.players||homeTeam.squad||[],homeTeam.formation||"4-3-3",homeTeam.tactic||"Balanced");
  const as=V6.teamStrength(awayTeam.players||awayTeam.squad||[],awayTeam.formation||"4-3-3",awayTeam.tactic||"Balanced");
  const p=V6.matchProbability(hs+3,as);
  const r=Math.random();
  let result=r<p.homeWin?"H":r<p.homeWin+p.draw?"D":"A";
  let base=Math.max(0,(hs-as)/18);
  let hg=Math.max(0,Math.round(Math.random()*3+base+(result==="H"?1:0)));
  let ag=Math.max(0,Math.round(Math.random()*2-base+(result==="A"?1:0)));
  if(result==="D"){const g=Math.min(hg,ag);hg=ag=g;}
  if(result==="H"&&hg<=ag)hg=ag+1;
  if(result==="A"&&ag<=hg)ag=hg+1;
  const events=[];
  for(let i=0;i<hg;i++)events.push({minute:8+Math.floor(Math.random()*80),type:"goal",team:"home"});
  for(let i=0;i<ag;i++)events.push({minute:8+Math.floor(Math.random()*80),type:"goal",team:"away"});
  events.sort((a,b)=>a.minute-b.minute);
  return {home:homeTeam.name,away:awayTeam.name,homeStrength:hs,awayStrength:as,homeGoals:hg,awayGoals:ag,events,
   stats:{possession:Math.round(clamp(50+(hs-as)*.7,25,75)),shots:8+Math.floor(Math.random()*12),
   shotsOnTarget:3+Math.floor(Math.random()*7),corners:2+Math.floor(Math.random()*7),
   fouls:5+Math.floor(Math.random()*9),cards:Math.floor(Math.random()*5)}};
 },

 createBid(seller,player,buyer,offer){
  const p=V6.normalizePlayer(player);
  return {id:uid(),seller,buyer,playerId:p.id,player:p,offer:Math.max(0,num(offer,p.value)),status:"pending",created:Date.now()};
 },

 counterBid(bid,newOffer){
  if(!bid||bid.status!=="pending")return false;
  bid.offer=Math.max(0,num(newOffer,bid.offer));
  bid.status="countered";
  return bid;
 },

 acceptBid(bid){
  if(!bid)return false;
  bid.status="accepted";
  return bid;
 },

 rejectBid(bid){if(!bid)return false;bid.status="rejected";return bid;},

 swapDeal(playerOut,playerIn,cash=0){
  const a=V6.normalizePlayer(playerOut),b=V6.normalizePlayer(playerIn);
  return {id:uid(),type:"swap",out:a,in:b,cash:Math.max(0,num(cash,0)),status:"proposed"};
 },

 canTransfer(candidate,ownedIds){
  const id=String(candidate?.id||candidate?.playerId||candidate?.name||"");
  return !ownedIds.has(id);
 },

 listPlayer(player){
  player=V6.normalizePlayer(player);
  player.listed=true;
  return player;
 },

 upgradePlayer(player,attribute){
  player=V6.normalizePlayer(player);
  const attrs=["pace","shooting","passing","dribbling","physical","defending","goalkeeping"];
  if(!attrs.includes(attribute))return {ok:false,reason:"Invalid attribute"};
  const cost=V6.upgradeCosts[attribute];
  if(num(player.trainingPoints,0)<cost)return {ok:false,reason:"Not enough Training Points"};
  if(player.ovr>=player.potential)return {ok:false,reason:"At potential"};
  player.trainingPoints-=cost;
  player[attribute]=num(player[attribute],50)+1;
  player.ovr=clamp(player.ovr+1,1,player.potential);
  return {ok:true,player};
 },

 positionTrain(player,newPosition){
  player=V6.normalizePlayer(player);
  player.position=newPosition;
  return player;
 },

 trainingBoost(player,matches=3){
  player=V6.normalizePlayer(player);
  player.boost={amount:2,matches:Math.max(1,matches)};
  return player;
 },

 breakthrough(player){
  player=V6.normalizePlayer(player);
  if(player.ovr>=player.potential)return false;
  if(Math.random()<.15){player.ovr=clamp(player.ovr+2,1,player.potential);return true;}
  return false;
 },

 applySeasonDevelopment(players){
  for(const p0 of players||[]){
   const p=V6.normalizePlayer(p0);
   const age=num(p.age,24);
   if(age<=23&&p.ovr<p.potential&&Math.random()<.55)p.ovr++;
   if(age>=31&&Math.random()<.25)p.ovr=Math.max(1,p.ovr-1);
   p.form=clamp(p.form+(Math.random()<.5?1:-1),1,100);
  }
  return players;
 },

 validatePromotion(standings){
  // Returns the correct one-tier movement for a 3-tier pyramid.
  const sorted=(standings||[]).slice().sort((a,b)=>num(b.points)-num(a.points)||num(b.gd)-num(a.gd));
  return {promoted:sorted.slice(0,2),relegated:sorted.slice(-2)};
 },

 validate34(teams){
  return (teams||[]).every(t=>num(t.gamesPlayed??t.played,0)===34);
 },

 restartSeason(history,index,currentState){
  if(!history||!history[index])return null;
  const snap=JSON.parse(JSON.stringify(history[index].snapshot||history[index]));
  snap.round=1;snap.phase="regular";snap.timelineId=uid();
  return snap;
 },

 saveCareer(state,name){
  state.saves=state.saves||{};
  state.saves[name]=JSON.parse(JSON.stringify(state));
  localStorage.setItem(KEY,JSON.stringify(state));
  return state.saves[name];
 },

 loadCareer(state,name){
  return state?.saves?.[name] ? JSON.parse(JSON.stringify(state.saves[name])) : null;
 },

 addNews(state,text,type="info"){
  state.news=state.news||[];
  state.news.unshift({id:uid(),text,type,time:Date.now()});
  state.news=state.news.slice(0,100);
 },

 boardObjective(state){
  const clubStrength=num(state.club?.strength,70);
  return {target:clubStrength>=82?"Win the league":clubStrength>=74?"Finish top 6":"Avoid relegation"};
 },

 financialTransaction(state,amount,reason){
  state.club=state.club||{};
  state.club.money=num(state.club.money,0)+num(amount,0);
  state.club.finances=state.club.finances||[];
  state.club.finances.unshift({amount:num(amount,0),reason,time:Date.now()});
 },

 sponsorOffer(state){
  const rep=num(state.manager?.reputation,50);
  return {value:Math.round(500000+rep*25000),years:1+(rep>75?1:0),condition:rep>75?"Finish top 6":"Avoid relegation"};
 },

 awardSeason(players){
  const sorted=[...(players||[])].sort((a,b)=>num(b.goals)-num(a.goals));
  return {goldenBoot:sorted[0]?.name||null,playerOfSeason:sorted.sort((a,b)=>num(b.ovr)-num(a.ovr))[0]?.name||null};
 },

 integrityCheck(state){
  const errors=[];
  const seen=new Set();
  for(const p0 of state.players||[]){
   const p=V6.normalizePlayer(p0);
   if(seen.has(p.id))errors.push("Duplicate player: "+p.name);
   seen.add(p.id);
  }
  for(const t of state.teams||[]){
   if(num(t.gamesPlayed,0)>34)errors.push("More than 34 games: "+t.name);
  }
  return {ok:errors.length===0,errors};
 }
};

window.AFM_V6_FULL=V6;

// Build a self-contained V6 management panel so the new systems are usable
// even if the V5 navigation structure is different.
window.addEventListener("DOMContentLoaded",function(){
 document.documentElement.dataset.afmVersion="V6";
 const existing=document.getElementById("afm-v6-panel");
 if(existing)return;

 const panel=document.createElement("section");
 panel.id="afm-v6-panel";
 panel.style.cssText="margin:16px auto;max-width:1100px;padding:16px;border:1px solid #aaa;border-radius:14px;background:rgba(255,255,255,.96);font-family:Arial,sans-serif;color:#111;";
 panel.innerHTML=`
 <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
   <div><h2 style="margin:0">Australian Football Manager V6</h2><small>Management upgrade systems</small></div>
   <strong>43-item V6 upgrade pack</strong>
 </div>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:12px">
   <button id="v6-bestxi">🤖 Generate Best XI</button>
   <button id="v6-check">🛡️ Run Bug & Integrity Check</button>
   <button id="v6-save">💾 Save Career</button>
   <button id="v6-sponsor">🤝 Generate Sponsor Offer</button>
 </div>
 <div id="v6-output" style="margin-top:12px;padding:10px;border-radius:10px;background:#f2f2f2">V6 systems ready.</div>`;
 document.body.appendChild(panel);

 const out=document.getElementById("v6-output");
 document.getElementById("v6-bestxi").onclick=function(){
   const players=Array.isArray(window.players)?window.players:(window.game?.players||[]);
   const xi=V6.bestXI(players,"4-3-3");
   out.innerHTML="<b>Best XI generated:</b><br>"+xi.map((p,i)=>`${i+1}. ${p.name} — ${p.assignedPosition} — ${p.ovr} OVR`).join("<br>");
 };
 document.getElementById("v6-check").onclick=function(){
   const state=window.gameState||window.state||V6.state;
   const r=V6.integrityCheck(state||V6.state);
   out.innerHTML=r.ok?"<b>✅ No integrity errors found.</b>":"<b>⚠️ Issues:</b><br>"+r.errors.join("<br>");
 };
 document.getElementById("v6-save").onclick=function(){
   const state=window.gameState||window.state||V6.state;
   V6.saveCareer(state,"V6 Autosave");
   out.textContent="✅ V6 Autosave created.";
 };
 document.getElementById("v6-sponsor").onclick=function(){
   out.innerHTML="<b>🤝 Sponsor offer:</b> $"+V6.sponsorOffer(V6.state).value.toLocaleString()+" / year";
 };
});
})();
