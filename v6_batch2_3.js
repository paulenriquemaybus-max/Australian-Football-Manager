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

  const realisticNames=[
    'Liam Carter','Noah Williams','Ethan Brooks','Lucas Martin','Jack Wilson','Oliver Hayes','Leo Mitchell','Mason Taylor','Charlie Bennett','Henry Collins',
    'Oscar Murphy','Cooper Davis','Max Sullivan','James Anderson','Thomas Walker','William Harris','Samuel Clarke','Harry Cooper','Alexander Scott','Benjamin Moore',
    'Daniel Evans','Jacob Turner','Joshua Wright','Ryan Edwards','Nathan Hughes','Dylan Roberts','Caleb Morris','Isaac Stewart','Lachlan Murray','Kai Thompson',
    'Jordan Campbell','Aiden Fraser','Finn McKenzie','Riley Johnson','Zac Morgan','Bailey King','Connor Walsh','Cameron Reid','Blake Foster','Jesse Parker',
    'Tyler Green','Logan Price','Aaron Bell','Callum Young','Mitch Graham','Toby Richardson','Adam Kelly','Jack O’Brien','Rhys Davies','Ben McDonald',
    'Marco Rossi','Matteo Romano','Luca Bianchi','Enzo Moretti','Nico Costa','Diego Santos','Mateo Silva','Andre Pereira','Rafael Mendes','Luis Fernandez',
    'Emilio Garcia','Carlos Torres','Javier Moreno','Miguel Costa','Antonio Cruz','Sergio Navarro','Gabriel Ramos','Pedro Almeida','Joao Martins','Bruno Carvalho',
    'Milan Kovac','Luka Petrovic','Nikola Jovanovic','Ivan Markovic','Filip Horvat','Dario Vukovic','Stefan Nikolic','Alexei Ivanov','Marek Novak','Tomas Kral',
    'Yuki Tanaka','Ren Ito','Hiro Sato','Daiki Nakamura','Kenji Watanabe','Min-jun Kim','Ji-ho Park','Wei Chen','Jun-seo Lee','Tae-hyun Choi'
  ];

  // Generate realistic, unique names for existing placeholder players too.
  const firstNames=['Liam','Noah','Ethan','Lucas','Jack','Oliver','Leo','Mason','Charlie','Henry','Oscar','Cooper','Max','James','Thomas','William','Samuel','Harry','Alexander','Benjamin','Daniel','Jacob','Joshua','Ryan','Nathan','Dylan','Caleb','Isaac','Lachlan','Kai','Jordan','Aiden','Finn','Riley','Zac','Bailey','Connor','Cameron','Blake','Jesse','Tyler','Logan','Aaron','Callum','Mitch','Toby','Adam','Rhys','Ben','Jayden','Kieran','Declan','Patrick','Xavier','Angus','Hamish','Flynn','Hudson','Ashton','Jaxon','Nate','Oscar','Arlo','Myles','Eli','Joel','Owen','Harrison','Jackson','Cody','Charlie','Archie'];
  const surnames=['Carter','Williams','Brooks','Martin','Wilson','Hayes','Mitchell','Taylor','Bennett','Collins','Murphy','Davis','Sullivan','Anderson','Walker','Harris','Clarke','Cooper','Scott','Moore','Evans','Turner','Wright','Edwards','Hughes','Roberts','Morris','Stewart','Murray','Thompson','Campbell','Fraser','McKenzie','Johnson','Morgan','King','Walsh','Reid','Foster','Parker','Green','Price','Bell','Young','Graham','Richardson','Kelly','McDonald','Baker','Brown','Campbell','Dawson','Fletcher','Foster','Griffiths','Hamilton','Henderson','Johnston','Lawson','Marshall','Mason','Miller','Morgan','Nelson','Patterson','Pearson','Phillips','Reynolds','Richards','Robinson','Ross','Russell','Ryan','Sanders','Simmons','Spencer','Stevens','Sutherland','Wallace','Watson','Webb','West','Woods','Wright','Young'];

  function nextRealisticName(){
    for(let i=0;i<firstNames.length;i++){
      for(let j=0;j<surnames.length;j++){
        const name=firstNames[i]+' '+surnames[j];
        if(!usedNames.has(name)){usedNames.add(name);return name;}
      }
    }
    return 'Academy Player '+uid23().slice(-6);
  }

  function renameExistingPlaceholders(){
    let renamed=0;
    Object.values(S.players||{}).forEach(arr=>(arr||[]).forEach(p=>{
      const n=String(p.name||'');
      if(/^.+ Squad Player \d+$/.test(n) || /^Academy Player /.test(n)){
        p.name=nextRealisticName();
        p.b23Depth=true;
        renamed++;
      }
    }));
    return renamed;
  }

  function makeFiller(club,index){
    const name=nextRealisticName();
    const pos=positions[index%positions.length];
    const ov=58+Math.floor(Math.random()*13);
    return {id:uid23(),name,pos,age:18+Math.floor(Math.random()*13),ov,club,
      value:+Math.max(.2,(ov-45)**2*.0025).toFixed(1),wage:Math.round(800+ov*70),
      contract:1+Math.floor(Math.random()*4),potential:Math.min(86,ov+Math.floor(Math.random()*8)),
      rarity:typeof rarityForOVR==='function'?rarityForOVR(ov):'Common',b23Depth:true};
  }

  const renamed=renameExistingPlaceholders();
  let added=0;
  const allTeams23=[...DATA.tier1,...DATA.tier2,...Object.values(DATA.npl||{}).flat()];
  allTeams23.forEach(club=>{
    S.players[club]=Array.isArray(S.players[club])?S.players[club]:[];
    while(S.players[club].length<18){
      S.players[club].push(makeFiller(club,S.players[club].length));
      added++;
    }
  });

  S.b23=S.b23||{};
  S.b23.version=2.3;
  S.b23.minimumSquadSize=18;
  S.b23.allClubsCovered=true;
  S.b23.added=added;
  S.b23.renamed=renamed;
  if(added || renamed){
    S.logs=S.logs||[];
    S.logs.unshift('BATCH 2.3: Named placeholder players and ensured every club has at least 18 players.');
  }
  if(typeof save==='function')save();
})();
