import React, { useState, useRef, useEffect } from 'react';
import {
  Unlock,
  Lock,
  Calendar,
  MessageSquare,
  LifeBuoy,
  Globe,
  Mail,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

export const AVAILABLE_LOCKABLE_CHANNELS = [
  {
    id: 'course_chat',
    label: 'Chat Exclusivo deste Curso',
    subtitle: 'Canal dedicado da turma na aba Chat da Comunidade',
    icon: MessageSquare,
    color: '#38bdf8'
  },
  {
    id: 'support',
    label: 'Suporte & Relatos',
    subtitle: 'Fórum de Dúvidas e botão de Relatar Problema nas aulas',
    icon: LifeBuoy,
    color: '#a855f7'
  },
  {
    id: 'general_chat',
    label: 'Chat Geral da Comunidade',
    subtitle: 'Bate-papo aberto para os alunos da plataforma',
    icon: Globe,
    color: '#22c55e'
  },
  {
    id: 'dm',
    label: 'Mensagens Diretas (DMs)',
    subtitle: 'Conversas privadas 1 a 1 entre membros',
    icon: Mail,
    color: '#f59e0b'
  }
];

export default function CourseChannelLockSelector({
  channelReleaseType = 'immediate',
  setChannelReleaseType,
  channelReleaseDate = '',
  setChannelReleaseDate,
  lockedChannels = [],
  setLockedChannels,
  courseReleaseDate = '',
  isLightBg = false,
  textColor = '#f8fafc'
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (typeof setChannelReleaseType !== 'function') return null;

  const currentType = channelReleaseType || 'immediate';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const selectedIds = Array.isArray(lockedChannels) ? lockedChannels : [];

  const modeOptions = [
    {
      value: 'immediate',
      label: 'Canais Liberados',
      subtitle: 'Chats e suporte abertos normalmente',
      icon: Unlock,
      activeColor: '#22c55e',
      activeBg: 'rgba(34, 197, 94, 0.14)',
      activeBorder: 'rgba(34, 197, 94, 0.45)'
    },
    {
      value: 'closed',
      label: 'Bloquear Canais Agora',
      subtitle: 'Tranca apenas os canais escolhidos abaixo',
      icon: Lock,
      activeColor: '#ef4444',
      activeBg: 'rgba(239, 68, 68, 0.14)',
      activeBorder: 'rgba(239, 68, 68, 0.45)'
    },
    {
      value: 'specific_date',
      label: 'Liberar Canais em Data/Hora',
      subtitle: 'Tranca agora e abre na data programada',
      icon: Calendar,
      activeColor: '#f59e0b',
      activeBg: 'rgba(245, 158, 11, 0.14)',
      activeBorder: 'rgba(245, 158, 11, 0.45)'
    }
  ];

  const activeMode = modeOptions.find((m) => m.value === currentType) || modeOptions[0];

  const handleSelectMode = (nextMode) => {
    setChannelReleaseType(nextMode);
    if (
      (nextMode === 'closed' || nextMode === 'specific_date') &&
      selectedIds.length === 0 &&
      typeof setLockedChannels === 'function'
    ) {
      setLockedChannels(['course_chat', 'support']);
    }
  };

  const toggleChannel = (channelId) => {
    if (typeof setLockedChannels !== 'function') return;
    if (selectedIds.includes(channelId)) {
      setLockedChannels(selectedIds.filter((id) => id !== channelId));
    } else {
      setLockedChannels([...selectedIds, channelId]);
    }
  };

  const selectAllChannels = () => {
    if (typeof setLockedChannels === 'function') {
      setLockedChannels(AVAILABLE_LOCKABLE_CHANNELS.map((c) => c.id));
    }
  };

  const clearAllChannels = () => {
    if (typeof setLockedChannels === 'function') {
      setLockedChannels([]);
    }
  };

  return (
    <div
      data-testid="course-channel-lock-card"
      style={{
        padding: '13px 14px',
        marginTop: '10px',
        borderRadius: '10px',
        backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${activeMode.activeBorder}`,
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Bloqueio de Canais, Chats &amp; Suporte</span>
            <span
              data-testid="course-channel-lock-status-badge"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 8px',
                borderRadius: '999px',
                backgroundColor: activeMode.activeBg,
                color: activeMode.activeColor,
                border: `1px solid ${activeMode.activeBorder}`
              }}
            >
              {currentType === 'immediate' && 'Liberados'}
              {currentType === 'closed' && `Bloqueados (${selectedIds.length})`}
              {currentType === 'specific_date' && `Agendados (${selectedIds.length})`}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: subTextColor, marginTop: '2px' }}>
            Permite bloquear apenas os chats e o suporte/relatos (mesmo com as aulas liberadas) ou agendar a abertura deles.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        {modeOptions.map((opt) => {
          const IconComponent = opt.icon;
          const isSelected = currentType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`course-channel-option-${opt.value}`}
              onClick={() => handleSelectMode(opt.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
                padding: '9px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                backgroundColor: isSelected ? opt.activeBg : (isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.55)'),
                border: isSelected ? `1.5px solid ${opt.activeBorder}` : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                color: textColor,
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: isSelected ? opt.activeColor : textColor }}>
                <IconComponent size={14} />
                <span>{opt.label}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: subTextColor, lineHeight: 1.3 }}>{opt.subtitle}</span>
            </button>
          );
        })}
      </div>

      {currentType !== 'immediate' && (
        <div
          data-testid="course-channel-lock-config-area"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Multi-Select Dropdown de Canais Bloqueados */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Quais canais ficarão bloqueados? *
            </label>

            <button
              type="button"
              data-testid="course-locked-channels-dropdown-trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${activeMode.activeBorder}`,
                color: textColor,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              <span>
                {selectedIds.length === 0
                  ? 'Selecione os canais para bloquear...'
                  : `${selectedIds.length} canal(is) selecionado(s) para bloqueio`}
              </span>
              <ChevronDown size={15} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }} data-testid="course-locked-channels-pills">
                {selectedIds.map((id) => {
                  const ch = AVAILABLE_LOCKABLE_CHANNELS.find((item) => item.id === id);
                  if (!ch) return null;
                  return (
                    <span
                      key={id}
                      data-testid={`locked-channel-pill-${id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.35)'
                      }}
                    >
                      <Lock size={11} />
                      <span>{ch.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleChannel(id)}
                        data-testid={`remove-locked-channel-${id}`}
                        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {dropdownOpen && (
              <div
                data-testid="course-locked-channels-dropdown-menu"
                style={{
                  marginTop: '6px',
                  borderRadius: '10px',
                  backgroundColor: isLightBg ? '#ffffff' : '#0f172a',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
                  padding: '8px',
                  zIndex: 30
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '6px' }}>
                  <button
                    type="button"
                    data-testid="select-all-locked-channels-btn"
                    onClick={selectAllChannels}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    data-testid="clear-all-locked-channels-btn"
                    onClick={clearAllChannels}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    Limpar Seleção
                  </button>
                </div>

                {AVAILABLE_LOCKABLE_CHANNELS.map((ch) => {
                  const ChIcon = ch.icon;
                  const checked = selectedIds.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      role="option"
                      aria-selected={checked}
                      data-testid={`course-locked-channel-option-${ch.id}`}
                      onClick={() => toggleChannel(ch.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: checked ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                        marginBottom: '2px'
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: checked ? '1.5px solid #ef4444' : '1.5px solid #64748b',
                          backgroundColor: checked ? '#ef4444' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}
                      >
                        {checked && <Check size={11} />}
                      </div>
                      <ChIcon size={15} color={ch.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: textColor }}>{ch.label}</div>
                        <div style={{ fontSize: '10.5px', color: subTextColor }}>{ch.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {currentType === 'specific_date' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <label htmlFor="course-channel-release-datetime-input" style={{ fontSize: '12px', fontWeight: 600, color: textColor, margin: 0 }}>
                  Data e Hora de Liberação dos Canais *
                </label>
                {courseReleaseDate && setChannelReleaseDate && (
                  <button
                    type="button"
                    data-testid="copy-course-release-date-btn"
                    onClick={() => setChannelReleaseDate(courseReleaseDate)}
                    style={{
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fbbf24',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Usar mesma data das aulas
                  </button>
                )}
              </div>
              <input
                id="course-channel-release-datetime-input"
                type="datetime-local"
                data-testid="course-channel-release-datetime-input"
                value={channelReleaseDate || ''}
                onChange={(e) => setChannelReleaseDate && setChannelReleaseDate(e.target.value)}
                style={{
                  padding: '8px 11px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                  color: textColor,
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  colorScheme: isLightBg ? 'light' : 'dark'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
