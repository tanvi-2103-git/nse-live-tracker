import { Bell, Trash2, ToggleLeft, ToggleRight, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceAlert } from '@/types/market';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: PriceAlert[];
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onClearAll: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
}

export function AlertsPanel({
  alerts,
  onRemoveAlert,
  onToggleAlert,
  onClearAll,
  notificationPermission,
  onRequestPermission,
}: AlertsPanelProps) {
  const activeAlerts = alerts.filter(a => a.isActive);
  const triggeredAlerts = alerts.filter(a => !a.isActive && a.triggeredAt);

  return (
    <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          Price Alerts
        </h3>
        <div className="flex items-center gap-2">
          {notificationPermission !== 'granted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestPermission}
              className="gap-2 text-xs"
            >
              <Settings className="w-3 h-3" />
              Enable Notifications
            </Button>
          )}
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No price alerts set</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click the bell icon on any stock to create an alert
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Active ({activeAlerts.length})
                </p>
                {activeAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onRemove={onRemoveAlert}
                    onToggle={onToggleAlert}
                  />
                ))}
              </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Triggered ({triggeredAlerts.length})
                </p>
                {triggeredAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onRemove={onRemoveAlert}
                    onToggle={onToggleAlert}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertItem({
  alert,
  onRemove,
  onToggle,
}: {
  alert: PriceAlert;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border mb-2 transition-all",
      alert.isActive 
        ? "bg-secondary/30 border-border/50" 
        : "bg-secondary/10 border-border/30 opacity-60"
    )}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{alert.symbol}</p>
        <p className="text-xs text-muted-foreground">
          {alert.condition === 'above' ? '↑ Above' : '↓ Below'} ₹{alert.targetPrice.toLocaleString()}
        </p>
        {alert.triggeredAt && (
          <p className="text-xs text-gain mt-1">
            ✓ Triggered at {new Date(alert.triggeredAt).toLocaleTimeString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(alert.id)}
          className="h-8 w-8"
        >
          {alert.isActive ? (
            <ToggleRight className="w-4 h-4 text-primary" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(alert.id)}
          className="h-8 w-8 hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
