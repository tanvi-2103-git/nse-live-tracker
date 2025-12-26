import { TrendingUp, Activity, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  indexValue?: number;
  indexChange?: number;
  indexChangePercent?: number;
  lastUpdated?: string;
  isRefreshing?: boolean;
  source?: 'live' | 'simulated';
  onRefresh: () => void;
}

export function Header({
  indexValue,
  indexChange,
  indexChangePercent,
  lastUpdated,
  isRefreshing,
  source,
  onRefresh,
}: HeaderProps) {
  const isPositive = (indexChange ?? 0) >= 0;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gain pulse-live" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                NSE <span className="gradient-text">Live</span> Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time NIFTY 50 Stock Data
              </p>
            </div>
          </div>

          {/* Index Stats */}
          <div className="flex items-center gap-6">
            {/* NIFTY 50 Index */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">NIFTY 50</p>
                <p className="text-lg font-bold font-mono">
                  {indexValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '—'}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-sm font-semibold font-mono flex items-center gap-1",
                isPositive ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"
              )}>
                {isPositive ? '+' : ''}{indexChange?.toFixed(2) ?? '0.00'}
                <span className="text-xs">
                  ({isPositive ? '+' : ''}{indexChangePercent?.toFixed(2) ?? '0.00'}%)
                </span>
              </div>
            </div>

            {/* Status & Controls */}
            <div className="flex items-center gap-3">
              {/* Data Source Indicator */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                source === 'live' 
                  ? "bg-gain-soft text-gain" 
                  : "bg-accent/20 text-accent"
              )}>
                <Activity className="w-3 h-3" />
                {source === 'live' ? 'Live Data' : 'Simulated'}
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {lastUpdated
                    ? new Date(lastUpdated).toLocaleTimeString('en-IN')
                    : '—'}
                </span>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
