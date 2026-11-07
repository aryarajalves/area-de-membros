import React, { useState, useEffect } from 'react';
import { Bot, Save, RotateCcw, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ExpandableTextarea from '../common/ExpandableTextarea';
import TutorAccessModeSection from './TutorAccessModeSection';
import TutorGuidelinesSection from './TutorGuidelinesSection';

const PROMPT_VARIABLES = [
  { tag: '{nome_tutor}', desc: 'Nome de exibição do tutor' },
  { tag: '{nome_aluno}', desc: 'Nome do aluno logado' },
  { tag: '{curso_atual}', desc: 'Título do curso atual' },
  { tag: '{aula_atual}', desc: 'Título da aula atual' },
  { tag: '{outros_cursos_aluno}', desc: 'Outros cursos adquiridos pelo aluno' },
  { tag: '{cursos_nao_adquiridos}', desc: 'Cursos disponíveis para upsell' },
];

export default function TutorSettingsForm({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState({
    tutor_name: 'Tutor IA 24h',
    default_monthly_free_questions: 3,
    system_prompt: '',
    temperature: 0.3,
    model_name: 'gpt-4o-mini',
    is_enabled: true,
    sales_checkout_url: '',
    monthly_price_brl: 10.0,
    rag_top_k: 4,
    rag_min_similarity: 0.35,
    access_mode: 'public',
    maintenance_message: '',
    allowed_topics: '',
    prohibited_topics: '',
    redirect_app_url: '',
    redirect_app_name: '',
    prohibited_response_guideline: ''
  });

  const { addToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/tutor-ia/settings', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          tutor_name: data.tutor_name || 'Tutor IA 24h',
          default_monthly_free_questions: data.default_monthly_free_questions ?? 3,
          system_prompt: data.system_prompt || '',
          temperature: data.temperature ?? 0.3,
          model_name: data.model_name || 'gpt-4o-mini',
          is_enabled: data.is_enabled ?? true,
          sales_checkout_url: data.sales_checkout_url || '',
          monthly_price_brl: data.monthly_price_brl ?? 10.0,
          rag_top_k: data.rag_top_k ?? 4,
          rag_min_similarity: data.rag_min_similarity ?? 0.35,
          access_mode: data.access_mode || 'public',
          maintenance_message: data.maintenance_message || '',
          allowed_topics: data.allowed_topics || '',
          prohibited_topics: data.prohibited_topics || '',
          redirect_app_url: data.redirect_app_url || '',
          redirect_app_name: data.redirect_app_name || '',
          prohibited_response_guideline: data.prohibited_response_guideline || ''
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações do Tutor IA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...settings,
        default_monthly_free_questions:
          settings.default_monthly_free_questions === ''
            ? 3
            : parseInt(settings.default_monthly_free_questions, 10) || 0,
        monthly_price_brl:
          settings.monthly_price_brl === ''
            ? 10.0
            : parseFloat(String(settings.monthly_price_brl).replace(',', '.')) || 0.0,
        rag_top_k:
          settings.rag_top_k === ''
            ? 4
            : Math.max(1, Math.min(15, parseInt(settings.rag_top_k, 10) || 4)),
        rag_min_similarity:
          settings.rag_min_similarity === ''
            ? 0.35
            : Math.max(0.05, Math.min(0.95, parseFloat(String(settings.rag_min_similarity).replace(',', '.')) || 0.35))
      };
      const res = await fetch('/api/v1/tutor-ia/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao salvar configurações.');
      }
      const updated = await res.json();
      setSettings((prev) => ({ ...prev, ...updated }));
      addToast('Configurações do Tutor IA salvas com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao salvar configurações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPrompt = async () => {
    if (!window.confirm('Deseja realmente restaurar o Prompt de Sistema padrão de fábrica?')) return;
    try {
      setResetting(true);
      const res = await fetch('/api/v1/tutor-ia/settings/reset-prompt', { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, system_prompt: data.system_prompt }));
        addToast('Prompt padrão restaurado com sucesso!', 'info');
      }
    } catch (err) {
      console.error('Erro ao resetar prompt:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleInsertTag = (tag) => {
    setSettings((prev) => ({
      ...prev,
      system_prompt: prev.system_prompt ? `${prev.system_prompt} ${tag}` : tag
    }));
    addToast(`Tag ${tag} inserida no prompt!`, 'info');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: subTextColor }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
        <span>Carregando configurações do Tutor IA...</span>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: cardBorder,
    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
    color: textColor,
    fontSize: '13.5px',
    outline: 'none'
  };

  return (
    <form
      onSubmit={handleSave}
      data-testid="tutor-settings-form"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '860px', margin: '0 auto' }}
    >
      {/* Card 1: Status Geral e Precificação */}
      <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder, display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
                Tutor IA Interativo da Plataforma
              </h3>
              <span style={{ fontSize: '12.5px', color: subTextColor }}>
                Gerencie regras de negócio, limites de degustação e precificação do tutor
              </span>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.is_enabled}
              onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
              data-testid="checkbox-tutor-enabled"
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7c3aed' }}
            />
            <span>Tutor IA Ativo na Sala de Aula</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Nome de Exibição do Tutor:
            </label>
            <input
              type="text"
              maxLength={100}
              value={settings.tutor_name}
              onChange={(e) => setSettings({ ...settings, tutor_name: e.target.value })}
              placeholder="Ex: Tutor IA 24h, Sofia - Tutora IA..."
              data-testid="input-tutor-name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Perguntas Gratuitas / Mês (Degustação):
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.default_monthly_free_questions ?? ''}
              onChange={(e) => setSettings({ ...settings, default_monthly_free_questions: e.target.value })}
              data-testid="input-free-questions"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Valor da Assinatura Mensal (R$):
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={settings.monthly_price_brl ?? ''}
              onChange={(e) => setSettings({ ...settings, monthly_price_brl: e.target.value })}
              data-testid="input-monthly-price"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Modelo de IA:
            </label>
            <select
              value={settings.model_name}
              onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
              data-testid="select-model-name"
              style={{ ...inputStyle, backgroundColor: isLightBg ? '#f8fafc' : '#1e293b', cursor: 'pointer' }}
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Ultra Rápido e Econômico)</option>
              <option value="gpt-4o">GPT-4o (Avançado - Maior Profundidade)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Itens do RAG por Pergunta (Top-K):
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={settings.rag_top_k ?? ''}
              onChange={(e) => setSettings({ ...settings, rag_top_k: e.target.value })}
              data-testid="input-rag-top-k"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Similaridade Mínima de Corte (RAG):
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.35"
              value={settings.rag_min_similarity ?? ''}
              onChange={(e) => setSettings({ ...settings, rag_min_similarity: e.target.value })}
              data-testid="input-rag-min-similarity"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
            Link da Página de Checkout / Assinatura (Hotmart ou Checkout Próprio):
          </label>
          <input
            type="url"
            value={settings.sales_checkout_url}
            onChange={(e) => setSettings({ ...settings, sales_checkout_url: e.target.value })}
            placeholder="https://pay.hotmart.com/... ou link de pagamento"
            data-testid="input-checkout-url"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Card 2: Modo de Acesso & Visibilidade (Liberado, Manutenção, Privado) */}
      <TutorAccessModeSection
        accessMode={settings.access_mode}
        onChangeAccessMode={(mode) => setSettings({ ...settings, access_mode: mode })}
        maintenanceMessage={settings.maintenance_message}
        onChangeMaintenanceMessage={(msg) => setSettings({ ...settings, maintenance_message: msg })}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
      />

      {/* Card: Diretrizes e Regras de Conduta (Permitido vs Proibido) */}
      <TutorGuidelinesSection
        allowedTopics={settings.allowed_topics}
        onChangeAllowedTopics={(val) => setSettings({ ...settings, allowed_topics: val })}
        prohibitedTopics={settings.prohibited_topics}
        onChangeProhibitedTopics={(val) => setSettings({ ...settings, prohibited_topics: val })}
        redirectAppUrl={settings.redirect_app_url}
        onChangeRedirectAppUrl={(val) => setSettings({ ...settings, redirect_app_url: val })}
        redirectAppName={settings.redirect_app_name}
        onChangeRedirectAppName={(val) => setSettings({ ...settings, redirect_app_name: val })}
        prohibitedResponseGuideline={settings.prohibited_response_guideline}
        onChangeProhibitedResponseGuideline={(val) => setSettings({ ...settings, prohibited_response_guideline: val })}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        cardBorder={cardBorder}
      />

      {/* Card 3: Personalidade e Prompt de Sistema */}
      <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
              Instruções de Personalidade & Prompt de Sistema
            </h4>
            <span style={{ fontSize: '12.5px', color: subTextColor }}>
              Defina o tom de voz, regras de resposta e comportamento pedagógico do tutor.
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetPrompt}
            disabled={resetting}
            data-testid="btn-reset-prompt"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '7px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: textColor,
              fontSize: '12px',
              fontWeight: 600,
              cursor: resetting ? 'not-allowed' : 'pointer'
            }}
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            <span>Restaurar Prompt Padrão</span>
          </button>
        </div>

        {/* Variáveis Dinâmicas */}
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: subTextColor, marginBottom: '8px' }}>
            <Sparkles size={13} color="#a855f7" /> Variáveis dinâmicas disponíveis (clique para inserir):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PROMPT_VARIABLES.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertTag(v.tag)}
                title={v.desc}
                data-testid={`btn-tag-${v.tag.replace(/[{}]/g, '')}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isLightBg ? '#ede9fe' : 'rgba(124, 58, 237, 0.15)',
                  border: isLightBg ? '1px solid #ddd6fe' : '1px solid rgba(124, 58, 237, 0.3)',
                  color: isLightBg ? '#6d28d9' : '#c084fc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <code>{v.tag}</code>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea Expansível para o Prompt do Sistema */}
        <ExpandableTextarea
          id="system_prompt"
          name="system_prompt"
          value={settings.system_prompt}
          onChange={(val) => setSettings({ ...settings, system_prompt: val })}
          label="Prompt Mestre de Instruções:"
          rows={7}
          cardBorder={cardBorder}
          cardBg={cardBg}
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
          testId="textarea-system-prompt"
          placeholder="Escreva aqui as diretrizes completas de comportamento da IA..."
        />

        {/* Controle de Temperatura */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
              Temperatura / Criatividade ({settings.temperature}):
            </label>
            <span style={{ fontSize: '11.5px', color: subTextColor }}>
              {settings.temperature <= 0.3 ? 'Foco Máximo e Precisão (Recomendado)' : 'Mais Conversacional'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.temperature}
            onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
            data-testid="slider-temperature"
            style={{ width: '100%', cursor: 'pointer', accentColor: '#7c3aed' }}
          />
        </div>
      </div>

      {/* Botão de Salvar no Rodapé */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
        <button
          type="submit"
          disabled={saving}
          data-testid="btn-save-tutor-settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 24px',
            borderRadius: '9px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Salvar Configurações</span>
        </button>
      </div>
    </form>
  );
}
