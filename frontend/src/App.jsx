import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import './App.css';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import AutomatedBackup from './components/AutomatedBackup';
import LogManagement from './components/LogManagement';
import CourseManagement from './components/CourseManagement';
import LessonReportsManagement from './components/LessonReportsManagement';
import PlatformSettings from './components/PlatformSettings';
import StudentManagement from './components/student-management';
import IntegrationManagement from './components/integration-management';
import SupportManagement from './components/support-management/SupportManagement';
import { ChatManagement } from './components/chat';
import { TestimonialsManagement } from './components/testimonials';
import { GamificationRanking } from './components/gamification';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import BackgroundUploadWidget from './components/common/BackgroundUploadWidget';
import TopNavbar from './components/navigation/TopNavbar';
import { useToast } from './context/ToastContext';
import { AUTH_EXPIRED_EVENT } from './services/authInterceptor';

const ALUNO_ALLOWED_TABS = ['courses', 'support', 'chat', 'testimonials', 'ranking', 'lesson-reports', 'settings'];

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [isInsideCourse, setIsInsideCourse] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [memberAreaBgColor, setMemberAreaBgColor] = useState(() => {
    return localStorage.getItem('member_area_bg_color') || '#090d16';
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedUserStr = localStorage.getItem('auth_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.role === 'aluno') {
          const savedTab = localStorage.getItem('active_tab') || 'courses';
          return ALUNO_ALLOWED_TABS.includes(savedTab) ? savedTab : 'courses';
        }
      }
    } catch {
      // ignore
    }
    return localStorage.getItem('active_tab') || 'courses';
  });
  const [pathname, setPathname] = useState(window.location.pathname);
  const { addToast } = useToast();

  const handleThemeColorChange = useCallback((newColor) => {
    if (!newColor) return;
    setMemberAreaBgColor(newColor);
    localStorage.setItem('member_area_bg_color', newColor);
  }, []);

  const handleSelectTab = (tabId) => {
    setIsInsideCourse(false);
    setIsMobileMenuOpen(false);
    setActiveTab(tabId);
    localStorage.setItem('active_tab', tabId);
  };

  useEffect(() => {
    // Check local storage for existing session
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed?.role === 'aluno') {
          const currentTab = localStorage.getItem('active_tab') || 'courses';
          if (!ALUNO_ALLOWED_TABS.includes(currentTab)) {
            setActiveTab('courses');
            localStorage.setItem('active_tab', 'courses');
          }
          setIsInsideCourse(false);
        }
      } catch {
        // ignore error
      }
    }

    // Ouvinte para logout automático quando o token expirar
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setShowLogoutModal(false);
      addToast('Sua sessão expirou. Por favor, faça login novamente.', 'error');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    };
  }, [addToast]);

  const fetchPlatformTheme = useCallback(async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/v1/courses/platform-theme', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.bg_color) {
          handleThemeColorChange(data.bg_color);
        }
      }
    } catch {
      // Ignora erro silenciosamente
    }
  }, [token, handleThemeColorChange]);

  const fetchReportsSummary = useCallback(async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    const currentUserStr = localStorage.getItem('auth_user');
    let userRole = user?.role;
    if (!userRole && currentUserStr) {
      try { userRole = JSON.parse(currentUserStr).role; } catch { /* ignore */ }
    }
    if (!currentToken || !['superadmin', 'admin'].includes(userRole)) return;
    try {
      const res = await fetch('/api/v1/courses/reports/summary', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingReportsCount(data.pending_count || 0);
      }
    } catch {
      // Ignora erro silenciosamente
    }
  }, [token, user?.role]);

  useEffect(() => {
    fetchPlatformTheme();
    fetchReportsSummary();
  }, [fetchPlatformTheme, fetchReportsSummary]);

  useEffect(() => {
    if (user?.role === 'aluno' && !ALUNO_ALLOWED_TABS.includes(activeTab)) {
      setActiveTab('courses');
      localStorage.setItem('active_tab', 'courses');
      setIsInsideCourse(false);
    }
  }, [user?.role, activeTab]);

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
    if (loggedInUser?.role === 'aluno') {
      const currentTab = localStorage.getItem('active_tab') || 'courses';
      const initialTab = ALUNO_ALLOWED_TABS.includes(currentTab) ? currentTab : 'courses';
      setActiveTab(initialTab);
      localStorage.setItem('active_tab', initialTab);
      setIsInsideCourse(false);
    }
  };

  const handlePromptLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('active_tab');
    localStorage.removeItem('active_subtab_usermanagement');
    setUser(null);
    setToken(null);
  };

  // Se o caminho for de redefinição de senha (/reset-password)
  const isResetPasswordPage = pathname.includes('/reset-password');
  if (isResetPasswordPage) {
    return (
      <ResetPassword
        onResetSuccess={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  // Se o caminho for de cadastro via convite (/register ou ?token=...)
  const isRegisterPage = pathname.includes('/register') || (window.location.search.includes('token=') && !isResetPasswordPage);

  if (isRegisterPage) {
    return (
      <Register
        onRegisterSuccess={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  // Se o usuário não está autenticado, exibe a tela de Login
  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Se autenticado, exibe a tela inicial com a Sidebar e as funcionalidades
  const isSuperAdmin = user?.role === 'superadmin';
  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((memberAreaBgColor || '').toLowerCase());

  const isFullView = isInsideCourse || activeTab === 'chat';

  return (
    <div
      className={`app-container ${!isLightBg ? 'app-dark-theme classroom-dark-theme' : ''}`}
      style={{ backgroundColor: memberAreaBgColor, '--classroom-modal-bg': memberAreaBgColor }}
    >
      {!isFullView && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          user={user}
          onLogout={handlePromptLogout}
          pendingReportsCount={pendingReportsCount}
          bgColor={memberAreaBgColor}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}
      <main
        className="main-content"
        aria-label="Conteúdo Principal"
        style={{
          backgroundColor: memberAreaBgColor,
          ...(isFullView || activeTab === 'courses' || activeTab === 'settings'
            ? { padding: 0, width: '100%', maxWidth: '100%' }
            : {})
        }}
      >
        {!isFullView && (
          <TopNavbar
            user={user}
            onNavigateTab={handleSelectTab}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            bgColor={memberAreaBgColor}
          />
        )}
        {activeTab === 'courses' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <CourseManagement
            currentUser={user}
            onCourseViewChange={setIsInsideCourse}
            bgColor={memberAreaBgColor}
            onThemeColorChange={handleThemeColorChange}
            onNavigateTab={handleSelectTab}
          />
        )}
        {activeTab === 'support' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <SupportManagement
            currentUser={user}
            bgColor={memberAreaBgColor}
          />
        )}
        {activeTab === 'chat' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <ChatManagement
            currentUser={user}
            bgColor={memberAreaBgColor}
            onBack={() => handleSelectTab('courses')}
          />
        )}
        {activeTab === 'testimonials' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <TestimonialsManagement
            user={user}
            bgColor={memberAreaBgColor}
          />
        )}
        {activeTab === 'ranking' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <GamificationRanking
            user={user}
            bgColor={memberAreaBgColor}
          />
        )}
        {activeTab === 'lesson-reports' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <LessonReportsManagement
            currentUser={user}
            onUpdateSummary={fetchReportsSummary}
            bgColor={memberAreaBgColor}
          />
        )}
        {activeTab === 'students' && ['superadmin', 'admin'].includes(user?.role) && (
          <StudentManagement bgColor={memberAreaBgColor} />
        )}
        {activeTab === 'integrations' && ['superadmin', 'admin'].includes(user?.role) && (
          <IntegrationManagement bgColor={memberAreaBgColor} />
        )}
        {activeTab === 'settings' && ['superadmin', 'admin', 'aluno'].includes(user?.role) && (
          <PlatformSettings
            currentUser={user}
            bgColor={memberAreaBgColor}
            onThemeColorChange={handleThemeColorChange}
            onUserUpdated={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }}
          />
        )}
        {isSuperAdmin && (
          <>
            {activeTab === 'users' && <UserManagement currentUser={user} bgColor={memberAreaBgColor} />}
            {activeTab === 'backup' && <AutomatedBackup currentUser={user} bgColor={memberAreaBgColor} />}
            {activeTab === 'logs' && <LogManagement currentUser={user} bgColor={memberAreaBgColor} />}
          </>
        )}
        {!isSuperAdmin && !(
          (activeTab === 'courses' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'support' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'chat' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'testimonials' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'ranking' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'lesson-reports' && ['admin', 'aluno'].includes(user?.role)) ||
          (activeTab === 'students' && user?.role === 'admin') ||
          (activeTab === 'integrations' && user?.role === 'admin') ||
          (activeTab === 'settings' && ['admin', 'aluno'].includes(user?.role))
        ) && (
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
        )}
      </main>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />

      <BackgroundUploadWidget />
    </div>
  );
}

export default App;
