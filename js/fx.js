/* Confetti bursts on a throwaway fullscreen canvas. Skipped under reduced motion. */

const FX = (function () {
  const COLORS = ["#58B586", "#F2C14E", "#E8734A", "#7BB3E0", "#C77FC9", "#F6F1E3"];

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function burst(originEl, count) {
    if (reduced()) return;
    count = count || 90;

    const canvas = document.createElement("canvas");
    canvas.className = "fx-canvas";
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let x = innerWidth / 2, y = innerHeight / 2.5;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }

    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 4 + Math.random() * 7;
      parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 4,
        s: 4 + Math.random() * 5,
        c: COLORS[i % COLORS.length],
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 60 + Math.random() * 30
      });
    }

    let frame = 0;
    (function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of parts) {
        if (frame > p.life) continue;
        alive++;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.25; p.vx *= 0.99; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - frame / p.life);
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      }
      if (alive > 0) requestAnimationFrame(tick);
      else canvas.remove();
    })();
  }

  return { burst };
})();

if (typeof window !== "undefined") window.FX = FX;
