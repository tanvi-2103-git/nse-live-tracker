import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';

interface MarketStatsProps {
  stocks: Stock[];
}

export function MarketStats({ stocks }: MarketStatsProps) {
  const stats = useMemo(() => {
    if (!stocks.length) return null;

    const gainers = stocks.filter((s) => s.pChange > 0).length;
    const losers = stocks.filter((s) => s.pChange < 0).length;
    const unchanged = stocks.length - gainers - losers;
    const totalVolume = stocks.reduce((sum, s) => sum + s.totalTradedVolume, 0);
    const avgChange = stocks.reduce((sum, s) => sum + s.pChange, 0) / stocks.length;

    const topGainer = [...stocks].sort((a, b) => b.pChange - a.pChange)[0];
    const topLoser = [...stocks].sort((a, b) => a.pChange - b.pChange)[0];

    return {
      gainers,
      losers,
      unchanged,
      totalVolume,
      avgChange,
      topGainer,
      topLoser,
    };
  }, [stocks]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Advance/Decline */}
      <div className="p-4 rounded-xl bg-card border border-border/50 card-hover">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Market Breadth
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-gain" />
            <span className="text-lg font-bold text-gain">{stats.gainers}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-loss" />
            <span className="text-lg font-bold text-loss">{stats.losers}</span>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden flex">
          <div
            className="h-full bg-gain"
            style={{ width: `${(stats.gainers / stocks.length) * 100}%` }}
          />
          <div
            className="h-full bg-loss"
            style={{ width: `${(stats.losers / stocks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Total Volume */}
      <div className="p-4 rounded-xl bg-card border border-border/50 card-hover">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Total Volume
          </span>
        </div>
        <p className="text-lg font-bold font-mono">
          {(stats.totalVolume / 1000000000).toFixed(2)}B
        </p>
        <p className="text-xs text-muted-foreground">
          Shares traded today
        </p>
      </div>

      {/* Top Gainer */}
      <div className="p-4 rounded-xl bg-card border border-border/50 card-hover">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gain" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Top Gainer
          </span>
        </div>
        <p className="text-lg font-bold text-gain">{stats.topGainer?.symbol}</p>
        <p className="text-sm font-mono text-gain">
          +{stats.topGainer?.pChange.toFixed(2)}%
        </p>
      </div>

      {/* Top Loser */}
      <div className="p-4 rounded-xl bg-card border border-border/50 card-hover">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-loss" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Top Loser
          </span>
        </div>
        <p className="text-lg font-bold text-loss">{stats.topLoser?.symbol}</p>
        <p className="text-sm font-mono text-loss">
          {stats.topLoser?.pChange.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
