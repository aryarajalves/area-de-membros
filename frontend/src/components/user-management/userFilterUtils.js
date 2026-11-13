import { COUNTRY_DDI_LIST } from '../platform-settings/PhoneWithDdiInput';

export const MONTH_OPTIONS = [
  { value: 'all', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

/**
 * Extrai o DDI e o DDD de um telefone brasileiro ou internacional.
 * Exemplos:
 * '+55 (85) 98814-6141' -> { ddi: '+55', ddd: '85' }
 * '+5585988146141'      -> { ddi: '+55', ddd: '85' }
 * '(85) 98814-6141'     -> { ddi: '+55', ddd: '85' }
 * '+1 555 123 4567'     -> { ddi: '+1', ddd: '555' }
 */
export function extractPhoneInfo(phone) {
  if (!phone || typeof phone !== 'string') {
    return { ddi: '', ddd: '', cleanDigits: '' };
  }

  const trimmed = phone.trim();
  const cleanDigits = trimmed.replace(/\D/g, '');

  let ddi = '';
  let restNumber = trimmed;

  if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRY_DDI_LIST].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.code)) {
        ddi = c.code;
        restNumber = trimmed.slice(c.code.length).trim();
        break;
      }
    }
  } else if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    ddi = '+55';
    restNumber = cleanDigits.slice(2);
  } else if (cleanDigits.length >= 10) {
    // Padrão Brasil com DDD
    ddi = '+55';
    restNumber = cleanDigits;
  } else {
    ddi = '';
    restNumber = cleanDigits;
  }

  const restDigits = restNumber.replace(/\D/g, '');
  let ddd = '';
  if (ddi === '+55' || !ddi) {
    ddd = restDigits.slice(0, 2);
  } else if (restDigits.length >= 2) {
    ddd = restDigits.slice(0, 3);
  }

  return { ddi, ddd, cleanDigits };
}

/**
 * Filtra a lista de usuários por busca textual, role, ddi, ddd e mês de criação.
 */
export function filterUsersList(users = [], filters = {}) {
  const {
    searchTerm = '',
    roleFilter = 'all',
    ddiFilter = 'all',
    dddFilter = '',
    monthFilter = 'all',
  } = filters;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchDigits = normalizedSearch.replace(/\D/g, '');
  const cleanDddFilter = dddFilter.trim().replace(/\D/g, '');

  return users.filter((u) => {
    // 1. Filtro de Perfil / Role
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }

    // 2. Filtro de Busca (Nome, E-mail ou Telefone)
    if (normalizedSearch) {
      const nameMatch = (u.name || '').toLowerCase().includes(normalizedSearch);
      const emailMatch = (u.email || '').toLowerCase().includes(normalizedSearch);
      const phoneTextMatch = (u.phone || '').toLowerCase().includes(normalizedSearch);
      const phoneDigits = (u.phone || '').replace(/\D/g, '');
      const phoneDigitsMatch = searchDigits.length > 0 && phoneDigits.includes(searchDigits);

      if (!nameMatch && !emailMatch && !phoneTextMatch && !phoneDigitsMatch) {
        return false;
      }
    }

    // 3. Extração de Telefone para DDI e DDD
    const { ddi, ddd } = extractPhoneInfo(u.phone);

    // 4. Filtro de DDI
    if (ddiFilter !== 'all') {
      if (ddi !== ddiFilter) {
        return false;
      }
    }

    // 5. Filtro de DDD
    if (cleanDddFilter) {
      if (ddd !== cleanDddFilter) {
        return false;
      }
    }

    // 6. Filtro de Mês de Criação
    if (monthFilter !== 'all') {
      if (!u.created_at) return false;
      const createdDate = new Date(u.created_at);
      const userMonth = createdDate.getMonth() + 1;
      if (String(userMonth) !== String(monthFilter)) {
        return false;
      }
    }

    return true;
  });
}
