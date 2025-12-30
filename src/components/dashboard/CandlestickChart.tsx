import { useEffect, useRef, useMemo, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  HistogramData, 
  ColorType, 
  Time,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Stock } from '@/types/stock';

type ChartMode = 'intraday' | 'daily' | 'weekly';

interface CandlestickChartProps {
  stock: Stock;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}

export function CandlestickChart({ stock, mode, onModeChange }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Generate chart data based on mode
  const { candleData, volumeData } = useMemo(() => {
    const candles: CandlestickData<Time>[] = [];
    const volumes: HistogramData<Time>[] = [];
    
    if (mode === 'intraday') {
      // Generate 5-min intervals for intraday
      const baseDate = new Date();
      baseDate.setHours(9, 15, 0, 0);
      let currentPrice = stock.previousClose;
      
      const totalCandles = 75; // Full trading day
      for (let i = 0; i < totalCandles; i++) {
        const candleDate = new Date(baseDate);
        candleDate.setMinutes(candleDate.getMinutes() + i * 5);
        
        const timestamp = Math.floor(candleDate.getTime() / 1000) as Time;
        
        const volatility = stock.dayHigh - stock.dayLow;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 0.08;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.04;
        const low = Math.min(open, close) - Math.random() * volatility * 0.04;
        const volume = Math.floor(Math.random() * 500000) + 50000;
        const isUp = close >= open;
        
        currentPrice = close;
        
        candles.push({
          time: timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        
        volumes.push({
          time: timestamp,
          value: volume,
          color: isUp ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });
      }
      
      // Last candle should end at current price
      if (candles.length > 0) {
        candles[candles.length - 1].close = stock.lastPrice;
      }
    } else if (mode === 'daily') {
      // Generate last 60 trading days
      const basePrice = stock.yearLow + (stock.yearHigh - stock.yearLow) * 0.5;
      let currentPrice = basePrice;
      
      for (let i = 59; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0] as Time;
        
        const volatility = (stock.yearHigh - stock.yearLow) * 0.025;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 2;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        const volume = Math.floor(Math.random() * 5000000) + 1000000;
        const isUp = close >= open;
        
        currentPrice = close;
        
        candles.push({
          time: dateStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        
        volumes.push({
          time: dateStr,
          value: volume,
          color: isUp ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });
      }
      
      // Last day should match today's data
      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        last.open = stock.open;
        last.high = stock.dayHigh;
        last.low = stock.dayLow;
        last.close = stock.lastPrice;
      }
    } else {
      // Weekly - last 24 weeks
      const basePrice = stock.yearLow + (stock.yearHigh - stock.yearLow) * 0.4;
      let currentPrice = basePrice;
      
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        
        const dateStr = date.toISOString().split('T')[0] as Time;
        
        const volatility = (stock.yearHigh - stock.yearLow) * 0.06;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 2;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 20000000) + 5000000;
        const isUp = close >= open;
        
        currentPrice = close;
        
        candles.push({
          time: dateStr,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
        
        volumes.push({
          time: dateStr,
          value: volume,
          color: isUp ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });
      }
      
      // Last week ends at current price
      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        last.close = stock.lastPrice;
        last.high = Math.max(last.high, stock.dayHigh);
        last.low = Math.min(last.low, stock.dayLow);
      }
    }
    
    return { candleData: candles, volumeData: volumes };
  }, [stock, mode]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        setDimensions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Create and update chart
  useEffect(() => {
    if (!chartContainerRef.current || dimensions.width === 0) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      width: dimensions.width,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(150, 160, 175, 1)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(40, 50, 65, 0.5)' },
        horzLines: { color: 'rgba(40, 50, 65, 0.5)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(100, 120, 140, 0.5)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(100, 120, 140, 0.5)',
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(40, 50, 65, 0.8)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: 'rgba(40, 50, 65, 0.8)',
        timeVisible: mode === 'intraday',
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create candlestick series using new API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create volume series using new API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Set data
    candlestickSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Store ref
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [dimensions.width, candleData, volumeData, mode]);

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

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="h-[280px] rounded-lg overflow-hidden"
        style={{ minHeight: '280px' }}
      />

      <p className="text-xs text-muted-foreground text-center">
        {mode === 'intraday' ? '5-minute candles (Intraday)' : mode === 'daily' ? 'Daily candles (60 days)' : 'Weekly candles (24 weeks)'}
        {' • '} Scroll to zoom, drag to pan
      </p>
    </div>
  );
}