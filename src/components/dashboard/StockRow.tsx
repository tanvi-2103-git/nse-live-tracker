import { memo, useState } from 'react';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SparklineChart } from './SparklineChart';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';

interface StockRowProps {
  stock: Stock;
  isInWatchlist: boolean;
  onToggleWatchlist: (symbol: string) => void;
  animationDelay?: number;
}

export const StockRow = memo(function StockRow({
  stock,
  isInWatchlist,
  onToggleWatchlist,
  animationDelay = 0,
}: StockRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = stock.pChange >= 0;

  return (
    <tr
      className="table-row-hover border-b border-border/30 fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Watchlist Toggle */}
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleWatchlist(stock.symbol)}
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

      {/* Sparkline */}
      <td className="py-3 px-4 hidden md:table-cell">
        <SparklineChart
          data={stock.sparklineData}
          isPositive={isPositive}
        />
      </td>

      {/* Last Updated */}
      <td className="py-3 px-4 text-right hidden sm:table-cell">
        <p className="text-xs text-muted-foreground">
          {stock.lastUpdateTime}
        </p>
      </td>
    </tr>
  );
});
