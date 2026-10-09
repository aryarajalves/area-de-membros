import React from 'react';
import { FolderUp, Folder, Sparkles, UploadCloud } from 'lucide-react';

export default function BatchDropzoneArea({
  isDragging,
  isImporting,
  onOpenFolderPicker,
  onDragOver,
  onDragLeave,
  onDrop
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => {
        if (!isImporting) onOpenFolderPicker();
      }}
      data-testid="batch-dropzone-area"
      style={{
        textAlign: 'center',
        padding: '52px 28px',
        border: isDragging
          ? '2px dashed #818cf8'
          : '2px dashed rgba(255, 255, 255, 0.16)',
        borderRadius: '16px',
        backgroundColor: isDragging
          ? 'rgba(99, 102, 241, 0.14)'
          : 'rgba(255, 255, 255, 0.02)',
        boxShadow: isDragging
          ? '0 0 30px rgba(99, 102, 241, 0.25)'
          : 'none',
        cursor: isImporting ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '20px',
          background: isDragging
            ? 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
          transform: isDragging ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.2s ease'
        }}
      >
        {isDragging ? (
          <UploadCloud size={32} color="#ffffff" className="animate-bounce" />
        ) : (
          <FolderUp size={30} color="#a5b4fc" />
        )}
      </div>

      <h3
        style={{
          fontSize: '17px',
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: isDragging ? '#c7d2fe' : '#f8fafc',
          letterSpacing: '-0.01em'
        }}
      >
        {isDragging
          ? 'Solte a pasta aqui para carregar instantaneamente!'
          : 'Arraste a pasta do seu curso aqui'}
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: '#94a3b8',
          maxWidth: '500px',
          margin: '0 0 20px 0',
          lineHeight: 1.55
        }}
      >
        Arraste a pasta do computador direto para esta área ou clique no botão abaixo.
        Cada subpasta será mapeada para um módulo e cada vídeo virará uma aula com transcrição automática por IA.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isImporting) onOpenFolderPicker();
          }}
          disabled={isImporting}
          data-testid="dropzone-select-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isImporting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          <Folder size={16} />
          <span>Ou Escolha a Pasta no Computador</span>
        </button>
      </div>

      <div
        style={{
          marginTop: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#cbd5e1',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: '6px 14px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Sparkles size={13} color="#c084fc" />
        <span>Dica: Arrastar e soltar a pasta aqui carrega tudo direto sem avisos adicionais!</span>
      </div>
    </div>
  );
}
