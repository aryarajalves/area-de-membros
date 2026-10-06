/**
 * Utilitários para formatação e conversão de datas de backup no Horário Oficial de Brasília (America/Sao_Paulo).
 */

/**
 * Converte qualquer string ISO ou Date para Date tratando timestamps UTC do backend.
 * Se a string não contiver indicador de fuso ('Z' ou offset '+/-'), adiciona 'Z'
 * pois o backend armazena timestamps em UTC.
 */
export function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  let str = String(dateInput).trim();
  if (!str) return null;

  // Se for string ISO sem fuso explicitado (ex: "2026-10-05T20:27:47")
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
 * Formata data e hora no Horário Oficial de Brasília (America/Sao_Paulo):
 * Ex: "05/10/2026, 17:27"
 */
export function formatBrasiliaBackupDateTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return null;

  try {
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * Formata data e hora com segundos no Horário Oficial de Brasília (America/Sao_Paulo):
 * Ex: "05/10/2026, 17:27:47"
 */
export function formatBrasiliaBackupDateTimeFull(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return null;

  try {
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
}
