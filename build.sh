#!/bin/bash
# Inline css + js + body markup into one file for the Claude artifact
# (artifact pages supply their own <html>/<head>/<body> wrapper).
set -euo pipefail
cd "$(dirname "$0")"

OUT=dist/chess-quest.html
mkdir -p dist

{
  echo "<title>Chess Quest</title>"
  echo "<style>"
  cat css/style.css
  echo "</style>"
  # body markup between the BODY-START / BODY-END markers
  sed -n '/<!-- BODY-START -->/,/<!-- BODY-END -->/p' index.html \
    | grep -v 'BODY-START\|BODY-END'
  echo "<script>"
  cat js/engine.js js/puzzles.js js/curriculum.js js/store.js js/fx.js js/sfx.js js/voice.js js/board.js js/games.js js/app.js
  echo "</script>"
} > "$OUT"

echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
