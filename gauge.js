/**
 * gauge.js — Visual gauge components for price and volume 52-week range positioning
 */

import { formatPrice, formatVolume } from './formatter.js';

/**
 * Clamp a value between 0 and 100.
 * @param {number} v
 * @returns {number}
 */
function clamp(v) {
  return Math.min(100, Math.max(0, v));
}

/**
 * Compute position percentage within a range.
 * Returns 0 if the range is zero or inputs are invalid.
 * @param {number} value
 * @param {number} low
 * @param {number} high
 * @returns {number} 0–100
 */
export function computePosition(value, low, high) {
  if (value == null || low == null || high == null) return 0;
  if (high <= low) return 0;
  return clamp(((value - low) / (high - low)) * 100);
}

/**
 * Return the CSS class for a price gauge based on position %.
 * ≥ 70  → green
 * 40–69 → amber
 * < 40  → red
 * @param {number} pos
 * @returns {string}
 */
export function priceGaugeClass(pos) {
  if (pos >= 70) return 'gauge-green';
  if (pos >= 40) return 'gauge-amber';
  return 'gauge-red';
}

/**
 * Render a price gauge HTML string.
 * Shows position within the 52-week price range with colour coding and a tooltip.
 *
 * @param {number|null} price
 * @param {number|null} low52w
 * @param {number|null} high52w
 * @returns {string} HTML string
 */
export function renderPriceGauge(price, low52w, high52w) {
  if (price == null || low52w == null || high52w == null) {
    return '<span class="gauge-na">—</span>';
  }

  const pos = computePosition(price, low52w, high52w);
  const colourClass = priceGaugeClass(pos);
  const posStr = pos.toFixed(1);

  const tooltip =
    `Price: ${formatPrice(price)} | ` +
    `52W Low: ${formatPrice(low52w)} | ` +
    `52W High: ${formatPrice(high52w)} | ` +
    `Position: ${posStr}%`;

  return `<div class="gauge-wrap">
  <div class="gauge-track">
    <div class="gauge-bar ${colourClass}" style="width:${posStr}%"></div>
  </div>
  <div class="gauge-tooltip">${tooltip}</div>
</div>`;
}

/**
 * Render a volume ratio gauge: volume as a % of average volume.
 * 100% = at average, >100% = above average (blue gets brighter), <100% = below.
 * Capped at 200% for display purposes.
 *
 * @param {number|null} volume
 * @param {number|null} avgVolume
 * @returns {string} HTML string
 */
export function renderVolumeRatioGauge(volume, avgVolume) {
  if (volume == null || avgVolume == null || avgVolume === 0) {
    return volume != null ? formatVolume(volume) : '—';
  }

  const ratio = (volume / avgVolume) * 100;
  const pos = Math.min(ratio, 200); // cap bar at 200%
  const posStr = pos.toFixed(1);
  const ratioStr = ratio.toFixed(1);

  const tooltip =
    `Volume: ${formatVolume(volume)} | ` +
    `Avg Volume: ${formatVolume(avgVolume)} | ` +
    `Ratio: ${ratioStr}%`;

  return `<div class="gauge-wrap">
  <div class="gauge-track">
    <div class="gauge-bar gauge-blue" style="width:${posStr}%"></div>
  </div>
  <div class="gauge-tooltip">${tooltip}</div>
</div>`;
}

/**
 * Render a volume gauge HTML string.
 * Shows position within the 52-week volume range with a blue gradient and a tooltip.
 *
 * @param {number|null} volume
 * @param {number|null} volLow52w
 * @param {number|null} volHigh52w
 * @returns {string} HTML string
 */
export function renderVolumeGauge(volume, volLow52w, volHigh52w) {
  if (volume == null || volLow52w == null || volHigh52w == null) {
    return '<span class="gauge-na">—</span>';
  }

  const pos = computePosition(volume, volLow52w, volHigh52w);
  const posStr = pos.toFixed(1);

  const tooltip =
    `Volume: ${formatVolume(volume)} | ` +
    `52W Low: ${formatVolume(volLow52w)} | ` +
    `52W High: ${formatVolume(volHigh52w)} | ` +
    `Position: ${posStr}%`;

  return `<div class="gauge-wrap">
  <div class="gauge-track">
    <div class="gauge-bar gauge-blue" style="width:${posStr}%"></div>
  </div>
  <div class="gauge-tooltip">${tooltip}</div>
</div>`;
}
