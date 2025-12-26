import { Stock } from '@/types/stock';

export interface PriceAlert {
  id: string;
  symbol: string;
  companyName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'market' | 'stock' | 'economy' | 'global';
  relatedSymbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface IndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  intradayData: { time: string; value: number }[];
}
