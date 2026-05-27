import { Button } from "./ui/button"
import type { GoogleEvent } from "@/lib/google-calendar"
import { Lock, Loader2 } from "lucide-react"

interface CalendarPreviewProps {
  events: GoogleEvent[]
  syncing: boolean
  onSync: () => void
  planaroCalendarId?: string
  onLock?: (event: GoogleEvent) => void
  lockingEventId?: string | null
}

export function CalendarPreview({ 
  events, 
  syncing, 
  onSync, 
  onLock,
  lockingEventId
}: CalendarPreviewProps) {
  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Calendar Preview</h2>
          <p className="text-sm text-muted-foreground">Your schedule</p>
        </div>
        <Button onClick={onSync} disabled={syncing} size="sm">
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((event) => {
              // A simple way to check if it's a soft commitment is to see if it's in the Planaro calendar
              // In this prototype, we don't have the calendarId per event easily without fetching metadata
              // But we can check if the event was fetched from the Planaro calendar in App.tsx
              // For now, let's assume if it has a specific marker or if we pass the info.
              // Actually, I'll update App.tsx to tag them.
              const isSoft = (event as any).isSoft;

              return (
                <li key={event.id} className="group flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {event.summary}
                      {isSoft && <span className="text-[8px] bg-sky-100 text-sky-600 px-1 rounded uppercase font-bold">Soft</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {event.start.dateTime ? new Date(event.start.dateTime).toLocaleString() : event.start.date}
                    </div>
                  </div>
                  {isSoft && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onLock?.(event)}
                      disabled={lockingEventId === event.id}
                    >
                      {lockingEventId === event.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <p className="italic text-sm">No events found or still syncing...</p>
          </div>
        )}
      </div>
    </div>
  )
}
