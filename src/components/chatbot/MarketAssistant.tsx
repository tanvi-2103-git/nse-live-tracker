import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles, TrendingUp, AlertTriangle, HelpCircle, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useMarketAssistant, ChatContext } from '@/hooks/useMarketAssistant';
import { ChatMessage } from './ChatMessage';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { cn } from '@/lib/utils';

interface MarketAssistantProps {
  currentStock?: Stock | null;
  currentResearch?: ResearchPrediction | null;
  marketSession?: string;
  pageContext?: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "Explain today's price action", shortText: "Price action" },
  { icon: BarChart3, text: "What does the RSI indicate here?", shortText: "RSI meaning" },
  { icon: AlertTriangle, text: "What risks should I watch?", shortText: "Risk factors" },
  { icon: HelpCircle, text: "Is this trend strong or weak?", shortText: "Trend strength" },
];

export function MarketAssistant({ 
  currentStock, 
  currentResearch, 
  marketSession = 'UNKNOWN',
  pageContext = 'Dashboard'
}: MarketAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    setContext 
  } = useMarketAssistant();

  // Update context when props change
  useEffect(() => {
    const newContext: ChatContext = {
      marketState: marketSession,
      pageContext,
    };
    
    if (currentStock) {
      newContext.stock = currentStock;
    }
    
    if (currentResearch) {
      newContext.research = currentResearch;
    }
    
    setContext(newContext);
  }, [currentStock, currentResearch, marketSession, pageContext, setContext]);

  // Auto-scroll to bottom when new messages arrive
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

  const hasContext = !!(currentStock || currentResearch);

  return (
    <>
      {/* Floating Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-300 hover:scale-105",
              "flex items-center justify-center"
            )}
            style={{ boxShadow: '0 4px 20px hsl(162 83% 43% / 0.4)' }}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="w-full sm:w-[440px] p-0 flex flex-col bg-background border-border"
        >
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-foreground text-left">Market Research Assistant</SheetTitle>
                  <p className="text-xs text-muted-foreground">AI-powered market insights</p>
                </div>
              </div>
              
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Context Badge */}
            {hasContext && (
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                  {currentStock ? `Analyzing: ${currentStock.symbol}` : 'Context Active'}
                </Badge>
                {marketSession && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      marketSession === 'OPEN' && "bg-gain/10 border-gain/30 text-gain",
                      marketSession === 'PRE_POST' && "bg-accent/10 border-accent/30 text-accent",
                      marketSession === 'CLOSED' && "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {marketSession === 'OPEN' ? '🟢 Live' : 
                     marketSession === 'PRE_POST' ? '🟡 Limited' : '🔴 Closed'}
                  </Badge>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Chat Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="min-h-full">
              {messages.length === 0 ? (
                <div className="p-6 space-y-6">
                  {/* Welcome Message */}
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Welcome to Market Assistant</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ask me about market trends, technical indicators, or get explanations about stock behavior.
                      </p>
                    </div>
                  </div>

                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Suggested Questions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestedQuestion(q.text)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg text-left",
                            "bg-muted/50 hover:bg-muted border border-border",
                            "transition-colors duration-200"
                          )}
                        >
                          <q.icon className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs text-foreground">{q.shortText}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Context Info */}
                  {hasContext && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary font-medium mb-1">📊 Context Available</p>
                      <p className="text-xs text-muted-foreground">
                        I have access to {currentStock?.symbol || 'current stock'} data and will provide relevant insights.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                    />
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-3 p-4 bg-muted/30">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">Analyzing...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about market trends, indicators..."
                className="min-h-[44px] max-h-[120px] resize-none bg-muted border-border"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[44px] w-[44px] bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground mt-2 text-center leading-tight">
              AI-assisted market insight for educational purposes only. Not financial advice.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
