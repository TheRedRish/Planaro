import { describe, it, expect } from 'vitest';
import { mergeBusyBlocks, findFreeSlots, type BusyBlock } from './scheduling-engine';

describe('Scheduling Engine', () => {
  describe('mergeBusyBlocks', () => {
    it('should merge overlapping blocks', () => {
      const blocks: BusyBlock[] = [
        { start: new Date('2026-05-27T09:00:00'), end: new Date('2026-05-27T10:00:00'), title: 'A' },
        { start: new Date('2026-05-27T09:30:00'), end: new Date('2026-05-27T11:00:00'), title: 'B' },
      ];
      const merged = mergeBusyBlocks(blocks);
      expect(merged).toHaveLength(1);
      expect(merged[0].start.toISOString()).toBe(new Date('2026-05-27T09:00:00').toISOString());
      expect(merged[0].end.toISOString()).toBe(new Date('2026-05-27T11:00:00').toISOString());
    });

    it('should merge contiguous blocks', () => {
      const blocks: BusyBlock[] = [
        { start: new Date('2026-05-27T09:00:00'), end: new Date('2026-05-27T10:00:00'), title: 'A' },
        { start: new Date('2026-05-27T10:00:00'), end: new Date('2026-05-27T11:00:00'), title: 'B' },
      ];
      const merged = mergeBusyBlocks(blocks);
      expect(merged).toHaveLength(1);
      expect(merged[0].end.toISOString()).toBe(new Date('2026-05-27T11:00:00').toISOString());
    });
  });

  describe('findFreeSlots', () => {
    it('should find gaps between blocks', () => {
      const busy: BusyBlock[] = [
        { start: new Date('2026-05-27T10:00:00'), end: new Date('2026-05-27T11:00:00'), title: 'Meeting' },
      ];
      const start = new Date('2026-05-27T08:00:00');
      const end = new Date('2026-05-27T12:00:00');
      const slots = findFreeSlots(busy, start, end, 30);

      expect(slots).toHaveLength(2);
      expect(slots[0].start.toISOString()).toBe(start.toISOString());
      expect(slots[0].end.toISOString()).toBe(busy[0].start.toISOString());
      expect(slots[1].start.toISOString()).toBe(busy[0].end.toISOString());
      expect(slots[1].end.toISOString()).toBe(end.toISOString());
    });

    it('should filter out short gaps', () => {
      const busy: BusyBlock[] = [
        { start: new Date('2026-05-27T10:00:00'), end: new Date('2026-05-27T10:15:00'), title: 'Quick Sync' },
      ];
      const start = new Date('2026-05-27T09:50:00');
      const end = new Date('2026-05-27T10:30:00');
      // 10 min gap before, 15 min gap after. Min duration 20 mins.
      const slots = findFreeSlots(busy, start, end, 20);

      expect(slots).toHaveLength(0);
    });
  });
});
