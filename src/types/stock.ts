export interface Stock {
  symbol: string;
  companyName: string;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  perChange365d: number;
  perChange30d: number;
  lastUpdateTime: string;
  sparklineData: number[];
}

export interface StockData {
  stocks: Stock[];
  indexValue: number;
  indexChange: number;
  indexChangePercent: number;
  timestamp: string;
  source: 'live' | 'simulated';
}

export type SortOption = 'default' | 'gainers' | 'losers' | 'volume';

export type TabType = 'all' | 'gainers' | 'losers' | 'watchlist';
