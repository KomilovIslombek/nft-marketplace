// =====================================================
// COMPONENTS/SUBSCRIBE-FORM.JS
// The "weekly digest" sign-up forms (homepage + every footer).
//
// There is no newsletter behind them. Without this script, submitting
// did a plain GET to the same page — reloading it with the visitor's
// email address sitting in the URL (and therefore in server logs and
// browser history), while looking like it had worked.
//
// Storing the address would be no better: collecting emails for a
// newsletter that will never be sent isn't honest either. So, like the
// Connect Wallet page, the form stays clickable but says plainly that
// nothing was sent or stored.
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.subscribe-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // never navigate — the email must not end up in a URL

      let note = form.parentElement.querySelector('.subscribe-form__note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'subscribe-form__note';
        note.setAttribute('role', 'status');
        form.insertAdjacentElement('afterend', note);
      }

      note.textContent =
        "The newsletter isn't part of this demo yet — your email wasn't sent or stored anywhere.";
      form.reset();
    });
  });
});
