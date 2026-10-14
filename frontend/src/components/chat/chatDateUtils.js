/**
 * Utilitários para agrupamento e formatação de datas nas conversas do Chat.
 */

/**
 * Verifica se duas datas correspondem ao mesmo dia civil (ano, mês e dia).
 *
 * @param {string|Date|number} date1
 * @param {string|Date|number} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Capitaliza a primeira letra de uma string ou partes de mês.
 *
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

/**
 * Formata a data para o divisor de mensagens do Chat (ex: "Hoje", "Ontem", "10 de Outubro" ou "15 de Maio de 2025").
 *
 * @param {string|Date|number} dateInput
 * @param {Date} [referenceDate=new Date()] - Data de referência para comparação (útil em testes)
 * @returns {string}
 */
export function formatChatDateSeparator(dateInput, referenceDate = new Date()) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    const ref = new Date(referenceDate);

    // Hoje
    if (isSameDay(d, ref)) {
      return 'Hoje';
    }

    // Ontem (referência - 1 dia)
    const yesterday = new Date(ref);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(d, yesterday)) {
      return 'Ontem';
    }

    // Mesmo ano: "13 de Outubro"
    const day = d.getDate();
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
    const month = capitalizeWords(monthFormatter.format(d));

    if (d.getFullYear() === ref.getFullYear()) {
      return `${day} de ${month}`;
    }

    // Anos anteriores/posteriores: "13 de Outubro de 2025"
    return `${day} de ${month} de ${d.getFullYear()}`;
  } catch {
    return '';
  }
}
