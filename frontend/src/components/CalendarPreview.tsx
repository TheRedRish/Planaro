import { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import type { GoogleEvent } from "@/services/google-calendar";
import type { Task } from "@/services/tasks";
import type { TimeSlot } from "@/utils/scheduling-engine";
import { Lock, Loader2, RefreshCw, Sun, Clock, Check, Trash2, X, AlertTriangle, CloudSun } from "lucide-react";
import { 
  getStartOfWeek, 
  getDaysInWeek, 
  formatDayName, 
  formatDayNumber, 
  formatHour, 
  isSameDay,
  getMinutesSinceMidnight
} from "@/utils/date-utils";
import { cn } from "@/utils/cn";

import type { WeatherForecast } from "@/services/weather-provider";
import { getBusyBlocksFromRoutines, type Routine } from "@/services/routines";

interface CalendarPreviewProps {
  events: GoogleEvent[];
  proposals?: TimeSlot[];
  selectedProposal?: TimeSlot | null;
  batchPlan?: (TimeSlot & { taskId: string })[];
  selectedTask?: Task | null;
  scheduledTasks?: Task[];
  weather?: WeatherForecast[];
  routines?: Routine[];
  onSelectProposal?: (proposal: TimeSlot) => void;
  onUpdateProposal?: (index: number, newStart: Date) => void;
  syncing: boolean;
  onSync: () => void;
  onLock?: (event: GoogleEvent) => void;
  lockingEventId?: string | null;
  onUnschedule?: (event: GoogleEvent, taskId?: string) => void;
  onDelete?: (event: GoogleEvent, taskId?: string) => void;
  actingEventId?: string | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // 60px per hour (1px per minute)

export function CalendarPreview({ 
  events, 
  proposals = [],
  selectedProposal,
  batchPlan = [],
  selectedTask,
  scheduledTasks = [],
  weather = [],
  routines = [],
  onSelectProposal,
  onUpdateProposal,
  syncing, 
  onSync, 
  onLock,
  lockingEventId,
  onUnschedule,
  onDelete,
  actingEventId
}: CalendarPreviewProps) {
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<GoogleEvent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const startOfWeek = getStartOfWeek(now);
  const days = getDaysInWeek(startOfWeek);

  // Update "now" every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentMinutes = getMinutesSinceMidnight(new Date());
      const scrollPos = Math.max(0, currentMinutes - 200); // Show a bit before current time
      scrollContainerRef.current.scrollTop = scrollPos;
    }
  }, []);

  const renderEvent = (event: GoogleEvent, day: Date) => {
    const start = event.start.dateTime ? new Date(event.start.dateTime) : null;
    const end = event.end.dateTime ? new Date(event.end.dateTime) : null;

    if (!start || !end || !isSameDay(start, day)) return null;

    const top = getMinutesSinceMidnight(start);
    const duration = (end.getTime() - start.getTime()) / (60 * 1000);
    const isSoft = (event as any).isSoft;
    const isSelected = selectedEvent?.id === event.id;

    return (
      <div 
        key={event.id}
        className={cn(
          "absolute left-1 right-1 rounded-sm border p-1 text-[10px] leading-tight overflow-hidden group select-none transition-all hover:z-10",
          isSoft 
            ? "bg-sky-50 border-sky-200 text-sky-800 shadow-sm cursor-pointer" 
            : "bg-background border-border text-foreground",
          isSelected && "ring-2 ring-primary z-30"
        )}
        style={{ top, height: Math.max(20, duration) }}
        onClick={() => isSoft && setSelectedEvent(isSelected ? null : event)}
      >
        <div className="font-semibold truncate">{event.summary}</div>
        <div className="opacity-70">
          {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
        
        {isSoft && !isSelected && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              className="bg-sky-500 text-white rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onLock?.(event);
              }}
              disabled={lockingEventId === event.id}
            >
              {lockingEventId === event.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
            </button>
          </div>
        )}

        {isSoft && isSelected && (
          <div 
            className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-1 z-40 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary"
                title="Lock to Primary Calendar"
                onClick={() => {
                  onLock?.(event);
                  setSelectedEvent(null);
                }}
                disabled={lockingEventId === event.id || actingEventId === event.id}
              >
                <Lock className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-orange-500"
                title="Unschedule (Return to Staging)"
                onClick={() => {
                  const task = scheduledTasks.find(t => t.google_event_id === event.id);
                  onUnschedule?.(event, task?.id);
                  setSelectedEvent(null);
                }}
                disabled={actingEventId === event.id}
              >
                {actingEventId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                title="Delete Permanently"
                onClick={() => {
                  const task = scheduledTasks.find(t => t.google_event_id === event.id);
                  onDelete?.(event, task?.id);
                  setSelectedEvent(null);
                }}
                disabled={actingEventId === event.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title="Close"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProposal = (proposal: TimeSlot, day: Date, index: number) => {
    if (!isSameDay(proposal.start, day)) return null;

    const top = getMinutesSinceMidnight(proposal.start);
    const durationMinutes = (proposal.end.getTime() - proposal.start.getTime()) / (60 * 1000);
    const isShort = durationMinutes < 45;
    
    // Check if this proposal is the currently selected one
    const isSelected = selectedProposal && 
                       selectedProposal.start.getTime() === proposal.start.getTime() && 
                       selectedProposal.end.getTime() === proposal.end.getTime();

    const hasConflicts = proposal.conflicts && proposal.conflicts.length > 0;

    return (
      <div 
        key={`proposal-${index}`}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/proposal-index', index.toString());
          e.dataTransfer.effectAllowed = 'move';
        }}
        className={cn(
          "absolute left-1 right-1 rounded-sm border-2 border-dashed p-1 text-[10px] leading-tight overflow-visible group select-none transition-all z-20 cursor-pointer shadow-md flex flex-col",
          hasConflicts
            ? isSelected 
              ? "bg-red-500 border-red-600 text-white scale-[1.02] shadow-lg"
              : "bg-red-50 border-red-400 text-red-700 hover:bg-red-100 hover:border-red-500"
            : isSelected 
              ? "bg-primary border-primary text-primary-foreground scale-[1.02] shadow-lg" 
              : "bg-primary/5 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary",
          "animate-in fade-in zoom-in-95",
          isShort && "justify-center items-center"
        )}
        style={{ top, height: Math.max(20, durationMinutes) }}
        onClick={() => onSelectProposal?.(proposal)}
      >
        {isShort ? (
          // Condensed view for short durations
          <>
            <span className={cn("font-bold flex items-center gap-1", isSelected ? "opacity-100" : "opacity-80")}>
              {hasConflicts && <AlertTriangle className="h-3 w-3" />}
              {index + 1}
            </span>
            {/* Popover/Tooltip for short blocks on hover/select */}
            <div className={cn(
              "absolute left-full ml-2 top-0 w-48 p-2 rounded-md shadow-lg z-50 pointer-events-none transition-opacity flex flex-col gap-1",
              isSelected 
                ? hasConflicts ? "bg-red-600 text-white opacity-100 border-red-500" : "bg-primary text-primary-foreground opacity-100 border border-primary-foreground/20" 
                : "bg-card border text-foreground opacity-0 group-hover:opacity-100"
            )}>
              <div className="font-bold truncate flex items-center justify-between">
                {selectedTask?.title || "Proposal"}
                {hasConflicts && <AlertTriangle className="h-3 w-3 text-destructive" />}
              </div>
              <div className="flex gap-1 text-xs opacity-80">
                {proposal.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                {' - '}
                {proposal.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
              {hasConflicts && (
                <div className="text-[9px] font-bold text-destructive bg-destructive/10 p-1 rounded leading-tight">
                  {proposal.conflicts?.[0]}
                </div>
              )}
              <div className="flex gap-1 mt-1">
                {proposal.logicTags?.includes('weather') && (
                  <span className={cn("flex items-center gap-1 text-[9px] uppercase font-bold px-1 rounded", isSelected ? "bg-orange-500/40 text-orange-200" : "bg-orange-500/20 text-orange-500")}>
                    <Sun className="h-3 w-3" /> Weather
                  </span>
                )}
                {proposal.logicTags?.includes('routine') && (
                  <span className={cn("flex items-center gap-1 text-[9px] uppercase font-bold px-1 rounded", isSelected ? "bg-indigo-500/40 text-indigo-200" : "bg-indigo-500/20 text-indigo-500")}>
                    <Clock className="h-3 w-3" /> Routine
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          // Standard view for normal durations
          <>
            <div className="flex justify-between items-start">
              <div className="font-bold truncate flex items-center gap-1">
                {hasConflicts && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                {selectedTask?.title || "Proposal"}
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {proposal.logicTags?.includes('weather') && (
                  <span title="Weather favorable">
                    <Sun className={cn("h-3 w-3", isSelected ? "text-orange-200" : "text-orange-400")} />
                  </span>
                )}
                {proposal.logicTags?.includes('routine') && (
                  <span title="Fits your routine">
                    <Clock className={cn("h-3 w-3", isSelected ? "text-indigo-200" : "text-indigo-400")} />
                  </span>
                )}
              </div>
            </div>
            {hasConflicts && (
              <div className="text-[8px] uppercase font-bold bg-white/20 px-1 rounded mt-0.5 truncate">
                {proposal.conflicts?.[0]}
              </div>
            )}
            <div className={cn("font-medium mt-0.5 mb-1", isSelected ? "opacity-90" : "opacity-70")}>
              {proposal.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
            <div className="flex items-center gap-1 mt-auto font-medium">
              <span className={cn("px-1 rounded-sm uppercase text-[8px]", isSelected ? "bg-primary-foreground/20" : "bg-primary/20", hasConflicts && !isSelected && "bg-red-500/20")}>Proposal {index + 1}</span>
              <Check className={cn("h-2.5 w-2.5 ml-auto transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
            </div>
          </>
        )}
      </div>
    );
  };

  const renderConfirmedProposal = (proposal: TimeSlot & { taskId: string }, day: Date, index: number) => {
    if (!isSameDay(proposal.start, day)) return null;

    const top = getMinutesSinceMidnight(proposal.start);
    const duration = (proposal.end.getTime() - proposal.start.getTime()) / (60 * 1000);
    
    // Find task title from either selectedTask or scheduledTasks (if it somehow made it there)
    // Actually we need to pass reviewQueue from DashboardPage if we want exact titles, 
    // but for now "Confirmed" or a basic title is fine since we just want visual block.
    // I'll just use "Confirmed" for simplicity to avoid drilling too many props.
    
    return (
      <div 
        key={`batch-${index}`}
        className={cn(
          "absolute left-1 right-1 rounded-sm border p-1 text-[10px] leading-tight overflow-hidden select-none z-10 opacity-70",
          "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm"
        )}
        style={{ top, height: Math.max(20, duration) }}
      >
        <div className="font-semibold truncate flex items-center gap-1">
          <Check className="h-3 w-3" />
          Confirmed
        </div>
        <div className="opacity-70">
          {proposal.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden font-sans">
      {/* Header */}
      <div className="flex-none p-4 border-b bg-muted/20 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Weekly Schedule</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={onSync} disabled={syncing} size="sm" variant="outline" className="gap-2">
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative flex flex-col min-h-0"
      >
        <div className="sticky top-0 z-30 flex flex-col shadow-sm">
          {/* Sticky Day Headers */}
          <div className="flex border-b bg-card z-20">
            <div className="w-16 flex-none border-r" /> {/* Time column space */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((day) => {
                const isToday = isSameDay(day, now);
                return (
                  <div key={day.toISOString()} className="py-3 flex flex-col items-center border-r last:border-r-0">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider mb-1",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {formatDayName(day)}
                    </span>
                    <span className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}>
                      {formatDayNumber(day)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-Day Events Row */}
          <div className="flex border-b bg-muted/5 min-h-[36px] bg-card">
            <div className="w-16 flex-none border-r text-[9px] font-bold text-muted-foreground flex items-center justify-center uppercase">
              All Day
            </div>
            <div className="flex-1 grid grid-cols-7 border-r last:border-r-0 relative">
              {days.map((day) => {
                // Find weather for this day (try to get mid-day forecast around 12:00)
                const targetTimeStr = new Date(day).toISOString().slice(0, 10) + 'T12:00';
                const dayWeather = weather.find(w => w.time.startsWith(targetTimeStr.slice(0, 13))) || weather.find(w => isSameDay(new Date(w.time), day));
                
                // Find routines for this day
                const jsDay = day.getDay();
                const routineDay = jsDay === 0 ? 7 : jsDay; 
                const dayRoutines = routines.filter(r => r.days_of_week.includes(routineDay) || r.days_of_week.includes(jsDay));

                let conditionStr = 'Clear';
                let isRainy = false;
                if (dayWeather) {
                  isRainy = dayWeather.precipitation_probability > 30 || dayWeather.weather_code >= 51;
                  conditionStr = isRainy ? 'Rain' : (dayWeather.weather_code <= 3 ? 'Clear' : 'Clouds');
                }

                return (
                  <div key={`allday-${day.toISOString()}`} className="border-r last:border-r-0 h-full min-h-[36px] p-1 flex flex-col gap-1 items-center overflow-hidden">
                    {/* Weather */}
                    {dayWeather && (
                      <div 
                        className={cn("flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm w-full max-w-full justify-center truncate", 
                          conditionStr === 'Clear' ? "bg-orange-500/10 text-orange-600" :
                          isRainy ? "bg-blue-500/10 text-blue-600" :
                          "bg-slate-500/10 text-slate-600"
                        )}
                        title={`${conditionStr}, ${dayWeather.precipitation_probability}% precip`}
                      >
                        {conditionStr === 'Clear' ? <Sun className="h-2.5 w-2.5 flex-shrink-0" /> : <CloudSun className="h-2.5 w-2.5 flex-shrink-0" />}
                        <span className="truncate">{dayWeather.precipitation_probability}%</span>
                      </div>
                    )}
                    {/* Routines Summary */}
                    {dayRoutines.length > 0 && (
                      <div 
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm w-full max-w-full justify-center truncate bg-indigo-500/10 text-indigo-600"
                        title={dayRoutines.map(r => r.name).join(', ')}
                      >
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{dayRoutines.length} Routine{dayRoutines.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex min-h-[1440px]"> {/* 24h * 60px */}
          {/* Time Sidebar */}
          <div className="w-16 flex-none border-r bg-card relative">
              {HOURS.map((hour) => (
                <div 
                  key={hour} 
                  className="absolute left-0 right-0 text-center text-[10px] font-medium text-muted-foreground"
                  style={{ top: hour * HOUR_HEIGHT - 6 }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Hour Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {HOURS.map((hour) => (
                  <div 
                    key={`line-${hour}`} 
                    className="absolute left-0 right-0 border-b border-muted/30"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}
              </div>

              {/* Day Columns */}
              {days.map((day) => {
                const isToday = isSameDay(day, now);
                const dayBusyBlocks = getBusyBlocksFromRoutines(routines, day);

                return (
                  <div 
                    key={`col-${day.toISOString()}`} 
                    className="relative border-r last:border-r-0"
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const idxStr = e.dataTransfer.getData('application/proposal-index');
                      if (!idxStr) return;
                      const index = parseInt(idxStr, 10);
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      
                      const minutes = Math.max(0, Math.round(y / 15) * 15);
                      const newStart = new Date(day);
                      newStart.setHours(0, minutes, 0, 0);

                      onUpdateProposal?.(index, newStart);
                    }}
                  >
                    {/* Routine Background Blocks */}
                    {dayBusyBlocks.map((block, i) => {
                      const top = getMinutesSinceMidnight(block.start);
                      let duration = (block.end.getTime() - block.start.getTime()) / (60 * 1000);
                      
                      // Handle routines that span midnight by capping them at the end of the current day
                      if (duration < 0) duration += 24 * 60; // Just in case, though getBusyBlocksFromRoutines handles it somewhat
                      // getBusyBlocksFromRoutines can return blocks that end the *next* day. We need to truncate visually.
                      if (block.end.getDate() !== block.start.getDate()) {
                         duration = 24 * 60 - top;
                      }

                      return (
                        <div 
                          key={`routine-${i}`}
                          className="absolute left-0 right-0 bg-muted/40 border-l-4 border-indigo-200/50 pointer-events-none z-0"
                          style={{ top, height: Math.max(0, duration) }}
                        >
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1 pt-1 opacity-60">
                            {block.title}
                          </div>
                        </div>
                      );
                    })}

                    {/* Events */}
                    {events.map(event => renderEvent(event, day))}

                    {/* Confirmed Batch Proposals */}
                    {batchPlan.map((proposal, i) => renderConfirmedProposal(proposal, day, i))}

                    {/* Proposals */}
                    {proposals.map((proposal, i) => renderProposal(proposal, day, i))}

                    {/* Current Time Indicator */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 border-t-2 border-primary z-10 flex items-center"
                        style={{ top: getMinutesSinceMidnight(now) }}
                      >
                        <div className="w-2 h-2 bg-primary rounded-full -ml-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}
