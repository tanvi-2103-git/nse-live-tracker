import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Stock } from '@/types/stock';
import { ResearchPrediction } from '@/types/prediction';
import { toast } from 'sonner';

interface CachedPrediction {
  prediction: ResearchPrediction;
  cachedAt: number;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// In-memory cache for predictions
const predictionCache = new Map<string, CachedPrediction>();

export function useResearchPrediction() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<ResearchPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);

  // Clear cache on logout
  useEffect(() => {
    if (!user && previousUserId.current) {
      predictionCache.clear();
      setPrediction(null);
    }
    previousUserId.current = user?.id || null;
  }, [user]);

  const saveToCloud = async (stock: Stock, researchData: ResearchPrediction) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('research_history')
        .upsert({
          user_id: user.id,
          stock_symbol: stock.symbol,
          research_json: researchData as any,
        }, {
          onConflict: 'user_id,stock_symbol',
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save research history:', err);
    }
  };

  const loadFromCloud = async (symbol: string): Promise<ResearchPrediction | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('research_history')
        .select('research_json, created_at')
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const createdAt = new Date(data.created_at).getTime();
        // Only use cloud data if it's less than CACHE_DURATION old
        if (Date.now() - createdAt < CACHE_DURATION) {
          return data.research_json as unknown as ResearchPrediction;
        }
      }
      return null;
    } catch (err) {
      console.error('Failed to load research history:', err);
      return null;
    }
  };

  const getPrediction = useCallback(async (stock: Stock, forceRefresh = false) => {
    const cacheKey = stock.symbol;
    
    // Check in-memory cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = predictionCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
        setPrediction(cached.prediction);
        setError(null);
        return cached.prediction;
      }

      // Check cloud cache for authenticated users
      if (user) {
        const cloudCached = await loadFromCloud(cacheKey);
        if (cloudCached) {
          predictionCache.set(cacheKey, {
            prediction: cloudCached,
            cachedAt: Date.now(),
          });
          setPrediction(cloudCached);
          setError(null);
          return cloudCached;
        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('research-prediction', {
        body: { stock }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get research analysis');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const newPrediction = data as ResearchPrediction;
      
      // Cache the prediction in memory
      predictionCache.set(cacheKey, {
        prediction: newPrediction,
        cachedAt: Date.now()
      });

      // Save to cloud for authenticated users
      if (user) {
        await saveToCloud(stock, newPrediction);
      }

      setPrediction(newPrediction);
      return newPrediction;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research analysis failed';
      setError(message);
      toast.error('Research Analysis Failed', { description: message });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return {
    prediction,
    isLoading,
    error,
    isAuthenticated: !!user,
    getPrediction,
    clearPrediction,
  };
}
