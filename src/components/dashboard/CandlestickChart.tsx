import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';

type ChartMode = 'intraday' | 'daily' | 'weekly';

interface CandlestickChartProps {
  stock: Stock;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
}

// Custom Candlestick shape
const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low, isUp } = payload;
  
  if (!payload || open === undefined) return null;
  
  const ratio = Math.abs(close - open) / (high - low) || 0.1;
  const candleHeight = Math.max(height * ratio, 2);
  const wickWidth = 1;
  
  const fillColor = isUp ? 'hsl(162, 83%, 43%)' : 'hsl(0, 72%, 51%)';
  
  // Calculate positions relative to the bar's position
  const candleY = y;
  const candleTop = Math.min(open, close);
  
  return (
    <g>
      {/* Wick (high to low) */}
      <line
        x1={x + width / 2}
        x2={x + width / 2}
        y1={y - height * 0.3}
        y2={y + height + height * 0.3}
        stroke={fillColor}
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect
        x={x + 2}
        y={y}
        width={width - 4}
        height={Math.max(height, 2)}
        fill={fillColor}
        stroke={fillColor}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
};

export function CandlestickChart({ stock, mode, onModeChange }: CandlestickChartProps) {
  // Generate chart data based on mode
  const chartData = useMemo(() => {
    const data: CandleData[] = [];
    
    if (mode === 'intraday') {
      // Generate 5-min intervals for intraday
      const startTime = 9 * 60 + 15;
      const endTime = 15 * 60 + 30;
      let currentPrice = stock.previousClose;
      
      for (let i = 0; i < Math.min((endTime - startTime) / 5, 75); i++) {
        const minutes = startTime + i * 5;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        const volatility = stock.dayHigh - stock.dayLow;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 0.1;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.05;
        const low = Math.min(open, close) - Math.random() * volatility * 0.05;
        const volume = Math.floor(Math.random() * 500000) + 50000;
        
        currentPrice = close;
        
        data.push({
          time: timeStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume,
          isUp: close >= open,
        });
      }
      
      // Last candle should end at current price
      if (data.length > 0) {
        data[data.length - 1].close = stock.lastPrice;
        data[data.length - 1].isUp = data[data.length - 1].close >= data[data.length - 1].open;
      }
    } else if (mode === 'daily') {
      // Generate last 30 trading days
      const basePrice = stock.yearLow + (stock.yearHigh - stock.yearLow) * 0.5;
      let currentPrice = basePrice;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        
        const volatility = (stock.yearHigh - stock.yearLow) * 0.03;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 2;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        const volume = Math.floor(Math.random() * 5000000) + 1000000;
        
        currentPrice = close;
        
        data.push({
          time: dateStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume,
          isUp: close >= open,
        });
      }
      
      // Last day should match today's data
      if (data.length > 0) {
        const last = data[data.length - 1];
        last.open = stock.open;
        last.high = stock.dayHigh;
        last.low = stock.dayLow;
        last.close = stock.lastPrice;
        last.isUp = last.close >= last.open;
      }
    } else {
      // Weekly - last 12 weeks
      const basePrice = stock.yearLow + (stock.yearHigh - stock.yearLow) * 0.4;
      let currentPrice = basePrice;
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        
        const volatility = (stock.yearHigh - stock.yearLow) * 0.08;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 2;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 20000000) + 5000000;
        
        currentPrice = close;
        
        data.push({
          time: dateStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume,
          isUp: close >= open,
        });
      }
      
      // Last week ends at current price
      if (data.length > 0) {
        const last = data[data.length - 1];
        last.close = stock.lastPrice;
        last.high = Math.max(last.high, stock.dayHigh);
        last.low = Math.min(last.low, stock.dayLow);
        last.isUp = last.close >= last.open;
      }
    }
    
    return data;
  }, [stock, mode]);

  const priceRange = useMemo(() => {
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);

  const maxVolume = useMemo(() => {
    return Math.max(...chartData.map(d => d.volume));
  }, [chartData]);

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex items-center gap-2">
        {(['intraday', 'daily', 'weekly'] as ChartMode[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={mode === m ? 'default' : 'outline'}
            className="text-xs capitalize"
            onClick={() => onModeChange(m)}
          >
            {m === 'intraday' ? '5min' : m}
          </Button>
        ))}
      </div>

      {/* Price Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 55%)"
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 9 }}
              tickLine={false}
              interval={mode === 'intraday' ? 14 : 'preserveStartEnd'}
            />
            <YAxis 
              domain={priceRange}
              stroke="hsl(215, 20%, 55%)"
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 9 }}
              tickLine={false}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(220, 14%, 18%)',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(215, 20%, 55%)', marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                if (name === 'volume') return [`${(value / 1000).toFixed(0)}K`, 'Volume'];
                return [`₹${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)];
              }}
            />
            <ReferenceLine 
              y={stock.previousClose} 
              stroke="hsl(215, 20%, 55%)" 
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Bar 
              dataKey="close" 
              shape={<Candlestick />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-[60px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              hide
            />
            <YAxis 
              domain={[0, maxVolume * 1.2]}
              hide
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(220, 14%, 18%)',
                borderRadius: '8px',
                padding: '6px',
                fontSize: '10px',
              }}
              formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
              labelFormatter={() => ''}
            />
            <Bar dataKey="volume" fill="hsl(215, 20%, 35%)" opacity={0.6} radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={index} 
                  fill={entry.isUp ? 'hsl(162, 83%, 43%)' : 'hsl(0, 72%, 51%)'} 
                  fillOpacity={0.4}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {mode === 'intraday' ? '5-minute candles' : mode === 'daily' ? 'Daily candles (30 days)' : 'Weekly candles (12 weeks)'}
      </p>
    </div>
  );
}
