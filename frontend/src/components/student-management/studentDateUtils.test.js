import { describe, it, expect } from 'vitest';
import {
  parseUtcDate,
  formatBrasiliaDateTime,
  formatBrasiliaDate,
  formatBrasiliaTime,
  getBrasiliaDateString,
  formatHoursAndMinutes,
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
    expect(getBrasiliaDateString('2026-11-04T04:36:00Z')).toBe('2026-11-04');
    expect(getBrasiliaDateString('2026-11-03T23:38:00Z')).toBe('2026-11-03');
  });

  it('formata adequadamente horas e minutos combinados', () => {
    expect(formatHoursAndMinutes(3, 59)).toBe('3h 59min');
    expect(formatHoursAndMinutes(2, 0)).toBe('2h');
    expect(formatHoursAndMinutes(0, 45)).toBe('45 min');
    expect(formatHoursAndMinutes(0, 0)).toBe('menos de 1 min');
  });

  it('exibe horas e minutos restantes no mesmo dia (cenário da captura)', () => {
    // Momento atual em Brasília: 04/11/2026 às 08:22 (11:22 UTC)
    const nowSimulated = '2026-11-04T11:22:00Z';
    // Expiração: 04/11/2026 às 12:21 (15:21 UTC) -> faltam 3h 59min
    const expiresAt = '2026-11-04T15:21:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info).not.toBeNull();
    expect(info.isExpired).toBe(false);
    expect(info.daysLeft).toBe(0);
    expect(info.hoursLeft).toBe(3);
    expect(info.minutesLeft).toBe(59);
    expect(info.text).toBe('Expira hoje! (3h 59min restantes)');
  });

  it('NÃO diz que expira hoje quando o término for no dia seguinte (04/11) no fuso de Brasília', () => {
    const nowSimulated = '2026-11-03T23:38:00Z';
    const expiresAt = '2026-11-04T04:36:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info).not.toBeNull();
    expect(info.isExpired).toBe(false);
    expect(info.daysLeft).toBe(1);
    expect(info.text).toContain('Expira amanhã!');
    expect(info.text).toContain('4h 58min restantes');
    expect(info.text).not.toContain('Expira hoje');
  });

  it('indica acesso expirado quando a data já passou', () => {
    const nowSimulated = '2026-11-03T17:00:00Z';
    const expiresAt = '2026-11-03T12:00:00Z';

    const info = formatCourseRemainingTime(expiresAt, false, nowSimulated);
    expect(info.isExpired).toBe(true);
    expect(info.text).toBe('Acesso Expirado');
  });
});
