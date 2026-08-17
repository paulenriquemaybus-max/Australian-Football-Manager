
/* ==========================================================
   AUSTRALIAN FOOTBALL MANAGER V6 — BATCH 1
   1. Automatic starting XI
   2. Exactly one goalkeeper
   3. Manual lineup editing with validation
   4. Best XI
   5. Player quality affects match results
   ========================================================== */
(function () {
  "use strict";

  const POSITIONS = ["GK","LB","CB","CB","RB","CM","CM","CAM","LW","ST","RW"];

  function playerById(club, id) {
    return (S.players[club] || []).find(p => p.id === id);
  }

  function uniquePlayers(arr) {
    const seen = new Set();
    return arr.filter(p => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  // Pick a strong, position-balanced XI. It always contains exactly one GK.
  window.best11 = function () {
    const players = [...(S.players[S.selected] || [])].sort((a,b) => b.ov - a.ov);
    const used = new Set();
    const out = [];

    function choose(position, allowFallback = true) {
      let candidates = players.filter(p => !used.has(p.id) && p.pos === position);
      if (!candidates.length && allowFallback && position !== "GK") {
        candidates = players.filter(p =>
          !used.has(p.id) &&
          p.pos !== "GK" &&
          ["CB","LB","RB","CM","CAM","LW","RW","ST"].includes(p.pos)
        );
      }
      candidates.sort((a,b) => b.ov - a.ov);
      const p = candidates[0];
      if (p) {
        used.add(p.id);
        out.push(p.id);
      }
    }

    // GK is mandatory and selected first.
    choose("GK", false);

    // Fill the remaining 10 positions.
    POSITIONS.slice(1).forEach(pos => choose(pos, true));

    // If a club has unusual position data, fill remaining spots with
    // the highest-rated non-GKs. Never add a second GK.
    players
      .filter(p => !used.has(p.id) && p.pos !== "GK")
      .forEach(p => {
        if (out.length < 11) {
          used.add(p.id);
          out.push(p.id);
        }
      });

    return out.slice(0, 11);
  };

  function validXI(ids, club) {
    const clean = uniquePlayers((ids || []).map(id => playerById(club, id)).filter(Boolean));
    if (clean.length !== 11) return { ok:false, reason:"Your starting XI must contain exactly 11 players." };
    if (clean.filter(p => p.pos === "GK").length !== 1) {
      return { ok:false, reason:"Your starting XI must contain exactly 1 goalkeeper." };
    }
    return { ok:true, players:clean };
  }

  // Manual lineup editing: prevents duplicates and a second goalkeeper.
  window.setSlot = function (i, id) {
    const club = S.selected;
    let arr = [...(S.lineups[club] || [])];
    while (arr.length < 11) arr.push("");

    if (!id) {
      arr[i] = "";
      S.lineups[club] = arr;
      save();
      lineup();
      return;
    }

    const p = playerById(club, id);
    if (!p) return;

    if (p.pos === "GK") {
      const existingGK = arr.findIndex(x => {
        const q = playerById(club, x);
        return q && q.pos === "GK";
      });
      if (existingGK !== -1 && existingGK !== i) {
        alert("Only 1 goalkeeper is allowed in the starting XI.");
        return;
      }
    }

    if (arr.some((x,j) => x === id && j !== i)) {
      alert("That player is already in your starting XI.");
      return;
    }

    arr[i] = id;
    S.lineups[club] = arr;
    save();
    lineup();
  };

  window.autoLineup = function () {
    const ids = window.best11();
    S.lineups[S.selected] = ids;
    save();
    lineup();
  };

  window.saveLineup = function () {
    const result = validXI(S.lineups[S.selected], S.selected);
    if (!result.ok) {
      alert(result.reason);
      return;
    }
    S.logs.unshift("LINEUP SAVED: " + S.selected + " — " +
      result.players.map(p => p.name).join(", "));
    save();
    alert("Starting XI saved!");
    lineup();
  };

  // Make the lineup page show the actual team strength and clear validation.
  window.lineup = function () {
    const club = S.selected;
    const ps = S.players[club] || [];
    let ids = S.lineups[club] || [];

    const check = validXI(ids, club);
    const strengthValue = teamStrength(club);

    document.getElementById("app").innerHTML =
      '<section class="card">' +
      '<h2>🧠 Lineup Builder — ' + esc(club) + '</h2>' +
      '<p class="muted">Your starting XI is automatically selected. You can edit it, or use Best XI.</p>' +
      '<div class="grid">' +
        '<div class="card"><div class="muted">Team Strength</div><div class="stat">' + strengthValue + '</div></div>' +
        '<div class="card"><div class="muted">XI Status</div><div class="stat" style="font-size:18px">' +
          (check.ok ? '✅ Valid XI' : '⚠️ ' + esc(check.reason)) +
        '</div></div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="primary" onclick="autoLineup()">🤖 Best XI</button>' +
        '<button onclick="clearLineup()">🧹 Clear</button>' +
        '<button onclick="saveLineup()">💾 Save XI</button>' +
      '</div>' +
      '<div class="lineup">' +
        Array.from({length:11}, (_,i) => {
          const p = playerById(club, ids[i]);
          return '<div class="slot"><b>Slot ' + (i+1) + '</b><br>' +
            (p ? esc(p.name) + '<br><span class="small">' + p.pos + ' • ' + p.ov + ' OVR</span>' : 'Empty') +
            '<br><select onchange="setSlot(' + i + ',this.value)">' +
              '<option value="">Choose...</option>' +
              ps.map(x => '<option value="' + x.id + '" ' +
                (p && p.id === x.id ? 'selected' : '') + '>' +
                esc(x.name) + ' — ' + x.pos + ' ' + x.ov +
              '</option>').join('') +
            '</select>' +
          '</div>';
        }).join('') +
      '</div></section>' +
      '<section class="card"><h3>Current XI</h3>' +
        ids.map((id,i) => {
          const p = playerById(club,id);
          return p ? '<div class="fixture"><span>' + (i+1) + '. ' + esc(p.name) +
            '</span><span>' + p.pos + ' • OVR ' + p.ov + '</span></div>' : '';
        }).join('') +
      '</section>';
  };

  window.clearLineup = function () {
    S.lineups[S.selected] = [];
    save();
    lineup();
  };

  // Team strength is now calculated from the actual starting XI.
  // This makes high-rated players materially improve match performance.
  window.teamStrength = function (club) {
    let ids = S.lineups[club] || [];
    let check = validXI(ids, club);

    // Automatically establish an XI if none/invalid exists.
    if (!check.ok) {
      const previous = S.selected;
      S.selected = club;
      const auto = window.best11();
      S.selected = previous;
      S.lineups[club] = auto;
      ids = auto;
      check = validXI(ids, club);
    }

    const xi = check.players || [];
    if (!xi.length) return S.form[club] || 60;

    let total = xi.reduce((sum,p) => sum + Number(p.ov || 60), 0);
    let avg = total / xi.length;

    // Small bonuses for a correctly structured XI.
    const gk = xi.filter(p => p.pos === "GK").length;
    const defenders = xi.filter(p => ["LB","CB","RB"].includes(p.pos)).length;
    const attackers = xi.filter(p => ["LW","RW","ST","CAM"].includes(p.pos)).length;

    let bonus = 0;
    if (gk === 1) bonus += 1;
    if (defenders >= 3) bonus += 1;
    if (attackers >= 3) bonus += 1;

    // Fitness/form already present in V5 can influence the strength slightly.
    const fitness = xi.reduce((sum,p) => sum + Number(p.fitness ?? 100), 0) / xi.length;
    const morale = xi.reduce((sum,p) => sum + Number(p.morale ?? 75), 0) / xi.length;

    return Math.max(45, Math.min(99,
      avg + bonus + (fitness - 75) / 20 + (morale - 75) / 25
    ));
  };

  // Match results now use actual squad quality instead of only club form.
  window.strength = function (club) {
    return teamStrength(club);
  };

  // Re-select automatic starting XIs for every club on first load or when
  // an old save has empty/invalid lineups.
  allTeams().forEach(club => {
    const existing = S.lineups[club] || [];
    const check = validXI(existing, club);

    if (!check.ok) {
      const oldSelected = S.selected;
      S.selected = club;
      S.lineups[club] = window.best11();
      S.selected = oldSelected;
    }
  });

  save();

  // Show the batch version without changing the rest of the V5 UI.
  const sub = document.querySelector("header .sub");
  if (sub) sub.textContent =
    "V6 • Batch 1 — Lineups, Best XI & Team Strength";

  // Re-render the currently selected page so the automatic XI is visible.
  if (typeof page === "function") page("home");
})();
