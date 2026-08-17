
/* V6 BATCH 2.1 — transfer + past-season restart fixes */
(function(){
"use strict";
const deep=x=>JSON.parse(JSON.stringify(x));
const uid=()=> "v621_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);

function ensure(){
  S.v621=S.v621||{};
  S.v621.snapshots=S.v621.snapshots||{};
  S.offers=Array.isArray(S.offers)?S.offers:[];
  S.listings=Array.isArray(S.listings)?S.listings:[];
}
function players(c){return S.players[c]||(S.players[c]=[]);}
function finance(c){
  S.finance=S.finance||{};
  S.finance[c]=S.finance[c]||{balance:0,budget:0};
  return S.finance[c];
}
function addMoney(c,n){let f=finance(c);f.balance+=Number(n||0);f.budget+=Number(n||0);}
function removeMoney(c,n){let f=finance(c);f.balance=Math.max(0,f.balance-Number(n||0));f.budget=Math.max(0,f.budget-Number(n||0));}
function snapshot(season){
  ensure(); let k=String(season);
  if(!S.v621.snapshots[k]) S.v621.snapshots[k]={
    season,round:Number(S.round||1),players:deep(S.players||{}),
    finance:deep(S.finance||{}),form:deep(S.form||{}),
    lineups:deep(S.lineups||{}),t1:deep(S.t1||{}),t2:deep(S.t2||{}),
    npl:deep(S.npl||{}),stats:deep(S.stats||{}),cup:deep(S.cup||null)
  };
}
function refresh(){if(typeof transferMarketV6==="function")transferMarketV6();else if(typeof market==="function")market();}
function bidFor(listing,force){
  ensure();
  const clubs=allTeams().filter(c=>c!==listing.club);
  if(!clubs.length)return;
  if(S.offers.some(o=>o.playerId===listing.playerId&&o.to===listing.club&&(o.status==="pending"||o.status==="countered")))return;
  if(!force&&Math.random()>0.65)return;
  const from=clubs[Math.floor(Math.random()*clubs.length)];
  const base=Number(listing.asking||0);
  const amount=Math.max(10000,Math.round(base*(.95+Math.random()*.20)));
  S.offers.push({id:uid(),playerId:listing.playerId,player:listing.playerName,
    from,to:listing.club,amount,status:"pending",created:Date.now()});
}
window.listPlayerV621=function(playerId,asking){
  ensure(); const c=S.selected,p=players(c).find(x=>x.id===playerId);
  if(!p)return alert("Player not found.");
  const price=Number(asking||p.value||Math.max(10000,(Number(p.ov||60)**2)*9000));
  let l=S.listings.find(x=>x.club===c&&x.playerId===playerId);
  if(!l){l={id:uid(),club:c,playerId,playerName:p.name,pos:p.pos,ov:p.ov,asking:price,status:"listed"};S.listings.push(l);}
  else{l.asking=price;l.status="listed";}
  p.listed=true;p.listedAsking=price;
  bidFor(l,true);save();
  alert(p.name+" is listed. They remain in your squad until a bid is accepted.");
  refresh();
};
window.requestBidV621=function(playerId){
  ensure();const l=S.listings.find(x=>x.club===S.selected&&x.playerId===playerId&&x.status==="listed");
  if(!l)return alert("List the player first.");
  bidFor(l,true);save();alert("An AI club has submitted a bid.");refresh();
};
window.acceptOfferV621=function(oid){
  ensure();const o=S.offers.find(x=>x.id===oid);if(!o)return;
  const seller=o.to,buyer=o.from,arr=players(seller),i=arr.findIndex(p=>p.id===o.playerId);
  if(i<0)return alert("Transfer failed: player is no longer at your club.");
  if(players(buyer).some(p=>p.id===o.playerId||p.name===arr[i].name))
    return alert("Transfer blocked: duplicate player detected.");
  const p=deep(arr[i]);arr.splice(i,1);p.listed=false;delete p.listedAsking;p.club=buyer;
  players(buyer).push(p);addMoney(seller,o.amount);removeMoney(buyer,o.amount);
  S.offers=S.offers.filter(x=>x.id!==oid);
  S.listings=S.listings.filter(x=>!(x.club===seller&&x.playerId===o.playerId));
  save();alert(p.name+" joined "+buyer+" for $"+Number(o.amount).toLocaleString()+".");refresh();
};
window.rejectOfferV621=function(oid){
  ensure();const o=S.offers.find(x=>x.id===oid);if(!o)return;
  S.offers=S.offers.filter(x=>x.id!==oid);
  const l=S.listings.find(x=>x.club===o.to&&x.playerId===o.playerId&&x.status==="listed");
  if(l)bidFor(l,false);save();refresh();
};
window.counterOfferV621=function(oid){
  ensure();const o=S.offers.find(x=>x.id===oid);if(!o)return;
  const n=Number(prompt("Ask for how much?",Math.round(Number(o.amount)*1.15)));
  if(!n||n<=Number(o.amount))return alert("Counter-offer must be higher.");
  o.amount=n;o.status="countered";save();refresh();
};
window.acceptBidV6=window.acceptOfferV621;
window.rejectBidV6=window.rejectOfferV621;
window.counterBidV6=window.counterOfferV621;

window.showSeasonHistoryV621=function(){
  ensure();const ks=Object.keys(S.v621.snapshots).map(Number).sort((a,b)=>a-b);
  document.getElementById("app").innerHTML='<section class="card"><h2>📚 Season History</h2>'+
    '<p class="muted">Choose the exact season to rewind to its beginning.</p>'+
    (ks.length?ks.map(s=>'<div class="fixture"><b>'+s+'/'+(s+1)+'</b>'+
      '<button onclick="restartPastSeasonV621('+s+')">🔄 Restart This Season</button></div>').join("")
      :'<p class="muted">No season snapshots yet.</p>')+'</section>';
};
window.restartPastSeasonV621=function(season){
  ensure();const snap=S.v621.snapshots[String(season)];
  if(!snap)return alert("No snapshot exists for that season.");
  if(!confirm("Restart "+season+"/"+(season+1)+"? Everything that happened during that season, including purchases, sales and earned money, will be undone."))return;
  S.players=deep(snap.players);S.finance=deep(snap.finance);S.form=deep(snap.form);
  S.lineups=deep(snap.lineups);S.t1=deep(snap.t1);S.t2=deep(snap.t2);S.npl=deep(snap.npl);
  S.stats=deep(snap.stats);S.cup=deep(snap.cup);S.season=snap.season;S.round=snap.round;
  S.offers=[];S.listings=[];S.finished=false;save();
  if(typeof page==="function")page("home");else refresh();
};
ensure();snapshot(S.season);save();
})();
