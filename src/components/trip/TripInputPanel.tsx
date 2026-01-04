import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Locate, ArrowRight, Loader2 } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import LocationAutocomplete from './LocationAutocomplete';
import { LatLng } from '@/types/route';

interface TripInputPanelProps {
  onFindRoutes: () => void;
  isLoading?: boolean;
}

const TripInputPanel = ({ onFindRoutes, isLoading = false }: TripInputPanelProps) => {
  const { trip, setSource, setDestination } = useTrip();
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            setSource(data.display_name || 'Current Location', coords);
          } catch {
            setSource('Current Location', coords);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          alert('Unable to get your location');
        }
      );
    }
  };

  const handleSourceChange = (value: string, coords?: LatLng) => {
    setSource(value, coords);
  };

  const handleDestinationChange = (value: string, coords?: LatLng) => {
    setDestination(value, coords);
  };

  const canFindRoutes = trip.source && trip.destination && trip.sourceCoords && trip.destinationCoords;

  return (
    <div className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-elevated animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plan Your Trip</h2>
          <p className="text-sm text-muted-foreground">Find the safest route</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Source Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Source Location
          </label>
          <LocationAutocomplete
            value={trip.source}
            onChange={handleSourceChange}
            placeholder="Enter starting point..."
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-primary"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
          >
            <Locate className={`w-4 h-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Locating...' : 'Use My Current Location'}
          </Button>
        </div>

        {/* Destination Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-destructive" />
            Destination
          </label>
          <LocationAutocomplete
            value={trip.destination}
            onChange={handleDestinationChange}
            placeholder="Enter destination..."
          />
        </div>

        {/* Find Routes Button */}
        <Button
          variant="hero"
          className="w-full mt-4"
          disabled={!canFindRoutes || isLoading}
          onClick={onFindRoutes}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating Routes...
            </>
          ) : (
            <>
              Find Safe Routes
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TripInputPanel;
