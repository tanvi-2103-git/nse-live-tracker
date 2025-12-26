import { useMemo } from 'react';
import { StockRow } from './StockRow';
import { StockTableSkeleton } from './StockTableSkeleton';
import { Stock, SortOption, TabType } from '@/types/stock';
import { cn } from '@/lib/utils';

interface StockTableProps {
  stocks: Stock[];
  isLoading: boolean;
  searchQuery: string;
  sortOption: SortOption;
  activeTab: TabType;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export function StockTable({
  stocks,
  isLoading,
  searchQuery,
  sortOption,
  activeTab,
  watchlist,
  onToggleWatchlist,
}: StockTableProps) {
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stocks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.companyName.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'gainers':
        result = result.filter((stock) => stock.pChange > 0);
        break;
      case 'losers':
        result = result.filter((stock) => stock.pChange < 0);
        break;
      case 'watchlist':
        result = result.filter((stock) => watchlist.includes(stock.symbol));
        break;
    }

    // Sort
    switch (sortOption) {
      case 'gainers':
        result.sort((a, b) => b.pChange - a.pChange);
        break;
      case 'losers':
        result.sort((a, b) => a.pChange - b.pChange);
        break;
      case 'volume':
        result.sort((a, b) => b.totalTradedVolume - a.totalTradedVolume);
        break;
      default:
        // Keep default order (by index weight)
        break;
    }

    return result;
  }, [stocks, searchQuery, sortOption, activeTab, watchlist]);

  if (isLoading) {
    return <StockTableSkeleton />;
  }

  if (filteredAndSortedStocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {activeTab === 'watchlist' ? 'No stocks in watchlist' : 'No stocks found'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {activeTab === 'watchlist'
            ? 'Click the star icon on any stock to add it to your watchlist.'
            : 'Try adjusting your search or filters to find what you\'re looking for.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 px-4 text-left w-12"></th>
            <th className="py-3 px-4 text-left">Stock</th>
            <th className="py-3 px-4 text-right">LTP (₹)</th>
            <th className="py-3 px-4 text-right">Change</th>
            <th className="py-3 px-4 text-right">% Change</th>
            <th className="py-3 px-4 text-right hidden lg:table-cell">Volume</th>
            <th className="py-3 px-4 text-center hidden xl:table-cell">Day Range</th>
            <th className="py-3 px-4 text-center hidden md:table-cell">Trend</th>
            <th className="py-3 px-4 text-right hidden sm:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedStocks.map((stock, index) => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              isInWatchlist={watchlist.includes(stock.symbol)}
              onToggleWatchlist={onToggleWatchlist}
              animationDelay={index * 20}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
