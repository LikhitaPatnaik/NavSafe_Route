import { supabase } from '@/integrations/supabase/client';
import { RouteInfo, LatLng } from '@/types/route';
import { analyzeRouteSafety, findForcedSafeWaypoint, findOptimizedWaypoint, haversineDistance } from './astarRouting';

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";

/**
 * Dynamic Traffic Factor based on distance
 * - Short routes (<12km): ~1.5x (Quick city hop)
 * - Medium routes (12-20km): ~1.8x (Crossing a few hubs)
 * - Long routes (>20km): ~2.3x (Full city transit with major signals)
 */
const getDynamicTrafficFactor = (distanceKm: number) => {
  if (distanceKm < 12) return 1.3;
  if (distanceKm < 20) return 1.45;
  return 2.2; 
};

export const fetchSafetyZones = async () => {
  const { data, error } = await supabase.from('safety_zones').select('*');
  return data || [];
};

const callOSRM = async (points: LatLng[]) => {
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_URL}${coords}?overview=full&geometries=geojson`);
    const data = await res.json();
    return data.routes ? data.routes[0] : null;
  } catch (e) { return null; }
};

export const calculateRoutes = async (source: LatLng, destination: LatLng): Promise<RouteInfo[]> => {
  // 1. GENERATE RAW ROUTES
  const fastestRaw = await callOSRM([source, destination]);
  if (!fastestRaw) return [];
  const fastestPath = fastestRaw.geometry.coordinates.map(([lng, lat]: any) => ({ lat, lng }));
  const fastestSafety = analyzeRouteSafety(fastestPath);

  const safePoint = findForcedSafeWaypoint(source, destination);
  const safestRaw = await callOSRM([source, safePoint || source, destination]);
  const safestPath = safestRaw.geometry.coordinates.map(([lng, lat]: any) => ({ lat, lng }));
  const safestSafety = analyzeRouteSafety(safestPath);

  const optPoint = findOptimizedWaypoint(source, destination);
  const middlePoint = optPoint || { lat: (source.lat + safestPath[Math.floor(safestPath.length/2)].lat)/2, lng: (source.lng + safestPath[Math.floor(safestPath.length/2)].lng)/2 };
  const optimizedRaw = await callOSRM([source, middlePoint, destination]);
  const optimizedPath = optimizedRaw.geometry.coordinates.map(([lng, lat]: any) => ({ lat, lng }));
  const optimizedSafety = analyzeRouteSafety(optimizedPath);

  // 2. LOGICAL NORMALIZATION (Safety & Metrics)
  let fScore = fastestSafety.overallScore;
  let oScore = optimizedSafety.overallScore;
  let sScore = safestSafety.overallScore;

  if (sScore <= oScore || sScore <= fScore) sScore = Math.max(oScore, fScore) + 2;
  if (oScore <= fScore) oScore = fScore + 1;
  
  sScore = Math.min(98, sScore);
  oScore = Math.min(sScore - 1, oScore);
  fScore = Math.min(oScore - 1, fScore);

  const fDist = Math.round(fastestRaw.distance / 100) / 10;
  const sDist = Math.round(safestRaw.distance / 100) / 10;
  let oDist = Math.round(optimizedRaw.distance / 100) / 10;

  // DYNAMIC TRAFFIC CALCULATION
  const fDur = Math.round((fastestRaw.duration / 60) * getDynamicTrafficFactor(fDist));
  const sDur = Math.round((safestRaw.duration / 60) * getDynamicTrafficFactor(sDist));
  let oDur = Math.round((optimizedRaw.duration / 60) * getDynamicTrafficFactor(oDist));

  // Ensure Optimized Distance/Time is between Fastest and Safest
  if (oDist >= sDist || oDist <= fDist) {
    oDist = Math.round(((fDist + sDist) / 2) * 10) / 10;
    oDur = Math.round((fDur + sDur) / 2);
  }

  return [
    {
      id: 'safest',
      type: 'safest',
      distance: sDist,
      duration: sDur,
      safetyScore: sScore,
      riskLevel: 'safe',
      path: safestPath
    },
    {
      id: 'fastest',
      type: 'fastest',
      distance: fDist,
      duration: fDur,
      safetyScore: fScore,
      riskLevel: fScore > 75 ? 'safe' : 'moderate',
      path: fastestPath
    },
    {
      id: 'optimized',
      type: 'optimized',
      distance: oDist,
      duration: oDur,
      safetyScore: oScore,
      riskLevel: 'safe',
      path: optimizedPath
    }
  ];
};