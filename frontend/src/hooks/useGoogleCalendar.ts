import { useState, useCallback } from 'react';
import { 
  getOrCreatePlanaroCalendar, 
  fetchEvents, 
  moveEvent, 
  deleteEvent,
  type GoogleEvent 
} from '@/services/google-calendar';
import { updateTask, deleteTask } from '@/services/tasks';
import { useQueryClient } from '@tanstack/react-query';

export function useGoogleCalendar(accessToken: string | undefined) {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lockingEventId, setLockingEventId] = useState<string | null>(null);
  const [actingEventId, setActingEventId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sync = useCallback(async () => {
    if (!accessToken) return;
    setSyncing(true);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const timeMin = twoWeeksAgo.toISOString();

      const primaryEvents = await fetchEvents(accessToken, 'primary', timeMin);
      const planaroEvents = await fetchEvents(accessToken, planaroCal.id, timeMin);

      const taggedPlanaroEvents = planaroEvents.map(e => ({ ...e, isSoft: true }));

      const allEvents = [...primaryEvents, ...taggedPlanaroEvents].sort((a, b) => {
        const startA = a.start.dateTime || a.start.date || '';
        const startB = b.start.dateTime || b.start.date || '';
        return startA.localeCompare(startB);
      });

      setEvents(allEvents);
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [accessToken]);

  const lockEvent = useCallback(async (event: GoogleEvent) => {
    if (!accessToken) return;
    setLockingEventId(event.id);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      await moveEvent(accessToken, planaroCal.id, event.id, 'primary');
      
      // Update task status if we can find it
      // Note: This is an optimization, sync() will fetch everything anyway
      
      await sync();
    } catch (error) {
      console.error('Lock error:', error);
      throw error;
    } finally {
      setLockingEventId(null);
    }
  }, [accessToken, sync]);

  const unschedulePlanaroEvent = useCallback(async (event: GoogleEvent, taskId?: string) => {
    if (!accessToken) return;
    setActingEventId(event.id);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      await deleteEvent(accessToken, planaroCal.id, event.id);
      
      if (taskId) {
        await updateTask(taskId, { 
          status: 'staged', 
          google_event_id: undefined, 
          google_calendar_id: undefined 
        });
        queryClient.invalidateQueries({ queryKey: ['tasks', 'staged'] });
      }
      
      await sync();
    } catch (error) {
      console.error('Unschedule error:', error);
      throw error;
    } finally {
      setActingEventId(null);
    }
  }, [accessToken, sync, queryClient]);

  const deletePlanaroEvent = useCallback(async (event: GoogleEvent, taskId?: string) => {
    if (!accessToken) return;
    setActingEventId(event.id);
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(accessToken);
      await deleteEvent(accessToken, planaroCal.id, event.id);
      
      if (taskId) {
        await deleteTask(taskId);
        queryClient.invalidateQueries({ queryKey: ['tasks', 'staged'] });
      }
      
      await sync();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    } finally {
      setActingEventId(null);
    }
  }, [accessToken, sync, queryClient]);

  return { 
    events, 
    syncing, 
    sync, 
    lockEvent, 
    lockingEventId, 
    unschedulePlanaroEvent, 
    deletePlanaroEvent,
    actingEventId,
    setEvents 
  };
}
