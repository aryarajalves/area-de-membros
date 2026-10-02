import { Plus, Trash2, CheckCircle2, AlertCircle, HelpCircle, Award } from 'lucide-react';

export default function LessonQuizEditor({
  questions = [],
  onChangeQuestions,
  passingScorePct = 70,
  onChangePassingScorePct,
  isLightBg = false
}) {
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';
  const cardBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const inputBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.6)';

  const handleAddQuestion = () => {
    const newQ = {
      question: '',
      points: 1,
      explanation: '',
      order_index: questions.length,
      options: [
        { option_text: '', is_correct: true, order_index: 0 },
        { option_text: '', is_correct: false, order_index: 1 }
      ]
    };
    onChangeQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    const updated = questions.filter((_, idx) => idx !== qIndex);
    onChangeQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex, text) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], question: text };
    onChangeQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    const targetQ = updated[qIndex];
    const newOptions = [
      ...targetQ.options,
      {
        option_text: '',
        is_correct: targetQ.options.length === 0,
        order_index: targetQ.options.length
      }
    ];
    updated[qIndex] = { ...targetQ, options: newOptions };
    onChangeQuestions(updated);
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const updated = [...questions];
    const targetQ = updated[qIndex];
    if (targetQ.options.length <= 2) return; // Mínimo de 2 opções

    const filtered = targetQ.options.filter((_, idx) => idx !== optIndex);
    // Se removeu a opção correta, define a primeira como correta
    const hasCorrect = filtered.some((o) => o.is_correct);
    if (!hasCorrect && filtered.length > 0) {
      filtered[0].is_correct = true;
    }
    updated[qIndex] = { ...targetQ, options: filtered };
    onChangeQuestions(updated);
  };

  const handleOptionTextChange = (qIndex, optIndex, text) => {
    const updated = [...questions];
    const targetQ = updated[qIndex];
    const newOptions = [...targetQ.options];
    newOptions[optIndex] = { ...newOptions[optIndex], option_text: text };
    updated[qIndex] = { ...targetQ, options: newOptions };
    onChangeQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    const updated = [...questions];
    const targetQ = updated[qIndex];
    const newOptions = targetQ.options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === optIndex
    }));
    updated[qIndex] = { ...targetQ, options: newOptions };
    onChangeQuestions(updated);
  };

  const handleQuestionPointsChange = (qIndex, points) => {
    const updated = [...questions];
    const val = parseInt(points, 10);
    updated[qIndex] = { ...updated[qIndex], points: isNaN(val) || val < 1 ? 1 : val };
    onChangeQuestions(updated);
  };

  const totalPoints = questions.reduce((sum, q) => sum + (parseInt(q.points, 10) || 1), 0);

  return (
    <div data-testid="lesson-quiz-editor" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700, color: textColor }}>
            Perguntas & Respostas do Quiz
          </h4>
          <p style={{ margin: 0, fontSize: '12.5px', color: subTextColor }}>
            Crie perguntas de múltipla escolha. Marque o círculo verde na opção correta de cada pergunta e defina sua pontuação.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddQuestion}
          className="secondary-btn"
          data-testid="add-quiz-question-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 12px' }}
        >
          <Plus size={14} />
          <span>Nova Pergunta</span>
        </button>
      </div>

      {/* Configurações Globais do Quiz: % Mínima de Aprovação e Total de Pontos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '14px 18px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          backgroundColor: isLightBg ? '#f8fafc' : 'rgba(168, 85, 247, 0.08)'
        }}
        data-testid="quiz-settings-bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '4px' }}>
              Porcentagem Mínima para Aprovação (%):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScorePct}
                onChange={(e) => onChangePassingScorePct && onChangePassingScorePct(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="form-control-modern"
                style={{ width: '80px', padding: '6px 10px', fontSize: '13px', textAlign: 'center' }}
                data-testid="quiz-passing-score-input"
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>%</span>
            </div>
          </div>
          <span style={{ fontSize: '11.5px', color: subTextColor, maxWidth: '340px' }}>
            O aluno só será aprovado e terá a aula concluída se atingir no mínimo esta porcentagem calculada sobre o total de pontos do quiz.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', backgroundColor: isLightBg ? '#ffffff' : 'rgba(255,255,255,0.06)', border: `1px solid ${borderColor}` }}>
          <Award size={15} color="#a855f7" />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: textColor }}>
            Total: <strong data-testid="quiz-total-points-display" style={{ color: '#a855f7' }}>{totalPoints} ponto{totalPoints === 1 ? '' : 's'}</strong> ({questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'})
          </span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            borderRadius: '10px',
            border: `1px dashed ${borderColor}`,
            backgroundColor: cardBg,
            color: subTextColor
          }}
        >
          <HelpCircle size={32} color="#a855f7" style={{ marginBottom: '8px', opacity: 0.6 }} />
          <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
            Nenhuma pergunta adicionada ao quiz ainda.
          </p>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="primary-btn"
            style={{ fontSize: '12.5px', padding: '6px 16px' }}
          >
            Adicionar Primeira Pergunta
          </button>
        </div>
      ) : (
        questions.map((q, qIdx) => (
          <div
            key={qIdx}
            data-testid={`editor-question-card-${qIdx}`}
            style={{
              padding: '18px',
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Cabeçalho da Pergunta com Pontos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#a855f7' }}>
                  Pergunta {qIdx + 1}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>
                    Vale:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={q.points || 1}
                    onChange={(e) => handleQuestionPointsChange(qIdx, e.target.value)}
                    className="form-control-modern"
                    style={{ width: '60px', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}
                    data-testid={`question-points-input-${qIdx}`}
                    title="Pontos / Peso desta pergunta no cálculo do resultado"
                  />
                  <span style={{ fontSize: '12px', color: subTextColor }}>
                    ponto{(q.points || 1) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveQuestion(qIdx)}
                data-testid={`remove-question-btn-${qIdx}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
              >
                <Trash2 size={14} />
                <span>Excluir Pergunta</span>
              </button>
            </div>

            {/* Enunciado */}
            <div>
              <input
                type="text"
                value={q.question || ''}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                placeholder="Ex: Qual o principal benefício do clean code no frontend?"
                data-testid={`question-input-${qIdx}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: inputBg,
                  color: textColor,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Alternativas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>
                Alternativas (selecione a correta):
              </span>

              {(q.options || []).map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <div
                    key={optIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <button
                      type="button"
                      title={opt.is_correct ? 'Opção correta' : 'Marcar como opção correta'}
                      onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                      data-testid={`set-correct-opt-${qIdx}-${optIdx}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircle2
                        size={18}
                        color={opt.is_correct ? '#10b981' : subTextColor}
                        style={{ opacity: opt.is_correct ? 1 : 0.4 }}
                      />
                    </button>

                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: opt.is_correct ? '#10b981' : subTextColor, minWidth: '18px' }}>
                      {letter})
                    </span>

                    <input
                      type="text"
                      value={opt.option_text || ''}
                      onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                      placeholder={`Alternativa ${letter}...`}
                      data-testid={`opt-input-${qIdx}-${optIdx}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        border: opt.is_correct ? '1.5px solid #10b981' : `1px solid ${borderColor}`,
                        backgroundColor: inputBg,
                        color: textColor,
                        boxSizing: 'border-box'
                      }}
                    />

                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIdx, optIdx)}
                        data-testid={`remove-opt-${qIdx}-${optIdx}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleAddOption(qIdx)}
                  data-testid={`add-opt-btn-${qIdx}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a855f7',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 0'
                  }}
                >
                  <Plus size={13} />
                  <span>Adicionar mais uma alternativa</span>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
