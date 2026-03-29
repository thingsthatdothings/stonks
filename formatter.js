/**
 * formatter.js — Number, price, percentage, and volume formatting utilities
 */

const DASH = '—';

/**
 * Format a large number with T/B/M/K suffixes.
 * Returns '—' for null/undefined/NaN inputs.
 */
export function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return DASH;
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + 'T';
  if (n >= 1_000_000_000)     return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)         return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)             return (n / 1_000).toFixed(2) + 'K';
  return String(n);
}

/**
 * Format a price to 2 decimal places.
 * Returns '—' for null/undefined/NaN inputs.
 */
export function formatPrice(n) {
  if (n == null || isNaN(n)) return DASH;
  return Number(n).toFixed(2);
}

/**
 * Format a percentage to 2 decimal places with a % suffix.
 * Returns '—' for null/undefined/NaN inputs.
 */
export function formatPercent(n) {
  if (n == null || isNaN(n)) return DASH;
  return Number(n).toFixed(2) + '%';
}

/**
 * Format a volume value with K/M/B suffixes (same as formatLargeNumber).
 * Returns '—' for null/undefined/NaN inputs.
 */
export function formatVolume(n) {
  return formatLargeNumber(n);
}
