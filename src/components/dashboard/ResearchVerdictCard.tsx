import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronDown,
  FileText,
  Download,
  Shield,
  Target,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResearchPrediction } from '@/types/prediction';
import { useResearchPrediction } from '@/hooks/useResearchPrediction';
import { Stock } from '@/types/stock';
import { ResearchDetailedView } from './ResearchDetailedView';
import { generateResearchPDF } from '@/lib/pdfGenerator';

interface ResearchVerdictCardProps {
  stock: Stock;
}

export function ResearchVerdictCard({ stock }: ResearchVerdictCardProps) {
  const { prediction, isLoading, error, getPrediction } = useResearchPrediction();
  const [showResult, setShowResult] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    setShowResult(false);
    setShowDetailedView(false);
  }, [stock.symbol]);

  const handlePredict = async () => {
    const result = await getPrediction(stock);
    if (result) {
      setShowResult(true);
    }
  };

  const handleRegenerate = async () => {
    setShowResult(false);
    setShowDetailedView(false);
    const result = await getPrediction(stock, true);
    if (result) {
      setShowResult(true);
    }
  };

  const handleDownloadPDF = async () => {
    if (!prediction) return;
    setIsGeneratingPDF(true);
    try {
      await generateResearchPDF(prediction, stock);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Bullish': return <TrendingUp className="w-5 h-5" />;
      case 'Bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Bullish': return 'text-gain bg-gain/20 border-gain/30';
      case 'Bearish': return 'text-loss bg-loss/20 border-loss/30';
      default: return 'text-accent bg-accent/20 border-accent/30';
    }
  };

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'Accumulate': return 'bg-gain/20 text-gain border-gain/30';
      case 'Hold': return 'bg-accent/20 text-accent border-accent/30';
      case 'Cautious': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Avoid': return 'bg-loss/20 text-loss border-loss/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-gain';
      case 'negative': return 'text-loss';
      default: return 'text-muted-foreground';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  // Initial state - prompt to generate
  if (!showResult && !isLoading) {
    return (
      <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary/5 via-secondary/20 to-primary/5 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Equity Research</h3>
            <p className="text-xs text-muted-foreground">Institutional-grade analysis powered by AI</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4 text-primary" />
            <span>Professional verdict with confidence rating</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" />
            <span>Scenario-based probability forecasting</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Risk transparency & professional disclaimers</span>
          </div>
        </div>

        <Button 
          onClick={handlePredict}
          className="w-full gap-2 bg-primary hover:bg-primary/90 h-11"
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
          Generate Research Analysis
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-6 p-5 rounded-xl bg-card border border-border/50 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
          </div>
          <p className="text-sm text-muted-foreground">
            Generating institutional-grade research analysis...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6 p-5 rounded-xl bg-loss/10 border border-loss/30">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-loss" />
          <span className="font-medium text-loss">Analysis Unavailable</span>
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

  // Detailed view
  if (showDetailedView) {
    return (
      <ResearchDetailedView 
        prediction={prediction}
        stock={stock}
        onBack={() => setShowDetailedView(false)}
        onDownloadPDF={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      />
    );
  }

  // Level 1 - Dashboard View
  return (
    <div className={cn(
      "mt-6 rounded-xl border border-border/50 overflow-hidden transition-all duration-500",
      showResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-card to-accent/10 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Research Verdict</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeAgo(prediction.timestamp)}
              </div>
            </div>
          </div>
          
          {/* Trend Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm border",
            getTrendColor(prediction.verdict.trend)
          )}>
            {getTrendIcon(prediction.verdict.trend)}
            {prediction.verdict.trend}
          </div>
        </div>

        {/* Analyst Bias Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-medium", getBiasColor(prediction.verdict.analystBias))}>
            Analyst Bias: {prediction.verdict.analystBias}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {prediction.verdict.outlookHorizon} Outlook
          </Badge>
        </div>
      </div>

      <div className="p-4 bg-card space-y-4">
        {/* Confidence Bar */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence Level</span>
            <span className="text-lg font-bold font-mono">{prediction.verdict.confidencePercent}%</span>
          </div>
          <Progress 
            value={prediction.verdict.confidencePercent} 
            className="h-2.5"
          />
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {prediction.verdict.reasoningSentence}
          </p>
        </div>

        {/* Key Price Levels */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-gain/10 border border-gain/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Resistance</p>
            <p className="text-sm font-semibold font-mono text-gain">
              ₹{prediction.priceLevels.resistance?.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Support</p>
            <p className="text-sm font-semibold font-mono text-loss">
              ₹{prediction.priceLevels.support?.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Trend</p>
            <p className="text-sm font-semibold text-accent">
              {prediction.priceLevels.trendStrength}
            </p>
          </div>
        </div>

        {/* Summary Bullets */}
        <div className="space-y-1.5">
          {prediction.summaryBullets.map((bullet, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 border border-border/20"
            >
              <span className="text-base">{bullet.icon}</span>
              <span className="text-xs text-muted-foreground w-24 shrink-0">{bullet.label}</span>
              <span className={cn("text-sm font-medium", getSentimentColor(bullet.sentiment))}>
                {bullet.value}
              </span>
            </div>
          ))}
        </div>

        {/* Risk Transparency */}
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {prediction.riskTransparency}
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default"
            size="sm" 
            onClick={() => setShowDetailedView(true)}
            className="gap-2 h-10"
          >
            <FileText className="w-4 h-4" />
            View Detailed Analysis
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="gap-2 h-10"
          >
            <Download className={cn("w-4 h-4", isGeneratingPDF && "animate-bounce")} />
            {isGeneratingPDF ? 'Generating...' : 'Full Report (PDF)'}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRegenerate}
          disabled={isLoading}
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Regenerate Analysis
        </Button>
      </div>
    </div>
  );
}
