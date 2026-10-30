import React, { useState, useEffect, useCallback } from 'react';
import { Award, Download, CheckCircle2 } from 'lucide-react';
import CertificateModal from '../certificates/CertificateModal';
import { fetchCertificateStatusApi, issueCertificateApi } from '../../services/certificatesApi';
import { useToast } from '../../context/ToastContext';

export default function CourseCertificateManager({
  courseId,
  completedCount = 0,
  totalCount = 0,
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

  const handleOpenOrIssue = async () => {
    if (status?.certificate) {
      setModalOpen(true);
      return;
    }

    if (!status?.eligible) {
      if (addToast) addToast('Conclua 100% das aulas para desbloquear seu certificado.', 'info');
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
      if (addToast) addToast('Parabéns! Certificado emitido com sucesso!', 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao emitir certificado.', 'error');
    } finally {
      setIssuing(false);
    }
  };

  const isEligible = Boolean(status?.eligible || status?.certificate);
  if (!isEligible) return null;

  return (
    <>
      {/* Banner / Botão de Certificado em Destaque */}
      <div
        data-testid="course-certificate-banner"
        style={{
          margin: '16px 24px',
          padding: '14px 20px',
          borderRadius: '14px',
          background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          boxShadow: '0 8px 24px rgba(217, 119, 6, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(217, 119, 6, 0.25)',
              border: '1px solid rgba(217, 119, 6, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <b style={{ color: '#f8fafc', fontSize: '14.5px' }}>
                {status?.certificate ? 'Seu Certificado Oficial está Pronto!' : 'Parabéns! Você Concluiu 100% do Curso!'}
              </b>
              <CheckCircle2 size={15} color="#22c55e" />
            </div>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {status?.certificate
                ? 'Clique para visualizar ou baixar o PDF oficial com QR Code de autenticidade.'
                : 'Você cumpriu todos os requisitos. Clique para emitir seu certificado oficial.'}
            </span>
          </div>
        </div>

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
          {status?.certificate ? <Download size={16} /> : <Award size={16} />}
          <span>{issuing ? 'Emitindo...' : status?.certificate ? 'Ver / Baixar Certificado' : 'Emitir Certificado'}</span>
        </button>
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
