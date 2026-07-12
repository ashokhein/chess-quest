/* Coach voice — the browser's built-in speech synthesis. Works offline with
   the system voices; no network, no AI. Toggled from the header. */

const Voice = (function () {
  let enabled = true;
  let voice = null;

  function pickVoice() {
    if (!window.speechSynthesis) return;
    const all = speechSynthesis.getVoices();
    voice =
      all.find(v => /Samantha|Google US English|Zira/i.test(v.name)) ||
      all.find(v => v.lang && v.lang.startsWith("en")) ||
      null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.addEventListener("voiceschanged", pickVoice);
  }

  function plain(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    // drop emoji and symbols the voice would read out loud
    return (d.textContent || "").replace(/[^\p{L}\p{N}\p{P}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }

  return {
    setEnabled(on) {
      enabled = !!on;
      if (!on && window.speechSynthesis) speechSynthesis.cancel();
    },
    isEnabled() { return enabled; },
    say(html) {
      if (!enabled || !window.speechSynthesis) return;
      const text = plain(html);
      if (!text) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1.1;
      u.volume = 0.9;
      speechSynthesis.speak(u);
    },
    stop() { if (window.speechSynthesis) speechSynthesis.cancel(); }
  };
})();

if (typeof window !== "undefined") window.Voice = Voice;
