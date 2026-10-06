import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import ChatMediaCardItem from './ChatMediaCardItem';

const FILTER_TABS = [
  { id: 'all', label: 'Todas', icon: FolderOpen },
  { id: 'image', label: 'Fotos', icon: ImageIcon },
  { id: 'video', label: 'Vídeos', icon: Video },
  { id: 'audio', label: 'Áudios', icon: Mic },
  { id: 'file', label: 'Documentos', icon: FileText },
];

export default function ChatMediaGalleryModal({
  isOpen,
  onClose,
  channel,
  onJumpToMessage,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Bloqueio do scroll do fundo quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchMedia = useCallback(async () => {
    if (!channel) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const params = new URLSearchParams();
      params.append('channel_type', channel.channel_type || channel.type || 'general');
      if (channel.course_id) {
        params.append('course_id', channel.course_id);
      }
      if (activeTab !== 'all') {
        params.append('media_type', activeTab);
      }
      params.append('limit', '80');

      const res = await fetch(`/api/v1/chat/media-gallery?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Erro ao buscar mídias do canal:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [channel, activeTab]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  const handleSelectMedia = (item) => {
    if (onJumpToMessage) {
      onJumpToMessage(item.id);
      onClose();
    }
  };

  const modalContent = (
    <div
      data-testid="chat-media-gallery-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                Mídias & Arquivos
                <span
                  data-testid="media-total-badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                  }}
                >
                  {total} {total === 1 ? 'item' : 'itens'}
                </span>
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Canal: <strong style={{ color: '#e2e8f0' }}>#{channel?.name || 'Comunidade'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-media-gallery-btn"
            title="Fechar galeria"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Filtro de Mídia */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: '#0a0f1d',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`media-tab-${tab.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Corpo com Grid de Itens */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: '#070b13',
            minHeight: '320px',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                color: '#94a3b8',
                gap: '12px',
              }}
            >
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#38bdf8' }} />
              <span style={{ fontSize: '0.85rem' }}>Carregando mídias do canal...</span>
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                color: '#64748b',
                gap: '10px',
                textAlign: 'center',
              }}
            >
              <FolderOpen size={44} style={{ opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>
                Nenhuma mídia encontrada nesta categoria.
              </p>
              <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                Imagens, vídeos, áudios e documentos enviados no chat aparecerão aqui.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              {items.map((item) => (
                <ChatMediaCardItem
                  key={item.id}
                  item={item}
                  onSelectMedia={handleSelectMedia}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
