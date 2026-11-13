import { describe, it, expect } from 'vitest';
import {
  extractPhoneInfo,
  filterUsersList,
  MONTH_OPTIONS,
} from './userFilterUtils';

describe('userFilterUtils', () => {
  const mockUsers = [
    {
      id: 1,
      name: 'Aryaraj Marketing',
      email: 'aryarajmarketing@gmail.com',
      phone: '+55 (85) 98814-6141',
      role: 'superadmin',
      created_at: '2026-10-06T10:00:00Z',
    },
    {
      id: 2,
      name: 'Carlos Aluno',
      email: 'carlos@exemplo.com',
      phone: '+55 (11) 97777-2222',
      role: 'aluno',
      created_at: '2026-11-10T14:30:00Z',
    },
    {
      id: 3,
      name: 'John International',
      email: 'john@eua.com',
      phone: '+1 555 123 4567',
      role: 'admin',
      created_at: '2026-10-15T09:00:00Z',
    },
  ];

  describe('extractPhoneInfo', () => {
    it('extrai DDI e DDD de telefone formatado do Brasil', () => {
      const info = extractPhoneInfo('+55 (85) 98814-6141');
      expect(info.ddi).toBe('+55');
      expect(info.ddd).toBe('85');
    });

    it('extrai DDI e DDD de telefone sem formatação', () => {
      const info = extractPhoneInfo('5511977772222');
      expect(info.ddi).toBe('+55');
      expect(info.ddd).toBe('11');
    });

    it('extrai DDI internacional como +1', () => {
      const info = extractPhoneInfo('+1 555 123 4567');
      expect(info.ddi).toBe('+1');
    });

    it('lida com string vazia ou nula sem estourar erro', () => {
      expect(extractPhoneInfo(null)).toEqual({ ddi: '', ddd: '', cleanDigits: '' });
      expect(extractPhoneInfo('')).toEqual({ ddi: '', ddd: '', cleanDigits: '' });
    });
  });

  describe('filterUsersList', () => {
    it('retorna todos os usuários se nenhum filtro estiver ativo', () => {
      const res = filterUsersList(mockUsers, {});
      expect(res).toHaveLength(3);
    });

    it('pesquisa usuário pelo nome', () => {
      const res = filterUsersList(mockUsers, { searchTerm: 'Aryaraj' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(1);
    });

    it('pesquisa usuário pelo e-mail', () => {
      const res = filterUsersList(mockUsers, { searchTerm: 'carlos@exemplo.com' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(2);
    });

    it('pesquisa usuário pelo telefone (formatado ou apenas dígitos)', () => {
      const res1 = filterUsersList(mockUsers, { searchTerm: '98814-6141' });
      expect(res1).toHaveLength(1);
      expect(res1[0].id).toBe(1);

      const res2 = filterUsersList(mockUsers, { searchTerm: '977772222' });
      expect(res2).toHaveLength(1);
      expect(res2[0].id).toBe(2);
    });

    it('filtra por DDI (+55 ou +1)', () => {
      const resBr = filterUsersList(mockUsers, { ddiFilter: '+55' });
      expect(resBr).toHaveLength(2);

      const resUs = filterUsersList(mockUsers, { ddiFilter: '+1' });
      expect(resUs).toHaveLength(1);
      expect(resUs[0].id).toBe(3);
    });

    it('filtra por DDD (ex: 85 ou 11)', () => {
      const res85 = filterUsersList(mockUsers, { dddFilter: '85' });
      expect(res85).toHaveLength(1);
      expect(res85[0].id).toBe(1);

      const res11 = filterUsersList(mockUsers, { dddFilter: '11' });
      expect(res11).toHaveLength(1);
      expect(res11[0].id).toBe(2);
    });

    it('filtra pelos usuários criados no mês X (ex: Outubro = 10, Novembro = 11)', () => {
      const resOct = filterUsersList(mockUsers, { monthFilter: '10' });
      expect(resOct).toHaveLength(2); // Usuários 1 e 3 criados em Outubro (10)
      expect(resOct.map((u) => u.id)).toEqual([1, 3]);

      const resNov = filterUsersList(mockUsers, { monthFilter: '11' });
      expect(resNov).toHaveLength(1); // Usuário 2 criado em Novembro (11)
      expect(resNov[0].id).toBe(2);
    });

    it('combina busca, perfil e DDD simultaneamente', () => {
      const res = filterUsersList(mockUsers, {
        roleFilter: 'aluno',
        dddFilter: '11',
        searchTerm: 'Carlos',
      });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(2);
    });
  });

  describe('MONTH_OPTIONS', () => {
    it('possui 13 opções (Todos os meses + 12 meses)', () => {
      expect(MONTH_OPTIONS).toHaveLength(13);
      expect(MONTH_OPTIONS[0].value).toBe('all');
      expect(MONTH_OPTIONS[10].label).toBe('Outubro');
      expect(MONTH_OPTIONS[11].label).toBe('Novembro');
    });
  });
});
