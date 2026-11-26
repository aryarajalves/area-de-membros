import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { UploadQueueProvider } from './context/UploadQueueContext.jsx'
import { setupAuthInterceptor } from './services/authInterceptor'
import { checkAndEscapeInAppBrowser } from './utils/inAppBrowserEscape'
import { initFrontendSentry } from './services/sentryService'
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx'

// Redireciona navegadores embutidos (Instagram/Facebook no Android) para o Google Chrome nativo
checkAndEscapeInAppBrowser()

// Inicializa o interceptor de requisições para logout automático por expiração de token
setupAuthInterceptor()

// Inicializa o monitoramento Sentry (com túnel anti-firewall e Session Replay) em background
initFrontendSentry()

// Registra o Service Worker mínimo para suportar instalação como atalho PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falha silenciosa em ambientes sem suporte a SW
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <ToastProvider>
        <UploadQueueProvider>
          <App />
        </UploadQueueProvider>
      </ToastProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
