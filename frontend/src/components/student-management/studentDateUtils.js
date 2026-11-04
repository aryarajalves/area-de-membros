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
 * Retorna a data em formato YYYY-MM-DD no fuso de Brasília (America/Sao_Paulo).
 */
export function getBrasiliaDateString(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return null;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
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

/**
 * Auxiliar para formatar horas e minutos restantes (ex: "3h 59min", "45 min", "2h").
 */
export function formatHoursAndMinutes(hours, minutes) {
  const h = Math.max(0, hours || 0);
  const m = Math.max(0, minutes || 0);
  if (h > 0 && m > 0) {
    return `${h}h ${m}min`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  if (m > 0) {
    return `${m} min`;
  }
  return 'menos de 1 min';
}

/**
 * Calcula e formata o tempo restante de acesso no Horário Oficial de Brasília (America/Sao_Paulo).
 * Inclui detalhamento de horas e minutos quando a expiração for próxima.
 */
export function formatCourseRemainingTime(expiresAt, isExpiredOverride = false, nowOverride = null) {
  if (!expiresAt) return null;
  const exp = parseUtcDate(expiresAt);
  if (!exp) return null;

  const now = nowOverride ? parseUtcDate(nowOverride) : new Date();
  const diffMs = exp.getTime() - now.getTime();

  if (isExpiredOverride || diffMs <= 0) {
    return {
      text: 'Acesso Expirado',
      isExpired: true,
      severity: 'expired',
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      totalMinutes: 0,
    };
  }

  const todayStr = getBrasiliaDateString(now);
  const expStr = getBrasiliaDateString(exp);

  if (!todayStr || !expStr) return null;

  // Diferença em dias de calendário no Horário de Brasília
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [eY, eM, eD] = expStr.split('-').map(Number);
  const todayUtc = Date.UTC(tY, tM - 1, tD);
  const expUtc = Date.UTC(eY, eM - 1, eD);
  const calendarDaysDiff = Math.round((expUtc - todayUtc) / 86400000);

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  let text = '';
  if (calendarDaysDiff <= 0) {
    // Expira hoje no Horário de Brasília
    if (totalMinutes <= 1) {
      text = 'Expira em menos de 1 min!';
    } else {
      const timeStr = formatHoursAndMinutes(diffHours, remainingMinutes);
      text = `Expira hoje! (${timeStr} restantes)`;
    }
  } else if (calendarDaysDiff === 1) {
    // Expira amanhã no Horário de Brasília
    if (diffHours < 24) {
      const timeStr = formatHoursAndMinutes(diffHours, remainingMinutes);
      text = `Expira amanhã! (${timeStr} restantes)`;
    } else {
      text = 'Expira amanhã!';
    }
  } else {
    // Faltam 2 ou mais dias
    text = `Faltam ${calendarDaysDiff} dias`;
  }

  return {
    text,
    isExpired: false,
    severity: calendarDaysDiff <= 7 ? 'warning' : 'ok',
    daysLeft: Math.max(0, calendarDaysDiff),
    hoursLeft: diffHours,
    minutesLeft: remainingMinutes,
    totalMinutes,
  };
}
