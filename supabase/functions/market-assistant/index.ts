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
  yearHigh: z.number().positive().optional(),
  yearLow: z.number().positive().optional(),
  perChange30d: z.number().optional(),
  perChange365d: z.number().optional(),
}).optional();

const ResearchContextSchema = z.object({
  verdict: z.any().optional(),
  confidence: z.number().optional(),
  trend: z.string().optional(),
  momentum: z.any().optional(),
  technicalIndicators: z.any().optional(),
}).optional();

const ContextSchema = z.object({
  stock: StockContextSchema,
  marketOverview: MarketOverviewSchema,
  research: ResearchContextSchema,
  marketState: z.string().max(50).optional(),
  pageContext: z.string().max(100).optional(),
}).optional();

const RequestSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long (max 2000 chars)'),
  context: ContextSchema,
  conversationHistory: z.array(MessageSchema).max(20, 'Too many messages in history').optional(),
});
// === END VALIDATION SCHEMAS ===

const SYSTEM_PROMPT = `You are a professional institutional equity research analyst for the Indian stock market (NSE/BSE), operating with trading-desk clarity and precision.

=====================================================
MANDATORY OUTPUT FORMAT — FOLLOW EXACTLY
=====================================================

SECTION A: QUICK MARKET VERDICT (6–10 lines max)
This section is MANDATORY and must appear FIRST in every response.

Structure (in this order):
1. MARKET BIAS: State one of: Bearish / Mild Bearish / Neutral / Mild Bullish / Bullish
2. WHY: One line explaining (index move + breadth + volatility)
3. KEY SUPPORT: Specific level(s) — use previous close, day low, or round number if exact unavailable
4. KEY RESISTANCE: Specific level(s) — use day high, previous high, or round number if exact unavailable
5. IF/THEN SCENARIOS (exactly 2):
   - Bearish case: "If support at X breaks + breadth worsens → expect Y"
   - Bullish case: "If support at X holds + breadth improves → expect Z"
6. WHAT TO WATCH: One line on next catalyst (breadth shift, heavyweight moves, breakout/breakdown level)

SECTION A RULES:
- Maximum 10 lines, no exceptions
- No repeated phrases or filler
- Use calm probability language: "slightly higher odds", "needs confirmation", "balanced risk"
- NEVER use "65-70% probability" in every answer — vary your confidence framing
- Include key levels ALWAYS — approximate is fine if exact unavailable

-----------------------------------------------------

SECTION B: DETAILED CONTEXT (after Section A)
Expand with:
- Market regime (trending / range-bound / volatile)
- Sector participation (if data available)
- Why breadth matters for current setup
- What intraday traders should focus on
- Macro/news risks if relevant
- Relative performance analysis (stock vs index)

-----------------------------------------------------

SECTION C: RISK NOTE (1 line at end)
"Educational insight only — not financial advice."

=====================================================
KEY LEVELS REQUIREMENT
=====================================================
ALWAYS include support and resistance levels, even if approximate:
- Support: Previous close zone, today's low, round number support
- Resistance: Today's high zone, previous high, round number resistance
NEVER answer bullish/bearish questions without providing key levels.

=====================================================
ANTI-REPETITION RULE
=====================================================
Each response must add something NEW compared to previous answers:
- Updated levels based on price action
- Changed breadth reading
- Shifted market bias
- New if/then condition
- Fresh observation

NEVER copy-paste the same paragraph structure in follow-up answers.

=====================================================
LANGUAGE & TONE
=====================================================
Professional institutional language:
- "Relative strength" / "Relative weakness"
- "Broad-based buying/selling pressure"
- "Market-supported rally" / "Market-induced weakness"
- "Risk amplified by weak breadth"
- "Defensive positioning warranted"

Probability framing (VARY these):
- "Slightly elevated odds of..."
- "Marginally favors continuation..."
- "Needs confirmation before..."
- "Balanced risk at current levels"
- "Tilted toward..." 

FORBIDDEN:
- "Buy now" / "Sell immediately" / Trading instructions
- "Target price will be X" / Guaranteed outcomes
- Emotional language, hype, or urgency
- Repeating "65-70% probability" mechanically
- Answering without key levels
- Long-term investment advice

=====================================================
MARKET CONTEXT INTEGRATION
=====================================================
1. ALWAYS consider market context before stock analysis:
   - Index trend and momentum
   - Breadth (advancers vs decliners ratio)
   - Volatility state
   - Session context

2. Compare stock performance RELATIVE to market:
   - Outperforming or underperforming?
   - Stock-specific move or market-driven?

3. If market context unavailable, state:
   "Market-wide context limited; analysis based on stock-level data only."

The goal: Every response should feel like it came from an institutional trading desk — clear, actionable, and immediately useful.`;

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
        console.log(`Market assistant request from authenticated user: ${userId}`);
      } else {
        console.log('Market assistant request from anonymous user (invalid token provided)');
      }
    } else {
      console.log('Market assistant request from anonymous user');
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

    // Build context-aware user message with market context
    let contextualMessage = question;
    
    if (context) {
      const contextParts: string[] = [];
      
      // MARKET CONTEXT - Always include first for market-aware analysis
      if (context.marketOverview) {
        const m = context.marketOverview;
        const indexDirection = (m.indexChangePercent ?? 0) >= 0 ? 'positive' : 'negative';
        const breadthRatio = m.advancers && m.decliners 
          ? (m.advancers / (m.advancers + m.decliners) * 100).toFixed(1)
          : null;
        
        let marketBreadthDesc = 'Unknown';
        if (breadthRatio) {
          if (parseFloat(breadthRatio) > 65) marketBreadthDesc = 'Strong (broad-based buying)';
          else if (parseFloat(breadthRatio) > 50) marketBreadthDesc = 'Positive (more advancers)';
          else if (parseFloat(breadthRatio) > 35) marketBreadthDesc = 'Negative (more decliners)';
          else marketBreadthDesc = 'Weak (broad-based selling)';
        }

        let volatilityState = 'Normal';
        if (Math.abs(m.indexChangePercent ?? 0) > 2) volatilityState = 'Elevated';
        if (Math.abs(m.indexChangePercent ?? 0) > 3) volatilityState = 'High';

        contextParts.push(`=== MARKET-WIDE CONTEXT (CRITICAL) ===
Index: Nifty 50
- Current Value: ${m.indexValue?.toLocaleString('en-IN') ?? 'N/A'}
- Day Change: ${(m.indexChange ?? 0) >= 0 ? '+' : ''}${m.indexChange?.toFixed(2) ?? 'N/A'} (${(m.indexChangePercent ?? 0) >= 0 ? '+' : ''}${m.indexChangePercent?.toFixed(2) ?? 'N/A'}%)
- Index Direction: ${indexDirection.toUpperCase()}
- Market Breadth: ${m.advancers ?? 'N/A'} advancers vs ${m.decliners ?? 'N/A'} decliners (${marketBreadthDesc})
- Unchanged: ${m.unchanged ?? 'N/A'} stocks
- Volatility State: ${volatilityState}
- Trading Session: ${context.marketState ?? 'Unknown'}

IMPORTANT: Use this market context to frame ALL analysis. Compare stock performance relative to index.`);
      } else {
        contextParts.push(`=== MARKET CONTEXT ===
Market-wide context is LIMITED. Analysis will be based on stock-level data only.
Note: Without index/breadth data, relative performance cannot be determined.`);
      }
      
      // STOCK CONTEXT
      if (context.stock) {
        const s = context.stock;
        
        // Calculate relative performance if market data available
        let relativePerf = '';
        if (context.marketOverview?.indexChangePercent !== undefined) {
          const stockChange = s.pChange ?? 0;
          const indexChange = context.marketOverview.indexChangePercent;
          const alpha = stockChange - indexChange;
          
          if (alpha > 1) relativePerf = `OUTPERFORMING index by ${alpha.toFixed(2)}%`;
          else if (alpha < -1) relativePerf = `UNDERPERFORMING index by ${Math.abs(alpha).toFixed(2)}%`;
          else relativePerf = `Moving IN-LINE with index (alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%)`;
        }
        
        contextParts.push(`=== STOCK CONTEXT ===
Symbol: ${s.symbol ?? 'N/A'}
Company: ${s.companyName ?? 'N/A'}
Last Price: ₹${s.lastPrice?.toLocaleString('en-IN') ?? 'N/A'}
Day Change: ${(s.change ?? 0) >= 0 ? '+' : ''}${s.change?.toFixed(2) ?? 'N/A'} (${(s.pChange ?? 0) >= 0 ? '+' : ''}${s.pChange?.toFixed(2) ?? 'N/A'}%)
${relativePerf ? `Relative Performance: ${relativePerf}` : ''}
Day Range: ₹${s.dayLow ?? 'N/A'} - ₹${s.dayHigh ?? 'N/A'}
52-Week Range: ₹${s.yearLow ?? 'N/A'} - ₹${s.yearHigh ?? 'N/A'}
30-Day Performance: ${(s.perChange30d ?? 0) >= 0 ? '+' : ''}${s.perChange30d?.toFixed(2) ?? 'N/A'}%
365-Day Performance: ${(s.perChange365d ?? 0) >= 0 ? '+' : ''}${s.perChange365d?.toFixed(2) ?? 'N/A'}%
Volume: ${s.totalTradedVolume?.toLocaleString('en-IN') ?? 'N/A'}`);
      }

      // RESEARCH CONTEXT
      if (context.research) {
        const r = context.research;
        contextParts.push(`=== AI RESEARCH SUMMARY ===
Verdict: ${r.verdict ?? 'N/A'}
Confidence: ${r.confidence ?? 'N/A'}%
Trend: ${r.trend ?? 'N/A'}
Momentum: ${r.momentum?.state ?? 'N/A'}
Technical Bias: ${r.technicalIndicators?.overallBias ?? 'N/A'}
RSI Status: ${r.technicalIndicators?.rsiStatus ?? 'N/A'}
MACD Signal: ${r.technicalIndicators?.macdSignal ?? 'N/A'}`);
      }

      if (context.pageContext) {
        contextParts.push(`User Location: ${context.pageContext}`);
      }

      if (contextParts.length > 0) {
        contextualMessage = `[ANALYSIS CONTEXT]\n${contextParts.join('\n\n')}\n\n[USER QUESTION]\n${question}`;
      }
    }

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add conversation history (already validated and limited to max 20)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: contextualMessage });

    console.log('Calling Lovable AI with context-aware message');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
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
    console.error('Market assistant error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
