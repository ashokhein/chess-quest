/* Progress storage v2: multiple player profiles, each with its own progress
   and copy register ("story" for kids, "classic" for adults). Sound and voice
   settings stay device-level. Persisted to localStorage under "chess-quest-v2";
   a "chess-quest-v1" blob from the original single-player build is migrated
   into profile p1 once and never touched again. Every write fires
   "cq-progress" so the UI refreshes. */

const Store = (function () {
  const KEY = "chess-quest-v2";
  const OLD_KEY = "chess-quest-v1";

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function blankProfile() {
    return {
      name: "", mode: "story",
      weeks: {}, stars: {}, best: {},
      solved: [], hunts: [], tactics: {}, solved2: [],
      activity: [], created: todayISO()
    };
  }

  let data = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { /* private mode etc — run without persistence */ }

  if (!data || !data.profiles) {
    data = { active: "p1", seq: 1, muted: false, voiceOff: false, profiles: { p1: blankProfile() } };
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      if (old) {
        const p = data.profiles.p1;
        p.name = String(old.name || "").slice(0, 16);
        p.weeks = Object.assign({}, old.weeks);
        p.stars = Object.assign({}, old.stars);
        p.best = Object.assign({}, old.best);
        p.solved = (old.solved || []).slice();
        p.hunts = (old.hunts || []).slice();
        p.tactics = Object.assign({}, old.tactics);
        data.muted = !!old.muted;
        data.voiceOff = !!old.voiceOff;
      }
    } catch (e) {}
  }
  /* older v2 blobs may predate some fields — backfill them */
  for (const id in data.profiles) {
    data.profiles[id] = Object.assign(blankProfile(), data.profiles[id]);
  }
  if (!data.profiles[data.active]) data.active = Object.keys(data.profiles)[0];
  /* persist immediately so a migrated v1 becomes durable v2 on first load */
  try { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}

  function P() { return data.profiles[data.active]; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cq-progress"));
  }

  /* any real play counts toward today's streak */
  function touch() {
    const d = todayISO();
    if (!P().activity.includes(d)) P().activity.push(d);
  }

  function dayNum(iso) { return Math.round(Date.parse(iso + "T00:00:00Z") / 86400000); }

  return {
    /* ---- profiles ---- */
    profiles() {
      return Object.keys(data.profiles).map(id => ({
        id, name: data.profiles[id].name, mode: data.profiles[id].mode
      }));
    },
    activeId() { return data.active; },
    addProfile(name, mode) {
      const id = "p" + (++data.seq);
      data.profiles[id] = blankProfile();
      data.profiles[id].name = String(name || "").trim().slice(0, 16);
      data.profiles[id].mode = mode === "classic" ? "classic" : "story";
      data.active = id;
      save();
      return id;
    },
    switchProfile(id) {
      if (!data.profiles[id]) return false;
      data.active = id;
      save();
      return true;
    },
    removeProfile(id) {
      if (!data.profiles[id] || Object.keys(data.profiles).length <= 1) return false;
      delete data.profiles[id];
      if (data.active === id) data.active = Object.keys(data.profiles)[0];
      save();
      return true;
    },
    getMode() { return P().mode; },
    setMode(mode) { P().mode = mode === "classic" ? "classic" : "story"; save(); },

    /* ---- lessons ---- */
    isWeekDone(n) { return !!P().weeks[n]; },
    setWeekDone(n, done) {
      P().weeks[n] = !!done;
      if (!done) delete P().weeks[n]; else touch();
      save();
    },
    weeksDone() { return Object.keys(P().weeks).length; },
    /* highest week marked done + 1 = the "current" stop */
    currentWeek(total) {
      let cur = 1;
      for (let i = 1; i <= total; i++) if (P().weeks[i]) cur = Math.min(i + 1, total);
      return cur;
    },
    landDone(land) { for (let i = land.weeks[0]; i <= land.weeks[1]; i++) if (!P().weeks[i]) return false; return true; },
    trackDone(track) {
      const lo = track === 2 ? 25 : 1, hi = track === 2 ? 48 : 24;
      let n = 0;
      for (let i = lo; i <= hi; i++) if (P().weeks[i]) n++;
      return n;
    },

    /* ---- game results ---- */
    gameStars(id) { return P().stars[id] || 0; },
    setGameStars(id, stars) {
      if (stars > (P().stars[id] || 0)) { P().stars[id] = stars; }
      touch(); save();
    },
    totalStars() {
      let s = Object.keys(P().weeks).length;
      for (const k in P().stars) s += P().stars[k];
      return s;
    },

    getBest(id) { return P().best[id] || 0; },
    setBest(id, v) {
      if (v > (P().best[id] || 0)) { P().best[id] = v; touch(); save(); return true; }
      return false;
    },

    isSolved(i) { return P().solved.includes(i); },
    setSolved(i) { if (!P().solved.includes(i)) { P().solved.push(i); touch(); save(); } },
    solvedCount() { return P().solved.length; },
    resetPuzzles() { P().solved = []; save(); },

    isSolved2(i) { return P().solved2.includes(i); },
    setSolved2(i) { if (!P().solved2.includes(i)) { P().solved2.push(i); touch(); save(); } },
    solved2Count() { return P().solved2.length; },
    resetPuzzles2() { P().solved2 = []; save(); },

    isTacticSolved(pack, i) { return (P().tactics[pack] || []).includes(i); },
    setTacticSolved(pack, i) {
      if (!P().tactics[pack]) P().tactics[pack] = [];
      if (!P().tactics[pack].includes(i)) { P().tactics[pack].push(i); touch(); save(); }
    },
    tacticCount(pack) { return (P().tactics[pack] || []).length; },
    resetTactics(pack) { P().tactics[pack] = []; save(); },

    isHuntSolved(i) { return P().hunts.includes(i); },
    setHuntSolved(i) { if (!P().hunts.includes(i)) { P().hunts.push(i); touch(); save(); } },
    huntCount() { return P().hunts.length; },
    resetHunts() { P().hunts = []; save(); },

    /* ---- activity / streak ---- */
    markActivity(dateStr) {
      const d = dateStr || todayISO();
      if (!P().activity.includes(d)) { P().activity.push(d); save(); }
    },
    activityDates() { return P().activity.slice(); },
    /* streak of play-days: alive while gaps stay ≤ 2 days (the quest runs
       every other day, so one rest day never breaks it) */
    streak(today) {
      const t = dayNum(today || todayISO());
      const days = [...new Set(P().activity)].map(dayNum).sort((a, b) => b - a);
      if (!days.length || t - days[0] > 2) return 0;
      let n = 1;
      for (let i = 1; i < days.length && days[i - 1] - days[i] <= 2; i++) n++;
      return n;
    },

    /* ---- identity + device settings ---- */
    getName() { return P().name || ""; },
    setName(n) { P().name = String(n || "").trim().slice(0, 16); save(); },

    getMuted() { return !!data.muted; },
    setMuted(m) { data.muted = !!m; save(); },

    getVoiceOn() { return !data.voiceOff; },
    setVoiceOn(on) { data.voiceOff = !on; save(); }
  };
})();

if (typeof window !== "undefined") window.Store = Store;
if (typeof module !== "undefined") module.exports = Store;
/* Copy register helper. Every profile is "story" (kid copy: ponies, sparks,
   grown-ups) or "classic" (plain adult coaching copy). Same engine, same
   drills — only the words change. Must load after store.js. */

const Copy = (function () {
  function mode() { return Store.getMode(); }
  return {
    mode,
    isStory() { return mode() !== "classic"; },
    t(story, classic) { return mode() === "classic" ? classic : story; }
  };
})();

if (typeof window !== "undefined") window.Copy = Copy;
