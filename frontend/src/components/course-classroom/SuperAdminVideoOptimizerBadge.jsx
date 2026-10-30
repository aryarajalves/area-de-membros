import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, CheckCircle2, Loader2, HardDrive } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import VideoOptimizationProgressModal from './VideoOptimizationProgressModal';

export default function SuperAdminVideoOptimizerBadge({
  videoUrl,
  currentUser
}) {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState({ sizeMb: 0, format: '' });
  const dismissedByUserRef = useRef(false);
  const { addToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchVideoInfo = useCallback(async (silent = false) => {
    if (!isSuperAdmin || !videoUrl) return null;
    try {
      if (!silent) setLoadingInfo(true);
      const res = await fetch(
        `/api/v1/courses/video-info?video_url=${encodeURIComponent(videoUrl)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
        setInitialSnapshot((prev) => ({
          sizeMb: prev.sizeMb || data.original_size_mb || data.size_mb || 0,
          format: prev.format || data.format || ''
        }));
        if (data.is_optimizing && !dismissedByUserRef.current) {
          setShowProgressModal(true);
        }
        return data;
      }
    } catch {
      // Silencioso em caso de erro de rede
    } finally {
      if (!silent) setLoadingInfo(false);
    }
    return null;
  }, [isSuperAdmin, videoUrl]);

  useEffect(() => {
    setInfo(null);
    setTriggering(false);
    setShowProgressModal(false);
    setInitialSnapshot({ sizeMb: 0, format: '' });
    dismissedByUserRef.current = false;
    if (isSuperAdmin && videoUrl) {
      fetchVideoInfo(false);
    }
  }, [isSuperAdmin, videoUrl, fetchVideoInfo]);

  // Polling automático enquanto o vídeo estiver sendo convertido pelo FFmpeg
  useEffect(() => {
    if (!isSuperAdmin || !videoUrl) return undefined;
    const isWorking = triggering || info?.is_optimizing;
    if (!isWorking) return undefined;

    const timer = setInterval(async () => {
      const updated = await fetchVideoInfo(true);
      if (updated && !updated.is_optimizing && updated.is_optimized) {
        setTriggering(false);
        addToast(
          `⚡ Vídeo otimizado com sucesso! Novo tamanho: ${updated.size_mb} MB (FastStart ativo).`,
          'success'
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuperAdmin, videoUrl, triggering, info?.is_optimizing, fetchVideoInfo, addToast]);

  if (!isSuperAdmin || !videoUrl) {
    return null;
  }

  const handleOptimizeClick = async () => {
    try {
      dismissedByUserRef.current = false;
      setTriggering(true);
      setShowProgressModal(true);
      const res = await fetch('/api/v1/courses/optimize-video', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ video_url: videoUrl })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao iniciar otimização.');
      }
      addToast(
        '🚀 Otimização FFmpeg (FastStart + H.264) iniciada! Acompanhe o progresso na tela.',
        'info'
      );
      await fetchVideoInfo(true);
    } catch (err) {
      setTriggering(false);
      setShowProgressModal(false);
      addToast(err.message || 'Erro ao acionar otimização do vídeo.', 'error');
    }
  };

  const handleCloseModal = () => {
    dismissedByUserRef.current = true;
    setShowProgressModal(false);
  };

  if (loadingInfo && !info) {
    return (
      <div
        data-testid="superadmin-video-info-loading"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          color: '#94a3b8',
          padding: '4px 10px',
          borderRadius: '999px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          backgroundColor: 'rgba(15, 23, 42, 0.5)'
        }}
      >
        <Loader2 size={12} className="animate-spin" />
        <span>Verificando tamanho...</span>
      </div>
    );
  }

  if (!info || info.format === 'EXTERNO') {
    return null;
  }

  const isWorking = triggering || info.is_optimizing;
  const sizeLabel = info.size_mb > 0 ? `${info.size_mb} MB` : 'Tamanho N/D';
  const formatLabel = info.format ? `.${info.format}` : '';

  return (
    <>
      <div
        data-testid="superadmin-video-optimizer-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Badge de Tamanho e Status (Exclusivo Super Admin) */}
        <div
          data-testid="superadmin-video-size-pill"
          onClick={() => {
            if (isWorking) {
              dismissedByUserRef.current = false;
              setShowProgressModal(true);
            }
          }}
          title={
            isWorking
              ? 'Clique para abrir o popup de progresso da otimização'
              : 'Informação visível exclusivamente para o Super Administrador'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '999px',
            cursor: isWorking ? 'pointer' : 'default',
            backgroundColor: info.is_optimized
              ? 'rgba(16, 185, 129, 0.14)'
              : isWorking
              ? 'rgba(59, 130, 246, 0.16)'
              : 'rgba(234, 179, 8, 0.15)',
            color: info.is_optimized
              ? '#34d399'
              : isWorking
              ? '#60a5fa'
              : '#facc15',
            border: info.is_optimized
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : isWorking
              ? '1px solid rgba(59, 130, 246, 0.4)'
              : '1px solid rgba(234, 179, 8, 0.4)'
          }}
        >
          {isWorking ? (
            <Loader2 size={13} className="animate-spin" />
          ) : info.is_optimized ? (
            <CheckCircle2 size={13} />
          ) : (
            <HardDrive size={13} />
          )}
          <span>
            {sizeLabel} {formatLabel && `(${formatLabel})`} •{' '}
            {isWorking
              ? 'Otimizando com FFmpeg...'
              : info.is_optimized
              ? 'Otimizado (FastStart)'
              : 'Sem Otimização'}
          </span>
        </div>

        {/* Botão para Otimizar esta Aula imediatamente (Exclusivo Super Admin) */}
        {!info.is_optimized && !isWorking && (
          <button
            type="button"
            onClick={handleOptimizeClick}
            data-testid="superadmin-optimize-lesson-btn"
            title="Converter este vídeo para MP4 Web (H.264 + FastStart) agora"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(234, 179, 8, 0.6)',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              color: '#0f172a',
              boxShadow: '0 2px 10px rgba(234, 179, 8, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={13} />
            <span>Otimizar Aula</span>
          </button>
        )}
      </div>

      {/* Popup Modal Centralizado de Progresso da Otimização */}
      <VideoOptimizationProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseModal}
        info={info}
        initialSizeMb={initialSnapshot.sizeMb}
        initialFormat={initialSnapshot.format}
      />
    </>
  );
}
