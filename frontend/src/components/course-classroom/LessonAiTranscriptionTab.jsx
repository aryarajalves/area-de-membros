import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, ExternalLink, Copy, Check, RefreshCw,
  Search, FileText, ListChecks, Loader2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function LessonAiTranscriptionTab({
  courseId,
  moduleId,
  lesson,
  currentUser,
  isLightBg = false
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { addToast } = useToast();
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.03)';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchTranscription = useCallback(async (isInitial = false) => {
    if (!lesson?.id || !courseId || !moduleId) return;
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/transcription`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao buscar transcrição da aula:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [courseId, moduleId, lesson?.id]);

  useEffect(() => {
    fetchTranscription(true);
  }, [fetchTranscription]);

  // Polling silencioso a cada 3s enquanto o status for 'processing' (sem recarregar tela inteira)
  useEffect(() => {
    if (data?.status === 'processing') {
      const timer = setInterval(() => {
        fetchTranscription(false);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [data?.status, fetchTranscription]);

  const handleTriggerTranscription = async () => {
    if (!isManager) return;
    try {
      setTranscribing(true);
      addToast('Processamento iniciado! A IA está transcrevendo e elaborando o resumo...', 'info');

      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/transcribe`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({})
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao iniciar transcrição do vídeo com IA.');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Erro ao processar transcrição:', err);
      addToast(err.message || 'Falha ao transcrever o vídeo com IA.', 'error');
    } finally {
      setTranscribing(false);
    }
  };

  const handleResetTranscription = async () => {
    if (!isManager) return;
    try {
      setTranscribing(false);
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/transcription`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      if (res.ok) {
        addToast('Processamento cancelado / reiniciado.', 'info');
        setData({ status: 'not_started', full_transcript: '' });
      }
    } catch (err) {
      console.error('Erro ao cancelar transcrição:', err);
    }
  };

  const handleCopyTranscript = () => {
    if (!data?.full_transcript) return;
    navigator.clipboard.writeText(data.full_transcript);
    setCopied(true);
    addToast('Transcrição copiada para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenHtmlDocument = () => {
    const htmlUrl = `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/transcription/html`;
    window.open(htmlUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: subTextColor, gap: '10px' }} data-testid="ai-transcription-loading">
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontSize: '14px' }}>Carregando dados da aula...</span>
      </div>
    );
  }

  const isCompleted = data?.status === 'completed' && data?.full_transcript;
  const isProcessing = transcribing || data?.status === 'processing';

  // Se falhou
  if (data?.status === 'failed' && !isProcessing) {
    return (
      <div
        data-testid="ai-transcription-failed"
        style={{
          marginTop: '20px',
          padding: '32px 24px',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backgroundColor: isLightBg ? '#fef2f2' : 'rgba(239, 68, 68, 0.05)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444', margin: 0 }}>
          Falha no Processamento da Transcrição
        </h4>
        <p style={{ fontSize: '13px', color: subTextColor, maxWidth: '480px', margin: 0 }}>
          {data.error_message || 'Ocorreu um erro ao processar o vídeo da aula. Verifique se o vídeo possui áudio válido e tente novamente.'}
        </p>
        {isManager && (
          <button
            type="button"
            data-testid="btn-retry-ai-transcription"
            onClick={handleTriggerTranscription}
            style={{
              padding: '8px 18px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  // Se não foi gerado ainda
  if (!isCompleted && !isProcessing) {
    return (
      <div
        data-testid="ai-transcription-empty"
        style={{
          marginTop: '20px',
          padding: '36px 24px',
          borderRadius: '12px',
          border: `1px dashed ${borderColor}`,
          backgroundColor: cardBg,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
          <Sparkles size={26} />
        </div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: textColor, margin: 0 }}>
          Transcrição & Resumo com IA
        </h4>
        <p style={{ fontSize: '13.5px', color: subTextColor, maxWidth: '480px', margin: 0, lineHeight: 1.6 }}>
          {isManager
            ? 'Transforme o vídeo desta aula em texto integral com o Whisper da OpenAI e gere um documento inteligente com os principais destaques pedagógicos.'
            : 'O resumo inteligente e a transcrição desta aula ainda não foram gerados pelo instrutor.'}
        </p>

        {isManager && (
          <button
            type="button"
            data-testid="btn-trigger-ai-transcription"
            onClick={handleTriggerTranscription}
            disabled={isProcessing}
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Sparkles size={16} />
            <span>Gerar Transcrição com IA</span>
          </button>
        )}
      </div>
    );
  }

  // Estado de Processamento com animação giratória garantida e etapas dinâmicas
  if (isProcessing) {
    return (
      <div
        data-testid="ai-transcription-processing"
        style={{
          marginTop: '20px',
          padding: '48px 24px',
          borderRadius: '14px',
          border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.35)',
          backgroundColor: isLightBg ? '#f0f9ff' : 'rgba(59, 130, 246, 0.04)',
          boxShadow: isLightBg ? '0 10px 25px -5px rgba(59, 130, 246, 0.1)' : '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}
      >
        {/* Spinner giratório cinematográfico com brilho e anéis */}
        <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: '#3b82f6',
              borderRightColor: '#60a5fa',
              animation: 'spin 1s linear infinite'
            }}
            data-testid="ai-loading-spinner-ring"
          />
          <Sparkles size={26} color="#3b82f6" style={{ animation: 'spin 4s linear infinite reverse' }} />
        </div>

        <div>
          <h4 style={{ fontSize: '17px', fontWeight: 700, color: textColor, margin: '0 0 8px 0' }}>
            Processando Transcrição e Resumo com IA...
          </h4>
          <p style={{ fontSize: '13.5px', color: subTextColor, margin: '0 auto', maxWidth: '480px', lineHeight: 1.6 }}>
            A Inteligência Artificial está ouvindo o áudio da aula, gerando o texto completo e criando o resumo executivo com os principais tópicos. Isso pode levar alguns segundos.
          </p>
        </div>

        {/* Barra de progresso animada com gradiente */}
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            height: '6px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
              animation: 'shimmer 1.8s ease-in-out infinite alternate',
              position: 'absolute'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isLightBg ? '#2563eb' : '#60a5fa', fontWeight: 600 }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Extraindo áudio • Whisper-1 • GPT-4o-mini</span>
        </div>

        {isManager && (
          <button
            type="button"
            data-testid="btn-cancel-transcription"
            onClick={handleResetTranscription}
            style={{
              marginTop: '4px',
              padding: '6px 14px',
              backgroundColor: 'transparent',
              color: subTextColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancelar / Reiniciar
          </button>
        )}
      </div>
    );
  }

  // Filtragem da transcrição pelo termo de busca
  const filteredTranscript = searchTerm.trim()
    ? data.full_transcript.split('\n').filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase())).join('\n')
    : data.full_transcript;

  return (
    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="ai-transcription-container">
      {/* Barra de Ações do Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} />
            <span>Processado por IA (Whisper + GPT)</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            data-testid="btn-open-html-document"
            onClick={handleOpenHtmlDocument}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            <ExternalLink size={14} />
            <span>Abrir Documento HTML</span>
          </button>

          <button
            type="button"
            data-testid="btn-copy-transcription"
            onClick={handleCopyTranscript}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          {isManager && (
            <button
              type="button"
              data-testid="btn-retrigger-ai"
              onClick={handleTriggerTranscription}
              disabled={transcribing}
              title="Re-gerar transcrição com IA"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: subTextColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '7px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={transcribing ? 'animate-spin' : ''} />
              <span>Re-gerar</span>
            </button>
          )}
        </div>
      </div>

      {/* Card: Principais Pontos (Key Takeaways) */}
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div data-testid="ai-key-takeaways" style={{ padding: '16px 18px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <ListChecks size={18} color="#eab308" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: textColor, margin: 0 }}>Principais Pontos da Aula</h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: subTextColor, fontSize: '13.5px', lineHeight: 1.6 }}>
            {data.key_takeaways.map((point, idx) => (
              <li key={idx} style={{ color: textColor }}><span style={{ color: subTextColor }}>{point}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Card: Resumo Markdown / Executivo */}
      {data.summary_markdown && (
        <div data-testid="ai-summary-executive" style={{ padding: '16px 18px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText size={18} color="#3b82f6" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: textColor, margin: 0 }}>Resumo da Aula</h4>
          </div>
          <div style={{ fontSize: '13.5px', color: subTextColor, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {data.summary_markdown}
          </div>
        </div>
      )}

      {/* Card: Transcrição Integral do Vídeo */}
      <div data-testid="ai-full-transcription" style={{ padding: '16px 18px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#10b981" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: textColor, margin: 0 }}>Transcrição Integral</h4>
          </div>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input
              type="text"
              data-testid="input-search-transcript"
              placeholder="Buscar termo no texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 12px 6px 30px', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0,0,0,0.25)', color: textColor, fontSize: '12px', outline: 'none' }}
            />
          </div>
        </div>
        <div
          data-testid="transcript-content-box"
          style={{ maxHeight: '360px', overflowY: 'auto', padding: '14px 16px', borderRadius: '8px', backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0,0,0,0.35)', border: `1px solid ${borderColor}`, fontSize: '13px', lineHeight: 1.7, color: subTextColor, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
        >
          {filteredTranscript || 'Nenhum trecho correspondente ao termo pesquisado.'}
        </div>
      </div>
    </div>
  );
}
