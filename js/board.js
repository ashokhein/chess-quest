/* Tap-to-move chess board renderer. One Board per container.
   Filled glyphs for both sides, colored by CSS (crisper than outline glyphs
   across platforms). */

const Board = (function () {
  const GLYPH = { P: "♟", N: "♞", B: "♝", R: "♜", Q: "♛", K: "♚" };

  function create(container, opts) {
    opts = opts || {};
    container.innerHTML = "";
    container.classList.add("cq-board");
    if (opts.small) container.classList.add("cq-board-small");

    const squares = [];
    for (let idx = 0; idx < 64; idx++) {
      const sq = document.createElement("button");
      sq.type = "button";
      sq.className = "sq " + ((Engine.fileOf(idx) + Engine.rankRow(idx)) % 2 === 0 ? "light" : "dark");
      sq.dataset.idx = idx;
      if (opts.labels) {
        if (Engine.fileOf(idx) === 0) sq.dataset.rank = 8 - Engine.rankRow(idx);
        if (Engine.rankRow(idx) === 7) sq.dataset.file = Engine.FILES[Engine.fileOf(idx)];
      }
      if (!opts.interactive) sq.tabIndex = -1;
      sq.addEventListener("click", () => { if (api.onTap) api.onTap(idx); });
      container.appendChild(sq);
      squares.push(sq);
    }

    let coins = new Set();

    function renderSquare(idx, boardArr) {
      const sq = squares[idx];
      const p = boardArr[idx];
      let html = "";
      if (p !== "") {
        html += '<span class="pc ' + (Engine.isWhitePiece(p) ? "w" : "b") + '">' + GLYPH[p.toUpperCase()] + "</span>";
      } else if (coins.has(idx)) {
        html += '<span class="coin"></span>';
      }
      sq.innerHTML = html;
    }

    let current = new Array(64).fill("");

    const api = {
      el: container,
      onTap: opts.onTap || null,
      setPosition(boardArr) {
        current = boardArr.slice();
        for (let i = 0; i < 64; i++) renderSquare(i, current);
      },
      position() { return current.slice(); },
      setCoins(idxs) {
        coins = new Set(idxs);
        this.setPosition(current);
      },
      coins() { return coins; },
      highlight(idxs, cls) {
        for (const i of idxs) squares[i].classList.add(cls);
      },
      clearHl() {
        for (const sq of squares) sq.classList.remove("hl-sel", "hl-move", "hl-cap", "hl-hint");
      },
      pop(idx) {
        const pc = squares[idx].querySelector(".pc");
        if (pc) { pc.classList.remove("pop"); void pc.offsetWidth; pc.classList.add("pop"); }
      },
      shake() {
        container.classList.remove("shake"); void container.offsetWidth;
        container.classList.add("shake");
      },
      squareEl(idx) { return squares[idx]; }
    };
    return api;
  }

  return { create, GLYPH };
})();

if (typeof window !== "undefined") window.Board = Board;
