import React from 'react';
import UserManagement from '../UserManagement';
import AutomatedBackup from '../AutomatedBackup';
import LogManagement from '../LogManagement';
import { InfrastructureManagement } from '../infrastructure';
import CourseManagement from '../CourseManagement';
import LessonReportsManagement from '../LessonReportsManagement';
import PlatformSettings from '../PlatformSettings';
import StudentManagement from '../student-management';
import IntegrationManagement from '../integration-management';
import SupportManagement from '../support-management/SupportManagement';
import { ChatManagement } from '../chat';
import { TestimonialsManagement } from '../testimonials';
import { GamificationRanking } from '../gamification';
import { SupportReportsSubTabs, ServerSystemSubTabs, RestrictedWelcomeScreen } from './UnifiedSectionSubTabs';
import FunnelManagement from '../funnels/FunnelManagement';
import { HomeTutorials } from '../home-tutorials';
import { IntroductionManagement } from '../introductions';
import { CommunityFeedManagement } from '../community-feed';
import { EventsManagement } from '../events';
import { FreelanceBoard } from '../freelance';
import useFreelanceAccess from '../../hooks/useFreelanceAccess';

/**
 * Renderiza o conteúdo correspondente à aba ativa do usuário autenticado
 * e valida permissões por papel (superadmin, admin, aluno).
 */
export default function AppTabContent({
  activeTab,
  user,
  setUser,
  isSuperAdmin,
  isLightBg,
  memberAreaBgColor,
  pendingSupportCount,
  pendingReportsCount,
  communityFeedStudentsEnabled,
  addToast,
  handleSelectTab,
  handleThemeColorChange,
  fetchReportsSummary,
  setIsInsideCourse,
  setIsInsideFunnel,
}) {
  const isAllRoles = ['superadmin', 'admin', 'aluno'].includes(user?.role);
  const isAdminOrSuper = ['superadmin', 'admin'].includes(user?.role);
  const hasFreelanceAccess = useFreelanceAccess(user);

  const hasAccessToActiveTab =
    isSuperAdmin ||
    (['home', 'courses', 'events', 'support', 'chat', 'testimonials', 'introductions', 'ranking', 'lesson-reports', ...(hasFreelanceAccess ? ['freelance'] : []), ...(communityFeedStudentsEnabled ? ['community-feed'] : [])].includes(activeTab) &&
      ['admin', 'aluno'].includes(user?.role)) ||
    (['students', 'users', 'funnels', 'integrations', 'community-feed'].includes(activeTab) && user?.role === 'admin') ||
    (activeTab === 'settings' && ['admin', 'aluno'].includes(user?.role));

  return (
    <>
      {activeTab === 'home' && isAllRoles && (
        <HomeTutorials
          currentUser={user}
          addToast={addToast}
          onGoToCourses={() => handleSelectTab('courses')}
        />
      )}
      {activeTab === 'events' && isAllRoles && (
        <EventsManagement currentUser={user} bgColor={memberAreaBgColor} addToast={addToast} onNavigateTab={handleSelectTab} />
      )}
      {activeTab === 'courses' && isAllRoles && (
        <CourseManagement
          currentUser={user}
          onCourseViewChange={setIsInsideCourse}
          bgColor={memberAreaBgColor}
          onThemeColorChange={handleThemeColorChange}
          onNavigateTab={handleSelectTab}
        />
      )}
      {['support', 'lesson-reports'].includes(activeTab) && isAllRoles && (
        <SupportReportsSubTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          pendingSupportCount={pendingSupportCount}
          pendingReportsCount={pendingReportsCount}
          isLightBg={isLightBg}
        />
      )}
      {activeTab === 'support' && isAllRoles && (
        <SupportManagement currentUser={user} bgColor={memberAreaBgColor} />
      )}
      {activeTab === 'chat' && isAllRoles && (
        <ChatManagement currentUser={user} bgColor={memberAreaBgColor} onBack={() => handleSelectTab('courses')} />
      )}
      {activeTab === 'testimonials' && isAllRoles && (
        <TestimonialsManagement user={user} bgColor={memberAreaBgColor} />
      )}
      {activeTab === 'introductions' && isAllRoles && (
        <IntroductionManagement user={user} bgColor={memberAreaBgColor} />
      )}
      {activeTab === 'freelance' && hasFreelanceAccess && (
        <FreelanceBoard currentUser={user} addToast={addToast} />
      )}
      {activeTab === 'community-feed' && (isAdminOrSuper || (communityFeedStudentsEnabled && user?.role === 'aluno')) && (
        <CommunityFeedManagement user={user} />
      )}
      {activeTab === 'ranking' && isAllRoles && (
        <GamificationRanking user={user} bgColor={memberAreaBgColor} />
      )}
      {activeTab === 'lesson-reports' && isAllRoles && (
        <LessonReportsManagement
          currentUser={user}
          onUpdateSummary={fetchReportsSummary}
          bgColor={memberAreaBgColor}
        />
      )}
      {activeTab === 'students' && isAdminOrSuper && <StudentManagement bgColor={memberAreaBgColor} />}
      {activeTab === 'users' && isAdminOrSuper && <UserManagement currentUser={user} bgColor={memberAreaBgColor} />}
      {activeTab === 'funnels' && isAdminOrSuper && <FunnelManagement onFunnelViewChange={setIsInsideFunnel} />}
      {activeTab === 'integrations' && isAdminOrSuper && <IntegrationManagement bgColor={memberAreaBgColor} />}
      {activeTab === 'settings' && isAllRoles && (
        <PlatformSettings
          currentUser={user}
          bgColor={memberAreaBgColor}
          onThemeColorChange={handleThemeColorChange}
          onUserUpdated={(u) => {
            setUser(u);
            localStorage.setItem('auth_user', JSON.stringify(u));
          }}
          onNavigateTab={handleSelectTab}
        />
      )}
      {isSuperAdmin && ['infrastructure', 'backup', 'logs'].includes(activeTab) && (
        <ServerSystemSubTabs activeTab={activeTab} onSelectTab={handleSelectTab} isLightBg={isLightBg} />
      )}
      {isSuperAdmin && (
        <>
          {activeTab === 'backup' && <AutomatedBackup currentUser={user} bgColor={memberAreaBgColor} />}
          {activeTab === 'logs' && <LogManagement currentUser={user} bgColor={memberAreaBgColor} />}
          {activeTab === 'infrastructure' && (
            <InfrastructureManagement currentUser={user} onSelectTab={handleSelectTab} bgColor={memberAreaBgColor} />
          )}
        </>
      )}
      {!hasAccessToActiveTab && <RestrictedWelcomeScreen user={user} />}
    </>
  );
}
