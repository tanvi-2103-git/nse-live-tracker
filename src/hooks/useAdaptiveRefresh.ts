import { useState, useEffect, useCallback, useMemo } from 'react';

type MarketSession = 'OPEN' | 'PRE_POST' | 'CLOSED';

interface AdaptiveRefreshState {
  enabled: boolean;
  interval: number | null;
  session: MarketSession;
  label: string;
  emoji: string;
  shouldRefresh: boolean;
}

// Get current time in India Standard Time
function getIndiaTime(): Date {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
  return new Date(utc + istOffset);
}

// Check if it's a weekend in IST
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Get market session based on IST time
function getMarketSession(date: Date): MarketSession {
  if (isWeekend(date)) {
    return 'CLOSED';
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Time boundaries in minutes from midnight
  const preOpenStart = 9 * 60; // 9:00 AM
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  const postMarketEnd = 16 * 60; // 4:00 PM

  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    return 'OPEN';
  } else if (
    (timeInMinutes >= preOpenStart && timeInMinutes < marketOpen) ||
    (timeInMinutes >= marketClose && timeInMinutes < postMarketEnd)
  ) {
    return 'PRE_POST';
  }
  
  return 'CLOSED';
}

// Get refresh interval based on session
function getRefreshInterval(session: MarketSession): number | null {
  switch (session) {
    case 'OPEN':
      return 5000; // 5 seconds
    case 'PRE_POST':
      return 15000; // 15 seconds
    case 'CLOSED':
      return null; // No auto-refresh
  }
}

// Get session label
function getSessionLabel(session: MarketSession): string {
  switch (session) {
    case 'OPEN':
      return 'Live (5s refresh)';
    case 'PRE_POST':
      return 'Limited Refresh (15s)';
    case 'CLOSED':
      return 'Market Closed — Manual Mode';
  }
}

// Get session emoji
function getSessionEmoji(session: MarketSession): string {
  switch (session) {
    case 'OPEN':
      return '🟢';
    case 'PRE_POST':
      return '🟡';
    case 'CLOSED':
      return '🔴';
  }
}

export function useAdaptiveRefresh(): AdaptiveRefreshState {
  const [session, setSession] = useState<MarketSession>(() => 
    getMarketSession(getIndiaTime())
  );
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Update session every minute to handle boundary crossings
  useEffect(() => {
    const checkSession = () => {
      const currentSession = getMarketSession(getIndiaTime());
      setSession(currentSession);
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds for session changes
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  // Trigger refresh signal based on interval
  useEffect(() => {
    const refreshInterval = getRefreshInterval(session);
    
    if (refreshInterval === null) {
      return; // No auto-refresh for closed market
    }

    const timer = setInterval(() => {
      setShouldRefresh(true);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [session]);

  // Reset shouldRefresh flag after it's been consumed
  const resetRefresh = useCallback(() => {
    setShouldRefresh(false);
  }, []);

  const state = useMemo(() => ({
    enabled: session !== 'CLOSED',
    interval: getRefreshInterval(session),
    session,
    label: getSessionLabel(session),
    emoji: getSessionEmoji(session),
    shouldRefresh,
  }), [session, shouldRefresh]);

  return state;
}

// Hook to use for consuming the refresh signal
export function useAdaptiveAutoRefresh(onRefresh: () => void) {
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const { enabled, interval, session, label, emoji } = useAdaptiveRefresh();

  // Auto-refresh effect
  useEffect(() => {
    // Don't auto-refresh if disabled or market closed or too many failures
    if (!enabled || interval === null || isDisabled) {
      return;
    }

    const timer = setInterval(() => {
      onRefresh();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, isDisabled, onRefresh]);

  // Track failures
  const handleRefreshFailure = useCallback(() => {
    setConsecutiveFailures(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setIsDisabled(true);
      }
      return newCount;
    });
  }, []);

  // Reset failures on success
  const handleRefreshSuccess = useCallback(() => {
    setConsecutiveFailures(0);
    setIsDisabled(false);
  }, []);

  // Re-enable auto-refresh
  const reEnableAutoRefresh = useCallback(() => {
    setConsecutiveFailures(0);
    setIsDisabled(false);
  }, []);

  return {
    enabled: enabled && !isDisabled,
    interval,
    session,
    label: isDisabled ? 'Auto-refresh disabled (errors)' : label,
    emoji: isDisabled ? '⚠️' : emoji,
    isDisabled,
    consecutiveFailures,
    handleRefreshFailure,
    handleRefreshSuccess,
    reEnableAutoRefresh,
  };
}
