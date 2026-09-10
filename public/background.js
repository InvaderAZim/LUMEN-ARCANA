// LUMEN ARCANA — lightweight chaotic particle background.
// Pure canvas renderer: no DOM observers and no click interception.
(() => {
  const host = document.querySelector('.stars');
  if (!host || host.dataset.particlesReady === '1') return;
  host.dataset.particlesReady = '1';
  host.replaceChildren();

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let raf = 0;
  let particles = [];
  let last = performance.now();

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const particleCount = () => {
    const area = window.innerWidth * window.innerHeight;
    const base = Math.round(area / 15000);
    return Math.max(42, Math.min(reducedMotion ? 62 : 96, base));
  };

  const rand = (min, max) => min + Math.random() * (max - min);

  function makeParticle() {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(reducedMotion ? 0.035 : 0.055, reducedMotion ? 0.11 : 0.22);
    return {
      x: rand(0, width),
      y: rand(0, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: rand(0.65, 1.75),
      alpha: rand(0.20, 0.68),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.0007, 0.0022),
      driftAt: rand(280, 1300)
    };
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wanted = particleCount();
    if (particles.length > wanted) particles.length = wanted;
    while (particles.length < wanted) particles.push(makeParticle());
  }

  function redirect(p) {
    const angle = Math.atan2(p.vy, p.vx) + rand(-0.72, 0.72);
    const speed = Math.max(
      reducedMotion ? 0.035 : 0.055,
      Math.min(reducedMotion ? 0.12 : 0.24, Math.hypot(p.vx, p.vy) * rand(0.82, 1.18))
    );
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.driftAt = rand(280, 1300);
  }

  function tick(now) {
    const dt = Math.min(34, Math.max(0, now - last));
    last = now;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.driftAt -= dt;
      if (p.driftAt <= 0) redirect(p);

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.pulse += p.pulseSpeed * dt;

      if (p.x < -8) p.x = width + 8;
      else if (p.x > width + 8) p.x = -8;
      if (p.y < -8) p.y = height + 8;
      else if (p.y > height + 8) p.y = -8;

      const glow = 0.13 * Math.sin(p.pulse);
      const alpha = Math.max(0.08, Math.min(0.82, p.alpha + glow));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239,212,139,${alpha})`;
      ctx.fill();

      if (p.radius > 1.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,212,139,${alpha * 0.035})`;
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(tick);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  });

  resize();
  raf = requestAnimationFrame(tick);
})();
