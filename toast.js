/**
 * toast.js — Toast notification module
 * Provides showSuccess, showWarning, showError helpers.
 * Each toast auto-dismisses after 4 seconds.
 */

const DISMISS_MS = 4000;

function show(type, msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', warning: '⚠', error: '✕' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, DISMISS_MS);
}

export function showSuccess(msg) { show('success', msg); }
export function showWarning(msg) { show('warning', msg); }
export function showError(msg)   { show('error',   msg); }
