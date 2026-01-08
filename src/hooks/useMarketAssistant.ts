import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  stock?: Stock;
  research?: ResearchPrediction;
  marketState?: string;
  pageContext?: string;
}

interface UseMarketAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
  setContext: (context: ChatContext) => void;
}

// Anti-spam: minimum 2 seconds between requests
const MIN_REQUEST_INTERVAL = 2000;

export function useMarketAssistant(): UseMarketAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContextState] = useState<ChatContext>({});
  const lastRequestTime = useRef<number>(0);
  const consecutiveErrors = useRef<number>(0);

  const setContext = useCallback((newContext: ChatContext) => {
    setContextState(newContext);
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    // Anti-spam check
    const now = Date.now();
    if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
      toast.error('Please wait a moment before sending another message');
      return;
    }

    // Check for too many consecutive errors
    if (consecutiveErrors.current >= 5) {
      toast.error('Service temporarily unavailable. Please try again later.');
      return;
    }

    lastRequestTime.current = now;
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke('market-assistant', {
        body: {
          question: question.trim(),
          context,
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

      const assistantMessage: ChatMessage = {
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
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I'm unable to respond right now. ${message}. Please try again.`,
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
    setContext,
  };
}
