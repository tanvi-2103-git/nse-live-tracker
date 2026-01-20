import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// === INPUT VALIDATION SCHEMAS ===
const StockDataSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  companyName: z.string().max(200, 'Company name too long'),
  lastPrice: z.number().positive('Last price must be positive'),
  open: z.number().positive('Open price must be positive'),
  dayHigh: z.number().positive('Day high must be positive'),
  dayLow: z.number().positive('Day low must be positive'),
  previousClose: z.number().positive('Previous close must be positive'),
  change: z.number(),
  pChange: z.number(),
  totalTradedVolume: z.number().nonnegative('Volume cannot be negative'),
  yearHigh: z.number().positive('Year high must be positive'),
  yearLow: z.number().positive('Year low must be positive'),
  perChange30d: z.number(),
  perChange365d: z.number(),
});

const RequestSchema = z.object({
  stock: StockDataSchema,
});

type StockData = z.infer<typeof StockDataSchema>;
// === END VALIDATION SCHEMAS ===

const buildResearchPrompt = (stock: StockData) => {
  const distanceFrom52High = ((stock.yearHigh - stock.lastPrice) / stock.yearHigh * 100).toFixed(2);
  const distanceFrom52Low = ((stock.lastPrice - stock.yearLow) / stock.yearLow * 100).toFixed(2);
  const dayRangePosition = ((stock.lastPrice - stock.dayLow) / (stock.dayHigh - stock.dayLow || 1) * 100).toFixed(2);
  const yearRangePosition = ((stock.lastPrice - stock.yearLow) / (stock.yearHigh - stock.yearLow || 1) * 100).toFixed(2);
  
  return `You are a senior equity research analyst at a top-tier investment bank. Your role is to provide institutional-grade research analysis with professional tone, probability-based forecasting, and complete transparency about data limitations.

CRITICAL RULES:
1. Never hallucinate or invent data that isn't provided
2. Use probability framing, not guarantees
3. Maintain professional, calm tone like Goldman Sachs or Bloomberg research
4. If data is unavailable, explicitly state "Data not available for analysis"
5. Confidence should typically be 50-75% range unless strong evidence
6. For technical indicators (RSI, MACD, MA), INFER from available price data and clearly state these are probabilistic estimates

STOCK UNDER ANALYSIS:
Symbol: ${stock.symbol}
Company: ${stock.companyName}

CURRENT MARKET DATA:
- Last Traded Price: ₹${stock.lastPrice.toLocaleString()}
- Today's Open: ₹${stock.open.toLocaleString()}
- Day High: ₹${stock.dayHigh.toLocaleString()}
- Day Low: ₹${stock.dayLow.toLocaleString()}
- Previous Close: ₹${stock.previousClose.toLocaleString()}
- Today's Change: ${stock.change >= 0 ? '+' : ''}₹${stock.change.toFixed(2)} (${stock.pChange >= 0 ? '+' : ''}${stock.pChange.toFixed(2)}%)
- Trading Volume: ${stock.totalTradedVolume.toLocaleString()} shares

52-WEEK RANGE DATA:
- 52-Week High: ₹${stock.yearHigh.toLocaleString()}
- 52-Week Low: ₹${stock.yearLow.toLocaleString()}
- Distance from 52W High: ${distanceFrom52High}%
- Distance from 52W Low: ${distanceFrom52Low}%
- Position in 52W Range: ${yearRangePosition}%

PERFORMANCE DATA:
- 30-Day Performance: ${stock.perChange30d >= 0 ? '+' : ''}${stock.perChange30d.toFixed(2)}%
- 1-Year Performance: ${stock.perChange365d >= 0 ? '+' : ''}${stock.perChange365d.toFixed(2)}%

TECHNICAL POSITION:
- Day Range Position: ${dayRangePosition}% (0% = at day low, 100% = at day high)

TECHNICAL INDICATOR INFERENCE RULES:
Use these heuristics to estimate indicator states:
- RSI: If stock near 52W high (>85% range) with recent gains = likely Overbought. If near 52W low (<15% range) with recent losses = likely Oversold. Otherwise Neutral.
- MACD: Use 30D performance. Strong positive (>5%) = Bullish. Strong negative (<-5%) = Bearish. Otherwise = Weak/Neutral.
- Moving Averages: 
  - 20-day (short): Use day's position and recent trend
  - 50-day (medium): Use 30D performance direction
  - 200-day (long): Use 365D performance direction

ALWAYS state these are "probabilistic estimates based on available data" - never present as actual calculated indicators.

Provide your research analysis in the following JSON format ONLY. No markdown, no code blocks, just pure JSON:

{
  "symbol": "${stock.symbol}",
  "companyName": "${stock.companyName}",
  "timestamp": "${new Date().toISOString()}",
  
  "verdict": {
    "trend": "Bullish" | "Bearish" | "Neutral",
    "outlookHorizon": "Short-term" | "Near-term",
    "confidencePercent": number (50-75 typical range),
    "reasoningSentence": "One clear sentence explaining the outlook",
    "analystBias": "Accumulate" | "Hold" | "Cautious" | "Avoid"
  },
  
  "priceLevels": {
    "support": number (nearest support level),
    "resistance": number (nearest resistance level),
    "trendStrength": "Weak" | "Moderate" | "Strong"
  },
  
  "technicalIndicators": {
    "rsiStatus": "Overbought" | "Oversold" | "Neutral",
    "rsiReasoning": "Brief explanation of RSI inference based on position in 52W range",
    "macdSignal": "Bullish" | "Bearish" | "Weak",
    "macdReasoning": "Brief explanation of MACD signal based on momentum data",
    "shortMA": "Price is [above/below] estimated 20-day average - [bullish/bearish] short-term signal",
    "mediumMA": "50-day trend appears [up/down/flat] based on 30-day performance",
    "longMA": "200-day bias is [bullish/bearish/neutral] based on yearly performance",
    "overallBias": "Bullish" | "Bearish" | "Mixed" | "Neutral"
  },
  
  "summaryBullets": [
    { "icon": "📊", "label": "Market State", "value": "Trending/Consolidating/Volatile/Weak", "sentiment": "positive/negative/neutral" },
    { "icon": "📈", "label": "Momentum", "value": "Increasing/Weak/Reversal Signal/Flat", "sentiment": "positive/negative/neutral" },
    { "icon": "📦", "label": "Volume Strength", "value": "Strong/Normal/Weak", "sentiment": "positive/negative/neutral" },
    { "icon": "⚠", "label": "Risk Note", "value": "Overbought/Oversold/Neutral", "sentiment": "positive/negative/neutral" },
    { "icon": "📰", "label": "News Impact", "value": "Not Available", "sentiment": "neutral" },
    { "icon": "🎯", "label": "Likely Outcome", "value": "Realistic expectation statement", "sentiment": "positive/negative/neutral" }
  ],
  
  "likelyOutcome": "Clear, realistic expectation for price movement",
  
  "executiveSummary": "2-3 paragraph professional research summary. Include technical indicator insights (RSI condition, MACD signal, MA trends). State clearly that indicators are estimated from available data. Write like a senior analyst.",
  
  "technicalStructure": {
    "priceVs52Week": "Description of current price position relative to 52-week range",
    "shortTermView": "1-5 day outlook with technical reasoning including RSI/MACD insight",
    "mediumTermView": "1-4 week outlook with MA trend analysis",
    "momentumCondition": "Current momentum analysis with MACD context",
    "volumeConviction": "Volume analysis and what it indicates",
    "supportResistanceReasoning": "Why these support/resistance levels matter"
  },
  
  "sentimentNews": {
    "available": false,
    "unavailableNote": "Real-time news sentiment data not available. No news bias applied to this analysis."
  },
  
  "scenarios": {
    "baseCase": {
      "name": "Base Case (Most Likely)",
      "probability": "40-50%",
      "expectedBehavior": "Clear description of expected path",
      "keyTriggers": ["trigger 1", "trigger 2"]
    },
    "bullCase": {
      "name": "Bull Case",
      "probability": "25-35%",
      "expectedBehavior": "What needs to go right",
      "keyTriggers": ["trigger 1", "trigger 2"]
    },
    "bearCase": {
      "name": "Bear Case",
      "probability": "20-30%",
      "expectedBehavior": "What could go wrong",
      "keyTriggers": ["trigger 1", "trigger 2"]
    }
  },
  
  "riskDashboard": [
    { "type": "Market Volatility", "level": "low/medium/high", "description": "Brief risk description" },
    { "type": "Macro/Policy Risk", "level": "low/medium/high", "description": "Brief risk description" },
    { "type": "Liquidity Risk", "level": "low/medium/high", "description": "Brief risk description" },
    { "type": "Unknown Events", "level": "medium", "description": "Unforeseen events can always impact prices" }
  ],
  
  "conclusion": "Professional conclusion paragraph including technical indicator summary. Calm, confident, but realistic.",
  
  "companyContext": "Brief description of the business and what drives its value",
  "sectorPositioning": "Where the stock stands in its sector context",
  
  "timeframeOutlooks": {
    "shortTerm": { "days": "1-5 Days", "outlook": "Outlook with RSI context", "bias": "bullish/bearish/neutral" },
    "mediumTerm": { "weeks": "1-4 Weeks", "outlook": "Outlook with MA trends", "bias": "bullish/bearish/neutral" },
    "longTerm": { "months": "1-3 Months", "outlook": "Outlook based on long-term trend", "bias": "bullish/bearish/neutral" }
  },
  
  "technicalDeepDive": {
    "priceStructure": "Analysis of price structure and patterns",
    "breakoutProbability": "Assessment of breakout/breakdown probability",
    "volumeRole": "How volume is supporting or contradicting price action",
    "supportReliability": "How reliable are the support levels",
    "resistanceStrength": "How strong are the resistance levels",
    "trendInterpretation": "Overall trend interpretation with indicator synthesis"
  },
  
  "macroNewsFusion": {
    "available": false,
    "unavailableNote": "Real-time macro and news data not integrated. Analysis based on price and volume data only."
  },
  
  "riskTransparency": "This outlook is probabilistic, not guaranteed. Technical indicators shown are estimates based on available price data. Sudden news, macro events, or market volatility can change outcomes significantly.",
  
  "professionalDisclaimer": "This is AI-assisted research intended for educational insight. Technical indicators are inferred from price patterns, not calculated from actual indicator data. Market conditions can change quickly. This does not constitute financial advice.",
  
  "legalDisclaimer": "This analysis is generated by artificial intelligence for informational purposes only. It should not be considered as investment advice, recommendation, or solicitation to buy or sell any securities. Technical indicators shown are probabilistic estimates. Past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions."
}

IMPORTANT: Output ONLY valid JSON. No explanations, no markdown formatting.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === OPTIONAL AUTHENTICATION ===
    // This endpoint works for both authenticated and anonymous users
    // Authenticated users get their userId for cloud caching, anonymous users proceed without
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
        console.log(`Research prediction request from authenticated user: ${userId}`);
      } else {
        console.log('Research prediction request from anonymous user (invalid token provided)');
      }
    } else {
      console.log('Research prediction request from anonymous user');
    }
    // === END OPTIONAL AUTHENTICATION ===

    // === INPUT VALIDATION ===
    let validatedInput;
    try {
      const rawBody = await req.json();
      validatedInput = RequestSchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        console.error('Validation failed:', errorMessages);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid stock data',
            details: errorMessages
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw validationError;
    }

    const { stock } = validatedInput;
    // === END INPUT VALIDATION ===

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Research analysis unavailable – API not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Research] Generating institutional analysis for ${stock.symbol}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a senior equity research analyst. Always respond with valid JSON only. Never include markdown, code blocks, or any text outside the JSON. Be professional, probability-focused, and never hallucinate unavailable data. Technical indicators should be inferred from available price data with clear probabilistic framing." 
          },
          { role: "user", content: buildResearchPrompt(stock) }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("[Research] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Research analysis service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[Research] No content in AI response:", aiData);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse AI response
    let parsedResearch;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedResearch = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("[Research] Failed to parse AI response:", content);
      
      // Professional fallback based on technical data
      const trend = stock.pChange > 1 ? 'Bullish' : stock.pChange < -1 ? 'Bearish' : 'Neutral';
      const analystBias = stock.pChange > 2 ? 'Accumulate' : stock.pChange < -2 ? 'Cautious' : 'Hold';
      const yearRangePos = ((stock.lastPrice - stock.yearLow) / (stock.yearHigh - stock.yearLow || 1) * 100);
      
      // Infer RSI status from 52W range position
      const rsiStatus = yearRangePos > 85 ? 'Overbought' : yearRangePos < 15 ? 'Oversold' : 'Neutral';
      // Infer MACD from 30D performance
      const macdSignal = stock.perChange30d > 5 ? 'Bullish' : stock.perChange30d < -5 ? 'Bearish' : 'Weak';
      // Overall bias
      const overallBias = (trend === 'Bullish' && macdSignal === 'Bullish') ? 'Bullish' : 
                          (trend === 'Bearish' && macdSignal === 'Bearish') ? 'Bearish' : 
                          (trend !== 'Neutral' || macdSignal !== 'Weak') ? 'Mixed' : 'Neutral';
      
      parsedResearch = {
        symbol: stock.symbol,
        companyName: stock.companyName,
        timestamp: new Date().toISOString(),
        verdict: {
          trend,
          outlookHorizon: 'Short-term',
          confidencePercent: 55,
          reasoningSentence: `Based on current price action showing ${stock.pChange >= 0 ? 'positive' : 'negative'} momentum with ${stock.pChange.toFixed(2)}% change.`,
          analystBias
        },
        priceLevels: {
          support: Math.round(stock.dayLow * 0.995),
          resistance: Math.round(stock.dayHigh * 1.005),
          trendStrength: Math.abs(stock.pChange) > 2 ? 'Strong' : Math.abs(stock.pChange) > 0.5 ? 'Moderate' : 'Weak'
        },
        technicalIndicators: {
          rsiStatus,
          rsiReasoning: `Stock at ${yearRangePos.toFixed(0)}% of 52-week range suggests ${rsiStatus.toLowerCase()} condition (probabilistic estimate)`,
          macdSignal,
          macdReasoning: `30-day performance of ${stock.perChange30d.toFixed(2)}% indicates ${macdSignal.toLowerCase()} momentum signal`,
          shortMA: `Price ${stock.pChange > 0 ? 'above' : 'below'} estimated 20-day average - ${stock.pChange > 0 ? 'bullish' : 'bearish'} short-term signal`,
          mediumMA: `50-day trend appears ${stock.perChange30d > 0 ? 'up' : 'down'} based on 30-day performance of ${stock.perChange30d.toFixed(2)}%`,
          longMA: `200-day bias is ${stock.perChange365d > 5 ? 'bullish' : stock.perChange365d < -5 ? 'bearish' : 'neutral'} based on yearly performance`,
          overallBias
        },
        summaryBullets: [
          { icon: "📊", label: "Market State", value: Math.abs(stock.pChange) > 2 ? "Trending" : "Consolidating", sentiment: stock.pChange > 0 ? "positive" : stock.pChange < 0 ? "negative" : "neutral" },
          { icon: "📈", label: "Momentum", value: stock.pChange > 0.5 ? "Increasing" : stock.pChange < -0.5 ? "Weak" : "Flat", sentiment: stock.pChange > 0 ? "positive" : "negative" },
          { icon: "📦", label: "Volume Strength", value: "Normal", sentiment: "neutral" },
          { icon: "⚠", label: "Risk Note", value: rsiStatus, sentiment: rsiStatus === 'Neutral' ? "neutral" : "negative" },
          { icon: "📰", label: "News Impact", value: "Not Available", sentiment: "neutral" },
          { icon: "🎯", label: "Likely Outcome", value: `Expected to ${trend === 'Bullish' ? 'test resistance' : trend === 'Bearish' ? 'test support' : 'consolidate'}`, sentiment: stock.pChange > 0 ? "positive" : "neutral" }
        ],
        likelyOutcome: `${stock.symbol} is expected to ${trend === 'Bullish' ? 'continue upward momentum toward resistance' : trend === 'Bearish' ? 'face selling pressure toward support' : 'trade range-bound near current levels'}.`,
        executiveSummary: `${stock.companyName} (${stock.symbol}) is currently trading at ₹${stock.lastPrice.toLocaleString()}, showing a ${stock.pChange >= 0 ? 'positive' : 'negative'} change of ${stock.pChange.toFixed(2)}% from previous close. The stock is positioned ${yearRangePos.toFixed(0)}% within its 52-week range.\n\nTechnical indicator estimates suggest ${rsiStatus.toLowerCase()} RSI conditions with ${macdSignal.toLowerCase()} MACD momentum. The ${stock.perChange30d > 0 ? 'positive' : 'negative'} 30-day performance indicates the medium-term moving average trend is ${stock.perChange30d > 0 ? 'bullish' : 'bearish'}.\n\nBased on available technical data, the near-term outlook appears ${trend.toLowerCase()} with ${analystBias.toLowerCase()} bias. Note: Technical indicators shown are probabilistic estimates based on available price data.`,
        technicalStructure: {
          priceVs52Week: `Trading ${((stock.yearHigh - stock.lastPrice) / stock.yearHigh * 100).toFixed(1)}% below 52-week high and ${((stock.lastPrice - stock.yearLow) / stock.yearLow * 100).toFixed(1)}% above 52-week low.`,
          shortTermView: `Near-term momentum is ${stock.pChange > 0 ? 'positive' : 'negative'}. RSI estimate suggests ${rsiStatus.toLowerCase()} conditions.`,
          mediumTermView: `30-day performance of ${stock.perChange30d.toFixed(2)}% indicates ${stock.perChange30d > 0 ? 'uptrend' : 'downtrend'}. MACD signal: ${macdSignal}.`,
          momentumCondition: `MACD indicates ${macdSignal.toLowerCase()} momentum based on price trajectory.`,
          volumeConviction: `Volume of ${stock.totalTradedVolume.toLocaleString()} shares traded today.`,
          supportResistanceReasoning: `Support near day low of ₹${stock.dayLow.toLocaleString()}, resistance near day high of ₹${stock.dayHigh.toLocaleString()}.`
        },
        sentimentNews: {
          available: false,
          unavailableNote: "Real-time news sentiment data not available. No news bias applied to this analysis."
        },
        scenarios: {
          baseCase: {
            name: "Base Case (Most Likely)",
            probability: "45-55%",
            expectedBehavior: `Stock continues ${trend.toLowerCase()} bias with moderate volatility.`,
            keyTriggers: ["Volume confirmation", "Price holds key levels"]
          },
          bullCase: {
            name: "Bull Case",
            probability: "25-30%",
            expectedBehavior: "Breakout above resistance with volume surge.",
            keyTriggers: ["Strong buying interest", "Sector tailwinds"]
          },
          bearCase: {
            name: "Bear Case",
            probability: "20-25%",
            expectedBehavior: "Breakdown below support on selling pressure.",
            keyTriggers: ["Weak market sentiment", "Volume decline"]
          }
        },
        riskDashboard: [
          { type: "Market Volatility", level: "medium", description: "Standard market volatility risk applies" },
          { type: "Macro/Policy Risk", level: "medium", description: "External factors may impact price" },
          { type: "Liquidity Risk", level: "low", description: "Adequate trading volume observed" },
          { type: "Unknown Events", level: "medium", description: "Unforeseen events can always impact prices" }
        ],
        conclusion: `Based on the available technical data, ${stock.symbol} presents a ${trend.toLowerCase()} outlook in the near term. Estimated RSI is ${rsiStatus.toLowerCase()}, MACD signals ${macdSignal.toLowerCase()} momentum, and moving average trends suggest ${overallBias.toLowerCase()} bias. Investors should monitor key support at ₹${stock.dayLow.toLocaleString()} and resistance at ₹${stock.dayHigh.toLocaleString()} for directional cues.`,
        companyContext: `${stock.companyName} is a publicly traded company on the NSE.`,
        sectorPositioning: "Sector positioning data not available for this analysis.",
        timeframeOutlooks: {
          shortTerm: { days: "1-5 Days", outlook: `${trend} momentum with ${rsiStatus} RSI conditions`, bias: trend.toLowerCase() as 'bullish' | 'bearish' | 'neutral' },
          mediumTerm: { weeks: "1-4 Weeks", outlook: `${macdSignal} MACD signal suggests ${stock.perChange30d > 0 ? 'continuation' : 'caution'}`, bias: stock.perChange30d > 0 ? 'bullish' : stock.perChange30d < 0 ? 'bearish' : 'neutral' },
          longTerm: { months: "1-3 Months", outlook: `Long-term MA bias: ${stock.perChange365d > 5 ? 'bullish' : stock.perChange365d < -5 ? 'bearish' : 'neutral'}`, bias: stock.perChange365d > 5 ? 'bullish' : stock.perChange365d < -5 ? 'bearish' : 'neutral' }
        },
        technicalDeepDive: {
          priceStructure: `Price is in a ${stock.perChange30d > 0 ? 'uptrend' : stock.perChange30d < 0 ? 'downtrend' : 'consolidation'} pattern.`,
          breakoutProbability: "Moderate - requires volume confirmation",
          volumeRole: "Volume supporting current price direction",
          supportReliability: "Day low provides near-term support reference",
          resistanceStrength: "Day high represents immediate resistance zone",
          trendInterpretation: `Overall ${overallBias.toLowerCase()} bias based on indicator synthesis`
        },
        macroNewsFusion: {
          available: false,
          unavailableNote: "Real-time macro and news data not integrated. Analysis based on price and volume data only."
        },
        riskTransparency: "This outlook is probabilistic, not guaranteed. Technical indicators shown are estimates based on available price data. Sudden news, macro events, or market volatility can change outcomes significantly.",
        professionalDisclaimer: "This is AI-assisted research intended for educational insight. Technical indicators are inferred from price patterns, not calculated from actual indicator data. Market conditions can change quickly. This does not constitute financial advice.",
        legalDisclaimer: "This analysis is generated by artificial intelligence for informational purposes only. Technical indicators shown are probabilistic estimates. Past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions."
      };
    }

    console.log(`[Research] Successfully generated analysis for ${stock.symbol}`);
    
    return new Response(
      JSON.stringify(parsedResearch),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[Research] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Research analysis failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
