# NSE Stock Market Dashboard - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Database Schema](#database-schema)
7. [Edge Functions (Backend API)](#edge-functions-backend-api)
8. [Components](#components)
9. [Custom Hooks](#custom-hooks)
10. [Type Definitions](#type-definitions)
11. [Authentication](#authentication)
12. [AI Integration](#ai-integration)
13. [Market Hours & Adaptive Refresh](#market-hours--adaptive-refresh)
14. [Security](#security)
15. [Deployment](#deployment)

---

## Overview

The **NSE Stock Market Dashboard** is a professional-grade, real-time stock market tracking application for the National Stock Exchange (NSE) of India. It provides live market data, AI-powered equity research, portfolio tracking, and personalized alerts.

### Key Highlights
- 📊 **Real-time NSE Data** - Live stock prices with adaptive refresh rates
- 🤖 **AI-Powered Research** - Multi-layered equity analysis using Google Gemini
- 📈 **Interactive Charts** - Candlestick and sparkline visualizations
- 🔔 **Price Alerts** - Browser notifications when stocks hit target prices
- 💼 **Portfolio Tracker** - Track holdings and P&L
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔐 **Secure Authentication** - User data isolation with Row Level Security

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **TanStack Query** | Server state management |
| **React Router v7** | Client-side routing |
| **Recharts** | Charting library |
| **Lightweight Charts** | Candlestick charts |
| **Framer Motion** | Animations (via shadcn) |

### Backend (Lovable Cloud / Supabase)
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database |
| **Edge Functions (Deno)** | Serverless API |
| **Row Level Security** | Data isolation |
| **Supabase Auth** | Authentication |

### AI Services
| Service | Purpose |
|---------|---------|
| **Google Gemini 2.5** | AI equity research & chat assistants |
| **Lovable AI Gateway** | Unified AI API access |

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── chatbot/           # AI assistant components
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── MarketAssistant.tsx
│   │   │   └── StockAssistant.tsx
│   │   ├── dashboard/         # Main dashboard components
│   │   │   ├── Header.tsx
│   │   │   ├── MarketOverview.tsx
│   │   │   ├── MarketStats.tsx
│   │   │   ├── StockTable.tsx
│   │   │   ├── StockRow.tsx
│   │   │   ├── StockDetailModal.tsx
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── SparklineChart.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   ├── AddAlertModal.tsx
│   │   │   ├── NewsFeed.tsx
│   │   │   ├── PortfolioTracker.tsx
│   │   │   ├── ResearchVerdictCard.tsx
│   │   │   ├── ResearchDetailedView.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SortDropdown.tsx
│   │   │   └── TabsNav.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/
│   │   ├── useStockData.ts           # Fetch NSE stock data
│   │   ├── useAdaptiveRefresh.ts     # Smart refresh intervals
│   │   ├── useCloudWatchlist.ts      # Cloud-synced watchlist
│   │   ├── useCloudAlerts.ts         # Price alert management
│   │   ├── usePortfolio.ts           # Portfolio tracking
│   │   ├── useMarketAssistant.ts     # Market AI chat
│   │   ├── useStockAssistant.ts      # Stock-specific AI chat
│   │   ├── useResearchPrediction.ts  # AI research analysis
│   │   └── useStockPrediction.ts     # Quick AI predictions
│   ├── lib/
│   │   ├── pdfGenerator.ts           # PDF export utilities
│   │   └── generateInstitutionalReport.ts  # Research PDF generation
│   ├── pages/
│   │   ├── Index.tsx          # Main dashboard
│   │   ├── Auth.tsx           # Login/Signup
│   │   └── NotFound.tsx       # 404 page
│   ├── types/
│   │   ├── stock.ts           # Stock data types
│   │   ├── market.ts          # Market data types
│   │   └── prediction.ts      # AI prediction types
│   └── integrations/
│       └── supabase/
│           ├── client.ts      # Supabase client (auto-generated)
│           └── types.ts       # Database types (auto-generated)
├── supabase/
│   ├── config.toml            # Supabase configuration
│   └── functions/
│       ├── nse-stocks/        # NSE data fetching
│       ├── research-prediction/  # AI equity research
│       ├── predict-stock/     # Quick AI predictions
│       ├── market-assistant/  # Market-wide AI chat
│       └── stock-assistant/   # Stock-specific AI chat
└── public/
    └── favicon.ico
```

---

## Features

### 1. Real-time Stock Data
- Live prices for NIFTY 50 stocks
- Automatic updates during market hours
- Sparkline charts showing intraday movement
- Color-coded price changes (green/red)

### 2. Market Overview
- NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT indices
- Intraday charts for each index
- Market session indicators (Open/Pre-Post/Closed)

### 3. Stock Detail Modal
- Candlestick chart (30-day historical)
- Key statistics (Open, High, Low, Close, Volume)
- 52-week high/low
- Year-over-year and monthly performance

### 4. AI-Powered Features

#### Research Analysis (3 Levels)
| Level | Description |
|-------|-------------|
| **Level 1: Verdict Card** | Quick buy/hold/sell recommendation with confidence score |
| **Level 2: Detailed View** | Full analyst reasoning, risk factors, price targets |
| **Level 3: PDF Report** | Institutional-grade downloadable research report |

#### AI Assistants
- **Market Assistant**: General market questions and analysis
- **Stock Assistant**: Stock-specific queries with context awareness

### 5. Watchlist
- Add/remove stocks from watchlist
- Cloud-synced for authenticated users
- Quick filter in stock table

### 6. Price Alerts
- Set alerts for price above/below targets
- Browser notifications when triggered
- Sound alerts
- Cloud persistence

### 7. Portfolio Tracker
- Track stock holdings
- Calculate total investment and current value
- P&L calculations
- Day change tracking

---

## Architecture

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   NSE Website   │────▶│  nse-stocks      │────▶│   React App     │
│   (Data Source) │     │  Edge Function   │     │   (Frontend)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌──────────────────┐              │
                        │  Supabase DB     │◀─────────────┤
                        │  (PostgreSQL)    │              │
                        └──────────────────┘              │
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Lovable AI     │◀───▶│  AI Edge         │◀─────────────┘
│  Gateway        │     │  Functions       │
└─────────────────┘     └──────────────────┘
```

### Request Flow for AI Features

1. User triggers AI analysis in frontend
2. Frontend calls Edge Function with stock data
3. Edge Function constructs prompt and calls Lovable AI Gateway
4. AI response is parsed and cached
5. Result displayed in UI

---

## Database Schema

### Tables

#### `profiles`
User profile information linked to auth.
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- display_name: text
- created_at: timestamp
- updated_at: timestamp
```

#### `watchlist`
User's saved stock watchlist.
```sql
- id: uuid (PK)
- user_id: uuid
- symbol: text
- created_at: timestamp
```

#### `price_alerts`
Price alert configurations.
```sql
- id: uuid (PK)
- user_id: uuid
- symbol: text
- company_name: text
- target_price: numeric
- condition: text ('above' | 'below')
- is_active: boolean
- triggered_at: timestamp (nullable)
- created_at: timestamp
```

#### `portfolio`
User's stock holdings.
```sql
- id: uuid (PK)
- user_id: uuid
- symbol: text
- company_name: text
- quantity: integer
- buy_price: numeric
- buy_date: date
- notes: text (nullable)
- created_at: timestamp
- updated_at: timestamp
```

#### `chat_messages`
AI assistant conversation history.
```sql
- id: uuid (PK)
- user_id: uuid
- assistant_type: text ('market' | 'stock')
- stock_symbol: text (nullable)
- role: text ('user' | 'assistant')
- message: text
- created_at: timestamp
```

#### `research_history`
Cached AI research results.
```sql
- id: uuid (PK)
- user_id: uuid
- stock_symbol: text
- research_json: jsonb
- created_at: timestamp
```

#### `ai_predictions`
Stored AI predictions.
```sql
- id: uuid (PK)
- user_id: uuid
- symbol: text
- trend: text
- short_term: text
- near_term: text
- confidence_percent: integer
- suggested_support: numeric
- suggested_resistance: numeric
- reasoning: text
- disclaimer: text
- prediction_text: text
- created_at: timestamp
```

#### `user_preferences`
User settings.
```sql
- user_id: uuid (PK)
- theme: text (default: 'dark')
- refresh_mode: text (default: 'adaptive')
- experience_level: text (default: 'beginner')
- created_at: timestamp
```

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring users can only access their own data:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

## Edge Functions (Backend API)

### 1. `nse-stocks`
Fetches live stock data from NSE.

**Endpoint**: `POST /functions/v1/nse-stocks`

**Response**:
```typescript
{
  stocks: Stock[],
  indexValue: number,
  indexChange: number,
  indexChangePercent: number,
  timestamp: string,
  source: 'live' | 'simulated'
}
```

### 2. `research-prediction`
Generates comprehensive AI equity research.

**Endpoint**: `POST /functions/v1/research-prediction`

**Request Body**:
```typescript
{
  stock: Stock
}
```

**Response**: Full `ResearchPrediction` object with verdict, analysis, and recommendations.

### 3. `predict-stock`
Quick AI prediction for a stock.

**Endpoint**: `POST /functions/v1/predict-stock`

**Request Body**:
```typescript
{
  stock: Stock
}
```

**Response**:
```typescript
{
  trend: 'bullish' | 'bearish' | 'neutral',
  shortTerm: string,
  nearTerm: string,
  confidence: number,
  support: number,
  resistance: number,
  reasoning: string
}
```

### 4. `market-assistant`
AI chatbot for market-wide questions.

**Endpoint**: `POST /functions/v1/market-assistant`

**Request Body**:
```typescript
{
  question: string,
  context: {
    stock?: Stock,
    research?: ResearchPrediction,
    marketState?: string,
    pageContext?: string,
    marketOverview?: MarketOverviewContext
  },
  conversationHistory: Array<{role: string, content: string}>
}
```

### 5. `stock-assistant`
AI chatbot for stock-specific questions.

**Endpoint**: `POST /functions/v1/stock-assistant`

**Request Body**: Similar to market-assistant with stock context.

---

## Components

### Dashboard Components

| Component | Description |
|-----------|-------------|
| `Header` | App header with refresh controls and market session indicator |
| `MarketOverview` | Index cards with intraday charts |
| `MarketStats` | Market statistics summary |
| `StockTable` | Main stock listing with sorting/filtering |
| `StockRow` | Individual stock row with sparkline |
| `StockDetailModal` | Full stock details popup |
| `CandlestickChart` | Historical price chart |
| `SparklineChart` | Inline mini chart |
| `AlertsPanel` | Price alerts list and management |
| `AddAlertModal` | Create new price alert |
| `NewsFeed` | Market news display |
| `PortfolioTracker` | Holdings and P&L view |
| `ResearchVerdictCard` | AI verdict summary (Level 1) |
| `ResearchDetailedView` | Full AI analysis (Level 2) |
| `SearchBar` | Stock search input |
| `SortDropdown` | Sort options selector |
| `TabsNav` | Tab navigation (All/Gainers/Losers/Watchlist) |

### AI Components

| Component | Description |
|-----------|-------------|
| `MarketAssistant` | Floating chat for market questions |
| `StockAssistant` | Embedded chat in stock modal |
| `ChatMessage` | Individual chat message bubble |
| `AIPredictionCard` | Quick prediction display |

---

## Custom Hooks

| Hook | Description |
|------|-------------|
| `useStockData` | Fetches NSE stock data with TanStack Query |
| `useAdaptiveRefresh` | Manages refresh intervals based on market hours |
| `useCloudWatchlist` | Cloud-synced watchlist management |
| `useCloudAlerts` | Price alert CRUD and notifications |
| `usePortfolio` | Portfolio holdings management |
| `useMarketAssistant` | Market AI chat state and API |
| `useStockAssistant` | Stock AI chat state and API |
| `useResearchPrediction` | AI research with caching |
| `useStockPrediction` | Quick AI predictions |
| `useAuth` | Authentication context hook |
| `useMobile` | Responsive breakpoint detection |

---

## Type Definitions

### Stock Types (`src/types/stock.ts`)

```typescript
interface Stock {
  symbol: string;
  companyName: string;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  perChange365d: number;
  perChange30d: number;
  lastUpdateTime: string;
  sparklineData: number[];
}

interface StockData {
  stocks: Stock[];
  indexValue: number;
  indexChange: number;
  indexChangePercent: number;
  timestamp: string;
  source: 'live' | 'simulated';
}
```

### Market Types (`src/types/market.ts`)

```typescript
interface PriceAlert {
  id: string;
  symbol: string;
  companyName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'market' | 'stock' | 'economy' | 'global';
  relatedSymbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}
```

### Prediction Types (`src/types/prediction.ts`)

```typescript
interface ResearchPrediction {
  // Core identification
  symbol: string;
  companyName: string;
  timestamp: string;
  
  // Dashboard verdict
  verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;
  summaryBullets: string[];
  
  // Detailed analysis
  marketState: MarketState;
  technicalAnalysis: TechnicalAnalysis;
  riskFactors: RiskItem[];
  priceTargets: PriceLevel[];
  
  // Full report data
  // ... (extensive fields for PDF generation)
}
```

---

## Authentication

### Implementation
- Uses Supabase Auth with email/password
- Auto-confirm email enabled for development
- Session management via `AuthContext`

### Flow
1. User navigates to `/auth`
2. Sign up or sign in with email/password
3. JWT stored in browser
4. Protected features become available
5. RLS policies enforce data isolation

### Protected Features
- Watchlist sync
- Price alerts
- Portfolio tracking
- Chat history persistence
- Research history caching

---

## AI Integration

### Lovable AI Gateway
All AI requests go through the Lovable AI Gateway, which:
- Provides unified access to Google Gemini models
- Handles rate limiting and error handling
- No API key required from users

### Models Used
- **google/gemini-2.5-flash**: Primary model for chat and research
- Fast response times with good reasoning capabilities

### Prompt Engineering
Each edge function contains carefully crafted prompts:
- Role assignment (equity analyst, market expert)
- Structured output requirements (JSON format)
- Disclaimer requirements
- Fallback handling for parsing failures

---

## Market Hours & Adaptive Refresh

### Indian Market Hours (IST)
| Session | Time | Refresh Rate |
|---------|------|--------------|
| Pre-Open | 9:00 - 9:15 | 15 seconds |
| Market Open | 9:15 - 15:30 | 5 seconds |
| Post-Market | 15:30 - 16:00 | 15 seconds |
| Closed | Other times | Manual only |

### Implementation
The `useAdaptiveRefresh` hook:
- Calculates IST time
- Determines market session
- Sets appropriate refresh interval
- Provides UI labels and indicators

---

## Security

### Frontend Security
- Input validation with Zod schemas
- XSS prevention through React's built-in escaping
- No sensitive data in localStorage

### Backend Security
- All edge functions use Zod input validation
- Optional JWT authentication (works for anonymous users)
- Rate limiting (2-second minimum between requests)
- CORS headers configured

### Database Security
- Row Level Security on all tables
- Foreign key constraints
- User data isolation enforced at database level

---

## Deployment

### Lovable Cloud
The application is deployed on Lovable Cloud with:
- Automatic frontend deployments
- Edge function auto-deployment
- Database managed by Supabase

### URLs
- **Preview**: Automatic staging URL
- **Production**: Custom domain configurable

### Environment Variables
```
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
LOVABLE_API_KEY          # AI Gateway access (auto-configured)
```

---

## Development

### Local Setup
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Key Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## API Rate Limits

| Service | Limit |
|---------|-------|
| NSE Data | 5s minimum interval |
| AI Chat | 2s between messages |
| Research Prediction | Cached for 10 minutes |

---

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License
This project is proprietary software built on Lovable platform.

---

## Support
For issues or feature requests, use the Lovable platform's built-in support features.
