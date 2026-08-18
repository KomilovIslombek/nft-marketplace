// =====================================================
// PROFILE.JS
// Handles the two profile-page-specific behaviors:
// tab switching (Created / Owned / Collection) and logout.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = await guardProfilePage();
  if (!isLoggedIn) return; // redirect already happened — don't wire up the rest of the page

  setupTabs();
  setupLogout();
  setupChangePassword();
});

function setupChangePassword() {
  const openBtn = document.getElementById('editPasswordBtn');
  const modal = document.getElementById('changePasswordModal');
  const form = document.getElementById('changePasswordForm');
  if (!openBtn || !modal || !form) return;

  const generalError = form.querySelector('.auth-form__general-error');
  const submitBtn = form.querySelector('.auth-form__submit');

  openBtn.addEventListener('click', () => (modal.hidden = false));

  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => (modal.hidden = true));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const values = Object.fromEntries(new FormData(form).entries());
    const errors = {};

    if (!values.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!values.newPassword || values.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    }
    if (values.confirmNewPassword !== values.newPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        const errorEl = form.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = message;
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        generalError.textContent = data.message || 'Something went wrong.';
        generalError.hidden = false;
        return;
      }
      
      form.reset();
      modal.hidden = true;
      alert('Password changed successfully.'); // simple confirmation — swap for a nicer toast later if you want
    } catch (err) {
      console.error('Change password request failed:', err);
      generalError.textContent = 'Could not reach the server. Please try again.';
      generalError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.defaultLabel;
    }
  });
}

function clearFormErrors(form) {
  form.querySelectorAll('.auth-form__error').forEach((el) => (el.textContent = ''));
  const generalError = form.querySelector('.auth-form__general-error');
  if (generalError) {
    generalError.hidden = true;
    generalError.textContent = '';
  }
}

// Checks login status via the same /me endpoint auth-state.js uses.
// If it fails, redirects to login immediately instead of leaving a
// blank/broken profile page visible to a logged-out visitor.
async function guardProfilePage() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      redirectToLogin();
      return false;
    }

    // Confirmed logged in — reveal the page (see the matching CSS note below)
    setUserInfo(response)

    document.body.classList.add('is-authenticated');
    return true;
  } catch (err) {
    console.error('Could not verify login status:', err);
    redirectToLogin();
    return false;
  } finally {
    // If we're staying on this page (not redirecting), reveal it now.
    // If we ARE redirecting, this is harmless — the page is unloading anyway.
    window.hidePageLoader?.();
  }
}

function redirectToLogin() {
  // ?redirect= lets login.html send them back here after they log in,
  // instead of dropping them on the homepage and losing their destination
  window.location.href = `./login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
}

function setupTabs() {
  const tabs = document.querySelectorAll('.profile-tabs__tab');
  const panels = document.querySelectorAll('[data-tab-panel]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== targetTab;
      });
    });
  });
}

function setupLogout() {
  const logoutBtn = document.querySelector('.profile-header__logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // required so the browser actually clears the cookie
      });
    } catch (err) {
      console.error('Logout request failed:', err);
      // Even if the network request fails, still clear local state and
      // redirect — worst case the cookie expires naturally in 7 days anyway
    } finally {
      localStorage.removeItem('user');
      window.location.href = './login.html';
    }
  });
}


// Sets the user info in the profile header after confirming login status
async function setUserInfo(res) {
  const { user } = await res.json();
  if(!user) return;

  const { username, email } = user 
  document.querySelector('.profile-header__name').textContent = username
  document.querySelector('.profile-header__bio-text').textContent = email
  log(user)
}