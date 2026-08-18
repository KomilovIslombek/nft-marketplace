// =====================================================
// AUTH-FORM.JS
// Shared logic for both register.html and login.html.
// Reads the form's data-auth-mode attribute ("register" or "login")
// to decide which fields are required and which API endpoint to call.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // must match your frontend's hostname exactly — see note below

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('.auth-form');
  if (!form) return; // this script may load on pages without a form — bail quietly

  // Guest-only guard: if someone who's already logged in visits
  // login.html or register.html directly, send them onward instead
  // of letting them see the form again.
  const alreadyLoggedIn = await redirectIfAuthenticated();
  if (alreadyLoggedIn) return;

  document.body.classList.add('is-guest'); // reveals the form — see matching CSS note

  const mode = form.dataset.authMode; // "register" or "login"
  const generalError = form.querySelector('.auth-form__general-error');
  const submitBtn = form.querySelector('.auth-form__submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    const validationErrors = validate(values, mode);
    if (Object.keys(validationErrors).length > 0) {
      showFieldErrors(form, validationErrors);
      return;
    }

    setLoading(submitBtn, true);

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const body =
        mode === 'register'
          ? { username: values.username, email: values.email, password: values.password }
          : { email: values.email, password: values.password };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // required so the browser stores/sends the httpOnly auth cookie
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend sends a single message — show it as a general banner
        // rather than guessing which field it belongs to
        showGeneralError(generalError, data.message || 'Something went wrong. Please try again.');
        return;
      }

      // The auth token is now in an httpOnly cookie — JS never sees or stores it.
      // Storing the (non-sensitive) user object is still fine, just for showing
      // "Hi, username" in the nav without needing another API call.
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = getRedirectTarget();
    } catch (err) {
      console.error('Auth request failed:', err);
      showGeneralError(generalError, 'Could not reach the server. Please check your connection.');
    } finally {
      setLoading(submitBtn, false);
    }
  });
});

// Checks if the visitor is already logged in via the same /me endpoint
// auth-state.js uses for the nav. If so, redirects them away from
// login/register entirely instead of showing the form.
async function redirectIfAuthenticated() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });

    if (response.ok) {
      window.location.href = getRedirectTarget();
      return true;
    }

    return false;
  } catch (err) {
    console.error('Could not verify login status:', err);
    return false; // fail open — worst case they just see the login form again
  } finally {
    window.hidePageLoader?.();
  }
}

// Reads ?redirect= from the URL if present (e.g. profile.html sent them
// here after blocking access), otherwise falls back to the profile page.
function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || './profile.html';
}

function validate(values, mode) {
  const errors = {};

  if (mode === 'register') {
    if (!values.username || values.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
  }

  if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password || values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (mode === 'register') {
    if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
}

function showFieldErrors(form, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.querySelector(`[name="${field}"]`);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('is-invalid');
  });
}

function clearErrors(form) {
  form.querySelectorAll('.auth-form__error').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  const generalError = form.querySelector('.auth-form__general-error');
  if (generalError) {
    generalError.hidden = true;
    generalError.textContent = '';
  }
}

function showGeneralError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function setLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Please wait...' : button.dataset.defaultLabel || button.textContent;
}