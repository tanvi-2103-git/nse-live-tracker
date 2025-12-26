import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockData } from '@/types/stock';

async function fetchStockData(): Promise<StockData> {
  const { data, error } = await supabase.functions.invoke('nse-stocks');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as StockData;
}

export function useStockData(refetchInterval = 10000) {
  return useQuery({
    queryKey: ['nse-stocks'],
    queryFn: fetchStockData,
    refetchInterval,
    staleTime: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
