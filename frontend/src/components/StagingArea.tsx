import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchStagedTasks, addTask, deleteTask, type Task } from "@/lib/tasks"
import { Button } from "./ui/button"
import { Loader2, Plus, Trash2, ListChecks, CalendarRange, CalendarDays, CloudSun, Settings } from "lucide-react"
import { RoutineManager } from "./RoutineManager"
import { PreferenceManager } from "./PreferenceManager"

interface StagingAreaProps {
  onSchedule?: (task: Task) => void
}

export function StagingArea({ onSchedule }: StagingAreaProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "routines" | "prefs">("tasks")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [duration, setDuration] = useState(30)
  const [isOutdoor, setIsOutdoor] = useState(false)
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "staged"],
    queryFn: fetchStagedTasks,
  })

  const addMutation = useMutation({
    mutationFn: ({ title, duration, isOutdoor }: { title: string; duration: number; isOutdoor: boolean }) => {
      return addTask(title, duration, isOutdoor ? ['Outdoor'] : [])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] })
      setNewTaskTitle("")
      setIsOutdoor(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] })
    },
  })

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addMutation.mutate({ title: newTaskTitle, duration, isOutdoor })
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Staging Area</h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === "tasks" ? "Unscheduled tasks" : "Recurring routines"}
          </p>
        </div>
        <div className="flex bg-background border rounded-md p-1">
          <Button
            variant={activeTab === "tasks" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="h-8 px-2"
          >
            <ListChecks className="h-4 w-4 mr-1" />
            Tasks
          </Button>
          <Button
            variant={activeTab === "routines" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("routines")}
            className="h-8 px-2"
          >
            <CalendarRange className="h-4 w-4 mr-1" />
            Routines
          </Button>
          <Button
            variant={activeTab === "prefs" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("prefs")}
            className="h-8 px-2"
          >
            <Settings className="h-4 w-4 mr-1" />
            Prefs
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "tasks" ? (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleAddTask} className="flex flex-col gap-2 p-4 border rounded-md bg-muted/30">
              <input
                type="text"
                placeholder="What needs to be done?"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none whitespace-nowrap px-2">
                  <input
                    type="checkbox"
                    checked={isOutdoor}
                    onChange={(e) => setIsOutdoor(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Outdoor
                </label>
                <Button type="submit" disabled={addMutation.isPending} size="sm" className="whitespace-nowrap ml-auto">
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add Task
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length > 0 ? (
                tasks.map((task: Task) => (
                  <li key={task.id} className="group flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors bg-card list-none">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{task.title}</div>
                        {task.condition_tags?.includes('Outdoor') && (
                          <span title="Outdoor task">
                            <CloudSun className="h-3 w-3 text-sky-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{task.duration_minutes} mins</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs"
                        onClick={() => onSchedule?.(task)}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => deleteMutation.mutate(task.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p className="italic text-sm">No tasks in staging yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "routines" ? (
          <RoutineManager />
        ) : (
          <PreferenceManager />
        )}
      </div>
    </div>
  )
}
