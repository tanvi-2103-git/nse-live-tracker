import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/Header';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { TabsNav } from '@/components/dashboard/TabsNav';
import { SortDropdown } from '@/components/dashboard/SortDropdown';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { MarketStats } from '@/components/dashboard/MarketStats';
import { StockTable } from '@/components/dashboard/StockTable';
import { StockDetailModal } from '@/components/dashboard/StockDetailModal';
import { AddAlertModal } from '@/components/dashboard/AddAlertModal';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { PortfolioTracker } from '@/components/dashboard/PortfolioTracker';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { MarketAssistant } from '@/components/chatbot/MarketAssistant';
import { useStockData } from '@/hooks/useStockData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useAdaptiveAutoRefresh } from '@/hooks/useAdaptiveRefresh';
import { Stock, SortOption, TabType } from '@/types/stock';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Index = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, isFetching, refetch } = useStockData();
  const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();
  const {
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    clearAllAlerts,
    notificationPermission,
    requestNotificationPermission,
  } = usePriceAlerts(data?.stocks || []);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // Modal states
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [alertStock, setAlertStock] = useState<{ symbol: string; companyName: string; price: number } | null>(null);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['nse-stocks'] });
  }, [queryClient]);

  // Adaptive auto-refresh based on market hours
  const { 
    enabled: autoRefreshEnabled, 
    session: marketSession, 
    label: sessionLabel, 
    emoji: sessionEmoji,
    handleRefreshSuccess,
    handleRefreshFailure,
    reEnableAutoRefresh,
  } = useAdaptiveAutoRefresh(handleRefresh);

  // Track fetch success/failure for adaptive refresh
  useEffect(() => {
    if (isError) {
      handleRefreshFailure();
    } else if (data && !isFetching) {
      handleRefreshSuccess();
    }
  }, [isError, data, isFetching, handleRefreshFailure, handleRefreshSuccess]);

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

  const handleRowClick = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setIsDetailModalOpen(true);
  }, []);

  const handleOpenAlertModal = useCallback((symbol: string, companyName: string) => {
    const stock = data?.stocks.find(s => s.symbol === symbol);
    if (stock) {
      setAlertStock({ symbol, companyName, price: stock.lastPrice });
      setIsAlertModalOpen(true);
      setIsDetailModalOpen(false);
    }
  }, [data?.stocks]);

  const handleAddAlert = useCallback((targetPrice: number, condition: 'above' | 'below') => {
    if (alertStock) {
      addAlert(alertStock.symbol, alertStock.companyName, targetPrice, condition);
    }
  }, [alertStock, addAlert]);

  const handleOpenPortfolio = useCallback(() => {
    setIsPortfolioOpen(true);
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
        onOpenPortfolio={handleOpenPortfolio}
        marketSession={marketSession}
        sessionLabel={sessionLabel}
        sessionEmoji={sessionEmoji}
        autoRefreshEnabled={autoRefreshEnabled}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Market Overview with Index Charts */}
        <MarketOverview
          niftyValue={data?.indexValue}
          niftyChange={data?.indexChange}
          niftyChangePercent={data?.indexChangePercent}
        />

        {/* Market Stats */}
        {data?.stocks && <MarketStats stocks={data.stocks} />}

        {/* Main Grid: Table + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Stock Table Section */}
          <div className="xl:col-span-3">
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
                  onRowClick={handleRowClick}
                />
              )}
            </div>
          </div>

          {/* Sidebar: Alerts + News */}
          <div className="xl:col-span-1 space-y-6">
            <AlertsPanel
              alerts={alerts}
              onRemoveAlert={removeAlert}
              onToggleAlert={toggleAlert}
              onClearAll={clearAllAlerts}
              notificationPermission={notificationPermission}
              onRequestPermission={requestNotificationPermission}
            />
            <NewsFeed />
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {autoRefreshEnabled 
              ? `Auto-refresh active ${sessionEmoji} ${sessionLabel}` 
              : 'Auto-refresh disabled'} • 
            {data?.source === 'simulated' 
              ? ' Using simulated data for demonstration' 
              : ' Live data from NSE India'}
          </p>
        </footer>
      </main>

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStock}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isInWatchlist={selectedStock ? isInWatchlist(selectedStock.symbol) : false}
        onToggleWatchlist={toggleWatchlist}
        onAddAlert={handleOpenAlertModal}
      />

      {/* Add Alert Modal */}
      {alertStock && (
        <AddAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          symbol={alertStock.symbol}
          companyName={alertStock.companyName}
          currentPrice={alertStock.price}
          onAddAlert={handleAddAlert}
        />
      )}

      {/* Portfolio Modal */}
      <Dialog open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
          <PortfolioTracker stocks={data?.stocks || []} />
        </DialogContent>
      </Dialog>

      {/* Market Research Assistant Chatbot */}
      <MarketAssistant
        currentStock={selectedStock}
        marketSession={marketSession}
        pageContext={isDetailModalOpen ? `Stock Detail: ${selectedStock?.symbol}` : 'Dashboard'}
      />
    </div>
  );
};

export default Index;