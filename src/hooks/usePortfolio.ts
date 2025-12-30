import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PortfolioHolding {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  notes?: string;
  createdAt: string;
}

const LOCAL_PORTFOLIO_KEY = 'nse-portfolio';

export function usePortfolio() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(LOCAL_PORTFOLIO_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load from cloud when user logs in
  useEffect(() => {
    if (user) {
      loadCloudPortfolio();
    }
  }, [user]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_PORTFOLIO_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const loadCloudPortfolio = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const mapped: PortfolioHolding[] = data.map(item => ({
          id: item.id,
          symbol: item.symbol,
          companyName: item.company_name,
          quantity: item.quantity,
          buyPrice: Number(item.buy_price),
          buyDate: item.buy_date,
          notes: item.notes || undefined,
          createdAt: item.created_at,
        }));
        setHoldings(mapped);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addHolding = useCallback(async (
    symbol: string,
    companyName: string,
    quantity: number,
    buyPrice: number,
    buyDate?: string,
    notes?: string
  ) => {
    const newHolding: PortfolioHolding = {
      id: `${symbol}-${Date.now()}`,
      symbol,
      companyName,
      quantity,
      buyPrice,
      buyDate: buyDate || new Date().toISOString().split('T')[0],
      notes,
      createdAt: new Date().toISOString(),
    };
    
    setHoldings(prev => [newHolding, ...prev]);
    toast.success('Holding added', {
      description: `${quantity} shares of ${symbol} @ ₹${buyPrice}`,
    });

    if (user) {
      try {
        const { data, error } = await supabase
          .from('portfolio')
          .insert({
            user_id: user.id,
            symbol,
            company_name: companyName,
            quantity,
            buy_price: buyPrice,
            buy_date: buyDate || new Date().toISOString().split('T')[0],
            notes,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setHoldings(prev => prev.map(h => 
            h.id === newHolding.id ? { ...h, id: data.id } : h
          ));
        }
      } catch (error: any) {
        if (error.code === '23505') {
          toast.error('You already have a holding with this price. Update quantity instead.');
        } else {
          console.error('Failed to save holding:', error);
        }
      }
    }
  }, [user]);

  const updateHolding = useCallback(async (
    id: string,
    updates: Partial<Omit<PortfolioHolding, 'id' | 'createdAt'>>
  ) => {
    setHoldings(prev => prev.map(h => 
      h.id === id ? { ...h, ...updates } : h
    ));
    toast.success('Holding updated');

    if (user) {
      const dbUpdates: Record<string, any> = {};
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.buyPrice !== undefined) dbUpdates.buy_price = updates.buyPrice;
      if (updates.buyDate !== undefined) dbUpdates.buy_date = updates.buyDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      await supabase
        .from('portfolio')
        .update(dbUpdates)
        .eq('id', id);
    }
  }, [user]);

  const removeHolding = useCallback(async (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
    toast.info('Holding removed');

    if (user) {
      await supabase
        .from('portfolio')
        .delete()
        .eq('id', id);
    }
  }, [user]);

  return {
    holdings,
    isLoading,
    addHolding,
    updateHolding,
    removeHolding,
    refresh: loadCloudPortfolio,
  };
}
