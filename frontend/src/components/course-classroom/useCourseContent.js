import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';

export function useCourseContent(courseId) {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const { addToast } = useToast();

  const fetchCourseProgress = useCallback(async () => {
    if (!courseId) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/progress`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedLessonIds(data.completed_lesson_ids || []);
      }
    } catch {
      // Ignora erro silenciosamente para não quebrar a tela de curso
    }
  }, [courseId]);

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        const mods = data.modules || [];
        setModules(mods);

        // Se nenhuma aula estiver selecionada, seleciona a primeira aula do primeiro módulo
        if (!activeLesson && mods.length > 0) {
          const firstModWithLessons = mods.find(m => m.lessons && m.lessons.length > 0);
          if (firstModWithLessons) {
            setActiveLesson(firstModWithLessons.lessons[0]);
          }
        }
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao carregar detalhes do curso.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao conectar à API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [courseId, addToast]);

  useEffect(() => {
    fetchCourseData();
    fetchCourseProgress();
  }, [fetchCourseData, fetchCourseProgress]);

  // --- CRUD MÓDULOS ---
  const handleSaveModule = async (editingModuleId, payload) => {
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const url = editingModuleId
        ? `/api/v1/courses/${courseId}/modules/${editingModuleId}`
        : `/api/v1/courses/${courseId}/modules`;
      const method = editingModuleId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(editingModuleId ? 'Módulo atualizado com sucesso!' : 'Módulo criado com sucesso!', 'success');
        await fetchCourseData();
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao salvar módulo.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar módulo.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        addToast('Módulo excluído com sucesso!', 'success');
        if (activeLesson && modules.find(m => m.id === moduleId)?.lessons?.some(l => l.id === activeLesson.id)) {
          setActiveLesson(null);
        }
        await fetchCourseData();
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao excluir módulo.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir módulo.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // --- CRUD AULAS ---
  const handleSaveLesson = async (moduleId, editingLessonId, payload) => {
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const { quiz_questions, ...lessonPayload } = payload;
      const url = editingLessonId
        ? `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${editingLessonId}`
        : `/api/v1/courses/${courseId}/modules/${moduleId}/lessons`;
      const method = editingLessonId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(lessonPayload)
      });

      if (res.ok) {
        const saved = await res.json();

        // Se for quiz e tiver perguntas fornecidas, salva o conjunto de perguntas
        if (payload.content_type === 'quiz' && Array.isArray(quiz_questions)) {
          const targetLessonId = saved.id || editingLessonId;
          await fetch(`/api/v1/courses/${courseId}/lessons/${targetLessonId}/quiz`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              questions: quiz_questions,
              passing_score_pct: payload.passing_score_pct !== undefined ? payload.passing_score_pct : 70
            })
          });
        }

        addToast(editingLessonId ? 'Aula atualizada com sucesso!' : 'Aula criada com sucesso!', 'success');
        await fetchCourseData();
        setActiveLesson(saved);
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao salvar aula.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar aula.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        addToast('Aula excluída com sucesso!', 'success');
        if (activeLesson?.id === lessonId) {
          setActiveLesson(null);
        }
        await fetchCourseData();
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao excluir aula.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir aula.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const uploadLessonVideo = async (file, onProgress) => {
    if (!file) return null;
    if (file.size > 2048 * 1024 * 1024) {
      addToast('O vídeo excede o tamanho máximo de 2 GB.', 'error');
      return null;
    }

    const token = localStorage.getItem('auth_token');

    // 1. Tentar obter Presigned URL para upload direto ao Backblaze S3
    try {
      const presignedRes = await fetch('/api/v1/courses/generate-video-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'video/mp4'
        })
      });

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json();
        const targetVideoUrl = presignedData.video_url || presignedData.final_url;
        if (presignedData.direct_upload && presignedData.upload_url && targetVideoUrl) {
          // Upload direto com XHR para acompanhar progresso real de 0% a 100%
          return await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedData.upload_url);
            xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

            if (xhr.upload && onProgress) {
              xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                  const percent = Math.round((evt.loaded / evt.total) * 100);
                  onProgress(percent);
                }
              };
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                addToast('Upload de vídeo concluído com sucesso!', 'success');
                resolve(targetVideoUrl);
              } else {
                reject(new Error(`Falha no upload direto ao storage (Status ${xhr.status})`));
              }
            };

            xhr.onerror = () => reject(new Error('Erro de conexão durante o upload direto.'));
            xhr.send(file);
          });
        }
      }
    } catch (directErr) {
      console.warn('Upload direto não disponível ou falhou, usando upload padrão:', directErr);
    }

    // 2. Fallback: Upload tradicional através do Backend com monitoramento de progresso
    const formData = new FormData();
    formData.append('file', file);

    return await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/v1/courses/upload-video');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            addToast('Upload de vídeo concluído!', 'success');
            resolve(data.video_url);
          } catch (e) {
            resolve(null);
          }
        } else {
          let errMessage = 'Erro ao enviar vídeo.';
          try {
            const err = JSON.parse(xhr.responseText);
            errMessage = err.detail || errMessage;
          } catch {
            errMessage = `Erro no envio do vídeo (Status ${xhr.status}).`;
          }
          addToast(errMessage, 'error');
          resolve(null);
        }
      };

      xhr.onerror = () => {
        addToast('Falha na comunicação ao enviar vídeo.', 'error');
        resolve(null);
      };

      xhr.send(formData);
    });
  };

  const uploadLessonThumbnail = async (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) {
      addToast('A imagem da capa deve ter no máximo 5 MB.', 'error');
      return null;
    }

    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/courses/upload-thumbnail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        addToast('Upload da capa concluído!', 'success');
        return data.thumbnail_url;
      } else {
        let errMessage = 'Erro ao enviar capa.';
        try {
          const err = await res.json();
          errMessage = err.detail || errMessage;
        } catch {
          errMessage = `Erro no envio da capa (Status ${res.status}).`;
        }
        throw new Error(errMessage);
      }
    } catch (err) {
      addToast(err.message || 'Falha no upload da capa.', 'error');
      return null;
    }
  };

  const handleToggleLessonComplete = (lessonId, isCompleted) => {
    setCompletedLessonIds((prev) => {
      if (isCompleted) {
        return prev.includes(lessonId) ? prev : [...prev, lessonId];
      } else {
        return prev.filter((id) => id !== lessonId);
      }
    });
  };

  // Navegação entre aulas
  const allLessons = modules.flatMap(m => m.lessons || []);
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return {
    course,
    modules,
    activeLesson,
    setActiveLesson,
    loading,
    actionLoading,
    completedLessonIds,
    handleToggleLessonComplete,
    fetchCourseProgress,
    fetchCourseData,
    handleSaveModule,
    handleDeleteModule,
    handleSaveLesson,
    handleDeleteLesson,
    uploadLessonVideo,
    uploadLessonThumbnail,
    prevLesson,
    nextLesson,
    totalLessonsCount: allLessons.length
  };
}
