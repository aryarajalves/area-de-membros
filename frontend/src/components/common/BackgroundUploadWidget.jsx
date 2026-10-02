import { CloudUpload, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useUploadQueue } from '../../context/UploadQueueContext';

export default function BackgroundUploadWidget() {
  const {
    uploads,
    cancelUpload,
    clearCompleted,
    activeUploadsCount,
    isWidgetExpanded,
    setIsWidgetExpanded
  } = useUploadQueue();

  if (!uploads || uploads.length === 0) return null;

  return (
    <div
      data-testid="background-upload-widget"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9990,
        backgroundColor: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: 'inherit',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInUp 0.25s ease-out'
      }}
    >
      {/* Cabeçalho do Card Flutuante */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1e293b',
          borderBottom: isWidgetExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeUploadsCount > 0 ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <CloudUpload size={20} color="#38bdf8" />
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  animation: 'pulse 1.5s infinite'
                }}
              />
            </div>
          ) : (
            <CheckCircle2 size={20} color="#10b981" />
          )}

          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              {activeUploadsCount > 0
                ? `Enviando ${activeUploadsCount} ${activeUploadsCount === 1 ? 'vídeo' : 'vídeos'}...`
                : 'Uploads concluídos'}
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {activeUploadsCount > 0 ? 'Upload em segundo plano (Backblaze B2)' : 'Todos os vídeos salvos'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label={isWidgetExpanded ? 'Recolher' : 'Expandir'}
            data-testid="toggle-upload-widget-btn"
          >
            {isWidgetExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          {activeUploadsCount === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearCompleted();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Fechar painel"
              data-testid="close-upload-widget-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Uploads */}
      {isWidgetExpanded && (
        <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {uploads.map((item) => {
              const isUploading = item.status === 'uploading';
              const isCompleted = item.status === 'completed';
              const isError = item.status === 'error';
              const isCancelled = item.status === 'cancelled';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                  data-testid={`upload-item-${item.id}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.lessonTitle || item.fileName}
                      </p>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>
                        {item.fileName}
                      </span>
                      {isError && item.error && (
                        <span style={{ fontSize: '10px', color: '#f87171', display: 'block', marginTop: '2px', fontWeight: 500 }}>
                          {item.error}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isUploading && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                          {item.progress}%
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle2 size={13} /> Concluído
                        </span>
                      )}
                      {isError && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertCircle size={13} /> Falha
                        </span>
                      )}
                      {isCancelled && (
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>
                          Cancelado
                        </span>
                      )}

                      {isUploading && (
                        <button
                          type="button"
                          onClick={() => cancelUpload(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Cancelar este upload"
                          data-testid={`cancel-upload-${item.id}`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progresso Individual */}
                  {isUploading && (
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.progress}%`,
                          backgroundColor: '#3b82f6',
                          borderRadius: '2px',
                          transition: 'width 0.2s ease-out'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
