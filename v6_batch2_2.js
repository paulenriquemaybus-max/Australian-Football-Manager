/* V6 BATCH 2.2 — A-League squad depth + historical player pool
   Built around the working V6 2.1 game. Does not replace transfer, scout,
   listing, lineup, match or season-history systems. */
(function(){
  'use strict';
  if(typeof S==='undefined' || typeof DATA==='undefined' || !Array.isArray(DATA.tier1)) return;

  const A_TEAMS = DATA.tier1.filter(c => DATA.realPlayers && DATA.realPlayers[c]);
  const uid22=()=> 'b22_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const deep22=x=>JSON.parse(JSON.stringify(x));
  const money22=n=>'$'+Number(n||0).toFixed(1)+'m';

  function ensurePlayer(raw,club){
    const [name,pos,age,ov]=String(raw).split('|');
    const n=Number(ov)||60;
    const value=Math.max(.2,(n-45)**2*.0025);
    return {id:uid22(),name,pos:pos||'CM',age:Number(age)||22,ov:n,club,
      value:+value.toFixed(1),wage:Math.round(800+n*70),contract:1+Math.floor(Math.random()*4),
      potential:Math.min(94,n+Math.floor(Math.random()*8)),
      rarity:typeof rarityForOVR==='function'?rarityForOVR(n):'Common',b22Real:true};
  }

  // Add real players to existing saves without deleting players the user may
  // have bought through the working 2.1 transfer systems.
  function migrate(){
    S.players=S.players||{};
    let added=0;
    const allOwnedNames=new Set();
    Object.values(S.players).forEach(arr=>(arr||[]).forEach(p=>allOwnedNames.add(String(p.name))));

    A_TEAMS.forEach(club=>{
      S.players[club]=Array.isArray(S.players[club])?S.players[club]:[];
      const squad=S.players[club];
      const wanted=DATA.realPlayers[club]||[];
      const localNames=new Set(squad.map(p=>String(p.name)));
      wanted.forEach(raw=>{
        const name=String(raw).split('|')[0];
        if(localNames.has(name)||allOwnedNames.has(name)) return;
        const p=ensurePlayer(raw,club);
        squad.push(p);localNames.add(name);allOwnedNames.add(name);added++;
      });
      squad.forEach(p=>{p.club=club;p.rarity=p.rarity|| (typeof rarityForOVR==='function'?rarityForOVR(p.ov):'Common')});
    });

    S.b22=S.b22||{};
    S.b22.version=2.2;
    S.b22.realSquadsAdded=true;
    S.b22.added=added;
    S.b22.lastRun=Date.now();
    S.logs=S.logs||[];
    if(added) S.logs.unshift('BATCH 2.2: Added '+added+' real A-League squad players.');
  }

  function addLegendsToWorldPool(){
    S.worldPool=Array.isArray(S.worldPool)?S.worldPool:[];
    const existing=new Set(S.worldPool.map(p=>p.name));
    const legends=[
      ['Thomas Broich','CAM',35,84],['Besart Berisha','ST',39,84],['Alessandro Del Piero','CAM',41,88],
      ['Shane Smeltz','ST',43,82],['Mark Viduka','ST',50,90],['Harry Kewell','LW',47,88],
      ['Tim Cahill','ST',46,88],['Archie Thompson','ST',47,84],['Brett Emerton','RB',47,84],
      ['Mile Jedinak','CM',41,84],['Mark Milligan','CM',40,81],['Tomer Hemed','ST',39,81],
      ['Ryo Nagai','ST',36,79],['Nikolai Topor-Stanley','CB',40,79],['Matt McKay','LB',42,81],
      ['Leigh Broxham','CM',38,78],['Carl Valeri','CM',41,80],['Tarek Elrich','RB',38,78],
      ['Thomas Rogic','CAM',33,84],['Aaron Mooy','CM',35,87],['Mathew Leckie','RW',35,82],
      ['Bruno Fornaroli','ST',38,84],['Diego Castro','LW',43,82],['Adrian Luna','CAM',34,80],
      ['Besart Berisha','ST',39,84]
    ];
    let added=0;
    legends.forEach(([name,pos,age,ov])=>{
      if(existing.has(name))return;
      const p=typeof player==='function'?player(name,pos,age,ov,'World Pool','Legendary'):ensurePlayer(name+'|'+pos+'|'+age+'|'+ov,'World Pool');
      p.club='World Pool';p.b22Legend=true;p.rarity='Legendary';
      S.worldPool.push(p);existing.add(name);added++;
    });
    if(added) S.logs.unshift('BATCH 2.2: Added '+added+' A-League all-time/legend players to the world pool.');
  }

  try{
    migrate();
    addLegendsToWorldPool();
    if(typeof save==='function')save();
    if(document.querySelector('.sub')) document.querySelector('.sub').textContent='34-match seasons • real A-League squads • historical players • world transfer pool • transfer bids • season history';
  }catch(e){console.warn('V6 Batch 2.2 migration:',e)}
})();
