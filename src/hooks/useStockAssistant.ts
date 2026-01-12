import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  isAuthenticated: boolean;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => Promise<void>;
  updateContext: (context: StockAssistantContext) => void;
}

const MIN_REQUEST_INTERVAL = 2000;

export function useStockAssistant(initialContext: StockAssistantContext): UseStockAssistantReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<StockChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const contextRef = useRef<StockAssistantContext>(initialContext);
  const lastRequestTime = useRef<number>(0);
  const consecutiveErrors = useRef<number>(0);
  const currentSymbol = useRef<string>(initialContext.stock.symbol);
  const historyLoaded = useRef<boolean>(false);

  const isAuthenticated = !!user;

  // Load chat history when user or stock changes
  useEffect(() => {
    if (user && initialContext.stock.symbol) {
      // Reset if symbol changed
      if (currentSymbol.current !== initialContext.stock.symbol) {
        historyLoaded.current = false;
        setMessages([]);
      }
      
      if (!historyLoaded.current) {
        currentSymbol.current = initialContext.stock.symbol;
        loadChatHistory(initialContext.stock.symbol);
      }
    } else if (!user) {
      setMessages([]);
      historyLoaded.current = false;
    }
  }, [user, initialContext.stock.symbol]);

  const loadChatHistory = async (stockSymbol: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('assistant_type', 'stock')
        .eq('stock_symbol', stockSymbol)
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      if (data) {
        const loadedMessages: StockChatMessage[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.message,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
      historyLoaded.current = true;
    } catch (err) {
      console.error('Failed to load stock chat history:', err);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string, stockSymbol: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          assistant_type: 'stock',
          stock_symbol: stockSymbol,
          role,
          message: content,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error('Failed to save stock message:', err);
      return null;
    }
  };

  const updateContext = useCallback((context: StockAssistantContext) => {
    contextRef.current = context;
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const now = Date.now();
    if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
      toast.error('Please wait a moment before sending another message');
      return;
    }
    lastRequestTime.current = now;

    const stockSymbol = contextRef.current.stock.symbol;
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const userMessage: StockChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Save user message if authenticated
      if (user) {
        const savedId = await saveMessage('user', question, stockSymbol);
        if (savedId) {
          setMessages(prev => prev.map(m => 
            m.id === tempUserMsgId ? { ...m, id: savedId } : m
          ));
        }
      }

      const conversationHistory = messages.slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke('stock-assistant', {
        body: {
          question,
          context: contextRef.current,
          conversationHistory,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get response');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const tempAssistantMsgId = `temp-assistant-${Date.now()}`;
      const assistantMessage: StockChatMessage = {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: data.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message if authenticated
      if (user) {
        const savedId = await saveMessage('assistant', assistantMessage.content, stockSymbol);
        if (savedId) {
          setMessages(prev => prev.map(m => 
            m.id === tempAssistantMsgId ? { ...m, id: savedId } : m
          ));
        }
      }

      consecutiveErrors.current = 0;
    } catch (err) {
      consecutiveErrors.current++;
      
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setError(message);
      
      if (consecutiveErrors.current >= 3) {
        toast.error('Service temporarily unavailable. Please try again later.');
      } else {
        toast.error(message);
      }

      setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  const clearChat = useCallback(async () => {
    const stockSymbol = contextRef.current.stock.symbol;
    
    if (user) {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', user.id)
          .eq('assistant_type', 'stock')
          .eq('stock_symbol', stockSymbol);
      } catch (err) {
        console.error('Failed to clear stock chat history:', err);
      }
    }
    
    setMessages([]);
    setError(null);
  }, [user]);

  return {
    messages,
    isLoading,
    error,
    isAuthenticated,
    sendMessage,
    clearChat,
    updateContext,
  };
}
