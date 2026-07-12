# Chess Quest

A chess learning adventure for a 7-year-old: 48 lessons across two tracks,
one every other day (Day 1, Day 3 … Day 95), an animated quest map over nine
lands, player profiles, a printable completion certificate, and playable
mini-games (Square Race, Coin Hop, Rook Maze, Pawn Wars, Mate in 1, Mate in 2,
Piece Detective, Trick Shots). No dependencies, no build step, works offline.

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

Progress (days done, stars, puzzle solves, high scores) is saved per player
profile in the browser's localStorage, so use the same browser to keep it.

## Layout

- `index.html` — page shell
- `css/style.css` — all styling (light + dark theme, print certificate)
- `js/engine.js` — small chess engine: move generation, check, mate & mate-in-2 detection
- `js/puzzles.js` — puzzle packs (mate-in-1, mate-in-2, hunts, tactics), machine-verified by the tests
- `js/curriculum.js` — the 48-lesson plan data (9 lands, 2 tracks)
- `js/store.js` — multi-profile localStorage persistence
- `js/board.js` — tap-to-move board renderer
- `js/games.js` — the mini-games
- `js/app.js` — quest map, stop cards, progress HUD, profiles
- `js/fx.js` — confetti
- `js/sfx.js` — WebAudio sound effects
- `js/voice.js` — coach voice via speech synthesis

## Tests

```bash
node test/engine.test.mjs
```

Verifies engine move rules (pins, promotion, stalemate, no board wrap-around)
and every puzzle pack: each mate-in-1 solution is a legal mate from a legal
position, each mate-in-2 truly forces mate against every defense (and has no
mate-in-1 shortcut), and every tactics solution performs its named trick.

## Build the single-file version

```bash
./build.sh    # writes dist/chess-quest.html (everything inlined)
```
