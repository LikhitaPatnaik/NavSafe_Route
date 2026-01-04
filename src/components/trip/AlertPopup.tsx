import { TripAlert } from '@/types/route';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertPopupProps {
  alert: TripAlert;
  onDismiss: () => void;
  onReroute?: () => void;
}

const AlertPopup = ({ alert, onDismiss, onReroute }: AlertPopupProps) => {
  const getAlertConfig = () => {
    switch (alert.type) {
      case 'deviation':
        return {
          icon: MapPin,
          title: 'Route Deviation',
          className: 'border-warning/50 bg-warning/5',
          iconClassName: 'text-warning bg-warning/20',
        };
      case 'high-risk':
        return {
          icon: AlertTriangle,
          title: 'High Risk Zone',
          className: 'border-destructive/50 bg-destructive/5',
          iconClassName: 'text-destructive bg-destructive/20',
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Alert',
          className: 'border-border bg-card',
          iconClassName: 'text-primary bg-primary/20',
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50',
        'w-full max-w-md mx-4',
        'glass-strong rounded-2xl border-2 p-6 shadow-elevated',
        'animate-slide-up',
        config.className
      )}
    >
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.iconClassName)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{config.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{alert.message}</p>
          
          {alert.type === 'deviation' && onReroute && (
            <Button variant="warning" size="sm" onClick={onReroute}>
              Reroute to Safest Path
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;
