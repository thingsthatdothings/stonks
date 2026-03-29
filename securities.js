/**
 * Securities Configuration
 *
 * US stocks:  https://stockanalysis.com/stocks/{symbol}/
 * US ETFs:    https://stockanalysis.com/etf/{symbol}/
 * CDN:        https://stockanalysis.com/quote/tsx/{symbol}/
 */

const SECURITIES_CONFIG = [
  {
    id: 100,
    type: 'stock',
    exchange: 'tsx',
    symbol: 'td',
  },
  // {
  //   id: 101,
  //   type: 'stock',
  //   exchange: 'tsx',
  //   symbol: 'bce',
  // },
  {
    id: 200,
    type: 'stock',
    symbol: 'aapl',
  },
  // {
  //   id: 201,
  //   type: 'stock',
  //   symbol: 'tsla',
  // },
  // {
  //   id: 300,
  //   type: 'etf',
  //   exchange: 'tsx',
  //   symbol: 'vfv',
  // },
  {
    id: 301,
    type: 'etf',
    exchange: 'tsx',
    symbol: 'xiu',
  },
  // {
  //   id: 400,
  //   type: 'etf',
  //   symbol: 'arkk',
  // },
  {
    id: 401,
    type: 'etf',
    symbol: 'qqq',
  }
];

export default SECURITIES_CONFIG;
