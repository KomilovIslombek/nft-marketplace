// =====================================================
// CONNECT-WALLET.JS
// This project has no real Web3/wallet integration — clicking a
// provider opens a modal that says so plainly, using the wallet's own
// name (via .textContent, not innerHTML, even though these names are
// hardcoded here — same safe habit as everywhere else user-facing
// text gets set) rather than silently doing nothing or faking success.
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('walletModal');
  const modalText = document.getElementById('walletModalText');
  if (!modal || !modalText) return;

  document.querySelectorAll('.connect-wallet__option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const walletName = btn.dataset.wallet || 'This wallet';
      modalText.textContent = `${walletName} isn't actually connected — this is a portfolio project, not a live exchange, and doesn't include real Web3/wallet integration yet.`;
      modal.hidden = false;
    });
  });

  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => (modal.hidden = true));
  });
});
