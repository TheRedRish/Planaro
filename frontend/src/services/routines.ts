import { supabase } from './supabase/client';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  created_at: string;
}

export async function fetchRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Routine[];
}

export async function addRoutines(routines: Omit<Routine, 'id' | 'user_id' | 'created_at'>[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('routines')
    .insert(
      routines.map((r) => ({
        ...r,
        user_id: user.id,
      }))
    )
    .select();

  if (error) throw error;
  return data as Routine[];
}

export async function addRoutine(name: string, startTime: string, endTime: string, daysOfWeek: number[] = [1, 2, 3, 4, 5]) {
  const results = await addRoutines([{ name, start_time: startTime, end_time: endTime, days_of_week: daysOfWeek }]);
  return results[0];
}

export async function deleteRoutine(routineId: string) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId);

  if (error) throw error;
}

export interface BusyBlock {
  start: Date;
  end: Date;
  title: string;
}

export function getBusyBlocksFromRoutines(routines: Routine[], date: Date): BusyBlock[] {
  const dayOfWeek = date.getDay() || 7; // Convert 0 (Sunday) to 7
  return routines
    .filter((r) => r.days_of_week.includes(dayOfWeek))
    .map((r) => {
      const start = new Date(date);
      const [startH, startM] = r.start_time.split(':').map(Number);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(date);
      const [endH, endM] = r.end_time.split(':').map(Number);
      end.setHours(endH, endM, 0, 0);

      // Handle overnight routines (e.g., Sleep 22:00 - 06:00)
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }

      return {
        start,
        end,
        title: r.name,
      };
    });
}
