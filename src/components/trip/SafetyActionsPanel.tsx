import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Flag, AlertOctagon, X } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SafetyActionsPanel = () => {
  const { trip } = useTrip();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  if (!trip.isMonitoring) return null;

  const handleReroute = () => {
    // Implement reroute logic
    console.log('Rerouting to safest path...');
  };

  const handleReport = () => {
    console.log('Reporting:', { reason: reportReason, severity: reportSeverity });
    setShowReportModal(false);
    setReportReason('');
  };

  const handleSos = () => {
    console.log('SOS triggered - sharing live location');
    setShowSosModal(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 animate-slide-up">
        {/* Reroute Button */}
        <Button
          variant="glass"
          size="lg"
          className="shadow-lg"
          onClick={handleReroute}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Reroute
        </Button>

        {/* Report Button */}
        <Button
          variant="glass"
          size="lg"
          className="shadow-lg"
          onClick={() => setShowReportModal(true)}
        >
          <Flag className="w-5 h-5 mr-2" />
          Report Area
        </Button>

        {/* SOS Button */}
        <Button
          variant="sos"
          size="lg"
          className="shadow-lg"
          onClick={() => setShowSosModal(true)}
        >
          <AlertOctagon className="w-5 h-5 mr-2" />
          SOS
        </Button>
      </div>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="glass-strong border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Report Unsafe Area</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Help improve safety data by reporting this area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Reason
              </label>
              <Input
                placeholder="Describe the safety concern..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Severity
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={reportSeverity === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportSeverity(level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="hero" className="w-full" onClick={handleReport}>
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SOS Modal */}
      <Dialog open={showSosModal} onOpenChange={setShowSosModal}>
        <DialogContent className="glass-strong border-destructive/30">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will share your live location with emergency contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-foreground">
              Are you sure you want to activate SOS? Your live location will be shared immediately.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSosModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="sos"
                className="flex-1"
                onClick={handleSos}
              >
                Share Live Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SafetyActionsPanel;
