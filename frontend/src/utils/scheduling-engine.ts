export interface TimeSlot {
  start: Date;
  end: Date;
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

  for (const slot of slots) {
    if (proposals.length >= 3) break;

    // For simplicity, take the start of the free slot as a proposal
    proposals.push({
      start: new Date(slot.start),
      end: new Date(slot.start.getTime() + durationMs),
    });

    // If the slot is long enough, maybe take another one from the middle or end
    const slotDuration = slot.end.getTime() - slot.start.getTime();
    if (slotDuration >= durationMs * 3 && proposals.length < 3) {
      proposals.push({
        start: new Date(slot.start.getTime() + slotDuration / 2),
        end: new Date(slot.start.getTime() + slotDuration / 2 + durationMs),
      });
    }
    
    if (slotDuration >= durationMs * 2 && proposals.length < 3) {
      proposals.push({
        start: new Date(slot.end.getTime() - durationMs),
        end: new Date(slot.end),
      });
    }
  }

  return proposals.slice(0, 3);
}
