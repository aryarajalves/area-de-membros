import { describe, it, expect } from 'vitest';
import { isSameDay, formatChatDateSeparator } from './chatDateUtils';

describe('chatDateUtils', () => {
  describe('isSameDay', () => {
    it('returns true when dates are on the exact same calendar day', () => {
      const d1 = '2026-10-13T10:11:00Z';
      const d2 = '2026-10-13T18:24:00Z';
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it('returns false when dates are on different days', () => {
      const d1 = '2026-10-11T12:00:00Z';
      const d2 = '2026-10-13T12:00:00Z';
      expect(isSameDay(d1, d2)).toBe(false);
    });

    it('handles null, undefined or invalid dates safely', () => {
      expect(isSameDay(null, '2026-10-13')).toBe(false);
      expect(isSameDay('2026-10-13', undefined)).toBe(false);
      expect(isSameDay('invalid-date', '2026-10-13')).toBe(false);
    });
  });

  describe('formatChatDateSeparator', () => {
    const referenceNow = new Date('2026-10-13T15:00:00');

    it('returns "Hoje" for messages sent today', () => {
      const todayDate = new Date('2026-10-13T10:00:00');
      expect(formatChatDateSeparator(todayDate, referenceNow)).toBe('Hoje');
    });

    it('returns "Ontem" for messages sent yesterday', () => {
      const yesterdayDate = new Date('2026-10-12T18:30:00');
      expect(formatChatDateSeparator(yesterdayDate, referenceNow)).toBe('Ontem');
    });

    it('returns formatted day and month for messages earlier in the same year', () => {
      const earlierDate = new Date('2026-05-20T12:00:00');
      const formatted = formatChatDateSeparator(earlierDate, referenceNow);
      expect(formatted).toMatch(/20 de Maio/i);
    });

    it('returns formatted day, month and year for messages from previous years', () => {
      const lastYearDate = new Date('2025-08-15T09:00:00');
      const formatted = formatChatDateSeparator(lastYearDate, referenceNow);
      expect(formatted).toMatch(/15 de Agosto de 2025/i);
    });

    it('returns empty string for null or invalid dates', () => {
      expect(formatChatDateSeparator(null)).toBe('');
      expect(formatChatDateSeparator('not-a-valid-date')).toBe('');
    });
  });
});
