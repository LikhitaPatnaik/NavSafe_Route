import { Button } from '@/components/ui/button';
import { Shield, MapPin, Navigation, AlertTriangle } from 'lucide-react';

interface HeroSectionProps {
  onStartTrip: () => void;
}

const HeroSection = ({ onStartTrip }: HeroSectionProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">AI-Powered Safety Navigation</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="text-foreground">Nav</span>
          <span className="gradient-text">Safe</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Travel Smart. Travel Safe.
        </p>
        <p className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          AI-powered route safety monitoring with crime-aware navigation. 
          Find the safest path to your destination in real-time.
        </p>

        {/* CTA Button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="hero" size="xl" onClick={onStartTrip} className="group">
            <Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            Start Safe Trip
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <FeatureCard
            icon={<MapPin className="w-6 h-6" />}
            title="Smart Routes"
            description="Compare fastest, safest, and optimized routes instantly"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Safety Scores"
            description="Real-time safety scores based on area crime data"
          />
          <FeatureCard
            icon={<AlertTriangle className="w-6 h-6" />}
            title="Live Monitoring"
            description="Get alerts when deviating from trusted routes"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass rounded-xl p-6 hover:bg-card/60 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default HeroSection;
