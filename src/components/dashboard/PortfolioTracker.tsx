import { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  IndianRupee,
  Edit2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortfolio, PortfolioHolding } from '@/hooks/usePortfolio';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';
import { PieChart as RechartPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioTrackerProps {
  stocks: Stock[];
}

const COLORS = ['hsl(162, 83%, 43%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(271, 91%, 65%)', 'hsl(0, 72%, 51%)', 'hsl(330, 81%, 60%)'];

export function PortfolioTracker({ stocks }: PortfolioTrackerProps) {
  const { holdings, addHolding, removeHolding, isLoading } = usePortfolio();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // Calculate portfolio metrics
  const portfolioData = useMemo(() => {
    return holdings.map(holding => {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      const currentPrice = stock?.lastPrice || holding.buyPrice;
      const investment = holding.quantity * holding.buyPrice;
      const currentValue = holding.quantity * currentPrice;
      const pnl = currentValue - investment;
      const pnlPercent = (pnl / investment) * 100;

      return {
        ...holding,
        currentPrice,
        investment,
        currentValue,
        pnl,
        pnlPercent,
      };
    });
  }, [holdings, stocks]);

  const totals = useMemo(() => {
    const totalInvestment = portfolioData.reduce((sum, h) => sum + h.investment, 0);
    const totalCurrentValue = portfolioData.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPnl = totalCurrentValue - totalInvestment;
    const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

    return { totalInvestment, totalCurrentValue, totalPnl, totalPnlPercent };
  }, [portfolioData]);

  const pieData = useMemo(() => {
    return portfolioData.map(h => ({
      name: h.symbol,
      value: h.currentValue,
    }));
  }, [portfolioData]);

  const handleAddHolding = () => {
    if (!selectedSymbol || !quantity || !buyPrice) return;
    
    const stock = stocks.find(s => s.symbol === selectedSymbol);
    if (!stock) return;

    addHolding(
      selectedSymbol,
      stock.companyName,
      parseInt(quantity),
      parseFloat(buyPrice)
    );

    setIsAddModalOpen(false);
    setSelectedSymbol('');
    setQuantity('');
    setBuyPrice('');
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      setBuyPrice(stock.lastPrice.toString());
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Portfolio Tracker
        </h3>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1">
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {holdings.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No holdings yet</p>
          <p className="text-xs text-muted-foreground">Add stocks to track your portfolio</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
              <p className="text-xs text-muted-foreground">Total Investment</p>
              <p className="font-semibold font-mono text-sm">
                ₹{totals.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="font-semibold font-mono text-sm">
                ₹{totals.totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="col-span-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total P/L</p>
                  <p className={cn(
                    "font-semibold font-mono flex items-center gap-1",
                    totals.totalPnl >= 0 ? "text-gain" : "text-loss"
                  )}>
                    {totals.totalPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {totals.totalPnl >= 0 ? '+' : ''}₹{totals.totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    <span className="text-xs">
                      ({totals.totalPnlPercent >= 0 ? '+' : ''}{totals.totalPnlPercent.toFixed(2)}%)
                    </span>
                  </p>
                </div>
                {pieData.length > 0 && (
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartPie>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={30}
                          strokeWidth={0}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </RechartPie>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Holdings List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {portfolioData.map((holding) => (
              <div 
                key={holding.id}
                className="p-3 rounded-lg bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{holding.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {holding.quantity} × ₹{holding.buyPrice.toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => removeHolding(holding.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    LTP: ₹{holding.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span className={cn(
                    "font-mono font-semibold",
                    holding.pnl >= 0 ? "text-gain" : "text-loss"
                  )}>
                    {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toFixed(0)} ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Holding Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Stock to Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Stock</Label>
              <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a stock" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {stocks.map(stock => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.companyName.substring(0, 25)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Buy Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="1500.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>
            {selectedSymbol && quantity && buyPrice && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-xs text-muted-foreground">Total Investment</p>
                <p className="font-semibold font-mono">
                  ₹{(parseInt(quantity) * parseFloat(buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHolding} disabled={!selectedSymbol || !quantity || !buyPrice}>
              Add Holding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
