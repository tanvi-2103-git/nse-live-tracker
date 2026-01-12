import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStockAssistant, StockAssistantContext } from '@/hooks/useStockAssistant';
import { ChatMessage } from './ChatMessage';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { MarketOverviewContext } from '@/hooks/useMarketAssistant';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StockAssistantProps {
  stock: Stock;
  research?: ResearchPrediction | null;
  marketSession?: string;
  marketOverview?: MarketOverviewContext | null;
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "Is this move driven by the market or stock-specific?", label: "Move Analysis" },
  { icon: BarChart3, text: "Explain the AI research verdict for this stock", label: "Research Verdict" },
  { icon: AlertTriangle, text: "What risks should I be aware of?", label: "Risk Factors" },
  { icon: HelpCircle, text: "How is this stock performing vs the index?", label: "Relative Performance" },
];

export function StockAssistant({ 
  stock, 
  research, 
  marketSession = 'UNKNOWN',
  marketOverview 
}: StockAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const context: StockAssistantContext = {
    stock,
    research,
    marketState: marketSession,
    marketOverview,
  };

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat,
    updateContext,
    isAuthenticated 
  } = useStockAssistant(context);

  // Update context when props change
  useEffect(() => {
    updateContext({
      stock,
      research,
      marketState: marketSession,
      marketOverview,
    });
  }, [stock, research, marketSession, marketOverview, updateContext]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput('');
    await sendMessage(question);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInput(question);
    inputRef.current?.focus();
  }, []);

  const isPositive = stock.pChange >= 0;
  const relativeAlpha = marketOverview?.indexChangePercent !== undefined
    ? stock.pChange - marketOverview.indexChangePercent
    : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mt-6 rounded-xl border border-border bg-secondary/20 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Stock Assistant
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary">
                    AI
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ask questions about {stock.symbol}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Context indicators */}
              <div className="hidden sm:flex items-center gap-2">
                {research && (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400">
                    Research
                  </Badge>
                )}
                {marketOverview && (
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    marketOverview.indexChangePercent >= 0 
                      ? "bg-gain/10 border-gain/30 text-gain" 
                      : "bg-loss/10 border-loss/30 text-loss"
                  )}>
                    Mkt {marketOverview.indexChangePercent >= 0 ? '+' : ''}{marketOverview.indexChangePercent?.toFixed(1)}%
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {/* Context Summary Bar */}
            <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 flex-wrap text-xs">
              <span className={cn(
                "font-mono font-medium",
                isPositive ? "text-gain" : "text-loss"
              )}>
                {stock.symbol}: {isPositive ? '+' : ''}{stock.pChange.toFixed(2)}%
              </span>
              {relativeAlpha !== null && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className={cn(
                    relativeAlpha >= 0 ? "text-gain" : "text-loss"
                  )}>
                    {relativeAlpha >= 0 ? 'Outperforming' : 'Underperforming'} index by {Math.abs(relativeAlpha).toFixed(2)}%
                  </span>
                </>
              )}
              {research && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Verdict: <span className={cn(
                      research.verdict?.trend === 'Bullish' && "text-gain",
                      research.verdict?.trend === 'Bearish' && "text-loss",
                      research.verdict?.trend === 'Neutral' && "text-accent"
                    )}>{research.verdict?.trend}</span>
                  </span>
                </>
              )}
            </div>

            {/* Chat Area */}
            <div className="h-[320px] flex flex-col">
              <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                <div className="py-4">
                  {messages.length === 0 ? (
                    <div className="space-y-4">
                      {/* Welcome */}
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          I'm your equity research assistant. Ask me about <span className="text-foreground font-medium">{stock.symbol}</span>'s performance, technical signals, or the AI research findings.
                        </p>
                      </div>

                      {/* Suggested Questions */}
                      <div className="grid grid-cols-2 gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestedQuestion(q.text)}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg text-left",
                              "bg-muted/50 hover:bg-muted border border-border/50",
                              "transition-colors duration-200"
                            )}
                          >
                            <q.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground">{q.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          role={msg.role}
                          content={msg.content}
                          timestamp={msg.timestamp}
                        />
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-3 py-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-muted-foreground">Analyzing {stock.symbol}...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border bg-card/50">
                {!isAuthenticated && (
                  <div className="text-center py-2 mb-2">
                    <Link to="/auth">
                      <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
                        <LogIn className="w-3 h-3" />
                        Sign in to save chat
                      </Button>
                    </Link>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about ${stock.symbol}...`}
                    className="min-h-[40px] max-h-[80px] resize-none bg-muted border-border text-sm"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-[40px] w-[40px] bg-primary hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    {messages.length > 0 && (
                      <Button
                        onClick={clearChat}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-[40px] text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-[9px] text-muted-foreground mt-2 text-center">
                  AI-assisted analysis for educational purposes only. Not financial advice.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
