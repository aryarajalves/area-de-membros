import React from 'react';
import { Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function VideoPlayerOverlays({
  isLoading,
  isBuffering,
  poster,
  hasError,
  isPlaying,
  togglePlay,
  handleRetry
}) {
  return (
    <>
      {/* Capa de Transição Suave (evita tela preta enquanto os metadados baixam) */}
      {isLoading && poster && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000000',
            opacity: 0.55,
            pointerEvents: 'none'
          }}
          data-testid="video-poster-transition"
        />
      )}

      {/* Overlay de Carregamento / Buffering com Spinner Neon (Feedback imediato e transparente) */}
      {(isLoading || isBuffering) && !hasError && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'rgba(5, 8, 15, 0.78)',
            backdropFilter: 'blur(6px)',
            padding: '16px 26px',
            borderRadius: '14px',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
            pointerEvents: 'none',
            zIndex: 10
          }}
          data-testid="video-loading-spinner"
        >
          <Loader2 size={36} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.2px' }}>
              {isLoading ? 'Carregando aula...' : 'Carregando vídeo...'}
            </p>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {isLoading ? 'Preparando reprodutor' : 'Baixando dados de transmissão, aguarde...'}
            </span>
          </div>
        </div>
      )}

      {/* Botão Central de Play Grande (quando pronto e pausado) */}
      {!isPlaying && !isLoading && !isBuffering && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '2px solid rgba(234, 179, 8, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(234, 179, 8, 0.35)',
            transition: 'transform 0.15s ease',
            zIndex: 9
          }}
          title="Reproduzir Vídeo"
          data-testid="video-big-play-btn"
        >
          <Play size={26} color="#eab308" style={{ marginLeft: '3px' }} />
        </button>
      )}

      {/* Mensagem em Caso de Erro no Stream */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            textAlign: 'center',
            zIndex: 10
          }}
          data-testid="video-error-screen"
        >
          <AlertCircle size={32} color="#f87171" />
          <div>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              Falha ao carregar o vídeo
            </p>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Verifique sua conexão ou tente novamente.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="secondary-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', padding: '5px 12px' }}
          >
            <RefreshCw size={12} />
            <span>Tentar Novamente</span>
          </button>
        </div>
      )}
    </>
  );
}
