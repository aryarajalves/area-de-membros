import React, { useState } from 'react';
import { MessageSquare, Globe, BookOpen, Search, Sparkles, ArrowLeft } from 'lucide-react';

export default function ChatSidebar({
  channels = [],
  selectedChannel,
  onSelectChannel,
  loading = false,
  onBack,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const generalChannel = channels.find((c) => c.type === 'general');
  const courseChannels = channels.filter((c) => c.type === 'course');

  const filteredCourseChannels = courseChannels.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className="chat-sidebar"
      data-testid="chat-channels-sidebar"
      style={{
        width: '300px',
        minWidth: '280px',
        backgroundColor: '#0b111e',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Botão Voltar para sair do modo de tela cheia do chat */}
      {onBack && (
        <div style={{ padding: '14px 16px 0' }}>
          <button
            type="button"
            onClick={onBack}
            data-testid="chat-back-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '9px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#f8fafc',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#f8fafc';
            }}
          >
            <ArrowLeft size={15} color="#60a5fa" />
            <span>Voltar aos Cursos</span>
          </button>
        </div>
      )}

      {/* Topo da barra de canais */}
      <div
        style={{
          padding: onBack ? '12px 16px 14px' : '20px 16px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <MessageSquare size={18} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Canais de Conversa
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Comunidade e Turmas
            </span>
          </div>
        </div>

        {/* Input de busca */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              color: '#64748b',
            }}
          />
          <input
            type="text"
            placeholder="Buscar canal ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="chat-channel-search-input"
            style={{
              width: '100%',
              backgroundColor: '#131b2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 12px 8px 32px',
              color: '#f8fafc',
              fontSize: '0.8125rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>

      {/* Lista de Canais */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Seção Canal Geral */}
        {generalChannel && (
          <div style={{ marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#64748b',
                letterSpacing: '0.05em',
                paddingLeft: '8px',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Principal
            </span>

            <button
              type="button"
              onClick={() => onSelectChannel(generalChannel)}
              data-testid="channel-item-general"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor:
                  selectedChannel?.id === generalChannel.id
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                border:
                  selectedChannel?.id === generalChannel.id
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor:
                    selectedChannel?.id === generalChannel.id
                      ? '#2563eb'
                      : 'rgba(59, 130, 246, 0.12)',
                  color:
                    selectedChannel?.id === generalChannel.id
                      ? '#ffffff'
                      : '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Globe size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: selectedChannel?.id === generalChannel.id ? 700 : 500,
                      color:
                        selectedChannel?.id === generalChannel.id
                          ? '#ffffff'
                          : '#e2e8f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {generalChannel.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {generalChannel.unread_count > 0 && (
                      <span
                        data-testid="unread-badge-general"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          lineHeight: 1.2,
                        }}
                      >
                        {generalChannel.unread_count}
                      </span>
                    )}
                    <Sparkles size={12} color="#fbbf24" />
                  </div>
                </div>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {generalChannel.last_message || 'Bate-papo geral dos alunos'}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Seção Canais por Curso */}
        <div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748b',
              letterSpacing: '0.05em',
              paddingLeft: '8px',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Canais por Curso ({courseChannels.length})
          </span>

          {loading && (
            <div style={{ padding: '16px 8px', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
              Carregando canais...
            </div>
          )}

          {!loading && filteredCourseChannels.length === 0 && (
            <div
              style={{
                padding: '16px 8px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.75rem',
                fontStyle: 'italic',
              }}
            >
              {searchTerm ? 'Nenhum canal encontrado' : 'Nenhum curso vinculado'}
            </div>
          )}

          {filteredCourseChannels.map((channel) => {
            const isSelected = selectedChannel?.id === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel)}
                data-testid={`channel-item-${channel.id}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: isSelected
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  border: isSelected
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  marginBottom: '3px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#60a5fa' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {channel.name}
                    </span>
                    {channel.unread_count > 0 && (
                      <span
                        data-testid={`unread-badge-${channel.id}`}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          lineHeight: 1.2,
                          marginLeft: '6px',
                          flexShrink: 0,
                        }}
                      >
                        {channel.unread_count}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {channel.last_message || 'Nenhuma mensagem recente'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
