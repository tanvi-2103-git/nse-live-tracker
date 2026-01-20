import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// === INPUT VALIDATION SCHEMAS ===
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(4000, 'Message content too long'),
});

const MarketOverviewSchema = z.object({
  indexValue: z.number().optional(),
  indexChange: z.number().optional(),
  indexChangePercent: z.number().optional(),
  advancers: z.number().nonnegative().optional(),
  decliners: z.number().nonnegative().optional(),
  unchanged: z.number().nonnegative().optional(),
}).optional();

const StockContextSchema = z.object({
  symbol: z.string().max(20).optional(),
  companyName: z.string().max(200).optional(),
  lastPrice: z.number().positive().optional(),
  change: z.number().optional(),
  pChange: z.number().optional(),
  dayHigh: z.number().positive().optional(),
  dayLow: z.number().positive().optional(),
  previousClose: z.number().positive().optional(),
  totalTradedVolume: z.number().nonnegative().optional(),
  totalTradedValue: z.number().optional(),
  yearHigh: z.number().positive().optional(),
  yearLow: z.number().positive().optional(),
  perChange30d: z.number().optional(),
  perChange365d: z.number().optional(),
}).optional();

const ResearchContextSchema = z.object({
  verdict: z.any().optional(),
  priceLevels: z.any().optional(),
  technicalIndicators: z.any().optional(),
  likelyOutcome: z.string().optional(),
}).optional().nullable();

const ContextSchema = z.object({
  stock: StockContextSchema.nullable(),
  marketOverview: MarketOverviewSchema.nullable(),
  research: ResearchContextSchema.nullable(),
  marketState: z.string().max(50).optional().nullable(),
  pageContext: z.string().max(100).optional().nullable(),
}).optional();

const RequestSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long (max 2000 chars)'),
  context: ContextSchema,
  conversationHistory: z.array(MessageSchema).max(20, 'Too many messages in history').optional(),
});
// === END VALIDATION SCHEMAS ===

const SYSTEM_PROMPT = `You are a junior equity research analyst at an institutional investment firm, specializing in the Indian stock market (NSE/BSE).

Your role is to explain research findings and market behavior like a knowledgeable analyst briefing a portfolio manager — professional, data-driven, and context-aware.

CRITICAL ANALYSIS FRAMEWORK:

1. NEVER analyze a stock in isolation:
   - Always reference the broader market environment first
   - Compare stock performance relative to the Nifty 50 index
   - Distinguish between stock-specific moves and market-driven moves

2. MANDATORY RESPONSE STRUCTURE:
   
   **Market Context** (1-2 lines)
   Brief summary of index direction, breadth, and volatility state.
   
   **Stock-Specific Analysis**
   Address the user's question with data-backed observations.
   Reference support/resistance, volume, and technical indicators when relevant.
   
   **Conditional Outlook**
   Frame scenarios: "If market breadth remains positive, stock may..."
   Use probability language: "approximately 60% likelihood", "tends to historically"
   
   **Risk-Aware Conclusion**
   Acknowledge uncertainties and downside risks.
   Incorporate both stock-level and market-level risk factors.

3. ALIGN WITH AI RESEARCH:
   - If AI research data is provided, your explanations should be consistent with it
   - Explain the research verdict in accessible terms
   - Clarify technical indicator interpretations (RSI, MACD, Moving Averages)

4. PROFESSIONAL LANGUAGE:
   - "Relative strength" / "Relative weakness"
   - "Outperforming the benchmark" / "Underperforming amid sector rotation"
   - "Market-supported rally" / "Divergence from broader index"
   - "Risk-reward skewed to the downside/upside"
   - "Volume confirms / contradicts price action"
   - "Defensive positioning warranted"

5. PROBABILITY-BASED PHRASING:
   - Never use "will", prefer "may", "could", "tends to"
   - Frame confidence levels: "high probability", "modest likelihood"
   - Scenario-based: "Base case suggests...", "If volume sustains..."

6. FORBIDDEN:
   - "Buy now" / "Sell immediately" / Any trading instructions
   - "Target price will be X" / Guaranteed outcomes
   - Emotional language, hype, or urgency
   - Long-term investment advice
   - Judging stocks without referencing market context

7. WHEN DATA IS LIMITED:
   Say: "Based on available stock-level data and limited market context..."
   Be honest about low certainty

TONE: Calm, institutional, analytical, educational. Like a junior analyst explaining research to a senior PM.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === OPTIONAL AUTHENTICATION ===
    // This endpoint works for both authenticated and anonymous users
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
        console.log(`Stock assistant request from authenticated user: ${userId}`);
      } else {
        console.log('Stock assistant request from anonymous user (invalid token provided)');
      }
    } else {
      console.log('Stock assistant request from anonymous user');
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
            error: 'Invalid request data',
            details: errorMessages
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw validationError;
    }

    const { question, context, conversationHistory } = validatedInput;
    // === END INPUT VALIDATION ===

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build comprehensive context for stock analysis
    let contextualMessage = question;
    
    if (context) {
      const contextParts: string[] = [];
      
      // MARKET CONTEXT - Critical for relative analysis
      if (context.marketOverview) {
        const m = context.marketOverview;
        const indexDirection = (m.indexChangePercent ?? 0) >= 0 ? 'positive' : 'negative';
        const breadthRatio = m.advancers && m.decliners 
          ? (m.advancers / (m.advancers + m.decliners) * 100).toFixed(1)
          : null;
        
        let marketBreadthDesc = 'Data unavailable';
        if (breadthRatio) {
          if (parseFloat(breadthRatio) > 65) marketBreadthDesc = 'Broad-based buying (strong)';
          else if (parseFloat(breadthRatio) > 50) marketBreadthDesc = 'More advancers than decliners';
          else if (parseFloat(breadthRatio) > 35) marketBreadthDesc = 'More decliners than advancers';
          else marketBreadthDesc = 'Broad-based selling (weak)';
        }

        let volatilityState = 'Normal';
        if (Math.abs(m.indexChangePercent ?? 0) > 2) volatilityState = 'Elevated';
        if (Math.abs(m.indexChangePercent ?? 0) > 3) volatilityState = 'High';

        contextParts.push(`=== MARKET ENVIRONMENT ===
Index: Nifty 50
Value: ${m.indexValue?.toLocaleString('en-IN') ?? 'N/A'}
Day Change: ${(m.indexChange ?? 0) >= 0 ? '+' : ''}${m.indexChange?.toFixed(2) ?? 'N/A'} (${(m.indexChangePercent ?? 0) >= 0 ? '+' : ''}${m.indexChangePercent?.toFixed(2) ?? 'N/A'}%)
Direction: ${indexDirection.toUpperCase()}
Breadth: ${m.advancers ?? 'N/A'} advancers | ${m.decliners ?? 'N/A'} decliners | ${m.unchanged ?? 'N/A'} unchanged
Breadth Interpretation: ${marketBreadthDesc}
Volatility: ${volatilityState}
Session: ${context.marketState ?? 'Unknown'}

>>> USE THIS TO FRAME ALL ANALYSIS <<<`);
      } else {
        contextParts.push(`=== MARKET ENVIRONMENT ===
Status: Limited market-wide context available.
Note: Relative performance cannot be fully assessed without index data.`);
      }
      
      // STOCK DATA
      if (context.stock) {
        const s = context.stock;
        
        // Calculate relative performance
        let relativePerf = 'Cannot calculate (no index data)';
        let alpha = 0;
        if (context.marketOverview?.indexChangePercent !== undefined) {
          alpha = (s.pChange ?? 0) - context.marketOverview.indexChangePercent;
          if (alpha > 1.5) relativePerf = `OUTPERFORMING index by ${alpha.toFixed(2)}% (strong relative strength)`;
          else if (alpha > 0.5) relativePerf = `Slightly outperforming index (+${alpha.toFixed(2)}%)`;
          else if (alpha > -0.5) relativePerf = `In-line with index (alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%)`;
          else if (alpha > -1.5) relativePerf = `Slightly underperforming index (${alpha.toFixed(2)}%)`;
          else relativePerf = `UNDERPERFORMING index by ${Math.abs(alpha).toFixed(2)}% (relative weakness)`;
        }
        
        // 52-week position
        const weekPos = s.yearHigh && s.yearLow && s.lastPrice
          ? ((s.lastPrice - s.yearLow) / (s.yearHigh - s.yearLow) * 100).toFixed(1)
          : null;
        
        contextParts.push(`=== STOCK DATA: ${s.symbol ?? 'Unknown'} ===
Company: ${s.companyName ?? 'N/A'}
Current Price: ₹${s.lastPrice?.toLocaleString('en-IN') ?? 'N/A'}
Day Change: ${(s.change ?? 0) >= 0 ? '+' : ''}${s.change?.toFixed(2) ?? 'N/A'} (${(s.pChange ?? 0) >= 0 ? '+' : ''}${s.pChange?.toFixed(2) ?? 'N/A'}%)

RELATIVE PERFORMANCE: ${relativePerf}

Price Range Today: ₹${s.dayLow ?? 'N/A'} - ₹${s.dayHigh ?? 'N/A'}
52-Week Range: ₹${s.yearLow ?? 'N/A'} - ₹${s.yearHigh ?? 'N/A'}
${weekPos ? `52-Week Position: ${weekPos}% above yearly low` : ''}

Volume: ${s.totalTradedVolume?.toLocaleString('en-IN') ?? 'N/A'} shares
Value Traded: ₹${s.totalTradedValue?.toFixed(2) ?? 'N/A'} Cr

30-Day Performance: ${(s.perChange30d ?? 0) >= 0 ? '+' : ''}${s.perChange30d?.toFixed(2) ?? 'N/A'}%
365-Day Performance: ${(s.perChange365d ?? 0) >= 0 ? '+' : ''}${s.perChange365d?.toFixed(2) ?? 'N/A'}%`);
      }

      // AI RESEARCH DATA
      if (context.research) {
        const r = context.research;
        contextParts.push(`=== AI RESEARCH FINDINGS ===
Verdict: ${r.verdict?.trend ?? 'N/A'} (${r.verdict?.outlookHorizon ?? 'N/A'})
Analyst Bias: ${r.verdict?.analystBias ?? 'N/A'}
Confidence: ${r.verdict?.confidencePercent ?? 'N/A'}%
Reasoning: ${r.verdict?.reasoningSentence ?? 'N/A'}

Support Level: ₹${r.priceLevels?.support ?? 'N/A'}
Resistance Level: ₹${r.priceLevels?.resistance ?? 'N/A'}
Trend Strength: ${r.priceLevels?.trendStrength ?? 'N/A'}

Technical Indicators:
- RSI: ${r.technicalIndicators?.rsiStatus ?? 'N/A'} — ${r.technicalIndicators?.rsiReasoning ?? ''}
- MACD: ${r.technicalIndicators?.macdSignal ?? 'N/A'} — ${r.technicalIndicators?.macdReasoning ?? ''}
- Overall Bias: ${r.technicalIndicators?.overallBias ?? 'N/A'}

Likely Outcome: ${r.likelyOutcome ?? 'N/A'}

>>> ALIGN YOUR EXPLANATIONS WITH THIS RESEARCH <<<`);
      }

      if (contextParts.length > 0) {
        contextualMessage = `[STOCK ANALYSIS CONTEXT]\n\n${contextParts.join('\n\n')}\n\n[USER QUESTION]\n${question}`;
      }
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add conversation history (already validated and limited to max 20)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-8);
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: contextualMessage });

    console.log('Stock Assistant: Processing question with full context');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 800,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stock assistant error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
