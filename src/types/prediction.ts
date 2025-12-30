// Multi-layer Equity Research Prediction Types

export interface MarketState {
  label: 'Trending' | 'Consolidating' | 'Volatile' | 'Weak';
  description: string;
}

export interface MomentumState {
  label: 'Increasing' | 'Weak' | 'Reversal Signal' | 'Flat';
  direction: 'up' | 'down' | 'neutral';
}

export interface VolumeState {
  label: 'Strong' | 'Normal' | 'Weak';
  conviction: number; // 0-100
}

export interface RiskNote {
  label: 'Overbought' | 'Oversold' | 'Neutral';
  severity: 'low' | 'medium' | 'high';
}

export interface NewsImpact {
  label: 'Positive' | 'Neutral' | 'Negative' | 'Not Available';
  available: boolean;
}

export interface SummaryBullet {
  icon: string;
  label: string;
  value: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ScenarioCase {
  name: string;
  probability: string;
  expectedBehavior: string;
  keyTriggers: string[];
}

export interface RiskItem {
  type: string;
  level: 'low' | 'medium' | 'high';
  description: string;
}

export interface PriceLevel {
  support: number;
  resistance: number;
  trendStrength: 'Weak' | 'Moderate' | 'Strong';
}

export interface TimeframeOutlook {
  shortTerm: {
    days: string;
    outlook: string;
    bias: 'bullish' | 'bearish' | 'neutral';
  };
  mediumTerm: {
    weeks: string;
    outlook: string;
    bias: 'bullish' | 'bearish' | 'neutral';
  };
  longTerm: {
    months: string;
    outlook: string;
    bias: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface TechnicalAnalysis {
  priceStructure: string;
  breakoutProbability: string;
  volumeRole: string;
  supportReliability: string;
  resistanceStrength: string;
  trendInterpretation: string;
}

export interface ResearchPrediction {
  // Core identification
  symbol: string;
  companyName: string;
  timestamp: string;
  
  // Level 1 - Dashboard View
  verdict: {
    trend: 'Bullish' | 'Bearish' | 'Neutral';
    outlookHorizon: 'Short-term' | 'Near-term';
    confidencePercent: number;
    reasoningSentence: string;
    analystBias: 'Accumulate' | 'Hold' | 'Cautious' | 'Avoid';
  };
  
  priceLevels: PriceLevel;
  
  summaryBullets: SummaryBullet[];
  
  likelyOutcome: string;
  
  // Level 2 - Detailed Analysis
  executiveSummary: string;
  
  technicalStructure: {
    priceVs52Week: string;
    shortTermView: string;
    mediumTermView: string;
    momentumCondition: string;
    volumeConviction: string;
    supportResistanceReasoning: string;
  };
  
  sentimentNews: {
    available: boolean;
    recentSentiment?: string;
    sectorPerformance?: string;
    earningsBias?: string;
    unavailableNote?: string;
  };
  
  scenarios: {
    baseCase: ScenarioCase;
    bullCase: ScenarioCase;
    bearCase: ScenarioCase;
  };
  
  riskDashboard: RiskItem[];
  
  conclusion: string;
  
  // Level 3 - Full Report extras
  companyContext: string;
  sectorPositioning: string;
  timeframeOutlooks: TimeframeOutlook;
  technicalDeepDive: TechnicalAnalysis;
  macroNewsFusion: {
    available: boolean;
    earningsEffect?: string;
    policyTrends?: string;
    institutionalInterest?: string;
    unavailableNote?: string;
  };
  
  // Disclaimers
  riskTransparency: string;
  professionalDisclaimer: string;
  legalDisclaimer: string;
}

// Legacy interface for backward compatibility
export interface StockPrediction {
  trend: 'bullish' | 'bearish' | 'sideways';
  shortTermPrediction: string;
  nearTermPrediction: string;
  confidencePercent: number;
  supportLevel: number;
  resistanceLevel: number;
  reasoning: string;
  disclaimer: string;
  timestamp: string;
}
