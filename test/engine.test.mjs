/* Engine + puzzle verification. Run: node test/engine.test.mjs */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const E = require("../js/engine.js");
const { PUZZLES, HUNTS, TACTICS } = require("../js/puzzles.js");

let failures = 0;
function check(label, cond, extra = "") {
  if (cond) {
    console.log("  ok  " + label);
  } else {
    failures++;
    console.log("FAIL  " + label + (extra ? " — " + extra : ""));
  }
}
function names(idxs) { return idxs.map(E.sqName).sort(); }

console.log("square mapping");
check("a8 is index 0", E.sqIdx("a8") === 0);
check("h1 is index 63", E.sqIdx("h1") === 63);
check("e4 round-trips", E.sqName(E.sqIdx("e4")) === "e4");

console.log("knight moves");
{
  const { board } = E.parseFEN("8/8/8/8/8/8/8/1N6 w - - 0 1");
  check("knight b1 -> a3,c3,d2",
    JSON.stringify(names(E.legalTargets(board, E.sqIdx("b1")))) === JSON.stringify(["a3", "c3", "d2"]));
}
{
  const { board } = E.parseFEN("8/8/8/4N3/8/8/8/8 w - - 0 1");
  check("knight e5 has 8 moves", E.legalTargets(board, E.sqIdx("e5")).length === 8);
}

console.log("pawn moves");
{
  const { board } = E.parseFEN("8/8/8/8/8/8/4P3/8 w - - 0 1");
  check("pawn e2 -> e3,e4",
    JSON.stringify(names(E.legalTargets(board, E.sqIdx("e2")))) === JSON.stringify(["e3", "e4"]));
}
{
  const { board } = E.parseFEN("8/8/8/3p4/4P3/8/8/8 w - - 0 1");
  check("pawn e4 can capture d5",
    names(E.legalTargets(board, E.sqIdx("e4"))).includes("d5"));
  check("black pawn d5 can capture e4",
    names(E.legalTargets(board, E.sqIdx("d5"))).includes("e4"));
}
{
  const { board } = E.parseFEN("8/4P3/8/8/8/8/8/8 w - - 0 1");
  const after = E.applyMove(board, E.sqIdx("e7"), E.sqIdx("e8"));
  check("promotion auto-queens", after[E.sqIdx("e8")] === "Q");
}
{
  // no wrap-around: a-file pawn must not "capture" on h-file
  const { board } = E.parseFEN("8/8/8/8/8/7p/P7/8 w - - 0 1");
  check("a2 pawn does not wrap to h3",
    !names(E.legalTargets(board, E.sqIdx("a2"))).includes("h3"));
}

console.log("sliders blocked");
{
  const { board } = E.parseFEN("8/8/8/3R4/8/3P4/8/8 w - - 0 1");
  const t = names(E.legalTargets(board, E.sqIdx("d5")));
  check("rook stops before own pawn", !t.includes("d3") && t.includes("d4"));
}

console.log("check / legality");
{
  // pinned rook may not leave the line
  const { board } = E.parseFEN("4r3/8/8/8/4R3/8/8/4K3 w - - 0 1");
  const t = names(E.legalTargets(board, E.sqIdx("e4")));
  check("pinned rook stays on e-file", t.every(s => s[0] === "e"), t.join(","));
  check("pinned rook can capture the pinner", t.includes("e8"));
}
{
  const { board } = E.parseFEN("4r3/8/8/8/8/8/8/4K3 w - - 0 1");
  check("king in check detected", E.inCheck(board, true));
  const t = names(E.legalTargets(board, E.sqIdx("e1")));
  check("king must leave the e-file", t.every(s => s[0] !== "e"), t.join(","));
}

console.log("stalemate");
{
  // classic corner stalemate: black king a8, white queen c7? no — use Kb6+Qc7 pattern
  const { board } = E.parseFEN("k7/2Q5/1K6/8/8/8/8/8 b - - 0 1");
  check("stalemate detected", E.isStalemate(board, false));
  check("stalemate is not mate", !E.isMate(board, false));
}

console.log("puzzles: every solution is a legal mate-in-1");
for (const pz of PUZZLES) {
  const { board } = E.parseFEN(pz.fen);
  const from = E.sqIdx(pz.solution.slice(0, 2));
  const to = E.sqIdx(pz.solution.slice(2, 4));
  const legalPosition = !E.inCheck(board, false); // black must not already be in check
  const legal = E.legalTargets(board, from).includes(to);
  const mates = legal && E.isMate(E.applyMove(board, from, to), false);
  check(pz.name + " (" + pz.solution + ")", legalPosition && legal && mates,
    (!legalPosition ? "position starts with black in check; " : "") +
    (!legal ? "solution move not legal; " : "") +
    (legal && !mates ? "solution does not mate" : ""));
}

console.log("hunts: exactly one hanging black piece, matching the answer");
for (const h of HUNTS) {
  const { board } = E.parseFEN(h.fen);
  const hanging = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p === "" || E.isWhitePiece(p) || p === "k") continue;
    const attacked = E.isAttacked(board, i, true);
    // defended = some black piece could recapture there (stand-in white pawn)
    const probe = board.slice(); probe[i] = "P";
    const defended = E.isAttacked(probe, i, false);
    if (attacked && !defended) hanging.push(E.sqName(i));
  }
  check("hunt " + h.answer + " (" + h.fen.split(" ")[0] + ")",
    hanging.length === 1 && hanging[0] === h.answer &&
    !E.inCheck(board, false) && !E.inCheck(board, true),
    "hanging=" + hanging.join(",") +
    (E.inCheck(board, false) || E.inCheck(board, true) ? " position has a check" : ""));
}

console.log("path distances (maze)");
{
  // rook a1; wall pawns a2,b2,c2. Direct a-file blocked -> detour costs 3.
  const { board } = E.parseFEN("8/8/8/8/8/8/PPP5/R7 w - - 0 1");
  const d = E.pathDistances(board, E.sqIdx("a1"));
  check("blocked a8 takes 3 moves around", d[E.sqIdx("a8")] === 3, "got " + d[E.sqIdx("a8")]);
  check("own wall square unreachable", d[E.sqIdx("a2")] === -1);
  check("open rank square is 1 move", d[E.sqIdx("h1")] === 1);
}
{
  // capture square reachable but not passable: rook a1, enemy queen a4, target square a8 behind her
  const { board } = E.parseFEN("8/8/8/8/q7/8/8/R7 w - - 0 1");
  const d = E.pathDistances(board, E.sqIdx("a1"));
  check("capture square costs 1", d[E.sqIdx("a4")] === 1);
  check("cannot pass through the enemy", d[E.sqIdx("a8")] !== 1, "got " + d[E.sqIdx("a8")]);
}

console.log("coach helpers");
{
  // hunt case 2 board: black bishop e7 attacked by Re1; knight a6 guarded by pawn b7
  const { board } = E.parseFEN("6k1/1p2bppp/n7/8/8/8/8/4R1K1 w - - 0 1");
  check("attackersOf finds the rook", names(E.attackersOf(board, E.sqIdx("e7"), true)).join(",") === "e1");
  check("bishop e7 has no bodyguards", E.defendersOf(board, E.sqIdx("e7")).length === 0);
  check("knight a6 guarded by b7 pawn", names(E.defendersOf(board, E.sqIdx("a6"))).join(",") === "b7");
}

console.log("tactics: every solution is legal and performs its named trick");
const DETECTOR = {
  fork: (b, to) => E.isForkAfter(b, to),
  pin: (b, to) => E.isPinAfter(b, to),
  skewer: (b, to) => E.isSkewerAfter(b, to),
  disco: (b, to) => E.isDiscoveredAfter(b, to, true)
};
for (const pack in TACTICS) {
  TACTICS[pack].forEach((tc, i) => {
    const { board } = E.parseFEN(tc.fen);
    const from = E.sqIdx(tc.solution.slice(0, 2));
    const to = E.sqIdx(tc.solution.slice(2, 4));
    const cleanStart = !E.inCheck(board, false) && !E.inCheck(board, true);
    const legal = E.legalTargets(board, from).includes(to);
    const works = legal && DETECTOR[pack](E.applyMove(board, from, to), to);
    check(pack + " " + (i + 1) + " (" + tc.solution + ")", cleanStart && legal && works,
      (!cleanStart ? "position starts in check; " : "") +
      (!legal ? "solution not legal; " : "") +
      (legal && !works ? "detector says trick not performed" : ""));
  });
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " FAILURE(S)");
process.exit(failures === 0 ? 0 : 1);
