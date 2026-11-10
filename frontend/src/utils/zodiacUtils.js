/**
 * Utilitário de Cálculo de Signo Zodiacal (Astrologia)
 * Baseado no dia e mês de nascimento.
 */

export const ZODIAC_SIGNS = [
  {
    key: 'aries',
    name: 'Áries',
    symbol: '♈',
    element: 'Fogo',
    color: '#ef4444',
    bgLight: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    period: '21/03 a 19/04',
    start: { month: 3, day: 21 },
    end: { month: 4, day: 19 },
  },
  {
    key: 'taurus',
    name: 'Touro',
    symbol: '♉',
    element: 'Terra',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    period: '20/04 a 20/05',
    start: { month: 4, day: 20 },
    end: { month: 5, day: 20 },
  },
  {
    key: 'gemini',
    name: 'Gêmeos',
    symbol: '♊',
    element: 'Ar',
    color: '#38bdf8',
    bgLight: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    period: '21/05 a 20/06',
    start: { month: 5, day: 21 },
    end: { month: 6, day: 20 },
  },
  {
    key: 'cancer',
    name: 'Câncer',
    symbol: '♋',
    element: 'Água',
    color: '#818cf8',
    bgLight: 'rgba(129, 140, 248, 0.15)',
    border: 'rgba(129, 140, 248, 0.35)',
    period: '21/06 a 22/07',
    start: { month: 6, day: 21 },
    end: { month: 7, day: 22 },
  },
  {
    key: 'leo',
    name: 'Leão',
    symbol: '♌',
    element: 'Fogo',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    period: '23/07 a 22/08',
    start: { month: 7, day: 23 },
    end: { month: 8, day: 22 },
  },
  {
    key: 'virgo',
    name: 'Virgem',
    symbol: '♍',
    element: 'Terra',
    color: '#84cc16',
    bgLight: 'rgba(132, 204, 22, 0.15)',
    border: 'rgba(132, 204, 22, 0.35)',
    period: '23/08 a 22/09',
    start: { month: 8, day: 23 },
    end: { month: 9, day: 22 },
  },
  {
    key: 'libra',
    name: 'Libra',
    symbol: '♎',
    element: 'Ar',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.35)',
    period: '23/09 a 22/10',
    start: { month: 9, day: 23 },
    end: { month: 10, day: 22 },
  },
  {
    key: 'scorpio',
    name: 'Escorpião',
    symbol: '♏',
    element: 'Água',
    color: '#c084fc',
    bgLight: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.35)',
    period: '23/10 a 21/11',
    start: { month: 10, day: 23 },
    end: { month: 11, day: 21 },
  },
  {
    key: 'sagittarius',
    name: 'Sagitário',
    symbol: '♐',
    element: 'Fogo',
    color: '#fb923c',
    bgLight: 'rgba(251, 146, 60, 0.15)',
    border: 'rgba(251, 146, 60, 0.35)',
    period: '22/11 a 21/12',
    start: { month: 11, day: 22 },
    end: { month: 12, day: 21 },
  },
  {
    key: 'capricorn',
    name: 'Capricórnio',
    symbol: '♑',
    element: 'Terra',
    color: '#a1a1aa',
    bgLight: 'rgba(161, 161, 170, 0.15)',
    border: 'rgba(161, 161, 170, 0.35)',
    period: '22/12 a 19/01',
    start: { month: 12, day: 22 },
    end: { month: 1, day: 19 },
  },
  {
    key: 'aquarius',
    name: 'Aquário',
    symbol: '♒',
    element: 'Ar',
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.35)',
    period: '20/01 a 18/02',
    start: { month: 1, day: 20 },
    end: { month: 2, day: 18 },
  },
  {
    key: 'pisces',
    name: 'Peixes',
    symbol: '♓',
    element: 'Água',
    color: '#2dd4bf',
    bgLight: 'rgba(45, 212, 191, 0.15)',
    border: 'rgba(45, 212, 191, 0.35)',
    period: '19/02 a 20/03',
    start: { month: 2, day: 19 },
    end: { month: 3, day: 20 },
  },
];

/**
 * Calcula o signo solar a partir de uma data no formato 'YYYY-MM-DD' ou objeto Date.
 * @param {string|Date} birthDate
 * @returns {object|null}
 */
export function getZodiacSign(birthDate) {
  if (!birthDate) return null;

  let day, month;

  if (typeof birthDate === 'string') {
    // Normaliza 'YYYY-MM-DD'
    const parts = birthDate.split('T')[0].split('-');
    if (parts.length >= 3) {
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(birthDate);
      if (isNaN(d.getTime())) return null;
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
    }
  } else if (birthDate instanceof Date) {
    if (isNaN(birthDate.getTime())) return null;
    month = birthDate.getUTCMonth() + 1;
    day = birthDate.getUTCDate();
  } else {
    return null;
  }

  if (!month || !day || isNaN(month) || isNaN(day)) return null;

  // Busca o signo correspondente
  for (const sign of ZODIAC_SIGNS) {
    if (sign.key === 'capricorn') {
      // Capricórnio cruza o final de ano (22/12 a 31/12 ou 01/01 a 19/01)
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return sign;
      }
    } else {
      if (
        (month === sign.start.month && day >= sign.start.day) ||
        (month === sign.end.month && day <= sign.end.day)
      ) {
        return sign;
      }
    }
  }

  return null;
}
