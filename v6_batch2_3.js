/* V6 BATCH 2.3 — Minimum squad depth
   Only ensures every club has at least 18 players so lineups can be filled.
   Does not change lineup, match, transfer, scout, listing or season systems. */
(function(){
  'use strict';
  if(typeof S==='undefined' || typeof DATA==='undefined' || !Array.isArray(DATA.tier1)) return;

  const uid23=()=> 'b23_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const positions=['GK','CB','CB','LB','RB','CM','CM','CAM','LM','RM','LW','RW','ST','ST','CDM','CB','CM','ST'];
  const usedNames=new Set();
  Object.values(S.players||{}).forEach(arr=>(arr||[]).forEach(p=>usedNames.add(String(p.name))));

  function makeFiller(club,index){
    let name;
    do{name=club+' Squad Player '+(index+1);}while(usedNames.has(name));
    usedNames.add(name);
    const pos=positions[index%positions.length];
    const ov=58+Math.floor(Math.random()*13);
    return {id:uid23(),name,pos,age:18+Math.floor(Math.random()*13),ov,club,
      value:+Math.max(.2,(ov-45)**2*.0025).toFixed(1),wage:Math.round(800+ov*70),
      contract:1+Math.floor(Math.random()*4),potential:Math.min(86,ov+Math.floor(Math.random()*8)),
      rarity:typeof rarityForOVR==='function'?rarityForOVR(ov):'Common',b23Depth:true};
  }

  let added=0;
  DATA.tier1.forEach(club=>{
    S.players[club]=Array.isArray(S.players[club])?S.players[club]:[];
    while(S.players[club].length<18){
      S.players[club].push(makeFiller(club,S.players[club].length));
      added++;
    }
  });

  S.b23=S.b23||{};
  S.b23.version=2.3;
  S.b23.minimumSquadSize=18;
  S.b23.added=added;
  if(added){
    S.logs=S.logs||[];
    S.logs.unshift('BATCH 2.3: Ensured every club has at least 18 players.');
  }
  if(typeof save==='function')save();
})();
