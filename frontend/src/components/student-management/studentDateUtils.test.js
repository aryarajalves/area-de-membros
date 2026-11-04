import { describe, it, expect } from 'vitest';
import {
  parseUtcDate,
  formatBrasiliaDateTime,
  formatBrasiliaDate,
  formatBrasiliaTime,
  getBrasiliaDateString,
  formatCourseRemainingTime,
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

  it('extrai corretamente a string de data YYYY-MM-DD no fuso de Brasília', () => {
    // 2026-11-04T01:36:00-03:00 é 2026-11-04 no fuso de Brasília
    expect(getBrasiliaDateString('2026-11-04T04:36:00Z')).toBe('2026-11-04');
    // 2026-11-03T23:38:00Z é 2026-11-03 no fuso de Brasília
    expect(getBrasiliaDateString('2026-11-03T23:38:00Z')).toBe('2026-11-03');
  });

  it('NÃO diz que expira hoje quando o término for no dia seguinte (04/11) no fuso de Brasília', () => {
    // Cenário real do usuário:
    // Momento atual em Brasília: 03/11/2026 às 20:38 (23:38 UTC)
    const nowSimulated = '2026-11-03T23:38:00Z';
    // Expiração do curso: 04/11/2026 às 01:36 em Brasília (04:36 UTC)
    const expiresAt = '2026-11-04T04:36:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info).not.toBeNull();
    expect(info.isExpired).toBe(false);
    expect(info.daysLeft).toBe(1);
    expect(info.text).toContain('Expira amanhã');
    expect(info.text).not.toContain('Expira hoje');
  });

  it('indica que expira hoje quando o término estiver no mesmo dia no fuso de Brasília', () => {
    // Momento atual em Brasília: 03/11/2026 às 14:00 (17:00 UTC)
    const nowSimulated = '2026-11-03T17:00:00Z';
    // Expiração: 03/11/2026 às 18:00 (21:00 UTC)
    const expiresAt = '2026-11-03T21:00:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info).not.toBeNull();
    expect(info.isExpired).toBe(false);
    expect(info.daysLeft).toBe(0);
    expect(info.text).toContain('Expira hoje');
    expect(info.text).toContain('4h restantes');
  });

  it('indica acesso expirado quando a data já passou', () => {
    const nowSimulated = '2026-11-03T17:00:00Z';
    const expiresAt = '2026-11-03T12:00:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info.isExpired).toBe(true);
    expect(info.text).toBe('Acesso Expirado');
  });
});
