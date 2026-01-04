import { Button } from '@/components/ui/button';
import { RouteInfo, RiskLevel } from '@/types/route';
import { Clock, MapPin, Shield, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: RouteInfo;
  isSelected: boolean;
  onSelect: () => void;
  onStartMonitoring: () => void;
}

const RouteCard = ({ route, isSelected, onSelect, onStartMonitoring }: RouteCardProps) => {
  const getRouteColor = () => {
    switch (route.type) {
      case 'fastest': return 'text-blue-400 border-blue-400/30 bg-blue-400/5';
      case 'safest': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5';
      case 'optimized': return 'text-amber-400 border-amber-400/30 bg-amber-400/5';
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    const config = {
      safe: { label: 'Safe', className: 'bg-safe/20 text-safe border-safe/30' },
      moderate: { label: 'Moderate', className: 'bg-warning/20 text-warning border-warning/30' },
      risky: { label: 'Risky', className: 'bg-destructive/20 text-destructive border-destructive/30' },
    };
    const { label, className } = config[level];
    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-medium border', className)}>
        {label}
      </span>
    );
  };

  const getRouteLabel = () => {
    switch (route.type) {
      case 'fastest': return '🟦 Fastest Route';
      case 'safest': return '🟩 Safest Route';
      case 'optimized': return '🟨 Optimized Route';
    }
  };

  return (
    <div
      className={cn(
        'glass rounded-xl p-5 cursor-pointer transition-all duration-300 border-2',
        isSelected ? getRouteColor() : 'border-transparent hover:border-border',
        isSelected && 'ring-2 ring-primary/20'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{getRouteLabel()}</h3>
          <p className="text-sm text-muted-foreground capitalize">{route.type} option</p>
        </div>
        {getRiskBadge(route.riskLevel)}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{route.distance} km</p>
            <p className="text-xs text-muted-foreground">Distance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{route.duration} min</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{route.safetyScore}/100</p>
            <p className="text-xs text-muted-foreground">Safety</p>
          </div>
        </div>
      </div>

      {isSelected && (
        <Button
          variant="hero"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onStartMonitoring();
          }}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Start Monitoring This Route
        </Button>
      )}
    </div>
  );
};

export default RouteCard;
