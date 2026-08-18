// =====================================================
// COUNTDOWN.JS
// Reusable countdown timer module.
// Auto-initializes every [data-countdown] element on the page —
// drop the markup anywhere, and it just works.
//
// Persists "ended" state in localStorage (keyed by data-storage-key)
// so that:
//   - the celebration animation only ever plays once per visitor
//   - reloading the page after the auction ends never shows
//     a live ticking timer again — just the ended state
//
// Usage in HTML:
// <div class="countdown"
//      data-countdown
//      data-target="2026-08-03T18:00:00"
//      data-storage-key="magic-mushroom-auction">
//   <p class="countdown__label">Auction ends in:</p>
//   <div class="countdown__row">
//     <div class="countdown__unit">
//       <span class="countdown__value" data-unit="hours">00</span>
//       <span class="countdown__unit-label">Hours</span>
//     </div>
//     <span class="countdown__separator">:</span>
//     <div class="countdown__unit">
//       <span class="countdown__value" data-unit="minutes">00</span>
//       <span class="countdown__unit-label">Minutes</span>
//     </div>
//     <span class="countdown__separator">:</span>
//     <div class="countdown__unit">
//       <span class="countdown__value" data-unit="seconds">00</span>
//       <span class="countdown__unit-label">Seconds</span>
//     </div>
//   </div>
// </div>
//
// Multiple countdowns on the same page work automatically —
// just give each one a different data-storage-key.
// =====================================================

import { celebrate } from './confetti.js';

const MS_IN_HOUR = 3600000;
const MS_IN_MINUTE = 60000;
const MS_IN_SECOND = 1000;

function getTimeParts(ms) {
  const hours = Math.floor(ms / MS_IN_HOUR);
  const msLeftAfterHours = ms - hours * MS_IN_HOUR;

  const minutes = Math.floor(msLeftAfterHours / MS_IN_MINUTE);
  const msLeftAfterMinutes = msLeftAfterHours - minutes * MS_IN_MINUTE;

  const seconds = Math.floor(msLeftAfterMinutes / MS_IN_SECOND);

  return { hours, minutes, seconds };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

class Countdown {
  constructor(el) {
    this.el = el;
    this.target = new Date(el.dataset.target).getTime();
    this.storageKey = el.dataset.storageKey || null;
    this.endedFlagKey = this.storageKey ? `countdown-ended:${this.storageKey}` : null;

    this.hoursEl = el.querySelector('[data-unit="hours"]');
    this.minutesEl = el.querySelector('[data-unit="minutes"]');
    this.secondsEl = el.querySelector('[data-unit="seconds"]');

    // Optional — omit data-sound on any countdown that shouldn't play audio
    this.soundUrl = el.dataset.sound || null;

    this.timerId = null;

    this.init();
  }

  hasAlreadyEnded() {
    if (!this.endedFlagKey) return false;
    return localStorage.getItem(this.endedFlagKey) === 'true';
  }

  markAsEnded() {
    if (this.endedFlagKey) {
      localStorage.setItem(this.endedFlagKey, 'true');
    }
  }

  init() {
    // Already known (from a previous visit) that this ended, OR the
    // target date has already passed on this very first check —
    // either way, skip the live countdown and never replay the celebration.
    if (this.hasAlreadyEnded() || this.target - Date.now() <= 0) {
      this.markAsEnded();
      this.renderEnded(false); // false = don't celebrate, already seen or already past
      return;
    }

    this.tick(); // run once immediately — no flash of 00:00:00
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  tick() {
    const duration = this.target - Date.now();

    if (duration <= 0) {
      clearInterval(this.timerId);
      this.markAsEnded();
      this.renderEnded(true); // true = celebrate — this is the live moment it hit zero
      return;
    }

    const { hours, minutes, seconds } = getTimeParts(duration);
    this.hoursEl.textContent = pad(hours);
    this.minutesEl.textContent = pad(minutes);
    this.secondsEl.textContent = pad(seconds);
  }

  renderEnded(shouldCelebrate) {
    // Generic state hook — "is-ended" instead of a BEM-specific class,
    // so this module works no matter what block name a project uses
    // for its countdown container (auction__timer, countdown, etc.)
    this.el.classList.add('is-ended');
    this.el.innerHTML = `<p class="timer-ended-message">🎉 Auction Ended</p>`;

    if (shouldCelebrate) {
      celebrate({ soundUrl: this.soundUrl });
    }
  }
}

function initCountdowns(root = document) {
  root.querySelectorAll('[data-countdown]').forEach((el) => new Countdown(el));
}

document.addEventListener('DOMContentLoaded', () => initCountdowns());

export { Countdown, initCountdowns };