import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Search, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CourseClassroom from './course-classroom/CourseClassroom';
import CourseCard from './course-management/CourseCard';
import { CourseFormModal, CourseDeleteModal } from './course-management/CourseModals';

const ITEMS_PER_PAGE = 20;

export default function CourseManagement({ currentUser, onCourseViewChange, bgColor: propBgColor = '#090d16', onThemeColorChange, onNavigateTab }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [initialTargetLesson, setInitialTargetLesson] = useState(null);

  useEffect(() => {
    const handleOpenCourseLesson = (e) => {
      const { courseId, moduleId, lessonId } = e.detail || {};
      if (!courseId) return;

      setInitialTargetLesson({ moduleId, lessonId });
      setSelectedCourse((prev) => {
        if (prev?.id === Number(courseId)) return prev;
        const found = courses.find((c) => c.id === Number(courseId));
        return found || { id: Number(courseId) };
      });
    };

    window.addEventListener('open_course_lesson', handleOpenCourseLesson);
    return () => {
      window.removeEventListener('open_course_lesson', handleOpenCourseLesson);
    };
  }, [courses]);

  useEffect(() => {
    if (onCourseViewChange) {
      onCourseViewChange(Boolean(selectedCourse));
    }
    return () => {
      if (onCourseViewChange) onCourseViewChange(false);
    };
  }, [selectedCourse, onCourseViewChange]);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [salesPageUrl, setSalesPageUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [agentflowKbId, setAgentflowKbId] = useState(null);
  const [agentflowKbName, setAgentflowKbName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const activeBgColor = (courses[0]?.bg_color && propBgColor === '#090d16' ? courses[0].bg_color : propBgColor) || '#090d16';

  const fetchCourses = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        if (data.length > 0 && data[0].bg_color && onThemeColorChange) {
          onThemeColorChange(data[0].bg_color);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || (res.status >= 500 ? 'O servidor está iniciando. Aguarde instantes e tente novamente.' : 'Erro ao carregar cursos.'));
      }
    } catch (err) {
      addToast(err.message || 'Erro ao conectar à API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setCoverImageUrl('');
    setSalesPageUrl('');
    setOrderIndex(0);
    setAgentflowKbId(null);
    setAgentflowKbName(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description || '');
    setThumbnailUrl(course.thumbnail_url || '');
    setCoverImageUrl(course.cover_image_url || '');
    setSalesPageUrl(course.sales_page_url || '');
    setOrderIndex(course.order_index ?? 0);
    setAgentflowKbId(course.agentflow_kb_id || null);
    setAgentflowKbName(course.agentflow_kb_name || null);
    setModalOpen(true);
  };

  const handleUploadImageField = async (e, setter, successMsg) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('A imagem excede o limite máximo permitido de 5 MB.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/courses/upload-thumbnail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setter(data.thumbnail_url);
        addToast(successMsg, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro no envio da imagem (Status ${res.status}).`);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao fazer upload da imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadThumbnail = (e) =>
    handleUploadImageField(
      e,
      (url) => {
        setThumbnailUrl(url);
        if (!coverImageUrl) setCoverImageUrl(url);
      },
      'Thumbnail carregada com sucesso!'
    );

  const handleUploadCoverImage = (e) =>
    handleUploadImageField(
      e,
      (url) => {
        setCoverImageUrl(url);
        if (!thumbnailUrl) setThumbnailUrl(url);
      },
      'Banner Hero carregado com sucesso!'
    );

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('O título do curso é obrigatório.', 'error');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('auth_token');
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      sales_page_url: salesPageUrl.trim() || null,
      order_index: parseInt(orderIndex, 10) || 0,
      agentflow_kb_id: agentflowKbId,
      agentflow_kb_name: agentflowKbName,
      bg_color: activeBgColor
    };

    try {
      const url = editingCourse ? `/api/v1/courses/${editingCourse.id}` : '/api/v1/courses';
      const method = editingCourse ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(editingCourse ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!', 'success');
        setModalOpen(false);
        fetchCourses();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar curso.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar curso.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePromptDelete = (course) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Curso excluído com sucesso!', 'success');
        setDeleteModalOpen(false);
        setCourseToDelete(null);
        fetchCourses();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao excluir curso.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir curso.', 'error');
    }
  };

  // Se um curso estiver selecionado para visualização/conteúdo
  if (selectedCourse) {
    return (
      <CourseClassroom
        course={{ ...selectedCourse, bg_color: activeBgColor }}
        currentUser={currentUser}
        initialModuleId={initialTargetLesson?.moduleId}
        initialLessonId={initialTargetLesson?.lessonId}
        onBack={() => {
          setSelectedCourse(null);
          setInitialTargetLesson(null);
          fetchCourses();
        }}
      />
    );
  }

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes(activeBgColor.toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  return (
    <div
      className={`backup-page-container ${!isLightBg ? 'classroom-dark-theme' : ''}`}
      data-testid="courses-page"
      style={{ backgroundColor: activeBgColor, color: textColor, minHeight: '100vh', width: '100%', maxWidth: '100%', margin: 0, padding: '28px 32px', boxSizing: 'border-box', transition: 'background-color 0.3s ease' }}
    >
      {/* Cabeçalho com o botão de Criar Curso à direita */}
      <div className="backup-page-header courses-header-box" style={{ backgroundColor: cardBg, border: cardBorder }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ backgroundColor: '#2563eb' }}>
              <GraduationCap size={18} />
            </div>
            <h1 style={{ color: textColor }}>Cursos da Plataforma</h1>
          </div>
          <p style={{ color: subTextColor }}>Acesse os cursos, módulos e aulas disponíveis para os alunos.</p>
        </div>

        {isManager && (
          <button
            type="button"
            className="primary-btn"
            onClick={handleOpenCreateModal}
            data-testid="create-course-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          >
            <Plus size={18} />
            <span>Criar Curso</span>
          </button>
        )}
      </div>

      {/* Barra de Filtro / Busca */}
      <div className="table-card" style={{ marginBottom: '20px', backgroundColor: cardBg, border: cardBorder }}>
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px', backgroundColor: 'transparent', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
            <Search size={16} color={subTextColor} />
            <input
              type="text"
              placeholder="Buscar curso por título ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control-modern"
              style={{ padding: '8px 12px', fontSize: '13px', backgroundColor: isLightBg ? '#fff' : 'rgba(15, 23, 42, 0.65)', color: textColor, border: cardBorder }}
              data-testid="search-courses-input"
            />
          </div>
          <span style={{ fontSize: '13px', color: subTextColor }}>
            {filteredCourses.length} curso(s) cadastrado(s)
          </span>
        </div>
      </div>

      {/* Grid de Cursos (Cards modernos) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>
          Carregando cursos...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="table-card" style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor, backgroundColor: cardBg, border: cardBorder }}>
          <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '17px', color: textColor, marginBottom: '8px' }}>Nenhum curso disponível</h3>
          <p style={{ fontSize: '13.5px', maxWidth: '420px', margin: '0 auto', color: subTextColor }}>
            {isManager
              ? 'Clique no botão "Criar Curso" no topo à direita para publicar seu primeiro treinamento.'
              : 'Nenhum curso foi liberado para sua conta no momento.'}
          </p>
        </div>
      ) : (
        <>
          <div className="courses-grid" data-testid="courses-grid">
            {paginatedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isManager={isManager}
                isLightBg={isLightBg}
                textColor={textColor}
                subTextColor={subTextColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                onSelectCourse={setSelectedCourse}
                onOpenEditModal={handleOpenEditModal}
                onPromptDelete={handlePromptDelete}
                onShowInfoToast={(msg) => addToast(msg, 'info')}
              />
            ))}
          </div>

          {/* Barra de Paginação (20 cursos por página) */}
          <div className="table-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', marginTop: '20px', flexWrap: 'wrap', gap: '12px', backgroundColor: cardBg, border: cardBorder }} data-testid="courses-pagination">
            <span style={{ fontSize: '13px', color: subTextColor }}>
              Exibindo {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredCourses.length)} de {filteredCourses.length} cursos
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                data-testid="prev-page-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12.5px', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </button>

              <span style={{ fontSize: '13px', fontWeight: 600, color: textColor, padding: '0 8px' }}>
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                className="secondary-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                data-testid="next-page-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12.5px', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                <span>Próxima</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Criação / Edição de Curso */}
      <CourseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingCourse={editingCourse}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        thumbnailUrl={thumbnailUrl}
        setThumbnailUrl={setThumbnailUrl}
        coverImageUrl={coverImageUrl}
        setCoverImageUrl={setCoverImageUrl}
        salesPageUrl={salesPageUrl}
        setSalesPageUrl={setSalesPageUrl}
        orderIndex={orderIndex}
        setOrderIndex={setOrderIndex}
        agentflowKbId={agentflowKbId}
        setAgentflowKbId={setAgentflowKbId}
        agentflowKbName={agentflowKbName}
        setAgentflowKbName={setAgentflowKbName}
        bgColor={activeBgColor}
        uploading={uploading}
        saving={saving}
        onUploadThumbnail={handleUploadThumbnail}
        onUploadCoverImage={handleUploadCoverImage}
        onSaveCourse={handleSaveCourse}
      />

      {/* Modal de Confirmação de Exclusão de Curso */}
      <CourseDeleteModal
        isOpen={deleteModalOpen}
        courseToDelete={courseToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        bgColor={activeBgColor}
      />
    </div>
  );
}

