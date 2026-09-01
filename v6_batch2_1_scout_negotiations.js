/* V6 BATCH 2.1 — Scout Negotiations UI FIX v2
   Keeps the working Scout offer/negotiation logic.
   Fixes the negotiation controls to: Accept | Counter | Reject.
   Club Transfers / Listings / Season Restart are not modified.
*/
(function(){
"use strict";

function fmt(n){ return typeof money==="function" ? money(n) : "$"+Number(n||0).toFixed(1)+"m"; }
function saveNow(){ if(typeof save==="function") save(); }

window.scoutAccept=function(id){
  const o=(S.offers||[]).find(x=>x.id===id && x.kind==="scout");
  if(!o)return;
  const p=(S.market||[]).find(x=>x.id===o.playerId)||(S.worldPool||[]).find(x=>x.id===o.playerId);
  if(!p || p.club!=="World Pool"){alert("This player is no longer available.");return;}
  if(Number(o.amount)>Number(clubMoney(S.selected).budget||0)){alert("That exceeds your transfer budget.");return;}

  S.players[S.selected]=S.players[S.selected]||[];
  if(S.players[S.selected].some(x=>x.id===p.id||x.name===p.name)){
    alert("Transfer blocked: duplicate player detected.");return;
  }

  p.club=S.selected;
  S.players[S.selected].push(p);
  S.market=(S.market||[]).filter(x=>x.id!==p.id);
  S.worldPool=(S.worldPool||[]).filter(x=>x.id!==p.id);
  clubMoney(S.selected).budget=Math.max(0,Number(clubMoney(S.selected).budget)-Number(o.amount));
  S.offers=S.offers.filter(x=>x.id!==id);
  S.logs.unshift("TRANSFER COMPLETE: "+p.name+" joined "+S.selected+" for "+fmt(o.amount)+".");
  saveNow();
  alert(p.name+" joined "+S.selected+" for "+fmt(o.amount)+".");
  page("market");
};

window.scoutReject=function(id){
  const o=(S.offers||[]).find(x=>x.id===id && x.kind==="scout");
  if(!o)return;
  S.offers=S.offers.filter(x=>x.id!==id);
  S.logs.unshift("SCOUT NEGOTIATION: "+o.player+" offer rejected.");
  saveNow();
  page("market");
};

/* Counter means YOU make another price proposal.
   The club then responds to that exact proposal. */
window.scoutCounter=function(id){
  const o=(S.offers||[]).find(x=>x.id===id && x.kind==="scout");
  if(!o)return;

  const current=Number(o.amount);
  const asking=Number(o.asking||o.originalAsking||current);
  const raw=prompt(
    "Counter-offer for "+o.player+" (millions):\nCurrent offer: "+fmt(current)+"\nAsking price: "+fmt(asking),
    current.toFixed(1)
  );
  if(raw===null)return;

  const counter=Number(raw);
  if(!counter || counter<=current){
    alert("Your counter must be higher than the current offer.");
    return;
  }
  if(counter>Number(clubMoney(S.selected).budget||0)){
    alert("That exceeds your transfer budget.");
    return;
  }

  /* Sensible AI response:
     - If your counter meets/exceeds asking, it can accept.
     - Otherwise it can counter between the current offer and your counter.
     - It never produces a counter below the current offer. */
  if(counter>=asking && Math.random()<0.70){
    o.amount=+counter.toFixed(1);
    o.status="accepted";
    saveNow();
    alert("The club accepted your counter-offer of "+fmt(counter)+".");
    return scoutAccept(id);
  }

  const gap=counter-current;
  let response=+(current + gap*(0.35+Math.random()*0.25)).toFixed(1);
  response=Math.max(current,Math.min(counter,response));

  o.amount=response;
  o.status="countered";
  o.lastUserOffer=counter;
  S.logs.unshift("SCOUT NEGOTIATION: "+o.player+" countered with "+fmt(response)+".");
  saveNow();
  alert("They countered with "+fmt(response)+".");
  page("market");
};

/* Initial Scout offer. */
window.makeOffer=function(id){
  const p=(S.market||[]).find(x=>x.id===id);
  if(!p)return;

  const asking=Number(p.asking||p.value||0);
  const raw=prompt("Offer for "+p.name+" — asking "+fmt(asking),asking.toFixed(1));
  if(raw===null)return;

  const amount=Number(raw);
  if(!amount || amount<=0)return;
  if(amount>Number(clubMoney(S.selected).budget||0)){
    alert("That exceeds your transfer budget.");return;
  }
  if(p.club!=="World Pool"){
    alert("This player is no longer available.");
    if(typeof refreshMarket==="function")refreshMarket();
    page("market");
    return;
  }

  const ratio=amount/asking;
  const chance=ratio>=1.15?0.95:ratio>=1.05?0.88:ratio>=1?0.72:ratio>=0.90?0.42:0.18;

  if(Math.random()<chance){
    const oid=uid();
    S.offers=S.offers||[];
    S.offers.push({
      id:oid,player:p.name,playerId:p.id,from:"World Pool",to:S.selected,
      amount,asking,originalAsking:asking,kind:"scout",status:"accepted"
    });
    saveNow();
    return scoutAccept(oid);
  }

  /* A counter to an offer above asking stays at/above that offer.
     No nonsensical lower counter. */
  const counter=amount>=asking
    ? +(amount*(1.02+Math.random()*0.06)).toFixed(1)
    : +(Math.max(amount+0.1,asking*(1.03+Math.random()*0.10))).toFixed(1);

  const oid=uid();
  S.offers=S.offers||[];
  S.offers.push({
    id:oid,player:p.name,playerId:p.id,from:"World Pool",to:S.selected,
    amount:counter,asking,originalAsking:asking,previousOffer:amount,
    lastUserOffer:amount,kind:"scout",status:"countered"
  });
  S.logs.unshift("SCOUT NEGOTIATION: "+p.name+" countered with "+fmt(counter)+".");
  saveNow();
  alert("Counter-offer: "+fmt(counter));
  page("market");
};

/* The ONLY UI change: Scout negotiations now use Accept | Counter | Reject. */
window.scoutNegotiationHTML=function(){
  const list=(S.offers||[]).filter(o=>o.kind==="scout" && o.to===S.selected &&
    (o.status==="countered" || o.status==="pending" || o.status==="accepted"));

  if(!list.length)return '<p class="muted">No Scout negotiations waiting.</p>';

  return list.map(o=>
    '<div class="player">'+
      '<div><b>'+esc(o.player)+'</b><br>'+
      '<span class="muted">🌍 Club offer: '+fmt(o.amount)+'</span>'+
      (o.asking?'<br><span class="muted">Asking: '+fmt(o.asking)+'</span>':'')+
      '</div>'+
      '<div class="actions">'+
        '<button class="primary" onclick="scoutAccept(\''+o.id+'\')">Accept</button>'+
        '<button onclick="scoutCounter(\''+o.id+'\')">Counter</button>'+
        '<button class="danger" onclick="scoutReject(\''+o.id+'\')">Reject</button>'+
      '</div>'+
    '</div>'
  ).join('');
};

/* Rebuild the market page after the existing game code has loaded.
   Club incoming bids remain exactly as before. */
const originalMarket=window.market;
window.market=function(){
  if(typeof originalMarket==="function") originalMarket();

  const app=document.getElementById("app");
  if(!app)return;

  let scoutCard=[...app.querySelectorAll(".card")].find(el=>
    (el.textContent||"").toLowerCase().includes("scout negotiations")
  );

  if(scoutCard){
    scoutCard.innerHTML='<h3>🤝 Scout Negotiations</h3>'+window.scoutNegotiationHTML();
  }else{
    /* If the old version did not have the card, add it without replacing
       the Club Transfers / incoming bids card. */
    const section=document.createElement("section");
    section.className="card";
    section.innerHTML='<h3>🤝 Scout Negotiations</h3>'+window.scoutNegotiationHTML();
    app.appendChild(section);
  }
};
})();