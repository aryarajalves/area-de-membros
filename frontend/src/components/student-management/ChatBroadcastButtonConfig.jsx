import React, { useState, useEffect } from 'react';
import { MousePointerClick, ExternalLink, BookOpen, PlayCircle, Sparkles, GitBranch } from 'lucide-react';

export default function ChatBroadcastButtonConfig({
  enableButton,
  setEnableButton,
  buttonText,
  setButtonText,
  buttonUrl,
  setButtonUrl,
  buttonActionType,
  setButtonActionType,
  courses = [],
}) {
  const [funnels, setFunnels] = useState([]);

  useEffect(() => {
    if (!enableButton) return;
    const fetchFunnels = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/funnels', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          setFunnels(data);
        }
      } catch {
        // silencioso
      }
    };
    fetchFunnels();
  }, [enableButton]);
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: enableButton ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 16px',
        transition: 'all 0.2s ease',
      }}
      data-testid="broadcast-button-config-card"
    >
      {/* Cabeçalho com Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setEnableButton(!enableButton)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: enableButton ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: enableButton ? '#c4b5fd' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MousePointerClick size={17} />
          </div>
          <div>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f1f5f9', display: 'block' }}>
              Botão de Ação Interativo (CTA)
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Adicione um botão clicável junto à mensagem para guiar o aluno.
            </span>
          </div>
        </div>

        {/* Switch Visual */}
        <div
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: enableButton ? '#8b5cf6' : '#334155',
            position: 'relative',
            transition: 'background-color 0.2s ease',
          }}
          data-testid="toggle-broadcast-button"
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '3px',
              left: enableButton ? '21px' : '3px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>

      {/* Formulário Retrátil */}
      {enableButton && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Texto do Botão */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Texto do Botão:
            </label>
            <input
              type="text"
              placeholder="Ex: Acessar Curso, Entrar no Grupo VIP, Ver Oferta..."
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              maxLength={60}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.86rem',
                outline: 'none',
              }}
              data-testid="broadcast-button-text-input"
            />
          </div>

          {/* Tipo de Ação */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Tipo de Ação ao Clicar:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {[
                { id: 'url', label: 'Link Externo (URL)', icon: ExternalLink },
                { id: 'funnel', label: 'Disparar Funil', icon: GitBranch },
                { id: 'course', label: 'Abrir Curso', icon: BookOpen },
                { id: 'lesson', label: 'Abrir Aula', icon: PlayCircle },
              ].map((act) => {
                const isActSelected = buttonActionType === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setButtonActionType(act.id);
                      if (act.id === 'course' && courses.length > 0 && !buttonUrl) {
                        setButtonUrl(`/course/${courses[0].id}`);
                      } else if (act.id === 'funnel' && funnels.length > 0) {
                        setButtonUrl(String(funnels[0].id));
                      }
                    }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      backgroundColor: isActSelected ? 'rgba(139, 92, 246, 0.2)' : '#1e293b',
                      border: isActSelected ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isActSelected ? '#c4b5fd' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                    data-testid={`button-action-${act.id}-btn`}
                  >
                    <act.icon size={13} />
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Destino Baseado no Tipo */}
          {buttonActionType === 'url' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                URL de Destino:
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/pagina-ou-checkout"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                data-testid="broadcast-button-url-input"
              />
            </div>
          )}

          {buttonActionType === 'funnel' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Selecione o Funil para Disparar:
              </label>
              <select
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                data-testid="broadcast-button-funnel-select"
              >
                <option value="">Selecione o funil...</option>
                {funnels.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name} ({f.nodes_count || 1} nós)
                  </option>
                ))}
              </select>
            </div>
          )}

          {buttonActionType === 'course' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Selecione o Curso para Abrir:
              </label>
              <select
                value={buttonUrl.startsWith('/course/') ? buttonUrl.replace('/course/', '') : buttonUrl}
                onChange={(e) => setButtonUrl(`/course/${e.target.value}`)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                data-testid="broadcast-button-course-select"
              >
                <option value="">Selecione o curso...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {buttonActionType === 'lesson' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                ID ou Rota da Aula:
              </label>
              <input
                type="text"
                placeholder="Ex: 42 ou /lesson/42"
                value={buttonUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setButtonUrl(val.startsWith('/') ? val : `/lesson/${val}`);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                data-testid="broadcast-button-lesson-input"
              />
            </div>
          )}

          {/* Pré-visualização do Botão */}
          {buttonText.trim() && (
            <div
              style={{
                marginTop: '6px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px dashed rgba(139, 92, 246, 0.35)',
              }}
              data-testid="broadcast-button-preview"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#a78bfa', marginBottom: '8px', fontWeight: 600 }}>
                <Sparkles size={12} />
                Pré-visualização do Botão no Chat:
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                }}
              >
                <span>{buttonText}</span>
                {buttonActionType === 'url' ? (
                  <ExternalLink size={14} />
                ) : buttonActionType === 'funnel' ? (
                  <GitBranch size={14} />
                ) : (
                  <BookOpen size={14} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
