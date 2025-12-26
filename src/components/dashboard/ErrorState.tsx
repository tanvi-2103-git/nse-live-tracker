import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-loss-soft flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-loss" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Failed to load stock data
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {message || 'An error occurred while fetching the stock data. Please try again.'}
      </p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}
