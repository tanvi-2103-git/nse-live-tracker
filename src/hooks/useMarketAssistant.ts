import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MarketOverviewContext {
  indexName?: string;
  indexValue?: number;
  indexChange?: number;
  indexChangePercent?: number;
  advancers?: number;
  decliners?: number;
  unchanged?: number;
  volatilityState?: 'low' | 'moderate' | 'high';
}

export interface ChatContext {
  stock?: Stock;
  research?: ResearchPrediction;
  marketState?: string;
  pageContext?: string;
  marketOverview?: MarketOverviewContext;
}

interface UseMarketAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => Promise<void>;
  setContext: (context: ChatContext) => void;
}

const MIN_REQUEST_INTERVAL = 2000;

export function useMarketAssistant(): UseMarketAssistantReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const contextRef = useRef<ChatContext>({});
  const lastRequestTime = useRef<number>(0);
  const consecutiveErrors = useRef<number>(0);
  const historyLoaded = useRef<boolean>(false);

  const isAuthenticated = !!user;

  // Load chat history from database when user logs in
  useEffect(() => {
    if (user && !historyLoaded.current) {
      loadChatHistory();
    } else if (!user) {
      // Clear messages on logout
      setMessages([]);
      historyLoaded.current = false;
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('assistant_type', 'market')
        .is('stock_symbol', null)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data) {
        const loadedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.message,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
      historyLoaded.current = true;
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          assistant_type: 'market',
          stock_symbol: null,
          role,
          message: content,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error('Failed to save message:', err);
      return null;
    }
  };

  const setContext = useCallback((context: ChatContext) => {
    contextRef.current = context;
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
      toast.error('Please wait a moment before sending another message');
      return;
    }
    lastRequestTime.current = now;

    // Create user message with temporary ID
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Save user message to database if authenticated
      if (user) {
        const savedId = await saveMessage('user', question);
        if (savedId) {
          setMessages(prev => prev.map(m => 
            m.id === tempUserMsgId ? { ...m, id: savedId } : m
          ));
        }
      }

      // Prepare conversation history for API
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke('market-assistant', {
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
      const assistantMessage: ChatMessage = {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: data.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database if authenticated
      if (user) {
        const savedId = await saveMessage('assistant', assistantMessage.content);
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

      // Remove the user message if we failed
      setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  const clearChat = useCallback(async () => {
    if (user) {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', user.id)
          .eq('assistant_type', 'market')
          .is('stock_symbol', null);
      } catch (err) {
        console.error('Failed to clear chat history:', err);
      }
    }
    
    setMessages([]);
    setError(null);
  }, [user]);

  return {
    messages,
    isLoading: isLoading || isLoadingHistory,
    error,
    isAuthenticated,
    sendMessage,
    clearChat,
    setContext,
  };
}
