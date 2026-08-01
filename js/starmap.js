/* ═══════════════════════════════════════════════════════════
   STARMAP.JS — Animated star canvas + constellation map
   ═══════════════════════════════════════════════════════════ */

'use strict';

const StarCanvas = (() => {
  const canvases = {};
  const animFrames = {};

  /* ── Generic star field ── */
  function createStarField(canvasEl, opts = {}) {
    const {
      count       = 200,
      speed       = 0.3,
      maxSize     = 2.5,
      colors      = ['#f0f0ff','#c5b3e8','#e8b89d','#f9e785'],
      shooting    = true,
      nebula      = true,
    } = opts;

    const ctx = canvasEl.getContext('2d');
    let w, h, stars = [], shooters = [];

    function resize() {
      w = canvasEl.width  = canvasEl.offsetWidth  || window.innerWidth;
      h = canvasEl.height = canvasEl.offsetHeight || window.innerHeight;
      init();
    }

    function init() {
      stars = Array.from({ length: count }, () => ({
        x:    Math.random() * w,
        y:    Math.random() * h,
        r:    Math.random() * maxSize + 0.3,
        vx:   (Math.random() - 0.5) * speed * 0.5,
        vy:   (Math.random() - 0.5) * speed * 0.5,
        alpha: Math.random(),
        dAlpha: (Math.random() * 0.008 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function spawnShooter() {
      shooters.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.5,
        vx: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1),
        vy: Math.random() * 3 + 1,
        alpha: 1,
        len: Math.random() * 80 + 40,
        life: 1,
      });
    }

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Nebula background
      if (nebula && w > 0 && h > 0) {
        const r1 = Math.max(1, w * 0.7);
        const r2 = Math.max(1, w * 0.5);
        const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, r1);
        grad.addColorStop(0, 'rgba(45,27,78,0.35)');
        grad.addColorStop(0.5, 'rgba(15,32,68,0.2)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const grad2 = ctx.createRadialGradient(w * 0.7, h * 0.7, 0, w * 0.7, h * 0.7, r2);
        grad2.addColorStop(0, 'rgba(61,16,64,0.25)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);
      }

      // Stars
      stars.forEach(s => {
        s.alpha = clamp(s.alpha + s.dAlpha, 0.05, 1);
        if (s.alpha <= 0.05 || s.alpha >= 1) s.dAlpha *= -1;

        s.x = (s.x + s.vx + w) % w;
        s.y = (s.y + s.vy + h) % h;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Shooting stars
      if (shooting && frame % 300 === 0 && Math.random() > 0.4) spawnShooter();

      shooters = shooters.filter(s => s.life > 0);
      shooters.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.alpha * s.life;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4);
        ctx.stroke();
        ctx.restore();

        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
      });

      frame++;
    }

    let rafId;
    function loop() {
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      resize();
      loop();
      window.addEventListener('resize', resize);
    }

    function stop() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    }

    return { start, stop };
  }

  /* ── Chapter-specific colored star field ── */
  function createChapterBg(canvasEl, accentColor = '#c2876a') {
    const ctx = canvasEl.getContext('2d');
    let w, h, particles = [];

    function resize() {
      w = canvasEl.width  = canvasEl.offsetWidth  || window.innerWidth;
      h = canvasEl.height = canvasEl.offsetHeight || window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = Array.from({ length: 120 }, () => ({
        x:      Math.random() * w,
        y:      Math.random() * h,
        r:      Math.random() * 2 + 0.3,
        alpha:  Math.random() * 0.8 + 0.1,
        dAlpha: (Math.random() * 0.01 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        color:  Math.random() > 0.7 ? accentColor : '#f0f0ff',
      }));
    }

    let rafId;
    function loop() {
      ctx.clearRect(0, 0, w, h);

      // Nebula glow
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.6);
      g.addColorStop(0, `${accentColor}15`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      particles.forEach(p => {
        p.alpha = clamp(p.alpha + p.dAlpha, 0.05, 0.95);
        if (p.alpha <= 0.05 || p.alpha >= 0.95) p.dAlpha *= -1;
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      rafId = requestAnimationFrame(loop);
    }

    function start() {
      resize();
      loop();
      window.addEventListener('resize', resize);
    }

    function stop() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    }

    return { start, stop };
  }

  /* ── Preloader star canvas ── */
  function createPreloaderStars(canvasEl) {
    return createStarField(canvasEl, { count: 150, speed: 0.15, nebula: true, shooting: false });
  }

  return { createStarField, createChapterBg, createPreloaderStars, canvases, animFrames };
})();

window.StarCanvas = StarCanvas;
