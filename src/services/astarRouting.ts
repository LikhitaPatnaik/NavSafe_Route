import { LatLng, RiskLevel } from '@/types/route';

const LOCATIONS = [
  // --- DANGER ZONES ---
  { name: "Beach Road", lat: 17.7142, lng: 83.3235, risk: 11.0, isSafe: false },
  { name: "Dwarakanagar", lat: 17.7265, lng: 83.3013, risk: 9.07, isSafe: false },
  { name: "Vizianagaram", lat: 18.1067, lng: 83.3955, risk: 8.44, isSafe: false },
  { name: "Kancharapalem", lat: 17.7303, lng: 83.2801, risk: 7.89, isSafe: false },
  { name: "Gajuwaka", lat: 17.6896, lng: 83.2085, risk: 7.84, isSafe: false },
  { name: "One Town", lat: 17.6975, lng: 83.2974, risk: 7.12, isSafe: false },
  { name: "Maddilapalem", lat: 17.7356, lng: 83.3164, risk: 5.88, isSafe: false },
  { name: "MVP Colony", lat: 17.7436, lng: 83.3304, risk: 6.93, isSafe: false },
  
  // --- MODERATE/BALANCED ZONES ---
  { name: "NAD", lat: 17.7441, lng: 83.2505, risk: 2.1, isSafe: true, isModerate: true },
  { name: "Akkayapalem", lat: 17.7289, lng: 83.2986, risk: 2.85, isSafe: true, isModerate: true },
  { name: "PM Palem", lat: 17.7947, lng: 83.3444, risk: 2.53, isSafe: true, isModerate: true },

  // --- SAFE HAVENS ---
  { name: "Siripuram", lat: 17.7222, lng: 83.315, risk: 1.13, isSafe: true },
  { name: "Tagarapuvalasa", lat: 17.9304, lng: 83.4257, risk: 1.2, isSafe: true },
  { name: "Arilova", lat: 17.7705, lng: 83.3283, risk: 1.81, isSafe: true },
  { name: "Sheelanagar", lat: 17.7029, lng: 83.2291, risk: 1.39, isSafe: true }
];

export const haversineDistance = (p1: LatLng, p2: LatLng): number => {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const findForcedSafeWaypoint = (source: LatLng, destination: LatLng): LatLng | null => {
  const midPoint = { lat: (source.lat + destination.lat) / 2, lng: (source.lng + destination.lng) / 2 };
  const safePoints = LOCATIONS.filter(l => l.isSafe && !l.isModerate);
  const best = safePoints.sort((a, b) => haversineDistance(midPoint, a) - haversineDistance(midPoint, b))[0];
  return best ? { lat: best.lat, lng: best.lng } : null;
};

export const findOptimizedWaypoint = (source: LatLng, destination: LatLng): LatLng | null => {
    const midPoint = { lat: (source.lat + destination.lat) / 2, lng: (source.lng + destination.lng) / 2 };
    const moderatePoints = LOCATIONS.filter(l => l.isModerate);
    const best = moderatePoints.sort((a, b) => haversineDistance(midPoint, a) - haversineDistance(midPoint, b))[0];
    return best ? { lat: best.lat, lng: best.lng } : null;
};

export const analyzeRouteSafety = (path: LatLng[]) => {
  let scoreSum = 0;
  const samples = path.filter((_, i) => i % 10 === 0);
  samples.forEach(p => {
    let penalty = 0;
    LOCATIONS.filter(l => !l.isSafe).forEach(danger => {
      if (haversineDistance(p, danger) < 1200) penalty += danger.risk * 5;
    });
    scoreSum += Math.max(0, 100 - penalty);
  });
  const finalScore = Math.round(scoreSum / samples.length);
  return { overallScore: Math.min(98, finalScore), riskLevel: (finalScore > 75 ? 'safe' : finalScore > 45 ? 'moderate' : 'risky') as RiskLevel };
};
