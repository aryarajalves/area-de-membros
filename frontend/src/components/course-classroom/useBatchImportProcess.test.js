import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBatchImportProcess } from './useBatchImportProcess';
import * as batchImportService from '../../services/batchImportService';
import * as lessonUtils from './lessonUtils';

describe('useBatchImportProcess hook', () => {
  const mockAddToast = vi.fn();
  const mockOnImportCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock_token');
    vi.spyOn(lessonUtils, 'getVideoFileDuration').mockResolvedValue(600);
  });

  it('inicia com estados padrão de não importando', () => {
    const { result } = renderHook(() =>
      useBatchImportProcess({
        courseId: 1,
        modulesList: [],
        setModulesList: vi.fn(),
        onImportCompleted: mockOnImportCompleted,
        addToast: mockAddToast
      })
    );

    expect(result.current.isImporting).toBe(false);
    expect(result.current.currentProcessingTitle).toBe('');
    expect(result.current.overallProgress).toEqual({ current: 0, total: 0 });
  });

  it('interrompe o envio e chama abort imediatamente ao acionar handleCancelQueue', async () => {
    let capturedAbortRef = null;
    const mockAbortFn = vi.fn();

    // Simula serviço de upload capturando o abortRef
    vi.spyOn(batchImportService, 'uploadVideoWithProgress').mockImplementation(
      (file, token, onProgress, abortRef) => {
        capturedAbortRef = abortRef;
        if (abortRef) {
          abortRef.current = mockAbortFn;
        }
        return new Promise((resolve, reject) => {
          // Mantém pendente até ser abortado
        });
      }
    );

    vi.spyOn(batchImportService, 'createModuleIfNotExists').mockResolvedValue({ id: 10, isNew: false });

    const mockModules = [
      {
        id: 'mod_1',
        title: 'Módulo 1',
        lessons: [
          {
            id: 'les_1',
            title: 'Aula 1',
            selected: true,
            status: 'pending',
            file: new File(['dummy'], '01.mp4', { type: 'video/mp4' })
          }
        ]
      }
    ];

    const setModulesList = vi.fn();

    const { result } = renderHook(() =>
      useBatchImportProcess({
        courseId: 1,
        modulesList: mockModules,
        setModulesList,
        onImportCompleted: mockOnImportCompleted,
        addToast: mockAddToast
      })
    );

    // Inicia a importação
    act(() => {
      result.current.handleStartBatchImport();
    });

    // Permite que as promessas avancem até uploadVideoWithProgress
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.isImporting).toBe(true);

    // Agora aciona o cancelamento imediato
    act(() => {
      result.current.handleCancelQueue();
    });

    expect(mockAbortFn).toHaveBeenCalled();
    expect(result.current.isImporting).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      'Envio de vídeos interrompido imediatamente!',
      'info'
    );
  });

  it('permite reimportar aula com falha através de handleRetryLesson', async () => {
    vi.spyOn(batchImportService, 'uploadVideoWithProgress').mockResolvedValue('https://b2.com/video.mp4');
    vi.spyOn(batchImportService, 'createModuleIfNotExists').mockResolvedValue({ id: 10, isNew: false });
    vi.spyOn(batchImportService, 'createLessonInModule').mockResolvedValue({ id: 100, title: 'Aula 1' });
    vi.spyOn(batchImportService, 'triggerLessonAiTranscription').mockResolvedValue(true);
    vi.spyOn(batchImportService, 'generateModuleAiOverview').mockResolvedValue({ title: 'Módulo 1 IA' });

    const mockModules = [
      {
        id: 'mod_1',
        title: 'Módulo 1',
        existingModuleId: 10,
        lessons: [
          {
            id: 'les_1',
            title: 'Aula 1',
            selected: true,
            status: 'error',
            errorMessage: 'Upload falhou',
            file: new File(['dummy'], '01.mp4', { type: 'video/mp4' })
          }
        ]
      }
    ];

    const setModulesList = vi.fn();

    const { result } = renderHook(() =>
      useBatchImportProcess({
        courseId: 1,
        modulesList: mockModules,
        setModulesList,
        onImportCompleted: mockOnImportCompleted,
        addToast: mockAddToast
      })
    );

    await act(async () => {
      result.current.handleRetryLesson('mod_1', 'les_1');
    });

    expect(setModulesList).toHaveBeenCalled();
    expect(batchImportService.uploadVideoWithProgress).toHaveBeenCalled();
    expect(batchImportService.createLessonInModule).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Importação em lote concluída'),
      'success'
    );
  });

  it('permite reimportar todas as aulas com falha através de handleRetryFailedLessons', async () => {
    vi.spyOn(batchImportService, 'uploadVideoWithProgress').mockResolvedValue('https://b2.com/video.mp4');
    vi.spyOn(batchImportService, 'createModuleIfNotExists').mockResolvedValue({ id: 10, isNew: false });
    vi.spyOn(batchImportService, 'createLessonInModule').mockResolvedValue({ id: 100, title: 'Aula 1' });
    vi.spyOn(batchImportService, 'triggerLessonAiTranscription').mockResolvedValue(true);
    vi.spyOn(batchImportService, 'generateModuleAiOverview').mockResolvedValue({ title: 'Módulo 1 IA' });

    const mockModules = [
      {
        id: 'mod_1',
        title: 'Módulo 1',
        existingModuleId: 10,
        lessons: [
          {
            id: 'les_1',
            title: 'Aula 1',
            selected: true,
            status: 'error',
            file: new File(['dummy1'], '01.mp4', { type: 'video/mp4' })
          },
          {
            id: 'les_2',
            title: 'Aula 2',
            selected: true,
            status: 'completed',
            file: new File(['dummy2'], '02.mp4', { type: 'video/mp4' })
          }
        ]
      }
    ];

    const setModulesList = vi.fn();

    const { result } = renderHook(() =>
      useBatchImportProcess({
        courseId: 1,
        modulesList: mockModules,
        setModulesList,
        onImportCompleted: mockOnImportCompleted,
        addToast: mockAddToast
      })
    );

    await act(async () => {
      result.current.handleRetryFailedLessons();
    });

    // Apenas a aula 1 com status 'error' foi enviada; a aula 2 já concluída foi pulada
    expect(batchImportService.uploadVideoWithProgress).toHaveBeenCalledTimes(1);
  });
});
