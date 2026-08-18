// =====================================================
// COUNTER.JS
// Count-up animation for numbers, triggered when their
// section scrolls into view. Reusable across any section
// (trending collection badges, hero stats, etc.)
// =====================================================

/**
 * Usage in HTML:
 * <span class="js-counter" data-target="1025" data-suffix="+">0+</span>
 * <span class="js-counter" data-target="240" data-suffix="k+">0k+</span>
 *
 * data-target   -> the final number to count up to
 * data-suffix   -> optional text appended after the number (e.g. "+", "k+")
 * data-duration -> optional animation length in ms (default 1500)
 */

function animateCounter(el) {
  const target = parseFloat(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = parseInt(el.dataset.duration, 10) || 1500;

  // Respect users who've asked for reduced motion: just show the final value
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    el.textContent = `${target}${suffix}`;
    return;
  }

  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // ease-out cubic — starts fast, settles smoothly instead of a linear count
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(eased * target);

    el.textContent = `${currentValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${target}${suffix}`; // lock exact final value, avoids rounding drift
    }
  }

  requestAnimationFrame(tick);
}

function initCounters(root = document) {
  const counters = root.querySelectorAll('.js-counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target); // only animate once per element
        }
      });
    },
    { threshold: 0.4 } // fires once 40% of the element is visible
  );

  counters.forEach((counter) => observer.observe(counter));
}

document.addEventListener('DOMContentLoaded', () => initCounters());