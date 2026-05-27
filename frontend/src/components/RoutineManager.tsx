import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchRoutines, addRoutine, deleteRoutine, type Routine } from "@/lib/routines"
import { Button } from "./ui/button"
import { Loader2, Plus, Trash2, Clock } from "lucide-react"

export function RoutineManager() {
  const [name, setName] = useState("")
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("17:00")
  const queryClient = useQueryClient()

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: fetchRoutines,
  })

  const addMutation = useMutation({
    mutationFn: ({ name, start, end }: { name: string; start: string; end: string }) => 
      addRoutine(name, start, end),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
      setName("")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addMutation.mutate({ name, start, end })
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAddRoutine} className="flex flex-col gap-2 p-4 border rounded-md bg-muted/30">
        <h3 className="text-sm font-semibold mb-2">Add New Routine</h3>
        <input
          type="text"
          placeholder="Routine Name (e.g. Work, Sleep)"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Start</label>
            <input
              type="time"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">End</label>
            <input
              type="time"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={addMutation.isPending} size="sm" className="mt-2">
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Add Routine
        </Button>
      </form>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : routines.length > 0 ? (
          routines.map((routine: Routine) => (
            <div key={routine.id} className="group flex items-center justify-between p-3 border rounded-md bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{routine.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {routine.start_time.slice(0, 5)} - {routine.end_time.slice(0, 5)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => deleteMutation.mutate(routine.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic text-center p-4">No routines defined.</p>
        )}
      </div>
    </div>
  )
}
