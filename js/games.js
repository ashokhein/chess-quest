/* Four playable mini-games inside a modal: Square Race, Coin Hop,
   Pawn Wars and the Mate-in-1 pack. Games.open(id, opts) runs one. */

const Games = (function () {
  let overlay, titleEl, scoreEl, statusEl, extraEl, boardWrap, controlsEl, chipsEl;
  let cleanup = null;

  /* The Pony Coach: rule-based questions, answered with chips or board taps.
     No network, no AI — every question is built from engine facts. */
  const coach = {
    tapCheck: null,
    say(html) {
      statusEl.innerHTML = html;
      if (chipsEl) chipsEl.innerHTML = "";
      this.tapCheck = null;
      Voice.say(html);
    },
    ask(html, opts) {
      statusEl.innerHTML = html;
      chipsEl.innerHTML = "";
      this.tapCheck = opts.onTap || null;
      (opts.chips || []).forEach(c => {
        chipsEl.appendChild(button(c.label, "chip", () => { SFX.tap(); c.onPick(); }));
      });
      Voice.say(html);
    },
    handleTap(idx) {
      if (!this.tapCheck) return false;
      this.tapCheck(idx);
      return true;
    },
    reset() { if (chipsEl) chipsEl.innerHTML = ""; this.tapCheck = null; }
  };

  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "game-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="game-panel" role="dialog" aria-modal="true" aria-labelledby="g-title">' +
      '  <header class="game-head">' +
      '    <h2 id="g-title"></h2>' +
      '    <div id="g-score" class="game-score"></div>' +
      '    <button type="button" id="g-close" class="game-close" aria-label="Close game">✕</button>' +
      "  </header>" +
      '  <div class="coach-row"><span class="coach-face" aria-hidden="true">♞</span>' +
      '    <div class="coach-bubble"><p id="g-status" class="game-status"></p>' +
      '    <div id="g-chips" class="chip-row chips-left"></div></div></div>' +
      '  <div id="g-extra" class="game-extra"></div>' +
      '  <div id="g-board" class="game-board"></div>' +
      '  <div id="g-controls" class="game-controls"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector("#g-title");
    scoreEl = overlay.querySelector("#g-score");
    statusEl = overlay.querySelector("#g-status");
    extraEl = overlay.querySelector("#g-extra");
    boardWrap = overlay.querySelector("#g-board");
    controlsEl = overlay.querySelector("#g-controls");
    chipsEl = overlay.querySelector("#g-chips");
    overlay.querySelector("#g-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
  }

  /* game timers are registered here so closing (or switching) a game can
     never fire a stale callback into the next game's shared status UI */
  let pending = [];
  function later(fn, ms) { const id = setTimeout(fn, ms); pending.push(id); return id; }
  function clearPending() { pending.forEach(clearTimeout); pending = []; }

  function close() {
    clearPending();
    if (cleanup) { cleanup(); cleanup = null; }
    overlay.hidden = true;
    boardWrap.innerHTML = "";
    extraEl.innerHTML = "";
    controlsEl.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function open(id, opts) {
    ensureModal();
    clearPending();
    if (cleanup) { cleanup(); cleanup = null; }
    const def = REGISTRY[id];
    if (!def) return;
    boardWrap.innerHTML = "";
    extraEl.innerHTML = "";
    controlsEl.innerHTML = "";
    statusEl.textContent = "";
    scoreEl.textContent = "";
    coach.reset();
    titleEl.textContent = def.title;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    cleanup = def.init(opts || {}) || null;
    overlay.querySelector("#g-close").focus();
  }

  /* fresh mount point per game — #g-board is a flex centering wrapper and
     must not become the grid itself */
  function newBoardEl() {
    const el = document.createElement("div");
    boardWrap.appendChild(el);
    return el;
  }

  function button(label, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function emptyBoard() { return new Array(64).fill(""); }
  function randSquares(n, exclude, allowed) {
    const pool = [];
    for (let i = 0; i < 64; i++) {
      if (exclude.includes(i)) continue;
      if (allowed && !allowed(i)) continue;
      pool.push(i);
    }
    const out = [];
    while (out.length < n && pool.length) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }

  /* ---------------- Square Race ---------------- */
  const squareRace = {
    title: "Square Race",
    init() {
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      b.setPosition(emptyBoard());
      let score = 0, time = 60, target = -1, timer = null, running = false;

      function newTarget() {
        target = Math.floor(Math.random() * 64);
        statusEl.innerHTML = 'Find <strong class="big-square">' + Engine.sqName(target) + "</strong> !";
      }
      function hud() {
        scoreEl.innerHTML = "⭐ " + score + ' &nbsp; <span class="timer">⏱ ' + time + "s</span>";
      }
      function finish() {
        clearInterval(timer); timer = null; running = false;
        b.clearHl();
        const stars = score >= 12 ? 3 : score >= 7 ? 2 : score >= 3 ? 1 : 0;
        const record = Store.setBest("squareRace", score);
        if (stars) Store.setGameStars("squareRace", stars);
        statusEl.innerHTML = "Time! You found <strong>" + score + "</strong> squares " +
          "★".repeat(stars) + (record ? " — new record!" : "") +
          '<br><small>Best so far: ' + Store.getBest("squareRace") + "</small>";
        if (stars) FX.burst(boardWrap);
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Play again", "btn-primary", start));
      }
      function start() {
        score = 0; time = 60; running = true;
        controlsEl.innerHTML = "";
        newTarget(); hud();
        timer = setInterval(() => {
          time--; hud();
          if (time <= 0) finish();
        }, 1000);
      }

      b.onTap = idx => {
        if (!running) return;
        if (idx === target) {
          score++;
          SFX.good();
          b.clearHl();
          b.highlight([idx], "hl-hint");
          later(() => b.clearHl(), 250);
          if (score % 5 === 0) FX.burst(b.squareEl(idx), 30);
          newTarget(); hud();
        } else {
          b.shake();
          SFX.bad();
        }
      };

      statusEl.textContent = "Tap the square I call out. The little letters and numbers help!";
      controlsEl.appendChild(button("Start! (60 seconds)", "btn-primary", start));
      hud();
      return () => { if (timer) clearInterval(timer); };
    }
  };

  /* ---------------- Coin Hop ---------------- */
  const coinHop = {
    title: "Coin Hop",
    init(opts) {
      const pieces = opts.pieces || ["N"];
      const NAMES = { R: "Rook", B: "Bishop", N: "Knight", Q: "Queen", K: "King", P: "Pawn" };
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let piece = pieces[0], pieceAt = -1, moves = 0, coinsLeft = 0, done = false, sel = false;

      const picker = document.createElement("div");
      picker.className = "chip-row";
      extraEl.appendChild(picker);
      function drawPicker() {
        picker.innerHTML = "";
        for (const p of pieces) {
          const c = button(Board.GLYPH[p] + " " + NAMES[p], "chip" + (p === piece ? " chip-on" : ""), () => {
            piece = p; setup();
          });
          picker.appendChild(c);
        }
        if (pieces.length < 2) picker.hidden = true;
      }

      function hud() { scoreEl.innerHTML = "🪙 " + coinsLeft + " left &nbsp; 👣 " + moves + " moves"; }

      function setup() {
        done = false; sel = false; moves = 0;
        drawPicker();
        const arr = emptyBoard();
        pieceAt = 27 + Math.floor(Math.random() * 10); // around the middle
        arr[pieceAt] = piece;
        const sameColor = i =>
          (Engine.fileOf(i) + Engine.rankRow(i)) % 2 === (Engine.fileOf(pieceAt) + Engine.rankRow(pieceAt)) % 2;
        const coinIdxs = randSquares(6, [pieceAt], piece === "B" ? sameColor : null);
        b.setPosition(arr);
        b.setCoins(coinIdxs);
        b.clearHl();
        coinsLeft = 6; hud();
        statusEl.textContent = "Tap the " + NAMES[piece].toLowerCase() + ", then tap where it should go. Collect all 6 coins!";
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("New coins", "", setup));
      }

      function finish() {
        done = true;
        const easy = piece !== "N" && piece !== "K" && piece !== "P";
        const s3 = easy ? 9 : 14, s2 = easy ? 13 : 20;
        const stars = moves <= s3 ? 3 : moves <= s2 ? 2 : 1;
        Store.setGameStars("coinHop", stars);
        statusEl.innerHTML = "All coins collected in <strong>" + moves + "</strong> moves! " + "★".repeat(stars);
        FX.burst(boardWrap);
        SFX.fanfare();
      }

      b.onTap = idx => {
        if (done) return;
        const pos = b.position();
        if (idx === pieceAt) {
          sel = true;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          b.highlight(Engine.pieceTargets(pos, idx), "hl-move");
          return;
        }
        if (sel && Engine.pieceTargets(pos, pieceAt).includes(idx)) {
          b.setPosition(Engine.applyMove(pos, pieceAt, idx));
          // keep a pawn a pawn even across the last rank in this game
          if (piece === "P") { const arr = b.position(); arr[idx] = "P"; b.setPosition(arr); }
          pieceAt = idx; moves++; sel = false;
          b.clearHl();
          b.pop(idx);
          if (b.coins().has(idx)) {
            const left = [...b.coins()].filter(i => i !== idx);
            b.setCoins(left);
            coinsLeft = left.length;
            FX.burst(b.squareEl(idx), 22);
            SFX.coin();
          } else {
            SFX.move();
          }
          hud();
          if (coinsLeft === 0) finish();
        } else if (sel) {
          b.shake();
        }
      };

      setup();
    }
  };

  /* ---------------- Pawn Wars ---------------- */
  const pawnWars = {
    title: "Pawn Wars",
    init() {
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let whiteToMove = true, selIdx = -1, over = false;

      function fresh() {
        over = false; whiteToMove = true; selIdx = -1;
        const arr = emptyBoard();
        for (let f = 0; f < 8; f++) { arr[8 + f] = "p"; arr[48 + f] = "P"; }
        b.setPosition(arr);
        b.clearHl();
        hud();
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Restart", "", fresh));
      }

      function hud() {
        if (!over) coach.reset();
        statusEl.innerHTML = over ? statusEl.innerHTML
          : whiteToMove ? Copy.t("⬜ <strong>Kid’s move</strong> — race a pawn to the top!",
                                 "⬜ <strong>White to move</strong> — race a pawn to the top!")
                        : Copy.t("⬛ <strong>Grown-up’s move</strong>", "⬛ <strong>Black to move</strong>");
        scoreEl.textContent = "";
      }

      function win(whiteWon, why) {
        over = true;
        const stars = whiteWon ? 3 : 1;
        Store.setGameStars("pawnWars", stars);
        statusEl.innerHTML = (whiteWon ? Copy.t("⬜ The kid wins", "⬜ White wins")
                                       : Copy.t("⬛ The grown-up wins", "⬛ Black wins")) +
          " — " + why + " " + "★".repeat(stars);
        FX.burst(boardWrap);
        SFX.fanfare();
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (over) return;
        const pos = b.position();
        const p = pos[idx];
        const mine = p !== "" && Engine.isWhitePiece(p) === whiteToMove;

        if (mine) {
          selIdx = idx;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          for (const t of Engine.legalTargets(pos, idx)) {
            b.highlight([t], pos[t] === "" ? "hl-move" : "hl-cap");
          }
          return;
        }
        if (selIdx >= 0 && Engine.legalTargets(pos, selIdx).includes(idx)) {
          const next = Engine.applyMove(pos, selIdx, idx);
          b.setPosition(next);
          b.clearHl();
          b.pop(idx);
          SFX.move();
          selIdx = -1;
          if (next[idx] === "Q") return win(true, "a pawn was crowned! 👑");
          if (next[idx] === "q") return win(false, "a pawn was crowned! 👑");
          whiteToMove = !whiteToMove;
          if (Engine.allLegalMoves(next, whiteToMove).length === 0) {
            return win(!whiteToMove, whiteToMove === true ? "white is stuck!" : "black is stuck!");
          }
          /* coach interjects if the kid just hung her pawn — she decides */
          if (!whiteToMove && Engine.isAttacked(next, idx, false) && Engine.defendersOf(next, idx).length === 0) {
            const snap = pos, after = next;
            coach.ask("⚠️ Hold on — can black <strong>snack that pawn for free</strong>? Think…", {
              chips: [
                { label: "Oops! Take back", onPick: () => {
                    if (JSON.stringify(b.position()) !== JSON.stringify(after)) {
                      coach.say("Too late — the game moved on!");
                      return;
                    }
                    b.setPosition(snap);
                    whiteToMove = true;
                    b.clearHl();
                    coach.say("Good save! Look before you move — champion habit. ⬜ Your move again.");
                  } },
                { label: "It’s my plan 😏", onPick: () => coach.say("Brave! Sometimes a pawn is bait. ⬛ <strong>Grown-up’s move…</strong>") }
              ]
            });
            return;
          }
          hud();
        } else if (selIdx >= 0) {
          b.shake();
        }
      };

      statusEl.textContent = "";
      fresh();
    }
  };

  /* Shared Socratic feedback when a "find the mate" move isn't mate.
     Diagnoses WHY (no check / king escapes / capture-block) and resets. */
  function mateMissCoach(o) {
    o.lock();
    SFX.bad();
    const backSoon = msg => later(() => {
      o.b.setPosition(o.resetBoard.slice());
      o.b.shake();
      o.unlock();
      coach.say(msg + (o.extraNudge || ""));
    }, 500);
    const wasCheck = Engine.inCheck(o.next, false);
    const escapes = Engine.allLegalMoves(o.next, false)
      .filter(m => o.next[m.from] === "k").map(m => m.to);
    if (!wasCheck) {
      coach.ask("Look at the black king… is he even in <strong>check</strong> after that?", {
        chips: [
          { label: "No, he isn’t!", onPick: () => backSoon("Right! Checkmate always starts with CHECK. Find a move that shouts check!") },
          { label: "Hmm, yes?", onPick: () => backSoon("Peek again — nothing attacks him. First job: give CHECK!") }
        ]
      });
    } else if (escapes.length) {
      let miss = 0;
      coach.ask("It IS check — but the king wriggles free! <strong>Tap the square</strong> where he can escape.", {
        onTap: t => {
          if (escapes.includes(t)) {
            coach.tapCheck = null;
            o.b.highlight([t], "hl-hint");
            SFX.good();
            backSoon("Exactly! Your next move must lock that door too. Go!");
          } else if (++miss >= 2) {
            coach.tapCheck = null;
            o.b.highlight(escapes, "hl-hint");
            backSoon("There — the glowing doors! Find a move that locks them all.");
          } else {
            SFX.bad();
            statusEl.innerHTML = "Not that one — watch the king himself. Where can <strong>he</strong> step? Tap it.";
          }
        }
      });
    } else {
      backSoon("It’s check and the king is stuck — but black can <strong>capture or block</strong> your attacker. Sneaky! Try another move.");
    }
  }

  /* ---------------- Mate in One ---------------- */
  const mateInOne = {
    title: "Mate in 1",
    init() {
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let cur = 0, selIdx = -1, tries = 0, busy = false;

      for (let i = 0; i < PUZZLES.length; i++) if (!Store.isSolved(i)) { cur = i; break; }
      if (Store.solvedCount() === PUZZLES.length) cur = 0;

      const dots = document.createElement("div");
      dots.className = "dot-row";
      extraEl.appendChild(dots);

      function drawDots() {
        dots.innerHTML = "";
        PUZZLES.forEach((pz, i) => {
          const d = button(String(i + 1), "dot" + (Store.isSolved(i) ? " dot-solved" : "") + (i === cur ? " dot-cur" : ""),
            () => { cur = i; load(); });
          d.setAttribute("aria-label", "Puzzle " + (i + 1));
          dots.appendChild(d);
        });
      }

      function hud() {
        scoreEl.innerHTML = "🧩 " + Store.solvedCount() + " / " + PUZZLES.length + " solved";
      }

      function load() {
        const pz = PUZZLES[cur];
        b.setPosition(Engine.parseFEN(pz.fen).board);
        b.clearHl();
        selIdx = -1; tries = 0; busy = false;
        statusEl.innerHTML = "<strong>" + pz.name + "</strong> — white moves and checkmates in one!";
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Hint", "", () => {
          const from = Engine.sqIdx(pz.solution.slice(0, 2));
          b.highlight([from], "hl-hint");
          statusEl.innerHTML = "<strong>" + pz.name + "</strong> — " + pz.hint;
        }));
        controlsEl.appendChild(button("Start pack over", "btn-quiet", () => {
          Store.resetPuzzles(); cur = 0; drawDots(); hud(); load();
        }));
        drawDots(); hud();
      }

      function solved() {
        Store.setSolved(cur);
        const n = Store.solvedCount();
        Store.setGameStars("mateInOne", n >= 12 ? 3 : n >= 8 ? 2 : n >= 4 ? 1 : 0);
        statusEl.innerHTML = "<strong>Checkmate!</strong> 🎉 The king has nowhere to run.";
        Voice.say("Checkmate! The king has nowhere to run!");
        FX.burst(boardWrap);
        SFX.fanfare();
        drawDots(); hud();
        busy = true;
        later(() => {
          if (n < PUZZLES.length) {
            for (let i = 0; i < PUZZLES.length; i++) if (!Store.isSolved(i)) { cur = i; break; }
            load();
          } else {
            statusEl.innerHTML = "<strong>Pack complete!</strong> All 12 checkmates found. ★★★";
          }
        }, 1400);
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (busy) return;
        const pos = b.position();
        const p = pos[idx];
        if (p !== "" && Engine.isWhitePiece(p)) {
          selIdx = idx;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          for (const t of Engine.legalTargets(pos, idx)) {
            b.highlight([t], pos[t] === "" ? "hl-move" : "hl-cap");
          }
          return;
        }
        if (selIdx >= 0 && Engine.legalTargets(pos, selIdx).includes(idx)) {
          const next = Engine.applyMove(pos, selIdx, idx);
          if (Engine.isMate(next, false)) {
            b.setPosition(next);
            b.clearHl();
            b.pop(idx);
            solved();
          } else {
            tries++;
            b.setPosition(next);
            b.clearHl();
            mateMissCoach({
              b, next,
              resetBoard: Engine.parseFEN(PUZZLES[cur].fen).board,
              lock: () => { busy = true; },
              unlock: () => { busy = false; },
              extraNudge: tries >= 2 ? " (The Hint button is your friend!)" : ""
            });
          }
          selIdx = -1;
        } else if (selIdx >= 0) {
          b.shake();
        }
      };

      load();
    }
  };

  /* ---------------- Mate in Two ---------------- */
  const mateInTwo = {
    title: "Mate in 2",
    init() {
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let cur = 0, selIdx = -1, tries = 0, busy = false;
      let phase = 1, midBoard = null; // phase 2 = finish the mate after black's defense

      for (let i = 0; i < MATE2.length; i++) if (!Store.isSolved2(i)) { cur = i; break; }
      if (Store.solved2Count() === MATE2.length) cur = 0;

      const dots = document.createElement("div");
      dots.className = "dot-row";
      extraEl.appendChild(dots);

      function drawDots() {
        dots.innerHTML = "";
        MATE2.forEach((pz, i) => {
          const d = button(String(i + 1), "dot" + (Store.isSolved2(i) ? " dot-solved" : "") + (i === cur ? " dot-cur" : ""),
            () => { cur = i; load(); });
          d.setAttribute("aria-label", "Puzzle " + (i + 1));
          dots.appendChild(d);
        });
      }

      function hud() {
        scoreEl.innerHTML = "🧩 " + Store.solved2Count() + " / " + MATE2.length + " solved";
      }

      function load() {
        const pz = MATE2[cur];
        b.setPosition(Engine.parseFEN(pz.fen).board);
        b.clearHl();
        selIdx = -1; tries = 0; busy = false; phase = 1; midBoard = null;
        statusEl.innerHTML = "<strong>" + pz.name + "</strong> — white forces checkmate in <strong>two</strong> moves. Find move one!";
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Hint", "", () => {
          if (phase === 1) {
            b.highlight([Engine.sqIdx(pz.solution.slice(0, 2))], "hl-hint");
            statusEl.innerHTML = "<strong>" + pz.name + "</strong> — " + pz.hint;
          } else if (midBoard) {
            for (const m of Engine.allLegalMoves(midBoard, true)) {
              if (Engine.isMate(Engine.applyMove(midBoard, m.from, m.to), false)) {
                b.highlight([m.from], "hl-hint");
                break;
              }
            }
          }
        }));
        controlsEl.appendChild(button("Start pack over", "btn-quiet", () => {
          Store.resetPuzzles2(); cur = 0; drawDots(); hud(); load();
        }));
        drawDots(); hud();
      }

      function solved(msg) {
        Store.setSolved2(cur);
        const n = Store.solved2Count();
        Store.setGameStars("mateInTwo", n >= 12 ? 3 : n >= 8 ? 2 : n >= 4 ? 1 : 0);
        statusEl.innerHTML = msg;
        Voice.say(msg);
        FX.burst(boardWrap);
        SFX.fanfare();
        drawDots(); hud();
        busy = true;
        later(() => {
          if (n < MATE2.length) {
            for (let i = 0; i < MATE2.length; i++) if (!Store.isSolved2(i)) { cur = i; break; }
            load();
          } else {
            statusEl.innerHTML = "<strong>Pack complete!</strong> Twelve forced mates — real chess player thinking. ★★★";
          }
        }, 1600);
      }

      /* black plays its toughest defense, then hands the mate-in-1 back */
      function blackReplies(afterWhite) {
        busy = true;
        later(() => {
          const d = Engine.bestDefense(afterWhite);
          if (!d) { solved("<strong>Checkmate!</strong> 🎉"); return; }
          const afterBlack = Engine.applyMove(afterWhite, d.from, d.to);
          b.setPosition(afterBlack);
          b.pop(d.to);
          SFX.move();
          midBoard = afterBlack;
          phase = 2; busy = false;
          const say = "Locked in! Black tries <strong>" + Engine.sqName(d.from) + "–" + Engine.sqName(d.to) +
            "</strong>… now finish it. <strong>Mate in one!</strong>";
          coach.say(say);
        }, 750);
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (busy) return;
        const pos = b.position();
        const p = pos[idx];
        if (p !== "" && Engine.isWhitePiece(p)) {
          selIdx = idx;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          for (const t of Engine.legalTargets(pos, idx)) {
            b.highlight([t], pos[t] === "" ? "hl-move" : "hl-cap");
          }
          return;
        }
        if (selIdx >= 0 && Engine.legalTargets(pos, selIdx).includes(idx)) {
          const next = Engine.applyMove(pos, selIdx, idx);

          if (phase === 1) {
            if (Engine.isMate(next, false)) {
              b.setPosition(next); b.clearHl(); b.pop(idx);
              solved("<strong>Checkmate — even faster than asked!</strong> 🎉");
            } else if (Engine.isMateIn2After(pos, selIdx, idx)) {
              b.setPosition(next); b.clearHl(); b.pop(idx);
              SFX.good();
              statusEl.innerHTML = "That's the squeeze — black has no good answer…";
              blackReplies(next);
            } else {
              tries++;
              b.setPosition(next); b.clearHl();
              busy = true; SFX.bad();
              const replies = Engine.allLegalMoves(next, false);
              let saveMove = null;
              for (const r of replies) {
                if (!Engine.hasMateIn1(Engine.applyMove(next, r.from, r.to), true)) { saveMove = r; break; }
              }
              const nudge = tries >= 2 ? " (The Hint button is your friend!)" : "";
              const escapeTxt = saveMove
                ? "black plays <strong>" + Engine.sqName(saveMove.from) + "–" + Engine.sqName(saveMove.to) + "</strong> and there is no mate"
                : "black slips away";
              later(() => {
                b.setPosition(Engine.parseFEN(MATE2[cur].fen).board);
                b.shake();
                busy = false;
                coach.say((Engine.inCheck(next, false)
                  ? "It's check — but " + escapeTxt + ". Find the move that leaves <strong>no way out</strong>."
                  : "Black gets a free turn: " + escapeTxt + ". Move one must be a check or an unstoppable threat!") + nudge);
              }, 900);
            }
          } else {
            /* phase 2: must be mate in one */
            if (Engine.isMate(next, false)) {
              b.setPosition(next); b.clearHl(); b.pop(idx);
              solved("<strong>Checkmate!</strong> 🎉 A forced mate in two — beautifully done.");
            } else {
              tries++;
              b.setPosition(next); b.clearHl();
              mateMissCoach({
                b, next,
                resetBoard: midBoard,
                lock: () => { busy = true; },
                unlock: () => { busy = false; },
                extraNudge: tries >= 2 ? " (The Hint button is your friend!)" : ""
              });
            }
          }
          selIdx = -1;
        } else if (selIdx >= 0) {
          b.shake();
        }
      };

      load();
    }
  };

  /* ---------------- Rook Maze ---------------- */
  const rookMaze = {
    title: "Rook Maze",
    init(opts) {
      const pieces = opts.pieces || ["R"];
      const NAMES = { R: "rook", B: "bishop", Q: "queen" };
      const PREY = { q: "queen", r: "rook", b: "bishop", n: "knight" };
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let piece = pieces[0], at = -1, target = -1, par = 0, moves = 0, done = false, sel = false;

      const picker = document.createElement("div");
      picker.className = "chip-row";
      extraEl.appendChild(picker);
      function drawPicker() {
        picker.innerHTML = "";
        for (const p of pieces) {
          picker.appendChild(button(Board.GLYPH[p] + " " + NAMES[p], "chip" + (p === piece ? " chip-on" : ""), () => {
            piece = p; gen();
          }));
        }
        if (pieces.length < 2) picker.hidden = true;
      }

      function hud() {
        scoreEl.innerHTML = "👣 " + moves + " moves &nbsp;·&nbsp; 🎯 best possible: " + par;
      }

      function gen() {
        drawPicker();
        for (let tries = 0; tries < 60; tries++) {
          const arr = emptyBoard();
          at = 48 + Math.floor(Math.random() * 16); // start on ranks 1–2
          arr[at] = piece;
          for (const w of randSquares(9, [at], null)) arr[w] = "P";
          const dist = Engine.pathDistances(arr, at);
          const cand = [];
          for (let i = 0; i < 64; i++) {
            if (i !== at && arr[i] === "" && dist[i] >= 3) cand.push(i);
          }
          if (!cand.length) continue;
          target = cand[Math.floor(Math.random() * cand.length)];
          const preyKeys = piece === "B" ? ["q", "r", "n"] : ["q", "b", "n"];
          arr[target] = preyKeys[Math.floor(Math.random() * preyKeys.length)];
          const d2 = Engine.pathDistances(arr, at);
          if (d2[target] < 2) continue; // prey blocked its own lane — regenerate
          par = d2[target];
          moves = 0; done = false; sel = false;
          b.setPosition(arr);
          b.clearHl();
          hud();
          statusEl.innerHTML = "The cheeky <strong>" + PREY[arr[target]] + "</strong> hides behind the walls! " +
            "Your own pawns block the road — go <strong>around</strong> and catch her. Can you do it in " + par + " moves?";
          controlsEl.innerHTML = "";
          controlsEl.appendChild(button("New maze", "", gen));
          return;
        }
      }

      function finish() {
        done = true;
        const stars = moves <= par ? 3 : moves <= par + 1 ? 2 : 1;
        Store.setGameStars("rookMaze", stars);
        statusEl.innerHTML = "<strong>Caught!</strong> 🏁 " + moves + " moves" +
          (moves <= par ? " — the perfect path! " : " (best possible was " + par + "). ") + "★".repeat(stars);
        Voice.say("Caught in " + moves + " moves!" + (moves <= par ? " The perfect path!" : ""));
        FX.burst(boardWrap);
        SFX.fanfare();
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (done) return;
        const pos = b.position();
        if (idx === at) {
          sel = true;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          for (const t of Engine.pieceTargets(pos, idx)) {
            b.highlight([t], pos[t] === "" ? "hl-move" : "hl-cap");
          }
          return;
        }
        if (sel && Engine.pieceTargets(pos, at).includes(idx)) {
          const caught = idx === target;
          b.setPosition(Engine.applyMove(pos, at, idx));
          at = idx; moves++; sel = false;
          b.clearHl();
          b.pop(idx);
          hud();
          if (caught) finish();
          else SFX.move();
        } else if (sel) {
          b.shake();
          SFX.bad();
          coach.say("The road is blocked there! Sliders can’t jump — find the <strong>open lane</strong>.");
        }
      };

      gen();
    }
  };

  /* ---------------- Piece Detective (hanging piece hunt) ---------------- */
  const hangingHunt = {
    title: "Piece Detective",
    init() {
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let cur = 0, busy = false;

      for (let i = 0; i < HUNTS.length; i++) if (!Store.isHuntSolved(i)) { cur = i; break; }
      if (Store.huntCount() === HUNTS.length) cur = 0;

      const dots = document.createElement("div");
      dots.className = "dot-row";
      extraEl.appendChild(dots);

      function drawDots() {
        dots.innerHTML = "";
        HUNTS.forEach((h, i) => {
          const d = button(String(i + 1), "dot" + (Store.isHuntSolved(i) ? " dot-solved" : "") + (i === cur ? " dot-cur" : ""),
            () => { cur = i; load(); });
          d.setAttribute("aria-label", "Case " + (i + 1));
          dots.appendChild(d);
        });
      }

      function hud() { scoreEl.innerHTML = "🔍 " + Store.huntCount() + " / " + HUNTS.length + " cases"; }

      function load() {
        const h = HUNTS[cur];
        b.setPosition(Engine.parseFEN(h.fen).board);
        b.clearHl();
        busy = false;
        statusEl.innerHTML = (Copy.isStory() ? "<em>" + h.story + "</em><br>" : "") +
          "Tap the black piece that is <strong>free to take</strong> — attacked, and nobody guards it!";
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Hint", "", () => {
          // light up the white attacker(s) of the answer square
          const pos = b.position();
          const ans = Engine.sqIdx(h.answer);
          for (let i = 0; i < 64; i++) {
            const p = pos[i];
            if (p !== "" && Engine.isWhitePiece(p) && Engine.attackSquares(pos, i).includes(ans)) {
              b.highlight([i], "hl-hint");
            }
          }
          statusEl.innerHTML = (Copy.isStory() ? "<em>" + h.story + "</em><br>" : "") +
            "Follow the glowing piece — what can it grab for free?";
        }));
        controlsEl.appendChild(button("Start cases over", "btn-quiet", () => {
          Store.resetHunts(); cur = 0; drawDots(); hud(); load();
        }));
        drawDots(); hud();
      }

      function solved() {
        Store.setHuntSolved(cur);
        const n = Store.huntCount();
        Store.setGameStars("hangingHunt", n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);
        statusEl.innerHTML = "<strong>Found it!</strong> 🔍 Free stuff detected.";
        Voice.say("Found it! Free stuff detected!");
        FX.burst(boardWrap);
        SFX.coin();
        drawDots(); hud();
        busy = true;
        later(() => {
          if (n < HUNTS.length) {
            for (let i = 0; i < HUNTS.length; i++) if (!Store.isHuntSolved(i)) { cur = i; break; }
            load();
          } else {
            statusEl.innerHTML = "<strong>All cases closed!</strong> Official Free-Stuff Detector badge earned. ★★★";
            SFX.fanfare();
          }
        }, 1300);
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (busy) return;
        if (idx === Engine.sqIdx(HUNTS[cur].answer)) {
          b.clearHl();
          b.highlight([idx], "hl-hint");
          b.pop(idx);
          solved();
        } else {
          const pos = b.position();
          const p = pos[idx];
          if (p === "" || Engine.isWhitePiece(p)) {
            b.shake(); SFX.bad();
            coach.say("Tap a <strong>black</strong> piece — we’re hunting black’s loose ones!");
          } else if (p === "k") {
            b.shake(); SFX.bad();
            coach.say("Kings can never be taken — only checkmated! Hunt for a piece.");
          } else if (!Engine.isAttacked(pos, idx, true)) {
            b.shake(); SFX.bad();
            coach.say("Is anything even <strong>attacking</strong> that one? Trace every white piece’s path…");
          } else {
            const guards = Engine.defendersOf(pos, idx);
            SFX.bad();
            coach.ask("It IS attacked — but it has a bodyguard! <strong>Tap the guard.</strong>", {
              onTap: t => {
                coach.tapCheck = null;
                if (guards.includes(t)) {
                  b.highlight([t], "hl-hint");
                  SFX.good();
                  coach.say("That’s the bodyguard! Free stuff has <strong>no</strong> guards. Keep hunting!");
                } else {
                  b.highlight(guards, "hl-hint");
                  coach.say("The glowing one guards it. Free stuff has no guards — keep hunting!");
                }
              }
            });
          }
        }
      };

      load();
    }
  };

  /* ---------------- Trick Shots (fork / pin / skewer / discovered) ---------------- */
  const PACK_INFO = {
    fork: { name: "The Fork", ask: "Play a move that attacks TWO things at once!" },
    pin: { name: "The Pin", ask: "Play a move that freezes a piece to something precious behind it!" },
    skewer: { name: "The Skewer", ask: "Attack the big one in front — grab what hides behind!" },
    disco: { name: "Discovered Attack", ask: "Move one piece so the piece behind it attacks — surprise!" },
    fork2: { name: "The Fork — Master", ask: "Fork two big pieces from a square nobody can punish!" },
    pin2: { name: "The Pin — Master", ask: "Build the line of three: you, their piece, their treasure behind it." },
    skewer2: { name: "The Skewer — Master", ask: "Poke the big one in front so it must run — collect what hides behind." },
    disco2: { name: "Discovered Attack — Master", ask: "Move one piece, unleash another — make BOTH of them threaten something!" }
  };
  const DETECTOR = {
    fork: (b, to) => Engine.isForkAfter(b, to),
    pin: (b, to) => Engine.isPinAfter(b, to),
    skewer: (b, to) => Engine.isSkewerAfter(b, to),
    disco: (b, to) => Engine.isDiscoveredAfter(b, to, true)
  };
  DETECTOR.fork2 = DETECTOR.fork; DETECTOR.pin2 = DETECTOR.pin;
  DETECTOR.skewer2 = DETECTOR.skewer; DETECTOR.disco2 = DETECTOR.disco;

  const tacticTrainer = {
    title: "Trick Shots",
    init(opts) {
      const pack = opts.pack && (TACTICS[opts.pack] || TACTICS2[opts.pack]) ? opts.pack : "fork";
      const cases = TACTICS[pack] || TACTICS2[pack];
      const info = PACK_INFO[pack];
      titleEl.textContent = "Trick Shots — " + info.name;
      const b = Board.create(newBoardEl(), { labels: true, interactive: true });
      let cur = 0, selIdx = -1, busy = false;

      for (let i = 0; i < cases.length; i++) if (!Store.isTacticSolved(pack, i)) { cur = i; break; }
      if (Store.tacticCount(pack) === cases.length) cur = 0;

      const dots = document.createElement("div");
      dots.className = "dot-row";
      extraEl.appendChild(dots);

      function drawDots() {
        dots.innerHTML = "";
        cases.forEach((tc, i) => {
          const d = button(String(i + 1), "dot" + (Store.isTacticSolved(pack, i) ? " dot-solved" : "") + (i === cur ? " dot-cur" : ""),
            () => { cur = i; load(); });
          dots.appendChild(d);
        });
      }

      function hud() { scoreEl.innerHTML = "🎯 " + Store.tacticCount(pack) + " / " + cases.length; }

      function load() {
        b.setPosition(Engine.parseFEN(cases[cur].fen).board);
        b.clearHl();
        selIdx = -1; busy = false;
        statusEl.innerHTML = (Copy.isStory() ? "<em>" + cases[cur].story + "</em><br>" : "") + info.ask;
        controlsEl.innerHTML = "";
        controlsEl.appendChild(button("Hint", "", () => {
          b.highlight([Engine.sqIdx(cases[cur].solution.slice(0, 2))], "hl-hint");
        }));
        controlsEl.appendChild(button("Start pack over", "btn-quiet", () => {
          Store.resetTactics(pack); cur = 0; drawDots(); hud(); load();
        }));
        drawDots(); hud();
      }

      function solved() {
        Store.setTacticSolved(pack, cur);
        const tier2 = pack.slice(-1) === "2";
        const packKeys = tier2 ? ["fork2", "pin2", "skewer2", "disco2"] : ["fork", "pin", "skewer", "disco"];
        const total = packKeys.reduce((s, p) => s + Store.tacticCount(p), 0);
        Store.setGameStars(tier2 ? "tacticTrainer2" : "tacticTrainer",
          tier2 ? (total >= 12 ? 3 : total >= 8 ? 2 : total >= 4 ? 1 : 0)
                : (total >= 13 ? 3 : total >= 8 ? 2 : total >= 4 ? 1 : 0));
        statusEl.innerHTML = "<strong>" + info.name + "!</strong> 🎯 Beautifully done.";
        Voice.say(info.name + "! Beautifully done!");
        FX.burst(boardWrap);
        SFX.fanfare();
        drawDots(); hud();
        busy = true;
        later(() => {
          const n = Store.tacticCount(pack);
          if (n < cases.length) {
            for (let i = 0; i < cases.length; i++) if (!Store.isTacticSolved(pack, i)) { cur = i; break; }
            load();
          } else {
            statusEl.innerHTML = "<strong>" + info.name + " mastered!</strong> Try the other tricks on other weeks.";
          }
        }, 1400);
      }

      b.onTap = idx => {
        if (coach.handleTap(idx)) return;
        if (busy) return;
        const pos = b.position();
        const p = pos[idx];
        if (p !== "" && Engine.isWhitePiece(p)) {
          selIdx = idx;
          b.clearHl();
          b.highlight([idx], "hl-sel");
          for (const t of Engine.legalTargets(pos, idx)) {
            b.highlight([t], pos[t] === "" ? "hl-move" : "hl-cap");
          }
          return;
        }
        if (selIdx >= 0 && Engine.legalTargets(pos, selIdx).includes(idx)) {
          const next = Engine.applyMove(pos, selIdx, idx);
          if (DETECTOR[pack](next, idx)) {
            b.setPosition(next);
            b.clearHl();
            b.pop(idx);
            solved();
          } else {
            b.setPosition(next);
            b.clearHl();
            SFX.bad();
            busy = true;
            const backSoon = msg => later(() => {
              b.setPosition(Engine.parseFEN(cases[cur].fen).board);
              b.shake();
              busy = false;
              coach.say(msg);
            }, 500);
            if (pack === "fork") {
              const hits = Engine.attackSquares(next, idx).filter(t =>
                next[t] !== "" && !Engine.isWhitePiece(next[t]) && next[t] !== "p");
              if (Engine.isAttacked(next, idx, false)) {
                const eaters = Engine.attackersOf(next, idx, false);
                coach.ask("Uh-oh — that square is dangerous! <strong>Tap the enemy</strong> that could eat your piece there.", {
                  onTap: t => {
                    coach.tapCheck = null;
                    if (eaters.includes(t)) {
                      b.highlight([t], "hl-cap");
                      SFX.good();
                      backSoon("You spotted it! A fork only works from a <strong>safe</strong> square. Try again.");
                    } else {
                      b.highlight(eaters, "hl-cap");
                      backSoon("It was the glowing one! Safe square first, fork second. Go again.");
                    }
                  }
                });
              } else {
                const n = hits.length;
                coach.ask("Count with me — how many big enemy pieces does it attack from there?", {
                  chips: [
                    { label: String(n), onPick: () => backSoon("Yes — " + (n === 1 ? "just one" : n) + "! A fork needs <strong>two at once</strong>. Hunt for the magic square!") },
                    { label: String(n === 2 ? 1 : 2), onPick: () => backSoon("Count slowly next time — it was " + n + ". A fork needs two at once!") }
                  ]
                });
              }
            } else if (pack === "pin") {
              backSoon("A pin is a line of three: you → their piece → something <strong>precious hiding behind</strong>. Did your move build that line? Look for the stack!");
            } else if (pack === "skewer") {
              backSoon("A skewer pokes the <strong>big one in front</strong> so it must run. What treasure stands behind it? Find that line!");
            } else {
              backSoon("The magic piece is the one <strong>behind</strong>: step aside and let a hidden friend attack. Which of your pieces is blocking a friend?");
            }
          }
          selIdx = -1;
        } else if (selIdx >= 0) {
          b.shake();
          SFX.bad();
        }
      };

      load();
    }
  };

  const REGISTRY = { squareRace, coinHop, pawnWars, mateInOne, mateInTwo, hangingHunt, tacticTrainer, rookMaze };

  return { open, close };
})();

if (typeof window !== "undefined") window.Games = Games;
