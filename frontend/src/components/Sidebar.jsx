import React, { useState, useEffect } from 'react';
import {
  Database, Users, LogOut, Terminal, GraduationCap, AlertTriangle,
  Settings, UserCheck, Webhook, HelpCircle, X, MessagesSquare,
  MessageSquareQuote, Trophy, ExternalLink, GitBranch
} from 'lucide-react';
import { getLinkIcon, getLinkColor } from './platform-settings/linkIcons';

export default function Sidebar({
  activeTab = 'courses',
  onSelectTab,
  user,
  onLogout,
  pendingReportsCount = 0,
  chatUnreadCount = 0,
  bgColor = '#090d16',
  isMobileOpen = false,
  onCloseMobile
}) {
  const [platformLinks, setPlatformLinks] = useState([]);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAluno = user?.role === 'aluno';

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());

  useEffect(() => {
    let isMounted = true;
    const fetchLinks = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const res = await fetch('/api/v1/platform-links', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setPlatformLinks(data);
        }
      } catch (err) {
        console.error('Erro ao buscar links na barra lateral:', err);
      }
    };

    fetchLinks();

    const handleLinksUpdated = () => {
      fetchLinks();
    };
    window.addEventListener('platform_links_updated', handleLinksUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('platform_links_updated', handleLinksUpdated);
    };
  }, []);


  // Proposta 2: 3 Categorias Modernas (Mais compacta)
  // 1. ÁREA PEDAGÓGICA (ou MEU APRENDIZADO): Cursos, Alunos, Suporte, Relatos de Aulas
  // 2. COMUNIDADE & SOCIAL: Chat da Comunidade, Ranking & Conquistas, Depoimentos
  // 3. SISTEMA & CONFIGURAÇÕES: Configurações, Integrações, Gestão de Usuários, Backup Automático, Logs do Sistema
  const categories = [
    {
      id: 'pedagogica',
      title: isAluno ? 'Meu Aprendizado' : 'Área Pedagógica',
      items: [
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'courses', label: 'Cursos', icon: GraduationCap }]
          : []),
        ...(isSuperAdmin || isAdmin
          ? [{ id: 'students', label: 'Alunos', icon: UserCheck }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'support', label: 'Suporte', icon: HelpCircle }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [
              { id: 'lesson-reports', label: 'Relatos de Aulas', icon: AlertTriangle, badge: pendingReportsCount },
            ]
          : []),
      ],
    },
    {
      id: 'comunidade',
      title: 'Comunidade & Social',
      items: [
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'chat', label: 'Chat da Comunidade', icon: MessagesSquare, badge: chatUnreadCount }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'ranking', label: 'Ranking & Conquistas', icon: Trophy }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'testimonials', label: 'Depoimentos', icon: MessageSquareQuote }]
          : []),
        ...(isSuperAdmin || isAdmin
          ? [{ id: 'funnels', label: 'Funis de Mensagens', icon: GitBranch }]
          : []),
      ],
    },
    {
      id: 'sistema',
      title: 'Sistema & Configurações',
      items: [
        ...(isSuperAdmin || isAdmin || isAluno
          ? [
              { id: 'settings', label: 'Configurações', icon: Settings },
            ]
          : []),
        ...(isSuperAdmin || isAdmin
          ? [
              { id: 'integrations', label: 'Integrações', icon: Webhook },
            ]
          : []),
        ...(isSuperAdmin
          ? [
              { id: 'users', label: 'Gestão de Usuários', icon: Users },
              { id: 'backup', label: 'Backup Automático', icon: Database },
              { id: 'logs', label: 'Logs do Sistema', icon: Terminal },
            ]
          : []),
      ],
    },
  ];

  const handleSelect = (id) => {
    if (onSelectTab) {
      onSelectTab(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const userName = user?.name || 'Super Admin';
  const userEmail = user?.email || 'aryarajmarketing@gmail.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          data-testid="sidebar-backdrop"
          aria-label="Fechar navegação lateral"
        />
      )}
      <aside
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Menu Lateral"
        style={{
          backgroundColor: bgColor,
          borderRight: isLightBg ? '1px solid #eef0f3' : '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'background-color 0.3s ease, transform 0.3s ease'
        }}
      >
        <div className="sidebar-top">
          {/* Logo header com botão de fechar para mobile */}
          <div className="logo-container">
            <div className="logo-icon" data-testid="logo-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="logo-text" style={{ color: isLightBg ? '#0b192c' : '#ffffff' }}>
              Área de Membros
            </span>
            {onCloseMobile && (
              <button
                type="button"
                className="sidebar-close-btn"
                onClick={onCloseMobile}
                title="Fechar menu"
                aria-label="Fechar menu lateral"
                data-testid="sidebar-close-btn"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Categories */}
          <nav className="nav-menu">
            {categories.map((category) => {
              if (!category.items || category.items.length === 0) return null;
              return (
                <div
                  key={category.id}
                  className="nav-category-group"
                  data-testid={`nav-category-${category.id}`}
                >
                  <span className="nav-category-title" style={{ color: isLightBg ? '#94a3b8' : '#64748b' }}>
                    {category.title}
                  </span>
                  <div className="nav-category-items">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`nav-button ${isActive ? 'active' : ''}`}
                          onClick={() => handleSelect(item.id)}
                          data-testid={`nav-item-${item.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            backgroundColor: isActive
                              ? (isLightBg ? '#e0f2fe' : 'rgba(37, 99, 235, 0.2)')
                              : 'transparent',
                            color: isActive
                              ? (isLightBg ? '#0284c7' : '#38bdf8')
                              : (isLightBg ? '#64748b' : '#94a3b8')
                          }}
                        >
                          <Icon className="nav-icon" />
                          <span>{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '10px',
                                lineHeight: 1
                              }}
                              data-testid="pending-reports-badge"
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Categoria Links (Redes Sociais e Importantes) */}
            {platformLinks && platformLinks.length > 0 && (
              <div
                className="nav-category-group"
                data-testid="nav-category-links"
              >
                <span className="nav-category-title" style={{ color: isLightBg ? '#94a3b8' : '#64748b' }}>
                  Links
                </span>
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.color = isLightBg ? '#0284c7' : '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = isLightBg ? '#475569' : '#cbd5e1';
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
              </div>
            )}
          </nav>
        </div>

        {/* User profile footer with Logout */}
        <div
          className="sidebar-footer"
          style={{ borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div className="user-profile">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={userName}
                className="avatar"
                style={{ objectFit: 'cover', width: '36px', height: '36px', borderRadius: '8px' }}
                data-testid="user-avatar-img"
              />
            ) : (
              <div className="avatar" data-testid="user-avatar">{userInitial}</div>
            )}
            <div className="user-info">
              <span className="user-name" style={{ color: isLightBg ? '#0f172a' : '#f8fafc' }}>{userName}</span>
              <span className="user-email" style={{ color: isLightBg ? '#64748b' : '#94a3b8' }}>{userEmail}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="logout-button"
                title="Sair"
                data-testid="logout-btn"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
