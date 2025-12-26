import { TrendingUp, TrendingDown, Star, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType } from '@/types/stock';

interface TabsNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  watchlistCount: number;
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'NIFTY 50', icon: LayoutGrid },
  { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
  { id: 'losers', label: 'Top Losers', icon: TrendingDown },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
];

export function TabsNav({ activeTab, onTabChange, watchlistCount }: TabsNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const count = tab.id === 'watchlist' ? watchlistCount : null;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-glow-primary"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "w-4 h-4",
              tab.id === 'gainers' && isActive && "text-primary-foreground",
              tab.id === 'losers' && isActive && "text-primary-foreground",
              tab.id === 'gainers' && !isActive && "text-gain",
              tab.id === 'losers' && !isActive && "text-loss",
            )} />
            {tab.label}
            {count !== null && count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                isActive 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-accent/20 text-accent"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
