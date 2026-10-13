import React, { useState, useEffect } from 'react';
import {
  Video, PlayCircle, Plus, Edit2, Trash2, Clock, CheckCircle2,
  AlertCircle, Sparkles, HelpCircle, Layers, ChevronRight
} from 'lucide-react';
import { fetchTutorialsApi, deleteTutorialApi } from './tutorialsApi';
import TutorialModal from './TutorialModal';
import '../../styles/home-tutorials.css';

function getEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function HomeTutorials({
  currentUser,
  addToast,
  onGoToCourses,
}) {
  const [tutorials, setTutorials] = useState([]);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [deletingTutorial, setDeletingTutorial] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const data = await fetchTutorialsApi(token);
      setTutorials(data);
      if (data.length > 0) {
        // Mantém tutorial selecionado ou pega o primeiro
        setActiveTutorial((prev) => {
          if (prev) {
            const found = data.find((t) => t.id === prev.id);
            if (found) return found;
          }
          return data[0];
        });
      } else {
        setActiveTutorial(null);
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao carregar tutoriais.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  const handleOpenCreate = () => {
    setEditingTutorial(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tut, e) => {
    e.stopPropagation();
    setEditingTutorial(tut);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (tut, e) => {
    e.stopPropagation();
    setDeletingTutorial(tut);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTutorial) return;
    setDeletingLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await deleteTutorialApi(deletingTutorial.id, token);
      if (addToast) addToast('Tutorial excluído com sucesso!', 'success');
      setDeletingTutorial(null);
      await loadTutorials();
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao excluir tutorial.', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const embedUrl = activeTutorial ? getEmbedUrl(activeTutorial.video_url) : null;

  return (
    <div className="home-tutorials-container" data-testid="home-tutorials-view">
      {/* Cabeçalho */}
      <div className="home-tutorials-header">
        <div className="home-tutorials-header-left">
          <div className="home-tutorials-icon-badge">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="home-tutorials-title">
              Início & Tutoriais da Plataforma
            </h1>
            <p className="home-tutorials-subtitle">
              Aprenda a navegar pela ferramenta e aproveitar todos os recursos da sua Área de Membros.
            </p>
          </div>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="primary-btn home-tutorials-create-btn"
            data-testid="create-tutorial-btn"
          >
            <Plus size={18} />
            <span>Nova Aula de Tutorial</span>
          </button>
        )}
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div className="spinner" style={{ marginRight: '10px' }} />
          <span>Carregando tutoriais...</span>
        </div>
      ) : tutorials.length === 0 ? (
        /* Estado Vazio */
        <div
          data-testid="home-tutorials-empty"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Video size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1.2rem' }}>
            Nenhum tutorial inicial publicado ainda
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
            {isManager
              ? 'Você pode fazer upload de vídeos de tutorial ensinando os alunos como navegar e usar a ferramenta.'
              : 'As aulas de tutorial estão sendo preparadas. Acesse seus cursos liberados para começar a estudar!'}
          </p>
          {isManager ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="primary-btn"
              data-testid="empty-create-tutorial-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              <span>Publicar 1º Tutorial</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoToCourses}
              className="primary-btn"
              data-testid="go-to-courses-btn"
            >
              Ir para os Cursos
            </button>
          )}
        </div>
      ) : (
        /* Layout: Player em Destaque + Playlist Lateral */
        <div className="home-tutorials-grid">
          {/* Coluna Esquerda: Player e Informações */}
          <div className="home-tutorials-main-col">
            {/* Player Container */}
            <div
              className="tutorial-player-wrapper"
              data-testid="tutorial-player-container"
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={activeTutorial?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="tutorial-iframe"
                />
              ) : activeTutorial?.video_url ? (
                <video
                  src={activeTutorial.video_url}
                  controls
                  data-testid="tutorial-video-tag"
                >
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
              ) : (
                <div className="tutorial-player-empty">
                  <span>Nenhum vídeo disponível para esta aula</span>
                </div>
              )}
            </div>

            {/* Informações da Aula Ativa */}
            {activeTutorial && (
              <div
                className="tutorial-active-info-card"
                data-testid="active-tutorial-info"
              >
                <div className="tutorial-info-header">
                  <h2 className="tutorial-info-title">
                    {activeTutorial.title}
                  </h2>
                  {activeTutorial.duration && (
                    <div className="tutorial-duration-badge">
                      <Clock size={13} />
                      <span>{activeTutorial.duration}</span>
                    </div>
                  )}
                </div>

                {activeTutorial.description && (
                  <p className="tutorial-info-desc">
                    {activeTutorial.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Coluna Direita: Playlist Lateral */}
          <div
            className="tutorials-playlist-card"
            data-testid="tutorials-playlist-card"
          >
            <div className="tutorials-playlist-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                  Aulas de Tutorial ({tutorials.length})
                </h3>
              </div>
            </div>

            <div className="tutorials-playlist-list">
              {tutorials.map((tut, index) => {
                const isActive = activeTutorial?.id === tut.id;
                return (
                  <div
                    key={tut.id}
                    onClick={() => setActiveTutorial(tut)}
                    data-testid={`playlist-item-${tut.id}`}
                    className={`tutorial-playlist-item ${isActive ? 'item-active' : ''}`}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#fff' : '#94a3b8',
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      {isActive ? <PlayCircle size={18} /> : index + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#60a5fa' : '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tut.title}
                      </div>
                      {tut.duration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                          <Clock size={11} />
                          <span>{tut.duration}</span>
                        </div>
                      )}
                    </div>

                    {isManager && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(tut, e)}
                          title="Editar tutorial"
                          data-testid={`edit-tutorial-btn-${tut.id}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDelete(tut, e)}
                          title="Excluir tutorial"
                          data-testid={`delete-tutorial-btn-${tut.id}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <TutorialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tutorial={editingTutorial}
        onSuccess={loadTutorials}
        addToast={addToast}
      />

      {/* Popup de Confirmação de Exclusão */}
      {deletingTutorial && (
        <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="delete-tutorial-modal">
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Excluir Aula de Tutorial?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px' }}>
              Tem certeza que deseja excluir o tutorial <strong>"{deletingTutorial.title}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingTutorial(null)}
                className="cancel-btn"
                disabled={deletingLoading}
                data-testid="cancel-delete-tutorial-btn"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="primary-btn"
                disabled={deletingLoading}
                data-testid="confirm-delete-tutorial-btn"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                {deletingLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
