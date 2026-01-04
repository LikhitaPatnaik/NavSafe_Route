export type RiskLevel = 'safe' | 'moderate' | 'risky';

export type RouteType = 'fastest' | 'safest' | 'optimized';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  id: string;
  type: RouteType;
  distance: number; // in km
  duration: number; // in minutes
  safetyScore: number; // 0-100
  riskLevel: RiskLevel;
  path: LatLng[];
}

export interface TripState {
  source: string;
  destination: string;
  sourceCoords: LatLng | null;
  destinationCoords: LatLng | null;
  routes: RouteInfo[];
  selectedRoute: RouteInfo | null;
  isMonitoring: boolean;
  currentPosition: LatLng | null;
  alerts: TripAlert[];
  status: 'idle' | 'planning' | 'monitoring' | 'completed';
}

export interface TripAlert {
  id: string;
  type: 'deviation' | 'high-risk' | 'info';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export interface TripSummary {
  totalDistance: number;
  timeTaken: number;
  routeType: RouteType;
  safetyScore: number;
  alertsRaised: number;
  startTime: Date;
  endTime: Date;
}
