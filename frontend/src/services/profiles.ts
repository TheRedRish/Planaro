import { supabase } from './supabase/client';

export type OnboardingStep = 
  | 'permission_transparency' 
  | 'calendar_provisioning' 
  | 'baseline_routines' 
  | 'welcome' 
  | 'completed';

export interface Profile {
  id: string;
  onboarding_step: OnboardingStep;
  // Add other profile fields if needed
}

export async function fetchProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, onboarding_step')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile doesn't exist, we might want to handle it (though handle_new_user should create it)
    throw error;
  }

  return data as Profile;
}

export async function updateOnboardingStep(step: OnboardingStep) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: step })
    .eq('id', user.id);

  if (error) throw error;
}
