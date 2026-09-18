/* V6 BATCH 2.3 — Minimum squad depth + randomised player names
   Keeps all existing player attributes and does not change transfer, scout,
   listing, lineup, match or season-history systems. */
(function(){
  'use strict';
  if(typeof S==='undefined' || typeof DATA==='undefined' || !Array.isArray(DATA.tier1)) return;

  const uid23=()=> 'b23_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const positions=['GK','CB','CB','LB','RB','CM','CM','CAM','LM','RM','LW','RW','ST','ST','CDM','CB','CM','ST'];
  const firstNames=['Liam','Noah','Ethan','Lucas','Jack','Oliver','Leo','Mason','Charlie','Henry','Oscar','Cooper','Max','James','Thomas','William','Samuel','Harry','Alexander','Benjamin','Daniel','Jacob','Joshua','Ryan','Nathan','Dylan','Caleb','Isaac','Lachlan','Kai','Jordan','Aiden','Finn','Riley','Zac','Bailey','Connor','Cameron','Blake','Jesse','Tyler','Logan','Aaron','Callum','Mitch','Toby','Adam','Rhys','Ben','Jayden','Kieran','Declan','Patrick','Xavier','Angus','Hamish','Flynn','Hudson','Ashton','Jaxon','Nate','Arlo','Myles','Eli','Joel','Owen','Harrison','Jackson','Cody','Archie','Jett','Kobe','Reece','Hayden','Mitchell','Bailey','Kye','Stefan','Luca','Nico','Marco','Mateo','Rafael','Emilio','Javier','Diego','Milan','Luka','Nikola','Ivan','Yuki','Ren','Hiro','Daiki','Kenji'];
  const surnames=['Carter','Williams','Brooks','Martin','Wilson','Hayes','Mitchell','Taylor','Bennett','Collins','Murphy','Davis','Sullivan','Anderson','Walker','Harris','Clarke','Cooper','Scott','Moore','Evans','Turner','Wright','Edwards','Hughes','Roberts','Morris','Stewart','Murray','Thompson','Campbell','Fraser','McKenzie','Johnson','Morgan','King','Walsh','Reid','Foster','Parker','Green','Price','Bell','Young','Graham','Richardson','Kelly','McDonald','Baker','Brown','Dawson','Fletcher','Griffiths','Hamilton','Henderson','Johnston','Lawson','Marshall','Mason','Miller','Nelson','Patterson','Pearson','Phillips','Reynolds','Richards','Robinson','Ross','Russell','Sanders','Simmons','Spencer','Stevens','Sutherland','Wallace','Watson','Webb','West','Woods'];

  const usedNames=new Set();
  Object.values(S.players||{}).forEach(arr=>(arr||[]).forEach(p=>usedNames.add(String(p.name||''))));
  const clubFirstPool={};

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function nextName(club, preferredFirst){
    if(!clubFirstPool[club]) clubFirstPool[club]=shuffle(firstNames.slice());
    let first=preferredFirst||clubFirstPool[club].pop();
    if(!first){first=firstNames[Math.floor(Math.random()*firstNames.length)];}
    const shuffledLast=shuffle(surnames.slice());
    for(const last of shuffledLast){
      const name=first+' '+last;
      if(!usedNames.has(name)){usedNames.add(name);return name;}
    }
    let n=2,name=first+' '+shuffledLast[0];
    while(usedNames.has(name)) name=first+' '+shuffledLast[0]+' '+n++;
    usedNames.add(name);return name;
  }

  // Replace old placeholder names and fix any previous batch-created squads
  // so the generated players do not all share the same first name.
  let renamed=0;
  const allTeams23=[...DATA.tier1,...DATA.tier2,...Object.values(DATA.npl||{}).flat()];
  allTeams23.forEach(club=>{
    const squad=Array.isArray(S.players[club])?S.players[club]:[];
    S.players[club]=squad;
    const depth=squad.filter(p=>p && p.b23Depth);
    const existingDepthNames=new Set();
    depth.forEach(p=>{ usedNames.delete(String(p.name||'')); });
    const shuffledFirst=shuffle(firstNames.slice());
    depth.forEach((p,i)=>{
      let first=shuffledFirst[i%shuffledFirst.length];
      let name=nextName(club,first);
      while(existingDepthNames.has(name)) name=nextName(club,first);
      p.name=name; existingDepthNames.add(name); renamed++;
    });
  });

  let added=0;
  allTeams23.forEach(club=>{
    const squad=S.players[club];
    while(squad.length<18){
      const ov=58+Math.floor(Math.random()*13);
      const name=nextName(club);
      squad.push({id:uid23(),name,pos:positions[squad.length%positions.length],age:18+Math.floor(Math.random()*13),ov,
        club,value:+Math.max(.2,(ov-45)**2*.0025).toFixed(1),wage:Math.round(800+ov*70),
        contract:1+Math.floor(Math.random()*4),potential:Math.min(86,ov+Math.floor(Math.random()*8)),
        rarity:typeof rarityForOVR==='function'?rarityForOVR(ov):'Common',b23Depth:true});
      added++;
    }
  });

  S.b23=S.b23||{};
  S.b23.version=2.3;
  S.b23.minimumSquadSize=18;
  S.b23.allClubsCovered=true;
  S.b23.randomFirstNames=true;
  S.b23.renamed=(S.b23.renamed||0)+renamed;
  S.b23.added=(S.b23.added||0)+added;
  if(renamed||added){
    S.logs=S.logs||[];
    S.logs.unshift('BATCH 2.3: Randomised depth-player names and ensured every club has at least 18 players.');
  }
  if(typeof save==='function')save();
})();
