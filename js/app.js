/* Quest map, stop cards, header HUD and the grown-ups drawer. */

(function () {
  const mapEl = document.getElementById("map");
  const cardEl = document.getElementById("stop-card");
  const badgeRow = document.getElementById("badge-row");
  const starTotal = document.getElementById("star-total");
  const hudCount = document.getElementById("hud-count");
  const hudFill = document.getElementById("hud-fill");
  const grownBody = document.getElementById("grown-body");

  const GAME_LABEL = {
    squareRace: "▶ Play Square Race",
    coinHop: "▶ Play Coin Hop",
    pawnWars: "▶ Play Pawn Wars",
    mateInOne: "▶ Play Mate in 1",
    hangingHunt: "▶ Play Piece Detective",
    tacticTrainer: "▶ Play Trick Shots",
    rookMaze: "▶ Play Rook Maze"
  };

  const titleEl = document.getElementById("quest-title");
  const muteBtn = document.getElementById("mute-btn");
  const voiceBtn = document.getElementById("voice-btn");
  const nameBtn = document.getElementById("name-btn");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("name-input");

  let selectedWeek = Store.currentWeek(WEEKS.length);

  function weekData(n) { return WEEKS[n - 1]; }
  function landOf(week) { return LANDS[week.land - 1]; }
  /* lessons run every other day: lesson 1 = Day 1, lesson 2 = Day 3, … */
  function dayOf(n) { return 2 * n - 1; }

  /* ---------- header ---------- */
  function renderHeader() {
    const name = Store.getName();
    titleEl.innerHTML = (name ? escapeHtml(name) + "’s " : "") + 'Chess Quest <span class="knight">♞</span>';
    nameBtn.textContent = name ? "✏️" : "✏️ Put her name on it";
    nameBtn.setAttribute("aria-label", name ? "Change the name" : "Put her name on it");
    muteBtn.textContent = Store.getMuted() ? "🔇" : "🔊";
    voiceBtn.classList.toggle("off", !Store.getVoiceOn());
    voiceBtn.setAttribute("aria-pressed", Store.getVoiceOn() ? "true" : "false");
    starTotal.textContent = "⭐ " + Store.totalStars();
    const done = Store.weeksDone();
    hudCount.textContent = done + " / " + WEEKS.length + " days";
    hudFill.style.width = (done / WEEKS.length * 100) + "%";

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

    LANDS.forEach(land => {
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

    cardEl.innerHTML =
      '<span class="card-eyebrow">' + land.glyph + " " + land.name + " · Day " + dayOf(wk.n) + "</span>" +
      "<h2>" + wk.title + "</h2>" +
      '<div class="lesson">' +
      '  <div class="lesson-row"><b>Learn</b><span>' + wk.learn + "</span></div>" +
      '  <div class="lesson-row"><b>Play</b><span>' + wk.play + "</span></div>" +
      '  <div class="lesson-row spark"><b>Spark</b><span>' + wk.spark + "</span></div>" +
      "</div>" +
      (wk.diagram ? '<div class="diagram"><div id="diagram-board"></div><p class="diagram-cap">' + wk.diagram.caption + "</p></div>" : "") +
      '<div class="card-actions">' +
      (wk.game ? '<button type="button" class="btn btn-primary" id="play-btn">' + GAME_LABEL[wk.game] + "</button>" : "") +
      '<button type="button" class="btn ' + (isDone ? "btn-quiet" : "btn-gold") + '" id="done-btn">' +
      (isDone ? "✓ Done — undo?" : "Mark day done ⭐") + "</button>" +
      "</div>" +
      (isLast ? '<p class="land-check"><b>' + land.glyph + " Level-up check:</b> " + land.check + "</p>" : "");

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

  /* ---------- grown-ups drawer ---------- */
  function renderGrownUps() {
    const g = GROWN_UPS;
    grownBody.innerHTML =
      "<h3>Every session, same recipe</h3>" +
      '<div class="recipe">' + g.recipe.map(r =>
        '<div class="step"><b>' + r[0] + "</b>" + r[1] + "</div>").join("") + "</div>" +
      "<h3>Rules for the grown-up</h3>" +
      "<ul>" + g.rules.map(r => "<li>" + r + "</li>").join("") + "</ul>" +
      "<h3>Toolbox</h3>" +
      '<ul class="toolbox">' + g.toolbox.map(t =>
        "<li><b>" + t[0] + "</b> — " + t[1] + "</li>").join("") + "</ul>" +
      "<h3>If she gets stuck or bored</h3>" +
      "<ul>" + g.stuck.map(t => "<li><b>" + t[0] + "</b> " + t[1] + "</li>").join("") + "</ul>";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- name + sound controls ---------- */
  nameBtn.addEventListener("click", () => {
    nameForm.hidden = false;
    nameBtn.hidden = true;
    nameInput.value = Store.getName();
    nameInput.focus();
  });
  nameForm.addEventListener("submit", e => {
    e.preventDefault();
    Store.setName(nameInput.value);
    nameForm.hidden = true;
    nameBtn.hidden = false;
    if (Store.getName()) { FX.burst(titleEl); SFX.chime(); }
  });

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
  });

  renderHeader();
  renderMap();
  renderCard();
  renderGrownUps();
})();
