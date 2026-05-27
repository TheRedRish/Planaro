import { supabase } from './supabase/client';

export interface UserPreferences {
  buffer_minutes: number;
  default_priority: 'low' | 'medium' | 'high';
  preferred_start_time: string;
  preferred_end_time: string;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data.preferences as UserPreferences;
}

export async function updatePreferences(preferences: UserPreferences) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ preferences })
    .eq('id', user.id);

  if (error) throw error;
}
