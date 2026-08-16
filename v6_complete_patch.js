
/* ==========================================================
   V6 COMPLETE PATCH
   Finishes the remaining management systems and integrates them
   with the existing V5/V6 game.
   ========================================================== */
(function(){
"use strict";

const V6C = {
  getTeams:()=>[...DATA.tier1,...DATA.tier2,...Object.values(DATA.npl).flat()],
  getLeague:c=>findLeague(c),
  ensure(){
    S.injuries=S.injuries||{};
    S.suspensions=S.suspensions||{};
    S.youth=S.youth||{};
    S.facilities=S.facilities||{};
    S.manager=S.manager||{name:"Manager",reputation:50,jobSecurity:75};
    S.stats=S.stats||{};
    S.sponsors=S.sponsors||{};
    S.awards=S.awards||[];
    S.finals=S.finals||null;
    S.contracts=S.contracts||{};
    S.morale=S.morale||{};
    S.history=S.history||[];
    S.saves=S.saves||{};
    S.settings=S.settings||{difficulty:"Normal"};
    for(const c of V6C.getTeams()){
      if(!S.facilities[c]) S.facilities[c]={training:1,academy:1,scouting:1,medical:1,stadium:1};
      if(!S.youth[c]) S.youth[c]=[];
      if(!S.stats[c]) S.stats[c]={wins:0,draws:0,losses:0,goals:0,assists:0,cleanSheets:0};
      if(!S.sponsors[c]) S.sponsors[c]=null;
      (S.players[c]||[]).forEach(p=>{
        p.fitness=Number.isFinite(+p.fitness)?+p.fitness:100;
        p.morale=Number.isFinite(+p.morale)?+p.morale:75;
        p.contract=Number.isFinite(+p.contract)?+p.contract:2;
        p.wage=Number.isFinite(+p.wage)?+p.wage:Math.max(.01,p.ov*.004);
        p.potential=Number.isFinite(+p.potential)?+p.potential:Math.min(99,p.ov+10);
        p.status=p.status||"fit";
      });
    }
  },

  dedupe(){
    const seen=new Set();
    for(const c of V6C.getTeams()){
      S.players[c]=(S.players[c]||[]).filter(p=>{
        const key=String(p.id||p.name).toLowerCase();
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const owned=new Set(V6C.getTeams().flatMap(c=>(S.players[c]||[]).map(p=>String(p.name).toLowerCase())));
    S.worldPool=(S.worldPool||[]).filter(p=>!owned.has(String(p.name).toLowerCase()));
    S.market=(S.market||[]).filter(p=>!owned.has(String(p.name).toLowerCase()));
  },

  lineup(c){
    const ps=S.players[c]||[];
    const formation=S.formations?.[c]||"4-3-3";
    const ids=S.lineups?.[c]||[];
    const chosen=ids.map(id=>ps.find(p=>p.id===id)).filter(Boolean);
    const valid=chosen.length===11 && new Set(chosen.map(p=>p.id)).size===11 &&
      chosen.filter(p=>p.pos==="GK").length===1;
    if(valid)return chosen;
    const out=[];
    const used=new Set();
    const slots=(V6?.formations?.[formation]||["GK","LB","CB","CB","RB","CM","CM","CAM","LW","ST","RW"]);
    for(const slot of slots){
      let candidates=ps.filter(p=>!used.has(p.id));
      if(slot==="GK") candidates=candidates.filter(p=>p.pos==="GK");
      else candidates=candidates.filter(p=>p.pos!=="GK");
      if(["LB","RB"].includes(slot)) candidates.sort((a,b)=>b.ov-a.ov);
      else candidates.sort((a,b)=>b.ov-a.ov);
      if(candidates[0]){used.add(candidates[0].id);out.push(candidates[0]);}
    }
    if(out.filter(p=>p.pos==="GK").length===0){
      const gk=ps.find(p=>p.pos==="GK"&&!used.has(p.id));
      if(gk) out[0]=gk;
    }
    return out.slice(0,11);
  },

  saveHistorySnapshot(){
    const s=snapshot();
    s.snapshot=clone({
      season:S.season,round:1,finished:false,selected:S.selected,
      t1:S.t1,t2:S.t2,npl:S.npl,players:S.players,finance:S.finance,
      form:S.form,lineups:S.lineups,history:S.history,cup:S.cup,
      facilities:S.facilities,youth:S.youth,manager:S.manager,stats:S.stats
    });
    return s;
  },

  finalizeRegularSeason(){
    if(!check34()) return false;
    const a=standings(S.t1);
    S.finals={
      season:S.season,
      champion:a[0]?.team||null,
      qualified:a.slice(0,6).map(x=>x.team),
      stage:"elimination",
      matches:[],
      winner:null
    };
    // Realistic 6-team finals structure:
    // 1st/2nd receive week off; 3rd v 6th and 4th v 5th.
    S.finals.matches=[
      {stage:"Elimination Final",a:a[2]?.team,b:a[5]?.team,done:false},
      {stage:"Elimination Final",a:a[3]?.team,b:a[4]?.team,done:false}
    ];
    S.logs.unshift("🏆 Regular-season champion: "+S.finals.champion);
    S.logs.unshift("🏟️ A-League finals series has begun.");
    S.finished=true;
    return true;
  },

  playFinalMatch(){
    if(!S.finals||S.finals.winner)return;
    const pending=S.finals.matches.find(m=>!m.done);
    if(pending){
      let [x,y]=match(pending.a,pending.b);
      if(x===y)x++;
      pending.x=x;pending.y=y;pending.done=true;
      pending.winner=x>y?pending.a:pending.b;
      S.logs.unshift("FINALS: "+pending.a+" "+x+"-"+y+" "+pending.b);
      if(S.finals.matches.every(m=>m.done)){
        const winners=S.finals.matches.map(m=>m.winner);
        const top=S.finals.qualified[0], second=S.finals.qualified[1];
        S.finals.matches.push(
          {stage:"Preliminary Final",a:second,b:winners[0],done:false},
          {stage:"Preliminary Final",a:top,b:winners[1],done:false}
        );
      }
      save(); return;
    }
    const prelim=S.finals.matches.filter(m=>m.stage==="Preliminary Final");
    if(prelim.length===2&&prelim.every(m=>m.done)){
      const winners=prelim.map(m=>m.winner);
      S.finals.matches.push({stage:"Grand Final",a:winners[0],b:winners[1],done:false});
      save();return;
    }
    const gf=S.finals.matches.find(m=>m.stage==="Grand Final"&&!m.done);
    if(gf){
      let [x,y]=match(gf.a,gf.b);
      if(x===y)x++;
      gf.x=x;gf.y=y;gf.done=true;gf.winner=x>y?gf.a:gf.b;
      S.finals.winner=gf.winner;
      S.logs.unshift("🏆 GRAND FINAL WINNER: "+gf.winner);
      S.logs.unshift("🥇 REGULAR-SEASON CHAMPION: "+S.finals.champion);
      V6C.finishSeasonRecords();
      save();
    }
  },

  finishSeasonRecords(){
    const award=V6C.awards();
    S.awards.push({season:S.season,...award});
    const champ=S.finals?.champion||standings(S.t1)[0]?.team;
    const gf=S.finals?.winner||null;
    const snap=V6C.saveHistorySnapshot();
    snap.champion=champ;snap.grandFinalWinner=gf;
    S.history.push(snap);
    V6C.applyPromotion();
    V6C.managerReview(champ,gf);
    V6C.youthEndSeason();
    V6C.progressStats();
  },

  applyPromotion(){
    const a=standings(S.t1),b=standings(S.t2);
    const c=Object.values(S.npl).flatMap(l=>standings(l));
    const relA=a.slice(-2).map(x=>x.team),promA=b.slice(0,2).map(x=>x.team);
    const relB=b.slice(-2).map(x=>x.team),promB=c.slice(0,2).map(x=>x.team);
    S.logs.unshift("⬆️ Tier 2 → A-League: "+promA.join(", "));
    S.logs.unshift("⬇️ A-League → Tier 2: "+relA.join(", "));
    S.logs.unshift("⬆️ Tier 3 → Tier 2: "+promB.join(", "));
    S.logs.unshift("⬇️ Tier 2 → Tier 3: "+relB.join(", "));
    // Store the movements for the next-season builder.
    S.promotion={relA,promA,relB,promB};
  },

  managerReview(champ,gf){
    const c=S.selected, p=posn(c), rep=S.manager.reputation;
    if(champ===c)S.manager.reputation=Math.min(100,rep+12);
    else if(gf===c)S.manager.reputation=Math.min(100,rep+9);
    else if(p<=4)S.manager.reputation=Math.min(100,rep+4);
    else if(p>=15)S.manager.reputation=Math.max(0,rep-10);
    S.manager.jobSecurity=clamp(40+S.manager.reputation*.6,0,100);
    S.logs.unshift("👔 Manager reputation: "+Math.round(S.manager.reputation)+"/100");
  },

  awards(){
    const ps=V6C.getTeams().flatMap(c=>(S.players[c]||[]).map(p=>({...p,club:c})));
    const golden=[...ps].sort((a,b)=>num(b.goals)-num(a.goals))[0];
    const best=[...ps].sort((a,b)=>b.ov-a.ov)[0];
    return {goldenBoot:golden?.name||"N/A",playerOfSeason:best?.name||"N/A"};
  },

  progressStats(){
    for(const c of V6C.getTeams()){
      const st=S.stats[c]||{};
      st.goals=st.goals||0;st.assists=st.assists||0;
      S.stats[c]=st;
    }
  },

  youthEndSeason(){
    for(const c of V6C.getTeams()){
      const f=S.facilities[c];
      const count=Math.min(3,1+f.academy);
      for(let i=0;i<count;i++){
        const p=V6_FULL?.generatePlayer?V6_FULL.generatePlayer({rarity:"Common"}):null;
        if(!p)continue;
        p.id=uid();p.age=16+Math.floor(Math.random()*3);p.ov=Math.max(50,p.ov-5);
        p.potential=Math.min(95,p.ov+12+Math.floor(Math.random()*10));
        p.club=c;p.youth=true;
        S.youth[c].push(p);
      }
    }
  },

  injuryRoll(){
    for(const c of V6C.getTeams()){
      for(const p of (S.players[c]||[])){
        if(p.fitness<45 && Math.random()<.25){
          const days=1+Math.floor(Math.random()*4);
          S.injuries[p.id]={club:c,rounds:days,reason:"Fitness/injury"};
          p.status="injured";
        }else if(Math.random()<.015){
          S.injuries[p.id]={club:c,rounds:1+Math.floor(Math.random()*3),reason:"Match injury"};
          p.status="injured";
        }
      }
    }
  },

  tickStatus(){
    for(const [id,x] of Object.entries(S.injuries||{})){
      x.rounds--;if(x.rounds<=0){
        const p=(S.players[x.club]||[]).find(p=>p.id===id);
        if(p){p.status="fit";p.fitness=Math.max(p.fitness,70);}
        delete S.injuries[id];
      }
    }
    for(const c of V6C.getTeams()){
      for(const p of (S.players[c]||[])){
        p.fitness=clamp(p.fitness+(p.status==="injured"?2:-Math.floor(Math.random()*3)),0,100);
        p.morale=clamp(p.morale+(p.listed?-1:0)+(p.fitness>80?1:-1),1,100);
      }
    }
  },

  clubUpgrade(c,type){
    const cost={training:3,academy:4,scouting:3,medical:4,stadium:5}[type];
    S.facilities[c]=S.facilities[c]||{training:1,academy:1,scouting:1,medical:1,stadium:1};
    if(!cost)return false;
    const f=S.facilities[c],level=num(f[type],1);
    if(level>=5)return false;
    const price=cost*level;
    if(clubMoney(c).balance<price)return false;
    clubMoney(c).balance-=price;f[type]=level+1;
    S.logs.unshift("🏟️ "+c+" upgraded "+type+" to level "+f[type]+".");
    save();return true;
  },

  sponsor(c){
    const f=S.facilities[c], rep=S.manager.reputation;
    const offer={name:["Aussie Sport Co","Southern Bank","Football Australia Partner","Global Sports"][Math.floor(Math.random()*4)],
      money:+(2+rep/20+f.stadium*.5).toFixed(1),years:1+(rep>70?1:0)};
    S.sponsors[c]=offer;
    clubMoney(c).balance+=offer.money;
    clubMoney(c).budget+=offer.money*.35;
    S.logs.unshift("🤝 Sponsor deal: "+offer.name+" paid "+money(offer.money)+"m-equivalent to "+c);
    save();return offer;
  },

  generateIncomingAI(){
    const c=S.selected;
    const players=(S.players[c]||[]).filter(p=>p.listed);
    for(const p of players){
      if(Math.random()<.28){
        const clubs=V6C.getTeams().filter(x=>x!==c);
        const buyer=clubs[Math.floor(Math.random()*clubs.length)];
        const bid=+(p.value*(.9+Math.random()*.45)).toFixed(1);
        if(!S.offers.some(o=>o.playerId===p.id&&o.from===buyer)){
          S.offers.push({id:uid(),player:p.name,playerId:p.id,from:buyer,to:c,amount:bid,kind:"AI bid"});
          S.logs.unshift("📨 Incoming bid: "+buyer+" bid "+money(bid)+" for "+p.name);
        }
      }
    }
  },

  smartAI(){
    // AI considers squad needs, budget and player quality rather than random transfers only.
    const clubs=V6C.getTeams();
    for(const buyer of clubs){
      const squad=S.players[buyer]||[];
      const avg=squad.length?squad.reduce((a,p)=>a+p.ov,0)/squad.length:55;
      const weak=squad.filter(p=>p.ov<avg-6).length;
      if(weak<2 || Math.random()>.35)continue;
      const pool=(S.worldPool||[]).filter(p=>p.club==="World Pool" && p.ov>=avg && !(S.players[buyer]||[]).some(x=>x.name===p.name));
      if(!pool.length)continue;
      const p=pool[Math.floor(Math.random()*pool.length)];
      const fee=+(p.value*(1+Math.random()*.2)).toFixed(1);
      if(clubMoney(buyer).budget>=fee && Math.random()<.7){
        p.club=buyer;S.players[buyer].push(p);S.worldPool=S.worldPool.filter(x=>x.id!==p.id);
        clubMoney(buyer).budget-=fee;clubMoney(buyer).balance+=fee*.15;
        S.logs.unshift("🤖 AI SMART TRANSFER: "+buyer+" signed "+p.name+" for "+money(fee));
      }
    }
  },

  completeSwap(fromClub,playerId,toClub,targetId,cash=0){
    const a=(S.players[fromClub]||[]).find(p=>p.id===playerId);
    const b=(S.players[toClub]||[]).find(p=>p.id===targetId);
    if(!a||!b||fromClub===toClub)return false;
    if((S.players[fromClub]||[]).some(p=>p.id===targetId)||(S.players[toClub]||[]).some(p=>p.id===playerId))return false;
    S.players[fromClub]=S.players[fromClub].filter(p=>p.id!==a.id);
    S.players[toClub]=S.players[toClub].filter(p=>p.id!==b.id);
    a.club=toClub;b.club=fromClub;
    S.players[fromClub].push(b);S.players[toClub].push(a);
    if(cash>0){clubMoney(fromClub).balance-=cash;clubMoney(toClub).balance+=cash;}
    S.logs.unshift("🔄 SWAP COMPLETE: "+a.name+" ↔ "+b.name+(cash?" + "+money(cash):""));
    save();return true;
  }
};

// --- Integrate V6C with existing controls ---
V6C.ensure();V6C.dedupe();

// Automatic lineup immediately on open for every club.
S.lineups=S.lineups||{};
for(const c of V6C.getTeams()){
  if(!S.lineups[c] || S.lineups[c].filter(Boolean).length!==11){
    const xi=V6C.lineup(c);
    S.lineups[c]=xi.map(p=>p.id);
  }
}
save();

// Replace round simulation with fitness, injuries, smart AI and stats.
const oldSimRound=simRound;
window.simRound=function(){
  if(S.finished && !S.finals){alert("Season finished. Open History or start the next season.");return;}
  if(S.round>34){if(!S.finished)V6C.finalizeRegularSeason();page("home");return;}
  // Keep the original 34-match engine, then layer the missing systems on top.
  oldSimRound();
  V6C.injuryRoll();
  V6C.tickStatus();
  V6C.generateIncomingAI();
  V6C.smartAI();
  save();
};

// Replace finish with regular-season + finals flow.
window.finish=function(){
  if(!V6C.finalizeRegularSeason()){
    alert("Season integrity error: every team must finish exactly 34 league games.");
    return;
  }
  save();page("home");
};

// New season correctly moves teams one tier at a time, including Tier 3.
window.newSeason=function(){
  if(S.finals && !S.finals.winner){
    alert("Finish the A-League finals and Grand Final first.");
    return;
  }
  if(!S.finished && S.round<=34){
    if(!confirm("The current season is not finished. Start a new season anyway?"))return;
  }
  const a=standings(S.t1),b=standings(S.t2);
  const third=Object.values(S.npl).flatMap(l=>standings(l)).sort((x,y)=>y.pts-x.pts||((y.gf-y.ga)-(x.gf-x.ga)));
  const relA=a.slice(-2).map(x=>x.team),promA=b.slice(0,2).map(x=>x.team);
  const relB=b.slice(-2).map(x=>x.team),promB=third.slice(0,2).map(x=>x.team);

  let t1=S.t1.teams.filter(x=>!relA.includes(x)).concat(promA);
  let t2=S.t2.teams.filter(x=>!promA.includes(x)&&!relB.includes(x)).concat(relA,promB);
  // Put relegated Tier 2 teams into the NPL divisions without skipping tiers.
  const nplTeams=Object.fromEntries(Object.entries(S.npl).map(([k,l])=>[k,[...l.teams]]));
  relB.forEach((team,i)=>{
    const k=Object.keys(nplTeams)[i%Object.keys(nplTeams).length];
    nplTeams[k].push(team);
  });
  promB.forEach(team=>Object.keys(nplTeams).forEach(k=>nplTeams[k]=nplTeams[k].filter(x=>x!==team)));

  S.season++;
  S.round=1;S.finished=false;S.finals=null;S.cup=null;
  S.t1=makeLeague(t1);S.t2=makeLeague(t2);
  S.npl=Object.fromEntries(Object.entries(nplTeams).map(([k,teams])=>[k,makeLeague(teams)]));
  S.offers=[];S.market=[];
  S.logs.unshift("🔄 NEW SEASON "+S.season+": promotion/relegation completed one tier at a time.");
  refreshMarket();save();page("home");
};

// Season history now supports restarting a selected past season snapshot.
window.history=function(){
  let rows=S.history.map((h,i)=>`<div class="fixture"><span><b>${h.season}/${h.season+1}</b><br>
  <span class="muted">Regular champion: ${esc(h.champion||"N/A")} • Grand Final: ${esc(h.grandFinalWinner||"N/A")}</span></span>
  <button onclick="restartPastSeason(${i})">🔄 Restart</button></div>`).join("");
  document.getElementById("app").innerHTML=`<section class="card"><h2>🗂 Season History</h2>${rows||"<p class='muted'>No completed seasons yet.</p>"}
  <div class="actions"><button class="primary" onclick="newSeason()">➡️ Start Next Season</button><button onclick="restartSeason()">🔄 Restart Current Season</button></div></section>`;
};
window.restartPastSeason=function(i){
  const h=S.history[i], snap=h&&h.snapshot;
  if(!snap){alert("That season has no saved snapshot yet.");return;}
  if(!confirm("Restart the "+h.season+"/"+(h.season+1)+" season? Your current timeline will be replaced by this historical snapshot."))return;
  const keepHistory=clone(S.history);
  Object.assign(S,clone(snap));
  S.history=keepHistory;S.season=h.season;S.round=1;S.finished=false;S.finals=null;
  S.logs.unshift("🌳 TIMELINE RESTARTED: "+h.season+"/"+(h.season+1));
  save();page("home");
};

// Add finals page.
window.finals=function(){
  if(!S.finals){
    document.getElementById("app").innerHTML='<section class="card"><h2>🏟️ A-League Finals</h2><p>Finish all 34 regular-season rounds first.</p></section>';return;
  }
  const f=S.finals;
  const matches=f.matches.map((m,i)=>`<div class="fixture"><span><b>${m.stage}</b><br>${esc(m.a)} vs ${esc(m.b)}</span><span class="score">${m.done?m.x+"-"+m.y:"⌛"}</span></div>`).join("");
  document.getElementById("app").innerHTML=`<section class="card"><h2>🏆 A-League Finals Series</h2>
  <p>🥇 Regular-season champion: <b>${esc(f.champion)}</b></p>
  <p>🏆 Grand Final winner: <b>${esc(f.winner||"Not decided")}</b></p>
  <div class="actions"><button class="primary" onclick="V6C.playFinalMatch();page('finals')" ${f.winner?"disabled":""}>⚽ Play Next Finals Match</button></div></section>
  <section class="card"><h3>Knockout stages</h3>${matches}</section>`;
};

// Club page: manager, facilities, sponsorships and finances.
window.club=function(){
  const c=S.selected,f=S.facilities[c],m=S.manager,sp=S.sponsors[c];
  document.getElementById("app").innerHTML=`<section class="card"><h2>⭐ ${esc(c)}</h2>
  <div class="grid">
   <div class="card"><div class="muted">Position</div><div class="stat">${posn(c)}</div></div>
   <div class="card"><div class="muted">Balance</div><div class="stat">${money(clubMoney(c).balance)}</div></div>
   <div class="card"><div class="muted">Transfer budget</div><div class="stat">${money(clubMoney(c).budget)}</div></div>
   <div class="card"><div class="muted">Manager reputation</div><div class="stat">${Math.round(m.reputation)}/100</div></div>
  </div></section>
  <section class="card"><h3>🏟️ Club facilities</h3>
   ${["training","academy","scouting","medical","stadium"].map(x=>`<div class="fixture"><span>${x[0].toUpperCase()+x.slice(1)} — Level ${f[x]}</span><button onclick="V6C.clubUpgrade('${c}','${x}');page('club')">Upgrade</button></div>`).join("")}
  </section>
  <section class="card"><h3>🤝 Sponsorship</h3><p>${sp?esc(sp.name)+" — "+sp.years+" years, "+money(sp.money)+"m":"No active sponsor"}</p>
  <button onclick="V6C.sponsor('${c}');page('club')">Generate Sponsor Offer</button></section>`;
};

// Squad page: injuries, morale, contracts and upgrade controls.
window.squad=function(){
 const c=S.selected,ps=S.players[c]||[];
 document.getElementById("app").innerHTML=`<section class="card"><h2>👥 Squad — ${esc(c)}</h2>
 ${ps.map(p=>`<div class="player"><div><b>${esc(p.name)}</b> <span class="pill">${p.pos} • OVR ${p.ov}</span>
 <span class="rarity ${rarityClass(p.rarity)}">${esc(p.rarity)}</span><br>
 <span class="muted">${p.age} yrs • value ${money(p.value)} • contract ${p.contract} yr • potential ${p.potential} • fitness ${Math.round(p.fitness)} • morale ${Math.round(p.morale)} • ${esc(p.status||"fit")}</span></div>
 <div class="actions"><button onclick="listPlayer('${p.id}')">List</button>
 <button onclick="V6C.upgrade('${c}','${p.id}','ov')">+ OVR</button>
 <button onclick="V6C.upgrade('${c}','${p.id}','pace')">+ Pace</button></div></div>`).join("")}</section>`;
};
V6C.upgrade=function(c,id,attr){
 const p=(S.players[c]||[]).find(x=>x.id===id);if(!p)return;
 if(num(p.trainingPoints,1)<1 && num(S.clubTrainingPoints,100)<1){alert("Not enough Training Points.");return;}
 S.clubTrainingPoints=Math.max(0,num(S.clubTrainingPoints,100)-1);
 if(p.ov>=p.potential){alert("Player is already at potential.");return;}
 p.ov=Math.min(p.potential,p.ov+1);
 if(attr!=="ov")p[attr]=num(p[attr],50)+1;
 S.logs.unshift("📈 "+p.name+" upgraded: "+attr);
 save();page("squad");
};

// Stats page and youth academy page.
window.statsPage=function(){
 const rows=V6C.getTeams().map(c=>{const st=S.stats[c]||{};return `<tr><td>${esc(c)}</td><td>${st.wins||0}</td><td>${st.draws||0}</td><td>${st.losses||0}</td><td>${st.goals||0}</td></tr>`}).join("");
 document.getElementById("app").innerHTML=`<section class="card"><h2>📊 Advanced Statistics</h2><table><tr><th>Club</th><th>W</th><th>D</th><th>L</th><th>Goals</th></tr>${rows}</table></section>`;
};
window.youth=function(){
 const c=S.selected,ys=S.youth[c]||[];
 document.getElementById("app").innerHTML=`<section class="card"><h2>🧑‍🎓 Youth Academy — ${esc(c)}</h2>
 <p>Academy level ${S.facilities[c].academy}. Youth prospects are generated at season end.</p>
 ${ys.map(p=>`<div class="player"><span><b>${esc(p.name)}</b> — ${p.pos} • OVR ${p.ov} • Potential ${p.potential} • Age ${p.age}</span>
 <button onclick="promoteYouth('${p.id}')">Promote</button></div>`).join("")||"<p class='muted'>No prospects yet.</p>"}</section>`;
};
window.promoteYouth=function(id){
 const c=S.selected,ys=S.youth[c]||[],p=ys.find(x=>x.id===id);if(!p)return;
 p.youth=false;S.players[c].push(p);S.youth[c]=ys.filter(x=>x.id!==id);save();page("squad");
};

// Tactics page: selectable tactics and formation, with simulation effect.
window.tactics=function(){
 const c=S.selected;
 document.getElementById("app").innerHTML=`<section class="card"><h2>🧠 Tactics</h2>
 <p>Formation and tactic affect team strength and match probabilities.</p>
 <label>Formation <select id="form">${Object.keys(V6.formations).map(f=>`<option ${S.formations?.[c]===f?"selected":""}>${f}</option>`).join("")}</select></label>
 <label style="margin-left:8px">Tactic <select id="tac">${V6.tactics.map(t=>`<option ${S.tactics?.[c]===t?"selected":""}>${t}</option>`).join("")}</select></label>
 <button class="primary" onclick="S.formations=S.formations||{};S.tactics=S.tactics||{};S.formations['${c}']=document.getElementById('form').value;S.tactics['${c}']=document.getElementById('tac').value;save();page('tactics')">Save Tactics</button>
 </section>`;
};
S.formations=S.formations||{};S.tactics=S.tactics||{};
V6C.getTeams().forEach(c=>{S.formations[c]=S.formations[c]||"4-3-3";S.tactics[c]=S.tactics[c]||"Balanced";});

// Patch strength to use tactics/fitness and actual XI.
const oldStrength=strength;
window.strength=function(c){
 const xi=V6C.lineup(c);
 const avg=xi.length?xi.reduce((s,p)=>s+p.ov,0)/xi.length:oldStrength(c);
 const fit=xi.length?xi.reduce((s,p)=>s+p.fitness,0)/xi.length:75;
 const mor=xi.length?xi.reduce((s,p)=>s+p.morale,0)/xi.length:75;
 const tac=S.tactics[c]||"Balanced";
 const bonus=tac==="Attacking"?1.5:tac==="Defensive"?1:tac==="High Press"?1.2:tac==="Counter Attack"?1:tac==="Possession"?1.1:0;
 return clamp(avg+(fit-70)/18+(mor-70)/25+bonus,45,99);
};

// Transfer swap UI.
window.swap=function(){
 const c=S.selected,others=V6C.getTeams().filter(x=>x!==c);
 document.getElementById("app").innerHTML=`<section class="card"><h2>🔄 Swap Deals</h2>
 <p>Select another club and propose player-for-player or player + cash.</p>
 <select id="swapClub" onchange="swap()">${others.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
 <div class="grid" style="margin-top:12px">
 <div class="card"><h3>Your player</h3>${(S.players[c]||[]).map(p=>`<div class="player"><span>${esc(p.name)} • ${p.ov}</span><button onclick="selectSwapOut('${p.id}')">Select</button></div>`).join("")}</div>
 <div class="card"><h3>Target club</h3>${(S.players[document.getElementById("swapClub")?.value||others[0]]||[]).map(p=>`<div class="player"><span>${esc(p.name)} • ${p.ov}</span><button onclick="selectSwapIn('${p.id}')">Select</button></div>`).join("")}</div></div>
 <div class="muted">Use the selected players to complete a swap in the transfer negotiation screen.</div></section>`;
};
window.selectSwapOut=id=>{S.swapOut=id;save();alert("Player selected. Now select a target player.");};
window.selectSwapIn=id=>{
 const c=S.selected,club=document.getElementById("swapClub")?.value;
 if(!S.swapOut||!club){alert("Select your player first.");return;}
 const cash=Number(prompt("Extra cash from your club? (0 for straight swap)","0"))||0;
 if(V6C.completeSwap(c,S.swapOut,club,id,cash))alert("Swap completed!");
 else alert("Swap could not be completed.");
 S.swapOut=null;page("squad");
};

// Finals nav and extra management nav buttons.
const nav=document.querySelector("nav");
if(nav){
 const add=(label,fn)=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;nav.appendChild(b);};
 add("🏟️ Finals",()=>page("finals"));
 add("🧠 Tactics",()=>page("tactics"));
 add("🧑‍🎓 Youth",()=>page("youth"));
 add("📈 Stats",()=>page("statsPage"));
 add("🔄 Swaps",()=>page("swap"));
}

// Ensure automatic starting XIs are visible immediately after opening the game.
const oldLineup=lineup;
window.lineup=function(){ 
  for(const c of V6C.getTeams()){
    const xi=V6C.lineup(c);
    S.lineups[c]=xi.map(p=>p.id);
  }
  save(); oldLineup(); 
};

// Ensure incoming AI bids and listing stay in squad until accepted.
const oldList=listPlayer;
window.listPlayer=function(id){
 const p=(S.players[S.selected]||[]).find(x=>x.id===id);
 if(!p)return;
 p.listed=true;
 V6C.generateIncomingAI();
 S.logs.unshift("📋 LISTED: "+p.name+" remains in "+S.selected+" until a bid is accepted.");
 save();page("market");
};

// Finish V6 UI after all patches.
V6C.ensure();V6C.dedupe();save();
document.querySelector("header .sub").textContent="V6 COMPLETE • 34 games • Finals • transfers • swaps • upgrades • youth • tactics • finances";
page("home");
})();
