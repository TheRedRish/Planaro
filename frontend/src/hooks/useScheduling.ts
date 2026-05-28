import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateTask, type Task } from '@/services/tasks';
import { fetchRoutines, getBusyBlocksFromRoutines } from '@/services/routines';
import { findFreeSlots, generateProposals, type TimeSlot, type BusyBlock } from '@/utils/scheduling-engine';
import { isWeatherFavorable, type WeatherForecast } from '@/services/weather-provider';
import { getOrCreatePlanaroCalendar, createEvent, type GoogleEvent } from '@/services/google-calendar';

interface UseSchedulingProps {
  accessToken?: string;
  calendarEvents: GoogleEvent[];
  weather: WeatherForecast[];
  onSuccess?: () => void;
}

export function useScheduling({ accessToken, calendarEvents, weather, onSuccess }: UseSchedulingProps) {
  const [reviewQueue, setReviewQueue] = useState<Task[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [batchPlan, setBatchPlan] = useState<(TimeSlot & { taskId: string })[]>([]);
  
  const [proposals, setProposals] = useState<TimeSlot[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<TimeSlot | null>(null);
  
  const [committing, setCommitting] = useState(false);
  const queryClient = useQueryClient();

  const generateProposalsForIndex = useCallback(async (index: number, queue: Task[], currentPlan: (TimeSlot & {taskId: string})[]) => {
    if (index >= queue.length) return;
    const task = queue[index];
    
    const routines = await fetchRoutines();
    
    const isUrgent = task.condition_tags?.includes('Urgent');
    const daysToSearch = isUrgent ? 2 : 7; // Look 2 days ahead for urgent, 7 for normal

    const startBound = new Date();
    const endBound = new Date();
    endBound.setHours(23, 59, 59, 999);
    if (daysToSearch > 1) {
      endBound.setDate(endBound.getDate() + (daysToSearch - 1));
    }

    const busyFromRoutines: BusyBlock[] = [];
    for (let i = 0; i < daysToSearch; i++) {
      const d = new Date(startBound);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      busyFromRoutines.push(...getBusyBlocksFromRoutines(routines, d));
    }

    const busyFromCalendar: BusyBlock[] = calendarEvents.map(e => ({
      start: new Date(e.start.dateTime || e.start.date || ''),
      end: new Date(e.end.dateTime || e.end.date || ''),
      title: e.summary,
    }));

    const busyFromPlan: BusyBlock[] = currentPlan.map(p => ({
      start: p.start,
      end: p.end,
      title: 'Plan'
    }));

    const allBusy = [...busyFromRoutines, ...busyFromCalendar, ...busyFromPlan];

    const isOutdoor = task.condition_tags?.includes('Outdoor');
    const weatherCheck = isOutdoor 
      ? (time: Date) => isWeatherFavorable(weather, time)
      : undefined;

    const freeSlots = findFreeSlots(allBusy, startBound, endBound, task.duration_minutes, weatherCheck);
    const taskProposals = generateProposals(freeSlots, task.duration_minutes).map(p => ({
      ...p,
      taskId: task.id,
      logicTags: [
        'routine',
        ...(isOutdoor && isWeatherFavorable(weather, p.start) ? ['weather'] : [])
      ]
    }));
    
    setProposals(taskProposals);
    setSelectedProposal(taskProposals.length > 0 ? taskProposals[0] : null);
  }, [calendarEvents, weather]);

  const startReview = useCallback(async (tasks: Task[]) => {
    if (tasks.length === 0) return;
    setReviewQueue(tasks);
    setCurrentReviewIndex(0);
    setBatchPlan([]);
    await generateProposalsForIndex(0, tasks, []);
  }, [generateProposalsForIndex]);

  const cancelReview = useCallback(() => {
    setReviewQueue([]);
    setCurrentReviewIndex(0);
    setBatchPlan([]);
    setProposals([]);
    setSelectedProposal(null);
  }, []);

  const executeCommit = useCallback(async (finalPlan: (TimeSlot & { taskId: string })[], queue: Task[]) => {
    if (!accessToken) {
      alert("Google Calendar access token missing. Please sign out and sign in again.");
      return;
    }
    setCommitting(true);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      
      for (const proposal of finalPlan) {
        const task = queue.find(t => t.id === proposal.taskId);
        if (!task) continue;

        const googleEvent = await createEvent(
          accessToken,
          planaroCal.id,
          task.title,
          proposal.start,
          proposal.end,
          task.description || undefined
        );
        await updateTask(task.id, { 
          status: 'scheduled',
          google_event_id: googleEvent.id,
          google_calendar_id: planaroCal.id
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks', 'staged'] });
      cancelReview();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Batch commit error:', error);
      alert('Failed to commit plan. Please try again.');
    } finally {
      setCommitting(false);
    }
  }, [accessToken, queryClient, cancelReview, onSuccess]);

  const confirmSelection = useCallback(async () => {
    if (!selectedProposal) return;
    
    const task = reviewQueue[currentReviewIndex];
    if (!task) return;

    const newPlan = [...batchPlan, { ...selectedProposal, taskId: task.id }];
    
    if (currentReviewIndex + 1 < reviewQueue.length) {
      // Move to next task
      setBatchPlan(newPlan);
      setCurrentReviewIndex(prev => prev + 1);
      await generateProposalsForIndex(currentReviewIndex + 1, reviewQueue, newPlan);
    } else {
      // Finished all tasks
      await executeCommit(newPlan, reviewQueue);
    }
  }, [selectedProposal, reviewQueue, currentReviewIndex, batchPlan, generateProposalsForIndex, executeCommit]);

  return {
    reviewQueue,
    currentReviewIndex,
    currentTask: reviewQueue[currentReviewIndex] || null,
    proposals,
    selectedProposal,
    setSelectedProposal,
    batchPlan,
    committing,
    startReview,
    confirmSelection,
    cancelReview
  };
}
