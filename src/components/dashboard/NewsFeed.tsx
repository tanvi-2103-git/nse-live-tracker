import { useMemo } from 'react';
import { Newspaper, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { NewsItem } from '@/types/market';
import { cn } from '@/lib/utils';

// Generate realistic mock news data
function generateMockNews(): NewsItem[] {
  const newsTemplates: Omit<NewsItem, 'id' | 'publishedAt'>[] = [
    {
      title: "NIFTY 50 hits new all-time high amid strong FII inflows",
      summary: "The benchmark index surged past previous records as foreign institutional investors poured in over ₹5,000 crore in a single session, driven by positive global cues.",
      source: "Economic Times",
      category: "market",
      sentiment: "positive",
      relatedSymbols: ["RELIANCE", "TCS", "HDFCBANK"],
    },
    {
      title: "RBI keeps repo rate unchanged at 6.5% for tenth consecutive time",
      summary: "The central bank maintained its stance on inflation control while signaling potential rate cuts in the coming quarters if inflation trends downward.",
      source: "Mint",
      category: "economy",
      sentiment: "neutral",
    },
    {
      title: "Reliance Industries announces major green energy investment",
      summary: "The conglomerate plans to invest ₹75,000 crore in renewable energy projects over the next five years, boosting its new energy transition goals.",
      source: "Business Standard",
      category: "stock",
      sentiment: "positive",
      relatedSymbols: ["RELIANCE"],
    },
    {
      title: "IT stocks rally as rupee weakens against dollar",
      summary: "Major IT exporters including TCS, Infosys, and Wipro saw gains as the rupee hit a new low, improving revenue outlook for export-driven companies.",
      source: "Moneycontrol",
      category: "stock",
      sentiment: "positive",
      relatedSymbols: ["TCS", "INFY", "WIPRO", "HCLTECH"],
    },
    {
      title: "Banking sector faces headwinds amid rising NPAs in SME segment",
      summary: "Public sector banks reported increased stress in small business loans, though overall asset quality remains manageable according to analysts.",
      source: "Financial Express",
      category: "stock",
      sentiment: "negative",
      relatedSymbols: ["SBIN", "AXISBANK", "ICICIBANK"],
    },
    {
      title: "Global markets mixed ahead of US Fed policy decision",
      summary: "Asian markets traded cautiously as investors await the Federal Reserve's interest rate decision, with potential implications for emerging market flows.",
      source: "Reuters",
      category: "global",
      sentiment: "neutral",
    },
    {
      title: "Auto sector sees strong demand despite festive season slowdown",
      summary: "Major automakers reported better-than-expected sales figures for the month, with Maruti and Tata Motors leading the gains in passenger vehicle segment.",
      source: "NDTV Profit",
      category: "stock",
      sentiment: "positive",
      relatedSymbols: ["MARUTI", "TATAMOTORS", "M&M"],
    },
    {
      title: "Pharma stocks surge on positive US FDA approvals",
      summary: "Sun Pharma and Dr. Reddy's lead the sector gains after receiving key product approvals from the US Food and Drug Administration.",
      source: "Bloomberg Quint",
      category: "stock",
      sentiment: "positive",
      relatedSymbols: ["SUNPHARMA", "DRREDDY", "CIPLA"],
    },
  ];

  const now = new Date();
  
  return newsTemplates.map((news, index) => ({
    ...news,
    id: `news-${index}`,
    publishedAt: new Date(now.getTime() - index * 45 * 60 * 1000).toISOString(), // Stagger by 45 mins
  }));
}

export function NewsFeed() {
  const news = useMemo(() => generateMockNews(), []);

  return (
    <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          Market News
        </h3>
        <span className="text-xs text-muted-foreground">Updated just now</span>
      </div>

      <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto custom-scrollbar">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(item.publishedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [item.publishedAt]);

  return (
    <article className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
      <div className="flex items-start gap-3">
        <SentimentIcon sentiment={item.sentiment} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{item.source}</span>
            {item.relatedSymbols && item.relatedSymbols.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  {item.relatedSymbols.slice(0, 3).map((symbol) => (
                    <span
                      key={symbol}
                      className="px-1.5 py-0.5 text-xs bg-secondary rounded text-foreground"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </article>
  );
}

function SentimentIcon({ sentiment }: { sentiment?: 'positive' | 'negative' | 'neutral' }) {
  switch (sentiment) {
    case 'positive':
      return (
        <div className="w-8 h-8 rounded-lg bg-gain-soft flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-gain" />
        </div>
      );
    case 'negative':
      return (
        <div className="w-8 h-8 rounded-lg bg-loss-soft flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-loss" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <Minus className="w-4 h-4 text-muted-foreground" />
        </div>
      );
  }
}
