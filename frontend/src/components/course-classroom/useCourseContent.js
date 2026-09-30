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
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
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

  const uploadLessonVideo = async (file) => {
    if (!file) return null;
    if (file.size > 2048 * 1024 * 1024) {
      addToast('O vídeo excede o tamanho máximo de 2 GB.', 'error');
      return null;
    }

    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/courses/upload-video', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        addToast('Upload de vídeo concluído!', 'success');
        return data.video_url;
      } else {
        let errMessage = 'Erro ao enviar vídeo.';
        try {
          const err = await res.json();
          errMessage = err.detail || errMessage;
        } catch {
          errMessage = `Erro no envio do vídeo (Status ${res.status}).`;
        }
        throw new Error(errMessage);
      }
    } catch (err) {
      addToast(err.message || 'Falha no upload do vídeo.', 'error');
      return null;
    }
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
