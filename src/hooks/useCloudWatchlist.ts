import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LOCAL_WATCHLIST_KEY = 'nse-watchlist';

export function useCloudWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load watchlist from cloud when user logs in, clear on logout
  useEffect(() => {
    if (user) {
      loadCloudWatchlist();
    } else {
      // Clear watchlist on logout
      setWatchlist([]);
      localStorage.removeItem(LOCAL_WATCHLIST_KEY);
    }
  }, [user]);

  // Sync to localStorage for offline/guest access (only when logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(watchlist));
    }
  }, [watchlist, user]);

  const loadCloudWatchlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('symbol')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        const symbols = data.map(item => item.symbol);
        setWatchlist(symbols);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = useCallback(async (symbol: string) => {
    if (watchlist.includes(symbol)) return;
    
    // Optimistic update
    setWatchlist(prev => [...prev, symbol]);

    if (user) {
      try {
        const { error } = await supabase
          .from('watchlist')
          .insert({ user_id: user.id, symbol });
        
        if (error) throw error;
      } catch (error: any) {
        // Rollback on error
        setWatchlist(prev => prev.filter(s => s !== symbol));
        console.error('Failed to add to watchlist:', error);
      }
    }
  }, [user, watchlist]);

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    // Optimistic update
    setWatchlist(prev => prev.filter(s => s !== symbol));

    if (user) {
      try {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
        
        if (error) throw error;
      } catch (error: any) {
        // Rollback on error
        setWatchlist(prev => [...prev, symbol]);
        console.error('Failed to remove from watchlist:', error);
      }
    }
  }, [user]);

  const toggleWatchlist = useCallback(async (symbol: string) => {
    if (watchlist.includes(symbol)) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol);
    }
  }, [watchlist, addToWatchlist, removeFromWatchlist]);

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist]
  );

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    refresh: loadCloudWatchlist,
  };
}
