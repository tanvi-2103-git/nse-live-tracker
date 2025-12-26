import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  companyName: string;
  currentPrice: number;
  onAddAlert: (targetPrice: number, condition: 'above' | 'below') => void;
}

export function AddAlertModal({
  isOpen,
  onClose,
  symbol,
  companyName,
  currentPrice,
  onAddAlert,
}: AddAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState(currentPrice.toFixed(2));
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (!isNaN(price) && price > 0) {
      onAddAlert(price, condition);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            Set Price Alert
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <p className="font-semibold">{symbol}</p>
            <p className="text-sm text-muted-foreground">{companyName}</p>
            <p className="text-lg font-mono mt-2">
              Current: ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Condition Selection */}
          <div className="space-y-2">
            <Label>Alert me when price goes</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCondition('above')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                  condition === 'above'
                    ? "bg-gain-soft border-gain text-gain"
                    : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-border"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Above
              </button>
              <button
                type="button"
                onClick={() => setCondition('below')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                  condition === 'below'
                    ? "bg-loss-soft border-loss text-loss"
                    : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-border"
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Below
              </button>
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (₹)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="text-lg font-mono"
              placeholder="Enter target price"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Bell className="w-4 h-4" />
              Create Alert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
