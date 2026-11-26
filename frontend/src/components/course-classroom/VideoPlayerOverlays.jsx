import React from 'react';
import { Play, Loader2, AlertCircle, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';

export default function VideoPlayerOverlays({
  isLoading,
  isBuffering,
  isStalledTooLong = false,
  poster,
  hasError,
  isPlaying,
  togglePlay,
  handleRetry,
  networkDiagnosis = null,
  isUsingProxyFallback = false,
  onSwitchToProxy = null
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
            pointerEvents: isStalledTooLong ? 'auto' : 'none',
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
          {isStalledTooLong && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', maxWidth: '300px', textAlign: 'center' }}>
                Sua rede ou Wi-Fi corporativo pode estar limitando o carregamento direto.
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="secondary-btn"
                  data-testid="video-stalled-reconnect-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                >
                  <RefreshCw size={13} />
                  <span>Reconectar Vídeo</span>
                </button>
                {!isUsingProxyFallback && onSwitchToProxy && (
                  <button
                    type="button"
                    onClick={onSwitchToProxy}
                    className="primary-btn"
                    data-testid="video-switch-proxy-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Usar Rota Segura</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão Central de Play com Glassmorphism (Item 8) */}
      {!isPlaying && !isLoading && !isBuffering && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          style={{
            position: 'absolute',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '2px solid rgba(234, 179, 8, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.45), 0 10px 25px rgba(0, 0, 0, 0.6)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background-color 0.2s ease',
            zIndex: 9
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.22)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(234, 179, 8, 0.65), 0 12px 30px rgba(0, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(234, 179, 8, 0.45), 0 10px 25px rgba(0, 0, 0, 0.6)';
          }}
          title="Reproduzir Vídeo"
          data-testid="video-big-play-btn"
        >
          <Play size={30} color="#facc15" fill="#facc15" style={{ marginLeft: '4px', filter: 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.5))' }} />
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
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            textAlign: 'center',
            maxWidth: '420px',
            margin: '0 16px',
            zIndex: 10
          }}
          data-testid="video-error-screen"
        >
          {networkDiagnosis === 'offline' ? (
            <WifiOff size={32} color="#f87171" />
          ) : (
            <AlertCircle size={32} color="#f87171" />
          )}
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
              Falha ao carregar o vídeo
            </p>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Verifique sua conexão ou tente novamente.
            </span>
          </div>

          <div
            data-testid="video-network-diagnosis-alert"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '11.5px',
              lineHeight: 1.45,
              color: '#cbd5e1',
              textAlign: 'left'
            }}
          >
            {networkDiagnosis === 'offline' ? (
              <span>
                Seu dispositivo parece estar sem internet. Confira sua conexão Wi-Fi ou dados móveis e tente novamente.
              </span>
            ) : (
              <span>
                <strong>Possível bloqueio de rede corporativa/Wi-Fi:</strong> redes de empresas, escolas ou VPNs às vezes bloqueiam o servidor externo de vídeo. Tente usar a <strong>Rota Segura (Mesmo Domínio)</strong> ou testar no 4G/5G sem VPN.
              </span>
            )}
          </div>

          {isUsingProxyFallback && (
            <span
              data-testid="video-proxy-active-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#34d399',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '999px',
                padding: '3px 10px'
              }}
            >
              <ShieldCheck size={12} />
              Rota Segura Ativa
            </span>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {!isUsingProxyFallback && onSwitchToProxy && (
              <button
                type="button"
                onClick={onSwitchToProxy}
                className="primary-btn"
                data-testid="video-switch-proxy-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', padding: '6px 14px', cursor: 'pointer' }}
              >
                <ShieldCheck size={13} />
                <span>Assistir via Rota Segura (Proxy)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRetry}
              className="secondary-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', padding: '6px 12px', cursor: 'pointer' }}
            >
              <RefreshCw size={12} />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
