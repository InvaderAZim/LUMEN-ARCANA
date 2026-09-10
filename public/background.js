// LUMEN ARCANA — clearly visible chaotic particle field.
// Canvas only: no click handlers, no MutationObserver, no app DOM rewrites.
(() => {
  const host = document.querySelector('.stars');
  if (!host) return;
  host.replaceChildren();

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let w = 1, h = 1, dpr = 1, raf = 0, last = performance.now();
  let particles = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const countForScreen = () => Math.max(85, Math.min(150, Math.round((innerWidth * innerHeight) / 6500)));

  function newVelocity(min = 9, max = 30) {
    const a = rand(0, Math.PI * 2);
    const s = rand(min, max);
    return { x: Math.cos(a) * s, y: Math.sin(a) * s };
  }

  function makeParticle() {
    const v = newVelocity();
    const bright = Math.random() < 0.18;
    return {
      x: rand(0, w), y: rand(0, h),
      vx: v.x, vy: v.y,
      tx: v.x, ty: v.y,
      r: bright ? rand(1.7, 2.7) : rand(0.9, 1.7),
      alpha: bright ? rand(0.62, 0.92) : rand(0.28, 0.64),
      phase: rand(0, Math.PI * 2),
      phaseSpeed: rand(1.2, 3.1),
      steerIn: rand(0.35, 1.8),
      bright
    };
  }

  function resize() {
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wanted = countForScreen();
    if (particles.length > wanted) particles.length = wanted;
    while (particles.length < wanted) particles.push(makeParticle());
  }

  function chooseDirection(p) {
    const v = newVelocity(p.bright ? 12 : 8, p.bright ? 34 : 28);
    p.tx = v.x;
    p.ty = v.y;
    p.steerIn = rand(0.35, 1.8);
  }

  function frame(now) {
    const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
    last = now;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.steerIn -= dt;
      if (p.steerIn <= 0) chooseDirection(p);

      // Smooth random steering gives a real wandering trajectory instead of straight-line drift.
      const turn = 1 - Math.pow(0.035, dt);
      p.vx += (p.tx - p.vx) * turn;
      p.vy += (p.ty - p.vy) * turn;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += p.phaseSpeed * dt;

      if (p.x < -12) p.x = w + 12;
      else if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12;
      else if (p.y > h + 12) p.y = -12;

      const pulse = 0.12 * Math.sin(p.phase);
      const a = Math.max(0.16, Math.min(1, p.alpha + pulse));

      // A short translucent tail makes movement visible even on high-density mobile screens.
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.16, p.y - p.vy * 0.16);
      ctx.strokeStyle = `rgba(239,212,139,${a * 0.18})`;
      ctx.lineWidth = Math.max(0.5, p.r * 0.45);
      ctx.stroke();

      if (p.bright) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,212,139,${a * 0.065})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.bright
        ? `rgba(255,240,196,${a})`
        : `rgba(239,212,139,${a})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  }

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  resize();
  raf = requestAnimationFrame(frame);
})();
