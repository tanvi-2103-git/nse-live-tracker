import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [prediction, setPrediction] = useState<ResearchPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (stock: Stock, forceRefresh = false) => {
    const cacheKey = stock.symbol;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = predictionCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
        setPrediction(cached.prediction);
        setError(null);
        return cached.prediction;
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
      
      // Cache the prediction
      predictionCache.set(cacheKey, {
        prediction: newPrediction,
        cachedAt: Date.now()
      });

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
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return {
    prediction,
    isLoading,
    error,
    getPrediction,
    clearPrediction,
  };
}
