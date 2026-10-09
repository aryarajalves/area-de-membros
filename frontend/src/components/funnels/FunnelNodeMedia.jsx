import React, { useState, useRef } from 'react';
import { Image, Video, FileText, Copy, Trash2, Link as LinkIcon, Sparkles, Upload, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function FunnelNodeMedia({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const mediaType = data.media_type || 'image';
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleUpdate = (field, value) => {
    onUpdateData(node.id, { ...data, [field]: value });
  };

  const getAcceptedExtensions = () => {
    if (mediaType === 'image') return 'image/*';
    if (mediaType === 'video') return 'video/*';
    return '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.zip,.rar,.csv';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      addToast('O arquivo excede o limite máximo permitido de 50 MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', mediaType);

      const res = await fetch('/api/v1/funnels/upload-media', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao fazer upload da mídia.');
      }

      const resData = await res.json();
      onUpdateData(node.id, {
        ...data,
        media_url: resData.media_url,
        media_type: resData.media_type || mediaType,
        media_filename: resData.filename,
      });
      addToast('Mídia enviada com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro no envio da mídia.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '300px',
        backgroundColor: '#160b1e',
        border: isSelected ? '2px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(236, 72, 153, 0.3)' : '0 12px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
      }}
      data-testid={`funnel-node-media-${node.id}`}
    >
      {/* Port de Entrada (esquerda) */}
      {!data.is_start && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            if (onStartConnect) onStartConnect(node.id, e, node, 'input');
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            if (onConnectTarget) onConnectTarget(node.id, 'input');
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onConnectTarget) onConnectTarget(node.id, 'input');
          }}
          style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: isTargetActive ? 'translateY(-50%) scale(1.45)' : 'translateY(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: isTargetActive ? '#10b981' : '#ec4899',
            border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
            boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(236, 72, 153, 0.6)',
            cursor: 'crosshair',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          title="Ponto de entrada (arraste ou solte para conectar)"
          data-testid={`node-input-handle-${node.id}`}
        />
      )}

      {/* Port de Saída (direita) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ec4899',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #ec4899',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste até outro nó para conectar"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header do Nó */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: '#ec4899' }}>
            <Image size={16} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>MÍDIA</span>
          {data.is_start && (
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              ▶ INÍCIO
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onDuplicateNode(node.id)}
            title="Duplicar Nó"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px' }}
          >
            <Copy size={13} />
          </button>
          {!data.is_start && (
            <button
              onClick={() => onDeleteNode(node.id)}
              title="Excluir Nó"
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tipo de Mídia (Pílulas) */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {[
          { type: 'image', label: 'Imagem', icon: Image },
          { type: 'video', label: 'Vídeo', icon: Video },
          { type: 'file', label: 'Documento', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const active = mediaType === t.type;
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => handleUpdate('media_type', t.type)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '6px',
                border: active ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: active ? 'rgba(236, 72, 153, 0.2)' : '#020617',
                color: active ? '#f472b6' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Icon size={11} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Seção de Upload de Arquivo */}
      <div style={{ marginBottom: '10px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedExtensions()}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          data-testid={`node-media-file-input-${node.id}`}
        />

        {data.media_url ? (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#020617',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', color: '#f472b6', fontWeight: 600 }}>
                {mediaType === 'image' ? 'Imagem Anexada' : mediaType === 'video' ? 'Vídeo Anexado' : 'Documento Anexado'}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate('media_url', '')}
                title="Remover mídia"
                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                data-testid={`node-media-remove-${node.id}`}
              >
                <X size={13} />
              </button>
            </div>

            {mediaType === 'image' && (
              <div style={{ borderRadius: '6px', overflow: 'hidden', maxHeight: '110px', textAlign: 'center', backgroundColor: '#000', marginBottom: '6px' }}>
                <img
                  src={data.media_url}
                  alt="Pré-visualização"
                  style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain' }}
                />
              </div>
            )}

            {mediaType === 'video' && (
              <div style={{ padding: '6px', backgroundColor: 'rgba(236, 72, 153, 0.08)', borderRadius: '6px', fontSize: '0.68rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Video size={14} color="#f472b6" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.media_filename || 'Arquivo de vídeo carregado'}
                </span>
              </div>
            )}

            {mediaType === 'file' && (
              <div style={{ padding: '6px', backgroundColor: 'rgba(236, 72, 153, 0.08)', borderRadius: '6px', fontSize: '0.68rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={14} color="#f472b6" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.media_filename || 'Documento anexado'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '5px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  border: '1px dashed #ec4899',
                  color: '#f472b6',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
                data-testid={`node-media-reupload-btn-${node.id}`}
              >
                {uploading ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
                <span>{uploading ? 'Enviando...' : 'Trocar Arquivo'}</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(236, 72, 153, 0.12)',
              border: '1px dashed rgba(236, 72, 153, 0.5)',
              color: '#f472b6',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px',
              transition: 'all 0.15s ease',
            }}
            data-testid={`node-media-upload-btn-${node.id}`}
          >
            {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
            <span>{uploading ? 'Enviando arquivo...' : `Fazer Upload de ${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Documento'}`}</span>
          </button>
        )}

        {/* Input alternativo para URL externa */}
        <div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LinkIcon size={10} />
            <span>Ou insira URL direta da mídia:</span>
          </div>
          <input
            type="text"
            value={data.media_url || ''}
            onChange={(e) => handleUpdate('media_url', e.target.value)}
            placeholder="https://exemplo.com/arquivo.jpg"
            style={{
              width: '100%',
              backgroundColor: '#020617',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#f8fafc',
              padding: '5px 8px',
              fontSize: '0.72rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            data-testid={`node-media-url-input-${node.id}`}
          />
        </div>
      </div>

      {/* Legenda Opcional */}
      <div>
        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '4px' }}>
          Legenda / Texto da Mídia (opcional)
        </div>
        <textarea
          value={data.caption || ''}
          onChange={(e) => handleUpdate('caption', e.target.value)}
          placeholder="Escreva uma legenda para enviar junto..."
          rows={2}
          style={{
            width: '100%',
            backgroundColor: '#020617',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#f8fafc',
            padding: '6px 8px',
            fontSize: '0.75rem',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          data-testid={`node-media-caption-input-${node.id}`}
        />
      </div>

      {/* Spintax info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px' }}>
        <Sparkles size={10} color="#ec4899" />
        <span>Suporta Spintax na legenda: <code>{'{Oi|Olá}'}</code></span>
      </div>
    </div>
  );
}
