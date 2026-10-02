import React, { useState, useEffect } from 'react';
import {
  HelpCircle, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, Award, Send, BookOpen, Clock
} from 'lucide-react';
import LessonComments from './LessonComments';
import LessonNotes from './LessonNotes';

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
    // Permite alterar se não estiver submetendo
    if (submitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData?.questions || quizData.questions.length === 0) return;

    // Verificar se todas foram respondidas
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
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto 32px auto',
          borderRadius: '16px',
          padding: '36px 32px',
          background: isLightBg
            ? 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)'
            : 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.88) 100%)',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#c084fc',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}
          >
            <HelpCircle size={13} />
            <span>Quiz Interativo de Conhecimento</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              color: subTextColor,
              fontSize: '11.5px',
              fontWeight: 600
            }}
          >
            <Award size={12} />
            <span>Aprovação com {passingScore}%</span>
          </div>
        </div>

        <h1
          data-testid="quiz-lesson-title"
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: textColor,
            margin: '0 0 14px 0',
            lineHeight: 1.3
          }}
        >
          {lesson.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingTop: '18px', borderTop: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: subTextColor }}>
            <span>Curso: <strong style={{ color: textColor }}>{courseTitle}</strong></span>
            <span>•</span>
            <span>Módulo: <strong style={{ color: textColor }}>{moduleTitle}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isManager && onEditLesson && (
              <button
                type="button"
                onClick={() => onEditLesson(lesson)}
                className="secondary-btn"
                style={{ fontSize: '12.5px', padding: '8px 14px' }}
                data-testid="edit-quiz-lesson-btn"
              >
                Configurar Perguntas do Quiz
              </button>
            )}
          </div>
        </div>
      </div>

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
                  {submissionResult && (
                    <div
                      data-testid="quiz-result-banner"
                      style={{
                        marginBottom: '28px',
                        padding: '24px',
                        borderRadius: '14px',
                        border: submissionResult.passed ? '1.5px solid #10b981' : '1.5px solid #f59e0b',
                        backgroundColor: submissionResult.passed
                          ? (isLightBg ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)')
                          : (isLightBg ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {submissionResult.passed ? (
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={26} color="#10b981" />
                          </div>
                        ) : (
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={26} color="#f59e0b" />
                          </div>
                        )}

                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: textColor }}>
                            {submissionResult.passed ? 'Parabéns! Você foi Aprovado no Quiz 🎉' : 'Quase lá! Tente Novamente'}
                          </h4>
                          <p style={{ margin: 0, fontSize: '13.5px', color: subTextColor }}>
                            Você acertou <strong>{submissionResult.correct_answers}</strong> de <strong>{submissionResult.total_questions}</strong> perguntas ({submissionResult.score}%).
                            {submissionResult.total_points ? (
                              <span> Pontuação: <strong>{submissionResult.earned_points || 0}</strong> de <strong>{submissionResult.total_points}</strong> pontos.</span>
                            ) : null}
                            {submissionResult.passed ? ' Aula concluída com sucesso!' : ` Necessário no mínimo ${passingScore}% para aprovação.`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRetryQuiz}
                        data-testid="retry-quiz-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1px solid ${borderColor}`,
                          backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                          color: textColor
                        }}
                      >
                        <RefreshCw size={14} />
                        <span>Refazer Quiz</span>
                      </button>
                    </div>
                  )}

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
                    {questions.map((q, qIndex) => {
                      const selectedOptionId = selectedAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          data-testid={`quiz-question-card-${q.id}`}
                          style={{
                            backgroundColor: cardBg,
                            borderRadius: '14px',
                            border: `1px solid ${borderColor}`,
                            padding: '24px',
                            transition: 'border-color 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flex: 1 }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(168, 85, 247, 0.18)',
                                  color: '#c084fc',
                                  fontSize: '12.5px',
                                  fontWeight: 800,
                                  flexShrink: 0
                                }}
                              >
                                {qIndex + 1}
                              </span>
                              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: textColor, lineHeight: 1.5 }}>
                                {q.question}
                              </h3>
                            </div>
                            <span
                              data-testid={`question-points-badge-${q.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#a855f7',
                                backgroundColor: isLightBg ? '#f3e8ff' : 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.25)',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              {q.points || 1} {(q.points || 1) === 1 ? 'ponto' : 'pontos'}
                            </span>
                          </div>

                          {/* Alternativas */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingLeft: '36px' }}>
                            {(q.options || []).map((opt, optIndex) => {
                              const isSelected = selectedOptionId === opt.id;
                              const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...

                              return (
                                <label
                                  key={opt.id}
                                  data-testid={`option-label-${opt.id}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    border: isSelected ? '1.5px solid #a855f7' : `1px solid ${borderColor}`,
                                    backgroundColor: isSelected
                                      ? (isLightBg ? '#faf5ff' : 'rgba(168, 85, 247, 0.12)')
                                      : (isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)'),
                                    color: isSelected ? (isLightBg ? '#7e22ce' : '#e9d5ff') : textColor,
                                    fontSize: '13.5px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt.id}
                                    checked={isSelected}
                                    onChange={() => handleSelectOption(q.id, opt.id)}
                                    disabled={submitting}
                                    style={{ accentColor: '#a855f7', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontWeight: 700, color: isSelected ? '#a855f7' : subTextColor, minWidth: '18px' }}>
                                    {letter})
                                  </span>
                                  <span style={{ flex: 1 }}>{opt.option_text}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: `1px solid ${borderColor}`
            }}
          >
            {prevLesson ? (
              <button
                type="button"
                onClick={() => onSelectLesson(prevLesson)}
                className="secondary-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                data-testid="prev-lesson-btn"
              >
                <ChevronLeft size={16} />
                <span>Aula Anterior: {prevLesson.title}</span>
              </button>
            ) : <div />}

            {nextLesson && (
              <button
                type="button"
                onClick={() => onSelectLesson(nextLesson)}
                className="primary-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                data-testid="next-lesson-btn"
              >
                <span>Próxima Aula: {nextLesson.title}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    </div>
  );
}
