
/* V6 BATCH 2.1 — FIX 2
   Visible listing state + reliable bid flow + actual past-season restart UI.
*/
(function(){
  "use strict";

  window.V621FIX = true;
  const esc2 = window.esc || (s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));

  function ensure(){
    S.v621 = S.v621 || {};
    S.v621.snapshots = S.v621.snapshots || {};
    S.v621.listed = S.v621.listed || {};
    S.v621.bids = S.v621.bids || [];
    S.offers = Array.isArray(S.offers) ? S.offers : [];
  }

  function snapshot(season){
    ensure();
    const k=String(season);
    if(!S.v621.snapshots[k]){
      S.v621.snapshots[k]=JSON.parse(JSON.stringify({
        season:S.season, round:S.round,
        players:S.players, finance:S.finance,
        form:S.form, lineups:S.lineups,
        t1:S.t1, t2:S.t2, npl:S.npl, stats:S.stats, cup:S.cup
      }));
      save();
    }
  }

  function clubPlayers(c){ return S.players[c] || (S.players[c]=[]); }

  function listedFor(club){
    ensure();
    return Object.values(S.v621.listed).filter(x=>x.club===club && x.status==="listed");
  }

  function makeBid(listing){
    ensure();
    const existing=S.v621.bids.find(b=>b.listingId===listing.id && b.status==="pending");
    if(existing) return existing;
    const clubs=allTeams().filter(c=>c!==listing.club);
    if(!clubs.length) return null;
    const from=clubs[Math.floor(Math.random()*clubs.length)];
    const base=Number(listing.asking||listing.value||1000000);
    const amount=Math.max(10000,Math.round(base*(0.95+Math.random()*0.2)));
    const bid={id:"bid_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      listingId:listing.id,playerId:listing.playerId,playerName:listing.playerName,
      seller:listing.club,buyer:from,amount,status:"pending"};
    S.v621.bids.push(bid);
    return bid;
  }

  function listPlayerFixed(playerId){
    ensure();
    const club=S.selected;
    const p=clubPlayers(club).find(x=>String(x.id)===String(playerId));
    if(!p){ alert("Player not found."); return; }

    const key=club+"::"+p.id;
    let listing=S.v621.listed[key];
    if(!listing){
      listing={id:"list_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
        club,playerId:p.id,playerName:p.name,pos:p.pos,ov:p.ov,
        value:Number(p.value||0),asking:Number(p.value||Math.max(10000,(Number(p.ov||60)**2)*9000)),
        status:"listed"};
      S.v621.listed[key]=listing;
    } else {
      listing.status="listed";
    }

    p.listed=true;
    p.listedAsking=listing.asking;
    makeBid(listing);
    save();
    renderSquadListingPanel();
  }

  function unlistPlayerFixed(playerId){
    ensure();
    const club=S.selected;
    const key=club+"::"+playerId;
    const l=S.v621.listed[key];
    if(!l) return;
    l.status="unlisted";
    const p=clubPlayers(club).find(x=>String(x.id)===String(playerId));
    if(p){ p.listed=false; delete p.listedAsking; }
    S.v621.bids=S.v621.bids.filter(b=>b.listingId!==l.id);
    save();
    renderSquadListingPanel();
  }

  function renderSquadListingPanel(){
    const club=S.selected;
    const list=listedFor(club);
    let host=document.getElementById("v621-listed-panel");
    if(!host){
      host=document.createElement("section");
      host.id="v621-listed-panel";
      host.className="card";
      const app=document.getElementById("app");
      if(app) app.prepend(host);
    }
    host.innerHTML="<h3>📋 Listed Players</h3>"+
      (list.length?list.map(l=>{
        const bid=S.v621.bids.find(b=>b.listingId===l.id&&b.status==="pending");
        return '<div class="fixture"><span><b>'+esc2(l.playerName)+'</b> — '+esc2(l.pos||"")+
          ' '+esc2(l.ov||"")+'<br><span class="small">Status: <b>Listed</b> • Asking: $'+
          Number(l.asking||0).toLocaleString()+
          (bid?' • 📨 Bid from <b>'+esc2(bid.buyer)+'</b>: $'+Number(bid.amount).toLocaleString():" • Waiting for bid")+
          '</span></span><span>'+
          '<button onclick="showIncomingBidsV621()">📨 Bids</button> '+
          '<button onclick="unlistPlayerV621(\\''+l.playerId+'\\')">Unlist</button></span></div>';
      }).join(""):'<p class="muted">No players are currently listed.</p>');
  }

  window.unlistPlayerV621=unlistPlayerFixed;

  function renderIncoming(){
    ensure();
    const club=S.selected;
    const bids=S.v621.bids.filter(b=>b.seller===club&&(b.status==="pending"||b.status==="countered"));
    let host=document.getElementById("v621-bids-panel");
    if(!host){
      host=document.createElement("section");
      host.id="v621-bids-panel";
      host.className="card";
      const app=document.getElementById("app");
      if(app) app.prepend(host);
    }
    host.innerHTML="<h3>📨 Incoming Bids</h3>"+
      (bids.length?bids.map(b=>'<div class="fixture"><span><b>'+esc2(b.playerName)+'</b><br>'+
        '🏟️ Buying club: <b>'+esc2(b.buyer)+'</b><br>'+
        '💰 Offer: $'+Number(b.amount).toLocaleString()+
        '</span><span><button onclick="acceptBidFixedV621(\\''+b.id+'\\')">Accept</button> '+
        '<button onclick="counterBidFixedV621(\\''+b.id+'\\')">Ask More</button> '+
        '<button onclick="rejectBidFixedV621(\\''+b.id+'\\')">Reject</button></span></div>').join(""):
        '<p class="muted">No incoming bids.</p>');
  }

  window.showIncomingBidsV621=function(){
    renderIncoming();
    const p=document.getElementById("v621-bids-panel");
    if(p) p.scrollIntoView({behavior:"smooth",block:"start"});
  };

  window.acceptBidFixedV621=function(bidId){
    ensure();
    const b=S.v621.bids.find(x=>x.id===bidId);
    if(!b) return;
    const arr=clubPlayers(b.seller);
    const i=arr.findIndex(p=>String(p.id)===String(b.playerId));
    if(i<0) return alert("Player is no longer at your club.");
    if(clubPlayers(b.buyer).some(p=>p.id===b.playerId||p.name===arr[i].name))
      return alert("Transfer blocked: duplicate player.");
    const p=JSON.parse(JSON.stringify(arr[i]));
    arr.splice(i,1);
    p.listed=false; delete p.listedAsking; p.club=b.buyer;
    clubPlayers(b.buyer).push(p);
    S.finance=S.finance||{};
    S.finance[b.seller]=S.finance[b.seller]||{balance:0,budget:0};
    S.finance[b.seller].balance=Number(S.finance[b.seller].balance||0)+Number(b.amount);
    S.finance[b.seller].budget=Number(S.finance[b.seller].budget||0)+Number(b.amount);
    const key=b.seller+"::"+b.playerId;
    if(S.v621.listed[key]) S.v621.listed[key].status="sold";
    b.status="accepted";
    save();
    alert(p.name+" moved to "+b.buyer+" for $"+Number(b.amount).toLocaleString()+".");
    renderIncoming();
    renderSquadListingPanel();
  };

  window.rejectBidFixedV621=function(bidId){
    ensure();
    const b=S.v621.bids.find(x=>x.id===bidId); if(!b)return;
    b.status="rejected";
    // Give the listing another fresh bid immediately so the user can keep testing.
    const l=Object.values(S.v621.listed).find(x=>x.id===b.listingId&&x.status==="listed");
    if(l){ S.v621.bids=S.v621.bids.filter(x=>x.id!==bidId); makeBid(l); }
    save(); renderIncoming(); renderSquadListingPanel();
  };

  window.counterBidFixedV621=function(bidId){
    ensure();
    const b=S.v621.bids.find(x=>x.id===bidId); if(!b)return;
    const n=Number(prompt("Enter your counter-offer:",Math.round(Number(b.amount)*1.15)));
    if(!n||n<=Number(b.amount))return alert("Counter-offer must be higher.");
    b.amount=n;b.status="countered";
    save();renderIncoming();
  };

  // Past season UI: visible button + selectable list.
  window.showPastSeasonRestartV621=function(){
    ensure();
    const seasons=Object.keys(S.v621.snapshots).map(Number).sort((a,b)=>a-b);
    const app=document.getElementById("app");
    if(!app)return;
    app.innerHTML='<section class="card"><h2>🔄 Restart Past Season</h2>'+
      '<p class="muted">Choose a specific saved season. Restarting rewinds to the beginning of that season.</p>'+
      (seasons.length?seasons.map(s=>'<div class="fixture"><b>'+s+'/'+(s+1)+'</b>'+
        '<button onclick="restartSpecificSeasonV621('+s+')">Restart This Season</button></div>').join(""):
        '<p>No past-season snapshots are available yet.</p>')+
      '<button onclick="history.back()">← Back</button></section>';
  };

  window.restartSpecificSeasonV621=function(season){
    ensure();
    const snap=S.v621.snapshots[String(season)];
    if(!snap)return alert("No saved snapshot for that season.");
    if(!confirm("Restart "+season+"/"+(season+1)+"? All purchases, sales, results and money changes made during that season will be undone."))return;
    S.season=snap.season;S.round=snap.round;
    S.players=JSON.parse(JSON.stringify(snap.players));
    S.finance=JSON.parse(JSON.stringify(snap.finance));
    S.form=JSON.parse(JSON.stringify(snap.form));
    S.lineups=JSON.parse(JSON.stringify(snap.lineups));
    S.t1=JSON.parse(JSON.stringify(snap.t1));
    S.t2=JSON.parse(JSON.stringify(snap.t2));
    S.npl=JSON.parse(JSON.stringify(snap.npl));
    S.stats=JSON.parse(JSON.stringify(snap.stats));
    S.cup=JSON.parse(JSON.stringify(snap.cup));
    S.v621.bids=[];S.v621.listed={};
    save();
    if(typeof page==="function")page("home");
    else if(typeof render==="function")render();
    else location.reload();
  };

  // Make a visible button available in the game's navigation.
  function addSeasonButton(){
    if(document.getElementById("v621-season-button"))return;
    const b=document.createElement("button");
    b.id="v621-season-button";
    b.textContent="🔄 Past Seasons";
    b.onclick=showPastSeasonRestartV621;
    const nav=document.querySelector("nav");
    if(nav)nav.appendChild(b);
    else{
      const app=document.getElementById("app");
      if(app)app.prepend(b);
    }
  }

  // Hook common "List" buttons by watching the app. This avoids requiring a
  // particular existing function name in the older transfer UI.
  function hookListButtons(){
    document.querySelectorAll("button").forEach(btn=>{
      if(btn.dataset.v621Hooked)return;
      const t=(btn.textContent||"").trim().toLowerCase();
      if(t==="list"||t==="list player"||t.includes("list player")){
        const oc=btn.getAttribute("onclick")||"";
        const m=oc.match(/['"]([^'"]+)['"]/);
        if(m){
          btn.onclick=function(e){e.preventDefault();listPlayerFixed(m[1]);};
          btn.dataset.v621Hooked="1";
        }
      }
    });
  }

  ensure();
  snapshot(S.season);
  addSeasonButton();
  hookListButtons();
  renderSquadListingPanel();

  // Observe SPA screen changes so the visible controls stay present.
  new MutationObserver(()=>{
    addSeasonButton();
    hookListButtons();
  }).observe(document.body,{childList:true,subtree:true});
})();
