import React from 'react';
import { HelpCircle, AlertTriangle, Server, Database, Terminal, ChevronDown, ExternalLink } from 'lucide-react';
import { getLinkIcon, getLinkColor } from '../platform-settings/linkIcons';

export function SupportReportsSubTabs({ activeTab, onSelectTab, pendingReportsCount = 0, isLightBg = false }) {
  const tabs = [
    {
      id: 'support',
      label: 'Comunidade de Suporte & Dúvidas',
      icon: HelpCircle,
    },
    {
      id: 'lesson-reports',
      label: 'Relatos de Aulas',
      icon: AlertTriangle,
      badge: pendingReportsCount,
    },
  ];

  return (
    <div
      data-testid="support-reports-subtabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '16px 32px 0',
        maxWidth: '1240px',
        margin: '0 auto',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            data-testid={`unified-subtab-${tab.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 18px',
              borderRadius: '11px',
              border: isActive
                ? '1px solid rgba(56, 189, 248, 0.55)'
                : isLightBg
                  ? '1px solid #e2e8f0'
                  : '1px solid rgba(255, 255, 255, 0.09)',
              background: isActive
                ? isLightBg
                  ? '#e0f2fe'
                  : 'rgba(37, 99, 235, 0.22)'
                : isLightBg
                  ? '#ffffff'
                  : 'rgba(15, 23, 42, 0.65)',
              color: isActive
                ? isLightBg
                  ? '#0284c7'
                  : '#38bdf8'
                : isLightBg
                  ? '#64748b'
                  : '#94a3b8',
              fontWeight: isActive ? 700 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: isActive ? '0 0 16px rgba(37, 99, 235, 0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                data-testid="subtab-pending-reports-badge"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  lineHeight: 1,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ServerSystemSubTabs({ activeTab, onSelectTab, isLightBg = false }) {
  const tabs = [
    {
      id: 'infrastructure',
      label: 'Infraestrutura & Recursos',
      icon: Server,
    },
    {
      id: 'backup',
      label: 'Backup Automático (S3)',
      icon: Database,
    },
    {
      id: 'logs',
      label: 'Logs do Sistema',
      icon: Terminal,
    },
  ];

  return (
    <div
      data-testid="server-system-subtabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '18px 32px 0',
        maxWidth: '1240px',
        margin: '0 auto',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            data-testid={`unified-subtab-${tab.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 18px',
              borderRadius: '11px',
              border: isActive
                ? '1px solid rgba(56, 189, 248, 0.55)'
                : isLightBg
                  ? '1px solid #e2e8f0'
                  : '1px solid rgba(255, 255, 255, 0.09)',
              background: isActive
                ? isLightBg
                  ? '#e0f2fe'
                  : 'rgba(37, 99, 235, 0.22)'
                : isLightBg
                  ? '#ffffff'
                  : 'rgba(15, 23, 42, 0.65)',
              color: isActive
                ? isLightBg
                  ? '#0284c7'
                  : '#38bdf8'
                : isLightBg
                  ? '#64748b'
                  : '#94a3b8',
              fontWeight: isActive ? 700 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: isActive ? '0 0 16px rgba(37, 99, 235, 0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SidebarLinksGroup({ platformLinks, isLightBg, isCollapsed, onToggle }) {
  if (!platformLinks || platformLinks.length === 0) return null;

  return (
    <div className="nav-category-group" data-testid="nav-category-links">
      <button
        type="button"
        className="nav-category-header-btn"
        onClick={onToggle}
        data-testid="nav-category-toggle-links"
        aria-expanded={!isCollapsed}
        style={{ color: isLightBg ? '#94a3b8' : '#64748b' }}
      >
        <span className="nav-category-title" style={{ padding: 0 }}>Links</span>
        <ChevronDown
          size={13}
          className={`nav-category-chevron ${isCollapsed ? 'collapsed' : ''}`}
        />
      </button>

      {!isCollapsed && (
        <div className="nav-category-items">
          {platformLinks.map((link) => {
            const LinkIconComp = getLinkIcon(link.icon);
            const linkIconColor = getLinkColor(link.icon);

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-button"
                data-testid={`sidebar-link-${link.id}`}
                title={`Abrir ${link.title} em nova aba`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textDecoration: 'none',
                  backgroundColor: 'transparent',
                  color: isLightBg ? '#475569' : '#cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    color: linkIconColor,
                    flexShrink: 0,
                  }}
                >
                  <LinkIconComp size={16} />
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {link.title}
                </span>
                <ExternalLink
                  size={12}
                  style={{
                    marginLeft: 'auto',
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RestrictedWelcomeScreen({ user }) {
  return (
    <div className="restricted-access-container user-welcome-container" data-testid="restricted-access-screen">
      <div className="restricted-card user-welcome-card">
        <div className="user-welcome-icon-box">
          <div className="welcome-avatar-badge" data-testid="welcome-avatar-badge">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
        <h2>Olá, {user?.name || 'Usuário'}!</h2>
        <p className="welcome-subtext">
          Bem-vindo à <strong>Área de Membros</strong>. Sua conta está ativa e pronta para uso.
        </p>

        <div className="welcome-info-grid">
          <div className="welcome-info-item">
            <span className="info-item-label">E-mail</span>
            <span className="info-item-value">{user?.email || '—'}</span>
          </div>
          <div className="welcome-info-item">
            <span className="info-item-label">Status</span>
            <span className="info-item-badge status-active">
              <span className="status-dot"></span> Ativo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

