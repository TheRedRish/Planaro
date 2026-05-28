import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StagingArea } from '@/components/StagingArea';
import { CalendarPreview } from '@/components/CalendarPreview';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useScheduling } from '@/hooks/useScheduling';
import { useWeather } from '@/hooks/useWeather';
import { fetchScheduledTasks } from '@/services/tasks';
import { fetchRoutines } from '@/services/routines';
import { cn } from '@/utils/cn';
import type { Session } from '@supabase/supabase-js';

interface DashboardPageProps {
  session: Session;
}

export function DashboardPage({ session }: DashboardPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { weather } = useWeather();

  const { data: scheduledTasks = [] } = useQuery({
    queryKey: ['tasks', 'scheduled'],
    queryFn: fetchScheduledTasks,
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: fetchRoutines,
  });

  const { 
    events, 
    syncing, 
    sync, 
    lockEvent, 
    lockingEventId,
    unschedulePlanaroEvent,
    deletePlanaroEvent,
    actingEventId
  } = useGoogleCalendar(session.provider_token ?? undefined);

  const {
    reviewQueue,
    currentReviewIndex,
    currentTask,
    proposals,
    selectedProposal,
    setSelectedProposal,
    batchPlan,
    committing,
    startReview,
    confirmSelection,
    cancelReview,
    updateProposal
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
    <div className="flex gap-4 h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Sidebar / Staging Area */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out flex-none overflow-hidden border rounded-lg bg-card shadow-sm",
          sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-none"
        )}
      >
        <div className="w-80 h-full">
          <StagingArea 
            onSchedule={(t) => startReview([t])} 
            onScheduleBatch={startReview} 
          />
        </div>
      </div>

      {/* Main Content / Calendar */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-2 top-4 z-30 h-8 w-8 rounded-full border bg-background shadow-sm hover:bg-accent"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>

        <CalendarPreview
          events={events}
          proposals={proposals}
          selectedProposal={selectedProposal}
          batchPlan={batchPlan}
          selectedTask={currentTask}
          scheduledTasks={scheduledTasks}
          weather={weather}
          routines={routines}
          onSelectProposal={setSelectedProposal}
          onUpdateProposal={updateProposal}
          syncing={syncing}
          onSync={sync}
          onLock={lockEvent}
          lockingEventId={lockingEventId}
          onUnschedule={unschedulePlanaroEvent}
          onDelete={deletePlanaroEvent}
          actingEventId={actingEventId}
        />
        
        {/* Proposals Selection Header */}
        {reviewQueue.length > 0 && currentTask && (
          <div className="absolute right-4 bottom-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg z-40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 border border-primary-foreground/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-none mb-1">
                Previewing {currentReviewIndex + 1} of {reviewQueue.length}
              </span>
              <span className="text-sm font-bold truncate max-w-[200px]">
                {currentTask.title}
              </span>
            </div>
            
            <div className="h-8 w-px bg-primary-foreground/20" />
            
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-4 text-xs font-bold uppercase tracking-wider"
                onClick={confirmSelection}
                disabled={committing || !selectedProposal}
              >
                {committing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                {currentReviewIndex + 1 < reviewQueue.length ? "Confirm & Next" : "Confirm Plan"}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelReview}
                className="h-8 px-3 text-xs hover:bg-primary-foreground/10 text-primary-foreground"
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
