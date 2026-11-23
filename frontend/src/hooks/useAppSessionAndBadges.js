import { useState, useEffect, useCallback, useRef } from 'react';
import { syncPwaWhiteLabelMeta } from '../utils/pwaDeviceUtils';
import { AUTH_EXPIRED_EVENT, subscribeAuthStorageSync } from '../services/authInterceptor';
import { useUrlNavigation } from './useUrlNavigation';
import { usePushNotifications, unregisterPushNotifications } from './usePushNotifications';

const ALUNO_ALLOWED_TABS = [
  'home', 'courses', 'events', 'support', 'chat',
  'testimonials', 'ranking', 'introductions', 'freelance', 'lesson-reports', 'settings',
];

/**
 * Gerencia sessão autenticada, navegação por abas, tema whitelabel,
 * contadores de badges (suporte, denúncias, chat) e push notifications.
 */
export function useAppSessionAndBadges({ addToast, communityFeedStudentsEnabled }) {
  const alunoAllowedTabs = communityFeedStudentsEnabled
    ? [...ALUNO_ALLOWED_TABS, 'community-feed']
    : ALUNO_ALLOWED_TABS;

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pendingSupportCount, setPendingSupportCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isInsideCourse, setIsInsideCourse] = useState(false);
  const [isInsideFunnel, setIsInsideFunnel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [memberAreaBgColor, setMemberAreaBgColor] = useState(
    () => localStorage.getItem('member_area_bg_color') || '#090d16'
  );
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

  const hasInitialUrlRoute = useRef(
    typeof window !== 'undefined' &&
      Boolean(window.location.search && (window.location.search.includes('tab=') || window.location.search.includes('courseId=')))
  );

  const handleThemeColorChange = useCallback((newColor) => {
    if (!newColor) return;
    setMemberAreaBgColor(newColor);
    localStorage.setItem('member_area_bg_color', newColor);
  }, []);

  const handleSelectTab = useCallback((tabId) => {
    setIsInsideCourse(false);
    setIsInsideFunnel(false);
    setIsMobileMenuOpen(false);
    setIsChatSidebarOpen(tabId !== 'chat');
    setActiveTab(tabId);
    localStorage.setItem('active_tab', tabId);
    if (typeof window !== 'undefined' && window.location.search) {
      try {
        const cleanPath = window.location.pathname || '/';
        if (window.history && typeof window.history.replaceState === 'function') {
          window.history.replaceState({}, document.title, cleanPath);
        }
      } catch {
        // Ignora erro
      }
    }
  }, []);

  useUrlNavigation({ user, onSelectTab: handleSelectTab });

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed?.role === 'aluno') {
          const currentTab = localStorage.getItem('active_tab') || 'courses';
          if (!alunoAllowedTabs.includes(currentTab)) {
            setActiveTab('courses');
            localStorage.setItem('active_tab', 'courses');
          }
          setIsInsideCourse(false);
        }
      } catch {
        // ignore error
      }
    }

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setShowLogoutModal(false);
      addToast('Sua sessão expirou. Por favor, faça login novamente.', 'error');
    };
    const unsubscribeStorage = subscribeAuthStorageSync({
      onSessionUpdated: (newToken, newUser) => {
        setToken(newToken);
        if (newUser) setUser(newUser);
      },
      onSessionCleared: () => {
        setUser(null);
        setToken(null);
        setShowLogoutModal(false);
      },
    });

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
      unsubscribeStorage();
    };
  }, [addToast]);

  useEffect(() => {
    const handleAppNavigateTab = (e) => {
      if (e.detail?.tab) handleSelectTab(e.detail.tab);
    };
    window.addEventListener('app:navigate_tab', handleAppNavigateTab);
    return () => window.removeEventListener('app:navigate_tab', handleAppNavigateTab);
  }, [handleSelectTab]);

  useEffect(() => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) return;

    const checkInitialTutorials = async () => {
      try {
        if (hasInitialUrlRoute.current) return;
        const res = await fetch('/api/v1/tutorials', { headers: { Authorization: `Bearer ${currentToken}` } });
        if (res.ok) {
          const tutorials = await res.json();
          const savedTab = localStorage.getItem('active_tab');
          if (tutorials && tutorials.length > 0) {
            if (!savedTab || savedTab === 'home' || savedTab === 'courses') {
              setActiveTab('home');
              localStorage.setItem('active_tab', 'home');
            }
          } else if (!savedTab || savedTab === 'home') {
            setActiveTab('courses');
            localStorage.setItem('active_tab', 'courses');
          }
        }
      } catch {
        // Ignora silenciosamente
      }
    };
    checkInitialTutorials();
  }, [token]);

  const fetchPlatformTheme = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/whitelabel');
      if (res.ok) {
        const data = await res.json();
        if (data?.bg_color) handleThemeColorChange(data.bg_color);
        if (data?.platform_name) {
          localStorage.setItem('platform_name', data.platform_name);
          document.title = data.platform_name;
        }
        if (data?.logo_url !== undefined) {
          if (data.logo_url) localStorage.setItem('platform_logo', data.logo_url);
          else localStorage.removeItem('platform_logo');
        }
        if (data?.logo_size) localStorage.setItem('platform_logo_size', data.logo_size);
        syncPwaWhiteLabelMeta({
          platformName: data?.platform_name,
          pwaAppName: data?.pwa_app_name,
          logoUrl: data?.logo_url,
          pwaIconUrl: data?.pwa_icon_url,
          bgColor: data?.bg_color,
        });
      }
    } catch {
      // Ignora erro silenciosamente
    }
  }, [handleThemeColorChange]);

  const fetchReportsSummary = useCallback(async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) return;
    const currentUserStr = localStorage.getItem('auth_user');
    let userRole = user?.role;
    if (!userRole && currentUserStr) {
      try {
        userRole = JSON.parse(currentUserStr).role;
      } catch {
        /* ignore */
      }
    }
    const headers = { Authorization: `Bearer ${currentToken}` };
    if (['superadmin', 'admin'].includes(userRole)) {
      try {
        const res = await fetch('/api/v1/courses/reports/summary', { headers });
        if (res.ok) {
          const data = await res.json();
          setPendingReportsCount(data.pending_count || 0);
        }
      } catch {
        /* ignore */
      }
    }
    try {
      const sRes = await fetch('/api/v1/support/stats', { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        setPendingSupportCount(Math.max(0, (sData.total_topics || 0) - (sData.resolved_count || 0)));
      }
    } catch {
      /* ignore */
    }
  }, [token, user?.role]);

  const fetchChatUnreadSummary = useCallback(async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/v1/chat/unread-summary', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatUnreadCount(data.total_unread || 0);
      }
    } catch {
      // Ignora erro silenciosamente
    }
  }, [token]);

  useEffect(() => {
    fetchPlatformTheme();
    fetchReportsSummary();
    fetchChatUnreadSummary();

    let debounceTimer = null;
    const handleChatUnreadUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchChatUnreadSummary();
      }, 500);
    };
    window.addEventListener('chat_unread_updated', handleChatUnreadUpdate);
    window.addEventListener('support_summary_updated', fetchReportsSummary);

    return () => {
      window.removeEventListener('chat_unread_updated', handleChatUnreadUpdate);
      window.removeEventListener('support_summary_updated', fetchReportsSummary);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [fetchPlatformTheme, fetchReportsSummary, fetchChatUnreadSummary]);

  useEffect(() => {
    if (user?.role === 'aluno' && !alunoAllowedTabs.includes(activeTab)) {
      setActiveTab('courses');
      localStorage.setItem('active_tab', 'courses');
      setIsInsideCourse(false);
    }
  }, [user?.role, activeTab, alunoAllowedTabs]);

  const handleLoginSuccess = (loggedInUser, userToken) => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
      window.history.replaceState({}, document.title, '/');
      setPathname('/');
    }
    setUser(loggedInUser);
    setToken(userToken);
    if (loggedInUser?.role === 'aluno') {
      const currentTab = localStorage.getItem('active_tab') || 'courses';
      const initialTab = alunoAllowedTabs.includes(currentTab) ? currentTab : 'courses';
      setActiveTab(initialTab);
      localStorage.setItem('active_tab', initialTab);
      setIsInsideCourse(false);
    }
  };

  usePushNotifications({ token, setActiveTab });

  const handlePromptLogout = () => {
    setIsMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    unregisterPushNotifications(token);
    setShowLogoutModal(false);
    ['auth_token', 'auth_user', 'active_tab', 'active_subtab_usermanagement'].forEach((k) =>
      localStorage.removeItem(k)
    );
    setUser(null);
    setToken(null);
  };

  return {
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
  };
}
