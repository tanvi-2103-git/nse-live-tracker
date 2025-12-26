import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { IndexData } from '@/types/market';
import { cn } from '@/lib/utils';

interface MarketOverviewProps {
  niftyValue?: number;
  niftyChange?: number;
  niftyChangePercent?: number;
}

// Generate intraday data for indices
function generateIntradayData(baseValue: number, change: number): { time: string; value: number }[] {
  const data: { time: string; value: number }[] = [];
  const startTime = 9 * 60 + 15;
  const endTime = 15 * 60 + 30;
  
  let currentValue = baseValue - change; // Start from previous close
  
  for (let i = 0; i <= (endTime - startTime); i += 15) {
    const minutes = startTime + i;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    const progress = i / (endTime - startTime);
    const targetValue = (baseValue - change) + (change * progress);
    currentValue = targetValue + (Math.random() - 0.5) * Math.abs(change) * 0.2;
    
    data.push({ time: timeStr, value: parseFloat(currentValue.toFixed(2)) });
  }
  
  // Ensure last point is actual current value
  data[data.length - 1].value = baseValue;
  
  return data;
}

export function MarketOverview({ niftyValue, niftyChange, niftyChangePercent }: MarketOverviewProps) {
  const indices: IndexData[] = useMemo(() => [
    {
      name: 'NIFTY 50',
      symbol: 'NIFTY',
      value: niftyValue || 24850.75,
      change: niftyChange || 125.50,
      changePercent: niftyChangePercent || 0.51,
      intradayData: generateIntradayData(niftyValue || 24850.75, niftyChange || 125.50),
    },
    {
      name: 'SENSEX',
      symbol: 'SENSEX',
      value: 81725.30,
      change: 385.20,
      changePercent: 0.47,
      intradayData: generateIntradayData(81725.30, 385.20),
    },
    {
      name: 'BANK NIFTY',
      symbol: 'BANKNIFTY',
      value: 52145.80,
      change: -245.60,
      changePercent: -0.47,
      intradayData: generateIntradayData(52145.80, -245.60),
    },
    {
      name: 'NIFTY IT',
      symbol: 'NIFTYIT',
      value: 38920.45,
      change: 520.35,
      changePercent: 1.35,
      intradayData: generateIntradayData(38920.45, 520.35),
    },
  ], [niftyValue, niftyChange, niftyChangePercent]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Market Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((index) => (
          <IndexCard key={index.symbol} index={index} />
        ))}
      </div>
    </div>
  );
}

function IndexCard({ index }: { index: IndexData }) {
  const isPositive = index.change >= 0;

  return (
    <div className="p-4 rounded-xl bg-card border border-border/50 card-hover">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{index.symbol}</p>
          <p className="text-xl font-bold font-mono mt-1">
            {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
          isPositive ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
        </div>
      </div>
      
      <p className={cn(
        "text-sm font-mono mb-3",
        isPositive ? "text-gain" : "text-loss"
      )}>
        {isPositive ? '+' : ''}{index.change.toFixed(2)}
      </p>

      {/* Mini Chart */}
      <div className="h-[50px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={index.intradayData}>
            <defs>
              <linearGradient id={`gradient-${index.symbol}`} x1="0" y1="0" x2="0" y2="1">
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
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(162, 83%, 43%)" : "hsl(0, 72%, 51%)"}
              strokeWidth={1.5}
              fill={`url(#gradient-${index.symbol})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
