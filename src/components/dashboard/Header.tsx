import { TrendingUp, Activity, Clock, RefreshCw, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  indexValue?: number;
  indexChange?: number;
  indexChangePercent?: number;
  lastUpdated?: string;
  isRefreshing?: boolean;
  source?: 'live' | 'simulated';
  onRefresh: () => void;
  onOpenPortfolio?: () => void;
  showPortfolioButton?: boolean;
  // Market session props
  marketSession?: 'OPEN' | 'PRE_POST' | 'CLOSED';
  sessionLabel?: string;
  sessionEmoji?: string;
  autoRefreshEnabled?: boolean;
}

export function Header({
  indexValue,
  indexChange,
  indexChangePercent,
  lastUpdated,
  isRefreshing,
  source,
  onRefresh,
  onOpenPortfolio,
  showPortfolioButton = true,
  marketSession,
  sessionLabel,
  sessionEmoji,
  autoRefreshEnabled = true,
}: HeaderProps) {
  const isPositive = (indexChange ?? 0) >= 0;

  // Get session badge styles
  const getSessionStyles = () => {
    switch (marketSession) {
      case 'OPEN':
        return 'bg-gain-soft text-gain border-gain/20';
      case 'PRE_POST':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CLOSED':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

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
              {marketSession === 'OPEN' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gain pulse-live" />
              )}
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
          <div className="flex items-center gap-4 flex-wrap">
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
            <div className="flex items-center gap-2">
              {/* Market Session Indicator */}
              {marketSession && sessionLabel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                        getSessionStyles()
                      )}>
                        <span>{sessionEmoji}</span>
                        <span className="hidden sm:inline">{sessionLabel}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {marketSession === 'OPEN' && 'Market is open. Auto-refreshing every 5 seconds.'}
                        {marketSession === 'PRE_POST' && 'Pre-market/Post-market hours. Refreshing every 15 seconds.'}
                        {marketSession === 'CLOSED' && 'Market is closed. Use manual refresh.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Portfolio Button */}
              {showPortfolioButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenPortfolio}
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Portfolio</span>
                </Button>
              )}

              {/* Data Source Indicator */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                source === 'live' 
                  ? "bg-gain-soft text-gain" 
                  : "bg-accent/20 text-accent"
              )}>
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {source === 'live' ? 'Live Data' : 'Simulated'}
                </span>
              </div>

              {/* Last Updated */}
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
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
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              {/* User Menu */}
              <UserMenu onOpenPortfolio={onOpenPortfolio} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}