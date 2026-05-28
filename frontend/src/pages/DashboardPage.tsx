import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StagingArea } from '@/components/StagingArea';
import { CalendarPreview } from '@/components/CalendarPreview';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useScheduling } from '@/hooks/useScheduling';
import { useWeather } from '@/hooks/useWeather';
import type { Session } from '@supabase/supabase-js';

interface DashboardPageProps {
  session: Session;
}

export function DashboardPage({ session }: DashboardPageProps) {
  const { weather } = useWeather();
  const { 
    events, 
    syncing, 
    sync, 
    lockEvent, 
    lockingEventId 
  } = useGoogleCalendar(session.provider_token ?? undefined);

  const {
    selectedTask,
    setSelectedTask,
    proposals,
    committing,
    scheduleTask,
    commitProposal
  } = useScheduling({
    accessToken: session.provider_token ?? undefined,
    calendarEvents: events,
    weather,
    onSuccess: sync
  });

  useEffect(() => {
    if (session.provider_token) {
      sync();
    }
  }, [session.provider_token, sync]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
      <StagingArea onSchedule={scheduleTask} />
      <div className="flex flex-col gap-4 overflow-hidden">
        <CalendarPreview
          events={events}
          syncing={syncing}
          onSync={sync}
          onLock={lockEvent}
          lockingEventId={lockingEventId}
        />
        {selectedTask && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center justify-between text-sm">
              Proposals for: {selectedTask.title}
              {committing && <Loader2 className="h-3 w-3 animate-spin" />}
            </h3>
            <div className="flex flex-col gap-2">
              {proposals.map((p, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => commitProposal(p)}
                  disabled={committing}
                >
                  {p.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                  {p.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Button>
              ))}
              {proposals.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No slots available today.
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
                className="mt-2 text-xs"
                disabled={committing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
