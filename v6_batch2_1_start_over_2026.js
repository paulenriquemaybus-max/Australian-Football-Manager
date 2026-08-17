
/* V6 2.1 — Start career over from 2026/27 */
(function(){
  "use strict";

  window.startOver2026V621=function(){
    if(!confirm("Start the career over from 2026/27? This will remove ALL current seasons, transfers, results, players, finances and history and create a completely new career from 2026/27.")) return;
    // init() is the game's real original career generator and starts at 2026/27.
    S=init();
    S.season=2026;
    S.round=1;
    S.finished=false;
    S.history=[];
    S.seasonSnapshots={};
    S.listedPlayers=[];
    S.incomingBids=[];
    S.offers=[];
    S.logs=[];
    // Save a real start-of-career snapshot immediately, so 2026/27 can be
    // restarted later without relying on the old history list.
    if(typeof makeSeasonSnapshot==="function") makeSeasonSnapshot();
    if(typeof save==="function") save();
    alert("Career restarted at 2026/27. The old season history has been removed.");
    if(typeof page==="function") page("home");
    else location.reload();
  };

  function addStartOverButton(){
    const app=document.getElementById("app");
    if(!app || document.getElementById("v621-start-over-2026")) return;
    const h=[...app.querySelectorAll("h2,h3")].find(x=>(x.textContent||"").includes("Season History"));
    if(!h) return;
    const box=document.createElement("section");
    box.className="card";
    box.innerHTML='<h3>🆕 Start Career Over</h3>'+
      '<p class="muted">This removes the existing 2026/27–2037/38 history and starts a brand-new career from 2026/27.</p>'+
      '<button id="v621-start-over-2026" class="danger" onclick="startOver2026V621()">🔄 Reset Career to 2026/27</button>';
    app.appendChild(box);
  }

  new MutationObserver(addStartOverButton).observe(document.body,{childList:true,subtree:true});
  addStartOverButton();
})();
