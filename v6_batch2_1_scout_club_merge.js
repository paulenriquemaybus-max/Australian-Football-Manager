/* V6 Batch 2.1 SAFE MERGE
   Keeps Club Transfers intact.
   Restores/fixes Scout -> Offer/Buy negotiation.
   Adds completed transfers to News.
*/
(function(){
"use strict";

function saveM(){ if(typeof save==="function") save(); }
function fm(n){ return "$"+Number(n||0).toLocaleString(); }
function cm(c){ return clubMoney(c); }

window.makeOffer = function(id){
  const p=(S.market||[]).find(x=>x.id===id);
  if(!p)return;
  const buyer=S.selected;
  const budget=Number(cm(buyer).budget||0);
  let amount=Number(prompt(
    "Offer for "+p.name+" — asking "+fm(p.asking)+"\nAvailable budget: "+fm(budget),
    Math.round(Number(p.asking)||Number(p.value)||0)
  ));
  if(!Number.isFinite(amount)||amount<=0)return;
  amount=Math.floor(amount);
  if(amount>budget){alert("That exceeds your transfer budget.");return;}
  if(p.club && p.club!=="World Pool"){
    alert("This player is no longer available.");
    if(typeof refreshMarket==="function")refreshMarket();
    if(typeof page==="function")page("market");
    return;
  }

  const asking=Number(p.asking)||Number(p.value)||amount;
  /* AI negotiation: strong offer accepted, otherwise counter/ask more. */
  const chance=amount>=asking*1.12?0.90:amount>=asking?0.72:0.35;

  if(Math.random()<chance){
    if(typeof completeTransfer==="function" && completeTransfer(p,buyer,amount)){
      if(Array.isArray(S.logs))
        S.logs.unshift("📰 TRANSFER COMPLETE: "+p.name+" joined "+buyer+" for "+fm(amount)+".");
      saveM();
      alert("Deal accepted! "+p.name+" has joined your club.");
    }
  }else{
    const counter=Math.max(
      Math.floor(amount+1000),
      Math.round(asking*(1.05+Math.random()*0.18))
    );
    S.offers=Array.isArray(S.offers)?S.offers:[];
    S.offers.push({
      id:"scout_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      player:p.name, playerId:p.id, from:p.club||"World Pool",
      to:buyer, amount:counter, kind:"counter", status:"countered",
      created:Date.now()
    });
    if(Array.isArray(S.logs))
      S.logs.unshift("💬 NEGOTIATION: "+(p.club||"World Pool")+" asked "+fm(counter)+" for "+p.name+".");
    saveM();
    alert("The club rejected your offer and asked for "+fm(counter)+".");
  }
  if(typeof page==="function")page("market");
};

/* Add a Buy button to Scout results without replacing Club Transfers. */
function addScoutBuyButtons(){
  const list=document.getElementById("ml");
  if(!list)return;
  const cards=list.querySelectorAll(".player");
  cards.forEach((card,i)=>{
    if(card.querySelector(".v621-buy"))return;
    const p=(S.market||[]).filter(p=>{
      const q=(document.getElementById("q")?.value||"").toLowerCase();
      return (p.name+" "+p.pos+" "+p.rarity).toLowerCase().includes(q);
    })[i];
    if(!p)return;
    const buy=document.createElement("button");
    buy.className="v621-buy";
    buy.textContent="🛒 Buy";
    buy.onclick=function(){
      const price=Math.floor(Number(p.asking)||Number(p.value)||0);
      const budget=Number(clubMoney(S.selected).budget||0);
      if(price>budget){alert("That exceeds your transfer budget.");return;}
      if(!confirm("Buy "+p.name+" for "+fm(price)+"?"))return;
      if(typeof completeTransfer==="function" && completeTransfer(p,S.selected,price)){
        if(Array.isArray(S.logs))
          S.logs.unshift("📰 TRANSFER COMPLETE: "+p.name+" joined "+S.selected+" for "+fm(price)+".");
        saveM();
        alert("Transfer complete!");
        if(typeof page==="function")page("market");
      }
    };
    card.querySelector(".actions")?.appendChild(buy) || card.appendChild(buy);
  });
}

/* Completed Club Transfer -> News, without replacing its mechanics. */
const oldAccept=window.acceptOfferV621;
if(typeof oldAccept==="function"){
  window.acceptOfferV621=function(oid){
    const o=(S.offers||[]).find(x=>x.id===oid);
    const before=o && o.player;
    oldAccept(oid);
    if(before && Array.isArray(S.logs)){
      const still=(S.offers||[]).some(x=>x.id===oid);
      if(!still) S.logs.unshift("📰 TRANSFER COMPLETE: "+before+" completed a club transfer.");
      saveM();
    }
  };
  window.acceptBidV6=window.acceptOfferV621;
}

setInterval(addScoutBuyButtons,500);
setTimeout(addScoutBuyButtons,200);
})();