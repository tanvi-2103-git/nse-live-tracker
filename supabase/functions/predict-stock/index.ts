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

interface PredictionResponse {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Predict stock request from user: ${userId}`);
    // === END AUTHENTICATION CHECK ===

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
        JSON.stringify({ error: 'AI Prediction unavailable – API Key not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build structured prompt for AI analysis
    const prompt = `You are an expert stock market analyst. Analyze the following NSE stock data and provide a prediction.

STOCK: ${stock.symbol} (${stock.companyName})

CURRENT MARKET DATA:
- Last Traded Price (LTP): ₹${stock.lastPrice}
- Today's Open: ₹${stock.open}
- Day High: ₹${stock.dayHigh}
- Day Low: ₹${stock.dayLow}
- Previous Close: ₹${stock.previousClose}
- Today's Change: ${stock.change >= 0 ? '+' : ''}₹${stock.change} (${stock.pChange >= 0 ? '+' : ''}${stock.pChange}%)
- Trading Volume: ${stock.totalTradedVolume.toLocaleString()} shares

HISTORICAL DATA:
- 52-Week High: ₹${stock.yearHigh}
- 52-Week Low: ₹${stock.yearLow}
- 30-Day Performance: ${stock.perChange30d >= 0 ? '+' : ''}${stock.perChange30d}%
- 1-Year Performance: ${stock.perChange365d >= 0 ? '+' : ''}${stock.perChange365d}%

TECHNICAL INDICATORS (calculated):
- Distance from 52W High: ${(((stock.yearHigh - stock.lastPrice) / stock.yearHigh) * 100).toFixed(2)}%
- Distance from 52W Low: ${(((stock.lastPrice - stock.yearLow) / stock.yearLow) * 100).toFixed(2)}%
- Day Range Position: ${(((stock.lastPrice - stock.dayLow) / (stock.dayHigh - stock.dayLow || 1)) * 100).toFixed(2)}%

Provide your analysis in the following JSON format ONLY (no other text):
{
  "trend": "bullish" | "bearish" | "sideways",
  "shortTermPrediction": "Brief prediction for next 1-2 hours of trading",
  "nearTermPrediction": "Prediction for next trading session/day",
  "confidencePercent": number between 50-90,
  "supportLevel": nearest support price level as number,
  "resistanceLevel": nearest resistance price level as number,
  "reasoning": "2-3 sentence technical analysis reasoning"
}

Base your analysis on:
1. Current price position within day's range
2. Momentum (today's change)
3. Position relative to 52-week range
4. 30-day and 1-year trends
5. Volume patterns (if high volume = strong move)`;

    console.log(`Generating prediction for ${stock.symbol}...`);

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
            content: "You are a professional stock market analyst. Always respond with valid JSON only. Never include markdown formatting, code blocks, or any text outside the JSON object." 
          },
          { role: "user", content: prompt }
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
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI prediction service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", aiData);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse AI response - handle potential markdown code blocks
    let parsedPrediction;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedPrediction = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback response based on technical data
      const trend = stock.pChange > 0.5 ? 'bullish' : stock.pChange < -0.5 ? 'bearish' : 'sideways';
      parsedPrediction = {
        trend,
        shortTermPrediction: `Based on current momentum, expect ${trend === 'bullish' ? 'upward' : trend === 'bearish' ? 'downward' : 'range-bound'} movement.`,
        nearTermPrediction: `${stock.symbol} may ${trend === 'bullish' ? 'test resistance' : trend === 'bearish' ? 'test support' : 'consolidate'} in the next session.`,
        confidencePercent: 65,
        supportLevel: Math.round(stock.dayLow * 0.995),
        resistanceLevel: Math.round(stock.dayHigh * 1.005),
        reasoning: `Analysis based on today's ${stock.pChange >= 0 ? 'positive' : 'negative'} change of ${stock.pChange.toFixed(2)}% and position within 52-week range.`
      };
    }

    const prediction: PredictionResponse = {
      trend: parsedPrediction.trend || 'sideways',
      shortTermPrediction: parsedPrediction.shortTermPrediction || 'Unable to determine short-term movement.',
      nearTermPrediction: parsedPrediction.nearTermPrediction || 'Unable to determine near-term movement.',
      confidencePercent: Math.min(90, Math.max(50, parsedPrediction.confidencePercent || 65)),
      supportLevel: parsedPrediction.supportLevel || stock.dayLow,
      resistanceLevel: parsedPrediction.resistanceLevel || stock.dayHigh,
      reasoning: parsedPrediction.reasoning || 'Analysis based on available market data.',
      disclaimer: 'This is AI-generated analysis for educational purposes only. NOT financial advice. Always do your own research before making investment decisions.',
      timestamp: new Date().toISOString(),
    };

    console.log(`Prediction generated for ${stock.symbol}:`, prediction.trend);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
