/**
 * Utilitários para leitura recursiva de pastas e arquivos no navegador (Drag & Drop),
 * detecção de extensões de vídeo, idiomas e normalização de identificadores de aulas.
 */

// Formatos de vídeo suportados
export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi', '.ts', '.wmv', '.flv', '.mpg', '.mpeg'
];

export function isVideoFile(fileName = '') {
  const lower = fileName.toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function formatFileSize(bytes = 0) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i] || 'MB'}`;
}

export function naturalSort(a = '', b = '') {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function cleanLessonTitle(fileName = '') {
  let name = fileName;
  for (const ext of SUPPORTED_VIDEO_EXTENSIONS) {
    if (name.toLowerCase().endsWith(ext)) {
      name = name.slice(0, -ext.length);
      break;
    }
  }
  return name.trim();
}

/**
 * Normaliza identificadores de aulas para comparação robusta e idempotente.
 * Remove extensão, múltiplos espaços, hífens e pontuações irrelevantes.
 */
export function normalizeLessonIdentifier(raw = '') {
  if (!raw || typeof raw !== 'string') return '';
  let str = cleanLessonTitle(raw).trim().toLowerCase();
  return str.replace(/[\s._-]+/g, ' ').trim();
}

// Mapeamento de idiomas suportados para importação em lote e faixas multilíngues
export const KNOWN_LANGUAGES = {
  pt: { code: 'pt', label: 'Português', flag: '🇧🇷' },
  'pt-br': { code: 'pt', label: 'Português', flag: '🇧🇷' },
  portugues: { code: 'pt', label: 'Português', flag: '🇧🇷' },
  en: { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  'en-us': { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  english: { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  ingles: { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  es: { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  'es-es': { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  spanish: { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  espanhol: { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  fr: { code: 'fr', label: 'Francês', flag: '🇫🇷' },
  french: { code: 'fr', label: 'Francês', flag: '🇫🇷' },
  frances: { code: 'fr', label: 'Francês', flag: '🇫🇷' },
  de: { code: 'de', label: 'Alemão', flag: '🇩🇪' },
  german: { code: 'de', label: 'Alemão', flag: '🇩🇪' },
  alemao: { code: 'de', label: 'Alemão', flag: '🇩🇪' },
  it: { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  italian: { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  italiano: { code: 'it', label: 'Italiano', flag: '🇮🇹' }
};

export function detectLanguageFromSegment(segment = '') {
  if (!segment) return null;
  const clean = segment.trim().toLowerCase().replace(/[_-]/g, '-');
  if (KNOWN_LANGUAGES[clean]) return KNOWN_LANGUAGES[clean];
  const simple = clean.split('-')[0];
  if (KNOWN_LANGUAGES[simple]) return KNOWN_LANGUAGES[simple];
  return null;
}

export function extractLessonGroupingKey(fileName = '') {
  const clean = cleanLessonTitle(fileName).trim();
  const matchNum = clean.match(/^(\d+)[\s._-]+/i) || clean.match(/^aula\s*(\d+)/i);
  if (matchNum) {
    return `num_${parseInt(matchNum[1], 10)}`;
  }
  return clean.toLowerCase();
}

export async function getFilesFromDataTransferItems(items) {
  const files = [];

  async function traverseEntry(entry, path = '') {
    if (!entry) return;
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => {
          const simulatedPath = path ? `${path}/${file.name}` : file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: simulatedPath,
            writable: true
          });
          files.push(file);
          resolve();
        }, () => resolve());
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const currentPath = path ? `${path}/${entry.name}` : entry.name;

      const readAllEntries = () =>
        new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            if (!entries || entries.length === 0) {
              resolve();
              return;
            }
            for (const childEntry of entries) {
              await traverseEntry(childEntry, currentPath);
            }
            await readAllEntries();
            resolve();
          }, () => resolve());
        });

      await readAllEntries();
    }
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseEntry(entry);
      }
    } else if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  return files;
}

/**
 * Identifica se um módulo importado corresponde a um módulo existente no curso.
 * Realiza comparação por título exato ou por identificador numérico de módulo.
 */
export function findMatchingExistingModule(modName = '', existingModules = []) {
  if (!modName || !existingModules || existingModules.length === 0) return null;
  const cleanModName = modName.trim().toLowerCase();

  // 1. Correspondência exata por título (case-insensitive)
  const exactMatch = existingModules.find(
    (em) => em.title?.trim().toLowerCase() === cleanModName
  );
  if (exactMatch) return exactMatch;

  // 2. Correspondência inteligente por número do módulo (ex: "Módulo 1" bate com "Módulo 01 - Trânsitos...")
  const modNumMatch = modName.match(/(?:m[óo]dulo\s*|modulo\s*|^)(\d+)/i);
  if (modNumMatch) {
    const modNum = parseInt(modNumMatch[1], 10);
    const numMatch = existingModules.find((em) => {
      const emNumMatch = em.title?.match(/(?:m[óo]dulo\s*|modulo\s*|^)(\d+)/i);
      if (emNumMatch && parseInt(emNumMatch[1], 10) === modNum) {
        return true;
      }
      return em.order_index === modNum;
    });
    if (numMatch) return numMatch;
  }

  return null;
}

/**
 * Vincula ou desvincula manualmente um módulo importado a um módulo existente do curso,
 * recalculando a deduplicação das aulas internas.
 */
export function relinkModuleExistingTarget(mod, targetExistingModule) {
  if (!mod) return mod;

  if (targetExistingModule) {
    const newOrder =
      targetExistingModule.order_index !== undefined && targetExistingModule.order_index !== null
        ? targetExistingModule.order_index
        : mod.orderIndex;

    const updatedLessons = (mod.lessons || []).map((lesson) => {
      let matchedLesson = null;
      if (targetExistingModule.lessons && targetExistingModule.lessons.length > 0) {
        const normImportId = normalizeLessonIdentifier(lesson.importIdentifier || lesson.title);
        matchedLesson = targetExistingModule.lessons.find((el) => {
          const elId = normalizeLessonIdentifier(el.import_identifier || el.title);
          return elId && normImportId && elId === normImportId;
        });
      }

      return {
        ...lesson,
        isExisting: !!matchedLesson,
        existingLessonId: matchedLesson ? matchedLesson.id : null,
        createdLessonId: matchedLesson ? matchedLesson.id : null
      };
    });

    return {
      ...mod,
      isExisting: true,
      existingModuleId: targetExistingModule.id,
      orderIndex: newOrder,
      lessons: updatedLessons
    };
  }

  // Desvincular: torna o módulo novo
  const resetLessons = (mod.lessons || []).map((lesson) => ({
    ...lesson,
    isExisting: false,
    existingLessonId: null,
    createdLessonId: null
  }));

  return {
    ...mod,
    isExisting: false,
    existingModuleId: null,
    lessons: resetLessons
  };
}
