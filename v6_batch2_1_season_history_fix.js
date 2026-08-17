
/* V6 2.1 — historical season detection */
(function(){
  "use strict";

  function ensureHistorySnapshots(){
    S.v621 = S.v621 || {};
    S.v621.snapshots = S.v621.snapshots || {};

    // Existing completed seasons in the game history are real past seasons.
    // We cannot reconstruct their exact squads/finances unless a snapshot
    // exists, so mark them as historical/known and preserve the current
    // game's data. A restart button is only enabled when a restore snapshot
    // exists.
    const history = Array.isArray(S.history) ? S.history : [];
    history.forEach(h=>{
      const season = Number(h.season);
      if(!Number.isFinite(season)) return;
      const key=String(season);
      if(!S.v621.snapshots[key]){
        S.v621.snapshots[key]={
          season,
          historical:true,
          restorable:false,
          champion:h.champion || null
        };
      }
    });
    if(typeof save==="function") save();
  }

  window.refreshPastSeasonHistoryV621=function(){
    ensureHistorySnapshots();
    if(typeof history==="function") history();
  };

  // Upgrade the History screen so all old seasons are detected and displayed.
  const oldHistory = window.history;
  window.history = function(){
    ensureHistorySnapshots();
    const hs=Array.isArray(S.history)?S.history:[];
    const current=Number(S.season);
    const rows=hs.map(h=>{
      const s=Number(h.season);
      const snap=S.v621.snapshots[String(s)];
      const canRestart=!!(snap && snap.restorable && snap.players);
      return '<div class="fixture"><span><b>'+esc(h.season)+'/'+esc(Number(h.season)+1)+'</b><br>'+
        '<span class="muted">Champion: '+esc(h.champion||"—")+'</span></span>'+
        '<span><button onclick="alert(\\'Historical season: '+esc(h.season)+' — Champion: '+esc(h.champion||"—")+'\\')">View</button> '+
        (canRestart
          ? '<button class="danger" onclick="restartPastSeason('+s+')">Restart This Season</button>'
          : '<button disabled title="This season existed before restore snapshots were enabled.">Past Season Detected</button>')+
        '</span></div>';
    }).join("");

    const detected=hs.length
      ? '<p class="muted">Detected '+hs.length+' completed past season(s), including seasons from your existing career.</p>'
      : '<p class="muted">No completed seasons detected.</p>';

    document.getElementById("app").innerHTML=
      '<section class="card"><h2>🗂 Season History</h2>'+detected+
      (rows||'<p class="muted">No completed seasons yet.</p>')+
      '<div class="actions"><button class="primary" onclick="newSeason()">➡️ Start Next Season</button>'+
      '<button onclick="restartSeason()">🔄 Restart Current Season</button></div>'+
      '<section class="card"><h3>🔄 Past Seasons</h3>'+
      '<p class="muted">Older seasons are automatically detected. New seasons will automatically receive restart snapshots from their start.</p>'+
      '</section></section>';
  };

  ensureHistorySnapshotsV621();
})();
