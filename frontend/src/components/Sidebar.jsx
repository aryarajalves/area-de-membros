import React from 'react';
import { Database, Users, LogOut, Terminal, GraduationCap, AlertTriangle, Settings, UserCheck, Webhook, HelpCircle, X } from 'lucide-react';

export default function Sidebar({
  activeTab = 'courses',
  onSelectTab,
  user,
  onLogout,
  pendingReportsCount = 0,
  bgColor = '#090d16',
  isMobileOpen = false,
  onCloseMobile
}) {
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAluno = user?.role === 'aluno';

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());

  // Categorias de navegação (Proposta 2):
  // - Gestão de Ensino: Cursos, Alunos, Suporte e Relatos de Aulas
  // - Administração: Integrações e Configurações
  // - Segurança: Backup, Logs e Gestão de Usuários (restrito a superadmin)
  const categories = [
    {
      id: 'ensino',
      title: isAluno ? 'Meu Aprendizado' : 'Gestão de Ensino',
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
        ...(isSuperAdmin || isAdmin
          ? [
              { id: 'lesson-reports', label: 'Relatos de Aulas', icon: AlertTriangle, badge: pendingReportsCount },
            ]
          : []),
      ],
    },
    {
      id: 'administracao',
      title: 'Administração',
      items: [
        ...(isSuperAdmin || isAdmin
          ? [
              { id: 'integrations', label: 'Integrações', icon: Webhook },
              { id: 'settings', label: 'Configurações', icon: Settings },
            ]
          : []),
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      items: [
        ...(isSuperAdmin
          ? [
              { id: 'backup', label: 'Backup Automático', icon: Database },
              { id: 'logs', label: 'Gerenciamento de logs', icon: Terminal },
              { id: 'users', label: 'Gestão de Usuário', icon: Users },
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
        </nav>
      </div>

      {/* User profile footer with Logout */}
      <div
        className="sidebar-footer"
        style={{ borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <div className="user-profile">
          <div className="avatar" data-testid="user-avatar">{userInitial}</div>
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
