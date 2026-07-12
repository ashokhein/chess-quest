/* Chess Quest engine — small, pure, dependency-free.
   Board: array of 64. Index 0 = a8 … 63 = h1 (FEN reading order).
   Pieces: "PNBRQK" white, "pnbrqk" black, "" empty.
   Scope: no castling or en passant — the mini-games and puzzle set never need them.
   Pawn promotion is always to a queen (kid-simple). */

const FILES = "abcdefgh";

function sqIdx(name) {
  const file = FILES.indexOf(name[0]);
  const rank = parseInt(name[1], 10);
  return (8 - rank) * 8 + file;
}

function sqName(idx) {
  return FILES[idx % 8] + (8 - Math.floor(idx / 8));
}

function fileOf(idx) { return idx % 8; }
function rankRow(idx) { return Math.floor(idx / 8); } // 0 = rank 8, 7 = rank 1

function isWhitePiece(p) { return p !== "" && p === p.toUpperCase(); }
function isBlackPiece(p) { return p !== "" && p === p.toLowerCase(); }

function parseFEN(fen) {
  const parts = fen.trim().split(/\s+/);
  const board = [];
  for (const ch of parts[0]) {
    if (ch === "/") continue;
    if (/\d/.test(ch)) {
      for (let i = 0; i < +ch; i++) board.push("");
    } else {
      board.push(ch);
    }
  }
  return { board, whiteToMove: (parts[1] || "w") === "w" };
}

const KNIGHT_OFFS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING_OFFS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

function onBoard(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

function step(idx, df, dr) {
  const f = fileOf(idx) + df, r = rankRow(idx) + dr;
  return onBoard(f, r) ? r * 8 + f : -1;
}

/* Squares a piece attacks (used for check detection). Pawns attack
   diagonally only; sliders stop at the first piece they meet. */
function attackSquares(board, idx) {
  const p = board[idx];
  const white = isWhitePiece(p);
  const type = p.toUpperCase();
  const out = [];

  if (type === "P") {
    const dr = white ? -1 : 1; // white pawns move toward rank 8 (row 0)
    for (const df of [-1, 1]) {
      const t = step(idx, df, dr);
      if (t >= 0) out.push(t);
    }
    return out;
  }
  if (type === "N" || type === "K") {
    for (const [df, dr] of (type === "N" ? KNIGHT_OFFS : KING_OFFS)) {
      const t = step(idx, df, dr);
      if (t >= 0) out.push(t);
    }
    return out;
  }
  const dirs = type === "R" ? ROOK_DIRS : type === "B" ? BISHOP_DIRS : ROOK_DIRS.concat(BISHOP_DIRS);
  for (const [df, dr] of dirs) {
    let t = step(idx, df, dr);
    while (t >= 0) {
      out.push(t);
      if (board[t] !== "") break;
      t = step(t, df, dr);
    }
  }
  return out;
}

function isAttacked(board, sq, byWhite) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p === "" || isWhitePiece(p) !== byWhite) continue;
    if (attackSquares(board, i).includes(sq)) return true;
  }
  return false;
}

function findKing(board, white) {
  return board.indexOf(white ? "K" : "k");
}

function inCheck(board, white) {
  const k = findKing(board, white);
  return k >= 0 && isAttacked(board, k, !white);
}

/* Pseudo-legal destination squares: respects blockers and capture rules,
   ignores king safety (legalTargets filters that). */
function pieceTargets(board, idx) {
  const p = board[idx];
  if (p === "") return [];
  const white = isWhitePiece(p);
  const type = p.toUpperCase();

  if (type === "P") {
    const out = [];
    const dr = white ? -1 : 1;
    const one = step(idx, 0, dr);
    if (one >= 0 && board[one] === "") {
      out.push(one);
      const startRow = white ? 6 : 1;
      const two = step(idx, 0, 2 * dr);
      if (rankRow(idx) === startRow && two >= 0 && board[two] === "") out.push(two);
    }
    for (const df of [-1, 1]) {
      const t = step(idx, df, dr);
      if (t >= 0 && board[t] !== "" && isWhitePiece(board[t]) !== white) out.push(t);
    }
    return out;
  }

  return attackSquares(board, idx).filter(t => board[t] === "" || isWhitePiece(board[t]) !== white);
}

function applyMove(board, from, to) {
  const next = board.slice();
  let p = next[from];
  const type = p.toUpperCase();
  if (type === "P") {
    const lastRow = isWhitePiece(p) ? 0 : 7;
    if (rankRow(to) === lastRow) p = isWhitePiece(p) ? "Q" : "q";
  }
  next[to] = p;
  next[from] = "";
  return next;
}

function legalTargets(board, idx) {
  const white = isWhitePiece(board[idx]);
  return pieceTargets(board, idx).filter(t => !inCheck(applyMove(board, idx, t), white));
}

function allLegalMoves(board, white) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p === "" || isWhitePiece(p) !== white) continue;
    for (const t of legalTargets(board, i)) out.push({ from: i, to: t });
  }
  return out;
}

function isMate(board, white) {
  return inCheck(board, white) && allLegalMoves(board, white).length === 0;
}

function isStalemate(board, white) {
  return !inCheck(board, white) && allLegalMoves(board, white).length === 0;
}

/* ---- tactic detectors (used by the Trick Shots game and its tests) ---- */

const VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
function pieceValue(p) { return VALUE[p.toUpperCase()] || 0; }

/* Fork: the piece that just landed on `to` attacks 2+ enemy non-pawn pieces
   (king counts) and stands on a square no enemy piece attacks. */
function isForkAfter(board, to) {
  const p = board[to];
  if (p === "") return false;
  const white = isWhitePiece(p);
  const targets = attackSquares(board, to).filter(t =>
    board[t] !== "" && isWhitePiece(board[t]) !== white && board[t].toUpperCase() !== "P");
  return targets.length >= 2 && !isAttacked(board, to, !white);
}

/* Walk each ray of the slider on `sq`; report the first two enemy pieces
   stacked on one ray as {front, back}. */
function rayPairs(board, sq) {
  const p = board[sq];
  const type = p.toUpperCase();
  if (type !== "B" && type !== "R" && type !== "Q") return [];
  const white = isWhitePiece(p);
  const dirs = type === "R" ? ROOK_DIRS : type === "B" ? BISHOP_DIRS : ROOK_DIRS.concat(BISHOP_DIRS);
  const pairs = [];
  for (const [df, dr] of dirs) {
    let t = step(sq, df, dr), front = -1;
    while (t >= 0) {
      if (board[t] !== "") {
        if (isWhitePiece(board[t]) === white) break;
        if (front < 0) { front = t; }
        else { pairs.push({ front, back: t }); break; }
      }
      t = step(t, df, dr);
    }
  }
  return pairs;
}

/* Pin: enemy piece in front is stuck because something bigger (or the king)
   hides behind it. Skewer: the big one is in front and must run. */
function isPinAfter(board, to) {
  return rayPairs(board, to).some(({ front, back }) =>
    board[back].toUpperCase() === "K" || pieceValue(board[back]) > pieceValue(board[front]));
}
function isSkewerAfter(board, to) {
  return rayPairs(board, to).some(({ front, back }) =>
    board[front].toUpperCase() === "K" || pieceValue(board[front]) > pieceValue(board[back]));
}

/* Discovered attack: after the move, the enemy king is in check from a piece
   OTHER than the one that just moved. */
function isDiscoveredAfter(board, to, white) {
  const k = findKing(board, !white);
  if (k < 0 || !inCheck(board, !white)) return false;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (i !== to && p !== "" && isWhitePiece(p) === white && attackSquares(board, i).includes(k)) return true;
  }
  return false;
}

/* Fewest moves for the piece on `from` to reach each square (walls and
   captures respected). -1 = unreachable. Used by the Rook Maze generator. */
function pathDistances(board, from) {
  const piece = board[from];
  const dist = new Array(64).fill(-1);
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const s = queue.shift();
    if (board[s] !== "" && s !== from) continue; // stop expanding past a capture
    const b2 = board.slice();
    b2[from] = "";
    b2[s] = piece;
    for (const t of pieceTargets(b2, s)) {
      if (dist[t] === -1) { dist[t] = dist[s] + 1; queue.push(t); }
    }
  }
  return dist;
}

/* Which pieces of `byWhite` attack this square? (the coach uses these) */
function attackersOf(board, sq, byWhite) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p !== "" && isWhitePiece(p) === byWhite && attackSquares(board, i).includes(sq)) out.push(i);
  }
  return out;
}

/* Which friends could recapture on this piece's square? (its bodyguards) */
function defendersOf(board, sq) {
  const p = board[sq];
  if (p === "") return [];
  const white = isWhitePiece(p);
  const probe = board.slice();
  probe[sq] = white ? "p" : "P"; // stand-in enemy piece
  return attackersOf(probe, sq, white);
}

const Engine = {
  FILES, sqIdx, sqName, fileOf, rankRow,
  isWhitePiece, isBlackPiece, parseFEN,
  attackSquares, isAttacked, findKing, inCheck,
  pieceTargets, legalTargets, applyMove, allLegalMoves,
  isMate, isStalemate,
  pieceValue, isForkAfter, isPinAfter, isSkewerAfter, isDiscoveredAfter,
  attackersOf, defendersOf, pathDistances
};

if (typeof window !== "undefined") window.Engine = Engine;
if (typeof module !== "undefined") module.exports = Engine;
