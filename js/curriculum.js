/* Chess Quest — curriculum data. 5 lands, 24 lessons (one every other day).
   game: id of a playable mini-game for the week (null = play on a real board).
   gameOpts: settings handed to the game when launched from that week. */

const LANDS = [
  {
    id: 1, glyph: "♙", name: "Pawn Meadow", weeks: [1, 4],
    goal: "The board becomes a familiar place and every piece becomes a character.",
    check: "She sets up the board alone, moves every piece correctly, and wins Pawn Wars sometimes."
  },
  {
    id: 2, glyph: "♘", name: "Knight Forest", weeks: [5, 8],
    goal: "The moves become a real game: values, check, and how games actually end.",
    check: "She plays a full legal game, castles without reminders, and calls check."
  },
  {
    id: 3, glyph: "♖", name: "Rook Mountain", weeks: [9, 12],
    goal: "Most kids can start a game; few can finish one. This land is checkmate school.",
    check: "She mates with two rooks and with the queen, and opens by the golden rules."
  },
  {
    id: 4, glyph: "♕", name: "Queen Castle", weeks: [13, 17],
    goal: "One tactic trick per lesson — every one feels like a magic move.",
    check: "She names forks, pins and skewers, and rarely leaves big pieces hanging."
  },
  {
    id: 5, glyph: "♔", name: "King Peak", weeks: [18, 24],
    goal: "Everything comes together: her opening, real endgames, and games against other kids.",
    check: "Full careful games with an opening, tactics and endgame finishes. Club-ready!"
  }
];

const WEEKS = [
  {
    n: 1, land: 1, title: "Board Land", game: "squareRace",
    learn: "Light and dark squares, files a–h, ranks 1–8, diagonals. Set up the board with “white square on the right.”",
    play: "Square Race: someone calls “e4!” and she taps it fast. Then a board-setup race against the clock.",
    spark: "The board is a kingdom map. Let her name the four corner squares — they’re her watchtowers."
  },
  {
    n: 2, land: 1, title: "Rooks & Bishops", game: "rookMaze", gameOpts: { pieces: ["R", "B"] },
    learn: "Rooks slide in straight lines; bishops slide diagonally and live on one color forever. Sliders can never jump over anything.",
    play: "Rook Maze: the prize hides behind walls, so slide AROUND them and catch it in as few moves as you can. Bishop mode too!",
    spark: "Rook is a tower on wheels; bishop is the zig-zag runner who can’t step off his color.",
    diagram: { fen: "8/8/8/3R4/8/8/8/8 w - - 0 1", from: "d5", caption: "Every square the rook can slide to — until a wall gets in the way." }
  },
  {
    n: 3, land: 1, title: "Queen & Knight", game: "coinHop", gameOpts: { pieces: ["N", "Q"] },
    learn: "Queen = rook powers + bishop powers. Knight hops in an L and is the only piece that jumps. Count out loud: “one, two, turn.”",
    play: "Knight Coin Hop — the pony collects every coin. Then queen vs. eight pawns on the real board.",
    spark: "The knight is a pony that jumps fences. Knights take the most practice — extra hops for a few days is normal.",
    diagram: { fen: "8/8/8/4N3/8/8/8/8 w - - 0 1", from: "e5", caption: "The knight’s eight secret landing spots." }
  },
  {
    n: 4, land: 1, title: "Pawns & the King", game: "pawnWars",
    learn: "Pawns walk one step (two from home), capture diagonally, and promote at the end. The king steps one square and can never be captured.",
    play: "Pawn Wars, lots of it: pawns only, first to promote wins. It secretly teaches captures, races and planning.",
    spark: "Every pawn dreams of becoming a queen. Cheer out loud the first time one of hers makes it."
  },
  {
    n: 5, land: 2, title: "Piece Prices", game: "coinHop", gameOpts: { pieces: ["Q", "R", "B", "N", "K"] },
    learn: "Pawn 1, knight 3, bishop 3, rook 5, queen 9. A good trade wins points; a bad trade loses them.",
    play: "Capture battles with mixed pieces on the real board. After every trade, count the points out loud together.",
    spark: "Pieces cost candy: never pay nine candies to get one. She’ll never forget the queen costs nine."
  },
  {
    n: 6, land: 2, title: "Check!", game: null,
    learn: "Check means the king is attacked. Three escapes: run (move the king), shield (block), or fight (capture the attacker).",
    play: "Set up check positions on the real board and let her find all the escapes. She announces “check!” politely in every game.",
    spark: "Run, shield, or fight — let her pick which superhero move fits each puzzle."
  },
  {
    n: 7, land: 2, title: "Checkmate vs. the Sneaky Tie", game: "mateInOne",
    learn: "Checkmate: the king is attacked and has no escape — game over. Stalemate: not in check but no legal moves — a draw that steals wins.",
    play: "Her first mate-in-1 puzzles right here on this page, plus a “mate or stalemate?” quiz on the real board.",
    spark: "Stalemate is the sneaky trap. Make her the trap detective who spots it before it happens."
  },
  {
    n: 8, land: 2, title: "Secret Moves + First Real Game", game: "pawnWars",
    learn: "Castling — the king’s one-time safety jump with the rook. En passant, quickly and lightly. Promotion recap.",
    play: "Her first full game, start to finish, with you playing gently. Castle in every game from now on.",
    spark: "Take a photo of game #1 and start a post-game high-five ritual, win or lose."
  },
  {
    n: 9, land: 3, title: "The Lawnmower", game: "mateInOne",
    learn: "The two-rook ladder mate: rooks take turns pushing the lonely king back, row by row, to the edge.",
    play: "King + two rooks vs. king on the real board until it’s easy, then race a two-minute timer. Ladder puzzles here too.",
    spark: "The rooks mow the lawn, one row at a time. Vroom.",
    diagram: { fen: "7k/R7/1R6/8/8/8/8/6K1 w - - 0 1", caption: "The ladder: one rook holds a row, the other pushes the king back." }
  },
  {
    n: 10, land: 3, title: "The Queen’s Box", game: "mateInOne",
    learn: "King + queen vs. king: the queen shrinks the box around the enemy king, her king walks over to help finish. Watch out for stalemate!",
    play: "Repetitions from different corners. Bonus point every time she pauses to ask “is this stalemate?” before moving.",
    spark: "The queen builds the fence; the king closes the gate."
  },
  {
    n: 11, land: 3, title: "Puzzle Storm", game: "mateInOne",
    learn: "Mate-in-1 with every piece — queen, rook, bishop, knight, even a pawn.",
    play: "Five to ten puzzles a day: the pack here, plus ChessKid or Lichess. Start a puzzle sticker chart.",
    spark: "Beat-your-own-record days: how many puzzles solved by Sunday?"
  },
  {
    n: 12, land: 3, title: "Five Golden Opening Rules", game: "squareRace",
    learn: "1) Fight for the center. 2) Knights and bishops out. 3) Castle early. 4) Queen stays home early. 5) Don’t move the same piece twice.",
    play: "Full games where every golden rule she follows scores a point — she can win the points even if she loses the game.",
    spark: "“Wake up the whole army before the battle.” Sleeping bishops lose wars."
  },
  {
    n: 13, land: 4, title: "The Fork", game: "tacticTrainer", gameOpts: { pack: "fork" },
    learn: "One piece attacks two things at once — the opponent can only save one.",
    play: "Fork puzzles, especially knight forks. Hunt for the famous “royal fork” — king and queen at the same time.",
    spark: "The knight pokes two dinners with one fork. Which one gets eaten?",
    diagram: { fen: "3q3k/8/4N3/8/8/8/8/6K1 w - - 0 1", from: "e6", caption: "Knight on e6 hits the king AND the queen. Royal fork!" }
  },
  {
    n: 14, land: 4, title: "The Pin", game: "tacticTrainer", gameOpts: { pack: "pin" },
    learn: "A piece can’t move because something more precious hides behind it. Pinned pieces are frozen.",
    play: "Pin puzzles, then games where she shouts “frozen!” whenever she pins one of your pieces.",
    spark: "Freeze tag, chess edition."
  },
  {
    n: 15, land: 4, title: "The Skewer", game: "tacticTrainer", gameOpts: { pack: "skewer" },
    learn: "The pin’s big sister: attack the precious piece in front so it must run, then grab what was hiding behind it.",
    play: "Skewer puzzles, plus “pin or skewer?” — she names which trick each position shows.",
    spark: "A shish-kebab: two pieces on one stick."
  },
  {
    n: 16, land: 4, title: "Discovered Attack", game: "tacticTrainer", gameOpts: { pack: "disco" },
    learn: "Move one piece and — surprise! — the piece behind it attacks. Two threats from one move.",
    play: "Discovered attack and discovered check puzzles. These feel like actual magic.",
    spark: "The curtain opens and the archer was hiding behind it all along."
  },
  {
    n: 17, land: 4, title: "The Free-Stuff Detector", game: "hangingHunt",
    learn: "Before every move, two questions: “Is my piece safe there?” and “Is anything free to take?” This habit beats everything else at this age.",
    play: "Games with a slow-move rule: hand hovers, both questions out loud, then move.",
    spark: "Award an official Free-Stuff Detector badge once she catches you hanging a piece."
  },
  {
    n: 18, land: 5, title: "Stop the Four-Move Trick", game: null,
    learn: "Scholar’s Mate — the four-move queen-and-bishop attack on f7 that beats every unprepared kid. See it coming, shut it down.",
    play: "You try the four-move trick in every game until blocking it is automatic.",
    spark: "f7 is the castle’s weak gate. She’s the guard who never falls for it — a superpower at school chess club."
  },
  {
    n: 19, land: 5, title: "Her First Opening", game: null,
    learn: "One recipe, both colors. White: e4, knight f3, bishop c4, castle (the Italian Game). Black against e4: mirror it.",
    play: "The same opening in every game. No memorizing — just a familiar, safe start.",
    spark: "Make her an illustrated “opening recipe card” to keep next to the board.",
    diagram: { fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", caption: "The Italian Game: both sides developed, ready to castle." }
  },
  {
    n: 20, land: 5, title: "The Pawn Race", game: "pawnWars",
    learn: "King + pawn vs. king: the king walks in front of his pawn as a bodyguard and escorts it to promotion. First taste of the kings’ staring contest (opposition).",
    play: "King-and-pawn endings from both sides on the real board; Pawn Wars rematches here.",
    spark: "The bodyguard king walks the little pawn all the way home to be crowned."
  },
  {
    n: 21, land: 5, title: "Winning the Won Game", game: "hangingHunt",
    learn: "When ahead in points: trade pieces, keep pawns, push the passed pawn. Simpler board = safer win.",
    play: "Start positions where she’s up a rook and must convert the win. Being winning and actually winning are different skills.",
    spark: "“You have a full wallet — stop shopping, walk to the checkout.”"
  },
  {
    n: 22, land: 5, title: "Think Like a Champ", game: "mateInOne",
    learn: "The champion’s checklist before every move: Checks, Captures, Threats — mine and theirs. Plus simple notation, so she can write “e4!” like the pros.",
    play: "One slow game with the checklist said out loud both ways. She writes her first scoresheet.",
    spark: "Her own scorebook. Game #1 goes on the fridge."
  },
  {
    n: 23, land: 5, title: "Game Day", game: null,
    learn: "Tournament manners: handshake before and after, touch-move, no takebacks, gracious in victory and defeat.",
    play: "Real games against other kids — ChessKid online, school chess club, or a local club’s kids’ night.",
    spark: "Pick a chess hero together — show her Judit Polgár, the girl who grew up to beat world champions."
  },
  {
    n: 24, land: 5, title: "Boss Battle & Crown", game: "mateInOne",
    learn: "Review her favorite tricks from the whole quest — she picks the highlights.",
    play: "A best-of-three match against you, playing honestly (spot her a piece if needed). Then celebrate, whatever the score.",
    spark: "Print a certificate: “Chess Quest Champion.” Then plan the next adventure — a rated tournament, club membership, or coaching."
  }
];

const GROWN_UPS = {
  recipe: [
    ["3 min", "Warm-up: one puzzle or “show me how the knight moves”"],
    ["7 min", "One new thing (today’s topic — never two)"],
    ["10 min", "Play a game or mini-game together"],
    ["1 min", "High-five + one thing she did well"]
  ],
  rules: [
    "Let her win about half the time at first — losing every game kills the spark. Shrink the help slowly.",
    "Praise the thinking, not the talent: “I love that you checked if your queen was safe.”",
    "Mistakes are detective clues, never scoldings. Ask “what did that piece want to do?”",
    "Every few days, she teaches you something from the plan. Explaining it is how it sticks.",
    "Speed doesn’t matter. A lesson that takes three tries is still a win. Skip nothing, rush nothing."
  ],
  toolbox: [
    ["ChessKid", "Kid-safe app: lessons, puzzles, games vs. other kids. Worth the Gold upgrade."],
    ["Lichess", "Free unlimited puzzles; enable kid mode."],
    ["Story Time Chess", "Board game that teaches pieces through stories — great for the first lessons."],
    ["No Stress Chess", "Card-guided starter game, perfect bridge to real chess."],
    ["“Chess Is Child’s Play”", "The parent’s handbook for teaching this age."]
  ],
  stuck: [
    ["Stuck on a lesson?", "Repeat it with different mini-games. Never push forward on a shaky topic."],
    ["Bored?", "More playing, less teaching. Add extra rest days before dropping to zero."],
    ["Knight moves won’t click?", "Totally normal — five minutes of Coin Hop any day."],
    ["Loves it?", "Add puzzles, not lectures. Then find her a club — kids her age are rocket fuel."]
  ]
};

if (typeof module !== "undefined") module.exports = { LANDS, WEEKS, GROWN_UPS };
