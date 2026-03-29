/**
 * app.js — Orchestrator
 *
 * Wires together all modules:
 *   securities.js → fetcher.js → grid.js
 *   cache.js (clear on refresh)
 *   toast.js (load status notifications)
 */

import SECURITIES_CONFIG from './securities.js';
import { fetchAll } from './fetcher.js';
import { initGrid } from './grid.js';
import { showSuccess, showWarning, showError } from './toast.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────


const gridContainer = document.getElementById('grid-container');
const btnRefresh    = document.getElementById('btn-refresh');

// ── State ─────────────────────────────────────────────────────────────────────

/** @type {ReturnType<typeof initGrid> | null} */
let grid = null;

// ── UI helpers ────────────────────────────────────────────────────────────────

function showLoading() {
  gridContainer.hidden = true;
}

function showGrid() {
  gridContainer.hidden = false;
}

// ── Load logic ────────────────────────────────────────────────────────────────

/**
 * Initialise (or re-initialise) the grid and start fetching all securities.
 */
async function load() {
  showLoading();

  // Re-create the grid so the container is clean on refresh/retry
  gridContainer.innerHTML = '';
  grid = initGrid(gridContainer, []);

  await fetchAll(SECURITIES_CONFIG, {
    /**
     * Called as each security resolves (success or failure).
     * @param {object|null} result  — ParsedData or null on error
     * @param {object}      security — the original security config entry
     */
    onResult(result, security) {
      // Reveal the grid as soon as the first result arrives
      if (gridContainer.hidden) showGrid();

      if (result !== null) {
        grid.addRow(result);
      } else {
        grid.setError(security.id);
      }
    },

    /**
     * Called once all securities have resolved.
     * @param {{ loaded: number, total: number }} summary
     */
    onComplete({ loaded, total }) {
      // Make sure the grid is visible even if every fetch failed
      showGrid();

      if (loaded === total) {
        showSuccess(`Loaded ${loaded}/${total} securities`);
      } else if (loaded > 0) {
        showWarning(`Loaded ${loaded}/${total} securities — some failed to load`);
      } else {
        // All failed — show the toast
        showError('Failed to load securities data');
      }
    },
  });
}

// ── Button wiring ─────────────────────────────────────────────────────────────

btnRefresh.addEventListener('click', () => {
  load();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

load();
