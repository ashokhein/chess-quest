/* Mate-in-1 puzzle pack. White to move in every puzzle.
   solution is the move we hint toward; the game accepts ANY legal move
   that delivers checkmate. Every entry is verified by test/engine.test.mjs. */

const PUZZLES = [
  {
    fen: "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1", solution: "e1e8",
    name: "Sneak down the hallway", hint: "The back row is wide open — slide all the way!"
  },
  {
    fen: "6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1", solution: "d1d8",
    name: "Queen takes the hallway", hint: "Same trick, stronger piece."
  },
  {
    fen: "6k1/8/6K1/8/8/8/8/Q7 w - - 0 1", solution: "a1a8",
    name: "The queen's fence", hint: "Lock the whole top row. Your king guards the doors."
  },
  {
    fen: "7k/R7/1R6/8/8/8/8/6K1 w - - 0 1", solution: "b6b8",
    name: "The lawnmower", hint: "One rook holds the row — the other one finishes the job."
  },
  {
    fen: "k7/6R1/8/8/8/8/8/5K1R w - - 0 1", solution: "h1h8",
    name: "Lawnmower, other side", hint: "Rooks take turns. Whose turn is it?"
  },
  {
    fen: "7k/Q7/6K1/8/8/8/8/8 w - - 0 1", solution: "a7g7",
    name: "The royal hug", hint: "The queen stands right next to the king — bodyguard behind her."
  },
  {
    fen: "7k/6p1/5N2/8/8/8/8/R5K1 w - - 0 1", solution: "a1a8",
    name: "Knight and rook team up", hint: "The pony already guards the escape squares."
  },
  {
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", solution: "g5f7",
    name: "The smother", hint: "The king is trapped by his own friends. Who can jump in?"
  },
  {
    fen: "kr6/p7/P7/1N6/8/8/8/6K1 w - - 0 1", solution: "b5c7",
    name: "Corner pony", hint: "The king's own army boxes him in. One hop ends it."
  },
  {
    fen: "6rk/6p1/8/8/3Q4/8/8/6K1 w - - 0 1", solution: "d4h4",
    name: "The side door", hint: "The h-file is a wide-open corridor."
  },
  {
    fen: "k7/p1K5/1P6/8/8/8/8/8 w - - 0 1", solution: "b6b7",
    name: "The little giant", hint: "Even the smallest soldier can win the war."
  },
  {
    fen: "2k5/P7/2K5/8/8/8/8/8 w - - 0 1", solution: "a7a8",
    name: "Crowned!", hint: "Walk one more step and the pawn becomes a queen — with checkmate!"
  },
  {
    fen: "k7/p7/2K5/8/8/8/8/1Q6 w - - 0 1", solution: "b1b7",
    name: "The bodyguard queen", hint: "Stand right next to the king — your own king protects you."
  },
  {
    fen: "5k2/8/5K2/8/8/8/8/7R w - - 0 1", solution: "h1h8",
    name: "Box on the edge", hint: "Your king blocks the whole row below. Slide across the top!"
  },
  {
    fen: "4k3/4p3/4K3/8/8/8/8/7R w - - 0 1", solution: "h1h8",
    name: "Trapped in the middle", hint: "His own pawn is in the way — and your king does the rest."
  },
  {
    fen: "k7/8/8/8/7R/8/1R6/6K1 w - - 0 1", solution: "h4a4",
    name: "Ladder lying down", hint: "The ladder works sideways too. One rook holds the b-file…"
  },
  {
    fen: "3k4/8/3K4/8/8/8/8/Q7 w - - 0 1", solution: "a1a8",
    name: "Queen slam", hint: "The kings are staring at each other. Slam the back row!"
  },
  {
    fen: "6k1/6p1/6P1/8/8/8/8/R5K1 w - - 0 1", solution: "a1a8",
    name: "Pawn locks the gate", hint: "Your little pawn guards both escape doors already."
  }
];

/* Hanging-piece positions for the Piece Detective game. White to move;
   exactly one black piece (never the king) is attacked and undefended.
   Uniqueness is machine-verified by the tests. */
const HUNTS = [
  { fen: "6k1/3n1ppp/8/8/8/8/8/3Q2K1 w - - 0 1", answer: "d7",
    story: "The queen stares down the d-file. Someone forgot their bodyguard…" },
  { fen: "6k1/1p2bppp/n7/8/8/8/8/4R1K1 w - - 0 1", answer: "e7",
    story: "One black piece has a friend nearby. The other is all alone." },
  { fen: "6k1/5ppp/8/1q6/8/2N5/8/6K1 w - - 0 1", answer: "b5",
    story: "Even a queen can be free stuff if nobody guards her!" },
  { fen: "2r3k1/5ppp/8/8/8/7B/8/6K1 w - - 0 1", answer: "c8",
    story: "The bishop peeks all the way down the long diagonal." },
  { fen: "6k1/5ppp/8/3n4/2P5/8/8/6K1 w - - 0 1", answer: "d5",
    story: "The littlest attacker! Pawns love catching big ponies." },
  { fen: "6k1/5ppp/8/8/8/2r5/8/2R3K1 w - - 0 1", answer: "c3",
    story: "Two rooks on one road — but only one of them is safe." },
  { fen: "3b2k1/5ppp/8/8/8/8/3R4/3R2K1 w - - 0 1", answer: "d8",
    story: "Double trouble on the d-file. The bishop never saw it coming." },
  { fen: "6k1/5ppp/2n5/8/3N4/8/8/6K1 w - - 0 1", answer: "c6",
    story: "Pony vs. pony! One of them wandered too far from home." }
];

/* Trick Shots packs. White to move; playing the solution (or any move that
   pulls off the same trick — the engine judges) wins the case.
   Verified by tests with the matching Engine.is*After detector. */
const TACTICS = {
  fork: [
    { fen: "r3k3/8/8/1N6/8/8/8/6K1 w - - 0 1", solution: "b5c7",
      story: "The pony sees the king AND the rook. One hop, two dinners!" },
    { fen: "6k1/8/8/2n1n3/8/3P4/8/6K1 w - - 0 1", solution: "d3d4",
      story: "The littlest soldier can poke two ponies at once." },
    { fen: "6k1/1n6/8/8/8/8/8/3Q2K1 w - - 0 1", solution: "d1d5",
      story: "Find the magic square where the queen shouts CHECK and grabs the pony next turn." },
    { fen: "2k1q3/8/8/8/2N5/8/8/6K1 w - - 0 1", solution: "c4d6",
      story: "The royal family fork — king and queen on one fork. The fanciest trick in chess!" }
  ],
  pin: [
    { fen: "4k3/8/2n5/8/8/8/8/5BK1 w - - 0 1", solution: "f1b5",
      story: "Freeze the pony! If it moves, the king behind it is in trouble." },
    { fen: "3k4/8/8/3q4/8/8/8/R3K3 w - - 0 1", solution: "a1d1",
      story: "Pin the queen to her king. If she takes you, your king takes her back!" },
    { fen: "k7/8/2q5/8/2B2N2/8/8/6K1 w - - 0 1", solution: "c4d5",
      story: "The bishop lines up queen and king. Your pony guards the landing spot." }
  ],
  skewer: [
    { fen: "4r3/8/8/4k3/8/8/8/R5K1 w - - 0 1", solution: "a1e1",
      story: "Check! The king must step aside — and look what was hiding behind him." },
    { fen: "q7/8/8/3k4/8/8/4B3/6K1 w - - 0 1", solution: "e2f3",
      story: "A shish-kebab on the long diagonal: king in front, queen behind." },
    { fen: "4q3/8/4k3/8/8/8/8/3Q2K1 w - - 0 1", solution: "d1e2",
      story: "Queens face off — but their king is standing in the middle of the road." }
  ],
  disco: [
    { fen: "4k3/8/8/8/4N3/8/8/4R1K1 w - - 0 1", solution: "e4d6",
      story: "Move the pony and — surprise! — the rook behind him was aiming all along." },
    { fen: "3k4/8/8/3B4/8/8/8/3R2K1 w - - 0 1", solution: "d5c6",
      story: "The bishop steps off the road and the rook thunders down it." },
    { fen: "6k1/8/8/3P4/8/8/B7/6K1 w - - 0 1", solution: "d5d6",
      story: "Even a tiny pawn step can open the curtain for the archer." }
  ]
};

if (typeof window !== "undefined") { window.PUZZLES = PUZZLES; window.HUNTS = HUNTS; window.TACTICS = TACTICS; }
if (typeof module !== "undefined") module.exports = { PUZZLES, HUNTS, TACTICS };
