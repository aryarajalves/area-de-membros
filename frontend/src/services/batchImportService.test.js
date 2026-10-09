import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isVideoFile,
  formatFileSize,
  cleanLessonTitle,
  naturalSort,
  detectLanguageFromSegment,
  extractLessonGroupingKey,
  parseFilesToModules,
  uploadThumbnailFile,
  uploadVideoWithProgress,
  createModuleIfNotExists,
  saveLessonInModule,
  createLessonInModule,
  generateModuleAiOverview,
  triggerLessonAiTranscription,
  normalizeLessonIdentifier
} from './batchImportService';

describe('batchImportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isVideoFile', () => {
    it('retorna true apenas para extensões de vídeo suportadas', () => {
      expect(isVideoFile('aula01.mp4')).toBe(true);
      expect(isVideoFile('aula02.MP4')).toBe(true);
      expect(isVideoFile('video.webm')).toBe(true);
      expect(isVideoFile('filme.mov')).toBe(true);
      expect(isVideoFile('gravacao.mkv')).toBe(true);

      expect(isVideoFile('apostila.pdf')).toBe(false);
      expect(isVideoFile('foto.png')).toBe(false);
      expect(isVideoFile('audio.mp3')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formata tamanhos de arquivo em B, KB, MB e GB', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500.0 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024 * 15.5)).toBe('15.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });
  });

  describe('cleanLessonTitle', () => {
    it('remove extensões de vídeo e espaços extras do título da aula', () => {
      expect(cleanLessonTitle('01 - Apresentação e Boas Vindas.mp4')).toBe('01 - Apresentação e Boas Vindas');
      expect(cleanLessonTitle('Modulo_02_Aula.WebM')).toBe('Modulo_02_Aula');
      expect(cleanLessonTitle('Sem Extensao')).toBe('Sem Extensao');
    });
  });

  describe('naturalSort', () => {
    it('ordena naturalmente nomes com números', () => {
      const items = ['10 - Aula', '01 - Aula', '02 - Aula'];
      items.sort(naturalSort);
      expect(items).toEqual(['01 - Aula', '02 - Aula', '10 - Aula']);
    });
  });

  describe('parseFilesToModules', () => {
    it('retorna lista vazia se nenhum arquivo de vídeo for fornecido', () => {
      const files = [
        { name: 'documento.pdf', webkitRelativePath: 'Curso/documento.pdf' },
        { name: 'capa.jpg', webkitRelativePath: 'Curso/capa.jpg' }
      ];
      const result = parseFilesToModules(files, []);
      expect(result).toEqual([]);
    });

    it('agrupa vídeos por subpastas de módulos e ordena alfanumericamente', () => {
      const files = [
        { name: '02 - Prática.mp4', webkitRelativePath: 'Curso Astrologia/01 - Introdução/02 - Prática.mp4', size: 1000000 },
        { name: '01 - Boas Vindas.mp4', webkitRelativePath: 'Curso Astrologia/01 - Introdução/01 - Boas Vindas.mp4', size: 2000000 },
        { name: '01 - Signos.mp4', webkitRelativePath: 'Curso Astrologia/02 - Módulo Avançado/01 - Signos.mp4', size: 3000000 }
      ];

      const existingModules = [
        { id: 99, title: '01 - Introdução' }
      ];

      const result = parseFilesToModules(files, existingModules);

      expect(result).toHaveLength(2);

      // Primeiro Módulo
      expect(result[0].title).toBe('01 - Introdução');
      expect(result[0].isExisting).toBe(true);
      expect(result[0].existingModuleId).toBe(99);
      expect(result[0].lessons).toHaveLength(2);
      expect(result[0].lessons[0].title).toBe('01 - Boas Vindas');
      expect(result[0].lessons[1].title).toBe('02 - Prática');
      expect(result[0].lessons[0].selected).toBe(true);

      // Segundo Módulo
      expect(result[1].title).toBe('02 - Módulo Avançado');
      expect(result[1].isExisting).toBe(false);
      expect(result[1].existingModuleId).toBeNull();
      expect(result[1].lessons).toHaveLength(1);
      expect(result[1].lessons[0].title).toBe('01 - Signos');
    });

    it('identifica aulas existentes no módulo via import_identifier para atualização sem duplicação', () => {
      const files = [
        { name: '01 - Introdução - Sol.mp4', webkitRelativePath: 'Módulo 01/01 - Introdução - Sol.mp4', size: 1500000 },
        { name: '02 - A Lua.mp4', webkitRelativePath: 'Módulo 01/02 - A Lua.mp4', size: 2500000 }
      ];

      const existingModules = [
        {
          id: 50,
          title: 'Módulo 01',
          lessons: [
            { id: 101, title: 'Aula 01 - O Sol Renomeado por IA', import_identifier: '01 - Introdução - Sol' }
          ]
        }
      ];

      const result = parseFilesToModules(files, existingModules);
      expect(result).toHaveLength(1);
      const mod = result[0];
      expect(mod.isExisting).toBe(true);
      expect(mod.lessons).toHaveLength(2);

      // Aula 1 deve ser reconhecida como existente via import_identifier
      expect(mod.lessons[0].isExisting).toBe(true);
      expect(mod.lessons[0].existingLessonId).toBe(101);
      expect(mod.lessons[0].importIdentifier).toBe('01 - Introdução - Sol');

      // Aula 2 é nova
      expect(mod.lessons[1].isExisting).toBe(false);
      expect(mod.lessons[1].existingLessonId).toBeNull();
    });
  });

  describe('uploadThumbnailFile', () => {
    it('retorna null se nenhum arquivo for fornecido', async () => {
      const res = await uploadThumbnailFile(null, 'token');
      expect(res).toBeNull();
    });

    it('faz upload de imagem de capa via /upload-thumbnail com sucesso', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ thumbnail_url: 'https://b2.storage/capa.jpg' })
      });

      const mockFile = new File(['conteudo'], 'capa.jpg', { type: 'image/jpeg' });
      const url = await uploadThumbnailFile(mockFile, 'fake_token');

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/upload-thumbnail', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake_token' })
      }));
      expect(url).toBe('https://b2.storage/capa.jpg');
    });
  });

  describe('createModuleIfNotExists', () => {
    it('reaproveita módulo existente se o ID já estiver definido e atualiza imagem se fornecida', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123 })
      });

      const res = await createModuleIfNotExists(1, 'Introdução', 0, 'fake_token', 123, 'https://b2.storage/modulo.jpg');
      expect(res).toEqual({ id: 123, isNew: false });
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/123', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ image_url: 'https://b2.storage/modulo.jpg', order_index: 0 })
      }));
    });

    it('faz POST na API para criar módulo novo caso não exista incluindo image_url', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 456, title: 'Novo Módulo' })
      });

      const res = await createModuleIfNotExists(10, 'Novo Módulo', 2, 'fake_token', null, 'https://b2.storage/capa.jpg');

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/10/modules', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake_token' }),
        body: JSON.stringify({ title: 'Novo Módulo', description: '', image_url: 'https://b2.storage/capa.jpg', order_index: 2 })
      }));
      expect(res).toEqual({ id: 456, isNew: true });
    });
  });

  describe('createLessonInModule e saveLessonInModule', () => {
    it('cria a aula enviando título, vídeo, ordem, thumbnail_url e import_identifier via POST', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 789, title: 'Aula 01' })
      });

      const res = await createLessonInModule(
        1,
        2,
        'Aula 01',
        'https://video.url/1.mp4',
        0,
        'fake_token',
        'https://b2.storage/aula_capa.jpg'
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/2/lessons', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake_token' }),
        body: JSON.stringify({
          title: 'Aula 01',
          video_url: 'https://video.url/1.mp4',
          duration: null,
          import_identifier: 'Aula 01',
          description: '',
          thumbnail_url: 'https://b2.storage/aula_capa.jpg',
          order_index: 0,
          content_type: 'video'
        })
      }));
      expect(res.id).toBe(789);
    });

    it('inclui faixas multilíngues no corpo da requisição quando fornecidas', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 789, title: 'Aula Multilíngue' })
      });

      const videosPayload = [
        { language: 'pt', language_label: 'Português', video_url: 'https://v.url/pt.mp4', order_index: 0 },
        { language: 'en', language_label: 'Inglês', video_url: 'https://v.url/en.mp4', order_index: 1 }
      ];

      await createLessonInModule(
        1,
        2,
        'Aula Multilíngue',
        'https://v.url/pt.mp4',
        0,
        'fake_token',
        null,
        '10:00',
        videosPayload
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/2/lessons', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake_token' }),
        body: JSON.stringify({
          title: 'Aula Multilíngue',
          video_url: 'https://v.url/pt.mp4',
          duration: '10:00',
          import_identifier: 'Aula Multilíngue',
          description: '',
          thumbnail_url: null,
          order_index: 0,
          content_type: 'video',
          videos: videosPayload
        })
      }));
    });

    it('atualiza aula existente via PATCH ao informar existingLessonId em saveLessonInModule', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 456, title: 'Aula Atualizada' })
      });

      const res = await saveLessonInModule(
        1,
        2,
        'Aula Atualizada',
        'https://video.url/novo_video.mp4',
        0,
        'fake_token',
        'https://b2.storage/nova_capa.jpg',
        '15:00',
        [],
        456, // existingLessonId
        '01 - Aula Original' // importIdentifier
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/2/lessons/456', expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer fake_token' }),
        body: JSON.stringify({
          title: 'Aula Atualizada',
          video_url: 'https://video.url/novo_video.mp4',
          duration: '15:00',
          import_identifier: '01 - Aula Original',
          thumbnail_url: 'https://b2.storage/nova_capa.jpg'
        })
      }));
      expect(res.id).toBe(456);
    });
  });

  describe('generateModuleAiOverview', () => {
    it('dispara endpoint POST para gerar título e descrição do módulo via IA', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Módulo 01 - Fundamentos Essenciais',
          description: 'Visão geral gerada pela inteligência artificial.'
        })
      });

      const res = await generateModuleAiOverview(10, 20, 'fake_token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/10/modules/20/generate-ai-overview',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fake_token'
          })
        })
      );
      expect(res.title).toBe('Módulo 01 - Fundamentos Essenciais');
      expect(res.description).toBe('Visão geral gerada pela inteligência artificial.');
    });
  });

  describe('Multi-language Parsing Helpers', () => {
    it('detectLanguageFromSegment identifica códigos e nomes de idiomas', () => {
      expect(detectLanguageFromSegment('pt')).toEqual({ code: 'pt', label: 'Português', flag: '🇧🇷' });
      expect(detectLanguageFromSegment('PT-BR')).toEqual({ code: 'pt', label: 'Português', flag: '🇧🇷' });
      expect(detectLanguageFromSegment('portugues')).toEqual({ code: 'pt', label: 'Português', flag: '🇧🇷' });
      expect(detectLanguageFromSegment('EN')).toEqual({ code: 'en', label: 'Inglês', flag: '🇺🇸' });
      expect(detectLanguageFromSegment('english')).toEqual({ code: 'en', label: 'Inglês', flag: '🇺🇸' });
      expect(detectLanguageFromSegment('ES')).toEqual({ code: 'es', label: 'Espanhol', flag: '🇪🇸' });
      expect(detectLanguageFromSegment('espanhol')).toEqual({ code: 'es', label: 'Espanhol', flag: '🇪🇸' });
      expect(detectLanguageFromSegment('Modulo 01')).toBeNull();
      expect(detectLanguageFromSegment('')).toBeNull();
    });

    it('extractLessonGroupingKey agrupa aulas por número ou título limpo', () => {
      expect(extractLessonGroupingKey('01 - Introducao.mp4')).toBe('num_1');
      expect(extractLessonGroupingKey('01 - Introduction.mp4')).toBe('num_1');
      expect(extractLessonGroupingKey('Aula 02 - Pratica.mp4')).toBe('num_2');
      expect(extractLessonGroupingKey('Conceitos Basicos.mp4')).toBe('conceitos basicos');
    });

    it('parseFilesToModules agrupa faixas multilíngues da mesma aula sob subpastas de idiomas (Opção A)', () => {
      const files = [
        { name: '01 - Introducao.mp4', webkitRelativePath: 'Curso Astrologia/Modulo 01/PT/01 - Introducao.mp4', size: 1000 },
        { name: '01 - Introduction.mp4', webkitRelativePath: 'Curso Astrologia/Modulo 01/EN/01 - Introduction.mp4', size: 1200 },
        { name: '01 - Introduccion.mp4', webkitRelativePath: 'Curso Astrologia/Modulo 01/ES/01 - Introduccion.mp4', size: 1100 },
        { name: '02 - Signos.mp4', webkitRelativePath: 'Curso Astrologia/Modulo 01/PT/02 - Signos.mp4', size: 2000 },
        { name: '02 - Zodiac Signs.mp4', webkitRelativePath: 'Curso Astrologia/Modulo 01/EN/02 - Zodiac Signs.mp4', size: 2100 }
      ];

      const modules = parseFilesToModules(files, []);

      expect(modules).toHaveLength(1);
      expect(modules[0].title).toBe('Modulo 01');
      expect(modules[0].lessons).toHaveLength(2);

      // Aula 1: agrupou PT, EN e ES
      const lesson1 = modules[0].lessons[0];
      expect(lesson1.title).toBe('01 - Introducao');
      expect(lesson1.videoFiles).toHaveLength(3);
      expect(lesson1.videoFiles[0].language).toBe('pt');
      expect(lesson1.videoFiles[0].flag).toBe('🇧🇷');
      expect(lesson1.videoFiles[1].language).toBe('en');
      expect(lesson1.videoFiles[1].flag).toBe('🇺🇸');
      expect(lesson1.videoFiles[2].language).toBe('es');
      expect(lesson1.videoFiles[2].flag).toBe('🇪🇸');
      expect(lesson1.size).toBe(3300); // 1000 + 1200 + 1100

      // Aula 2: agrupou PT e EN
      const lesson2 = modules[0].lessons[1];
      expect(lesson2.title).toBe('02 - Signos');
      expect(lesson2.videoFiles).toHaveLength(2);
      expect(lesson2.videoFiles[0].language).toBe('pt');
      expect(lesson2.videoFiles[1].language).toBe('en');
      expect(lesson2.size).toBe(4100); // 2000 + 2100
    });
  });

  describe('triggerLessonAiTranscription', () => {
    it('dispara endpoint POST de transcrição com IA', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'processing' })
      });

      const success = await triggerLessonAiTranscription(1, 2, 789, 'https://video.url/1.mp4', 'fake_token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/2/lessons/789/transcribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer fake_token' }),
          body: JSON.stringify({ video_url: 'https://video.url/1.mp4' })
        })
      );
      expect(success).toBe(true);
    });
  });

  describe('uploadVideoWithProgress', () => {
    it('executa upload com Presigned URL e acompanha progresso', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          direct_upload: true,
          upload_url: 'https://b2.storage/presigned',
          video_url: 'https://b2.storage/video.mp4'
        })
      });

      const mockXHR = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn().mockImplementation(function () {
          if (this.upload && this.upload.onprogress) {
            this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
          }
          this.status = 200;
          this.onload();
        }),
        upload: {}
      };
      const originalXHR = global.XMLHttpRequest;
      global.XMLHttpRequest = function () {
        return mockXHR;
      };

      const progressCallback = vi.fn();
      const mockFile = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });

      const url = await uploadVideoWithProgress(mockFile, 'fake_token', progressCallback);

      expect(url).toBe('https://b2.storage/video.mp4');
      expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
        percent: 50,
        loadedBytes: 50,
        totalBytes: 100,
        loadedFormatted: '50.0 B',
        totalFormatted: '100.0 B'
      }));
      global.XMLHttpRequest = originalXHR;
    });

    it('permite abortar o upload ativo através de abortRef', async () => {
      const abortRef = { current: null };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          direct_upload: true,
          upload_url: 'https://b2.storage/presigned',
          video_url: 'https://b2.storage/video.mp4'
        })
      });

      const mockXHR = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn().mockImplementation(function () {
          // Dispara abortRef enquanto o envio está em andamento
          setTimeout(() => {
            if (abortRef.current) {
              abortRef.current();
            }
          }, 5);
        }),
        abort: vi.fn().mockImplementation(function () {
          if (this.onabort) {
            this.onabort();
          }
        }),
        upload: {}
      };
      const originalXHR = global.XMLHttpRequest;
      global.XMLHttpRequest = function () {
        return mockXHR;
      };

      const mockFile = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });
      const uploadPromise = uploadVideoWithProgress(mockFile, 'fake_token', vi.fn(), abortRef);

      await expect(uploadPromise).rejects.toThrow('UPLOAD_ABORTED');
      expect(mockXHR.abort).toHaveBeenCalled();
      global.XMLHttpRequest = originalXHR;
    });
  });
});


