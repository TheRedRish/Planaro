import { useProfile } from '@/hooks/useProfile';
import { PermissionTransparency } from '@/components/onboarding/PermissionTransparency';
import { CalendarProvisioning } from '@/components/onboarding/CalendarProvisioning';
import { BaselineRoutines } from '@/components/onboarding/BaselineRoutines';
import { Welcome } from '@/components/onboarding/Welcome';

export function OnboardingPage() {
  const { profile } = useProfile();

  if (!profile) return null;

  switch (profile.onboarding_step) {
    case 'permission_transparency':
      return <PermissionTransparency />;
    case 'calendar_provisioning':
      return <CalendarProvisioning />;
    case 'baseline_routines':
      return <BaselineRoutines />;
    case 'welcome':
      return <Welcome />;
    default:
      return null;
  }
}
