/* V6 Batch 2.1 — working Scout/Offer/Buy transfer market */
(function(){
  'use strict';
  function saveX(){ if(typeof save==='function') save(); }
  function fin(){ return clubMoney(S.selected); }
  function available(){ return Math.max(0, Number(fin().balance||0)); }
  function fmt(v){ return '$'+Math.round(Number(v||0)*1000000).toLocaleString(); }
  function parseDollars(v){ return Math.floor(Number(String(v).replace(/[$,]/g,''))); }
  function findMarket(id){ return (S.market||[]).find(p=>String(p.id)===String(id)); }
  function transferPlayer(p, price){
    if(!p) return false;
    if(price>available()){ alert('Not enough club funds. Available: '+fmt(available())); return false; }
    if((S.players[S.selected]||[]).some(x=>x.id===p.id||x.name===p.name)){ alert('This player is already in your squad.'); return false; }
    S.players[S.selected]=S.players[S.selected]||[];
    S.players[S.selected].push(Object.assign({},p,{club:S.selected}));
    fin().balance=Math.max(0,Number(fin().balance||0)-price);
    fin().budget=Math.max(0,Number(fin().budget||0)-price);
    S.market=(S.market||[]).filter(x=>x.id!==p.id);
    S.worldPool=(S.worldPool||[]).filter(x=>x.id!==p.id);
    S.logs=S.logs||[]; S.logs.unshift('TRANSFER: '+p.name+' joined '+S.selected+' for '+fmt(price));
    saveX(); return true;
  }
  window.buyMarketPlayerV621=function(id){
    const p=findMarket(id); if(!p)return alert('Player is no longer available.');
    const price=Number(p.asking||p.value||0);
    if(!price)return alert('This player has no valid price.');
    if(confirm('Buy '+p.name+' for '+fmt(price)+'?')){
      if(transferPlayer(p,price)){ alert(p.name+' joined '+S.selected+' for '+fmt(price)+'.'); renderMarket(); }
    }
  };
  window.offerMarketPlayerV621=function(id){
    const p=findMarket(id); if(!p)return alert('Player is no longer available.');
    const max=available(), asking=Number(p.asking||p.value||0);
    if(max<=0)return alert('Your club has no available funds.');
    const raw=prompt('Offer for '+p.name+'\nAsking price: '+fmt(asking)+'\nAvailable funds: '+fmt(max)+'\nEnter your offer in dollars:',Math.min(max,Math.round(asking*1000000)));
    if(raw===null)return;
    const dollars=parseDollars(raw), offer=dollars/1000000;
    if(!Number.isFinite(dollars)||dollars<=0)return alert('Enter a valid dollar amount.');
    if(dollars>max*1000000)return alert('Offer is above your available funds. Maximum: '+fmt(max));
    if(offer>=asking){
      if(transferPlayer(p,offer)){
        alert(p.name+' accepted your offer of '+fmt(offer)+'.'); renderMarket();
      }
      return;
    }
    const response=Math.random();
    if(response<0.35){
      alert(p.name+' rejected the offer.');
    }else{
      const counter=Math.min(max, Math.max(offer+0.05, asking));
      const counterDollars=Math.round(counter*1000000);
      const choice=prompt('The club asked for more.\nYour offer: '+fmt(offer)+'\nCounter-offer: '+fmt(counter)+'\nEnter a new amount to accept/continue, or Cancel to walk away:',counterDollars.toLocaleString());
      if(choice===null)return;
      const accepted=parseDollars(choice)/1000000;
      if(!Number.isFinite(accepted)||accepted<=0)return alert('Invalid amount.');
      if(accepted>max)return alert('You only have '+fmt(max)+' available.');
      if(accepted>=counter){
        if(transferPlayer(p,accepted)){ alert(p.name+' joined your club for '+fmt(accepted)+'.'); renderMarket(); }
      }else alert('The club did not accept that amount.');
    }
  };
  window.renderMarket=function(){
    const q=(document.getElementById('q')?.value||'').toLowerCase();
    const m=(S.market||[]).filter(p=>(p.name+' '+p.pos+' '+p.rarity).toLowerCase().includes(q));
    const el=document.getElementById('ml'); if(!el)return;
    el.innerHTML=m.map(p=>{
      const asking=Number(p.asking||p.value||0), max=available();
      return '<div class="player"><div><b>'+esc(p.name)+'</b> <span class="pill">'+p.pos+' • OVR '+p.ov+'</span> <span class="rarity '+rarityClass(p.rarity)+'">'+esc(p.rarity)+'</span><br><span class="muted">'+p.age+' yrs • Asking '+fmt(asking)+' • Your funds '+fmt(max)+'</span></div><div class="actions"><button class="primary" onclick="buyMarketPlayerV621(\\''+p.id+'\\')">🛒 Buy</button><button onclick="offerMarketPlayerV621(\\''+p.id+'\\')">💰 Offer</button></div></div>';
    }).join('')||'<p class="muted">No targets match. Scout again.</p>';
  };
  // Replace any old makeOffer hook with the working offer function.
  window.makeOffer=function(id){ offerMarketPlayerV621(id); };
  setTimeout(function(){ if(typeof renderMarket==='function')renderMarket(); },300);
})();
