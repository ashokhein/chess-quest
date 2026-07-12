/* Quest map, stop cards, header HUD, player profiles and the grown-ups drawer.
   All copy flows through the active profile's register (story / classic). */

(function () {
  const mapEl = document.getElementById("map");
  const cardEl = document.getElementById("stop-card");
  const badgeRow = document.getElementById("badge-row");
  const starTotal = document.getElementById("star-total");
  const hudCount = document.getElementById("hud-count");
  const hudFill = document.getElementById("hud-fill");
  const grownBody = document.getElementById("grown-body");
  const grownSummary = document.getElementById("grown-summary");
  const tagline = document.getElementById("tagline");
  const footline = document.getElementById("footline");

  const GAME_LABEL = {
    squareRace: "▶ Play Square Race",
    coinHop: "▶ Play Coin Hop",
    pawnWars: "▶ Play Pawn Wars",
    mateInOne: "▶ Play Mate in 1",
    mateInTwo: "▶ Play Mate in 2",
    hangingHunt: "▶ Play Piece Detective",
    tacticTrainer: "▶ Play Trick Shots",
    rookMaze: "▶ Play Rook Maze"
  };

  const titleEl = document.getElementById("quest-title");
  const muteBtn = document.getElementById("mute-btn");
  const voiceBtn = document.getElementById("voice-btn");
  const profileBtn = document.getElementById("profile-btn");
  const progressBtn = document.getElementById("progress-btn");

  let selectedWeek = Store.currentWeek(WEEKS.length);

  function weekData(n) { return WEEKS[n - 1]; }
  function landOf(week) { return LANDS[week.land - 1]; }
  /* lessons run every other day: lesson 1 = Day 1, lesson 2 = Day 3, … */
  function dayOf(n) { return 2 * n - 1; }
  /* the active register's copy for a lesson */
  function lessonCopy(wk) {
    return (!Copy.isStory() && wk.classic) ? wk.classic : wk;
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const name = Store.getName();
    titleEl.innerHTML = (name ? escapeHtml(name) + "’s " : "") + 'Chess Quest <span class="knight">♞</span>';
    profileBtn.innerHTML = "👥 " + (name ? escapeHtml(name) : "Players") +
      ' <span class="mode-tag">' + (Copy.isStory() ? "Story" : "Classic") + "</span>";
    profileBtn.setAttribute("aria-label", "Switch or manage players");
    muteBtn.textContent = Store.getMuted() ? "🔇" : "🔊";
    voiceBtn.classList.toggle("off", !Store.getVoiceOn());
    voiceBtn.setAttribute("aria-pressed", Store.getVoiceOn() ? "true" : "false");
    starTotal.textContent = "⭐ " + Store.totalStars();
    const done = Store.weeksDone();
    hudCount.textContent = done + " / " + WEEKS.length + " days";
    hudFill.style.width = (done / WEEKS.length * 100) + "%";

    tagline.textContent = Copy.t(
      "One small lesson every other day — Day 1, Day 3, Day 5… — from first square to first tournament, with real games to play right here.",
      "One focused lesson every other day — Day 1, Day 3, Day 5… — from the empty board to confident club play, with drills to play right here.");
    footline.textContent = Copy.t(
      "Tick a day when she’s comfortable, not when the calendar says so. Repeating a lesson is normal and good — rest days are part of the plan.",
      "Mark a day done when the idea feels solid, not when the calendar says so. Repeating a lesson is normal — rest days are part of the plan.");

    badgeRow.innerHTML = "";
    for (const land of LANDS) {
      const b = document.createElement("span");
      const won = Store.landDone(land);
      b.className = "badge" + (won ? " badge-won" : "");
      b.title = land.name + (won ? " — complete!" : "");
      b.textContent = land.glyph;
      badgeRow.appendChild(b);
    }
  }

  /* ---------- map ---------- */
  function renderMap() {
    const current = Store.currentWeek(WEEKS.length);
    mapEl.innerHTML = "";
    let lastTrack = 0;

    LANDS.forEach(land => {
      const track = land.track || 1;
      if (track !== lastTrack) {
        lastTrack = track;
        const head = document.createElement("div");
        head.className = "track-head";
        head.innerHTML = track === 1
          ? '<span class="track-eyebrow">Track 1</span><span class="track-name">First Steps</span>'
          : '<span class="track-eyebrow">Track 2</span><span class="track-name">Rising Player</span>';
        mapEl.appendChild(head);
      }

      const sec = document.createElement("section");
      sec.className = "land";

      const head = document.createElement("div");
      head.className = "land-head";
      const won = Store.landDone(land);
      head.innerHTML =
        '<span class="land-glyph">' + land.glyph + "</span>" +
        '<span class="land-meta"><span class="land-eyebrow">Days ' + dayOf(land.weeks[0]) + "–" + dayOf(land.weeks[1]) + "</span>" +
        '<span class="land-name">' + land.name + "</span></span>" +
        '<span class="medal' + (won ? " medal-won" : "") + '" title="' +
        (won ? "Badge earned!" : "Finish every day here to earn the badge") + '">' + land.glyph + "</span>";
      sec.appendChild(head);

      const stops = document.createElement("div");
      stops.className = "stops";
      for (let n = land.weeks[0]; n <= land.weeks[1]; n++) {
        const stop = document.createElement("button");
        stop.type = "button";
        const isDone = Store.isWeekDone(n);
        const isCur = n === current && !isDone;
        stop.className = "stop" + (isDone ? " stop-done" : "") + (isCur ? " stop-cur" : "") +
          (n === selectedWeek ? " stop-sel" : "");
        stop.innerHTML = isDone ? "✓" : isCur ? '<span class="pony">♞</span>' : String(dayOf(n));
        stop.setAttribute("aria-label", "Day " + dayOf(n) + ": " + weekData(n).title);
        stop.addEventListener("click", () => selectWeek(n, true));
        stops.appendChild(stop);
      }
      sec.appendChild(stops);
      mapEl.appendChild(sec);
    });
  }

  /* ---------- stop card ---------- */
  function renderCard() {
    const wk = weekData(selectedWeek);
    const land = landOf(wk);
    const isDone = Store.isWeekDone(wk.n);
    const isLast = wk.n === land.weeks[1];
    const c = lessonCopy(wk);
    const landCheck = (!Copy.isStory() && land.checkClassic) ? land.checkClassic : land.check;

    cardEl.innerHTML =
      '<span class="card-eyebrow">' + land.glyph + " " + land.name + " · Day " + dayOf(wk.n) + "</span>" +
      "<h2>" + wk.title + "</h2>" +
      '<div class="lesson">' +
      '  <div class="lesson-row"><b>Learn</b><span>' + c.learn + "</span></div>" +
      '  <div class="lesson-row"><b>Play</b><span>' + c.play + "</span></div>" +
      '  <div class="lesson-row spark"><b>' + Copy.t("Spark", "Tip") + "</b><span>" + c.spark + "</span></div>" +
      "</div>" +
      (wk.diagram ? '<div class="diagram"><div id="diagram-board"></div><p class="diagram-cap">' + wk.diagram.caption + "</p></div>" : "") +
      '<div class="card-actions">' +
      (wk.game ? '<button type="button" class="btn btn-primary" id="play-btn">' + GAME_LABEL[wk.game] + "</button>" : "") +
      '<button type="button" class="btn ' + (isDone ? "btn-quiet" : "btn-gold") + '" id="done-btn">' +
      (isDone ? "✓ Done — undo?" : "Mark day done ⭐") + "</button>" +
      "</div>" +
      (isLast ? '<p class="land-check"><b>' + land.glyph + " Level-up check:</b> " + landCheck + "</p>" : "");

    if (wk.diagram) {
      const db = Board.create(document.getElementById("diagram-board"), { small: true });
      const pos = Engine.parseFEN(wk.diagram.fen).board;
      db.setPosition(pos);
      if (wk.diagram.from) {
        const from = Engine.sqIdx(wk.diagram.from);
        db.highlight([from], "hl-sel");
        db.highlight(Engine.pieceTargets(pos, from), "hl-move");
      }
    }

    if (wk.game) {
      document.getElementById("play-btn").addEventListener("click", () => {
        Games.open(wk.game, wk.gameOpts || {});
      });
    }
    document.getElementById("done-btn").addEventListener("click", e => {
      const was = Store.isWeekDone(wk.n);
      Store.setWeekDone(wk.n, !was);
      if (!was) {
        FX.burst(e.target);
        SFX.chime();
        if (Store.landDone(land)) setTimeout(() => { FX.burst(badgeRow, 130); SFX.fanfare(); }, 500);
      }
    });
  }

  function selectWeek(n, scroll) {
    selectedWeek = n;
    renderMap();
    renderCard();
    if (scroll && window.matchMedia("(max-width: 899px)").matches) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* ---------- grown-ups / training-partner drawer ---------- */
  function renderGrownUps() {
    const g = Copy.isStory() ? GROWN_UPS : GROWN_UPS_CLASSIC;
    grownSummary.textContent = Copy.t(
      "For grown-ups — how to run the quest",
      "Training guide — how to run the quest");
    grownBody.innerHTML =
      "<h3>Every session, same recipe</h3>" +
      '<div class="recipe">' + g.recipe.map(r =>
        '<div class="step"><b>' + r[0] + "</b>" + r[1] + "</div>").join("") + "</div>" +
      "<h3>" + Copy.t("Rules for the grown-up", "Rules of the road") + "</h3>" +
      "<ul>" + g.rules.map(r => "<li>" + r + "</li>").join("") + "</ul>" +
      "<h3>Toolbox</h3>" +
      '<ul class="toolbox">' + g.toolbox.map(t =>
        "<li><b>" + t[0] + "</b> — " + t[1] + "</li>").join("") + "</ul>" +
      "<h3>" + Copy.t("If she gets stuck or bored", "If you get stuck or bored") + "</h3>" +
      "<ul>" + g.stuck.map(t => "<li><b>" + t[0] + "</b> " + t[1] + "</li>").join("") + "</ul>";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- player profiles panel ---------- */
  let profileOverlay = null, ppBody = null, deleteArmed = false;

  function ensureProfileOverlay() {
    if (profileOverlay) return;
    profileOverlay = document.createElement("div");
    profileOverlay.className = "game-overlay";
    profileOverlay.hidden = true;
    profileOverlay.innerHTML =
      '<div class="game-panel profile-panel" role="dialog" aria-modal="true" aria-labelledby="pp-title">' +
      '<header class="game-head"><h2 id="pp-title">Players</h2>' +
      '<button type="button" id="pp-close" class="game-close" aria-label="Close players">✕</button></header>' +
      '<div id="pp-body"></div></div>';
    document.body.appendChild(profileOverlay);
    ppBody = profileOverlay.querySelector("#pp-body");
    profileOverlay.querySelector("#pp-close").addEventListener("click", closeProfiles);
    profileOverlay.addEventListener("click", e => { if (e.target === profileOverlay) closeProfiles(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !profileOverlay.hidden) closeProfiles();
    });
  }

  function closeProfiles() {
    profileOverlay.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openProfiles() {
    ensureProfileOverlay();
    deleteArmed = false;
    renderProfilePanel();
    profileOverlay.hidden = false;
    document.body.classList.add("modal-open");
    profileOverlay.querySelector("#pp-close").focus();
  }

  function renderProfilePanel() {
    const act = Store.activeId();
    const many = Store.profiles().length > 1;
    const rows = Store.profiles().map(p =>
      '<button type="button" class="profile-row' + (p.id === act ? " row-on" : "") + '" data-switch="' + p.id + '">' +
      '<span class="p-face" aria-hidden="true">' + (p.mode === "classic" ? "♟" : "🦄") + "</span>" +
      '<span class="p-name">' + (p.name ? escapeHtml(p.name) : "New player") + "</span>" +
      '<span class="mode-tag">' + (p.mode === "classic" ? "Classic" : "Story") + "</span>" +
      (p.id === act ? '<span class="p-check" aria-label="active">✓</span>' : "") +
      "</button>").join("");

    ppBody.innerHTML =
      '<p class="pp-hint">Each player keeps their own progress, stars and streak. Tap to switch.</p>' +
      '<div class="profile-list">' + rows + "</div>" +
      "<h3>Active player</h3>" +
      '<form id="pp-rename" class="pp-row">' +
      '<input id="pp-name" maxlength="16" placeholder="Name" value="' + escapeHtml(Store.getName()) + '" aria-label="Player name">' +
      '<button class="btn btn-primary" type="submit">Save name</button></form>' +
      '<div class="pp-row chip-row chips-left">' +
      '<button type="button" class="chip' + (Copy.isStory() ? " chip-on" : "") + '" data-mode="story">🦄 Story — playful, for kids</button>' +
      '<button type="button" class="chip' + (!Copy.isStory() ? " chip-on" : "") + '" data-mode="classic">♟ Classic — plain coaching</button></div>' +
      (many
        ? '<div class="pp-row"><button type="button" id="pp-delete" class="btn ' + (deleteArmed ? "btn-danger" : "btn-quiet") + '">' +
          (deleteArmed ? "Really delete this player? Tap again" : "Delete this player…") + "</button></div>"
        : "") +
      "<h3>Add a player</h3>" +
      '<form id="pp-add" class="pp-row">' +
      '<input id="pp-add-name" maxlength="16" placeholder="Name" aria-label="New player name">' +
      '<select id="pp-add-mode" aria-label="Copy style">' +
      '<option value="story">Story (kid)</option><option value="classic">Classic (adult)</option></select>' +
      '<button class="btn btn-gold" type="submit">Add player</button></form>';

    ppBody.querySelectorAll("[data-switch]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.switch !== Store.activeId()) {
          Store.switchProfile(btn.dataset.switch);
          SFX.tap();
        }
        deleteArmed = false;
        renderProfilePanel();
      });
    });
    ppBody.querySelector("#pp-rename").addEventListener("submit", e => {
      e.preventDefault();
      Store.setName(ppBody.querySelector("#pp-name").value);
      if (Store.getName()) { FX.burst(titleEl); SFX.chime(); }
      renderProfilePanel();
    });
    ppBody.querySelectorAll("[data-mode]").forEach(chip => {
      chip.addEventListener("click", () => {
        Store.setMode(chip.dataset.mode);
        SFX.tap();
        renderProfilePanel();
      });
    });
    const del = ppBody.querySelector("#pp-delete");
    if (del) del.addEventListener("click", () => {
      if (!deleteArmed) { deleteArmed = true; renderProfilePanel(); return; }
      Store.removeProfile(Store.activeId());
      deleteArmed = false;
      renderProfilePanel();
    });
    ppBody.querySelector("#pp-add").addEventListener("submit", e => {
      e.preventDefault();
      const name = ppBody.querySelector("#pp-add-name").value;
      Store.addProfile(name, ppBody.querySelector("#pp-add-mode").value);
      SFX.chime();
      deleteArmed = false;
      renderProfilePanel();
    });
  }

  profileBtn.addEventListener("click", openProfiles);

  /* ---------- progress panel ---------- */
  let progressOverlay = null, prBody = null;

  function ensureProgressOverlay() {
    if (progressOverlay) return;
    progressOverlay = document.createElement("div");
    progressOverlay.className = "game-overlay";
    progressOverlay.hidden = true;
    progressOverlay.innerHTML =
      '<div class="game-panel progress-panel" role="dialog" aria-modal="true" aria-labelledby="pr-title">' +
      '<header class="game-head"><h2 id="pr-title">Progress</h2>' +
      '<button type="button" id="pr-close" class="game-close" aria-label="Close progress">✕</button></header>' +
      '<div id="pr-body"></div></div>';
    document.body.appendChild(progressOverlay);
    prBody = progressOverlay.querySelector("#pr-body");
    progressOverlay.querySelector("#pr-close").addEventListener("click", closeProgress);
    progressOverlay.addEventListener("click", e => { if (e.target === progressOverlay) closeProgress(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !progressOverlay.hidden) closeProgress();
    });
  }

  function closeProgress() {
    progressOverlay.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openProgress() {
    ensureProgressOverlay();
    renderProgressPanel();
    progressOverlay.hidden = false;
    document.body.classList.add("modal-open");
    progressOverlay.querySelector("#pr-close").focus();
  }

  function trackBar(label, done, total) {
    const pct = Math.round(done / total * 100);
    return '<div class="prog-track"><div class="hud-row"><span class="hud-label">' + label +
      '</span><span class="hud-count">' + done + " / " + total + "</span></div>" +
      '<div class="hud-bar"><div style="width:' + pct + '%"></div></div></div>';
  }

  function starsGlyph(n) {
    return '<span class="star-cells" aria-label="' + n + ' of 3 stars">' +
      "★".repeat(n) + '<span class="star-off">' + "☆".repeat(3 - n) + "</span></span>";
  }

  function last14Days() {
    const out = [];
    const played = new Set(Store.activityDates());
    const d = new Date();
    d.setDate(d.getDate() - 13);
    for (let i = 0; i < 14; i++) {
      const iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
      out.push({ iso, wd: "SMTWTFS"[d.getDay()], on: played.has(iso) });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function renderProgressPanel() {
    const name = Store.getName() || Copy.t("This player", "This player");
    const t1 = ["fork", "pin", "skewer", "disco"].reduce((s, p) => s + Store.tacticCount(p), 0);
    const t2 = ["fork2", "pin2", "skewer2", "disco2"].reduce((s, p) => s + Store.tacticCount(p), 0);
    const puzzlesTotal = Store.solvedCount() + Store.solved2Count() + Store.huntCount() + t1 + t2;
    const streak = Store.streak();
    const days = last14Days();

    const GAME_ROWS = [
      ["Square Race", "squareRace", Store.getBest("squareRace") ? "best: " + Store.getBest("squareRace") + " squares" : ""],
      ["Coin Hop", "coinHop", ""],
      ["Rook Maze", "rookMaze", ""],
      ["Pawn Wars", "pawnWars", ""],
      ["Mate in 1", "mateInOne", Store.solvedCount() + " / " + PUZZLES.length + " puzzles"],
      ["Mate in 2", "mateInTwo", Store.solved2Count() + " / " + MATE2.length + " puzzles"],
      ["Piece Detective", "hangingHunt", Store.huntCount() + " / " + HUNTS.length + " cases"],
      ["Trick Shots", "tacticTrainer", t1 + " / 13 tricks"],
      ["Trick Shots — Master", "tacticTrainer2", t2 + " / 12 tricks"]
    ];

    prBody.innerHTML =
      '<p class="pp-hint">' + escapeHtml(name) + " · " + (Copy.isStory() ? "Story" : "Classic") + " mode</p>" +

      '<div class="stat-grid">' +
      '<div class="stat-tile"><span class="stat-num">' + streak + '</span><span class="stat-label">' +
        Copy.t("day streak 🔥", "day streak") + "</span></div>" +
      '<div class="stat-tile"><span class="stat-num">⭐ ' + Store.totalStars() + '</span><span class="stat-label">total stars</span></div>' +
      '<div class="stat-tile"><span class="stat-num">' + puzzlesTotal + '</span><span class="stat-label">puzzles solved</span></div>' +
      '<div class="stat-tile"><span class="stat-num">' + Store.activityDates().length + '</span><span class="stat-label">days played</span></div>' +
      "</div>" +

      "<h3>Quest tracks</h3>" +
      trackBar("Track 1 · First Steps", Store.trackDone(1), 24) +
      trackBar("Track 2 · Rising Player", Store.trackDone(2), 24) +

      "<h3>Last 14 days</h3>" +
      '<div class="day-strip" role="img" aria-label="Played on ' +
        days.filter(d => d.on).length + " of the last 14 days" + '">' +
      days.map(d =>
        '<span class="day-cell' + (d.on ? " day-on" : "") + '" title="' + d.iso + (d.on ? " — played" : "") + '">' +
        '<span class="day-dot"></span><span class="day-wd">' + d.wd + "</span></span>").join("") +
      "</div>" +

      "<h3>Games</h3>" +
      '<table class="prog-table"><tbody>' +
      GAME_ROWS.map(r =>
        "<tr><td>" + r[0] + "</td><td>" + starsGlyph(Store.gameStars(r[1])) + "</td>" +
        '<td class="prog-detail">' + r[2] + "</td></tr>").join("") +
      "</tbody></table>" +

      '<div class="pp-row" id="pr-actions"></div>';

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "btn btn-gold";
    printBtn.textContent = "🖨 Print certificate";
    printBtn.addEventListener("click", printCertificate);
    prBody.querySelector("#pr-actions").appendChild(printBtn);
  }

  progressBtn.addEventListener("click", openProgress);

  /* ---------- printable certificate ---------- */
  function printCertificate() {
    const cert = document.getElementById("certificate");
    const name = Store.getName() || Copy.t("A brave player", "This player");
    const t1 = Store.trackDone(1), t2 = Store.trackDone(2);
    const total = t1 + t2;
    let title, line;
    if (t1 === 24 && t2 === 24) {
      title = "Chess Quest Champion";
      line = "has completed the entire Chess Quest — all 48 lessons, from the first square to Rising Player strength";
    } else if (t1 === 24) {
      title = "First Steps Champion";
      line = "has completed Track 1 “First Steps” — 24 lessons, from the empty board to full, careful games";
    } else if (t2 === 24) {
      title = "Rising Player Champion";
      line = "has completed Track 2 “Rising Player” — 24 lessons of combinations, openings, endgames and strategy";
    } else {
      title = "Chess Quest Adventurer";
      line = "has bravely conquered " + total + " of 48 quest days — and the journey continues";
    }
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    cert.innerHTML =
      '<div class="cert-frame">' +
      '<div class="cert-crest">♞</div>' +
      '<div class="cert-brand">Chess Quest</div>' +
      '<h1 class="cert-title">' + title + "</h1>" +
      '<p class="cert-lede">This certificate proudly declares that</p>' +
      '<div class="cert-name">' + escapeHtml(name) + "</div>" +
      '<p class="cert-line">' + line + ".</p>" +
      '<div class="cert-stats">⭐ ' + Store.totalStars() + " stars &nbsp;·&nbsp; 🗓 " +
        Store.activityDates().length + " days of play &nbsp;·&nbsp; 🏰 " +
        LANDS.filter(l => Store.landDone(l)).length + " of " + LANDS.length + " lands</div>" +
      '<div class="cert-foot">' +
      '<span class="cert-sig"><span class="cert-sigline">' + date + "</span>Date</span>" +
      '<span class="cert-sig"><span class="cert-sigline">Coach Pony ♞</span>Quest Coach</span>' +
      "</div></div>";
    window.print();
  }

  /* ---------- sound controls ---------- */
  SFX.setMuted(Store.getMuted());
  muteBtn.addEventListener("click", () => {
    Store.setMuted(!Store.getMuted());
    SFX.setMuted(Store.getMuted());
    if (!Store.getMuted()) SFX.tap();
  });

  Voice.setEnabled(Store.getVoiceOn());
  voiceBtn.addEventListener("click", () => {
    Store.setVoiceOn(!Store.getVoiceOn());
    Voice.setEnabled(Store.getVoiceOn());
    if (Store.getVoiceOn()) Voice.say("Coach voice is on!");
  });

  document.addEventListener("cq-progress", () => {
    renderHeader();
    renderMap();
    renderCard();
    renderGrownUps();
  });

  renderHeader();
  renderMap();
  renderCard();
  renderGrownUps();

  /* PWA: register only when served over http(s) from the real app page
     (file:// can't register; the single-file artifact build has no manifest). */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) &&
      document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
