import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

export interface StockPrediction {
  trend: 'bullish' | 'bearish' | 'sideways';
  shortTermPrediction: string;
  nearTermPrediction: string;
  confidencePercent: number;
  supportLevel: number;
  resistanceLevel: number;
  reasoning: string;
  disclaimer: string;
  timestamp: string;
}

interface CachedPrediction {
  prediction: StockPrediction;
  cachedAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// In-memory cache for predictions
const predictionCache = new Map<string, CachedPrediction>();

export function useStockPrediction() {
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
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
      const { data, error: invokeError } = await supabase.functions.invoke('predict-stock', {
        body: { stock }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get prediction');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const newPrediction = data as StockPrediction;
      
      // Cache the prediction
      predictionCache.set(cacheKey, {
        prediction: newPrediction,
        cachedAt: Date.now()
      });

      setPrediction(newPrediction);
      return newPrediction;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Prediction failed';
      setError(message);
      toast.error('AI Prediction Failed', { description: message });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  // Load prediction history from localStorage
  const savePredictionToHistory = useCallback((symbol: string, pred: StockPrediction) => {
    try {
      const historyKey = 'prediction_history';
      const existing = localStorage.getItem(historyKey);
      const history: Array<{ symbol: string; prediction: StockPrediction }> = existing 
        ? JSON.parse(existing) 
        : [];
      
      // Add new prediction and keep last 20
      history.unshift({ symbol, prediction: pred });
      if (history.length > 20) history.pop();
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save prediction history:', e);
    }
  }, []);

  return {
    prediction,
    isLoading,
    error,
    getPrediction,
    clearPrediction,
    savePredictionToHistory,
  };
}
