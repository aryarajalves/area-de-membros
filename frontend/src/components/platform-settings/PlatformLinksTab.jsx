import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Link2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getLinkIcon, getLinkColor } from './linkIcons';
import PlatformLinkModal from './PlatformLinkModal';
import DeleteLinkConfirmModal from './DeleteLinkConfirmModal';

export default function PlatformLinksTab({ isLightBg, cardBg, cardBorder, textColor, subTextColor }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { addToast } = useToast();

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/platform-links?include_inactive=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLinks(Array.isArray(data) ? data : []);
      } else {
        addToast('Não foi possível carregar os links da plataforma.', 'error');
      }
    } catch (err) {
      console.error('Erro ao buscar links:', err);
      addToast('Erro ao conectar ao servidor para carregar links.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const notifyLinksUpdated = () => {
    window.dispatchEvent(new Event('platform_links_updated'));
  };

  const handleOpenCreateModal = () => {
    setSelectedLink(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (link) => {
    setSelectedLink(link);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (link) => {
    setLinkToDelete(link);
    setDeleteModalOpen(true);
  };

  const handleSaveLink = async (payload) => {
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const isEditing = !!selectedLink;
      const url = isEditing
        ? `/api/v1/platform-links/${selectedLink.id}`
        : '/api/v1/platform-links';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(
          isEditing
            ? 'Link atualizado com sucesso!'
            : 'Novo link adicionado à barra lateral!',
          'success'
        );
        setModalOpen(false);
        fetchLinks();
        notifyLinksUpdated();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Erro ao salvar o link.', 'error');
      }
    } catch (err) {
      console.error('Erro ao salvar link:', err);
      addToast('Erro de conexão ao salvar link.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (link) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/platform-links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !link.is_active }),
      });

      if (res.ok) {
        addToast(
          !link.is_active
            ? `Link "${link.title}" agora está visível na barra lateral.`
            : `Link "${link.title}" foi ocultado da barra lateral.`,
          'success'
        );
        fetchLinks();
        notifyLinksUpdated();
      } else {
        addToast('Erro ao alterar status do link.', 'error');
      }
    } catch (err) {
      console.error('Erro ao alternar status do link:', err);
      addToast('Erro de conexão ao alterar visibilidade.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    setActionLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/platform-links/${linkToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        addToast(`Link "${linkToDelete.title}" excluído com sucesso!`, 'success');
        setDeleteModalOpen(false);
        setLinkToDelete(null);
        fetchLinks();
        notifyLinksUpdated();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Erro ao excluir o link.', 'error');
      }
    } catch (err) {
      console.error('Erro ao excluir link:', err);
      addToast('Erro de conexão ao excluir link.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} data-testid="platform-links-tab">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={20} color="#38bdf8" />
            Links da Barra Lateral
          </h2>
          <p style={{ fontSize: '13px', color: subTextColor, margin: 0, maxWidth: '640px', lineHeight: 1.4 }}>
            Cadastre links de redes sociais (Instagram, YouTube, WhatsApp, Telegram, etc.) e páginas externas para exibição na seção <strong>"Links"</strong> na parte de baixo da barra lateral de todos os membros.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={{
            padding: '10px 18px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13.5px',
            borderRadius: '10px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.2s ease',
          }}
          data-testid="create-new-link-btn"
        >
          <Plus size={17} />
          Adicionar Novo Link
        </button>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: subTextColor }}>
          <Loader2 size={32} className="spin-animation" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13.5px' }}>Carregando links da plataforma...</p>
        </div>
      ) : links.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            border: '1px dashed rgba(255, 255, 255, 0.14)',
            borderRadius: '16px',
            backgroundColor: cardBg,
          }}
          data-testid="empty-links-state"
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            <Link2 size={28} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
            Nenhum link cadastrado ainda
          </h3>
          <p style={{ fontSize: '13px', color: subTextColor, maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Clique no botão acima para adicionar suas redes sociais e links importantes para os membros acessarem rapidamente pelo menu.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              padding: '9px 18px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={15} />
            Criar Primeiro Link
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
          data-testid="platform-links-grid"
        >
          {links.map((link) => {
            const IconComp = getLinkIcon(link.icon);
            const iconColor = getLinkColor(link.icon);

            return (
              <div
                key={link.id}
                style={{
                  backgroundColor: cardBg,
                  border: cardBorder,
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: isLightBg ? '0 4px 12px rgba(0,0,0,0.03)' : '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                data-testid={`link-card-${link.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${iconColor}18`,
                      color: iconColor,
                      border: `1px solid ${iconColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={22} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: textColor,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={link.title}
                      >
                        {link.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: link.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                          color: link.is_active ? '#34d399' : '#94a3b8',
                          border: link.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                          flexShrink: 0,
                        }}
                        data-testid={`link-status-${link.id}`}
                      >
                        {link.is_active ? 'Ativo' : 'Oculto'}
                      </span>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        color: '#38bdf8',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={link.url}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.url}
                      </span>
                      <ExternalLink size={11} style={{ flexShrink: 0, opacity: 0.8 }} />
                    </a>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(link)}
                    title={link.is_active ? 'Ocultar da barra lateral' : 'Ativar na barra lateral'}
                    style={{
                      padding: '7px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: link.is_active ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`toggle-status-link-btn-${link.id}`}
                  >
                    {link.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(link)}
                    title="Editar link"
                    style={{
                      padding: '7px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`edit-link-btn-${link.id}`}
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(link)}
                    title="Excluir link"
                    style={{
                      padding: '7px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`delete-link-btn-${link.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <PlatformLinkModal
        isOpen={modalOpen}
        initialData={selectedLink}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveLink}
        loading={actionLoading}
      />

      <DeleteLinkConfirmModal
        isOpen={deleteModalOpen}
        linkTitle={linkToDelete?.title || ''}
        onClose={() => {
          setDeleteModalOpen(false);
          setLinkToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
}
