import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { UploadQueueProvider } from './context/UploadQueueContext.jsx'
import { setupAuthInterceptor } from './services/authInterceptor'

// Inicializa o interceptor de requisições para logout automático por expiração de token
setupAuthInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <UploadQueueProvider>
        <App />
      </UploadQueueProvider>
    </ToastProvider>
  </StrictMode>,
)
