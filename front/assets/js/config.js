// =====================================================
// CONFIG.JS
// The one place the frontend decides where the API lives, plus a small
// fetch wrapper every page uses to call it. Load this before any other
// script on the page — the others read API_BASE / apiFetch as globals.
//
// Local development: the API runs on port 5000 of the *same hostname*
//   the page was opened on. Same hostname matters: the auth cookie is
//   SameSite=Strict, and 127.0.0.1 vs localhost count as different
//   sites, so a page on localhost:5500 talking to 127.0.0.1:5000 would
//   never get its cookie sent back.
//
// Production: a relative "/api". Netlify proxies /api/* to the Render
//   backend (see netlify.toml), so from the browser's point of view the
//   API is on the same origin as the pages — the cookie is first-party,
//   no third-party-cookie blocking applies, and CORS never comes into it.
// =====================================================

const IS_LOCAL_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE = IS_LOCAL_DEV
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
  : '/api';

// The production API is on Render's free tier, which puts the server to
// sleep after 15 idle minutes and takes up to about a minute to wake.
// Netlify's proxy gives up on a request after roughly 26 seconds and
// answers 502/504, so the first visitor after a quiet spell would
// otherwise just see "couldn't load". Read-only requests are retried
// a few times instead, with a visible note explaining the wait.
const WAKE_RETRY_STATUSES = new Set([502, 503, 504]);
const WAKE_MAX_ATTEMPTS = IS_LOCAL_DEV ? 1 : 4; // locally, fail fast: a stopped backend isn't asleep
const WAKE_RETRY_DELAY_MS = 2000;

/**
 * fetch() against the API. `path` starts with a slash, e.g. '/nfts?limit=3'.
 * Always sends cookies (credentials: 'include') so auth works the same on
 * every call. Only GET/HEAD are retried — retrying a POST that the server
 * may already have processed could, say, register the same account twice.
 */
async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' || method === 'HEAD' ? WAKE_MAX_ATTEMPTS : 1;

  for (let attempt = 1; ; attempt += 1) {
    const isLastAttempt = attempt >= maxAttempts;

    try {
      const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });

      if (!isLastAttempt && WAKE_RETRY_STATUSES.has(response.status)) {
        showWakeNotice();
        await wait(WAKE_RETRY_DELAY_MS);
        continue;
      }

      hideWakeNotice();
      return response;
    } catch (err) {
      // Network-level failure (server unreachable). Same treatment.
      if (isLastAttempt) {
        hideWakeNotice();
        throw err;
      }
      showWakeNotice();
      await wait(WAKE_RETRY_DELAY_MS);
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showWakeNotice() {
  let notice = document.getElementById('apiWakeNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'apiWakeNotice';
    notice.className = 'wake-notice';
    notice.setAttribute('role', 'status');
    notice.textContent =
      'Waking up the server — this demo runs on free hosting that sleeps when idle. This can take up to a minute.';
    document.body.appendChild(notice);
  }
  notice.hidden = false;
}

function hideWakeNotice() {
  const notice = document.getElementById('apiWakeNotice');
  if (notice) notice.hidden = true;
}
