import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { RouteInfo, LatLng } from '@/types/route';
import { fetchSafetyZones } from '@/services/routingService';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  routes?: RouteInfo[];
  sourceCoords?: LatLng | null;
  destinationCoords?: LatLng | null;
  selectedRoute?: RouteInfo | null;
  currentPosition?: LatLng | null;
  isMonitoring?: boolean;
  showSafetyZones?: boolean;
}

// Visakhapatnam coordinates
const defaultCenter: LatLng = {
  lat: 17.6868,
  lng: 83.2185,
};

// Safety zone coordinates for Visakhapatnam areas
const areaCoordinates: Record<string, LatLng> = {
  'Gajuwaka': { lat: 17.7047, lng: 83.2113 },
  'Gopalapatnam': { lat: 17.7458, lng: 83.2614 },
  'Dwaraka Nagar': { lat: 17.7242, lng: 83.3059 },
  'MVP Colony': { lat: 17.7367, lng: 83.2851 },
  'Kancharapalem': { lat: 17.7180, lng: 83.2760 },
  'Madhurawada': { lat: 17.7833, lng: 83.3667 },
  'Pendurthi': { lat: 17.7909, lng: 83.2467 },
  'Seethammadhara': { lat: 17.7305, lng: 83.2987 },
  'Simhachalam': { lat: 17.7667, lng: 83.2500 },
  'Visakhapatnam Steel Plant Area': { lat: 17.6403, lng: 83.1638 },
  'Akkayyapalem': { lat: 17.7294, lng: 83.2935 },
  'Arilova': { lat: 17.7633, lng: 83.3083 },
  'Lawsons Bay': { lat: 17.7200, lng: 83.3400 },
  'Beach Road': { lat: 17.7050, lng: 83.3217 },
  'Jagadamba': { lat: 17.7142, lng: 83.3017 },
  'Railway New Colony': { lat: 17.7100, lng: 83.2900 },
  'One Town': { lat: 17.6967, lng: 83.2917 },
  'CBM Compound': { lat: 17.6900, lng: 83.2850 },
  'Allipuram': { lat: 17.7058, lng: 83.2942 },
  'Dabagardens': { lat: 17.7283, lng: 83.3017 },
  'Pothinamallayya Palem': { lat: 17.7450, lng: 83.2750 },
  'Kurmannapalem': { lat: 17.7550, lng: 83.2350 },
  'Naidu Thota': { lat: 17.7025, lng: 83.2958 },
  'Waltair': { lat: 17.7217, lng: 83.3200 },
  'Kirlampudi': { lat: 17.7333, lng: 83.3233 },
  'Rushikonda': { lat: 17.7689, lng: 83.3842 },
  'NAD Junction': { lat: 17.7283, lng: 83.2533 },
  'Isukathota': { lat: 17.7700, lng: 83.3700 },
  'Kommadi': { lat: 17.8000, lng: 83.3850 },
  'PM Palem': { lat: 17.7550, lng: 83.3650 },
  'Yendada': { lat: 17.7833, lng: 83.3833 },
  'Sagar Nagar': { lat: 17.7617, lng: 83.3533 },
  'Thatichetlapalem': { lat: 17.7383, lng: 83.2933 },
};

const MapView = ({ routes = [], sourceCoords, destinationCoords, selectedRoute, currentPosition, isMonitoring, showSafetyZones = true }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const safetyZoneLayersRef = useRef<L.CircleMarker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Get distinct colors for routes - BLUE for fastest, GREEN for safest
  const getRouteColor = (type: RouteInfo['type'], isSelected: boolean) => {
    const colors = {
      fastest: '#3b82f6', // Blue - fastest route
      safest: '#22c55e',  // Green - safest route  
      optimized: '#f59e0b', // Orange - optimized
    };
    return isSelected ? colors[type] : `${colors[type]}99`;
  };

  // Get color for safety zone based on safety score
  const getSafetyZoneColor = (safetyScore: number): string => {
    if (safetyScore >= 75) return '#22c55e'; // Green - safe
    if (safetyScore >= 50) return '#f59e0b'; // Orange - moderate  
    if (safetyScore >= 35) return '#ef4444'; // Red - risky
    return '#7f1d1d'; // Dark red - critical/black spot
  };

  // Initialize map using callback ref for reliable DOM access
  const initializeMap = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapRef.current) return;
    
    // Ensure the container has dimensions
    node.style.height = '100%';
    node.style.minHeight = '500px';
    node.style.width = '100%';
    
    try {
      const map = L.map(node, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 12,
        zoomControl: true,
      });

      // Add OSM tiles (using standard OSM for better reliability)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      mapContainer.current = node;
      
      // Force map to recalculate size
      requestAnimationFrame(() => {
        map.invalidateSize();
        setMapReady(true);
      });
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle routing when source and destination are set
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Remove existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (sourceCoords && destinationCoords) {
      // Create custom markers
      const sourceIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: hsl(var(--primary)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: hsl(var(--destructive)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const sourceMarker = L.marker([sourceCoords.lat, sourceCoords.lng], { icon: sourceIcon }).addTo(mapRef.current);
      const destMarker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon }).addTo(mapRef.current);
      markersRef.current.push(sourceMarker, destMarker);

      // Add routing control - hide default routes as we draw our own
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(sourceCoords.lat, sourceCoords.lng),
          L.latLng(destinationCoords.lat, destinationCoords.lng),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        show: false, // Hide the directions panel
        addWaypoints: false,
        lineOptions: {
          styles: [
            { color: 'transparent', weight: 0, opacity: 0 } // Hide default route
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
      });

      routingControl.addTo(mapRef.current);
      routingControlRef.current = routingControl;

      // Fit bounds to show both points
      const bounds = L.latLngBounds([
        [sourceCoords.lat, sourceCoords.lng],
        [destinationCoords.lat, destinationCoords.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [sourceCoords, destinationCoords, mapReady]);

  // Draw route paths from routes array
  useEffect(() => {
    if (!mapRef.current || !mapReady || routes.length === 0) return;

    // Clear existing route layers
    routeLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    routeLayersRef.current = [];

    // Draw each route
    routes.forEach(route => {
      if (route.path && route.path.length > 0) {
        const isSelected = selectedRoute?.id === route.id;
        const latLngs: L.LatLngExpression[] = route.path.map(p => [p.lat, p.lng] as L.LatLngTuple);
        const polyline = L.polyline(latLngs, {
          color: getRouteColor(route.type, isSelected),
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 1 : 0.6,
        });
        polyline.addTo(mapRef.current!);
        routeLayersRef.current.push(polyline);
      }
    });
  }, [routes, selectedRoute, mapReady]);

  // Load and display safety zones on map
  useEffect(() => {
    if (!mapRef.current || !mapReady || !showSafetyZones) return;

    // Clear existing safety zone layers
    safetyZoneLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    safetyZoneLayersRef.current = [];

    // Fetch and display safety zones
    const loadSafetyZones = async () => {
      try {
        const zones = await fetchSafetyZones();
        
        zones.forEach(zone => {
          const normalizedArea = zone.area.toLowerCase();
          let coords: LatLng | null = null;
          
          for (const [key, value] of Object.entries(areaCoordinates)) {
            if (key.toLowerCase() === normalizedArea || normalizedArea.includes(key.toLowerCase())) {
              coords = value;
              break;
            }
          }
          
          if (!coords || !mapRef.current) return;

          const color = getSafetyZoneColor(zone.safety_score);
          const isDangerous = zone.safety_score < 50;
          const radius = isDangerous ? 800 : 500; // Larger circles for dangerous areas

          // Create circle marker for the zone
          const circle = L.circleMarker([coords.lat, coords.lng], {
            radius: isDangerous ? 15 : 10,
            fillColor: color,
            color: isDangerous ? '#991b1b' : color,
            weight: isDangerous ? 3 : 2,
            opacity: 0.9,
            fillOpacity: isDangerous ? 0.5 : 0.3,
          });

          // Add popup with zone info
          const popupContent = `
            <div style="padding: 8px; min-width: 150px;">
              <strong style="font-size: 14px; color: ${color};">${zone.area}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">Safety Score: ${zone.safety_score}/100</span>
              <br/>
              <span style="font-size: 12px; color: #666;">Crime Count: ${zone.crime_count}</span>
              <br/>
              <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">
                ${zone.severity?.toUpperCase() || 'N/A'}
              </span>
              ${isDangerous ? '<br/><span style="font-size: 11px; color: #ef4444; font-weight: bold;">⚠️ HIGH RISK AREA</span>' : ''}
            </div>
          `;
          circle.bindPopup(popupContent);

          circle.addTo(mapRef.current);
          safetyZoneLayersRef.current.push(circle);

          // Add a larger semi-transparent area circle for dangerous zones
          if (isDangerous) {
            const areaCircle = L.circle([coords.lat, coords.lng], {
              radius: radius,
              fillColor: color,
              color: 'transparent',
              fillOpacity: 0.15,
            });
            areaCircle.addTo(mapRef.current);
            safetyZoneLayersRef.current.push(areaCircle as unknown as L.CircleMarker);
          }
        });
      } catch (error) {
        console.error('Error loading safety zones:', error);
      }
    };

    loadSafetyZones();
  }, [mapReady, showSafetyZones]);

  // Handle current position marker during monitoring
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (isMonitoring && currentPosition) {
      // Create pulsing user location marker
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: hsl(217, 91%, 60%); opacity: 0.3; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; inset: 4px; border-radius: 50%; background: hsl(217, 91%, 60%); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; inset: 8px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([currentPosition.lat, currentPosition.lng], { 
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
      
      userMarkerRef.current = marker;

      // Pan map to follow user
      mapRef.current.panTo([currentPosition.lat, currentPosition.lng], { animate: true });
    }
  }, [currentPosition, isMonitoring, mapReady]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden">
      <div 
        ref={initializeMap} 
        className="absolute inset-0 rounded-2xl z-0"
      />
      
      {!mapReady && (
        <div className="absolute inset-0 glass flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="glass rounded-xl p-4">
          {/* Route Legend */}
          {routes.length > 0 && (
            <>
              <p className="text-sm font-medium text-foreground mb-2">Routes</p>
              <div className="flex flex-wrap gap-4 mb-3">
                {routes.map((route) => (
                  <div key={route.id} className="flex items-center gap-2">
                    <div
                      className="w-6 h-1.5 rounded-full"
                      style={{ backgroundColor: getRouteColor(route.type, selectedRoute?.id === route.id) }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {route.type === 'fastest' ? '🔵 Fastest' : route.type === 'safest' ? '🟢 Safest' : '🟠 Optimized'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Safety Zone Legend */}
          <p className="text-sm font-medium text-foreground mb-2">Safety Zones</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Safe (75+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">Moderate (50-74)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Risky (35-49)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-red-900 border-2 border-red-700" />
              <span className="text-xs text-muted-foreground font-medium">⚠️ Black Spot (&lt;35)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
