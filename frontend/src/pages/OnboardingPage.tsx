import { useProfile } from '@/hooks/useProfile';
import { PermissionTransparency } from '@/components/onboarding/PermissionTransparency';

export function OnboardingPage() {
  const { profile } = useProfile();

  if (!profile) return null;

  switch (profile.onboarding_step) {
    case 'permission_transparency':
      return <PermissionTransparency />;
    case 'calendar_provisioning':
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <h2 className="text-2xl font-bold">Phase 2: Calendar Provisioning</h2>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      );
    case 'baseline_routines':
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <h2 className="text-2xl font-bold">Phase 3: Baseline Routines</h2>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      );
    case 'welcome':
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <h2 className="text-2xl font-bold">Phase 4: Welcome</h2>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      );
    default:
      return null;
  }
}
