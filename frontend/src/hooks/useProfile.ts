import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateOnboardingStep, updatePlanaroCalendarId } from '@/services/profiles';

export function useProfile(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled,
    retry: false,
  });

  const stepMutation = useMutation({
    mutationFn: updateOnboardingStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const calendarIdMutation = useMutation({
    mutationFn: updatePlanaroCalendarId,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateOnboardingStep: stepMutation.mutate,
    updatePlanaroCalendarId: calendarIdMutation.mutate,
    isUpdating: stepMutation.isPending || calendarIdMutation.isPending,
  };
}
