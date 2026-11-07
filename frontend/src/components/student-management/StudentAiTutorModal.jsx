import React, { useState, useEffect } from 'react';
import { Bot, X, Save, Sparkles, Coins, HelpCircle, Check, Loader2 } from 'lucide-react';
import StudentAiTutorMessagesTab from './StudentAiTutorMessagesTab';
import { useToast } from '../../context/ToastContext';

export default function StudentAiTutorModal({
  isOpen,
  onClose,
  student,
  isLightBg = false,
  onStudentUpdated
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({
    ai_tutor_active: false,
    ai_tutor_expires_at: null,
    ai_tutor_custom_monthly_limit: null,
    used_this_month: 0,
    cost_this_month_brl: 0.0,
    total_cost_all_time_brl: 0.0,
    total_questions_all_time: 0,
    can_ask: true
  });

  const [activeToggle, setActiveToggle] = useState(false);
  const [limitType, setLimitType] = useState('global'); // 'global' | 'custom' | 'vip'
  const [customLimitValue, setCustomLimitValue] = useState(10);
  const [activeModalTab, setActiveModalTab] = useState('config'); // 'config' | 'messages'

  const { addToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    if (isOpen && student?.id) {
      fetchStudentDetails();
    }
  }, [isOpen, student?.id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/tutor-ia/students/${student.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        setActiveToggle(Boolean(data.ai_tutor_active));
        if (data.ai_tutor_custom_monthly_limit === -1) {
          setLimitType('vip');
        } else if (typeof data.ai_tutor_custom_monthly_limit === 'number') {
          setLimitType('custom');
          setCustomLimitValue(data.ai_tutor_custom_monthly_limit);
        } else {
          setLimitType('global');
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Tutor IA do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      let limitToSave = null;
      if (limitType === 'vip') {
        limitToSave = -1;
      } else if (limitType === 'custom') {
        limitToSave = parseInt(customLimitValue) || 0;
      } else {
        limitToSave = null;
      }

      const res = await fetch(`/api/v1/tutor-ia/students/${student.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ai_tutor_active: activeToggle,
          ai_tutor_custom_monthly_limit: limitToSave
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar acesso do aluno.');
      }

      addToast('Acesso do aluno ao Tutor IA atualizado!', 'success');
      if (onStudentUpdated) onStudentUpdated();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar aluno no Tutor IA:', err);
      addToast(err.message || 'Erro ao atualizar dados.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const bgModal = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      data-testid="student-ai-tutor-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: bgModal,
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
                Tutor IA: {student?.name || student?.full_name}
              </h3>
              <span style={{ fontSize: '12px', color: subTextColor }}>
                {student?.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-tutor-modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas: Cota vs Conversas */}
        <div
          data-testid="student-modal-tabs"
          style={{
            display: 'flex',
            borderBottom: `1px solid ${borderColor}`,
            padding: '0 22px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveModalTab('config')}
            data-testid="tab-student-config"
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeModalTab === 'config' ? '2px solid #7c3aed' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeModalTab === 'config' ? (isLightBg ? '#7c3aed' : '#c084fc') : subTextColor,
              fontSize: '13px',
              fontWeight: activeModalTab === 'config' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            ⚙️ Cota & Acesso
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('messages')}
            data-testid="tab-student-messages"
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeModalTab === 'messages' ? '2px solid #7c3aed' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeModalTab === 'messages' ? (isLightBg ? '#7c3aed' : '#c084fc') : subTextColor,
              fontSize: '13px',
              fontWeight: activeModalTab === 'messages' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            💬 Conversas ({details.total_questions_all_time || 0})
          </button>
        </div>

        {/* Corpo */}
        {activeModalTab === 'messages' ? (
          <div style={{ padding: '20px 22px', maxHeight: '460px', overflowY: 'auto' }}>
            <StudentAiTutorMessagesTab studentId={student?.id} isLightBg={isLightBg} />
          </div>
        ) : (
          <>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <span>Carregando métricas do aluno...</span>
            </div>
          ) : (
            <>
              {/* Cards de Métricas de Consumo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${borderColor}`
                  }}
                >
                  <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>
                    Perguntas no Mês
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginTop: '2px' }}>
                    {details.used_this_month}
                  </div>
                  <span style={{ fontSize: '11px', color: subTextColor }}>
                    Total histórico: {details.total_questions_all_time}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${borderColor}`
                  }}
                >
                  <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>
                    Custo Consumido na API
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    R$ {Number(details.cost_this_month_brl || 0).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '11px', color: subTextColor }}>
                    Total histórico: R$ {Number(details.total_cost_all_time_brl || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Toggle de Assinatura */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: textColor, display: 'block' }}>
                    Assinatura do Tutor IA Ativa
                  </strong>
                  <span style={{ fontSize: '12px', color: subTextColor }}>
                    Libera acesso ilimitado sem bloqueio por cota
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={activeToggle}
                  onChange={(e) => setActiveToggle(e.target.checked)}
                  data-testid="toggle-student-ai-active"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7c3aed' }}
                />
              </div>

              {/* Tipo de Limite / Cota */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
                  Regra de Cota Mensal:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: textColor }}>
                    <input
                      type="radio"
                      name="limitType"
                      checked={limitType === 'global'}
                      onChange={() => setLimitType('global')}
                      data-testid="radio-limit-global"
                      style={{ accentColor: '#7c3aed' }}
                    />
                    <span>Seguir cota global padrão da plataforma (3 perguntas/mês)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: textColor }}>
                    <input
                      type="radio"
                      name="limitType"
                      checked={limitType === 'custom'}
                      onChange={() => setLimitType('custom')}
                      data-testid="radio-limit-custom"
                      style={{ accentColor: '#7c3aed' }}
                    />
                    <span>Definir cota personalizada:</span>
                    {limitType === 'custom' && (
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={customLimitValue}
                        onChange={(e) => setCustomLimitValue(e.target.value)}
                        data-testid="input-student-custom-limit"
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${borderColor}`,
                          backgroundColor: isLightBg ? '#fff' : 'rgba(0,0,0,0.3)',
                          color: textColor,
                          fontSize: '12px'
                        }}
                      />
                    )}
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: textColor }}>
                    <input
                      type="radio"
                      name="limitType"
                      checked={limitType === 'vip'}
                      onChange={() => setLimitType('vip')}
                      data-testid="radio-limit-vip"
                      style={{ accentColor: '#7c3aed' }}
                    />
                    <span>Acesso VIP Ilimitado Permanente (Cortesia)</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé com 1 botão Cancelar + 1 botão Salvar */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-cancel-student-tutor-modal"
            style={{
              padding: '8px 16px',
              borderRadius: '7px',
              backgroundColor: 'transparent',
              border: `1px solid ${borderColor}`,
              color: subTextColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            data-testid="btn-save-student-tutor-modal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '7px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Salvar Alterações</span>
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
