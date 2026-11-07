import React, { useState } from 'react';
import { Sliders, BarChart3, Lightbulb, DollarSign, MessageSquare } from 'lucide-react';
import TutorSettingsForm from './TutorSettingsForm';
import TutorInsightsAnalyticsCard from './TutorInsightsAnalyticsCard';
import TutorSuggestionsList from './TutorSuggestionsList';
import TutorFinancialTab from './TutorFinancialTab';
import TutorConversationsTab from './TutorConversationsTab';

export default function PlatformAiTutorTab({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'insights' | 'suggestions' | 'financial' | 'conversations'

  return (
    <div
      data-testid="platform-ai-tutor-tab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '860px',
        margin: '0 auto'
      }}
    >
      {/* Sub-Navegação Superior: 5 Abas Dedicadas */}
      <div
        data-testid="tutor-admin-subtabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '10px',
          overflowX: 'auto',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          data-testid="tab-tutor-settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '9px',
            backgroundColor: activeTab === 'settings'
              ? (isLightBg ? '#e0e7ff' : 'rgba(124, 58, 237, 0.18)')
              : 'transparent',
            border: activeTab === 'settings'
              ? '1px solid rgba(124, 58, 237, 0.4)'
              : '1px solid transparent',
            color: activeTab === 'settings' ? (isLightBg ? '#4338ca' : '#c084fc') : subTextColor,
            fontSize: '13.5px',
            fontWeight: activeTab === 'settings' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={15} />
          <span>Configurações & Prompt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          data-testid="tab-tutor-insights"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '9px',
            backgroundColor: activeTab === 'insights'
              ? (isLightBg ? '#e0e7ff' : 'rgba(124, 58, 237, 0.18)')
              : 'transparent',
            border: activeTab === 'insights'
              ? '1px solid rgba(124, 58, 237, 0.4)'
              : '1px solid transparent',
            color: activeTab === 'insights' ? (isLightBg ? '#4338ca' : '#c084fc') : subTextColor,
            fontSize: '13.5px',
            fontWeight: activeTab === 'insights' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <BarChart3 size={15} />
          <span>Dúvidas & Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suggestions')}
          data-testid="tab-tutor-suggestions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '9px',
            backgroundColor: activeTab === 'suggestions'
              ? (isLightBg ? '#fef3c7' : 'rgba(234, 179, 8, 0.18)')
              : 'transparent',
            border: activeTab === 'suggestions'
              ? '1px solid rgba(234, 179, 8, 0.4)'
              : '1px solid transparent',
            color: activeTab === 'suggestions' ? (isLightBg ? '#b45309' : '#facc15') : subTextColor,
            fontSize: '13.5px',
            fontWeight: activeTab === 'suggestions' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Lightbulb size={15} />
          <span>💡 Sugestões</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          data-testid="tab-tutor-financial"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '9px',
            backgroundColor: activeTab === 'financial'
              ? (isLightBg ? '#dcfce7' : 'rgba(16, 185, 129, 0.18)')
              : 'transparent',
            border: activeTab === 'financial'
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : '1px solid transparent',
            color: activeTab === 'financial' ? (isLightBg ? '#15803d' : '#34d399') : subTextColor,
            fontSize: '13.5px',
            fontWeight: activeTab === 'financial' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <DollarSign size={15} />
          <span>💰 Custos & Financeiro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conversations')}
          data-testid="tab-tutor-conversations"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '9px',
            backgroundColor: activeTab === 'conversations'
              ? (isLightBg ? '#e0e7ff' : 'rgba(124, 58, 237, 0.18)')
              : 'transparent',
            border: activeTab === 'conversations'
              ? '1px solid rgba(124, 58, 237, 0.4)'
              : '1px solid transparent',
            color: activeTab === 'conversations' ? (isLightBg ? '#4338ca' : '#c084fc') : subTextColor,
            fontSize: '13.5px',
            fontWeight: activeTab === 'conversations' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={15} />
          <span>💬 Histórico</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'settings' && (
        <TutorSettingsForm
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      )}

      {activeTab === 'insights' && (
        <TutorInsightsAnalyticsCard
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      )}

      {activeTab === 'suggestions' && (
        <TutorSuggestionsList
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      )}

      {activeTab === 'financial' && (
        <TutorFinancialTab
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      )}

      {activeTab === 'conversations' && (
        <TutorConversationsTab
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      )}
    </div>
  );
}
