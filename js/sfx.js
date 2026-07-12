/* Tiny WebAudio sound effects — no audio files. Context is created lazily on
   the first user gesture (autoplay policy). Mute is persisted via Store. */

const SFX = (function () {
  let ctx = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* one enveloped tone */
  function tone(freq, dur, type, delay, vol) {
    const a = ac();
    if (!a || muted) return;
    const t0 = a.currentTime + (delay || 0);
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    setMuted(m) { muted = m; },
    isMuted() { return muted; },
    tap() { tone(500, 0.06, "sine"); },
    move() { tone(240, 0.09, "triangle", 0, 0.16); },
    coin() { tone(880, 0.09, "sine"); tone(1320, 0.12, "sine", 0.07); },
    good() { tone(523, 0.1, "sine"); tone(659, 0.12, "sine", 0.06); },
    bad() { tone(160, 0.18, "triangle", 0, 0.08); },
    chime() { tone(659, 0.12, "sine"); tone(988, 0.22, "sine", 0.1); },
    fanfare() {
      tone(523, 0.12, "triangle"); tone(659, 0.12, "triangle", 0.11);
      tone(784, 0.12, "triangle", 0.22); tone(1047, 0.3, "triangle", 0.33, 0.14);
    }
  };
})();

if (typeof window !== "undefined") window.SFX = SFX;
