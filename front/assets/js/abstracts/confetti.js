// =====================================================
// CONFETTI.JS
// Lightweight, dependency-free confetti burst.
// Reusable anywhere a celebration moment is needed
// (auction ended, purchase complete, form submitted, etc.)
// =====================================================

const COLORS = ['#8C52FF', '#A87BFF', '#FFD166', '#06D6A0', '#EF476F'];

function playSound(soundUrl, volume) {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = volume;

    // .play() returns a Promise — browsers can reject it if autoplay is
    // blocked (e.g. no prior user interaction on the page yet). Catching
    // this means a blocked sound never breaks the confetti animation itself.
    audio.play().catch((err) => {
      console.warn('[confetti] Sound playback was blocked by the browser:', err);
    });
  } catch (err) {
    console.warn('[confetti] Could not play sound:', err);
  }
}

function celebrate({ durationMs = 3000, particleCount = 120, soundUrl = null, soundVolume = 0.5 } = {}) {
  // Respect the same accessibility preference used elsewhere in the project —
  // skip the animation entirely for users who've asked for reduced motion.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  if (soundUrl) {
    playSound(soundUrl, soundVolume);
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none'; // never blocks clicks on the page underneath
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.3,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedY: 2 + Math.random() * 3,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
  }));

  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove(); // clean up — don't leave a dead canvas sitting in the DOM
    }
  }

  requestAnimationFrame(frame);
}

export { celebrate };