import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/Header';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { TabsNav } from '@/components/dashboard/TabsNav';
import { SortDropdown } from '@/components/dashboard/SortDropdown';
import { MarketStats } from '@/components/dashboard/MarketStats';
import { StockTable } from '@/components/dashboard/StockTable';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { useStockData } from '@/hooks/useStockData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { SortOption, TabType } from '@/types/stock';

const Index = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, isFetching, refetch } = useStockData();
  const { watchlist, toggleWatchlist } = useWatchlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['nse-stocks'] });
  }, [queryClient]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // Reset sort when changing tabs for better UX
    if (tab === 'gainers') {
      setSortOption('gainers');
    } else if (tab === 'losers') {
      setSortOption('losers');
    } else {
      setSortOption('default');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        indexValue={data?.indexValue}
        indexChange={data?.indexChange}
        indexChangePercent={data?.indexChangePercent}
        lastUpdated={data?.timestamp}
        isRefreshing={isFetching}
        source={data?.source}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Market Stats */}
        {data?.stocks && <MarketStats stocks={data.stocks} />}

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            watchlistCount={watchlist.length}
          />
          <div className="flex items-center gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <SortDropdown value={sortOption} onChange={setSortOption} />
          </div>
        </div>

        {/* Stock Table */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          {isError ? (
            <ErrorState
              message={error?.message || 'Failed to load data'}
              onRetry={() => refetch()}
            />
          ) : (
            <StockTable
              stocks={data?.stocks || []}
              isLoading={isLoading}
              searchQuery={searchQuery}
              sortOption={sortOption}
              activeTab={activeTab}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          )}
        </div>

        {/* Footer Info */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Data refreshes automatically every 10 seconds • 
            {data?.source === 'simulated' 
              ? ' Using simulated data for demonstration' 
              : ' Live data from NSE India'}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
