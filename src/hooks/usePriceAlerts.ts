import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceAlert } from '@/types/market';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

const ALERTS_KEY = 'nse-price-alerts';

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRUZ59fKzKd/FwAhNKzl9dOGHhg2sez9666eYRwArMrqw5psNgqx4+y/fVUYA6W/w5pXNhMA';

export function usePriceAlerts(stocks: Stock[]) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Show browser notification
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
    
    activeAlerts.forEach(alert => {
      const stock = stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;

      const triggered = alert.condition === 'above' 
        ? stock.lastPrice >= alert.targetPrice
        : stock.lastPrice <= alert.targetPrice;

      if (triggered) {
        // Trigger alert
        playSound();
        
        const message = `${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} ₹${alert.targetPrice.toLocaleString()}! Current: ₹${stock.lastPrice.toLocaleString()}`;
        
        showNotification('🔔 Price Alert Triggered!', message);
        
        toast.success(`Price Alert: ${alert.symbol}`, {
          description: message,
          duration: 10000,
        });

        // Mark alert as triggered
        setAlerts(prev => prev.map(a => 
          a.id === alert.id 
            ? { ...a, isActive: false, triggeredAt: new Date().toISOString() }
            : a
        ));
      }
    });
  }, [stocks, alerts, playSound, showNotification]);

  // Add new alert
  const addAlert = useCallback((
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
    
    setAlerts(prev => [...prev, newAlert]);
    toast.success('Price alert created', {
      description: `Alert for ${symbol} ${condition} ₹${targetPrice.toLocaleString()}`,
    });
  }, []);

  // Remove alert
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.info('Alert removed');
  }, []);

  // Toggle alert active state
  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    toast.info('All alerts cleared');
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    clearAllAlerts,
    notificationPermission,
    requestNotificationPermission,
  };
}
