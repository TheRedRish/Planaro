import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateOnboardingStep } from '@/services/profiles';

export function useProfile(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled,
  });

  const mutation = useMutation({
    mutationFn: updateOnboardingStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateOnboardingStep: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
