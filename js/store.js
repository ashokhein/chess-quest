/* Progress storage: weeks done, game stars, high scores, solved puzzles.
   Persisted to localStorage; every write fires "cq-progress" so the UI refreshes. */

const Store = (function () {
  const KEY = "chess-quest-v1";
  let data = { weeks: {}, stars: {}, best: {}, solved: [], hunts: [], tactics: {}, name: "", muted: false, voiceOff: false };

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* private mode etc — run without persistence */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cq-progress"));
  }

  return {
    isWeekDone(n) { return !!data.weeks[n]; },
    setWeekDone(n, done) { data.weeks[n] = !!done; if (!done) delete data.weeks[n]; save(); },
    weeksDone() { return Object.keys(data.weeks).length; },
    /* highest week marked done + 1 = the "current" stop */
    currentWeek(total) {
      let cur = 1;
      for (let i = 1; i <= total; i++) if (data.weeks[i]) cur = Math.min(i + 1, total);
      return cur;
    },
    landDone(land) { for (let i = land.weeks[0]; i <= land.weeks[1]; i++) if (!data.weeks[i]) return false; return true; },

    gameStars(id) { return data.stars[id] || 0; },
    setGameStars(id, stars) { if (stars > (data.stars[id] || 0)) { data.stars[id] = stars; } save(); },
    totalStars() {
      let s = Object.keys(data.weeks).length;
      for (const k in data.stars) s += data.stars[k];
      return s;
    },

    getBest(id) { return data.best[id] || 0; },
    setBest(id, v) { if (v > (data.best[id] || 0)) { data.best[id] = v; save(); return true; } return false; },

    isSolved(i) { return data.solved.includes(i); },
    setSolved(i) { if (!data.solved.includes(i)) { data.solved.push(i); save(); } },
    solvedCount() { return data.solved.length; },
    resetPuzzles() { data.solved = []; save(); },

    isTacticSolved(pack, i) { return (data.tactics[pack] || []).includes(i); },
    setTacticSolved(pack, i) {
      if (!data.tactics[pack]) data.tactics[pack] = [];
      if (!data.tactics[pack].includes(i)) { data.tactics[pack].push(i); save(); }
    },
    tacticCount(pack) { return (data.tactics[pack] || []).length; },
    resetTactics(pack) { data.tactics[pack] = []; save(); },

    isHuntSolved(i) { return data.hunts.includes(i); },
    setHuntSolved(i) { if (!data.hunts.includes(i)) { data.hunts.push(i); save(); } },
    huntCount() { return data.hunts.length; },
    resetHunts() { data.hunts = []; save(); },

    getName() { return data.name || ""; },
    setName(n) { data.name = String(n || "").trim().slice(0, 16); save(); },

    getMuted() { return !!data.muted; },
    setMuted(m) { data.muted = !!m; save(); },

    getVoiceOn() { return !data.voiceOff; },
    setVoiceOn(on) { data.voiceOff = !on; save(); }
  };
})();

if (typeof window !== "undefined") window.Store = Store;
