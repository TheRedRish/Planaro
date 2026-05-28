import { useState, useCallback } from 'react';
import { 
  getOrCreatePlanaroCalendar, 
  fetchEvents, 
  moveEvent, 
  type GoogleEvent 
} from '@/services/google-calendar';

export function useGoogleCalendar(accessToken: string | undefined) {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lockingEventId, setLockingEventId] = useState<string | null>(null);

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
      await sync();
    } catch (error) {
      console.error('Lock error:', error);
      throw error;
    } finally {
      setLockingEventId(null);
    }
  }, [accessToken, sync]);

  return { events, syncing, sync, lockEvent, lockingEventId, setEvents };
}
