import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-4">Plan smarter, live better.</h2>
      <p className="text-muted-foreground mb-8">
        Planaro is your AI-powered scheduling assistant that works with your existing Google Calendar.
      </p>
      <Button onClick={onLogin} size="lg" className="w-full">
        Get Started with Google
      </Button>
    </div>
  );
}
