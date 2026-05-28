import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreatePlanaroCalendar } from '@/services/google-calendar';
import { CalendarPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function CalendarProvisioning() {
  const { session } = useAuth();
  const { updateOnboardingStep, updatePlanaroCalendarId, isUpdating } = useProfile();
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProvision = async () => {
    const accessToken = session?.provider_token;
    if (!accessToken) {
      setError('Google access token not found. Please try logging in again.');
      return;
    }

    setProvisioning(true);
    setError(null);
    try {
      const calendar = await getOrCreatePlanaroCalendar(accessToken);
      
      // Save calendar ID to profile
      await new Promise<void>((resolve, reject) => {
        updatePlanaroCalendarId(calendar.id, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });

      setSuccess(true);
      
      // Brief delay to show success state before transitioning
      setTimeout(() => {
        updateOnboardingStep('baseline_routines');
      }, 1500);
    } catch (err: any) {
      console.error('Provisioning error:', err);
      setError(err.message || 'Failed to provision Planaro calendar. Please try again.');
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto p-6">
      <div className="bg-card border rounded-xl p-8 shadow-sm w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarPlus className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Calendar Setup</h2>
        </div>

        <p className="text-muted-foreground mb-8 text-lg">
          Planaro works by placing "Soft Commitments" on a dedicated calendar. 
          This keeps your primary calendar clean while we find the best spots for your tasks.
        </p>

        <div className="bg-muted/30 border rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-2">What happens now?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>We'll check if a "Planaro" calendar already exists in your Google account.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>If not, we'll create one for you automatically.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>All Planaro proposals will be synced to this new calendar.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-8 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Button 
          onClick={handleProvision} 
          size="lg" 
          className="w-full gap-2 text-lg h-12"
          disabled={provisioning || success || isUpdating}
        >
          {provisioning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Calendar...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Calendar Ready!
            </>
          ) : (
            "Create Planaro Calendar"
          )}
        </Button>
      </div>
    </div>
  );
}
