/**
 * Utilitários para formatação e conversão de datas no Horário Oficial de Brasília (America/Sao_Paulo)
 */

/**
 * Converte qualquer string ISO ou Date para Date no fuso de Brasília.
 * Se a string não contiver indicador de fuso ('Z' ou offset '+/-'),
 * adiciona 'Z' pois o backend armazena timestamps em UTC.
 */
export function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  let str = String(dateInput).trim();
  if (!str) return null;

  // Se for string ISO sem fuso explicitado (ex: "2026-10-01T13:48:00")
  if (!str.endsWith('Z') && !str.includes('+') && !str.includes('-') && str.includes('T')) {
    str = `${str}Z`;
  } else if (!str.endsWith('Z') && !str.includes('+') && !str.slice(10).includes('-')) {
    // Caso venha "YYYY-MM-DD HH:MM:SS" ou similar
    str = str.replace(' ', 'T') + 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formata data e hora no Horário Oficial de Brasília: DD/MM/AAAA às HH:MM
 */
export function formatBrasiliaDateTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';

  try {
    const datePart = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const timePart = d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} às ${timePart}`;
  } catch {
    return '—';
  }
}

/**
 * Formata apenas a data no Horário Oficial de Brasília: DD/MM/AAAA
 */
export function formatBrasiliaDate(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';

  try {
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return '—';
  }
}

/**
 * Formata apenas a hora no Horário Oficial de Brasília: HH:MM
 */
export function formatBrasiliaTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';

  try {
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
