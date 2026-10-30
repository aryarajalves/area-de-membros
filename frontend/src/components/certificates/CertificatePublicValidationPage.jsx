import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Award, Clock, Calendar, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import { validatePublicCertificateApi, getCertificateDownloadUrl } from '../../services/certificatesApi';

export default function CertificatePublicValidationPage({ certificateCode, onBackToPlatform }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const validate = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await validatePublicCertificateApi(certificateCode);
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted) setError(err.message || 'Certificado inválido ou não encontrado.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (certificateCode) {
      validate();
    } else {
      setError('Código de certificado não informado.');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [certificateCode]);

  const formattedDate = data?.issued_at
    ? new Date(data.issued_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #020617 0%, #0b1329 50%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 40px',
        boxSizing: 'border-box',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        data-testid="certificate-validation-container"
        style={{
          maxWidth: '620px',
          width: '100%',
          margin: 'auto',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: error ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(217, 119, 6, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(217, 119, 6, 0.1)',
          padding: '28px 28px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(217, 119, 6, 0.15)',
              border: error ? '2px solid rgba(239, 68, 68, 0.4)' : '2px solid rgba(217, 119, 6, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: error ? '#f87171' : '#f59e0b',
            }}
          >
            {error ? <ShieldAlert size={34} /> : <Award size={34} />}
          </div>
        </div>

        <h1 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: 800 }}>
          Validação Oficial de Certificado
        </h1>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#94a3b8' }}>
          Consulta pública de autenticidade emitida pela Área de Membros
        </p>

        {loading && (
          <div data-testid="validation-loading-spinner" style={{ padding: '40px 0', color: '#93c5fd' }}>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>Consultando registro de autenticidade...</div>
          </div>
        )}

        {!loading && error && (
          <div
            data-testid="validation-error-state"
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '24px',
            }}
          >
            <div style={{ color: '#f87171', fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>
              Certificado Não Encontrado ou Inválido
            </div>
            <div style={{ color: '#fca5a5', fontSize: '13.5px', lineHeight: 1.5 }}>
              O código <b>{certificateCode}</b> não confere com nenhum certificado oficial registrado em nossa base de dados.
            </div>
          </div>
        )}

        {!loading && data && (
          <div data-testid="validation-success-state">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ade80',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '24px',
              }}
            >
              <ShieldCheck size={18} />
              <span>CERTIFICADO AUTÊNTICO E VÁLIDO</span>
            </div>

            <div
              style={{
                padding: '24px 20px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '24px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Aluno(a) Certificado(a)
                </span>
                <div data-testid="validation-student-name" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {data.student_name}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Treinamento Concluído
                </span>
                <div data-testid="validation-course-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                  {data.course_title}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    Carga Horária
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#e2e8f0', marginTop: '4px' }}>
                    <Clock size={14} color="#f59e0b" />
                    <span><b>{data.workload_label || `${data.workload_hours || 10} horas`}</b> estimadas</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    Data de Emissão
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#e2e8f0', marginTop: '4px' }}>
                    <Calendar size={14} color="#f59e0b" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Código de Registro Oficial
                </span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#60a5fa', fontWeight: 700, marginTop: '2px' }}>
                  {data.certificate_code}
                </div>
              </div>
            </div>

            <a
              href={getCertificateDownloadUrl(data.certificate_code)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="download-verified-pdf-btn"
              download={`certificado_${data.certificate_code}.pdf`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14.5px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            >
              <Download size={17} />
              <span>Baixar Certificado Original em PDF</span>
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (onBackToPlatform) {
              onBackToPlatform();
            } else {
              window.location.href = '/';
            }
          }}
          data-testid="back-to-platform-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '13.5px',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <ArrowLeft size={15} />
          <span>Voltar para a Área de Membros</span>
        </button>
      </div>
    </div>
  );
}
