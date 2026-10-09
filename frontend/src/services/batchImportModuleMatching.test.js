import { describe, it, expect } from 'vitest';
import {
  findMatchingExistingModule,
  relinkModuleExistingTarget
} from './batchImportFileUtils';

describe('batchImportModuleMatching - Identificação e Vínculo de Módulos', () => {
  const existingModulesMock = [
    {
      id: 4,
      title: 'Módulo 01 - Trânsitos Astrológicos e Previsões',
      order_index: 1,
      lessons: [
        { id: 101, title: 'Introdução aos Trânsitos', import_identifier: 'Introducao aos Transitos' },
        { id: 102, title: 'Trânsito de Marte', import_identifier: 'Transito de Marte' }
      ]
    },
    {
      id: 5,
      title: 'Módulo 02 - O Impacto do Sol em Nossas Vidas',
      order_index: 2,
      lessons: [
        { id: 201, title: 'Sol na Casa 1', import_identifier: 'Sol na Casa 1' }
      ]
    },
    {
      id: 6,
      title: 'Módulo 2',
      order_index: 0,
      lessons: []
    }
  ];

  describe('findMatchingExistingModule', () => {
    it('identifica correspondência exata por título (case-insensitive)', () => {
      const match = findMatchingExistingModule('módulo 2', existingModulesMock);
      expect(match).toBeDefined();
      expect(match.id).toBe(6);
      expect(match.title).toBe('Módulo 2');
    });

    it('identifica inteligentemente por número de módulo (Módulo 1 bate com Módulo 01...)', () => {
      const match = findMatchingExistingModule('Módulo 1', existingModulesMock);
      expect(match).toBeDefined();
      expect(match.id).toBe(4);
      expect(match.title).toBe('Módulo 01 - Trânsitos Astrológicos e Previsões');
    });

    it('retorna null quando não existe correspondência', () => {
      const match = findMatchingExistingModule('Módulo 99 - Avançado', existingModulesMock);
      expect(match).toBeNull();
    });

    it('retorna null para lista vazia ou nome inválido', () => {
      expect(findMatchingExistingModule('', existingModulesMock)).toBeNull();
      expect(findMatchingExistingModule('Módulo 1', [])).toBeNull();
      expect(findMatchingExistingModule('Módulo 1', null)).toBeNull();
    });
  });

  describe('relinkModuleExistingTarget', () => {
    const importedMod = {
      id: 'temp_mod_0',
      title: 'Módulo 1',
      isExisting: false,
      existingModuleId: null,
      orderIndex: 1,
      lessons: [
        {
          id: 'l_1',
          title: 'Introdução aos Trânsitos',
          importIdentifier: 'Introducao aos Transitos',
          isExisting: false,
          existingLessonId: null
        },
        {
          id: 'l_2',
          title: 'Nova Aula Inédita',
          importIdentifier: 'Nova Aula Inedita',
          isExisting: false,
          existingLessonId: null
        }
      ]
    };

    it('vincula manualmente a um módulo existente e atualiza deduplicação das aulas', () => {
      const targetModule = existingModulesMock[0]; // ID 4
      const linked = relinkModuleExistingTarget(importedMod, targetModule);

      expect(linked.isExisting).toBe(true);
      expect(linked.existingModuleId).toBe(4);
      expect(linked.orderIndex).toBe(1);

      // A aula que já existe no módulo 4 deve ser marcada como isExisting
      const matchingLesson = linked.lessons.find((l) => l.title === 'Introdução aos Trânsitos');
      expect(matchingLesson.isExisting).toBe(true);
      expect(matchingLesson.existingLessonId).toBe(101);

      // A aula inédita deve continuar como isExisting = false
      const newLesson = linked.lessons.find((l) => l.title === 'Nova Aula Inédita');
      expect(newLesson.isExisting).toBe(false);
      expect(newLesson.existingLessonId).toBeNull();
    });

    it('desvincula módulo para criar um novo e redefine todas as aulas', () => {
      const alreadyLinked = {
        ...importedMod,
        isExisting: true,
        existingModuleId: 4,
        lessons: [
          { id: 'l_1', isExisting: true, existingLessonId: 101 },
          { id: 'l_2', isExisting: false, existingLessonId: null }
        ]
      };

      const unlinked = relinkModuleExistingTarget(alreadyLinked, null);
      expect(unlinked.isExisting).toBe(false);
      expect(unlinked.existingModuleId).toBeNull();
      expect(unlinked.lessons.every((l) => !l.isExisting && l.existingLessonId === null)).toBe(true);
    });
  });
});
