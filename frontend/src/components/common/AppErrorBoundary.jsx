import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback() {
  return (
    <div
      data-testid="app-error-boundary-fallback"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at top, #1e293b 0%, #090d16 70%)',
        color: '#f8fafc',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '32px 28px',
          borderRadius: '18px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(248, 113, 113, 0.14)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={28} color="#f87171" />
        </div>
        <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#f8fafc' }}>
          Ops! Algo inesperado aconteceu
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.55 }}>
          Nosso monitoramento já registrou este erro automaticamente. Recarregue a página para continuar seus estudos.
        </p>
        <button
          type="button"
          data-testid="error-boundary-reload-btn"
          onClick={() => window.location.reload()}
          className="primary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '13.5px',
            marginTop: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} />
          <span>Recarregar Página</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary global integrado ao Sentry para evitar tela branca em erros de renderização React.
 */
export default function AppErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
