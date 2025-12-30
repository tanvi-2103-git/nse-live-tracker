import { memo } from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SparklineChart } from './SparklineChart';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';

interface StockRowProps {
  stock: Stock;
  isInWatchlist: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onRowClick: (stock: Stock) => void;
  animationDelay?: number;
}

export const StockRow = memo(function StockRow({
  stock,
  isInWatchlist,
  onToggleWatchlist,
  onRowClick,
  animationDelay = 0,
}: StockRowProps) {
  const isPositive = stock.pChange >= 0;
  const isNeutral = Math.abs(stock.pChange) < 0.1;

  // Format timestamp for IST display
  const formatUpdateTime = (timeStr: string) => {
    if (!timeStr) return '—';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    return `${dateStr} ${timeStr}`;
  };

  // Determine trend based on price change
  const getTrend = () => {
    if (isNeutral) return { icon: Minus, color: 'text-muted-foreground', label: 'Neutral' };
    if (isPositive) return { icon: TrendingUp, color: 'text-gain', label: 'Bullish' };
    return { icon: TrendingDown, color: 'text-loss', label: 'Bearish' };
  };

  const trend = getTrend();
  const TrendIcon = trend.icon;

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatchlist(stock.symbol);
  };

  return (
    <tr
      className="table-row-hover border-b border-border/30 fade-in cursor-pointer"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onRowClick(stock)}
    >
      {/* Watchlist Toggle */}
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleWatchlistClick}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-all",
              isInWatchlist
                ? "fill-accent text-accent"
                : "text-muted-foreground hover:text-accent"
            )}
          />
        </Button>
      </td>

      {/* Symbol & Company */}
      <td className="py-3 px-4">
        <div>
          <p className="font-semibold text-foreground">{stock.symbol}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {stock.companyName}
          </p>
        </div>
      </td>

      {/* LTP */}
      <td className="py-3 px-4 text-right">
        <p className="font-mono font-semibold text-foreground">
          ₹{stock.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </td>

      {/* Change */}
      <td className="py-3 px-4 text-right">
        <div className={cn(
          "inline-flex items-center gap-1 font-mono text-sm",
          isPositive ? "text-gain" : "text-loss"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {stock.change.toFixed(2)}
          </span>
        </div>
      </td>

      {/* % Change */}
      <td className="py-3 px-4 text-right">
        <span
          className={cn(
            "inline-block px-2 py-1 rounded-md text-sm font-semibold font-mono",
            isPositive ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"
          )}
        >
          {isPositive ? '+' : ''}{stock.pChange.toFixed(2)}%
        </span>
      </td>

      {/* Volume */}
      <td className="py-3 px-4 text-right hidden lg:table-cell">
        <p className="font-mono text-sm text-muted-foreground">
          {(stock.totalTradedVolume / 1000000).toFixed(2)}M
        </p>
      </td>

      {/* Day Range */}
      <td className="py-3 px-4 hidden xl:table-cell">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {stock.dayLow.toFixed(0)}
          </span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                isPositive ? "bg-gain" : "bg-loss"
              )}
              style={{
                width: `${((stock.lastPrice - stock.dayLow) / (stock.dayHigh - stock.dayLow)) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {stock.dayHigh.toFixed(0)}
          </span>
        </div>
      </td>

      {/* Trend */}
      <td className="py-3 px-4 text-center hidden md:table-cell">
        <div className={cn("inline-flex items-center gap-1", trend.color)}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{trend.label}</span>
        </div>
      </td>

      {/* Last Updated */}
      <td className="py-3 px-4 text-right hidden sm:table-cell">
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {formatUpdateTime(stock.lastUpdateTime)}
        </p>
      </td>
    </tr>
  );
});
