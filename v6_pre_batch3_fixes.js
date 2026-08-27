
/* V6 PRE-BATCH 3 — TRANSFER OFFERS/SWAPS + HISTORY RESET FIX */
(function(){
"use strict";
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const P=c=>(S.players[c]||(S.players[c]=[]));
const F=c=>{
  S.finance=S.finance||{};
  S.finance[c]=S.finance[c]||{balance:0,budget:0};
  return S.finance[c];
};
const save3=()=>typeof save==="function"&&save();
S.clubOffers=Array.isArray(S.clubOffers)?S.clubOffers:[];

function funds(c){const f=F(c);return Number(f.balance??f.budget??0)}
function spend(c,n){const f=F(c); if("balance" in f)f.balance-=n; else f.budget-=n}
function earn(c,n){const f=F(c); if("balance" in f)f.balance+=n; else f.budget+=n}

window.makeClubOfferV621=function(seller,playerId){
 const buyer=S.selected, p=P(seller).find(x=>String(x.id)===String(playerId));
 if(!p||seller===buyer)return;
 const amount=Number(prompt("Offer cash for "+p.name+":",Math.max(10000,Number(p.value||p.ov*p.ov*9000))));
 if(!amount||amount<=0)return;
 if(funds(buyer)<amount)return alert("Not enough money.");
 S.clubOffers.push({id:"co_"+Date.now()+Math.random(),type:"cash",from:buyer,to:seller,
   playerId:p.id,playerName:p.name,amount,status:"pending"});
 save3();alert("Offer sent to "+seller+" for "+p.name+".");renderClubDealsV621();
};

window.makeSwapOfferV621=function(seller,playerId){
 const buyer=S.selected, p=P(seller).find(x=>String(x.id)===String(playerId));
 if(!p||seller===buyer)return;
 const mine=P(buyer);
 if(!mine.length)return alert("You have no player available for a swap.");
 const answer=prompt("Enter YOUR player's number:\n"+mine.map((x,i)=>`${i+1}. ${x.name} — ${x.pos} OVR ${x.ov}`).join("\n"),"1");
 const n=Number(answer)-1;if(n<0||n>=mine.length)return;
 const cash=Number(prompt("Extra cash? Enter 0 for a straight swap:",0));
 if(cash<0||cash>funds(buyer))return alert("Invalid cash amount.");
 S.clubOffers.push({id:"sw_"+Date.now()+Math.random(),type:"swap",from:buyer,to:seller,
   playerId:p.id,playerName:p.name,swapPlayerId:mine[n].id,swapPlayerName:mine[n].name,
   cash,status:"pending"});
 save3();alert("Swap offer sent to "+seller+".");renderClubDealsV621();
};

window.acceptClubOfferV621=function(id){
 const o=S.clubOffers.find(x=>x.id===id&&x.status==="pending");if(!o)return;
 const seller=P(o.to), buyer=P(o.from);
 const si=seller.findIndex(x=>String(x.id)===String(o.playerId));if(si<0)return alert("Player unavailable.");
 const cash=Number(o.amount||o.cash||0);
 if(cash>funds(o.from))return alert("Buyer no longer has enough money.");
 let mi=-1;
 if(o.type==="swap"){
   mi=buyer.findIndex(x=>String(x.id)===String(o.swapPlayerId));
   if(mi<0)return alert("Your swap player is no longer available.");
 }
 const incoming=JSON.parse(JSON.stringify(seller[si]));
 seller.splice(si,1);
 incoming.club=o.from;buyer.push(incoming);
 if(cash){spend(o.from,cash);earn(o.to,cash);}
 if(o.type==="swap"){
   const outgoing=buyer.splice(mi,1)[0];
   outgoing.club=o.to;seller.push(outgoing);
 }
 o.status="accepted";save3();alert("Transfer completed.");renderClubDealsV621();
};

window.rejectClubOfferV621=function(id){
 const o=S.clubOffers.find(x=>x.id===id);if(!o)return;
 o.status="rejected";save3();renderClubDealsV621();
};

function renderClubDealsV621(){
 let host=document.getElementById("v621-club-deals");
 if(!host){host=document.createElement("section");host.id="v621-club-deals";host.className="card";
   const app=document.getElementById("app");if(!app)return;app.appendChild(host);}
 const club=S.selected, teams=typeof allTeams==="function"?allTeams():Object.keys(S.players||{});
 const incoming=S.clubOffers.filter(o=>o.to===club&&o.status==="pending");
 const outgoing=S.clubOffers.filter(o=>o.from===club&&o.status==="pending");
 let html="<h3>🤝 Club Transfers</h3><p class='muted'>You can buy an existing club's player, make a cash offer, or propose a player swap.</p>";
 html+="<div class='grid'>";
 teams.filter(t=>t!==club).forEach(t=>{
   const ps=(S.players[t]||[]).slice(0,18);
   if(!ps.length)return;
   html+="<div class='card'><h4>"+e(t)+"</h4>";
   ps.forEach(p=>{
     html+="<div class='fixture'><span><b>"+e(p.name)+"</b><br><span class='small'>"+e(p.pos)+" • OVR "+p.ov+" • $"+Number(p.value||0).toLocaleString()+"</span></span>"+
       "<span><button onclick=\"makeClubOfferV621('"+e(t)+"','"+e(p.id)+"')\">💰 Offer</button> "+
       "<button onclick=\"makeSwapOfferV621('"+e(t)+"','"+e(p.id)+"')\">🔄 Swap</button></span></div>";
   });
   html+="</div>";
 });
 html+="</div>";
 if(incoming.length){
   html+="<h4>📨 Incoming Offers</h4>";
   incoming.forEach(o=>{html+="<div class='fixture'><span><b>"+e(o.playerName)+"</b> from "+e(o.from)+
     (o.type==="swap"?"<br>🔄 "+e(o.swapPlayerName)+(o.cash?" + $"+Number(o.cash).toLocaleString():""):
     "<br>💰 $"+Number(o.amount).toLocaleString())+
     "</span><span><button onclick=\"acceptClubOfferV621('"+e(o.id)+"')\">Accept</button> <button onclick=\"rejectClubOfferV621('"+e(o.id)+"')\">Reject</button></span></div>";});
 }
 if(outgoing.length){
   html+="<h4>📤 Outgoing Offers</h4>";
   outgoing.forEach(o=>{html+="<div class='fixture'><span>"+e(o.playerName)+" → "+e(o.to)+
     (o.type==="swap"?"<br>🔄 "+e(o.swapPlayerName)+(o.cash?" + $"+Number(o.cash).toLocaleString():""):
     "<br>💰 $"+Number(o.amount).toLocaleString())+
     "</span><span class='pill'>Pending</span></div>";});
 }
 host.innerHTML=html;
}

const oldMarket=window.transferMarketV6;
window.transferMarketV6=function(){
 if(typeof oldMarket==="function")oldMarket();
 setTimeout(renderClubDealsV621,0);
};

/* Override the past-season restart so the old winner disappears and all
   later completed seasons are removed from History when replaying. */
window.restartPastSeasonV621=function(season){
 const snap=S.v621&&S.v621.snapshots&&S.v621.snapshots[String(season)];
 if(!snap||!snap.players)return alert("That season has no full restore snapshot.");
 if(!confirm("Restart "+season+"/"+(season+1)+"? Its old winner/result and every later season result will be removed so they can be replayed."))return;
 S.history=(S.history||[]).filter(h=>Number(h.season)<Number(season));
 if(S.v621&&S.v621.snapshots){
   Object.keys(S.v621.snapshots).forEach(k=>{if(Number(k)>=Number(season))delete S.v621.snapshots[k];});
 }
 S.season=snap.season;S.round=snap.round||1;
 ["players","finance","form","lineups","t1","t2","npl","stats","cup"].forEach(k=>{
   if(snap[k]!==undefined)S[k]=JSON.parse(JSON.stringify(snap[k]));
 });
 S.clubOffers=[];S.v621.bids=[];S.v621.listed={};
 save3();
 if(typeof page==="function")page("home");else location.reload();
};

function tick(){
 if(document.getElementById("v621-club-deals"))renderClubDealsV621();
}
setTimeout(()=>{renderClubDealsV621();},500);
new MutationObserver(()=>{setTimeout(renderClubDealsV621,0);}).observe(document.body,{childList:true,subtree:true});
})();
