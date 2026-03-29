/**
 * parser.js — Parse stockanalysis.com HTML into structured security data
 *
 * Uses DOMParser (browser) or a lightweight DOM walk (test env) to extract
 * fields from the fetched HTML. All fields return null if not found.
 */

/**
 * Parse a number string that may contain commas, currency symbols, or suffixes.
 * Returns null if the string cannot be parsed.
 * @param {string|null|undefined} str
 * @returns {number|null}
 */
function parseNum(str) {
  if (str == null) return null;
  const cleaned = String(str).replace(/[$,\s%]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === 'N/A' || cleaned === '—') return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Parse a string value, returning null for empty/dash/N/A values.
 * @param {string|null|undefined} str
 * @returns {string|null}
 */
function parseStr(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (s === '' || s === '-' || s === 'N/A' || s === '—') return null;
  return s;
}

/**
 * Get text content of the first element whose class attribute contains a given substring.
 * @param {Document} doc
 * @param {string} classSubstr
 * @returns {string|null}
 */
function textByClassSubstring(doc, classSubstr) {
  try {
    const all = doc.querySelectorAll(`[class*="${classSubstr}"]`);
    for (const el of all) {
      const t = el.textContent.trim();
      if (t) return t;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get text content of the first element whose class contains ALL of the given substrings.
 * @param {Document} doc
 * @param {string[]} classSubstrs
 * @returns {string|null}
 */
function textByClassSubstrings(doc, classSubstrs) {
  try {
    const selector = classSubstrs.map(s => `[class*="${s}"]`).join('');
    const all = doc.querySelectorAll(selector);
    for (const el of all) {
      const t = el.textContent.trim();
      if (t) return t;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get text content of the first element matching a CSS selector.
 * @param {Document} doc
 * @param {string} selector
 * @returns {string|null}
 */
function text(doc, selector) {
  try {
    const el = doc.querySelector(selector);
    return el ? el.textContent.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Find a stats table cell value by its label text.
 * stockanalysis.com renders stats in <td> pairs: label | value.
 * @param {Document} doc
 * @param {string} label  — exact or partial label text to match
 * @returns {string|null}
 */
function statByLabel(doc, label) {
  try {
    const cells = doc.querySelectorAll('td');
    for (let i = 0; i < cells.length - 1; i++) {
      if (cells[i].textContent.replace(/\s+/g, ' ').trim() === label) {
        const cell = cells[i + 1];
        const firstTextNode = Array.from(cell.childNodes)
          .find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '');
        return firstTextNode
          ? firstTextNode.textContent.trim()
          : cell.textContent.replace(/\s+/g, ' ').trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find a stats value by searching for a <th> or label element with matching text.
 * Handles the alternate layout where labels are in <th> and values in adjacent <td>.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function statByTh(doc, label) {
  try {
    const headers = doc.querySelectorAll('th');
    for (const th of headers) {
      if (th.textContent.trim() === label) {
        const td = th.nextElementSibling;
        if (td) return td.textContent.trim();
        // Try parent row's next sibling cell
        const row = th.closest('tr');
        if (row) {
          const tds = row.querySelectorAll('td');
          if (tds.length > 0) return tds[0].textContent.trim();
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract a value from a definition list (<dt>/<dd> pairs).
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function statByDt(doc, label) {
  try {
    const dts = doc.querySelectorAll('dt');
    for (const dt of dts) {
      if (dt.textContent.trim() === label) {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === 'DD') return dd.textContent.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find a value where the label is in a <span class="block font-semibold"> and the
 * value is in the immediately following sibling element (<a> or <span>).
 * This matches the "About" section layout on stockanalysis.com.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function statByFontSemibold(doc, label) {
  try {
    const spans = doc.querySelectorAll('span');
    for (const span of spans) {
      if (
        span.textContent.trim() === label &&
        span.className &&
        span.className.includes('font-semibold')
      ) {
        const sibling = span.nextElementSibling;
        if (sibling) return sibling.textContent.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find a value by locating a <tr> whose first <td> exactly matches the label,
 * then returning the text of the second <td> in that row.
 * This is the most reliable strategy for stockanalysis.com stats tables.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
/**
 * Find a value by locating a <tr> whose first <td> exactly matches the label,
 * then returning the text of the second <td> in that row.
 * Scopes search to the stats container div (class contains "order-1") when present,
 * to avoid collisions with repeated labels elsewhere on the page.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function statByRow(doc, label) {
  try {
    let scope = doc;
    const candidates = doc.querySelectorAll('div[class*="order-1"]');
    for (const el of candidates) {
      if (el.querySelector('table')) { scope = el; break; }
    }

    const rows = scope.querySelectorAll('tr');
    for (const row of rows) {
      const tds = row.querySelectorAll('td');
      if (tds.length >= 2 && tds[0].textContent.replace(/\s+/g, ' ').trim() === label) {
        // Use only the first text node to avoid appended <span> content (e.g. "+45.1%")
        const firstTextNode = Array.from(tds[1].childNodes)
          .find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '');
        const val = firstTextNode
          ? firstTextNode.textContent.trim()
          : tds[1].textContent.replace(/\s+/g, ' ').trim();
        if (/\d/.test(val) || val === '—' || val === 'N/A') return val;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Find a value where the label is in a <span class="block"> and the value is in
 * the immediately following <span class="font-semibold"> sibling.
 * Matches the ETF info grid layout on stockanalysis.com.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function statByBlockSpan(doc, label) {
  try {
    const spans = doc.querySelectorAll('span');
    for (const span of spans) {
      if (
        span.textContent.trim() === label &&
        span.className &&
        span.className.includes('block')
      ) {
        const sibling = span.nextElementSibling;
        if (sibling) return sibling.textContent.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try multiple strategies to find a stat value by label.
 * @param {Document} doc
 * @param {string} label
 * @returns {string|null}
 */
function findStat(doc, label) {
  return statByRow(doc, label) || statByLabel(doc, label) || statByTh(doc, label) || statByDt(doc, label) || statByFontSemibold(doc, label) || statByBlockSpan(doc, label) || null;
}

/**
 * Parse the 52-week range string "low - high" into { low, high }.
 * @param {string|null} rangeStr  e.g. "123.45 - 234.56"
 * @returns {{ low: number|null, high: number|null }}
 */
function parse52wRange(rangeStr) {
  if (!rangeStr) return { low: null, high: null };
  const parts = rangeStr.split(/\s*[-–]\s*/);
  if (parts.length < 2) return { low: null, high: null };
  return {
    low: parseNum(parts[0]),
    high: parseNum(parts[parts.length - 1]),
  };
}

/**
 * Parse volume range string into { low, high }.
 * stockanalysis.com may show volume range as "1.23M - 4.56M" with suffix notation.
 * @param {string|null} rangeStr
 * @returns {{ low: number|null, high: number|null }}
 */
function parseVolumeRange(rangeStr) {
  if (!rangeStr) return { low: null, high: null };
  const parts = rangeStr.split(/\s*[-–]\s*/);
  if (parts.length < 2) return { low: null, high: null };
  return {
    low: parseSuffixedNumber(parts[0].trim()),
    high: parseSuffixedNumber(parts[parts.length - 1].trim()),
  };
}

/**
 * Parse a number that may have K/M/B/T suffix.
 * @param {string|null|undefined} str
 * @returns {number|null}
 */
function parseSuffixedNumber(str) {
  if (str == null) return null;
  const s = String(str).replace(/[$,\s]/g, '').trim();
  if (s === '' || s === '-' || s === 'N/A' || s === '—') return null;
  const multipliers = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  const last = s[s.length - 1].toUpperCase();
  if (multipliers[last]) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? null : n * multipliers[last];
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Parse an HTML string from stockanalysis.com into a structured data object.
 *
 * @param {string} html  — raw HTML response text
 * @param {{ id: number, type: string, exchange?: string, symbol: string }} security
 * @returns {object}  — ParsedData (fields are null if not found)
 */
export function parse(html, security) {
  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  } catch {
    return buildEmpty(security);
  }

  // ── Common fields ──────────────────────────────────────────────────────────

  const symbol = parseStr(security.symbol.toUpperCase());

  // Name: <h1> on the page
  const name = parseStr(
    text(doc, 'h1') ||
    text(doc, '[class*="title"]') ||
    null
  );

  // Industry / sector / index tracked
  // For stocks: prefer "Industry", fall back to "Sector"
  // For ETFs: combine "Category" and "Index Tracked" e.g. "US Equity · S&P 500"
  let industry;
  if (security.type === 'etf') {
    const category = parseStr(findStat(doc, 'Category') || null);
    const indexTracked = parseStr(findStat(doc, 'Index Tracked') || null);
    if (category && indexTracked) industry = `${category} · ${indexTracked}`;
    else industry = category || indexTracked || null;
  } else {
    industry = parseStr(
      findStat(doc, 'Industry') ||
      findStat(doc, 'Sector') ||
      text(doc, '[class*="sector"]') ||
      null
    );
  }

  // Price: <div class="text-4xl font-bold ...">126.87</div>
  const priceStr = textByClassSubstring(doc, 'text-4xl') || findStat(doc, 'Price') || null;
  const price = parseNum(priceStr);

  // Change %: <div class="font-semibold inline-block text-2xl text-red-vivid">-1.79 (-1.39%)</div>
  // Find the element that has both text-2xl and font-semibold and contains a parenthesised %
  const changeRaw = textByClassSubstrings(doc, ['text-2xl', 'font-semibold']) || null;
  const changeMatch = changeRaw ? changeRaw.match(/\(([+-]?[0-9.]+)%\)/) : null;
  const change = changeMatch ? parseNum(changeMatch[1]) : null;

  // Volume (current day) — label is "Volume" in a <td> sibling pair
  const volumeStr = findStat(doc, 'Volume') || null;
  const volume = parseNum(volumeStr);

  // Average volume — used for the volume gauge
  const avgVolumeStr = findStat(doc, 'Average Volume') || null;
  const avgVolume = parseNum(avgVolumeStr);

  // 52-week price range — stocks use "52-Week Range" e.g. "78.06 - 136.49"
  // ETFs use separate "52-Week Low" and "52-Week High" rows
  const priceRange52wStr =
    findStat(doc, '52-Week Range') ||
    findStat(doc, '52-Week Low / High') ||
    findStat(doc, '52W Range') ||
    null;
  let low52w, high52w;
  if (priceRange52wStr) {
    ({ low: low52w, high: high52w } = parse52wRange(priceRange52wStr));
  } else {
    low52w  = parseNum(findStat(doc, '52-Week Low')  || null);
    high52w = parseNum(findStat(doc, '52-Week High') || null);
  }

  // 52-week volume range
  const volRange52wStr =
    findStat(doc, 'Volume Range') ||
    findStat(doc, '52-Week Volume Range') ||
    findStat(doc, 'Volume 52W Range') ||
    null;
  const { low: volumeLow52w, high: volumeHigh52w } = parseVolumeRange(volRange52wStr);

  const divRaw =
    findStat(doc, 'Dividend') ||
    findStat(doc, 'Dividend Yield') ||
    findStat(doc, 'Div Yield') ||
    null;
  // Value is like "4.32 (3.36%)" — extract the % inside parentheses
  const divMatch = divRaw ? divRaw.match(/\(([0-9.]+)%\)/) : null;
  const dividendYield = divMatch ? parseNum(divMatch[1]) : parseNum(divRaw ? divRaw.replace('%', '') : null);

  // ── Type-specific fields ───────────────────────────────────────────────────

  let stockFields = {
    marketCap: null,
    exDivDate: null,
    earningsDate: null,
  };

  let etfFields = {
    mer: null,
    inception: null,
    assets: null,
  };

  let returns = {
    '5d': null, '1m': null, '3m': null, '6m': null,
    '1y': null, '3y': null, '5y': null, '10y': null,
  };

  if (security.type === 'stock') {
    const marketCapStr =
      findStat(doc, 'Market Cap') ||
      findStat(doc, 'Mkt Cap') ||
      null;
    stockFields.marketCap = parseSuffixedNumber(marketCapStr);

    stockFields.exDivDate = parseStr(
      findStat(doc, 'Ex-Dividend Date') ||
      findStat(doc, 'Ex-Div Date') ||
      findStat(doc, 'Ex Div Date') ||
      null
    );

    stockFields.earningsDate = parseStr(
      findStat(doc, 'Earnings Date') ||
      findStat(doc, 'Next Earnings') ||
      null
    );  } else if (security.type === 'etf') {
    const merStr =
      findStat(doc, 'Expense Ratio') ||
      findStat(doc, 'MER') ||
      findStat(doc, 'Net Expense Ratio') ||
      null;
    etfFields.mer = parseNum(merStr ? merStr.replace('%', '') : null);

    etfFields.inception = parseStr(
      findStat(doc, 'Inception Date') ||
      findStat(doc, 'Inception') ||
      null
    );
    const assetsStr =
      findStat(doc, 'Net Assets') ||
      findStat(doc, 'Total Assets') ||
      findStat(doc, 'Assets') ||
      null;
    etfFields.assets = parseSuffixedNumber(assetsStr);
  }

  return {
    id: security.id,
    symbol,
    name,
    industry,
    price,
    change,
    low52w,
    high52w,
    volume,
    avgVolume,
    volumeLow52w,
    volumeHigh52w,
    // stock fields (null for ETFs)
    marketCap: security.type === 'stock' ? stockFields.marketCap : null,
    dividendYield,
    exDivDate: security.type === 'stock' ? stockFields.exDivDate : null,
    earningsDate: security.type === 'stock' ? stockFields.earningsDate : null,
    // ETF fields (null for stocks)
    mer: security.type === 'etf' ? etfFields.mer : null,
    inception: security.type === 'etf' ? etfFields.inception : null,
    assets: security.type === 'etf' ? etfFields.assets : null,
    returns: returns,
    error: null,
  };
}

/**
 * Parse TradingView HTML for trailing returns.
 * @param {string} html
 */
export function parseTradingViewReturns(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const map = {
      '5d': '5D', '1m': '1M', '3m': '3M', '6m': '6M',
      '1y': '12M', '3y': '36M', '5y': '60M', '10y': '120M'
    };
    const returns = {};
    let foundAny = false;

    for (const [key, id] of Object.entries(map)) {
      returns[key] = null;
      const btn = doc.querySelector(`button[data-qa-id="time-range-button-${id}"]`);
      if (btn) {
        const spans = btn.querySelectorAll('span');
        for (const span of spans) {
          if (span.className && typeof span.className === 'string' && span.className.includes('change-')) {
            let val = span.textContent.trim().replace('−', '-').replace('%', '').trim();
            val = val.replace(/,/g, '');
            let n = parseFloat(val);
            if (!isNaN(n)) {
              if (val.toUpperCase().includes('K')) n *= 1000;
              returns[key] = n;
              foundAny = true;
            }
            break;
          }
        }
      }
    }
    return foundAny ? returns : null;
  } catch (e) {
    return null;
  }
}

/**
 * Parse ETF trailing returns from Highcharts bar chart aria-labels.
 * Each bar has aria-label="<period>, <value>. <symbol>."
 * e.g. "1 Year, 9.422. VFV." → { '1 Year': 9.422 }
 * @param {Document} doc
 * @returns {Object.<string, number>}
 */
function parseChartReturns(doc) {
  const result = {};
  try {
    const paths = doc.querySelectorAll('path[aria-label]');
    for (const path of paths) {
      const label = path.getAttribute('aria-label');
      if (!label) continue;
      // Format: "1 Year, 9.422. VFV."
      const match = label.match(/^([^,]+),\s*([-+]?[0-9.]+)\./);
      if (match) {
        result[match[1].trim()] = parseFloat(match[2]);
      }
    }
  } catch { /* non-fatal */ }
  return result;
}

/**
 * Try multiple label variants to find a return value in the document.
 * @param {Document} doc
 * @param {string[]} labels
 * @returns {number|null}
 */
function parseReturnValue(doc, labels) {
  for (const label of labels) {
    const val = findStat(doc, label);
    if (val !== null) {
      return parseNum(val.replace('%', '').replace('+', ''));
    }
  }
  return null;
}

/**
 * Build an empty ParsedData object for a security (all fields null).
 * Used as a fallback when parsing fails entirely.
 * @param {{ id: number, type: string, symbol: string }} security
 * @returns {object}
 */
function buildEmpty(security) {
  return {
    id: security.id,
    symbol: security.symbol.toUpperCase(),
    name: null,
    industry: null,
    price: null,
    change: null,
    low52w: null,
    high52w: null,
    volume: null,
    avgVolume: null,
    volumeLow52w: null,
    volumeHigh52w: null,
    marketCap: null,
    dividendYield: null,
    exDivDate: null,
    earningsDate: null,
    mer: null,
    inception: null,
    assets: null,
    returns: { '5d': null, '1m': null, '3m': null, '6m': null, '1y': null, '3y': null, '5y': null, '10y': null },
    error: null,
  };
}
