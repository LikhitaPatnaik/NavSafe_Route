import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TripState, RouteInfo, TripAlert, TripSummary, LatLng } from '@/types/route';

interface TripContextType {
  trip: TripState;
  setSource: (source: string, coords?: LatLng) => void;
  setDestination: (destination: string, coords?: LatLng) => void;
  setRoutes: (routes: RouteInfo[]) => void;
  selectRoute: (route: RouteInfo) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  updatePosition: (position: LatLng) => void;
  addAlert: (alert: Omit<TripAlert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  resetTrip: () => void;
  tripSummary: TripSummary | null;
  completeTip: () => void;
}

const initialState: TripState = {
  source: '',
  destination: '',
  sourceCoords: null,
  destinationCoords: null,
  routes: [],
  selectedRoute: null,
  isMonitoring: false,
  currentPosition: null,
  alerts: [],
  status: 'idle',
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [trip, setTrip] = useState<TripState>(initialState);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const setSource = (source: string, coords?: LatLng) => {
    setTrip(prev => ({ ...prev, source, sourceCoords: coords || prev.sourceCoords }));
  };

  const setDestination = (destination: string, coords?: LatLng) => {
    setTrip(prev => ({ ...prev, destination, destinationCoords: coords || prev.destinationCoords }));
  };

  const setRoutes = (routes: RouteInfo[]) => {
    setTrip(prev => ({ ...prev, routes, status: 'planning' }));
  };

  const selectRoute = (route: RouteInfo) => {
    setTrip(prev => ({ ...prev, selectedRoute: route }));
  };

  const startMonitoring = () => {
    setStartTime(new Date());
    setTrip(prev => ({ ...prev, isMonitoring: true, status: 'monitoring' }));
  };

  const stopMonitoring = () => {
    setTrip(prev => ({ ...prev, isMonitoring: false }));
  };

  const updatePosition = (position: LatLng) => {
    setTrip(prev => ({ ...prev, currentPosition: position }));
  };

  const addAlert = (alert: Omit<TripAlert, 'id' | 'timestamp' | 'dismissed'>) => {
    const newAlert: TripAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      dismissed: false,
    };
    setTrip(prev => ({ ...prev, alerts: [...prev.alerts, newAlert] }));
  };

  const dismissAlert = (id: string) => {
    setTrip(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a),
    }));
  };

  const completeTip = () => {
    if (trip.selectedRoute && startTime) {
      setTripSummary({
        totalDistance: trip.selectedRoute.distance,
        timeTaken: Math.round((new Date().getTime() - startTime.getTime()) / 60000),
        routeType: trip.selectedRoute.type,
        safetyScore: trip.selectedRoute.safetyScore,
        alertsRaised: trip.alerts.length,
        startTime,
        endTime: new Date(),
      });
    }
    setTrip(prev => ({ ...prev, status: 'completed', isMonitoring: false }));
  };

  const resetTrip = () => {
    setTrip(initialState);
    setTripSummary(null);
    setStartTime(null);
  };

  return (
    <TripContext.Provider
      value={{
        trip,
        setSource,
        setDestination,
        setRoutes,
        selectRoute,
        startMonitoring,
        stopMonitoring,
        updatePosition,
        addAlert,
        dismissAlert,
        resetTrip,
        tripSummary,
        completeTip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
