/**
 * grid.js — Data grid module
 *
 * Provides initGrid(container, rows) → GridInstance
 * Supports: sort, per-column filter, column resize, pagination, progressive row updates.
 */

import { formatLargeNumber, formatPrice, formatPercent } from './formatter.js';
import { renderPriceGauge, renderVolumeRatioGauge } from './gauge.js';

// ── Column definitions ────────────────────────────────────────────────────────

/**
 * @typedef {{ key: string, label: string, type: 'common'|'stock'|'etf', width: number, render?: function }} ColDef
 */

/** @type {ColDef[]} */
const COLUMNS = [
  // Common columns
  { key: 'symbol',      label: 'Symbol',       type: 'common', width: 80 },
  { key: 'name',        label: 'Name',         type: 'common', width: 160 },
  { key: 'industry',    label: 'Industry',     type: 'common', width: 140 },
  { key: 'price',       label: 'Price',        type: 'common', width: 80,
    render: r => formatPrice(r.price) },
  { key: 'change',      label: 'Change %',     type: 'common', width: 90,
    render: r => {
      const v = r.change;
      if (v == null || isNaN(v)) return '<span>—</span>';
      const cls = v >= 0 ? 'change-positive' : 'change-negative';
      return `<span class="${cls}">${formatPercent(v)}</span>`;
    }
  },
  { key: 'priceGauge',  label: 'Price 52W',    type: 'common', width: 120,
    render: r => renderPriceGauge(r.price, r.low52w, r.high52w) },
  { key: 'low52w',      label: '52W Low',      type: 'common', width: 80,
    render: r => formatPrice(r.low52w) },
  { key: 'high52w',     label: '52W High',     type: 'common', width: 80,
    render: r => formatPrice(r.high52w) },
  { key: 'volumeGauge', label: 'Volume',       type: 'common', width: 120,
    render: r => renderVolumeRatioGauge(r.volume, r.avgVolume) },

  // Stock-only columns
  { key: 'marketCap',     label: 'Market Cap',    type: 'stock', width: 100,
    render: r => formatLargeNumber(r.marketCap) },
  { key: 'dividendYield', label: 'Div Yield',     type: 'stock', width: 90,
    render: r => formatPercent(r.dividendYield) },
  { key: 'exDivDate',     label: 'Ex-Div Date',   type: 'stock', width: 100 },
  { key: 'earningsDate',  label: 'Earnings Date', type: 'stock', width: 110 },

  // ETF-only columns
  { key: 'mer',       label: 'MER',       type: 'etf', width: 70,
    render: r => formatPercent(r.mer) },
  { key: 'inception', label: 'Inception', type: 'etf', width: 100 },
  { key: 'assets',    label: 'Assets',    type: 'etf', width: 90,
    render: r => formatLargeNumber(r.assets) },
  { key: 'ret5d',  label: '5D',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['5d']) },
  { key: 'ret1m',  label: '1M',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['1m']) },
  { key: 'ret3m',  label: '3M',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['3m']) },
  { key: 'ret6m',  label: '6M',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['6m']) },
  { key: 'ret1y',  label: '1Y',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['1y']) },
  { key: 'ret3y',  label: '3Y',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['3y']) },
  { key: 'ret5y',  label: '5Y',  type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['5y']) },
  { key: 'ret10y', label: '10Y', type: 'etf', width: 65,
    render: r => formatPercent(r.returns?.['10y']) },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the raw sortable value for a column key from a row.
 * @param {object} row
 * @param {string} key
 * @returns {*}
 */
function sortValue(row, key) {
  switch (key) {
    case 'priceGauge':  return row.price;
    case 'volumeGauge': return row.volume;
    case 'ret5d':  return row.returns?.['5d']  ?? null;
    case 'ret1m':  return row.returns?.['1m']  ?? null;
    case 'ret3m':  return row.returns?.['3m']  ?? null;
    case 'ret6m':  return row.returns?.['6m']  ?? null;
    case 'ret1y':  return row.returns?.['1y']  ?? null;
    case 'ret3y':  return row.returns?.['3y']  ?? null;
    case 'ret5y':  return row.returns?.['5y']  ?? null;
    case 'ret10y': return row.returns?.['10y'] ?? null;
    default: return row[key] ?? null;
  }
}

/**
 * Get the plain-text filter value for a column key from a row.
 * @param {object} row
 * @param {string} key
 * @returns {string}
 */
function filterValue(row, key) {
  const v = sortValue(row, key);
  if (v == null) return '';
  return String(v).toLowerCase();
}

/**
 * Compare two sort values (nulls sort last).
 * @param {*} a
 * @param {*} b
 * @param {'asc'|'desc'} dir
 * @returns {number}
 */
function cmp(a, b, dir) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const lt = a < b ? -1 : a > b ? 1 : 0;
  return dir === 'asc' ? lt : -lt;
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

/**
 * Render a cell value for a given column and row.
 * Stock-only columns render blank for ETFs and vice versa.
 * @param {ColDef} col
 * @param {object} row
 * @returns {string}
 */
function renderCell(col, row) {
  if (row.error) return col.key === 'symbol' ? `<span>${row.symbol ?? '?'}</span>` : '';
  if (col.type === 'stock' && row._secType !== 'stock') return '';
  if (col.type === 'etf'   && row._secType !== 'etf')   return '';
  if (col.render) return col.render(row);
  const v = row[col.key];
  return v != null ? String(v) : '—';
}

// ── Grid factory ──────────────────────────────────────────────────────────────

/**
 * Initialise the data grid.
 *
 * @param {HTMLElement} container
 * @param {object[]} initialRows  — array of ParsedData objects (may be empty)
 * @returns {GridInstance}
 */
export function initGrid(container, initialRows = []) {
  // Internal state
  let allRows = initialRows.map(normalise);
  let sortKey = null;
  let sortDir = 'asc';
  let filters = {};   // { [colKey]: string }
  let page = 1;
  let pageSize = 10;
  let colWidths = {};  // { [colKey]: number }

  // Initialise column widths from defaults
  COLUMNS.forEach(c => { colWidths[c.key] = c.width; });

  // ── DOM structure ──────────────────────────────────────────────────────────

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrapper';

  const tableWrap = document.createElement('div');
  tableWrap.style.overflowX = 'auto';

  const table = document.createElement('table');
  table.className = 'grid-table';
  table.setAttribute('role', 'grid');

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  const pagination = document.createElement('div');
  pagination.className = 'grid-pagination';

  wrapper.appendChild(tableWrap);
  wrapper.appendChild(pagination);
  container.appendChild(wrapper);

  // ── Header row (sort) ──────────────────────────────────────────────────────

  const headerRow = document.createElement('tr');

  COLUMNS.forEach(col => {
    const th = document.createElement('th');
    th.dataset.key = col.key;
    th.style.width = colWidths[col.key] + 'px';
    th.style.minWidth = colWidths[col.key] + 'px';
    th.textContent = col.label;
    th.setAttribute('aria-sort', 'none');

    // Sort on click
    th.addEventListener('click', e => {
      if (e.target.classList.contains('resize-handle')) return;
      if (sortKey === col.key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = col.key;
        sortDir = 'asc';
      }
      page = 1;
      render();
    });

    // Resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.setAttribute('aria-hidden', 'true');
    attachResizeHandle(handle, col.key, th);
    th.appendChild(handle);

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  // ── Filter row ─────────────────────────────────────────────────────────────

  const filterRow = document.createElement('tr');
  filterRow.className = 'filter-row';

  COLUMNS.forEach(col => {
    const th = document.createElement('th');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'grid-filter-input';
    input.placeholder = '…';
    input.setAttribute('aria-label', `Filter ${col.label}`);
    input.addEventListener('input', () => {
      filters[col.key] = input.value.trim().toLowerCase();
      page = 1;
      render();
    });
    th.appendChild(input);
    filterRow.appendChild(th);
  });

  thead.appendChild(filterRow);

  // ── Column resize logic ────────────────────────────────────────────────────

  function attachResizeHandle(handle, key, th) {
    let startX = 0;
    let startW = 0;

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startW = th.offsetWidth;

      function onMove(ev) {
        const delta = ev.clientX - startX;
        const newW = Math.max(40, startW + delta);
        colWidths[key] = newW;
        th.style.width = newW + 'px';
        th.style.minWidth = newW + 'px';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ── Render pipeline ────────────────────────────────────────────────────────

  function getFilteredSorted() {
    let rows = allRows.slice();

    // Filter
    const activeFilters = Object.entries(filters).filter(([, v]) => v !== '' && v != null);
    if (activeFilters.length > 0) {
      rows = rows.filter(row =>
        activeFilters.every(([key, term]) =>
          filterValue(row, key).includes(term)
        )
      );
    }

    // Sort
    if (sortKey) {
      rows.sort((a, b) => cmp(sortValue(a, sortKey), sortValue(b, sortKey), sortDir));
    }

    return rows;
  }

  function render() {
    const filtered = getFilteredSorted();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);

    // Update sort indicators on header
    headerRow.querySelectorAll('th').forEach(th => {
      const key = th.dataset.key;
      th.classList.remove('sort-asc', 'sort-desc');
      th.setAttribute('aria-sort', 'none');
      if (key === sortKey) {
        th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
      }
    });

    // Render body rows
    tbody.innerHTML = '';
    pageRows.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.id = row.id;
      if (row.error) tr.classList.add('row-error');

      COLUMNS.forEach(col => {
        const td = document.createElement('td');
        td.innerHTML = renderCell(col, row);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    // Render pagination
    renderPagination(total, totalPages);
  }

  function renderPagination(total, totalPages) {
    pagination.innerHTML = '';

    // Rows-per-page selector
    const label = document.createElement('label');
    label.textContent = 'Rows: ';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '4px';

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Rows per page');
    [5, 10, 25, 50].forEach(n => {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      if (n === pageSize) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      pageSize = Number(select.value);
      page = 1;
      render();
    });
    label.appendChild(select);
    pagination.appendChild(label);

    // Page info
    const info = document.createElement('span');
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    info.textContent = `${start}–${end} of ${total}`;
    pagination.appendChild(info);

    // Prev button
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '‹ Prev';
    btnPrev.disabled = page <= 1;
    btnPrev.setAttribute('aria-label', 'Previous page');
    btnPrev.addEventListener('click', () => { page--; render(); });
    pagination.appendChild(btnPrev);

    // Next button
    const btnNext = document.createElement('button');
    btnNext.textContent = 'Next ›';
    btnNext.disabled = page >= totalPages;
    btnNext.setAttribute('aria-label', 'Next page');
    btnNext.addEventListener('click', () => { page++; render(); });
    pagination.appendChild(btnNext);
  }

  // Initial render
  render();

  // ── GridInstance API ───────────────────────────────────────────────────────

  return {
    /**
     * Add a new row to the grid.
     * @param {object} row — ParsedData object
     */
    addRow(row) {
      allRows.push(normalise(row));
      render();
    },

    /**
     * Update an existing row by id.
     * @param {number|string} id
     * @param {object} row — ParsedData object
     */
    updateRow(id, row) {
      const idx = allRows.findIndex(r => r.id === id);
      if (idx !== -1) {
        allRows[idx] = normalise(row);
      } else {
        allRows.push(normalise(row));
      }
      render();
    },

    /**
     * Mark a row as errored by id.
     * @param {number|string} id
     */
    setError(id) {
      const idx = allRows.findIndex(r => r.id === id);
      if (idx !== -1) {
        allRows[idx] = { ...allRows[idx], error: true };
      } else {
        allRows.push({ id, symbol: String(id), error: true, _secType: 'unknown' });
      }
      render();
    },
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Normalise a ParsedData row, attaching _secType for column visibility.
 * @param {object} row
 * @returns {object}
 */
function normalise(row) {
  // Infer security type: if it has ETF-specific fields it's an ETF, else stock
  const isEtf = row.mer != null || row.inception != null || row.assets != null || row.returns != null;
  const isStock = row.marketCap != null || row.dividendYield != null ||
                  row.exDivDate != null || row.earningsDate != null;

  let secType = 'stock'; // default
  if (isEtf && !isStock) secType = 'etf';
  else if (isStock) secType = 'stock';

  return { ...row, _secType: secType };
}
