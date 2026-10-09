/**
 * Serviço e utilitários para Importação em Lote de Aulas e Módulos via Pasta Local.
 * Orquestra parsing de diretórios, uploads diretos ao Backblaze S3 (com progresso),
 * deduplicação inteligente por identificador de origem e disparo automático de IA.
 */

export * from './batchImportFileUtils';
import {
  isVideoFile, naturalSort, cleanLessonTitle,
  normalizeLessonIdentifier, formatFileSize, detectLanguageFromSegment, extractLessonGroupingKey,
  findMatchingExistingModule
} from './batchImportFileUtils';

/** Helper interno para construção do objeto de aula parsed */
function buildParsedLesson({ primaryFile, videoFiles, totalSize, modIdx, lIdx, key, matchedExisting }) {
  const cleanTitle = cleanLessonTitle(primaryFile.name);
  const importId = cleanTitle || primaryFile.name;
  let matchedLesson = null;
  if (matchedExisting?.lessons?.length > 0) {
    const normImportId = normalizeLessonIdentifier(importId);
    matchedLesson = matchedExisting.lessons.find((el) => {
      const elId = normalizeLessonIdentifier(el.import_identifier || el.title);
      return elId && normImportId && elId === normImportId;
    });
  }

  return {
    id: `temp_lesson_${modIdx}_${lIdx}_${key}`,
    fileName: primaryFile.name,
    title: cleanTitle || `Aula ${lIdx + 1}`,
    importIdentifier: importId,
    isExisting: !!matchedLesson,
    existingLessonId: matchedLesson ? matchedLesson.id : null,
    file: primaryFile,
    videoFiles,
    size: totalSize,
    formattedSize: formatFileSize(totalSize),
    selected: true,
    status: 'pending',
    progress: 0,
    errorMessage: null,
    createdLessonId: matchedLesson ? matchedLesson.id : null
  };
}

/**
 * Faz o parsing da lista de arquivos retornada pelo input webkitdirectory ou drag & drop.
 * Agrupa arquivos por subpastas (Módulos), detecta faixas multilíngues e arquivos de vídeo (Aulas),
 * e identifica aulas já cadastradas via import_identifier para atualização transparente (sem duplicação).
 */
export function parseFilesToModules(filesList = [], existingModules = []) {
  const files = Array.from(filesList);
  const videoFiles = files.filter((f) => isVideoFile(f.name));
  if (videoFiles.length === 0) return [];

  // Agrupador: moduleName -> array de itens { file, langInfo, hasLanguageFolder }
  const moduleMap = new Map();

  for (const file of videoFiles) {
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/').filter(Boolean);

    let moduleName = 'Módulo 01 - Geral';
    let detectedLang = null;
    let hasLanguageFolder = false;

    if (parts.length >= 3) {
      const penultSegment = parts[parts.length - 2];
      detectedLang = detectLanguageFromSegment(penultSegment);
      if (detectedLang) {
        hasLanguageFolder = true;
        moduleName = parts.length >= 4 ? parts[parts.length - 3] : parts[0];
      } else {
        moduleName = penultSegment;
      }
    } else if (parts.length === 2) {
      moduleName = parts[0];
    }

    const defaultLang = { code: 'pt', label: 'Português', flag: '🇧🇷' };
    const langInfo = detectedLang || defaultLang;

    if (!moduleMap.has(moduleName)) {
      moduleMap.set(moduleName, []);
    }
    moduleMap.get(moduleName).push({ file, langInfo, hasLanguageFolder });
  }

  const sortedModuleNames = Array.from(moduleMap.keys()).sort(naturalSort);

  return sortedModuleNames.map((modName, modIdx) => {
    const rawItems = moduleMap.get(modName) || [];
    const hasAnyLangFolder = rawItems.some((item) => item.hasLanguageFolder);
    const matchedExisting = findMatchingExistingModule(modName, existingModules);
    let lessons = [];

    if (hasAnyLangFolder) {
      const lessonGroupMap = new Map();
      for (const item of rawItems) {
        const groupKey = extractLessonGroupingKey(item.file.name);
        if (!lessonGroupMap.has(groupKey)) lessonGroupMap.set(groupKey, []);
        lessonGroupMap.get(groupKey).push(item);
      }

      const sortedKeys = Array.from(lessonGroupMap.keys()).sort(naturalSort);
      lessons = sortedKeys.map((gKey, lIdx) => {
        const itemsInLesson = lessonGroupMap.get(gKey) || [];
        itemsInLesson.sort((a, b) => {
          if (a.langInfo.code === 'pt') return -1;
          if (b.langInfo.code === 'pt') return 1;
          return a.langInfo.code.localeCompare(b.langInfo.code);
        });

        const primaryItem = itemsInLesson[0];
        const videoFiles = itemsInLesson.map((it) => ({
          language: it.langInfo.code,
          language_label: it.langInfo.label,
          flag: it.langInfo.flag,
          file: it.file
        }));
        const totalSize = itemsInLesson.reduce((acc, it) => acc + (it.file.size || 0), 0);

        return buildParsedLesson({
          primaryFile: primaryItem.file,
          videoFiles,
          totalSize,
          modIdx,
          lIdx,
          key: gKey,
          matchedExisting
        });
      });
    } else {
      rawItems.sort((a, b) => naturalSort(a.file.name, b.file.name));
      lessons = rawItems.map((item, lIdx) =>
        buildParsedLesson({
          primaryFile: item.file,
          videoFiles: [{
            language: item.langInfo.code,
            language_label: item.langInfo.label,
            flag: item.langInfo.flag,
            file: item.file
          }],
          totalSize: item.file.size,
          modIdx,
          lIdx,
          key: item.file.name,
          matchedExisting
        })
      );
    }

    let initialOrder = modIdx + 1;
    if (matchedExisting?.order_index !== undefined && matchedExisting?.order_index !== null) {
      initialOrder = matchedExisting.order_index;
    } else {
      const matchNum = modName.match(/(?:m[óo]dulo\s*|modulo\s*|^)(\d+)/i);
      if (matchNum) initialOrder = parseInt(matchNum[1], 10);
    }

    return {
      id: `temp_mod_${modIdx}_${modName}`,
      title: modName,
      isExisting: !!matchedExisting,
      existingModuleId: matchedExisting ? matchedExisting.id : null,
      orderIndex: initialOrder,
      selected: true,
      lessons
    };
  });
}

/**
 * Executa upload do vídeo com Presigned URL do Backblaze B2 e acompanhamento de progresso.
 * Suporta stall timeout de 60s e interrupção imediata via abortRef.
 */
export async function uploadVideoWithProgress(file, token, onProgress, abortRef = null) {
  if (!file) throw new Error('Arquivo de vídeo não fornecido.');

  const abortController = new AbortController();
  if (abortRef) {
    abortRef.current = () => abortController.abort();
  }

  // 1. Obter Presigned URL
  const presignedRes = await fetch('/api/v1/courses/generate-video-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    signal: abortController.signal,
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || 'video/mp4'
    })
  });

  if (!presignedRes.ok) {
    const errData = await presignedRes.json().catch(() => ({}));
    throw new Error(errData.detail || 'Falha ao gerar URL de upload de vídeo.');
  }

  const presignedData = await presignedRes.json();
  const targetVideoUrl = presignedData.video_url || presignedData.final_url;

  if (presignedData.direct_upload && presignedData.upload_url && targetVideoUrl) {
    // 2. Upload direto via PUT com XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (abortRef) {
        abortRef.current = () => { try { xhr.abort(); } catch (_) {} };
      }

      let lastTime = 0;
      let lastPct = -1;
      let stallTimer = null;
      const resetStall = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          try { xhr.abort(); } catch (_) {}
          reject(new Error('Tempo limite esgotado (sem resposta do storage por 60s).'));
        }, 60000);
      };
      resetStall();

      xhr.open('PUT', presignedData.upload_url);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          resetStall();
          if (evt.lengthComputable) {
            const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
            const now = Date.now();
            if (percent !== lastPct || now - lastTime > 400) {
              lastPct = percent;
              lastTime = now;
              onProgress({
                percent,
                loadedBytes: evt.loaded,
                totalBytes: evt.total,
                loadedFormatted: formatFileSize(evt.loaded),
                totalFormatted: formatFileSize(evt.total)
              });
            }
          }
        };
      }

      xhr.onload = () => {
        if (stallTimer) clearTimeout(stallTimer);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) {
            onProgress({
              percent: 100,
              loadedBytes: file.size,
              totalBytes: file.size,
              loadedFormatted: formatFileSize(file.size),
              totalFormatted: formatFileSize(file.size)
            });
          }
          resolve(targetVideoUrl);
        } else {
          reject(new Error(`Falha no envio do vídeo para o storage (Status ${xhr.status})`));
        }
      };

      xhr.onabort = () => {
        if (stallTimer) clearTimeout(stallTimer);
        reject(new Error('UPLOAD_ABORTED'));
      };
      xhr.onerror = () => {
        if (stallTimer) clearTimeout(stallTimer);
        reject(new Error('Erro de conexão ao enviar vídeo para o storage.'));
      };
      xhr.send(file);
    });
  }

  // Fallback: se não for direct_upload, envia para rota padrão
  const formData = new FormData();
  formData.append('video', file);
  const fallbackRes = await fetch('/api/v1/courses/upload-video', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!fallbackRes.ok) {
    const errData = await fallbackRes.json().catch(() => ({}));
    throw new Error(errData.detail || 'Erro ao enviar vídeo para o servidor.');
  }

  const fallbackData = await fallbackRes.json();
  return fallbackData.video_url;
}

/**
 * Envia arquivo de imagem de capa (Módulo ou Aula) para o storage via /upload-thumbnail.
 */
export async function uploadThumbnailFile(file, token) {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/v1/courses/upload-thumbnail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Falha ao enviar imagem de capa.');
  }

  const data = await res.json();
  return data.thumbnail_url;
}

/**
 * Cria módulo no curso caso ainda não exista ou atualiza a capa caso já exista.
 */
export async function createModuleIfNotExists(courseId, moduleTitle, orderIndex, token, existingModuleId = null, imageUrl = null) {
  if (existingModuleId) {
    const patchBody = {};
    if (imageUrl) patchBody.image_url = imageUrl;
    if (orderIndex !== undefined && orderIndex !== null) patchBody.order_index = orderIndex;

    if (Object.keys(patchBody).length > 0) {
      try {
        const updateRes = await fetch(`/api/v1/courses/${courseId}/modules/${existingModuleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(patchBody)
        });
        if (!updateRes.ok) {
          console.warn('Aviso: Falha ao atualizar módulo existente, status:', updateRes.status);
        }
      } catch (e) {
        console.warn('Aviso: Não foi possível atualizar o módulo existente:', e);
      }
    }
    return { id: existingModuleId, isNew: false };
  }

  const res = await fetch(`/api/v1/courses/${courseId}/modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: moduleTitle,
      description: '',
      image_url: imageUrl || null,
      order_index: orderIndex
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Falha ao criar módulo "${moduleTitle}".`);
  }

  const created = await res.json();
  return { id: created.id, isNew: true };
}

/**
 * Cria ou atualiza a aula no módulo (com suporte a deduplicação e preservação do identificador original).
 * Se existingLessonId for fornecido, executa PATCH na aula existente sem criar duplicatas.
 */
export async function saveLessonInModule(
  courseId,
  moduleId,
  lessonTitle,
  videoUrl,
  orderIndex,
  token,
  thumbnailUrl = null,
  duration = null, videos = [], existingLessonId = null, importIdentifier = null
) {
  const isUpdating = !!existingLessonId;
  const endpoint = isUpdating
    ? `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${existingLessonId}`
    : `/api/v1/courses/${courseId}/modules/${moduleId}/lessons`;

  const bodyPayload = {
    title: lessonTitle, video_url: videoUrl, duration: duration || null,
    import_identifier: importIdentifier || lessonTitle
  };

  if (!isUpdating) {
    bodyPayload.description = '';
    bodyPayload.thumbnail_url = thumbnailUrl || null;
    bodyPayload.order_index = orderIndex;
    bodyPayload.content_type = 'video';
  } else if (thumbnailUrl) {
    bodyPayload.thumbnail_url = thumbnailUrl;
  }

  if (Array.isArray(videos) && videos.length > 0) bodyPayload.videos = videos;

  const res = await fetch(endpoint, {
    method: isUpdating ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const action = isUpdating ? 'atualizar' : 'cadastrar';
    throw new Error(errData.detail || `Falha ao ${action} aula "${lessonTitle}".`);
  }
  return await res.json();
}

/**
 * Mantém retrocompatibilidade para chamadas diretas de criação.
 */
export async function createLessonInModule(
  courseId, moduleId, lessonTitle, videoUrl, orderIndex, token,
  thumbnailUrl = null, duration = null, videos = [], importIdentifier = null
) {
  return saveLessonInModule(
    courseId, moduleId, lessonTitle, videoUrl, orderIndex, token,
    thumbnailUrl, duration, videos, null, importIdentifier
  );
}

/**
 * Gera título e descrição do módulo via IA (GPT-4o-mini) com base nas aulas importadas.
 */
export async function generateModuleAiOverview(courseId, moduleId, token) {
  const res = await fetch(`/api/v1/courses/${courseId}/modules/${moduleId}/generate-ai-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Falha ao gerar visão geral do módulo com IA.');
  }

  return await res.json();
}

/**
 * Dispara a transcrição por Inteligência Artificial (Whisper + GPT-4o) para a aula.
 */
export async function triggerLessonAiTranscription(courseId, moduleId, lessonId, videoUrl, token) {
  const res = await fetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ video_url: videoUrl })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.warn(`Aviso: Falha ao enfileirar transcrição IA da aula ${lessonId}:`, errData.detail);
    return false;
  }

  return true;
}
