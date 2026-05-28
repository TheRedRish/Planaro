import { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import type { GoogleEvent } from "@/services/google-calendar";
import type { Task } from "@/services/tasks";
import type { TimeSlot } from "@/utils/scheduling-engine";
import { Lock, Loader2, RefreshCw, Sun, Clock, Check, Trash2, X } from "lucide-react";
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

interface CalendarPreviewProps {
  events: GoogleEvent[];
  proposals?: TimeSlot[];
  selectedProposal?: TimeSlot | null;
  batchPlan?: (TimeSlot & { taskId: string })[];
  selectedTask?: Task | null;
  scheduledTasks?: Task[];
  onSelectProposal?: (proposal: TimeSlot) => void;
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
  onSelectProposal,
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

    return (
      <div 
        key={`proposal-${index}`}
        className={cn(
          "absolute left-1 right-1 rounded-sm border-2 border-dashed p-1 text-[10px] leading-tight overflow-visible group select-none transition-all z-20 cursor-pointer shadow-md flex flex-col",
          isSelected 
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
            <span className={cn("font-bold", isSelected ? "opacity-100" : "opacity-80")}>
              {index + 1}
            </span>
            {/* Popover/Tooltip for short blocks on hover/select */}
            <div className={cn(
              "absolute left-full ml-2 top-0 w-48 p-2 rounded-md shadow-lg z-50 pointer-events-none transition-opacity flex flex-col gap-1",
              isSelected ? "bg-primary text-primary-foreground opacity-100 border border-primary-foreground/20" : "bg-card border text-foreground opacity-0 group-hover:opacity-100"
            )}>
              <div className="font-bold truncate">{selectedTask?.title || "Proposal"}</div>
              <div className="flex gap-1 text-xs opacity-80">
                {proposal.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                {' - '}
                {proposal.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
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
              <div className="font-bold truncate">{selectedTask?.title || "Proposal"}</div>
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
            <div className={cn("font-medium mt-0.5 mb-1", isSelected ? "opacity-90" : "opacity-70")}>
              {proposal.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
            <div className="flex items-center gap-1 mt-auto font-medium">
              <span className={cn("px-1 rounded-sm uppercase text-[8px]", isSelected ? "bg-primary-foreground/20" : "bg-primary/20")}>Proposal {index + 1}</span>
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
          <div className="flex border-b bg-muted/5 min-h-[24px] bg-card">
            <div className="w-16 flex-none border-r text-[9px] font-bold text-muted-foreground flex items-center justify-center uppercase">
              All Day
            </div>
            <div className="flex-1 grid grid-cols-7 border-r last:border-r-0 relative">
              {days.map((day) => (
                <div key={`allday-${day.toISOString()}`} className="border-r last:border-r-0 h-full min-h-[24px]" />
              ))}
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
                return (
                  <div key={`col-${day.toISOString()}`} className="relative border-r last:border-r-0">
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
