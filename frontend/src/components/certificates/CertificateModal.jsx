import React, { useState } from 'react';
import { Award, Download, Copy, Check, X, ShieldCheck, Calendar, Clock, ExternalLink } from 'lucide-react';
import { getCertificateDownloadUrl } from '../../services/certificatesApi';

export default function CertificateModal({
  isOpen,
  onClose,
  certificate,
  addToast,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const downloadUrl = getCertificateDownloadUrl(certificate.certificate_code);
  const validationUrl = `${window.location.origin}/validar-certificado/${certificate.certificate_code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(validationUrl);
      setCopied(true);
      if (addToast) addToast('Link de validação pública copiado!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (addToast) addToast('Falha ao copiar link.', 'error');
    }
  };

  const formattedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="modal-overlay custom-modal-overlay"
      role="dialog"
      aria-modal="true"
      data-testid="certificate-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '20px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-content custom-scrollbar"
        data-testid="certificate-modal-content"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: 'min(92vh, 840px)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#0b1329',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(217, 119, 6, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.12) 0%, rgba(15, 23, 42, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(217, 119, 6, 0.2)',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                Certificado Oficial de Conclusão
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Reconhecimento oficial de aproveitamento e conclusão
              </span>
            </div>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-certificate-modal-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Prévia Visual do Certificado */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Card Prévia de Moldura Ornamental */}
          <div
            data-testid="certificate-preview-card"
            style={{
              padding: '28px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(145deg, #0f172a 0%, #080d1a 100%)',
              border: '2px solid rgba(217, 119, 6, 0.5)',
              boxShadow: 'inset 0 0 20px rgba(217, 119, 6, 0.08)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
                fontSize: '11.5px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={14} />
              <span>Autêntico & Registrado</span>
            </div>

            <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '6px' }}>
              Certificado de Conclusão
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
              Certificamos que o(a) aluno(a)
            </div>

            <h2
              data-testid="certificate-student-name"
              style={{
                margin: '0 0 10px 0',
                fontSize: '1.6rem',
                color: '#f8fafc',
                fontWeight: 800,
                letterSpacing: '-0.5px',
              }}
            >
              {certificate.student_name}
            </h2>

            <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
              concluiu integralmente o treinamento
            </div>

            <div
              data-testid="certificate-course-title"
              style={{
                fontSize: '1.25rem',
                color: '#f59e0b',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              “{certificate.course_title}”
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12.5px',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="#f59e0b" />
                <span>Carga Horária: <b style={{ color: '#fff' }}>{certificate.workload_label || `${certificate.workload_hours || 10}h`}</b></span>
              </div>
              {formattedDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#f59e0b" />
                  <span>Concluído em: <b style={{ color: '#fff' }}>{formattedDate}</b></span>
                </div>
              )}
            </div>
          </div>

          {/* Dados de Validação e Código */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Código Único de Autenticidade
              </div>
              <div
                data-testid="certificate-code-display"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.05rem',
                  color: '#60a5fa',
                  fontWeight: 700,
                  marginTop: '2px',
                }}
              >
                {certificate.certificate_code}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              data-testid="copy-validation-link-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: copied ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: copied ? '#4ade80' : '#f8fafc',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Link Copiado!' : 'Copiar Link Público'}</span>
            </button>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            background: '#0b1329',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}
        >
          <a
            href={validationUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-validation-page-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#93c5fd',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <span>Ver página pública de validação</span>
            <ExternalLink size={13} />
          </a>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              data-testid="close-btn"
            >
              Fechar
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`certificado_${certificate.certificate_code}.pdf`}
              className="primary-btn"
              data-testid="download-certificate-pdf-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
              }}
            >
              <Download size={16} />
              <span>Baixar Certificado em PDF</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
