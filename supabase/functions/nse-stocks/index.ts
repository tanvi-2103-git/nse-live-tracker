import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache
let cachedData: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 10000; // 10 seconds

// Generate realistic mock data for NIFTY 50 stocks
function generateMockData() {
  const nifty50Stocks = [
    { symbol: "RELIANCE", companyName: "Reliance Industries Ltd.", basePrice: 2450 },
    { symbol: "TCS", companyName: "Tata Consultancy Services Ltd.", basePrice: 3850 },
    { symbol: "HDFCBANK", companyName: "HDFC Bank Ltd.", basePrice: 1650 },
    { symbol: "INFY", companyName: "Infosys Ltd.", basePrice: 1520 },
    { symbol: "ICICIBANK", companyName: "ICICI Bank Ltd.", basePrice: 1180 },
    { symbol: "HINDUNILVR", companyName: "Hindustan Unilever Ltd.", basePrice: 2380 },
    { symbol: "SBIN", companyName: "State Bank of India", basePrice: 780 },
    { symbol: "BHARTIARTL", companyName: "Bharti Airtel Ltd.", basePrice: 1420 },
    { symbol: "ITC", companyName: "ITC Ltd.", basePrice: 465 },
    { symbol: "KOTAKBANK", companyName: "Kotak Mahindra Bank Ltd.", basePrice: 1780 },
    { symbol: "LT", companyName: "Larsen & Toubro Ltd.", basePrice: 3450 },
    { symbol: "AXISBANK", companyName: "Axis Bank Ltd.", basePrice: 1120 },
    { symbol: "ASIANPAINT", companyName: "Asian Paints Ltd.", basePrice: 2850 },
    { symbol: "MARUTI", companyName: "Maruti Suzuki India Ltd.", basePrice: 12500 },
    { symbol: "TITAN", companyName: "Titan Company Ltd.", basePrice: 3250 },
    { symbol: "SUNPHARMA", companyName: "Sun Pharmaceutical Industries Ltd.", basePrice: 1680 },
    { symbol: "BAJFINANCE", companyName: "Bajaj Finance Ltd.", basePrice: 6850 },
    { symbol: "WIPRO", companyName: "Wipro Ltd.", basePrice: 480 },
    { symbol: "ULTRACEMCO", companyName: "UltraTech Cement Ltd.", basePrice: 11200 },
    { symbol: "HCLTECH", companyName: "HCL Technologies Ltd.", basePrice: 1580 },
    { symbol: "ONGC", companyName: "Oil and Natural Gas Corporation Ltd.", basePrice: 265 },
    { symbol: "NTPC", companyName: "NTPC Ltd.", basePrice: 385 },
    { symbol: "POWERGRID", companyName: "Power Grid Corporation of India Ltd.", basePrice: 305 },
    { symbol: "TATAMOTORS", companyName: "Tata Motors Ltd.", basePrice: 780 },
    { symbol: "M&M", companyName: "Mahindra & Mahindra Ltd.", basePrice: 2950 },
    { symbol: "JSWSTEEL", companyName: "JSW Steel Ltd.", basePrice: 880 },
    { symbol: "TATASTEEL", companyName: "Tata Steel Ltd.", basePrice: 145 },
    { symbol: "ADANIENT", companyName: "Adani Enterprises Ltd.", basePrice: 2650 },
    { symbol: "ADANIPORTS", companyName: "Adani Ports and SEZ Ltd.", basePrice: 1380 },
    { symbol: "COALINDIA", companyName: "Coal India Ltd.", basePrice: 485 },
    { symbol: "TECHM", companyName: "Tech Mahindra Ltd.", basePrice: 1650 },
    { symbol: "INDUSINDBK", companyName: "IndusInd Bank Ltd.", basePrice: 1450 },
    { symbol: "DRREDDY", companyName: "Dr. Reddy's Laboratories Ltd.", basePrice: 6200 },
    { symbol: "CIPLA", companyName: "Cipla Ltd.", basePrice: 1520 },
    { symbol: "GRASIM", companyName: "Grasim Industries Ltd.", basePrice: 2480 },
    { symbol: "BAJAJFINSV", companyName: "Bajaj Finserv Ltd.", basePrice: 1650 },
    { symbol: "DIVISLAB", companyName: "Divi's Laboratories Ltd.", basePrice: 4850 },
    { symbol: "BPCL", companyName: "Bharat Petroleum Corporation Ltd.", basePrice: 585 },
    { symbol: "EICHERMOT", companyName: "Eicher Motors Ltd.", basePrice: 4650 },
    { symbol: "NESTLEIND", companyName: "Nestle India Ltd.", basePrice: 2450 },
    { symbol: "BRITANNIA", companyName: "Britannia Industries Ltd.", basePrice: 5450 },
    { symbol: "APOLLOHOSP", companyName: "Apollo Hospitals Enterprise Ltd.", basePrice: 6850 },
    { symbol: "SBILIFE", companyName: "SBI Life Insurance Company Ltd.", basePrice: 1680 },
    { symbol: "HDFCLIFE", companyName: "HDFC Life Insurance Company Ltd.", basePrice: 685 },
    { symbol: "TATACONSUM", companyName: "Tata Consumer Products Ltd.", basePrice: 1120 },
    { symbol: "HEROMOTOCO", companyName: "Hero MotoCorp Ltd.", basePrice: 4850 },
    { symbol: "BAJAJ-AUTO", companyName: "Bajaj Auto Ltd.", basePrice: 9250 },
    { symbol: "SHRIRAMFIN", companyName: "Shriram Finance Ltd.", basePrice: 2650 },
    { symbol: "LTIM", companyName: "LTIMindtree Ltd.", basePrice: 5850 },
    { symbol: "HINDALCO", companyName: "Hindalco Industries Ltd.", basePrice: 625 },
  ];

  const now = new Date();
  
  return nifty50Stocks.map((stock, index) => {
    // Generate realistic random changes
    const changePercent = (Math.random() - 0.5) * 6; // -3% to +3%
    const change = stock.basePrice * (changePercent / 100);
    const ltp = stock.basePrice + change;
    const previousClose = stock.basePrice;
    const open = previousClose + (Math.random() - 0.5) * 20;
    const dayHigh = Math.max(ltp, open) + Math.random() * 30;
    const dayLow = Math.min(ltp, open) - Math.random() * 30;
    const volume = Math.floor(Math.random() * 10000000) + 500000;
    const value = volume * ltp;
    
    // Generate sparkline data (last 20 price points)
    const sparklineData: number[] = [];
    let currentPrice = previousClose;
    for (let i = 0; i < 20; i++) {
      currentPrice = currentPrice + (Math.random() - 0.5) * (stock.basePrice * 0.005);
      sparklineData.push(currentPrice);
    }
    sparklineData.push(ltp);

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      open: parseFloat(open.toFixed(2)),
      dayHigh: parseFloat(dayHigh.toFixed(2)),
      dayLow: parseFloat(dayLow.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      lastPrice: parseFloat(ltp.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      pChange: parseFloat(changePercent.toFixed(2)),
      totalTradedVolume: volume,
      totalTradedValue: parseFloat((value / 10000000).toFixed(2)), // In Crores
      yearHigh: parseFloat((dayHigh * 1.15).toFixed(2)),
      yearLow: parseFloat((dayLow * 0.85).toFixed(2)),
      perChange365d: parseFloat(((Math.random() - 0.3) * 50).toFixed(2)),
      perChange30d: parseFloat(((Math.random() - 0.5) * 15).toFixed(2)),
      lastUpdateTime: now.toLocaleTimeString('en-IN', { hour12: false }),
      sparklineData,
    };
  });
}

async function fetchNSEData() {
  // Check cache first
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log("Returning cached data");
    return cachedData.data;
  }

  try {
    // Try to fetch from NSE (this often fails due to their anti-bot measures)
    const response = await fetch(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Referer": "https://www.nseindia.com/",
          "Connection": "keep-alive",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Successfully fetched NSE data");
      
      const stocks = data.data.map((stock: any) => ({
        symbol: stock.symbol,
        companyName: stock.meta?.companyName || stock.symbol,
        open: stock.open,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        previousClose: stock.previousClose,
        lastPrice: stock.lastPrice,
        change: stock.change,
        pChange: stock.pChange,
        totalTradedVolume: stock.totalTradedVolume,
        totalTradedValue: stock.totalTradedValue,
        yearHigh: stock.yearHigh,
        yearLow: stock.yearLow,
        perChange365d: stock.perChange365d,
        perChange30d: stock.perChange30d,
        lastUpdateTime: stock.lastUpdateTime,
        sparklineData: [], // NSE doesn't provide this directly
      }));

      const result = {
        stocks,
        indexValue: data.metadata?.last,
        indexChange: data.metadata?.change,
        indexChangePercent: data.metadata?.pChange,
        timestamp: new Date().toISOString(),
        source: "live",
      };

      cachedData = { data: result, timestamp: Date.now() };
      return result;
    }
    
    throw new Error(`NSE API returned ${response.status}`);
  } catch (error) {
    console.log("NSE API failed, using mock data:", error);
    
    // Use mock data as fallback
    const stocks = generateMockData();
    
    // Calculate index value from stocks
    const totalValue = stocks.reduce((sum, s) => sum + s.lastPrice, 0);
    const avgChange = stocks.reduce((sum, s) => sum + s.pChange, 0) / stocks.length;
    
    const result = {
      stocks,
      indexValue: parseFloat((totalValue / 2.5).toFixed(2)), // Approximate NIFTY 50 value
      indexChange: parseFloat((avgChange * 200).toFixed(2)),
      indexChangePercent: parseFloat(avgChange.toFixed(2)),
      timestamp: new Date().toISOString(),
      source: "simulated",
    };

    cachedData = { data: result, timestamp: Date.now() };
    return result;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await fetchNSEData();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch stock data" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
