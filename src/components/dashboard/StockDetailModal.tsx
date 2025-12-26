import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Bell, 
  BarChart3, 
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';
import { AIPredictionCard } from './AIPredictionCard';

interface StockDetailModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onClose: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onAddAlert: (symbol: string, companyName: string) => void;
}

export function StockDetailModal({
  stock,
  isOpen,
  onClose,
  isInWatchlist,
  onToggleWatchlist,
  onAddAlert,
}: StockDetailModalProps) {
  if (!stock) return null;

  const isPositive = stock.pChange >= 0;

  // Generate detailed intraday chart data
  const chartData = useMemo(() => {
    const data: { time: string; price: number; volume: number }[] = [];
    const startTime = 9 * 60 + 15; // 9:15 AM in minutes
    const endTime = 15 * 60 + 30; // 3:30 PM in minutes
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const tradingMinutes = Math.min(currentMinutes, endTime) - startTime;
    
    let currentPrice = stock.previousClose;
    const priceRange = stock.dayHigh - stock.dayLow;
    
    for (let i = 0; i <= Math.max(tradingMinutes, 60); i += 5) {
      const minutes = startTime + i;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      // Simulate realistic price movement
      const progress = i / (endTime - startTime);
      const targetPrice = stock.previousClose + (stock.lastPrice - stock.previousClose) * progress;
      currentPrice = targetPrice + (Math.random() - 0.5) * priceRange * 0.1;
      currentPrice = Math.max(stock.dayLow, Math.min(stock.dayHigh, currentPrice));
      
      data.push({
        time: timeStr,
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 100000) + 10000,
      });
    }
    
    // Ensure last point is actual last price
    if (data.length > 0) {
      data[data.length - 1].price = stock.lastPrice;
    }
    
    return data;
  }, [stock]);

  const week52RangePercent = ((stock.lastPrice - stock.yearLow) / (stock.yearHigh - stock.yearLow)) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {stock.symbol}
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold",
                  isPositive ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"
                )}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{stock.pChange.toFixed(2)}%
                </span>
              </DialogTitle>
              <p className="text-muted-foreground mt-1">{stock.companyName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleWatchlist(stock.symbol)}
                className="gap-2"
              >
                <Star className={cn(
                  "w-4 h-4",
                  isInWatchlist ? "fill-accent text-accent" : ""
                )} />
                {isInWatchlist ? 'Remove' : 'Watch'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAlert(stock.symbol, stock.companyName)}
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                Set Alert
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Current Price */}
        <div className="mt-4">
          <p className="text-4xl font-bold font-mono">
            ₹{stock.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className={cn(
            "text-lg font-mono flex items-center gap-2",
            isPositive ? "text-gain" : "text-loss"
          )}>
            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.pChange.toFixed(2)}%)
          </p>
        </div>

        {/* Intraday Chart */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Intraday Movement
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last updated: {stock.lastUpdateTime}
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={isPositive ? "hsl(162, 83%, 43%)" : "hsl(0, 72%, 51%)"} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={isPositive ? "hsl(162, 83%, 43%)" : "hsl(0, 72%, 51%)"} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  domain={['dataMin - 10', 'dataMax + 10']}
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(220, 14%, 18%)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "hsl(162, 83%, 43%)" : "hsl(0, 72%, 51%)"}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open" value={`₹${stock.open.toLocaleString()}`} />
          <StatCard label="Previous Close" value={`₹${stock.previousClose.toLocaleString()}`} />
          <StatCard label="Day High" value={`₹${stock.dayHigh.toLocaleString()}`} highlight="gain" />
          <StatCard label="Day Low" value={`₹${stock.dayLow.toLocaleString()}`} highlight="loss" />
          <StatCard 
            label="Volume" 
            value={`${(stock.totalTradedVolume / 1000000).toFixed(2)}M`} 
          />
          <StatCard 
            label="Value" 
            value={`₹${stock.totalTradedValue.toFixed(2)} Cr`} 
          />
          <StatCard 
            label="30D Change" 
            value={`${stock.perChange30d >= 0 ? '+' : ''}${stock.perChange30d.toFixed(2)}%`}
            highlight={stock.perChange30d >= 0 ? 'gain' : 'loss'}
          />
          <StatCard 
            label="1Y Change" 
            value={`${stock.perChange365d >= 0 ? '+' : ''}${stock.perChange365d.toFixed(2)}%`}
            highlight={stock.perChange365d >= 0 ? 'gain' : 'loss'}
          />
        </div>

        {/* 52 Week Range */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <h3 className="font-semibold mb-4">52 Week Range</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Low: ₹{stock.yearLow.toLocaleString()}</span>
              <span className="font-mono">₹{stock.lastPrice.toLocaleString()}</span>
              <span className="text-muted-foreground">High: ₹{stock.yearHigh.toLocaleString()}</span>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-loss via-accent to-gain rounded-full"
                style={{ width: '100%' }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg"
                style={{ left: `calc(${week52RangePercent}% - 8px)` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Current price is {week52RangePercent.toFixed(1)}% above 52-week low
            </p>
          </div>
        </div>

        {/* AI Price Prediction */}
        <AIPredictionCard stock={stock} />
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ 
  label, 
  value, 
  highlight 
}: { 
  label: string; 
  value: string; 
  highlight?: 'gain' | 'loss';
}) {
  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        "font-semibold font-mono",
        highlight === 'gain' && "text-gain",
        highlight === 'loss' && "text-loss"
      )}>
        {value}
      </p>
    </div>
  );
}
