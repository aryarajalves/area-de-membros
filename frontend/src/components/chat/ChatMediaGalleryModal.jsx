import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  ExternalLink,
  MessageSquare,
  Loader2,
  Calendar,
  User,
  FolderOpen,
  Play,
  Volume2,
} from 'lucide-react';

const FILTER_TABS = [
  { id: 'all', label: 'Todas', icon: FolderOpen },
  { id: 'image', label: 'Fotos', icon: ImageIcon },
  { id: 'video', label: 'Vídeos', icon: Video },
  { id: 'audio', label: 'Áudios', icon: Mic },
  { id: 'file', label: 'Documentos', icon: FileText },
];

function formatMediaDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} às ${hours}:${mins}`;
  } catch {
    return '';
  }
}

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
  const [selectedPreview, setSelectedPreview] = useState(null);

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
    } else {
      setSelectedPreview(null);
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  const handleSelectMedia = (item) => {
    if (onJumpToMessage) {
      onJumpToMessage(item.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="chat-media-gallery-modal"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          backgroundColor: '#0f172a',
          borderColor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: '#111827',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Mídias & Arquivos
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                  }}
                  data-testid="media-total-badge"
                >
                  {total} {total === 1 ? 'item' : 'itens'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Canal: <strong className="text-slate-200">#{channel?.name || 'Comunidade'}</strong>
              </p>
            </div>
          </div>

          {/* Único Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            data-testid="close-media-gallery-btn"
            title="Fechar galeria"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Filtro de Mídia */}
        <div
          className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0 overflow-x-auto"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            backgroundColor: '#0a0f1d',
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
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                style={
                  isActive
                    ? { backgroundColor: '#2563eb' }
                    : { border: '1px solid rgba(255, 255, 255, 0.05)' }
                }
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Corpo com Grid de Itens */}
        <div
          className="flex-1 p-6 overflow-y-auto"
          style={{
            backgroundColor: '#070b13',
            minHeight: '340px',
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="text-sm">Carregando mídias do canal...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
              <FolderOpen size={48} className="opacity-40" />
              <p className="text-sm font-medium">Nenhuma mídia encontrada nesta categoria.</p>
              <span className="text-xs text-slate-600">
                Imagens, vídeos, áudios e documentos enviados no chat aparecerão aqui.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`media-item-${item.id}`}
                  className="group relative flex flex-col rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-xl"
                  style={{
                    backgroundColor: '#111827',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Pré-visualização por Tipo */}
                  <div
                    className="relative w-full aspect-video sm:aspect-square overflow-hidden flex items-center justify-center bg-slate-900"
                  >
                    {item.media_type === 'image' && (
                      <img
                        src={item.media_url}
                        alt="Mídia"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    {item.media_type === 'video' && (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-blue-600/90 flex items-center justify-center text-white shadow-lg">
                            <Play size={18} fill="#ffffff" />
                          </div>
                        </div>
                      </div>
                    )}

                    {item.media_type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2 bg-gradient-to-br from-indigo-950 to-slate-900">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                          <Volume2 size={24} />
                        </div>
                        <span className="text-xs text-indigo-200 font-medium">Áudio gravado</span>
                      </div>
                    )}

                    {item.media_type === 'file' && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2 bg-gradient-to-br from-rose-950 to-slate-900">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                          <FileText size={24} />
                        </div>
                        <span className="text-xs text-rose-200 font-medium">Documento</span>
                      </div>
                    )}

                    {/* Botão de Ver no Chat ao passar o mouse */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => handleSelectMedia(item)}
                        data-testid={`jump-to-msg-btn-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg"
                      >
                        <MessageSquare size={13} />
                        <span>Ver no Chat</span>
                      </button>

                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium bg-white/10 text-slate-200 hover:bg-white/20 transition-colors"
                        title="Abrir arquivo em nova aba"
                      >
                        <ExternalLink size={12} />
                        <span>Abrir Link</span>
                      </a>
                    </div>
                  </div>

                  {/* Informações da Mensagem */}
                  <div className="p-2.5 flex flex-col gap-1 border-t border-white/5">
                    {item.message ? (
                      <p className="text-xs text-slate-200 truncate font-medium" title={item.message}>
                        {item.message}
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sem legenda</span>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="truncate max-w-[90px] text-slate-300">
                        {item.user?.name || 'Usuário'}
                      </span>
                      <span>{formatMediaDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
