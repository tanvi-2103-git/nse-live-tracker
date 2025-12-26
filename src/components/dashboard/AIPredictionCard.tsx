import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  RefreshCw,
  Target,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockPrediction, useStockPrediction } from '@/hooks/useStockPrediction';
import { Stock } from '@/types/stock';

interface AIPredictionCardProps {
  stock: Stock;
}

export function AIPredictionCard({ stock }: AIPredictionCardProps) {
  const { prediction, isLoading, error, getPrediction, savePredictionToHistory } = useStockPrediction();
  const [showResult, setShowResult] = useState(false);

  // Reset when stock changes
  useEffect(() => {
    setShowResult(false);
  }, [stock.symbol]);

  const handlePredict = async () => {
    const result = await getPrediction(stock);
    if (result) {
      setShowResult(true);
      savePredictionToHistory(stock.symbol, result);
    }
  };

  const handleRegenerate = async () => {
    setShowResult(false);
    const result = await getPrediction(stock, true);
    if (result) {
      setShowResult(true);
      savePredictionToHistory(stock.symbol, result);
    }
  };

  const getTrendIcon = (trend: StockPrediction['trend']) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getTrendColor = (trend: StockPrediction['trend']) => {
    switch (trend) {
      case 'bullish': return 'text-gain bg-gain-soft';
      case 'bearish': return 'text-loss bg-loss-soft';
      default: return 'text-accent bg-accent/20';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)} hr ago`;
  };

  if (!showResult && !isLoading) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/10 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Price Prediction</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Get AI-powered analysis including trend prediction, support/resistance levels, 
          and confidence rating based on current market data.
        </p>

        <Button 
          onClick={handlePredict}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Prediction
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-12 w-full" />
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          Analyzing market data with AI...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-loss-soft/30 border border-loss/30">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-loss" />
          <span className="font-medium text-loss">Prediction Unavailable</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={handlePredict} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className={cn(
      "mt-6 rounded-xl border overflow-hidden transition-all duration-500",
      showResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/20 via-secondary to-accent/20 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Prediction</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeAgo(prediction.timestamp)}
              </div>
            </div>
          </div>
          
          {/* Trend Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm uppercase",
            getTrendColor(prediction.trend)
          )}>
            {getTrendIcon(prediction.trend)}
            {prediction.trend}
          </div>
        </div>
      </div>

      <div className="p-4 bg-card space-y-4">
        {/* Confidence Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Confidence Level</span>
            <span className="text-sm font-semibold">{prediction.confidencePercent}%</span>
          </div>
          <Progress 
            value={prediction.confidencePercent} 
            className="h-2"
          />
        </div>

        {/* Predictions */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Short-Term (1-2 hrs)</span>
            </div>
            <p className="text-sm">{prediction.shortTermPrediction}</p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Near-Term (Next Session)</span>
            </div>
            <p className="text-sm">{prediction.nearTermPrediction}</p>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gain-soft/30 border border-gain/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="w-4 h-4 text-gain" />
              <span className="text-xs text-muted-foreground">Resistance</span>
            </div>
            <p className="text-lg font-semibold font-mono text-gain">
              ₹{prediction.resistanceLevel.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-loss-soft/30 border border-loss/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="w-4 h-4 text-loss" />
              <span className="text-xs text-muted-foreground">Support</span>
            </div>
            <p className="text-lg font-semibold font-mono text-loss">
              ₹{prediction.supportLevel.toLocaleString()}
            </p>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase">AI Analysis</span>
          </div>
          <p className="text-sm leading-relaxed">{prediction.reasoning}</p>
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{prediction.disclaimer}</p>
          </div>
        </div>

        {/* Regenerate Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRegenerate}
          disabled={isLoading}
          className="w-full gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Regenerate Prediction
        </Button>
      </div>
    </div>
  );
}
