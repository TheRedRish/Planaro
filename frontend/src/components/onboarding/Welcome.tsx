import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { Sparkles, LayoutDashboard, Calendar, ListTodo, PartyPopper } from 'lucide-react';

export function Welcome() {
  const { updateOnboardingStep, isUpdating } = useProfile();

  const handleFinish = () => {
    updateOnboardingStep('completed');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto p-6 text-center">
      <div className="p-4 bg-primary/10 rounded-full mb-6">
        <PartyPopper className="w-12 h-12 text-primary" />
      </div>
      
      <h2 className="text-3xl font-bold mb-4">Welcome to Planaro!</h2>
      <p className="text-muted-foreground text-lg mb-10 max-w-lg">
        You're all set. Here's a quick tour of your new scheduling workspace.
      </p>

      <div className="grid gap-6 text-left w-full mb-12">
        <div className="flex gap-4 p-4 border rounded-xl bg-card">
          <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
            <ListTodo className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Staging Area</h3>
            <p className="text-muted-foreground text-sm">
              Quickly add tasks here. Planaro will automatically find the best time for them on your calendar.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 border rounded-xl bg-card">
          <div className="p-2 bg-green-500/10 rounded-lg h-fit">
            <Calendar className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Calendar Preview</h3>
            <p className="text-muted-foreground text-sm">
              Visualize your schedule. Planaro's suggestions appear as "Soft Commitments" for you to review.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 border rounded-xl bg-card">
          <div className="p-2 bg-purple-500/10 rounded-lg h-fit">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Smart Scheduling</h3>
            <p className="text-muted-foreground text-sm">
              Planaro considers your routines, weather, and existing events to minimize friction.
            </p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleFinish} 
        size="lg" 
        className="w-full gap-2 text-lg h-12"
        disabled={isUpdating}
      >
        <LayoutDashboard className="w-5 h-5" />
        Go to Dashboard
      </Button>
    </div>
  );
}
