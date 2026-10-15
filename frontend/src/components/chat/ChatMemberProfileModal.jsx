import React, { useEffect } from 'react';
import { X, Mail, Phone, Calendar, Shield, Crown, GraduationCap, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function ChatMemberProfileModal({
  isOpen,
  onClose,
  member,
  currentUser,
  onStartDm,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const isMe = currentUser && currentUser.id === member.id;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return {
          label: 'Super Admin',
          icon: Crown,
          color: '#c084fc',
          bg: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
        };
      case 'admin':
        return {
          label: 'Administrador',
          icon: Shield,
          color: '#60a5fa',
          bg: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
        };
      default:
        return {
          label: 'Aluno',
          icon: GraduationCap,
          color: '#34d399',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        };
    }
  };

  const roleMeta = getRoleBadge(member.role);
  const RoleIcon = roleMeta.icon;

  const formattedDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="chat-member-profile-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0b1120',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(59, 130, 246, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Faixa decorativa superior com gradiente */}
        <div
          style={{
            height: '90px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(139, 92, 246, 0.25) 50%, rgba(16, 185, 129, 0.15) 100%)',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="close-profile-modal-btn"
            aria-label="Fechar"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Corpo do perfil */}
        <div style={{ padding: '0 24px 24px', marginTop: '-44px' }}>
          {/* Avatar ampliado com indicador de status */}
          <div style={{ position: 'relative', width: '84px', height: '84px', marginBottom: '14px' }}>
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3.5px solid #0b1120',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  border: '3.5px solid #0b1120',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: roleMeta.color,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                }}
              >
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}

            {/* Ponto de status online */}
            <span
              title={member.is_online ? 'Online agora no chat' : 'Offline'}
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: member.is_online ? '#10b981' : '#64748b',
                border: '3px solid #0b1120',
                boxShadow: member.is_online ? '0 0 10px #10b981' : 'none',
              }}
            />
          </div>

          {/* Nome e Badge de papel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
              {member.name}
            </h3>
            {isMe && (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                (Você)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: roleMeta.color,
                backgroundColor: roleMeta.bg,
                border: roleMeta.border,
              }}
            >
              <RoleIcon size={12} />
              {roleMeta.label}
            </span>

            <span style={{ fontSize: '11.5px', color: member.is_online ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: member.is_online ? '#10b981' : '#64748b' }} />
              {member.is_online ? 'Online no chat' : 'Offline'}
            </span>
          </div>

          {/* Dados do Contato */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <Mail size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-all' }}>{member.email}</span>
            </div>

            {member.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <Phone size={15} color="#34d399" style={{ flexShrink: 0 }} />
                <span>{member.phone}</span>
              </div>
            )}

            {formattedDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#94a3b8' }}>
                <Calendar size={14} color="#a78bfa" style={{ flexShrink: 0 }} />
                <span>Membro desde {formattedDate}</span>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isMe && onStartDm && (
              <button
                type="button"
                onClick={() => {
                  onStartDm(member);
                  onClose();
                }}
                data-testid="start-dm-btn"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                <MessageSquare size={15} />
                <span>Conversar no Privado</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              data-testid="profile-modal-close-action-btn"
              style={{
                flex: isMe ? 1 : 'none',
                minWidth: isMe ? 'auto' : '90px',
                padding: '10px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
