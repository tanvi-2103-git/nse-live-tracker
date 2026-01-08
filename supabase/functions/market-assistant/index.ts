import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional institutional equity research analyst for the Indian stock market (NSE/BSE).

Your role is to provide market-aware, contextual analysis that considers both individual stock performance AND broader market conditions.

CRITICAL MARKET-AWARE ANALYSIS RULES:
1. ALWAYS consider the overall market context before analyzing any stock:
   - Index trend (Nifty 50 direction and momentum)
   - Market breadth (ratio of advancers to decliners)
   - Volatility state (stable, elevated, or extreme)
   - Trading session context (intraday, closing, post-market)

2. ALWAYS compare stock performance RELATIVE TO the market:
   - Is the stock outperforming or underperforming the index?
   - Is the move stock-specific or part of broad market movement?
   - Use terms like "relative strength", "market-supported move", "divergence from index"

3. If market context is unavailable, explicitly state:
   "Market-wide context is limited; analysis is based on stock-level data only."

4. Use professional institutional analyst language:
   - "Relative strength" / "Relative weakness"
   - "Broad-based buying/selling pressure"
   - "Market-supported rally" / "Market-induced weakness"
   - "Risk amplified by weak market conditions"
   - "Outperforming amid sectoral rotation"
   - "Defensive positioning indicated"

5. NEVER judge a stock in isolation without market context.

REQUIRED RESPONSE STRUCTURE:
1. Market Condition Summary (1-2 sentences on index & breadth)
2. Stock vs Market Comparison (relative performance)
3. Technical/Fundamental Observation (with probability framing)
4. Conditional Outlook (if market does X, stock may do Y)
5. Risk-Aware Conclusion (institutional tone)

PROBABILITY-BASED LANGUAGE:
- Use phrases like "approximately 60% probability", "historically tends to", "elevated likelihood"
- Frame scenarios: "Base case suggests...", "If market breadth improves..."
- Avoid certainty: Never say "will", prefer "may", "could", "tends to"

FORBIDDEN:
- "Buy now" / "Sell immediately" / Any trading instructions
- "Target price will be X" / Guaranteed outcomes
- Emotional language, hype, or urgency
- Judging stocks without referencing market context
- Long-term investment advice

TONE:
- Institutional and professional
- Calm and analytical
- Data-driven with caveats
- Educational but sophisticated

Always end with a brief risk awareness statement that incorporates both stock-specific and market-level risks.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context, conversationHistory } = await req.json();

    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        const indexDirection = m.indexChangePercent >= 0 ? 'positive' : 'negative';
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
        if (Math.abs(m.indexChangePercent) > 2) volatilityState = 'Elevated';
        if (Math.abs(m.indexChangePercent) > 3) volatilityState = 'High';

        contextParts.push(`=== MARKET-WIDE CONTEXT (CRITICAL) ===
Index: Nifty 50
- Current Value: ${m.indexValue?.toLocaleString('en-IN')}
- Day Change: ${m.indexChange >= 0 ? '+' : ''}${m.indexChange?.toFixed(2)} (${m.indexChangePercent >= 0 ? '+' : ''}${m.indexChangePercent?.toFixed(2)}%)
- Index Direction: ${indexDirection.toUpperCase()}
- Market Breadth: ${m.advancers || 'N/A'} advancers vs ${m.decliners || 'N/A'} decliners (${marketBreadthDesc})
- Unchanged: ${m.unchanged || 'N/A'} stocks
- Volatility State: ${volatilityState}
- Trading Session: ${context.marketState || 'Unknown'}

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
          const stockChange = s.pChange || 0;
          const indexChange = context.marketOverview.indexChangePercent;
          const alpha = stockChange - indexChange;
          
          if (alpha > 1) relativePerf = `OUTPERFORMING index by ${alpha.toFixed(2)}%`;
          else if (alpha < -1) relativePerf = `UNDERPERFORMING index by ${Math.abs(alpha).toFixed(2)}%`;
          else relativePerf = `Moving IN-LINE with index (alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%)`;
        }
        
        contextParts.push(`=== STOCK CONTEXT ===
Symbol: ${s.symbol}
Company: ${s.companyName}
Last Price: ₹${s.lastPrice?.toLocaleString('en-IN')}
Day Change: ${s.change >= 0 ? '+' : ''}${s.change?.toFixed(2)} (${s.pChange >= 0 ? '+' : ''}${s.pChange?.toFixed(2)}%)
${relativePerf ? `Relative Performance: ${relativePerf}` : ''}
Day Range: ₹${s.dayLow} - ₹${s.dayHigh}
52-Week Range: ₹${s.yearLow} - ₹${s.yearHigh}
30-Day Performance: ${s.perChange30d >= 0 ? '+' : ''}${s.perChange30d?.toFixed(2)}%
365-Day Performance: ${s.perChange365d >= 0 ? '+' : ''}${s.perChange365d?.toFixed(2)}%
Volume: ${s.totalTradedVolume?.toLocaleString('en-IN')}`);
      }

      // RESEARCH CONTEXT
      if (context.research) {
        const r = context.research;
        contextParts.push(`=== AI RESEARCH SUMMARY ===
Verdict: ${r.verdict}
Confidence: ${r.confidence}%
Trend: ${r.trend}
Momentum: ${r.momentum?.state || 'N/A'}
Technical Bias: ${r.technicalIndicators?.overallBias || 'N/A'}
RSI Status: ${r.technicalIndicators?.rsiStatus || 'N/A'}
MACD Signal: ${r.technicalIndicators?.macdSignal || 'N/A'}`);
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

    // Add conversation history (last 10 messages max)
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
