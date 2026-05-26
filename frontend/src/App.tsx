import { Button } from "@/components/ui/button"
import { ConnectivityCheck } from "@/components/ConnectivityCheck"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 gap-8">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Planaro</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your smart calendar planner is being prepared. Stay tuned for a more organized life!
        </p>
        <div className="flex gap-4">
          <Button onClick={() => alert('Planaro is coming soon!')}>
            Get Started
          </Button>
          <Button variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      <ConnectivityCheck />
    </div>
  )
}

export default App
