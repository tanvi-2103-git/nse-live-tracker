import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PriceAlert } from '@/types/market';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

const LOCAL_ALERTS_KEY = 'nse-price-alerts';
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRUZ59fKzKd/FwAhNKzl9dOGHhg2sez9666eYRwArMrqw5psNgqx4+y/fVUYA6W/w5pXNhMA';

export function useCloudAlerts(stocks: Stock[]) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(LOCAL_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  // Load alerts from cloud when user logs in, clear on logout
  useEffect(() => {
    if (user) {
      loadCloudAlerts();
    } else {
      // Clear alerts on logout
      setAlerts([]);
      localStorage.removeItem(LOCAL_ALERTS_KEY);
    }
  }, [user]);

  // Save to localStorage for offline access (only when logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts));
    }
  }, [alerts, user]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const loadCloudAlerts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        const mappedAlerts: PriceAlert[] = data.map(alert => ({
          id: alert.id,
          symbol: alert.symbol,
          companyName: alert.company_name,
          targetPrice: Number(alert.target_price),
          condition: alert.condition as 'above' | 'below',
          isActive: alert.is_active,
          createdAt: alert.created_at,
          triggeredAt: alert.triggered_at || undefined,
        }));
        setAlerts(mappedAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'price-alert',
      });
    }
  }, [notificationPermission]);

  // Check alerts against current prices
  useEffect(() => {
    if (!stocks.length) return;

    const activeAlerts = alerts.filter(a => a.isActive);
    
    activeAlerts.forEach(async (alert) => {
      const stock = stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;

      const triggered = alert.condition === 'above' 
        ? stock.lastPrice >= alert.targetPrice
        : stock.lastPrice <= alert.targetPrice;

      if (triggered) {
        playSound();
        
        const message = `${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} ₹${alert.targetPrice.toLocaleString()}! Current: ₹${stock.lastPrice.toLocaleString()}`;
        
        showNotification('🔔 Price Alert Triggered!', message);
        
        toast.success(`Price Alert: ${alert.symbol}`, {
          description: message,
          duration: 10000,
        });

        // Update alert as triggered
        const updatedAlerts = alerts.map(a => 
          a.id === alert.id 
            ? { ...a, isActive: false, triggeredAt: new Date().toISOString() }
            : a
        );
        setAlerts(updatedAlerts);

        // Update in cloud
        if (user) {
          await supabase
            .from('price_alerts')
            .update({ 
              is_active: false, 
              triggered_at: new Date().toISOString() 
            })
            .eq('id', alert.id);
        }
      }
    });
  }, [stocks, alerts, playSound, showNotification, user]);

  const addAlert = useCallback(async (
    symbol: string,
    companyName: string,
    targetPrice: number,
    condition: 'above' | 'below'
  ) => {
    const newAlert: PriceAlert = {
      id: `${symbol}-${Date.now()}`,
      symbol,
      companyName,
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // Optimistic update
    setAlerts(prev => [...prev, newAlert]);
    toast.success('Price alert created', {
      description: `Alert for ${symbol} ${condition} ₹${targetPrice.toLocaleString()}`,
    });

    if (user) {
      try {
        const { data, error } = await supabase
          .from('price_alerts')
          .insert({
            user_id: user.id,
            symbol,
            company_name: companyName,
            target_price: targetPrice,
            condition,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update with cloud ID
        if (data) {
          setAlerts(prev => prev.map(a => 
            a.id === newAlert.id ? { ...a, id: data.id } : a
          ));
        }
      } catch (error) {
        console.error('Failed to save alert:', error);
      }
    }
  }, [user]);

  const removeAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.info('Alert removed');

    if (user) {
      await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);
    }
  }, [user]);

  const toggleAlert = useCallback(async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));

    if (user) {
      await supabase
        .from('price_alerts')
        .update({ is_active: !alert.isActive })
        .eq('id', id);
    }
  }, [alerts, user]);

  const clearAllAlerts = useCallback(async () => {
    setAlerts([]);
    toast.info('All alerts cleared');

    if (user) {
      await supabase
        .from('price_alerts')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  return {
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    clearAllAlerts,
    notificationPermission,
    requestNotificationPermission,
    refresh: loadCloudAlerts,
  };
}
