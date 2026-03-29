/**
 * fetcher.js — URL building, CORS proxy fetching, and progressive load orchestration
 */

import { parse, parseTradingViewReturns } from './parser.js';

const CORS_PROXY = 'https://corsproxy.io/?url=';
const BASE = 'https://stockanalysis.com';

/**
 * Build the stockanalysis.com URL for a security, prefixed with the CORS proxy.
 * @param {{ type: string, exchange?: string, symbol: string }} security
 * @returns {string}
 */
export function buildUrl(security) {
  const sym = security.symbol.toLowerCase();
  let path;
  if (security.exchange === 'tsx') {
    path = `/quote/tsx/${sym}/`;
  } else if (security.type === 'etf') {
    path = `/etf/${sym}/`;
  } else {
    path = `/stocks/${sym}/`;
  }
  return `${CORS_PROXY}${BASE}${path}`;
}

/**
 * Build the statistics page URL for a US stock (non-TSX).
 * Returns null for TSX securities and ETFs.
 * @param {{ type: string, exchange?: string, symbol: string }} security
 * @returns {string|null}
 */
function buildStatsUrl(security) {
  if (security.exchange === 'tsx' || security.type === 'etf') return null;
  const sym = security.symbol.toLowerCase();
  return `${CORS_PROXY}${BASE}/stocks/${sym}/statistics/`;
}

/**
 * Get potential TradingView URLs for a security.
 * @param {{ type: string, exchange?: string, symbol: string }} security
 * @returns {string[]}
 */
function getTradingViewUrls(security) {
  const sym = security.symbol.toUpperCase();
  if (security.exchange === 'tsx') {
    return [`${CORS_PROXY}https://www.tradingview.com/symbols/TSX-${sym}/`];
  }
  return [
    `${CORS_PROXY}https://www.tradingview.com/symbols/NASDAQ-${sym}/`,
    `${CORS_PROXY}https://www.tradingview.com/symbols/NYSE-${sym}/`,
    `${CORS_PROXY}https://www.tradingview.com/symbols/AMEX-${sym}/`
  ];
}

/**
 * Fetch data for a single security.
 * For US stocks, also fetches the /statistics/ page to get Average Volume.
 * Returns null on any error.
 * @param {{ id: number, type: string, exchange?: string, symbol: string }} security
 * @returns {Promise<object|null>}
 */
export async function fetchSecurity(security) {
  try {
    const url = buildUrl(security);
    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();
    const data = parse(html, security);
    if (data === null) return null;

    // Fetch TradingView returns
    const tvUrls = getTradingViewUrls(security);
    for (const tvUrl of tvUrls) {
      try {
        const tvRes = await fetch(tvUrl);
        if (tvRes.ok) {
          const tvHtml = await tvRes.text();
          const tvReturns = parseTradingViewReturns(tvHtml);
          if (tvReturns) {
            data.returns = tvReturns;
            break;
          }
        }
      } catch {
        // ignore and try next url
      }
    }

    // For US stocks, fetch the statistics page to get Average Volume
    const statsUrl = buildStatsUrl(security);
    if (statsUrl && data.avgVolume == null) {
      try {
        const statsRes = await fetch(statsUrl);
        if (statsRes.ok) {
          const statsHtml = await statsRes.text();
          const avgVol = parseAvgVolumeFromStats(statsHtml);
          if (avgVol !== null) data.avgVolume = avgVol;
        }
      } catch {
        // stats page failure is non-fatal
      }
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Parse Average Volume from a /statistics/ page HTML.
 * Looks for a <td title="..."> whose preceding label <span> contains "Average Volume".
 * @param {string} html
 * @returns {number|null}
 */
function parseAvgVolumeFromStats(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr');
    for (const row of rows) {
      const labelSpan = row.querySelector('td span');
      if (labelSpan && labelSpan.textContent.trim().startsWith('Average Volume')) {
        const valueTd = row.querySelectorAll('td')[1];
        if (valueTd) {
          // Prefer the title attribute (full precision), fall back to text
          const raw = valueTd.getAttribute('title') || valueTd.textContent.trim();
          const n = parseFloat(String(raw).replace(/,/g, ''));
          return isNaN(n) ? null : n;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all securities progressively.
 * Calls onResult(result) as each security resolves (result is ParsedData or null).
 * Calls onComplete({ loaded, total }) when all are done.
 * @param {Array} securities
 * @param {{ onResult: Function, onComplete: Function }} callbacks
 */
export async function fetchAll(securities, { onResult, onComplete }) {
  let loaded = 0;
  const total = securities.length;

  await Promise.all(
    securities.map(async (security) => {
      const result = await fetchSecurity(security);
      if (result !== null) loaded++;
      onResult(result, security);
    })
  );

  onComplete({ loaded, total });
}
