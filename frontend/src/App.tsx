import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";

function App() {
  const { session, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b p-4 flex justify-between items-center bg-card">
        <h1 className="text-2xl font-bold">Planaro</h1>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.user.email}
            </span>
            <Button onClick={logout} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        ) : (
          <Button onClick={login} size="sm">
            Sign in with Google
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        {session ? (
          <DashboardPage session={session} />
        ) : (
          <LandingPage onLogin={login} />
        )}
      </main>
    </div>
  );
}

export default App;
