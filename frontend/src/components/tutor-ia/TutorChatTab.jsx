import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import TutorMessageItem from './TutorMessageItem';
import TutorInputBar from './TutorInputBar';
import TutorPaywallCard from './TutorPaywallCard';
import TutorQuickPrompts from './TutorQuickPrompts';
import TutorChatHeader from './TutorChatHeader';
import TutorFeedbackModal from './TutorFeedbackModal';
import TutorSaveNoteModal from './TutorSaveNoteModal';
import TutorExportChatModal from './TutorExportChatModal';
import TutorEmptyState from './TutorEmptyState';
import TutorMaintenanceBanner from './TutorMaintenanceBanner';
import TutorConfirmNavigateLessonModal from './TutorConfirmNavigateLessonModal';
import TutorClearHistoryModal from './TutorClearHistoryModal';
import { useTutorChatStream } from '../../hooks/useTutorChatStream';

export default function TutorChatTab({
  courseId,
  lessonId,
  currentUser,
  isLightBg = false,
  onSeekTime,
  onSelectLesson
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [indexingRag, setIndexingRag] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState({ questions: [], hasCustomQa: false });
  const [showPromptChips, setShowPromptChips] = useState(false);
  const [feedbackModalTarget, setFeedbackModalTarget] = useState({ isOpen: false, messageId: null });
  const [saveNoteModalTarget, setSaveNoteModalTarget] = useState({ isOpen: false, content: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pendingNavigateLesson, setPendingNavigateLesson] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [quota, setQuota] = useState({
    tutor_name: 'Tutor IA 24h', is_active: false, can_ask: true, remaining_free: 3,
    total_monthly_limit: 3, sales_checkout_url: null, monthly_price_brl: 10.0,
    is_in_maintenance: false, maintenance_message: null
  });

  const { addToast } = useToast();
  const { streamMessage } = useTutorChatStream();
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isFirstLoad = useRef(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchStatusAndHistory = useCallback(async () => {
    if (!courseId) return;
    try {
      setInitialLoading(true);
      const headers = getAuthHeaders();

      // 1. Status de cota
      const statusRes = await fetch(
        `/api/v1/tutor-ia/status?course_id=${courseId}${lessonId ? `&lesson_id=${lessonId}` : ''}`,
        { headers }
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setQuota(statusData);
      }

      // 2. Histórico da aula
      const histRes = await fetch(
        `/api/v1/tutor-ia/history?course_id=${courseId}${lessonId ? `&lesson_id=${lessonId}` : ''}`,
        { headers }
      );
      if (histRes.ok) {
        const histData = await histRes.json();
        setMessages(histData);
      }

      // 3. Perguntas sugeridas para esta aula (Quick Prompts)
      const suggRes = await fetch(
        `/api/v1/tutor-ia/suggested-questions?course_id=${courseId}${lessonId ? `&lesson_id=${lessonId}` : ''}`,
        { headers }
      );
      if (suggRes.ok) {
        const suggData = await suggRes.json();
        setSuggestedQuestions({
          questions: suggData.questions || [],
          hasCustomQa: suggData.has_custom_qa || false
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Tutor IA:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchStatusAndHistory();
  }, [fetchStatusAndHistory]);

  const scrollToBottom = () => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight || 0;
    }
  };

  // Rola apenas uma vez na carga inicial da aula para exibir o histórico (sem mover a tela no envio de novas mensagens)
  useEffect(() => {
    if (!initialLoading && isFirstLoad.current) {
      isFirstLoad.current = false;
      scrollToBottom();
    }
  }, [initialLoading]);

  const handleSendMessage = async (text) => {
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;

    const nowIso = new Date().toISOString();
    const tempUserMsg = { id: tempUserId, role: 'user', content: text, created_at: nowIso };
    const tempAssistantMsg = { id: tempAssistantId, role: 'assistant', content: '', isStreaming: true, created_at: nowIso };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setLoading(true);

    try {
      const headers = getAuthHeaders();
      let accumulatedReply = '';

      await streamMessage({
        courseId,
        lessonId,
        message: text,
        headers,
        onToken: (token) => {
          accumulatedReply += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? { ...m, content: accumulatedReply, isStreaming: true }
                : m
            )
          );
        },
        onDone: (data) => {
          setMessages((prev) => prev.map((m) => m.id === tempAssistantId ? {
            ...m, id: data.message_id || tempAssistantId, content: data.reply || accumulatedReply,
            cost_brl: data.cost_brl, related_lessons: data.related_lessons,
            created_at: data.created_at || m.created_at, isStreaming: false
          } : m));
          setQuota((prev) => ({
            ...prev, tutor_name: data.tutor_name || prev.tutor_name,
            remaining_free: data.remaining_free, can_ask: data.can_ask
          }));
        },
        onError: (err) => {
          if (err?.status === 402) {
            setQuota((prev) => ({ ...prev, can_ask: false, remaining_free: 0 }));
            addToast('Limite de perguntas gratuitas atingido. Assine o plano ilimitado!', 'warning');
          }
        }
      });
    } catch (err) {
      // Rollback: se falhou antes ou durante o envio, remove mensagens se o assistente não produziu conteúdo
      setMessages((prev) =>
        prev.filter((m) => {
          if (m.id === tempUserId) return false;
          if (m.id === tempAssistantId && !m.content) return false;
          return true;
        })
      );
      if (err?.status !== 402) {
        addToast(err.message || 'Erro ao conversar com o Tutor IA. Mensagem não enviada.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClearHistory = async () => {
    try {
      setClearingHistory(true);
      const headers = getAuthHeaders();
      const res = await fetch(
        `/api/v1/tutor-ia/history?course_id=${courseId}${lessonId ? `&lesson_id=${lessonId}` : ''}`,
        { method: 'DELETE', headers }
      );
      if (res.ok) {
        setMessages([]);
        addToast('Histórico de conversas limpo com sucesso.', 'info');
        setIsClearModalOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Falha ao limpar histórico.', 'error');
      }
    } catch (err) {
      addToast('Erro ao limpar histórico.', 'error');
    } finally {
      setClearingHistory(false);
    }
  };

  const handleIndexRagLesson = async () => {
    if (!lessonId) return;
    try {
      setIndexingRag(true);
      const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lessonId}/index`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao sincronizar RAG da aula.');
      }
      const data = await res.json();
      addToast(`RAG sincronizado: ${data.chunks_created} fragmentos indexados na base!`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao sincronizar RAG.', 'error');
    } finally {
      setIndexingRag(false);
    }
  };

  const handleSelectRelatedLesson = (rel) => {
    setPendingNavigateLesson(rel);
  };

  const handleConfirmNavigateLesson = () => {
    if (pendingNavigateLesson && onSelectLesson) {
      onSelectLesson({
        id: pendingNavigateLesson.lesson_id,
        title: pendingNavigateLesson.lesson_title,
        module_id: pendingNavigateLesson.module_id
      });
    }
    setPendingNavigateLesson(null);
  };

  const handleOpenFeedbackModal = (message) => setFeedbackModalTarget({ isOpen: true, messageId: message.id });

  const handleCloseFeedbackModal = () => setFeedbackModalTarget({ isOpen: false, messageId: null });

  const handleOpenSaveNoteModal = (message) => setSaveNoteModalTarget({ isOpen: true, content: message.content || '' });

  const handleCloseSaveNoteModal = () => setSaveNoteModalTarget({ isOpen: false, content: '' });

  const handleSubmitFeedback = async ({ messageId, rating, feedbackText }) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/v1/tutor-ia/messages/${messageId}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating, feedback_text: feedbackText })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao registrar avaliação.');
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, feedback_rating: rating, feedback_text: feedbackText } : m
        )
      );
      if (rating === 'like') {
        addToast('Obrigado pelo seu feedback positivo!', 'success');
      } else {
        addToast('Feedback registrado! Obrigado por nos ajudar a aprimorar o Tutor.', 'info');
      }
    } catch (err) {
      console.error('Erro ao registrar feedback:', err);
      addToast(err.message || 'Erro ao registrar avaliação.', 'error');
    }
  };

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      data-testid="tutor-chat-tab-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '440px',
        marginTop: '16px',
        gap: '12px'
      }}
    >
      {/* Cabeçalho do Tutor IA */}
      <TutorChatHeader
        tutorName={quota.tutor_name}
        textColor={textColor}
        subTextColor={subTextColor}
        borderColor={borderColor}
        hasMessages={messages.length > 0}
        onClearHistory={() => setIsClearModalOpen(true)}
        onRefresh={fetchStatusAndHistory}
        onExportChat={() => setIsExportModalOpen(true)}
        isManager={isManager}
        indexingRag={indexingRag}
        onIndexRagLesson={handleIndexRagLesson}
      />

      {/* Banner de Manutenção ou Trava de Assinatura quando cota é atingida */}
      {quota.is_in_maintenance ? (
        <TutorMaintenanceBanner
          message={quota.maintenance_message}
          isManager={isManager}
          isLightBg={isLightBg}
        />
      ) : (
        !quota.can_ask && (
          <TutorPaywallCard
            checkoutUrl={quota.sales_checkout_url}
            monthlyPrice={quota.monthly_price_brl}
            isLightBg={isLightBg}
          />
        )
      )}

      {/* Lista de Mensagens */}
      <div
        ref={messagesContainerRef}
        data-testid="tutor-messages-scroll-area"
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '480px',
          paddingRight: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {initialLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor, fontSize: '13px' }}>
            <span>Carregando Tutor IA...</span>
          </div>
        ) : messages.length === 0 ? (
          <TutorEmptyState
            textColor={textColor}
            subTextColor={subTextColor}
            suggestedQuestions={suggestedQuestions}
            onSelectQuestion={handleSendMessage}
            disabled={loading || !quota.can_ask}
            isLightBg={isLightBg}
            tutorName={quota.tutor_name}
          />
        ) : (
          messages.map((m) => (
            <TutorMessageItem
              key={m.id || m.created_at}
              message={m}
              tutorName={quota.tutor_name || 'Tutor IA 24h'}
              onSeekTime={onSeekTime}
              onSelectRelatedLesson={handleSelectRelatedLesson}
              onFeedback={handleSubmitFeedback}
              onRequestDislikeFeedback={handleOpenFeedbackModal}
              onSaveToNotes={handleOpenSaveNoteModal}
              isLightBg={isLightBg}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões Rápidas Retráteis quando já existem mensagens */}
      {messages.length > 0 && suggestedQuestions.questions.length > 0 && (
        <div style={{ padding: '0 4px' }}>
          {showPromptChips ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPromptChips(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: subTextColor,
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Ocultar sugestões
                </button>
              </div>
              <TutorQuickPrompts
                questions={suggestedQuestions.questions.slice(0, 3)}
                hasCustomQa={suggestedQuestions.hasCustomQa}
                onSelectQuestion={handleSendMessage}
                disabled={loading || !quota.can_ask}
                isLightBg={isLightBg}
                tutorName={quota.tutor_name}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={() => setShowPromptChips(true)}
                data-testid="btn-toggle-quick-prompts"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(124, 58, 237, 0.1)',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(124, 58, 237, 0.25)',
                  color: isLightBg ? '#475569' : '#c084fc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={11} />
                <span>Ver dúvidas frequentes desta aula</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Digitação */}
      <TutorInputBar
        onSendMessage={handleSendMessage}
        loading={loading}
        canAsk={quota.can_ask}
        remainingQuestions={quota.remaining_free}
        totalLimit={quota.total_monthly_limit}
        isSubscriber={quota.is_active}
        isLightBg={isLightBg}
        isInMaintenance={quota.is_in_maintenance}
      />

      {/* Modal Centralizado de Justificativa para Avaliação Negativa (Dislike) */}
      <TutorFeedbackModal
        isOpen={feedbackModalTarget.isOpen}
        messageId={feedbackModalTarget.messageId}
        onClose={handleCloseFeedbackModal}
        onSubmitFeedback={handleSubmitFeedback}
        isLightBg={isLightBg}
      />

      {/* Modal Centralizado de Edição e Criação de Anotação da Aula */}
      <TutorSaveNoteModal
        isOpen={saveNoteModalTarget.isOpen}
        initialContent={saveNoteModalTarget.content}
        courseId={courseId}
        lessonId={lessonId}
        onClose={handleCloseSaveNoteModal}
        isLightBg={isLightBg}
      />

      {/* Modal Centralizado de Exportação da Conversa (Markdown e PDF) */}
      <TutorExportChatModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        tutorName={quota.tutor_name}
        isLightBg={isLightBg}
      />

      {/* Modal de Confirmação para Acessar Aula Recomendada */}
      <TutorConfirmNavigateLessonModal
        isOpen={Boolean(pendingNavigateLesson)}
        targetLesson={pendingNavigateLesson}
        onClose={() => setPendingNavigateLesson(null)}
        onConfirm={handleConfirmNavigateLesson}
        isLightBg={isLightBg}
      />

      {/* Modal de Confirmação para Limpeza do Histórico */}
      <TutorClearHistoryModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearHistory}
        loading={clearingHistory}
        isLightBg={isLightBg}
      />
    </div>
  );
}
