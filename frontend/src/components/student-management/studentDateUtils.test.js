import { describe, it, expect } from 'vitest';
import {
  parseUtcDate,
  formatBrasiliaDateTime,
  formatBrasiliaDate,
  formatBrasiliaTime,
} from './studentDateUtils';

describe('studentDateUtils', () => {
  it('converte timestamp UTC sem indicador Z para horário de Brasília (UTC-3)', () => {
    // 13:48 UTC corresponde exatamente a 10:48 no horário de Brasília (America/Sao_Paulo)
    const rawUtcString = '2026-10-01T13:48:00';
    const formatted = formatBrasiliaDateTime(rawUtcString);
    expect(formatted).toBe('01/10/2026 às 10:48');
  });

  it('converte timestamp UTC com Z para horário de Brasília (UTC-3)', () => {
    const rawUtcString = '2026-10-01T13:48:00Z';
    const formatted = formatBrasiliaDateTime(rawUtcString);
    expect(formatted).toBe('01/10/2026 às 10:48');
  });

  it('formata apenas a data no horário de Brasília', () => {
    const rawUtcString = '2026-10-01T02:30:00Z'; // Em Brasília (UTC-3) é 30/09/2026 às 23:30
    const formatted = formatBrasiliaDate(rawUtcString);
    expect(formatted).toBe('30/09/2026');
  });

  it('formata apenas a hora no horário de Brasília', () => {
    const rawUtcString = '2026-10-01T13:48:00Z';
    const formatted = formatBrasiliaTime(rawUtcString);
    expect(formatted).toBe('10:48');
  });

  it('retorna traço para datas nulas ou inválidas', () => {
    expect(formatBrasiliaDateTime(null)).toBe('—');
    expect(formatBrasiliaDateTime('')).toBe('—');
    expect(formatBrasiliaDateTime('data_invalida')).toBe('—');
    expect(formatBrasiliaDate(null)).toBe('—');
    expect(formatBrasiliaTime(null)).toBe('—');
  });
});
