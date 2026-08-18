// =====================================================
// PAGE-LOADER.JS
// Include this on EVERY page, before auth-state.js / auth-form.js /
// profile.js. Exposes window.hidePageLoader() for those scripts
// to call once they've finished their checks and revealed the real page.
// =====================================================

function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  loader.classList.add('page-loader--hidden');
  setTimeout(() => loader.remove(), 400); // matches the CSS fade duration — cleans up after the transition
}

window.hidePageLoader = hidePageLoader;

// Safety net: if something unexpected happens (a script error elsewhere,
// a slow/failed request with no timeout of its own) never leave a visitor
// stuck staring at the loader forever.
setTimeout(hidePageLoader, 4000);