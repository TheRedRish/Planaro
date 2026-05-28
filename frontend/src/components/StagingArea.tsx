import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStagedTasks, addTask, deleteTask, updateTask, type Task } from "@/services/tasks";
import { Button } from "./ui/button";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ListChecks, 
  CalendarRange, 
  CalendarDays, 
  CloudSun, 
  Settings,
  X,
  Clock,
  Tag,
  Pencil
} from "lucide-react";
import { RoutineManager } from "./RoutineManager";
import { PreferenceManager } from "./PreferenceManager";
import { cn } from "@/utils/cn";

interface StagingAreaProps {
  onSchedule?: (task: Task) => void;
  onScheduleBatch?: (tasks: Task[]) => void;
}

export function StagingArea({ onSchedule, onScheduleBatch }: StagingAreaProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "routines" | "prefs">("tasks");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
// ... (rest of the component)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "staged"],
    queryFn: fetchStagedTasks,
  });

  const addMutation = useMutation({
    mutationFn: (title: string) => addTask(title, 30, []), // Default 30 mins
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] });
      setNewTaskTitle("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] });
      if (editingTask?.id === deleteMutation.variables) setEditingTask(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: Partial<Task> & { id: string }) => updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "staged"] });
    },
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addMutation.mutate(newTaskTitle);
  };

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Header Tabs */}
      <div className="p-2 border-b bg-muted/30 flex justify-center">
        <div className="flex bg-background border rounded-lg p-1 w-full max-w-[280px]">
          <Button
            variant={activeTab === "tasks" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="flex-1 h-8 text-[11px] uppercase font-bold tracking-wider"
          >
            <ListChecks className="h-3.5 w-3.5 mr-1.5" />
            Tasks
          </Button>
          <Button
            variant={activeTab === "routines" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("routines")}
            className="flex-1 h-8 text-[11px] uppercase font-bold tracking-wider"
          >
            <CalendarRange className="h-3.5 w-3.5 mr-1.5" />
            Routines
          </Button>
          <Button
            variant={activeTab === "prefs" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("prefs")}
            className="flex-1 h-8 text-[11px] uppercase font-bold tracking-wider"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Prefs
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "tasks" ? (
          <div className="flex flex-col h-full">
            {/* Quick Add */}
            <form onSubmit={handleQuickAdd} className="p-4 border-b bg-background sticky top-0 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick add task..."
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  disabled={addMutation.isPending}
                />
                <button 
                  type="submit"
                  disabled={!newTaskTitle.trim() || addMutation.isPending}
                  className="absolute right-2 top-2 h-6 w-6 flex items-center justify-center text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </form>

            {/* Task List */}
            <div className="flex-1 p-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                </div>
              ) : tasks.length > 0 ? (
                <>
                  {tasks.map((task: Task) => {
                    const isSelected = selectedTaskIds.has(task.id);
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "group flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer relative",
                          isSelected ? "border-primary bg-primary/5" : "hover:border-primary/30 hover:bg-accent/50 border-transparent",
                          editingTask?.id === task.id && "ring-1 ring-primary/20"
                        )}
                        onClick={() => {
                          const newSelected = new Set(selectedTaskIds);
                          if (isSelected) newSelected.delete(task.id);
                          else newSelected.add(task.id);
                          setSelectedTaskIds(newSelected);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary z-10 pointer-events-none"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-sm truncate">{task.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center text-[10px] text-muted-foreground font-medium">
                              <Clock className="h-3 w-3 mr-1 opacity-50" />
                              {task.duration_minutes}m
                            </span>
                            {task.condition_tags?.map(tag => (
                              <span key={tag} className="flex items-center text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                                {tag === 'Outdoor' && <CloudSun className="h-2.5 w-2.5 mr-0.5" />}
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                            }}
                            title="Task Details"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSchedule?.(task);
                            }}
                            title="Schedule Now"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {selectedTaskIds.size > 0 && (
                    <div className="sticky bottom-2 p-2 bg-background border rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                      <span className="text-[10px] font-bold uppercase text-primary ml-2">
                        {selectedTaskIds.size} Selected
                      </span>
                      <Button
                        size="sm"
                        className="h-8 text-[10px] uppercase font-bold tracking-wider"
                        onClick={() => {
                          const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
                          onScheduleBatch?.(selectedTasks);
                          setSelectedTaskIds(new Set());
                        }}
                      >
                        Schedule All
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/40">
                  <ListChecks className="h-10 w-10 mb-2 opacity-10" />
                  <p className="text-xs italic uppercase tracking-widest font-bold">No staged tasks</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "routines" ? (
          <div className="p-4"><RoutineManager /></div>
        ) : (
          <div className="p-4"><PreferenceManager /></div>
        )}
      </div>

      {/* Detail Expansion Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-background/95 backdrop-blur-sm z-30 transition-transform duration-300 ease-in-out p-6",
          editingTask ? "translate-x-0" : "translate-x-full"
        )}
      >
        {editingTask && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Task Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingTask(null)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Title</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-muted py-1 text-lg font-semibold focus:outline-none focus:border-primary transition-colors"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  onBlur={() => updateMutation.mutate({ id: editingTask.id, title: editingTask.title })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Duration (minutes)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    className="flex-1 accent-primary"
                    value={editingTask.duration_minutes}
                    onChange={(e) => setEditingTask({ ...editingTask, duration_minutes: parseInt(e.target.value) })}
                    onMouseUp={() => updateMutation.mutate({ id: editingTask.id, duration_minutes: editingTask.duration_minutes })}
                  />
                  <span className="font-mono font-bold text-sm w-12">{editingTask.duration_minutes}m</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Conditions
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Outdoor', 'Deep Work', 'Urgent'].map(tag => {
                    const hasTag = editingTask.condition_tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = hasTag 
                            ? editingTask.condition_tags?.filter(t => t !== tag) 
                            : [...(editingTask.condition_tags || []), tag];
                          setEditingTask({ ...editingTask, condition_tags: newTags });
                          updateMutation.mutate({ id: editingTask.id, condition_tags: newTags });
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all",
                          hasTag 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "bg-transparent border-muted text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 flex gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => deleteMutation.mutate(editingTask.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => {
                  onSchedule?.(editingTask);
                  setEditingTask(null);
                }}
              >
                <CalendarDays className="h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
