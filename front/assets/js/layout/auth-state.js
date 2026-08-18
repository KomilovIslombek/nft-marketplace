// =====================================================
// AUTH-STATE.JS
// Runs on every page. Asks the backend whether the visitor
// is logged in (since the token is httpOnly, JS can never
// check this directly), then toggles the nav accordingly.
//
// Expects this nav structure to exist on the page:
// <div class="nav__auth" id="navAuthGuest"> ... Log in / Sign Up ... </div>
// <div class="nav__auth" id="navAuthUser" hidden>
//   <a href="./profile.html" class="nav__profile-btn">
//     <img id="navProfileAvatar" class="nav__profile-avatar" alt="">
//     <span id="navProfileUsername"></span>
//   </a>
// </div>
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // keep this in sync with auth-form.js

document.addEventListener('DOMContentLoaded', checkAuthState);

async function checkAuthState() {
  try {
    const guestNav = document.getElementById('navAuthGuest');
    const userNav = document.getElementById('navAuthUser');

    // Pages without a nav (or without these specific IDs) just skip this quietly
    if (!guestNav || !userNav) return;

    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include', // sends the httpOnly cookie along with the request
    });

    if (!response.ok) {
      showGuestNav(guestNav, userNav);
      return;
    }

    const data = await response.json();
    showUserNav(guestNav, userNav, data.user);
  } catch (err) {
    // Network error (backend down, etc.) — fail safe to the guest view
    console.error('Could not check auth state:', err);
    const guestNav = document.getElementById('navAuthGuest');
    const userNav = document.getElementById('navAuthUser');
    if (guestNav && userNav) showGuestNav(guestNav, userNav);
  } finally {
    // Runs no matter which path above was taken — this page's part of the
    // "is it ready to show?" check is done, whether or not a nav even exists here
    window.hidePageLoader?.();
  }
}

function showGuestNav(guestNav, userNav) {
  guestNav.hidden = false;
  userNav.hidden = true;
  localStorage.removeItem('user'); // clear any stale cached user data
}

function showUserNav(guestNav, userNav, user) {
  guestNav.hidden = true;
  userNav.hidden = false;
  localStorage.setItem('user', JSON.stringify(user));

  const usernameEl = document.getElementById('navProfileUsername');
  const avatarEl = document.getElementById('navProfileAvatar');

  if (usernameEl) usernameEl.textContent = user.username;
  if (avatarEl) {
    // Falls back to a generated placeholder avatar if the user has no photo yet —
    // avoids a broken image icon in the nav
    avatarEl.src = user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`;
    avatarEl.alt = user.username;
  }
}