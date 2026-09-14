// LUMEN ARCANA — optimized decorative particle field for Telegram WebView.
(() => {
  const host = document.querySelector('.stars');
  if (!host) return;
  host.replaceChildren();

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  let w = 1, h = 1, dpr = 1, raf = 0, last = performance.now(), lastDraw = 0;
  let particles = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const countForScreen = () => reduceMotion
    ? 24
    : Math.max(42, Math.min(72, Math.round((innerWidth * innerHeight) / 13500)));

  function newVelocity(min = 5, max = 16) {
    const a = rand(0, Math.PI * 2);
    const s = rand(min, max);
    return { x: Math.cos(a) * s, y: Math.sin(a) * s };
  }

  function makeParticle() {
    const v = newVelocity();
    const bright = Math.random() < 0.12;
    return {
      x: rand(0, w), y: rand(0, h),
      vx: v.x, vy: v.y,
      tx: v.x, ty: v.y,
      r: bright ? rand(1.4, 2.1) : rand(0.7, 1.3),
      alpha: bright ? rand(0.55, 0.82) : rand(0.22, 0.5),
      phase: rand(0, Math.PI * 2),
      phaseSpeed: rand(0.8, 2),
      steerIn: rand(0.8, 2.5),
      bright
    };
  }

  function resize() {
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    dpr = Math.max(1, Math.min(1.5, devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wanted = countForScreen();
    if (particles.length > wanted) particles.length = wanted;
    while (particles.length < wanted) particles.push(makeParticle());
  }

  function chooseDirection(p) {
    const v = newVelocity(p.bright ? 7 : 4, p.bright ? 18 : 13);
    p.tx = v.x;
    p.ty = v.y;
    p.steerIn = rand(0.9, 2.8);
  }

  function draw(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.steerIn -= dt;
      if (p.steerIn <= 0) chooseDirection(p);
      const turn = 1 - Math.pow(0.08, dt);
      p.vx += (p.tx - p.vx) * turn;
      p.vy += (p.ty - p.vy) * turn;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += p.phaseSpeed * dt;

      if (p.x < -8) p.x = w + 8;
      else if (p.x > w + 8) p.x = -8;
      if (p.y < -8) p.y = h + 8;
      else if (p.y > h + 8) p.y = -8;

      const pulse = 0.08 * Math.sin(p.phase);
      const a = Math.max(0.12, Math.min(1, p.alpha + pulse));

      if (p.bright) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239,212,139,' + (a * 0.045) + ')';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.bright
        ? 'rgba(255,240,196,' + a + ')'
        : 'rgba(239,212,139,' + a + ')';
      ctx.fill();
    }
  }

  function frame(now) {
    // Cap decorative rendering near 30 FPS. Scrolling/UI remain native-speed.
    if (now - lastDraw >= 32) {
      draw(now);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  }

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 140);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      lastDraw = 0;
      raf = requestAnimationFrame(frame);
    }
  });

  resize();
  raf = requestAnimationFrame(frame);
})();
