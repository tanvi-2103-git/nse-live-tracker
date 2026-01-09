import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { toast } from 'sonner';
import { MarketOverviewContext } from './useMarketAssistant';

export interface StockChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StockAssistantContext {
  stock: Stock;
  research?: ResearchPrediction | null;
  marketState?: string;
  marketOverview?: MarketOverviewContext | null;
}

interface UseStockAssistantReturn {
  messages: StockChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
  updateContext: (context: StockAssistantContext) => void;
}

// Anti-spam: minimum 2 seconds between requests
const MIN_REQUEST_INTERVAL = 2000;

export function useStockAssistant(initialContext?: StockAssistantContext): UseStockAssistantReturn {
  const [messages, setMessages] = useState<StockChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<StockAssistantContext | undefined>(initialContext);
  const lastRequestTime = useRef<number>(0);
  const consecutiveErrors = useRef<number>(0);

  // Reset chat when stock changes
  useEffect(() => {
    if (initialContext?.stock?.symbol !== context?.stock?.symbol) {
      setMessages([]);
      setError(null);
      consecutiveErrors.current = 0;
    }
    setContext(initialContext);
  }, [initialContext?.stock?.symbol]);

  const updateContext = useCallback((newContext: StockAssistantContext) => {
    setContext(newContext);
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;
    if (!context?.stock) {
      toast.error('No stock context available');
      return;
    }

    // Anti-spam check
    const now = Date.now();
    if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
      toast.error('Please wait before sending another message');
      return;
    }

    // Too many errors check
    if (consecutiveErrors.current >= 5) {
      toast.error('Service temporarily unavailable');
      return;
    }

    lastRequestTime.current = now;
    setError(null);

    // Add user message
    const userMessage: StockChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke('stock-assistant', {
        body: {
          question: question.trim(),
          context: {
            stock: context.stock,
            research: context.research,
            marketState: context.marketState,
            marketOverview: context.marketOverview,
          },
          conversationHistory,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get response');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      consecutiveErrors.current = 0;

      const assistantMessage: StockChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      consecutiveErrors.current++;
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setError(message);
      
      const errorMessage: StockChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I'm unable to respond right now. ${message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Assistant Error', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [context, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    consecutiveErrors.current = 0;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    updateContext,
  };
}
