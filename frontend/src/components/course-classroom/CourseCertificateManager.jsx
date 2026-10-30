import React, { useState, useEffect, useCallback } from 'react';
import { Award, Download, CheckCircle2, Lock, Eye } from 'lucide-react';
import CertificateModal from '../certificates/CertificateModal';
import { fetchCertificateStatusApi, issueCertificateApi } from '../../services/certificatesApi';
import { useToast } from '../../context/ToastContext';

export default function CourseCertificateManager({
  courseId,
  completedCount = 0,
  totalCount = 0,
  isManager = false,
}) {
  const { addToast } = useToast();
  const [status, setStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!courseId) return;
    try {
      const data = await fetchCertificateStatusApi(courseId);
      setStatus(data);
    } catch {
      // Ignora erro de consulta inicial
    }
  }, [courseId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus, completedCount, totalCount]);

  if (!status) return null;
  if (status.certificate_enabled === false) return null;

  const effectiveCompleted = status.completed_lessons ?? completedCount;
  const effectiveTotal = status.total_lessons ?? totalCount;
  const progressPct =
    status.progress_pct ??
    (effectiveTotal > 0 ? Math.min(100, Math.round((effectiveCompleted / effectiveTotal) * 100)) : 0);

  const isEligible = Boolean(status.eligible || status.certificate);

  const handleOpenOrIssue = async () => {
    if (status?.certificate) {
      setModalOpen(true);
      return;
    }

    if (!isEligible && !isManager) {
      if (addToast) {
        addToast(
          `Conclua 100% das aulas (${effectiveCompleted} de ${effectiveTotal} aulas) para desbloquear seu certificado em PDF.`,
          'info'
        );
      }
      return;
    }

    setIssuing(true);
    try {
      const cert = await issueCertificateApi(courseId);
      setStatus((prev) => ({
        ...prev,
        certificate: cert,
      }));
      setModalOpen(true);
      if (addToast) addToast('Certificado oficial gerado com sucesso!', 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao emitir certificado.', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <div
        data-testid="course-certificate-banner"
        style={{
          margin: '16px 24px',
          padding: '14px 20px',
          borderRadius: '14px',
          background: isEligible
            ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
            : 'linear-gradient(90deg, rgba(30, 41, 59, 0.78) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: isEligible
            ? '1px solid rgba(217, 119, 6, 0.4)'
            : '1px solid rgba(234, 179, 8, 0.25)',
          boxShadow: isEligible
            ? '0 8px 24px rgba(217, 119, 6, 0.12)'
            : '0 6px 18px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isEligible ? 'rgba(217, 119, 6, 0.25)' : 'rgba(234, 179, 8, 0.12)',
              border: isEligible ? '1px solid rgba(217, 119, 6, 0.5)' : '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            {isEligible ? <Award size={22} /> : <Lock size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <b style={{ color: '#f8fafc', fontSize: '14.5px' }}>
                {status.certificate
                  ? 'Seu Certificado Oficial está Pronto!'
                  : isEligible
                  ? 'Parabéns! Você Concluiu 100% do Curso!'
                  : 'Certificado Oficial de Conclusão em PDF'}
              </b>
              {isEligible ? (
                <CheckCircle2 size={15} color="#22c55e" />
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(234, 179, 8, 0.16)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                  }}
                >
                  Progresso: {progressPct}% ({effectiveCompleted}/{effectiveTotal} aulas)
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
              {status.certificate
                ? 'Clique para visualizar ou baixar o PDF oficial com QR Code de autenticidade.'
                : isEligible
                ? 'Você cumpriu todos os requisitos. Clique para emitir seu certificado oficial.'
                : 'Conclua 100% das aulas deste curso para desbloquear e baixar seu Certificado Oficial em PDF com QR Code.'}
            </span>
            {!isEligible && (
              <div
                style={{
                  marginTop: '7px',
                  maxWidth: '340px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isEligible || isManager ? (
            <button
              type="button"
              onClick={handleOpenOrIssue}
              disabled={issuing}
              data-testid="claim-certificate-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: issuing ? 'not-allowed' : 'pointer',
                opacity: issuing ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {status.certificate ? (
                <Download size={16} />
              ) : isEligible ? (
                <Award size={16} />
              ) : (
                <Eye size={16} />
              )}
              <span>
                {issuing
                  ? 'Emitindo...'
                  : status.certificate
                  ? 'Ver / Baixar Certificado'
                  : isEligible
                  ? 'Emitir Certificado'
                  : 'Emitir / Visualizar Certificado (PDF)'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenOrIssue}
              data-testid="locked-certificate-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Lock size={14} color="#f59e0b" />
              <span>Desbloqueia com 100% ({progressPct}%)</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal do Certificado */}
      <CertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={status?.certificate}
        addToast={addToast}
      />
    </>
  );
}
