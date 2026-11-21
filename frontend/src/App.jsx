import './App.css';
import Sidebar from './components/Sidebar';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import BackgroundUploadWidget from './components/common/BackgroundUploadWidget';
import TopNavbar from './components/navigation/TopNavbar';
import PublicRoutesView from './components/navigation/PublicRoutesView';
import AppTabContent from './components/navigation/AppTabContent';
import LevelUpWatcher from './components/gamification/LevelUpWatcher';
import PwaInstallPortal from './components/pwa/PwaInstallPortal';
import { useToast } from './context/ToastContext';
import useCommunityFeedStudentsEnabled from './hooks/useCommunityFeedStudentsEnabled';
import { useAppSessionAndBadges } from './hooks/useAppSessionAndBadges';

function App() {
  const { addToast } = useToast();
  const communityFeedStudentsEnabled = useCommunityFeedStudentsEnabled();
  const {
    user,
    setUser,
    token,
    pathname,
    setPathname,
    activeTab,
    memberAreaBgColor,
    pendingReportsCount,
    pendingSupportCount,
    chatUnreadCount,
    isInsideCourse,
    setIsInsideCourse,
    isInsideFunnel,
    setIsInsideFunnel,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isChatSidebarOpen,
    setIsChatSidebarOpen,
    showLogoutModal,
    setShowLogoutModal,
    handleThemeColorChange,
    handleSelectTab,
    fetchReportsSummary,
    handleLoginSuccess,
    handlePromptLogout,
    handleConfirmLogout,
  } = useAppSessionAndBadges({ addToast, communityFeedStudentsEnabled });

  const publicView = (
    <PublicRoutesView
      pathname={pathname}
      setPathname={setPathname}
      user={user}
      token={token}
      onLoginSuccess={handleLoginSuccess}
    />
  );

  if (!user || !token || pathname.includes('/privacidade') || pathname.includes('/termos') || pathname.includes('/excluir-conta') || pathname.includes('/validar-certificado') || pathname.includes('/verify-email') || pathname.includes('/reset-password') || pathname.includes('/register') || window.location.search.includes('token=')) {
    return publicView;
  }

  const isSuperAdmin = user?.role === 'superadmin';
  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((memberAreaBgColor || '').toLowerCase());
  const isFullView = isInsideCourse;
  const isChatTab = activeTab === 'chat';
  const isHideSidebar = isFullView || isInsideFunnel || (isChatTab && !isChatSidebarOpen);

  return (
    <div
      className={`app-container ${!isLightBg ? 'app-dark-theme classroom-dark-theme' : ''}`}
      style={{ backgroundColor: memberAreaBgColor, '--classroom-modal-bg': memberAreaBgColor }}
    >
      {!isHideSidebar && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          user={user}
          onLogout={handlePromptLogout}
          pendingReportsCount={pendingReportsCount + pendingSupportCount}
          chatUnreadCount={chatUnreadCount}
          bgColor={memberAreaBgColor}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => {
            setIsMobileMenuOpen(false);
            if (isChatTab) setIsChatSidebarOpen(false);
          }}
        />
      )}
      <main
        className={`main-content ${isFullView ? 'main-content-fullview' : ''}`}
        aria-label="Conteúdo Principal"
        style={{
          backgroundColor: memberAreaBgColor,
          ...(isFullView || activeTab === 'courses' || activeTab === 'settings' || activeTab === 'chat'
            ? { padding: 0, width: '100%', maxWidth: '100%' }
            : {}),
          ...(activeTab === 'chat' || isInsideFunnel ? { overflow: 'hidden' } : {}),
          ...(isFullView ? { height: '100%', minHeight: '100%' } : {}),
        }}
      >
        {!isFullView && (
          <TopNavbar
            user={user}
            onNavigateTab={handleSelectTab}
            onOpenMobileMenu={() => {
              if (activeTab === 'chat') setIsChatSidebarOpen((prev) => !prev);
              setIsMobileMenuOpen((prev) => !prev);
            }}
            bgColor={memberAreaBgColor}
          />
        )}
        {!isFullView && <PwaInstallPortal />}
        <AppTabContent
          activeTab={activeTab}
          user={user}
          setUser={setUser}
          isSuperAdmin={isSuperAdmin}
          isLightBg={isLightBg}
          memberAreaBgColor={memberAreaBgColor}
          pendingSupportCount={pendingSupportCount}
          pendingReportsCount={pendingReportsCount}
          communityFeedStudentsEnabled={communityFeedStudentsEnabled}
          addToast={addToast}
          handleSelectTab={handleSelectTab}
          handleThemeColorChange={handleThemeColorChange}
          fetchReportsSummary={fetchReportsSummary}
          setIsInsideCourse={setIsInsideCourse}
          setIsInsideFunnel={setIsInsideFunnel}
        />
      </main>
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />
      <BackgroundUploadWidget />
      <LevelUpWatcher currentUser={user} />
    </div>
  );
}

export default App;
