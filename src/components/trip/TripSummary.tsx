import { Button } from '@/components/ui/button';
import { TripSummary as TripSummaryType } from '@/types/route';
import { MapPin, Clock, Shield, AlertTriangle, Navigation, CheckCircle } from 'lucide-react';
import { useTrip } from '@/context/TripContext';

interface TripSummaryProps {
  summary: TripSummaryType;
  onNewTrip: () => void;
}

const TripSummaryComponent = ({ summary, onNewTrip }: TripSummaryProps) => {
  const getRouteLabel = () => {
    switch (summary.routeType) {
      case 'fastest': return 'Fastest Route';
      case 'safest': return 'Safest Route';
      case 'optimized': return 'Optimized Route';
    }
  };

  const getSafetyColor = () => {
    if (summary.safetyScore >= 70) return 'text-safe';
    if (summary.safetyScore >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-strong rounded-3xl p-8 max-w-lg w-full shadow-elevated animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-safe/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-safe" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Trip Complete!</h1>
          <p className="text-muted-foreground">Here's your trip summary</p>
        </div>

        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<MapPin className="w-5 h-5" />}
              label="Total Distance"
              value={`${summary.totalDistance} km`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Time Taken"
              value={`${summary.timeTaken} min`}
            />
            <StatCard
              icon={<Navigation className="w-5 h-5" />}
              label="Route Type"
              value={getRouteLabel()}
            />
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              label="Safety Score"
              value={`${summary.safetyScore}/100`}
              valueClassName={getSafetyColor()}
            />
          </div>

          {/* Alerts */}
          {summary.alertsRaised > 0 && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    {summary.alertsRaised} Alert{summary.alertsRaised > 1 ? 's' : ''} Raised
                  </p>
                  <p className="text-sm text-muted-foreground">
                    During this trip
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Info */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Started</span>
              <span className="text-foreground">
                {summary.startTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Ended</span>
              <span className="text-foreground">
                {summary.endTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* New Trip Button */}
          <Button variant="hero" size="lg" className="w-full" onClick={onNewTrip}>
            <Navigation className="w-5 h-5 mr-2" />
            Start New Trip
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  valueClassName = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="p-4 rounded-xl bg-secondary/50">
    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className={`text-lg font-semibold text-foreground ${valueClassName}`}>{value}</p>
  </div>
);

export default TripSummaryComponent;
