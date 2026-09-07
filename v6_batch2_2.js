/* V6 BATCH 2.2 — Real A-League squads foundation
   Adds real A-League players to existing saves without touching transfer/negotiation systems.
   New games should use the matching data.js roster additions.
*/
(function(){
  'use strict';
  if(!window.S || !window.allTeams) return;

  const R={
    'Melbourne City':[
      ['Patrick Beach','GK',21,68],['Jamie Young','GK',40,67],['Aziz Behich','LB',35,74],['Kai Trewin','CB',25,73],['Samuel Souprayen','CB',36,69],['Nathaniel Atkinson','RB',27,74],['Callum Talbot','RB',26,73],['Steven Ugarkovic','CM',31,72],['Andreas Kuen','CM',31,72],['Mathew Leckie','RW',35,76],['Yonatan Cohen','LW',29,73],['Max Caputo','ST',20,70],['Arion Sulemani','ST',22,70],['Harry Politidis','LB',22,68],['Alessandro Lopane','CM',25,69],['Medin Memeti','ST',20,68],['Benjamin Mazzeo','RW',20,67],['James Nieuwenhuizen','GK',20,65]
    ],
    'Melbourne Victory':[
      ['Jack Duncan','GK',32,70],['Roderick Miranda','CB',35,72],['Brendan Hamill','CB',33,72],['Jason Geria','RB',32,72],['Joshua Rawlins','RB',22,69],['Adama Traore','LB',36,71],['Ryan Teague','CM',25,75],['Denis Genreau','CM',26,74],['Zinedine Machach','CAM',30,75],['Reno Piscopo','RW',28,72],['Daniel Arzani','LW',27,74],['Bruno Fornaroli','ST',38,79],['Nikolaos Vergos','ST',29,70],['Jordi Valadon','CM',23,68],['Keegan Jelacic','RW',23,69],['Louis D’Arrigo','CM',24,68],['Jason Davidson','LB',35,69],['Christian Siciliano','CB',19,64]
    ],
    'Sydney FC':[
      ['Andrew Redmayne','GK',37,73],['Harrison Devenish-Meares','GK',22,65],['Rhyan Grant','RB',34,73],['Joel King','LB',25,71],['Jordan Courtney-Perkins','CB',24,70],['Aaron Gurd','CB',24,68],['Anthony Caceres','CM',33,74],['Corey Hollman','CM',27,70],['Leonardo De Souza Sena','CM',30,71],['Anas Ouahim','CAM',28,72],['Joseph Lolley','RW',33,76],['Douglas Costa','RW',35,78],['Adrian Segecic','RW',21,72],['Jaiden Kucharski','ST',23,70],['Patrick Wood','ST',23,68],['Nathan Amanatidis','ST',19,67],['Tiago Quintal','CM',19,65],['Hayden Matthews','CB',21,68]
    ],
    'Western Sydney Wanderers':[
      ['Lawrence Thomas','GK',34,72],['Jordan Holmes','GK',31,68],['Jack Clisby','LB',33,70],['Gabriel Cleur','RB',26,69],['Alexander Bonetig','CB',23,69],['Taewook Jeong','CB',27,72],['Joshua Brillante','CM',33,71],['Brandon Borrello','RW',30,74],['Bozhidar Kraev','CAM',28,74],['Nicolas Milanovic','CAM',24,75],['Marcus Antonsson','ST',35,73],['Zachary Sapsford','ST',22,69],['Alexander Badolato','RW',21,68],['Oscar Priestman','CM',22,66],['Aidan Simmons','LB',24,67],['James Temelkovski','ST',21,65],['Taiga Harper','CB',21,65],['Nathan Barrie','RB',20,64]
    ],
    'Adelaide United':[
      ['Joshua Smits','GK',33,70],['Ethan Cox','GK',20,64],['Bart Vriends','CB',34,73],['Panagiotis Kikianis','CB',20,69],['Ryan Kitto','LB',31,73],['Jay Barnett','CM',24,71],['Luke Duzel','CM',23,68],['Ethan Alagich','CM',22,68],['Jonny Yull','CAM',19,69],['Juan Muniz','CAM',33,73],['Craig Goodwin','LW',34,78],['Yaya Dukuly','RW',23,68],['Ben Folami','ST',26,69],['Luka Jovanovic','ST',21,74],['Jake Najdovski','ST',20,67],['Dylan Pierias','RB',25,68],['Joey Garuccio','LB',30,67],['Anselmo de Moraes','ST',25,70]
    ],
    'Brisbane Roar':[
      ['Dean Bouzanis','GK',35,70],['Macklin Freke','GK',24,68],['Hosine Bility','CB',25,69],['Milorad Stajic','CB',22,67],['Matthew Dench','RB',22,66],['Antonee Burke-Gilroy','RB',29,69],['James McGarry','LB',27,70],['James O’Shea','CM',36,71],['Youstin Salas','CM',29,70],['Georgios Vrakas','CAM',24,69],['Ben Halloran','RW',33,72],['Henry Hore','ST',25,72],['Michael Ruhs','ST',25,69],['Christopher Long','ST',31,67],['Nathan Amanatidis','ST',19,67],['Jordan Lauton','RW',22,65],['Justin Vidic','CB',19,64],['Lucas Herrington','CB',23,65]
    ],
    'Perth Glory':[
      ['Cameron Cook','GK',22,69],['Oliver Sail','GK',30,71],['Lachlan Barr','CB',29,70],['Kaelan Majekodunmi','CB',22,67],['Riley Warland','CB',23,68],['Joshua Risdon','RB',33,71],['Sam Sutton','LB',24,69],['Brandon O’Neill','CM',31,72],['Nicholas Pennington','CM',26,69],['Mustafa Amini','CM',32,70],['Trent Ostler','CM',22,67],['Nikola Mileusnic','RW',33,70],['Adam Taggart','ST',33,76],['David Williams','ST',37,70],['Jarrod Carluccio','LW',25,68],['Taras Gomulka','CM',24,67],['Anas Hamzaoui','LB',24,65],['Joel Anasmo','RW',21,64]
    ],
    'Newcastle Jets':[
      ['James Delianov','GK',26,70],['Ryan Scott','GK',31,69],['Mark Natta','CB',22,71],['Phillip Cancar','CB',24,68],['Aleksandar Susnjar','CB',30,69],['Dane Ingham','RB',25,70],['Daniel Wilmering','LB',28,68],['Lachlan Bayliss','CM',22,69],['Callum Timmins','CM',26,70],['Kostandinos Grozos','CM',25,70],['Eli Adams','RW',30,72],['Max Burgess','RW',30,70],['Clayton Taylor','LW',23,74],['Lachlan Rose','ST',25,68],['Zach Clough','ST',30,71],['Alex Nassiep','ST',21,66],['Justin Vidic','CB',19,64],['Lucas Scicluna','CM',20,65]
    ],
    'Central Coast Mariners':[
      ['Adam Pavlesic','GK',20,68],['Andrew Redmayne','GK',37,73],['Brian Kaltak','CB',32,73],['Trent Sainsbury','CB',34,74],['Nathan Paull','CB',22,69],['Storm Roux','RB',32,70],['Lucas Mauragis','LB',24,70],['Sasha Kuzevski','RB',23,67],['Alfie McCalmont','CM',25,70],['Harrison Steele','CM',24,69],['Bradley Tapp','CM',22,67],['Christian Theoharous','RW',26,69],['Vitor Feijão','LW',29,68],['Alou Kuol','ST',24,72],['Ryan Edmondson','ST',24,69],['Miguel Di Pizio','ST',20,67],['Bailey Brandtman','ST',20,65],['Jai Ajanovic','CB',20,64]
    ],
    'Macarthur FC':[
      ['Filip Kurto','GK',34,71],['Alexander Robinson','GK',22,65],['Dino Arslanagic','CB',33,70],['Matt Jurman','CB',36,69],['Ivan Vujica','LB',29,70],['Yianni Nicolaou','RB',24,67],['Luke Brattan','CM',36,70],['Liam Rose','CM',28,71],['Anthony Caceres','CM',33,74],['Jake Hollman','CM',25,73],['Daniel De Silva','CAM',28,71],['Chris Ikonomidis','LW',31,70],['Marin Jakolis','RW',29,73],['Jed Drew','RW',23,72],['Valere Germain','ST',36,75],['Kealey Adamson','ST',21,67],['Bernardo Oliveira','RW',21,66],['Tomislav Uskok','CB',33,68]
    ],
    'Wellington Phoenix':[
      ['Joshua Oluwayemi','GK',24,68],['Sam Sutton','LB',24,69],['Scott Wootton','CB',34,70],['Isaac Hughes','CB',22,67],['Timothy Payne','CM',31,68],['Paulo Retre','CM',32,70],['Alex Rufer','CM',29,73],['Kazuki Nagasawa','CM',34,71],['Fin Conchie','CM',22,69],['Hideki Ishige','RW',32,70],['David Ball','RW',36,72],['Kosta Barbarouses','RW',36,73],['Marco Rojas','LW',34,72],['Oskar van Hattum','ST',23,68],['Stefan Colakovski','ST',26,71],['Mohamed Al-Taay','CM',23,66],['Luke Supyk','ST',20,65],['Dublin Boon','RW',20,64]
    ],
    'Auckland FC':[
      ['Michael Woud','GK',27,71],['Oliver Sail','GK',30,71],['Hiroki Sakai','RB',36,76],['Nando Pijnaker','CB',26,72],['Jake Girdwood-Reich','CB',22,70],['Daniel Hall','CB',28,69],['Francis De Vries','LB',30,69],['Callan Elliot','RB',27,68],['Louis Verstraete','CM',27,70],['Cameron Howieson','CM',31,68],['Jake Brimmer','CM',28,75],['Lachlan Brook','RW',25,70],['William Gillion','CAM',20,69],['Logan Rogerson','LW',27,68],['Jesse Randall','ST',20,67],['Guillermo May','ST',28,73],['Sam Cosgrove','ST',30,71],['Jonty Bidois','ST',21,65]
    ],
    'Western United':[
      ['Thomas Heward-Belle','GK',27,70],['Matthew Sutton','GK',24,65],['Tomoki Imai','CB',36,73],['James Donachie','CB',32,70],['Kane Vidmar','CB',21,69],['Benjamin Garuccio','LB',30,70],['Tate Russell','RB',26,68],['Sebastian Pasquali','CM',24,70],['Riku Danzaki','CAM',30,70],['Angus Thurgate','CM',25,74],['Ramy Najjarine','LW',25,70],['Noah Botic','ST',25,70],['Hiroshi Ibusuki','ST',35,71],['Michael Ruhs','ST',25,69],['Rhys Bozinovski','RW',21,67],['Jake Najdovski','ST',20,67],['Matthew Grimaldi','RW',20,68],['James York','LW',19,64]
    ]
  };

  const clubs=Object.keys(R);
  let changed=0;
  const ownedNames=new Set();
  allTeams().forEach(c=>(S.players[c]||[]).forEach(p=>ownedNames.add(p.name)));

  clubs.forEach(club=>{
    if(!S.players[club]) S.players[club]=[];
    const squad=S.players[club];
    const existing=new Set(squad.map(p=>p.name));
    R[club].forEach(([name,pos,age,ov])=>{
      if(existing.has(name)) return;
      // A real player must not be duplicated between clubs in the same save.
      if(ownedNames.has(name)) return;
      const p={id:'b22_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),name,pos,age,ov,club,
        value:+Math.max(.2,(ov-45)**2*.0025).toFixed(1),wage:Math.round(800+ov*70),contract:2,potential:Math.min(94,ov+4),rarity:(typeof rarityForOVR==='function'?rarityForOVR(ov):'Common')};
      squad.push(p);existing.add(name);ownedNames.add(name);changed++;
    });
  });

  // Rebuild invalid/empty XIs using the existing Batch 1 Best XI system.
  clubs.forEach(club=>{
    if(!S.lineups) S.lineups={};
    const ids=S.lineups[club]||[];
    if(ids.length!==11 || !ids.every(Boolean)){
      const old=S.selected;S.selected=club;
      if(typeof best11==='function') S.lineups[club]=best11();
      S.selected=old;
    }
  });

  if(changed){
    S.logs=S.logs||[];
    S.logs.unshift('BATCH 2.2: Real A-League players added to club squads.');
    save();
  }

  const sub=document.querySelector('header .sub');
  if(sub) sub.textContent='V6 • Batch 2.2 — Real A-League Squads';
})();
