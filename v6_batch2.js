
/* ==========================================================
   AUSTRALIAN FOOTBALL MANAGER V6 — BATCH 2
   6. Worldwide/randomised transfer market
   7. Player rarities + visible percentages
   8. Duplicate-player protection
   9. Working player listings
   10. Incoming bids with accept/reject/counter
   ========================================================== */
(function(){
  "use strict";

  const RARITIES = [
    {name:"Common", chance:60, min:55, max:69},
    {name:"Rare", chance:25, min:70, max:79},
    {name:"Elite", chance:10, min:80, max:88},
    {name:"World Class", chance:4, min:89, max:94},
    {name:"Legendary", chance:1, min:95, max:99}
  ];

  const names = [
    "Alex Turner","Noah Williams","Ethan Carter","Liam Brooks","Lucas Martin",
    "Oliver King","Mason Lee","Jack Wilson","Leo Adams","Daniel Brown",
    "Oscar Taylor","Henry Davis","James Clark","Charlie Evans","Thomas White",
    "William Hall","Benjamin Young","Samuel Green","Max Walker","Harry Scott",
    "George Wright","Arthur Baker","Archie Harris","Theo Cooper","Freddie Mitchell",
    "Rafael Costa","Mateo Silva","Diego Torres","Nico Romero","Adrian Santos",
    "Marco Rossi","Luca Bianchi","Enzo Moretti","Matteo Romano","Sergio Alvarez",
    "Thiago Oliveira","Gabriel Souza","Andres Garcia","Javier Morales","Carlos Diaz"
  ];
  const positions = ["GK","LB","CB","RB","CM","CAM","LW","RW","ST"];

  function uid(){ return "tm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function weightedRarity(){
    const n = Math.random()*100;
    let c = 0;
    for(const r of RARITIES){ c += r.chance; if(n < c) return r; }
    return RARITIES[0];
  }

  function allOwnedIds(){
    const ids = new Set();
    allTeams().forEach(club => (S.players[club]||[]).forEach(p => ids.add(p.id)));
    return ids;
  }

  function market(){
    return S.transferMarket || [];
  }

  function listed(){
    return S.listedPlayers || [];
  }

  function bids(){
    return S.incomingBids || [];
  }

  function ensureTransferState(){
    if(!Array.isArray(S.transferMarket)) S.transferMarket = [];
    if(!Array.isArray(S.listedPlayers)) S.listedPlayers = [];
    if(!Array.isArray(S.incomingBids)) S.incomingBids = [];
  }

  function makeMarketPlayer(){
    const rarity = weightedRarity();
    const pos = pick(positions);
    const ovr = Math.floor(rarity.min + Math.random()*(rarity.max-rarity.min+1));
    return {
      id: uid(),
      name: pick(names) + " " + Math.floor(10+Math.random()*90),
      pos, ov: ovr,
      rarity: rarity.name,
      marketGenerated: true,
      value: Math.max(50000, Math.round(ovr*ovr*9000))
    };
  }

  function refillMarket(){
    ensureTransferState();
    const owned = allOwnedIds();
    const listedIds = new Set(listed().map(x => x.playerId));
    S.transferMarket = market().filter(p => p && !owned.has(p.id) && !listedIds.has(p.id));
    const existingNames = new Set(S.transferMarket.map(p => p.name));
    let guard = 0;
    while(S.transferMarket.length < 12 && guard++ < 300){
      const p = makeMarketPlayer();
      if(existingNames.has(p.name)) continue;
      existingNames.add(p.name);
      S.transferMarket.push(p);
    }
  }

  function rarityHTML(){
    return RARITIES.map(r =>
      '<span class="pill">' + r.name + ' ' + r.chance + '%</span>'
    ).join(" ");
  }

  window.transferMarketV6 = function(){
    ensureTransferState();
    refillMarket();
    save();

    const club = S.selected;
    const ps = S.players[club] || [];

    document.getElementById("app").innerHTML =
      '<section class="card">' +
      '<h2>🌎 Transfer Market</h2>' +
      '<p class="muted">Randomised worldwide market. Players already owned by any club are protected from duplicates.</p>' +
      '<div class="card"><b>Rarity chances</b><div class="actions">' + rarityHTML() + '</div></div>' +
      '<div class="grid">' +
      S.transferMarket.map(p =>
        '<div class="card">' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<div>' + p.pos + ' • <b>' + p.ov + ' OVR</b></div>' +
          '<div class="small">💎 ' + esc(p.rarity) + ' • Value $' + Number(p.value||0).toLocaleString() + '</div>' +
          '<button class="primary" onclick="buyMarketPlayerV6(\\'' + p.id + '\\')">Buy</button>' +
        '</div>'
      ).join('') +
      '</div>' +
      '<button onclick="refreshMarketV6()">🔄 Refresh market</button>' +
      '</section>' +
      '<section class="card"><h3>📋 List a player</h3>' +
        '<select id="listPlayerV6"><option value="">Choose player...</option>' +
        ps.map(p => '<option value="' + p.id + '">' + esc(p.name) + ' — ' + p.pos + ' ' + p.ov + '</option>').join('') +
        '</select> ' +
        '<input id="listPriceV6" type="number" min="0" placeholder="Asking price">' +
        '<button onclick="listPlayerV6()">List player</button>' +
      '</section>' +
      '<section class="card"><h3>📨 Incoming bids</h3>' +
        (bids().filter(b=>b.club===club).length
          ? bids().filter(b=>b.club===club).map(b =>
            '<div class="fixture"><span><b>' + esc(b.playerName) + '</b><br><span class="small">' +
            esc(b.fromClub) + ' offer: $' + Number(b.amount).toLocaleString() +
            '</span></span><span>' +
            '<button onclick="acceptBidV6(\\'' + b.id + '\\')">Accept</button> ' +
            '<button onclick="counterBidV6(\\'' + b.id + '\\')">Ask More</button> ' +
            '<button onclick="rejectBidV6(\\'' + b.id + '\\')">Reject</button>' +
            '</span></div>'
          ).join('')
          : '<p class="muted">No incoming bids.</p>') +
      '</section>';
  };

  window.refreshMarketV6 = function(){
    S.transferMarket = [];
    refillMarket();
    save();
    transferMarketV6();
  };

  window.buyMarketPlayerV6 = function(id){
    ensureTransferState();
    const idx = S.transferMarket.findIndex(p=>p.id===id);
    if(idx<0) return;
    const p = S.transferMarket[idx];
    const budget = Number(S.money?.[S.selected] ?? S.budget?.[S.selected] ?? S.cash?.[S.selected] ?? 0);
    const price = Number(p.value||0);

    if(budget < price){
      alert("Not enough club money for this transfer.");
      return;
    }

    // Hard duplicate protection.
    if((S.players[S.selected]||[]).some(x=>x.id===p.id || x.name===p.name)){
      alert("This player is already in your squad.");
      S.transferMarket.splice(idx,1);
      refillMarket();
      save();
      transferMarketV6();
      return;
    }

    if(!S.players[S.selected]) S.players[S.selected]=[];
    S.players[S.selected].push({...p, marketGenerated:false});
    if(S.money && Object.prototype.hasOwnProperty.call(S.money,S.selected)) S.money[S.selected] -= price;
    else if(S.budget && Object.prototype.hasOwnProperty.call(S.budget,S.selected)) S.budget[S.selected] -= price;
    else if(S.cash && Object.prototype.hasOwnProperty.call(S.cash,S.selected)) S.cash[S.selected] -= price;

    S.transferMarket.splice(idx,1);
    refillMarket();
    save();
    alert(p.name + " joined " + S.selected + "!");
    transferMarketV6();
  };

  window.listPlayerV6 = function(){
    ensureTransferState();
    const id = document.getElementById("listPlayerV6").value;
    const asking = Number(document.getElementById("listPriceV6").value || 0);
    if(!id) return alert("Choose a player to list.");

    const player = (S.players[S.selected]||[]).find(p=>p.id===id);
    if(!player) return alert("Player not found.");
    if(S.listedPlayers.some(x=>x.club===S.selected && x.playerId===id))
      return alert("That player is already listed.");

    S.listedPlayers.push({
      id:uid(), club:S.selected, playerId:id, playerName:player.name,
      pos:player.pos, ov:player.ov,
      asking: asking>0 ? asking : Number(player.value||player.ov*player.ov*9000),
      created:Date.now()
    });
    save();
    alert(player.name + " is now listed for bids. They remain in your squad until you accept a bid.");
    transferMarketV6();
  };

  function findBid(id){ return S.incomingBids.find(b=>b.id===id); }

  window.rejectBidV6 = function(id){
    ensureTransferState();
    S.incomingBids = S.incomingBids.filter(b=>b.id!==id);
    save(); transferMarketV6();
  };

  window.counterBidV6 = function(id){
    const b = findBid(id);
    if(!b) return;
    const input = prompt("Enter your requested transfer fee:", Math.round(b.amount*1.15));
    if(input===null) return;
    const amount = Number(input);
    if(!amount || amount<=b.amount) return alert("Counter-offer must be higher than the current bid.");
    b.counter = amount;
    b.amount = amount;
    b.status = "countered";
    save(); transferMarketV6();
  };

  window.acceptBidV6 = function(id){
    const b = findBid(id);
    if(!b) return;
    const squad = S.players[b.club] || [];
    const idx = squad.findIndex(p=>p.id===b.playerId);
    if(idx<0){
      S.incomingBids = S.incomingBids.filter(x=>x.id!==id);
      save(); transferMarketV6();
      return;
    }

    const player = squad[idx];
    squad.splice(idx,1);

    if(S.money && Object.prototype.hasOwnProperty.call(S.money,b.club)) S.money[b.club] += Number(b.amount);
    else if(S.budget && Object.prototype.hasOwnProperty.call(S.budget,b.club)) S.budget[b.club] += Number(b.amount);
    else if(S.cash && Object.prototype.hasOwnProperty.call(S.cash,b.club)) S.cash[b.club] += Number(b.amount);

    S.incomingBids = S.incomingBids.filter(x=>x.id!==id);
    S.listedPlayers = S.listedPlayers.filter(x=>x.playerId!==b.playerId || x.club!==b.club);

    // Keep the sold player out of the market: another club's incoming bid
    // system can later create the receiving-club transaction.
    save();
    alert(player.name + " was sold for $" + Number(b.amount).toLocaleString() + ".");
    transferMarketV6();
  };

  // Generate a small number of realistic incoming bids for listed players.
  window.generateIncomingBidsV6 = function(){
    ensureTransferState();
    const club = S.selected;
    listed().filter(x=>x.club===club).forEach(item=>{
      const already = bids().some(b=>b.playerId===item.playerId && b.club===club);
      if(already) return;
      if(Math.random() > 0.45) return;

      const candidates = allTeams().filter(t=>t!==club);
      const fromClub = pick(candidates);
      const amount = Math.round((Number(item.asking||0) * (0.85 + Math.random()*0.35))/1000)*1000;

      S.incomingBids.push({
        id:uid(), club, playerId:item.playerId, playerName:item.playerName,
        fromClub, amount:Math.max(10000,amount), status:"pending", created:Date.now()
      });
    });
    save();
  };

  ensureTransferState();
  refillMarket();
  generateIncomingBidsV6();
  save();

  // Add/replace a Transfer navigation button if a nav exists.
  const nav = document.querySelector("nav");
  if(nav && !document.getElementById("v6-transfer-btn")){
    const b = document.createElement("button");
    b.id = "v6-transfer-btn";
    b.textContent = "💰 Transfers";
    b.onclick = transferMarketV6;
    nav.appendChild(b);
  }
})();
