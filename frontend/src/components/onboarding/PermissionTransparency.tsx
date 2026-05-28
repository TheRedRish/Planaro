import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { ShieldCheck, Eye, Edit3, ArrowRight } from 'lucide-react';

export function PermissionTransparency() {
  const { updateOnboardingStep, isUpdating } = useProfile();

  const handleNext = () => {
    updateOnboardingStep('calendar_provisioning');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto p-6">
      <div className="bg-card border rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Your Privacy & Permissions</h2>
        </div>

        <p className="text-muted-foreground mb-8 text-lg">
          To help you schedule effectively, Planaro needs specific access to your Google Calendar. 
          Here's exactly how we use your data:
        </p>

        <div className="grid gap-6 mb-10">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Primary Calendar: Read-Only</h3>
              <p className="text-muted-foreground">
                We only read your Primary Calendar to detect "Busy" blocks. 
                We never modify or delete your personal events.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Edit3 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Planaro Calendar: Full Access</h3>
              <p className="text-muted-foreground">
                We'll create a dedicated "Planaro" calendar. This is where we'll place 
                your scheduled tasks, keeping your primary calendar clean.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <p className="text-sm italic text-muted-foreground">
            "Planaro will never share your calendar data with third parties. 
            All scheduling logic runs locally in your browser."
          </p>
        </div>

        <Button 
          onClick={handleNext} 
          size="lg" 
          className="w-full gap-2 text-lg h-12"
          disabled={isUpdating}
        >
          {isUpdating ? "Saving..." : "I Understand, Let's Continue"}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
