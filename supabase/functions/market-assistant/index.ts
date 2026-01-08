import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional equity market research assistant for the Indian stock market (NSE/BSE).

Your role is to explain market behavior, technical indicators, price action, and research insights clearly and responsibly.

CRITICAL RULES:
1. Use probability-based language (e.g., "there's approximately a 60% probability", "historically tends to", "may indicate")
2. NEVER give buy/sell instructions or recommendations
3. NEVER promise profits or guaranteed outcomes
4. NEVER provide specific price targets as predictions
5. Avoid hype, emotional tone, or urgency
6. If data is unavailable or uncertain, explicitly say so
7. Keep answers concise but insightful (2-4 paragraphs max)
8. Prefer explanation over prediction
9. Always include risk awareness when discussing market movements
10. Focus on education and understanding, not trading advice

ALLOWED TOPICS:
- Explaining RSI, MACD, Moving Averages and what they indicate
- Explaining price consolidation, breakouts, and trend patterns
- Explaining support/resistance logic and chart patterns
- Explaining market session behavior (pre-market, regular, post-market)
- Explaining volatility, volume patterns, and market sentiment
- Clarifying AI research verdicts and their methodology
- General market education and terminology

FORBIDDEN RESPONSES:
- "Buy now" or "Sell immediately"
- "Target price will be X"
- Any guaranteed outcome language
- Long-term investment advice
- Specific portfolio recommendations

When given stock context, use it to provide relevant explanations but always maintain educational framing.
End responses with brief risk awareness when discussing specific stocks.`;

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

    // Build context-aware user message
    let contextualMessage = question;
    
    if (context) {
      const contextParts: string[] = [];
      
      if (context.stock) {
        const s = context.stock;
        contextParts.push(`Current Stock Context:
- Symbol: ${s.symbol}
- Company: ${s.companyName}
- Last Price: ₹${s.lastPrice?.toLocaleString('en-IN')}
- Day Change: ${s.change >= 0 ? '+' : ''}${s.change?.toFixed(2)} (${s.pChange >= 0 ? '+' : ''}${s.pChange?.toFixed(2)}%)
- Day Range: ₹${s.dayLow} - ₹${s.dayHigh}
- 52-Week Range: ₹${s.yearLow} - ₹${s.yearHigh}
- 30-Day Performance: ${s.perChange30d >= 0 ? '+' : ''}${s.perChange30d?.toFixed(2)}%
- 365-Day Performance: ${s.perChange365d >= 0 ? '+' : ''}${s.perChange365d?.toFixed(2)}%
- Volume: ${s.totalTradedVolume?.toLocaleString('en-IN')}`);
      }

      if (context.research) {
        const r = context.research;
        contextParts.push(`AI Research Summary:
- Verdict: ${r.verdict}
- Confidence: ${r.confidence}%
- Trend: ${r.trend}
- Momentum: ${r.momentum?.state}
- Technical Bias: ${r.technicalIndicators?.overallBias || 'N/A'}
- RSI Status: ${r.technicalIndicators?.rsiStatus || 'N/A'}
- MACD Signal: ${r.technicalIndicators?.macdSignal || 'N/A'}`);
      }

      if (context.marketState) {
        contextParts.push(`Market Session: ${context.marketState}`);
      }

      if (context.pageContext) {
        contextParts.push(`User is viewing: ${context.pageContext}`);
      }

      if (contextParts.length > 0) {
        contextualMessage = `[CONTEXT PROVIDED]\n${contextParts.join('\n\n')}\n\n[USER QUESTION]\n${question}`;
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
