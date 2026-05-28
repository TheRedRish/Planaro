import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateTaskStatus, type Task } from '@/services/tasks';
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proposals, setProposals] = useState<TimeSlot[]>([]);
  const [committing, setCommitting] = useState(false);
  const queryClient = useQueryClient();

  const scheduleTask = useCallback(async (task: Task) => {
    setSelectedTask(task);
    const routines = await fetchRoutines();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const busyFromRoutines = getBusyBlocksFromRoutines(routines, today);
    const busyFromCalendar: BusyBlock[] = calendarEvents.map(e => ({
      start: new Date(e.start.dateTime || e.start.date || ''),
      end: new Date(e.end.dateTime || e.end.date || ''),
      title: e.summary,
    }));

    const allBusy = [...busyFromRoutines, ...busyFromCalendar];
    const startBound = new Date();
    const endBound = new Date();
    endBound.setHours(23, 59, 59, 999);

    const isOutdoor = task.condition_tags?.includes('Outdoor');
    const weatherCheck = isOutdoor 
      ? (time: Date) => isWeatherFavorable(weather, time)
      : undefined;

    const freeSlots = findFreeSlots(allBusy, startBound, endBound, task.duration_minutes, weatherCheck);
    const taskProposals = generateProposals(freeSlots, task.duration_minutes);
    setProposals(taskProposals);
  }, [calendarEvents, weather]);

  const commitProposal = useCallback(async (proposal: TimeSlot) => {
    if (!selectedTask || !accessToken) return;
    setCommitting(true);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      await createEvent(
        accessToken,
        planaroCal.id,
        selectedTask.title,
        proposal.start,
        proposal.end,
        selectedTask.description || undefined
      );

      await updateTaskStatus(selectedTask.id, 'scheduled');
      queryClient.invalidateQueries({ queryKey: ['tasks', 'staged'] });

      setSelectedTask(null);
      setProposals([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Commit error:', error);
      throw error;
    } finally {
      setCommitting(false);
    }
  }, [selectedTask, accessToken, queryClient, onSuccess]);

  return {
    selectedTask,
    setSelectedTask,
    proposals,
    setProposals,
    committing,
    scheduleTask,
    commitProposal
  };
}
