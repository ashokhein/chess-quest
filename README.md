# Chess Quest

A chess learning adventure for a 7-year-old: 24 lessons, one every other day
(Day 1, Day 3, Day 5 … Day 47), an animated quest map, and six playable
mini-games (Square Race, Coin Hop, Pawn Wars, Mate in 1, Piece Detective,
Trick Shots). No dependencies, no build step, works offline.

## Run it

Open `index.html` in any browser — double-click it, or:

```bash
open index.html            # macOS
```

Prefer a local server? Any static server works:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress (weeks done, stars, puzzle solves, high scores) is saved in the
browser's localStorage, so use the same browser to keep her progress.

## Layout

- `index.html` — page shell
- `css/style.css` — all styling (light + dark theme)
- `js/engine.js` — small chess engine: move generation, check & mate detection
- `js/puzzles.js` — 12 mate-in-1 puzzles, machine-verified by the tests
- `js/curriculum.js` — the 24-week plan data (5 lands)
- `js/board.js` — tap-to-move board renderer
- `js/games.js` — the four mini-games
- `js/app.js` — quest map, stop cards, progress HUD
- `js/store.js` — localStorage persistence
- `js/fx.js` — confetti

## Tests

```bash
node test/engine.test.mjs
```

Verifies engine move rules (pins, promotion, stalemate, no board wrap-around)
and that every puzzle's solution is a legal mate-in-1 from a legal position.

## Build the single-file version

```bash
./build.sh    # writes dist/chess-quest.html (everything inlined)
```
