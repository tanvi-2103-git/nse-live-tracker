import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  Shield,
  BarChart2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResearchPrediction } from '@/types/prediction';
import { Stock } from '@/types/stock';

interface ResearchDetailedViewProps {
  prediction: ResearchPrediction;
  stock: Stock;
  onBack: () => void;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export function ResearchDetailedView({ 
  prediction, 
  onBack, 
  onDownloadPDF, 
  isGeneratingPDF 
}: ResearchDetailedViewProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-gain bg-gain/10';
      case 'high': return 'text-loss bg-loss/10';
      default: return 'text-yellow-400 bg-yellow-500/10';
    }
  };

  const getIndicatorColor = (status: string) => {
    const lower = status?.toLowerCase() || '';
    if (lower === 'bullish') return 'bg-gain/20 text-gain border-gain/30';
    if (lower === 'bearish') return 'bg-loss/20 text-loss border-loss/30';
    if (lower === 'overbought') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (lower === 'oversold') return 'bg-primary/20 text-primary border-primary/30';
    if (lower === 'weak' || lower === 'mixed') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-muted/50 text-muted-foreground border-border/50';
  };

  const indicators = prediction.technicalIndicators;

  return (
    <div className="mt-6 rounded-xl border border-border/50 overflow-hidden bg-card">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-card to-accent/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadPDF} disabled={isGeneratingPDF} className="gap-2">
            <Download className="w-4 h-4" />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
        <h2 className="text-lg font-semibold mt-3">Detailed Research Analysis</h2>
        <p className="text-xs text-muted-foreground">{prediction.companyName} ({prediction.symbol})</p>
      </div>

      <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* Executive Summary */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Executive Summary
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {prediction.executiveSummary}
          </p>
        </section>

        {/* Technical Indicators Panel */}
        {indicators && (
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Technical Indicator Analysis
              <span className="text-xs text-muted-foreground font-normal">(Probabilistic Estimates)</span>
            </h3>
            
            <div className="space-y-3">
              {/* Indicator Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("text-xs", getIndicatorColor(indicators.rsiStatus))}>
                  RSI: {indicators.rsiStatus}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", getIndicatorColor(indicators.macdSignal))}>
                  MACD: {indicators.macdSignal}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", getIndicatorColor(indicators.overallBias))}>
                  Overall Bias: {indicators.overallBias}
                </Badge>
              </div>

              {/* Indicator Details */}
              <div className="grid gap-2">
                <div className="p-2 rounded bg-secondary/20 border border-border/20">
                  <span className="text-xs font-medium text-primary">RSI Analysis: </span>
                  <span className="text-xs text-muted-foreground">{indicators.rsiReasoning}</span>
                </div>
                <div className="p-2 rounded bg-secondary/20 border border-border/20">
                  <span className="text-xs font-medium text-primary">MACD Signal: </span>
                  <span className="text-xs text-muted-foreground">{indicators.macdReasoning}</span>
                </div>
                <div className="p-2 rounded bg-secondary/20 border border-border/20">
                  <span className="text-xs font-medium text-primary">20-Day MA: </span>
                  <span className="text-xs text-muted-foreground">{indicators.shortMA}</span>
                </div>
                <div className="p-2 rounded bg-secondary/20 border border-border/20">
                  <span className="text-xs font-medium text-primary">50-Day MA: </span>
                  <span className="text-xs text-muted-foreground">{indicators.mediumMA}</span>
                </div>
                <div className="p-2 rounded bg-secondary/20 border border-border/20">
                  <span className="text-xs font-medium text-primary">200-Day MA: </span>
                  <span className="text-xs text-muted-foreground">{indicators.longMA}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Technical Structure */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Price & Technical Structure
          </h3>
          <div className="space-y-2 text-sm">
            {Object.entries(prediction.technicalStructure || {}).map(([key, value]) => (
              <div key={key} className="p-2 rounded bg-secondary/20 border border-border/20">
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Scenario-Based Forecast
          </h3>
          <div className="space-y-2">
            {prediction.scenarios && Object.values(prediction.scenarios).map((scenario: any, i) => (
              <div key={i} className={cn(
                "p-3 rounded-lg border",
                i === 0 ? "bg-primary/10 border-primary/20" : 
                i === 1 ? "bg-gain/10 border-gain/20" : "bg-loss/10 border-loss/20"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{scenario.name}</span>
                  <Badge variant="outline" className="text-xs">{scenario.probability}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{scenario.expectedBehavior}</p>
                {scenario.keyTriggers && scenario.keyTriggers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {scenario.keyTriggers.map((trigger: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">
                        {trigger}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Risk Dashboard */}
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Risk Dashboard
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {prediction.riskDashboard?.map((risk, i) => (
              <div key={i} className={cn("p-2 rounded-lg text-xs", getRiskColor(risk.level))}>
                <span className="font-medium">{risk.type}</span>
                <span className="ml-1 opacity-70">({risk.level})</span>
                {risk.description && (
                  <p className="text-[10px] opacity-70 mt-0.5">{risk.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Timeframe Outlooks */}
        {prediction.timeframeOutlooks && (
          <section>
            <h3 className="text-sm font-semibold mb-2">Multi-Timeframe Outlook</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className={cn(
                "p-2 rounded-lg border text-center",
                prediction.timeframeOutlooks.shortTerm.bias === 'bullish' ? 'bg-gain/10 border-gain/20' :
                prediction.timeframeOutlooks.shortTerm.bias === 'bearish' ? 'bg-loss/10 border-loss/20' :
                'bg-muted/30 border-border/30'
              )}>
                <p className="text-[10px] text-muted-foreground">{prediction.timeframeOutlooks.shortTerm.days}</p>
                <p className="text-xs font-medium capitalize">{prediction.timeframeOutlooks.shortTerm.bias}</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg border text-center",
                prediction.timeframeOutlooks.mediumTerm.bias === 'bullish' ? 'bg-gain/10 border-gain/20' :
                prediction.timeframeOutlooks.mediumTerm.bias === 'bearish' ? 'bg-loss/10 border-loss/20' :
                'bg-muted/30 border-border/30'
              )}>
                <p className="text-[10px] text-muted-foreground">{prediction.timeframeOutlooks.mediumTerm.weeks}</p>
                <p className="text-xs font-medium capitalize">{prediction.timeframeOutlooks.mediumTerm.bias}</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg border text-center",
                prediction.timeframeOutlooks.longTerm.bias === 'bullish' ? 'bg-gain/10 border-gain/20' :
                prediction.timeframeOutlooks.longTerm.bias === 'bearish' ? 'bg-loss/10 border-loss/20' :
                'bg-muted/30 border-border/30'
              )}>
                <p className="text-[10px] text-muted-foreground">{prediction.timeframeOutlooks.longTerm.months}</p>
                <p className="text-xs font-medium capitalize">{prediction.timeframeOutlooks.longTerm.bias}</p>
              </div>
            </div>
          </section>
        )}

        {/* Conclusion */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Conclusion</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{prediction.conclusion}</p>
        </section>

        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{prediction.professionalDisclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
