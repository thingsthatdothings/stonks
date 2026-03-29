/**
 * Securities Configuration
 *
 * US stocks:  https://stockanalysis.com/stocks/{symbol}/
 * US stats:   https://stockanalysis.com/stocks/{symbol}/statistics/
 * US ETFs:    https://stockanalysis.com/etf/{symbol}/
 * CDN:        https://stockanalysis.com/quote/tsx/{symbol}/
 * Returns:    https://www.tradingview.com/symbols/{exchange}-{symbol}/
 */

const SECURITIES_CONFIG = [
  {
    "id": 100,
    "symbol": "TD",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 101,
    "symbol": "CM",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 102,
    "symbol": "BMO",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 103,
    "symbol": "RY",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 104,
    "symbol": "BNS",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 201,
    "symbol": "T",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 202,
    "symbol": "BCE",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 203,
    "symbol": "RCI.B",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 302,
    "symbol": "TRP",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 303,
    "symbol": "SU",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 304,
    "symbol": "ENB",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 400,
    "symbol": "CHP.UN",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 401,
    "symbol": "REI.UN",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 500,
    "symbol": "CP",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 501,
    "symbol": "CNR",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 502,
    "symbol": "DOL",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 503,
    "symbol": "ATD",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 504,
    "symbol": "SHOP",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 505,
    "symbol": "QSR",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 507,
    "symbol": "CTC.A",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 508,
    "symbol": "L",
    "type": "stock",
    "exchange": "tsx"
  },
  {
    "id": 600,
    "symbol": "TSLA",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 601,
    "symbol": "DIS",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 602,
    "symbol": "AAPL",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 603,
    "symbol": "NFLX",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 604,
    "symbol": "V",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 605,
    "symbol": "MA",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 606,
    "symbol": "MSFT",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 607,
    "symbol": "WMT",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 608,
    "symbol": "COST",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 609,
    "symbol": "DEO",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 610,
    "symbol": "AMZN",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 611,
    "symbol": "HD",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 614,
    "symbol": "MCD",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 615,
    "symbol": "KO",
    "type": "stock",
    "exchange": "nyse"
  },
  {
    "id": 616,
    "symbol": "AMD",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 617,
    "symbol": "NVDA",
    "type": "stock",
    "exchange": "nasdaq"
  },
  {
    "id": 620,
    "symbol": "GOOG",
    "type": "stock",
    "exchange": "nasdaq"
  },

  {
    "id": 700,
    "symbol": "XIU",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 701,
    "symbol": "XIC",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 702,
    "symbol": "ZCN",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 703,
    "symbol": "VCN",
    "type": "etf",
    "exchange": "tsx"
  },

  {
    "id": 800,
    "symbol": "CSAV",
    "type": "etf",
    "desc": "Bonds",
    "exchange": "tsx"
  },
  {
    "id": 801,
    "symbol": "ZAG",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 802,
    "symbol": "XBB",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 803,
    "symbol": "VAB",
    "type": "etf",
    "exchange": "tsx"
  },

  {
    "id": 900,
    "symbol": "ZSP",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 901,
    "symbol": "VFV",
    "type": "etf",
    "desc": "S+P",
    "exchange": "tsx"
  },
  {
    "id": 902,
    "symbol": "VUN",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 903,
    "symbol": "XSP",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 904,
    "symbol": "XUS",
    "type": "etf",
    "exchange": "tsx"
  },

  {
    "id": 1000,
    "symbol": "XEF",
    "type": "etf",
    "exchange": "tsx"
  },
  {
    "id": 1001,
    "symbol": "ZEA",
    "type": "etf",
    "exchange": "tsx"
  },

  {
    "id": 1800,
    "symbol": "QQQ",
    "type": "etf",
    "exchange": "nasdaq"
  },
  {
    "id": 1801,
    "symbol": "ARKK",
    "type": "etf",
    "exchange": "cboe"
  }
];

export default SECURITIES_CONFIG;
