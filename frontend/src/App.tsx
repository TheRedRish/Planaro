import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Planaro</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
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
  )
}

export default App
