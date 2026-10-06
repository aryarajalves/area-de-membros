import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, Send, AlertCircle } from 'lucide-react';
import LessonComments from './LessonComments';
import LessonNotes from './LessonNotes';
import {
  QuizHeaderBanner,
  QuizResultBanner,
  QuizQuestionCard,
  QuizNavigationFooter
} from './quiz';

export default function LessonQuizViewer({
  lesson,
  courseTitle,
  moduleTitle,
  courseId,
  moduleId,
  currentUser,
  prevLesson,
  nextLesson,
  onSelectLesson,
  isCompleted = false,
  onToggleComplete,
  isLightBg = false,
  onCloseModule,
  onEditLesson,
  rightSidebar
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('quiz');

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.03)';

  const fetchQuiz = async () => {
    if (!lesson?.id || !courseId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lesson.id}/quiz`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizData(data);
        if (data.last_submission) {
          setSubmissionResult(data.last_submission);
          if (data.last_submission.answers_json) {
            try {
              setSelectedAnswers(JSON.parse(data.last_submission.answers_json));
            } catch (e) {
              // ignore json parse error
            }
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'Não foi possível carregar as perguntas do quiz.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao carregar o quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    setSubmissionResult(null);
    setSelectedAnswers({});
  }, [lesson?.id, courseId]);

  const handleSelectOption = (questionId, optionId) => {
    if (submitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData?.questions || quizData.questions.length === 0) return;

    const unanswered = quizData.questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setErrorMsg(`Por favor, responda todas as perguntas antes de enviar. Faltam ${unanswered.length} pergunta(s).`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lesson.id}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: selectedAnswers })
      });

      if (res.ok) {
        const result = await res.json();
        setSubmissionResult(result);
        if (result.passed && onToggleComplete && !isCompleted) {
          onToggleComplete();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'Erro ao processar o envio do quiz.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao enviar o quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryQuiz = () => {
    setSubmissionResult(null);
    setSelectedAnswers({});
    setErrorMsg('');
  };

  const questions = quizData?.questions || [];
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const passingScore = quizData?.passing_score_pct !== undefined && quizData?.passing_score_pct !== null
    ? quizData.passing_score_pct
    : (lesson?.passing_score_pct !== undefined && lesson?.passing_score_pct !== null ? lesson.passing_score_pct : 70);

  return (
    <div data-testid="lesson-quiz-viewer-container" style={{ width: '100%' }}>
      {/* Banner Superior do Quiz */}
      <QuizHeaderBanner
        lesson={lesson}
        courseTitle={courseTitle}
        moduleTitle={moduleTitle}
        passingScore={passingScore}
        isManager={isManager}
        onEditLesson={onEditLesson}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
        borderColor={borderColor}
      />

      {/* Grid Principal */}
      <div
        className="classroom-layout-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 320px' : '1fr',
          gap: '40px',
          alignItems: 'start'
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Navegação de Abas */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: `1px solid ${borderColor}`,
              marginBottom: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'quiz' ? 700 : 500,
                color: activeTab === 'quiz' ? '#a855f7' : subTextColor,
                borderBottom: activeTab === 'quiz' ? '2px solid #a855f7' : '2px solid transparent'
              }}
              data-testid="tab-quiz-btn"
            >
              <HelpCircle size={16} />
              <span>Perguntas do Quiz ({questions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'comments' ? 700 : 500,
                color: activeTab === 'comments' ? '#a855f7' : subTextColor,
                borderBottom: activeTab === 'comments' ? '2px solid #a855f7' : '2px solid transparent'
              }}
              data-testid="tab-comments-btn"
            >
              <span>Dúvidas & Comentários</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'notes' ? 700 : 500,
                color: activeTab === 'notes' ? '#a855f7' : subTextColor,
                borderBottom: activeTab === 'notes' ? '2px solid #a855f7' : '2px solid transparent'
              }}
              data-testid="tab-notes-btn"
            >
              <span>Minhas Anotações</span>
            </button>
          </div>

          {activeTab === 'quiz' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
                  <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                  <p>Carregando perguntas do Quiz...</p>
                </div>
              ) : questions.length === 0 ? (
                <div
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: '14px',
                    border: `1px dashed ${borderColor}`,
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: subTextColor
                  }}
                  data-testid="empty-quiz-notice"
                >
                  <HelpCircle size={44} color="#a855f7" style={{ marginBottom: '14px', opacity: 0.7 }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: textColor, margin: '0 0 8px 0' }}>
                    Nenhuma pergunta cadastrada
                  </h3>
                  <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '13.5px' }}>
                    O administrador ainda está elaborando as perguntas deste quiz. Volte em breve!
                  </p>
                </div>
              ) : (
                <div>
                  {/* Painel de Resultado caso já tenha submetido */}
                  <QuizResultBanner
                    submissionResult={submissionResult}
                    passingScore={passingScore}
                    onRetry={handleRetryQuiz}
                    isLightBg={isLightBg}
                    textColor={textColor}
                    subTextColor={subTextColor}
                    borderColor={borderColor}
                  />

                  {errorMsg && (
                    <div
                      data-testid="quiz-error-banner"
                      style={{
                        marginBottom: '20px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Lista de Perguntas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {questions.map((q, qIndex) => (
                      <QuizQuestionCard
                        key={q.id}
                        question={q}
                        qIndex={qIndex}
                        selectedOptionId={selectedAnswers[q.id]}
                        onSelectOption={handleSelectOption}
                        submitting={submitting}
                        isLightBg={isLightBg}
                        cardBg={cardBg}
                        textColor={textColor}
                        subTextColor={subTextColor}
                        borderColor={borderColor}
                      />
                    ))}
                  </div>

                  {/* Botão de Envio */}
                  <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="primary-btn"
                      data-testid="submit-quiz-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 28px',
                        fontSize: '14px',
                        fontWeight: 700,
                        backgroundColor: '#a855f7',
                        borderColor: '#a855f7',
                        boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)'
                      }}
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Validando Respostas...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Enviar Respostas do Quiz</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <LessonComments
              courseId={courseId}
              moduleId={moduleId}
              lessonId={lesson.id}
              currentUser={currentUser}
              isLightBg={isLightBg}
            />
          )}

          {activeTab === 'notes' && (
            <LessonNotes
              courseId={courseId}
              lessonId={lesson.id}
              isLightBg={isLightBg}
            />
          )}

          {/* Navegação Entre Aulas */}
          <QuizNavigationFooter
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onSelectLesson={onSelectLesson}
            borderColor={borderColor}
          />
        </div>

        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    </div>
  );
}
