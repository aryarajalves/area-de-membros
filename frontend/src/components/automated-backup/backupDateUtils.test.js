import { describe, it, expect } from 'vitest';
import {
  parseUtcDate,
  formatBrasiliaBackupDateTime,
  formatBrasiliaBackupDateTimeFull,
} from './backupDateUtils';

describe('backupDateUtils', () => {
  it('correctly converts UTC string with Z to America/Sao_Paulo (UTC-3)', () => {
    // 20:27:47 UTC corresponde exatamente a 17:27:47 no horário de Brasília
    const utcIso = '2026-10-05T20:27:47Z';
    const formatted = formatBrasiliaBackupDateTime(utcIso);
    expect(formatted).toBe('05/10/2026, 17:27');

    const formattedFull = formatBrasiliaBackupDateTimeFull(utcIso);
    expect(formattedFull).toBe('05/10/2026, 17:27:47');
  });

  it('correctly treats naive ISO string from backend as UTC and converts to America/Sao_Paulo', () => {
    // String ISO ingênua sem 'Z'
    const naiveIso = '2026-10-05T20:27:47';
    const formatted = formatBrasiliaBackupDateTime(naiveIso);
    expect(formatted).toBe('05/10/2026, 17:27');
  });

  it('correctly treats date string with space separator as UTC and converts to America/Sao_Paulo', () => {
    const spaceDate = '2026-10-05 20:27:47';
    const formatted = formatBrasiliaBackupDateTime(spaceDate);
    expect(formatted).toBe('05/10/2026, 17:27');
  });

  it('returns null for empty, null or invalid date inputs', () => {
    expect(parseUtcDate(null)).toBeNull();
    expect(parseUtcDate('')).toBeNull();
    expect(parseUtcDate('invalid-date')).toBeNull();
    expect(formatBrasiliaBackupDateTime(null)).toBeNull();
    expect(formatBrasiliaBackupDateTime('')).toBeNull();
    expect(formatBrasiliaBackupDateTime('not-a-date')).toBeNull();
  });
});
