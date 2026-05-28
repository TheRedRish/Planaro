import { isWeatherFavorable, type WeatherForecast } from '@/services/weather-provider';

export interface TimeSlot {
  start: Date;
  end: Date;
  logicTags?: string[]; // e.g., ['weather', 'routine']
  conflicts?: string[]; // e.g., ['Conflicts with an existing event or routine.']
  taskId?: string;
}

export interface BusyBlock {
  start: Date;
  end: Date;
  title: string;
}

/**
 * Merges overlapping or contiguous busy blocks.
 */
export function mergeBusyBlocks(blocks: BusyBlock[]): BusyBlock[] {
  if (blocks.length === 0) return [];

  // Sort by start time
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: BusyBlock[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlap or contiguous, merge by extending end time if needed
      if (current.end > last.end) {
        last.end = current.end;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Finds free slots of at least `minDurationMinutes` between `startBound` and `endBound`.
 */
export function findFreeSlots(
  busyBlocks: BusyBlock[],
  startBound: Date,
  endBound: Date,
  minDurationMinutes: number,
  isFavorable?: (time: Date) => boolean
): TimeSlot[] {
  const merged = mergeBusyBlocks(busyBlocks);
  const slots: TimeSlot[] = [];
  const minDurationMs = minDurationMinutes * 60 * 1000;

  let currentStart = new Date(startBound);

  for (const block of merged) {
    if (block.end <= startBound) continue;
    if (block.start >= endBound) break;

    const gapStart = currentStart;
    const gapEnd = block.start < endBound ? block.start : endBound;

    if (gapEnd.getTime() - gapStart.getTime() >= minDurationMs) {
      if (!isFavorable || isFavorable(gapStart)) {
        slots.push({ start: new Date(gapStart), end: new Date(gapEnd) });
      }
    }

    currentStart = block.end > startBound ? new Date(block.end) : currentStart;
  }

  // Final gap after last busy block
  if (currentStart < endBound) {
    if (endBound.getTime() - currentStart.getTime() >= minDurationMs) {
      if (!isFavorable || isFavorable(currentStart)) {
        slots.push({ start: new Date(currentStart), end: new Date(endBound) });
      }
    }
  }

  return slots;
}

/**
 * Generates up to 3 scheduling proposals for a task.
 */
export function generateProposals(
  slots: TimeSlot[],
  taskDurationMinutes: number
): TimeSlot[] {
  const proposals: TimeSlot[] = [];
  const durationMs = taskDurationMinutes * 60 * 1000;

  // Track the days we have already selected a proposal on, to encourage spreading out
  const usedDays = new Set<string>();

  // Extract all possible discrete non-overlapping sub-slots from all large free slots
  const allSubSlots: TimeSlot[] = [];
  for (const slot of slots) {
    let currentStart = slot.start.getTime();
    while (currentStart + durationMs <= slot.end.getTime()) {
      allSubSlots.push({
        start: new Date(currentStart),
        end: new Date(currentStart + durationMs)
      });
      // Jump by duration to avoid overlapping sub-slots within the same free block
      currentStart += durationMs; 
    }
  }

  // First pass: try to get one proposal per day
  for (const subSlot of allSubSlots) {
    if (proposals.length >= 3) break;
    const dayKey = subSlot.start.toISOString().split('T')[0];
    if (!usedDays.has(dayKey)) {
      proposals.push(subSlot);
      usedDays.add(dayKey);
    }
  }

  // Second pass: if we still need proposals, just take the earliest available that aren't already in proposals
  if (proposals.length < 3) {
    for (const subSlot of allSubSlots) {
      if (proposals.length >= 3) break;
      const isAlreadyIncluded = proposals.some(p => p.start.getTime() === subSlot.start.getTime());
      if (!isAlreadyIncluded) {
        proposals.push(subSlot);
      }
    }
  }

  // Sort them chronologically
  return proposals.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Checks a specific time slot against constraints and returns an array of conflict strings.
 */
export function checkConstraints(
  slot: TimeSlot,
  task: { duration_minutes: number; condition_tags?: string[] },
  busyBlocks: BusyBlock[],
  weather: WeatherForecast[]
): string[] {
  const conflicts: string[] = [];
  
  // 1. Check Busy Blocks (Routines & Calendar Events)
  const isOverlapping = busyBlocks.some(block => {
    return (slot.start < block.end && slot.end > block.start);
  });
  if (isOverlapping) {
    conflicts.push('Conflicts with an existing event or routine.');
  }

  // 2. Check Weather
  const isOutdoor = task.condition_tags?.includes('Outdoor');
  if (isOutdoor && !isWeatherFavorable(weather, slot.start)) {
    conflicts.push('Unfavorable weather conditions predicted.');
  }

  // 3. Past check
  if (slot.start < new Date()) {
    conflicts.push('Time slot is in the past.');
  }

  return conflicts;
}
export function scheduleBatch(
  tasks: { id: string; duration_minutes: number; condition_tags?: string[] }[],
  initialBusyBlocks: BusyBlock[],
  startBound: Date,
  endBound: Date,
  weather: WeatherForecast[]
): TimeSlot[] {
  const plan: TimeSlot[] = [];
  let currentBusy = [...initialBusyBlocks];

  for (const task of tasks) {
    const isOutdoor = task.condition_tags?.includes('Outdoor');
    const weatherCheck = isOutdoor 
      ? (time: Date) => isWeatherFavorable(weather, time)
      : undefined;

    const freeSlots = findFreeSlots(currentBusy, startBound, endBound, task.duration_minutes, weatherCheck);
    const proposals = generateProposals(freeSlots, task.duration_minutes);

    if (proposals.length > 0) {
      // Pick the first proposal for the plan
      const selected = proposals[0];
      const proposalWithMetadata = { 
        ...selected, 
        taskId: task.id,
        logicTags: [
          'routine',
          ...(isOutdoor && isWeatherFavorable(weather, selected.start) ? ['weather'] : [])
        ]
      };
      plan.push(proposalWithMetadata);

      // Add this proposal to busy blocks for the next task in batch
      currentBusy.push({
        start: selected.start,
        end: selected.end,
        title: `Plan: ${task.id}`,
      });
      // Re-merge to keep it clean
      currentBusy = mergeBusyBlocks(currentBusy);
    }
  }

  return plan;
}
