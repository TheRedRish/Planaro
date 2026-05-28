import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { addRoutines } from '@/services/routines';
import { Moon, Briefcase, Clock, Loader2, ArrowRight } from 'lucide-react';

export function BaselineRoutines() {
  const { updateOnboardingStep, isUpdating: isStepUpdating } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  
  // Default values
  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('07:00');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addRoutines([
        {
          name: 'Sleep',
          start_time: sleepStart,
          end_time: sleepEnd,
          days_of_week: [1, 2, 3, 4, 5, 6, 7], // Every day
        },
        {
          name: 'Work',
          start_time: workStart,
          end_time: workEnd,
          days_of_week: [1, 2, 3, 4, 5], // Weekdays
        },
      ]);
      
      updateOnboardingStep('welcome');
    } catch (error) {
      console.error('Failed to save routines:', error);
      alert('Failed to save routines. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto p-6">
      <div className="bg-card border rounded-xl p-8 shadow-sm w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Your Baseline Routines</h2>
        </div>

        <p className="text-muted-foreground mb-8 text-lg">
          Tell us when you typically sleep and work. Planaro will avoid scheduling tasks during these times.
        </p>

        <div className="space-y-8 mb-10">
          {/* Sleep Routine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Moon className="w-5 h-5 text-indigo-500" />
              <h3>Sleep Schedule</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Go to bed</label>
                <input 
                  type="time" 
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="w-full bg-background border rounded-md h-10 px-3"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Wake up</label>
                <input 
                  type="time" 
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="w-full bg-background border rounded-md h-10 px-3"
                />
              </div>
            </div>
          </div>

          {/* Work Routine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <h3>Work Hours</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Start work</label>
                <input 
                  type="time" 
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full bg-background border rounded-md h-10 px-3"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">End work</label>
                <input 
                  type="time" 
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full bg-background border rounded-md h-10 px-3"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              * Work routines are applied to Monday through Friday by default.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          size="lg" 
          className="w-full gap-2 text-lg h-12"
          disabled={isSaving || isStepUpdating}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Continue"}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
