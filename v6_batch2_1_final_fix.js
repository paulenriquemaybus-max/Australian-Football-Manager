/* V6 Batch 2.1 FINAL: Scout Offer/Buy + transfer news */
(function(){
"use strict";
function saveX(){if(typeof save==="function")save();}
function fin(c){S.finance=S.finance||{};S.finance[c]=S.finance[c]||{balance:0,budget:0};return S.finance[c];}
function funds(c){let f=fin(c);return Math.max(0,Number(f.balance??f.budget??0));}
function money(n){return "$"+Math.max(0,Number(n)||0).toLocaleString();}
function news(t){
 S.news=Array.isArray(S.news)?S.news:[]; S.news.unshift({id:"news_"+Date.now()+"_"+Math.random(),text:t,timestamp:Date.now()});
 if(Array.isArray(S.transferNews))S.transferNews.unshift({text:t,timestamp:Date.now()});
 saveX();
}
window.scoutOfferV621=function(club,id,name,value){
 const buyer=S.selected,max=funds(buyer);
 if(!buyer||!club||club===buyer)return alert("Choose a player from another club.");
 if(max<=0)return alert("Your club has no available funds.");
 let raw=prompt("Offer for "+name+"\nAvailable: "+money(max)+"\nEnter offer:",Math.min(max,Math.max(1000,Number(value)||1000)));
 if(raw===null)return; let amount=Math.floor(Number(String(raw).replace(/[$,\s]/g,"")));
 if(!Number.isFinite(amount)||amount<=0)return alert("Enter a valid amount.");
 if(amount>max)return alert("You only have "+money(max)+" available.");
 S.playerOffers=Array.isArray(S.playerOffers)?S.playerOffers:[];
 S.playerOffers.push({id:"offer_"+Date.now(),type:"cash",from:buyer,to:club,playerId:id,playerName:name,amount,status:"pending",createdAt:Date.now()});
 news("💰 "+buyer+" offered "+money(amount)+" for "+name+" from "+club+".");
 alert("Offer sent to "+club+".");
};
window.scoutBuyV621=function(club,id,name,value){
 const buyer=S.selected,price=Math.floor(Number(value)||0),max=funds(buyer);
 if(price<=0)return scoutOfferV621(club,id,name,value);
 if(price>max)return alert("You only have "+money(max)+" available.");
 if(!confirm("Buy "+name+" from "+club+" for "+money(price)+"?"))return;
 S.players=S.players||{}; S.players[club]=S.players[club]||[]; S.players[buyer]=S.players[buyer]||[];
 let a=S.players[club],i=a.findIndex(p=>String(p.id)===String(id));
 if(i<0)return alert("That player is no longer available.");
 if(S.players[buyer].some(p=>String(p.id)===String(id)))return alert("Duplicate player blocked.");
 let p=JSON.parse(JSON.stringify(a.splice(i,1)[0]));p.club=buyer;p.listed=false;delete p.listedAsking;S.players[buyer].push(p);
 let bf=fin(buyer),sf=fin(club);bf.balance=Number(bf.balance||0)-price;bf.budget=Number(bf.budget||0)-price;sf.balance=Number(sf.balance||0)+price;sf.budget=Number(sf.budget||0)+price;
 news("🛒 "+buyer+" bought "+name+" from "+club+" for "+money(price)+".");
 alert(name+" has joined "+buyer+".");
};
function install(){
 document.querySelectorAll("[data-player-id],[data-id]").forEach(el=>{
  if(el.querySelector(".v621-scout-actions"))return;
  let id=el.dataset.playerId||el.dataset.id,club=el.dataset.club||el.dataset.team||el.getAttribute("data-club")||el.getAttribute("data-team");
  let n=el.dataset.playerName||(el.querySelector(".player-name,.name,b,strong")||{}).textContent||"";
  let v=el.dataset.value||el.dataset.price||((el.textContent||"").match(/\$[\d,.]+/)||[""])[0].replace(/[$,]/g,"");
  n=n.trim(); if(!id||!club||!n||club===S.selected)return;
  let box=document.createElement("span");box.className="v621-scout-actions";box.innerHTML='<button type="button">💰 Offer</button> <button type="button">🛒 Buy</button>';
  let bs=box.querySelectorAll("button");bs[0].onclick=()=>scoutOfferV621(club,id,n,v);bs[1].onclick=()=>scoutBuyV621(club,id,n,v);el.appendChild(box);
 });
}
setInterval(install,800);setTimeout(install,300);
})();