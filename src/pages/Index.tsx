import { useState, useEffect, useRef } from 'react';
import { TripProvider, useTrip } from '@/context/TripContext';
import HeroSection from '@/components/landing/HeroSection';
import TripInputPanel from '@/components/trip/TripInputPanel';
import MapView from '@/components/trip/MapView';
import RouteCard from '@/components/trip/RouteCard';
import LiveStatusBanner from '@/components/trip/LiveStatusBanner';
import AlertPopup from '@/components/trip/AlertPopup';
import SafetyActionsPanel from '@/components/trip/SafetyActionsPanel';
import TripSummaryComponent from '@/components/trip/TripSummary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, StopCircle, Loader2 } from 'lucide-react';
import { calculateRoutes } from '@/services/routingService';
import { toast } from 'sonner';

const TripApp = () => {
  const {
    trip,
    setRoutes,
    selectRoute,
    startMonitoring,
    updatePosition,
    addAlert,
    dismissAlert,
    resetTrip,
    tripSummary,
    completeTip,
  } = useTrip();
  
  const [showLanding, setShowLanding] = useState(true);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);

  // Calculate routes using OSRM and safety data
  const handleFindRoutes = async () => {
    if (!trip.sourceCoords || !trip.destinationCoords) {
      toast.error('Please select both source and destination');
      return;
    }

    setIsCalculatingRoutes(true);
    
    try {
      const routes = await calculateRoutes(trip.sourceCoords, trip.destinationCoords);
      
      if (routes.length === 0) {
        toast.error('No routes found. Please try different locations.');
        return;
      }
      
      setRoutes(routes);
      toast.success(`Found ${routes.length} route${routes.length > 1 ? 's' : ''} with safety analysis`);
    } catch (error) {
      console.error('Error calculating routes:', error);
      toast.error('Failed to calculate routes. Please try again.');
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  // Track if GPS toast has been shown
  const gpsToastShownRef = useRef(false);

  // Real GPS tracking during monitoring
  useEffect(() => {
    if (!trip.isMonitoring) {
      gpsToastShownRef.current = false;
      return;
    }

    let watchId: number | null = null;

    // Request location permission and start tracking
    if (navigator.geolocation) {
      if (!gpsToastShownRef.current) {
        toast.info('Starting GPS tracking...');
        gpsToastShownRef.current = true;
      }
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updatePosition(newPosition);
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location permission denied. Please enable location access.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error('Location unavailable. Please check your GPS settings.');
          } else {
            toast.error('Unable to get your location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trip.isMonitoring]);

  const handleStartMonitoring = () => {
    if (trip.selectedRoute) {
      startMonitoring();
    }
  };

  const activeAlert = trip.alerts.find(a => !a.dismissed);

  // Show landing page
  if (showLanding && trip.status === 'idle') {
    return <HeroSection onStartTrip={() => setShowLanding(false)} />;
  }

  // Show trip summary
  if (trip.status === 'completed' && tripSummary) {
    return (
      <TripSummaryComponent
        summary={tripSummary}
        onNewTrip={resetTrip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveStatusBanner />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="glass"
            size="sm"
            onClick={() => {
              if (trip.isMonitoring) {
                completeTip();
              } else if (trip.routes.length > 0) {
                setRoutes([]);
              } else {
                setShowLanding(true);
                resetTrip();
              }
            }}
          >
            {trip.isMonitoring ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                End Trip
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </>
            )}
          </Button>
          
          {trip.isMonitoring && (
            <div className="glass rounded-full px-4 py-2">
              <span className="text-sm text-muted-foreground">
                Monitoring: <span className="text-primary font-medium capitalize">{trip.selectedRoute?.type}</span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen pt-20 pb-6 px-4 gap-6">
        {/* Left Panel */}
        <div className="lg:w-96 flex-shrink-0 space-y-4">
          {(trip.status === 'idle' || (trip.status === 'planning' && trip.routes.length === 0)) && (
            <TripInputPanel onFindRoutes={handleFindRoutes} isLoading={isCalculatingRoutes} />
          )}

          {/* Route Cards */}
          {trip.routes.length > 0 && !trip.isMonitoring && (
            <div className="space-y-3 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground px-1">Available Routes</h2>
              {trip.routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={trip.selectedRoute?.id === route.id}
                  onSelect={() => selectRoute(route)}
                  onStartMonitoring={handleStartMonitoring}
                />
              ))}
            </div>
          )}

          {/* Selected Route Info During Monitoring */}
          {trip.isMonitoring && trip.selectedRoute && (
            <div className="glass-strong rounded-2xl p-6 animate-slide-up">
              <h3 className="font-semibold text-foreground mb-4">Active Route</h3>
              <RouteCard
                route={trip.selectedRoute}
                isSelected={true}
                onSelect={() => {}}
                onStartMonitoring={() => {}}
              />
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 lg:h-[calc(100vh-8rem)]">
          <MapView 
            routes={trip.routes} 
            sourceCoords={trip.sourceCoords}
            destinationCoords={trip.destinationCoords}
            selectedRoute={trip.selectedRoute}
            currentPosition={trip.currentPosition}
            isMonitoring={trip.isMonitoring}
          />
        </div>
      </div>

      {/* Safety Actions Panel */}
      <SafetyActionsPanel />

      {/* Alert Popup */}
      {activeAlert && (
        <AlertPopup
          alert={activeAlert}
          onDismiss={() => dismissAlert(activeAlert.id)}
          onReroute={() => {
            dismissAlert(activeAlert.id);
            // Implement reroute logic
          }}
        />
      )}
    </div>
  );
};

const Index = () => (
  <TripProvider>
    <TripApp />
  </TripProvider>
);

export default Index;
