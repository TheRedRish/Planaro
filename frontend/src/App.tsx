import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConnectivityCheck } from "@/components/ConnectivityCheck"
import { supabase } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"
import { getOrCreatePlanaroCalendar, fetchEvents, createEvent, moveEvent, type GoogleEvent } from "@/lib/google-calendar"
import { StagingArea } from "@/components/StagingArea"
import { CalendarPreview } from "@/components/CalendarPreview"
import { updateTaskStatus, type Task } from "@/lib/tasks"
import { fetchRoutines, getBusyBlocksFromRoutines } from "@/lib/routines"
import { findFreeSlots, generateProposals, type TimeSlot, type BusyBlock } from "@/lib/scheduling-engine"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { fetchWeather, isWeatherFavorable, type WeatherForecast } from "@/lib/weather-provider"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<GoogleEvent[]>([])
  const [syncing, setSyncing] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [proposals, setProposals] = useState<TimeSlot[]>([])
  const [committing, setCommitting] = useState(false)
  const [lockingEventId, setLockingEventId] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherForecast[]>([])
  const queryClient = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session)
    })

    // Fetch initial weather (Default to Copenhagen)
    fetchWeather(55.6761, 12.5683).then(setWeather).catch(console.error)

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.provider_token) {
      handleSync()
    }
  }, [session])

  const handleSync = async () => {
    if (!session?.provider_token) return
    setSyncing(true)
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(session.provider_token)
      
      // Only fetch from 2 weeks ago onwards
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const timeMin = twoWeeksAgo.toISOString()

      const primaryEvents = await fetchEvents(session.provider_token, 'primary', timeMin)
      const planaroEvents = await fetchEvents(session.provider_token, planaroCal.id, timeMin)
      
      const taggedPlanaroEvents = planaroEvents.map(e => ({ ...e, isSoft: true }))
      
      setEvents([...primaryEvents, ...taggedPlanaroEvents].sort((a, b) => {
        const startA = a.start.dateTime || a.start.date || ''
        const startB = b.start.dateTime || b.start.date || ''
        return startA.localeCompare(startB)
      }))
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleScheduleTask = async (task: Task) => {
    setSelectedTask(task)
    const routines = await fetchRoutines()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const busyFromRoutines = getBusyBlocksFromRoutines(routines, today)
    const busyFromCalendar: BusyBlock[] = events.map(e => ({
      start: new Date(e.start.dateTime || e.start.date || ''),
      end: new Date(e.end.dateTime || e.end.date || ''),
      title: e.summary
    }))

    const allBusy = [...busyFromRoutines, ...busyFromCalendar]
    const startBound = new Date()
    const endBound = new Date()
    endBound.setHours(23, 59, 59, 999)

    const isOutdoor = task.condition_tags?.includes('Outdoor')
    const weatherCheck = isOutdoor ? (time: Date) => isWeatherFavorable(weather, time) : undefined

    const freeSlots = findFreeSlots(allBusy, startBound, endBound, task.duration_minutes, weatherCheck)
    const taskProposals = generateProposals(freeSlots, task.duration_minutes)
    setProposals(taskProposals)
  }

  const handleCommitProposal = async (proposal: TimeSlot) => {
    if (!selectedTask || !session?.provider_token) return
    setCommitting(true)
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(session.provider_token)
      await createEvent(
        session.provider_token,
        planaroCal.id,
        selectedTask.title,
        proposal.start,
        proposal.end,
        selectedTask.description || undefined
      )
      
      await updateTaskStatus(selectedTask.id, 'scheduled')
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] })
      
      setSelectedTask(null)
      setProposals([])
      handleSync() // Refresh calendar
    } catch (error) {
      console.error('Commit error:', error)
    } finally {
      setCommitting(false)
    }
  }

  const handleLockEvent = async (event: GoogleEvent) => {
    if (!session?.provider_token) return
    setLockingEventId(event.id)
    try {
      const planaroCal = await getOrCreatePlanaroCalendar(session.provider_token)
      await moveEvent(session.provider_token, planaroCal.id, event.id, 'primary')
      handleSync() // Refresh calendar
    } catch (error) {
      console.error('Lock error:', error)
    } finally {
      setLockingEventId(null)
    }
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: window.location.origin,
      },
    })
    if (error) console.error('Error logging in:', error.message)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error logging out:', error.message)
    setEvents([])
    setSelectedTask(null)
    setProposals([])
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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
            <Button onClick={handleLogout} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        ) : (
          <Button onClick={handleLogin} size="sm">
            Sign in with Google
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        {session ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
            <StagingArea onSchedule={handleScheduleTask} />
            <div className="flex flex-col gap-4 overflow-hidden">
              <CalendarPreview 
                events={events} 
                syncing={syncing} 
                onSync={handleSync} 
                onLock={handleLockEvent}
                lockingEventId={lockingEventId}
              />
              {selectedTask && (
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center justify-between text-sm">
                    Proposals for: {selectedTask.title}
                    {committing && <Loader2 className="h-3 w-3 animate-spin" />}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {proposals.map((p, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs"
                        onClick={() => handleCommitProposal(p)}
                        disabled={committing}
                      >
                        {p.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {p.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    ))}
                    {proposals.length === 0 && <p className="text-xs text-muted-foreground italic">No slots available today.</p>}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)} className="mt-2 text-xs" disabled={committing}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-4">Plan smarter, live better.</h2>
            <p className="text-muted-foreground mb-8">
              Planaro is your AI-powered scheduling assistant that works with your existing Google Calendar.
            </p>
            <Button onClick={handleLogin} size="lg" className="w-full">
              Get Started with Google
            </Button>
          </div>
        )}
      </main>

      {/* Footer / Status */}
      <footer className="p-2 flex justify-center items-center">
        <ConnectivityCheck />
      </footer>
    </div>
  )
}

export default App
