import { supabase } from './supabase/client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  condition_tags: string[];
  status: 'staged' | 'scheduled' | 'completed';
  created_at: string;
}

export async function fetchStagedTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'staged')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function addTask(title: string, durationMinutes: number = 30, conditionTags: string[] = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: user.id,
        title,
        duration_minutes: durationMinutes,
        condition_tags: conditionTags,
        status: 'staged',
      },
    ])
    .select();

  if (error) throw error;
  return data[0] as Task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function updateTaskStatus(taskId: string, status: 'staged' | 'scheduled' | 'completed') {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw error;
}
