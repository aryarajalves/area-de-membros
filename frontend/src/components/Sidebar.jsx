import React, { useState, useEffect } from 'react';
import {
  Users, LogOut, GraduationCap, Settings, UserCheck, Webhook,
  HelpCircle, X, MessagesSquare, MessageSquareQuote, Trophy,
  GitBranch, Home, Handshake, Server, Calendar, ChevronDown
} from 'lucide-react';
import { SidebarLinksGroup } from './navigation/UnifiedSectionSubTabs';

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
  const [platformName, setPlatformName] = useState(() => localStorage.getItem('platform_name') || 'Área de Membros');
  const [platformLogo, setPlatformLogo] = useState(() => localStorage.getItem('platform_logo') || null);
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed_categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAluno = user?.role === 'aluno';

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());

  const toggleCategory = (catId) => {
    setCollapsedCategories((prev) => {
      const next = { ...prev, [catId]: !prev[catId] };
      try {
        localStorage.setItem('sidebar_collapsed_categories', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

    const fetchWhiteLabel = async () => {
      try {
        const res = await fetch('/api/v1/whitelabel');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.platform_name) {
            setPlatformName(data.platform_name);
            localStorage.setItem('platform_name', data.platform_name);
          }
          if (data?.logo_url !== undefined) {
            setPlatformLogo(data.logo_url || null);
            if (data.logo_url) {
              localStorage.setItem('platform_logo', data.logo_url);
            } else {
              localStorage.removeItem('platform_logo');
            }
          }
        }
      } catch {
        // silencioso
      }
    };

    fetchLinks();
    fetchWhiteLabel();

    const handleLinksUpdated = () => fetchLinks();
    const handleWhiteLabelUpdated = (e) => {
      if (e?.detail?.platform_name) {
        setPlatformName(e.detail.platform_name);
      }
      if (e?.detail?.logo_url !== undefined) {
        setPlatformLogo(e.detail.logo_url || null);
        if (e.detail.logo_url) {
          localStorage.setItem('platform_logo', e.detail.logo_url);
        } else {
          localStorage.removeItem('platform_logo');
        }
      }
    };

    window.addEventListener('platform_links_updated', handleLinksUpdated);
    window.addEventListener('whitelabel_updated', handleWhiteLabelUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('platform_links_updated', handleLinksUpdated);
      window.removeEventListener('whitelabel_updated', handleWhiteLabelUpdated);
    };
  }, []);

  const categories = [
    {
      id: 'pedagogica',
      title: isAluno ? 'Meu Aprendizado' : 'Área Pedagógica',
      items: [
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'home', label: 'Início', icon: Home }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'courses', label: 'Cursos', icon: GraduationCap }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'events', label: 'Eventos', icon: Calendar }]
          : []),
        ...(isSuperAdmin || isAdmin || isAluno
          ? [
              {
                id: 'support',
                matchIds: ['support', 'lesson-reports'],
                label: 'Suporte & Relatos',
                icon: HelpCircle,
                badge: pendingReportsCount,
              },
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
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'introductions', label: 'Apresente-se', icon: Handshake }]
          : []),
      ],
    },
    {
      id: 'gestao',
      title: 'Gestão & Automação',
      items: [
        ...(isSuperAdmin || isAdmin
          ? [
              { id: 'students', label: 'Alunos', icon: UserCheck },
              { id: 'users', label: 'Gestão de Usuários', icon: Users },
              { id: 'funnels', label: 'Funis de Mensagens', icon: GitBranch },
              { id: 'integrations', label: 'Integrações', icon: Webhook },
            ]
          : []),
      ],
    },
    {
      id: 'sistema',
      title: 'Sistema & Configurações',
      items: [
        ...(isSuperAdmin || isAdmin || isAluno
          ? [{ id: 'settings', label: 'Configurações', icon: Settings }]
          : []),
        ...(isSuperAdmin
          ? [
              {
                id: 'infrastructure',
                matchIds: ['infrastructure', 'backup', 'logs'],
                label: 'Servidor & Logs',
                icon: Server,
              },
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
            <div
              className={`logo-icon ${platformLogo ? 'custom-logo' : ''}`}
              data-testid="logo-icon"
              style={platformLogo ? { backgroundColor: 'transparent', boxShadow: 'none' } : undefined}
            >
              {platformLogo ? (
                <img
                  src={platformLogo}
                  alt={platformName || 'Logo'}
                  data-testid="sidebar-custom-logo-img"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
            <span className="logo-text" style={{ color: isLightBg ? '#0b192c' : '#ffffff' }} data-testid="sidebar-logo-text">
              {platformName || 'Área de Membros'}
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
              const isCollapsed = Boolean(collapsedCategories[category.id]);
              const categoryBadgeTotal = category.items.reduce((acc, it) => acc + (it.badge || 0), 0);

              return (
                <div
                  key={category.id}
                  className="nav-category-group"
                  data-testid={`nav-category-${category.id}`}
                >
                  <button
                    type="button"
                    className="nav-category-header-btn"
                    onClick={() => toggleCategory(category.id)}
                    data-testid={`nav-category-toggle-${category.id}`}
                    aria-expanded={!isCollapsed}
                    style={{ color: isLightBg ? '#94a3b8' : '#64748b' }}
                  >
                    <span className="nav-category-title" style={{ padding: 0 }}>
                      {category.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isCollapsed && categoryBadgeTotal > 0 && (
                        <span
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            lineHeight: 1.2,
                          }}
                        >
                          {categoryBadgeTotal}
                        </span>
                      )}
                      <ChevronDown
                        size={13}
                        className={`nav-category-chevron ${isCollapsed ? 'collapsed' : ''}`}
                      />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="nav-category-items">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.matchIds
                          ? item.matchIds.includes(activeTab)
                          : activeTab === item.id;
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
                  )}
                </div>
              );
            })}

            <SidebarLinksGroup
              platformLinks={platformLinks}
              isLightBg={isLightBg}
              isCollapsed={Boolean(collapsedCategories.links)}
              onToggle={() => toggleCategory('links')}
            />
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
