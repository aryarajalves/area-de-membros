import React, { useState, useRef } from 'react';
import { Mic, Copy, Trash2, Link as LinkIcon, Radio, Upload, Loader2, X, Music } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function FunnelNodeAudio({
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleUpdate = (field, value) => {
    onUpdateData(node.id, { ...data, [field]: value });
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
      formData.append('media_type', 'audio');

      const res = await fetch('/api/v1/funnels/upload-media', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao fazer upload do áudio.');
      }

      const resData = await res.json();
      onUpdateData(node.id, {
        ...data,
        audio_url: resData.media_url,
        audio_filename: resData.filename,
      });
      addToast('Áudio enviado com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro no envio do áudio.', 'error');
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
        backgroundColor: '#0a1a14',
        border: isSelected ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 12px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
      }}
      data-testid={`funnel-node-audio-${node.id}`}
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
            backgroundColor: isTargetActive ? '#10b981' : '#10b981',
            border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
            boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(16, 185, 129, 0.6)',
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
          backgroundColor: '#10b981',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #10b981',
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
          <div style={{ color: '#10b981' }}>
            <Mic size={16} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>ÁUDIO</span>
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

      {/* Seção de Upload de Áudio */}
      <div style={{ marginBottom: '10px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.ogg,.wav,.m4a,.webm"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          data-testid={`node-audio-file-input-${node.id}`}
        />

        {data.audio_url ? (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#020617',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Music size={12} color="#10b981" />
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {data.audio_filename || 'Áudio Carregado'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate('audio_url', '')}
                title="Remover áudio"
                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                data-testid={`node-audio-remove-${node.id}`}
              >
                <X size={13} />
              </button>
            </div>

            <audio
              controls
              src={data.audio_url}
              style={{ width: '100%', height: '32px', marginBottom: '6px', borderRadius: '4px' }}
              data-testid={`node-audio-player-${node.id}`}
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '5px',
                borderRadius: '5px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px dashed #10b981',
                color: '#34d399',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
              data-testid={`node-audio-reupload-btn-${node.id}`}
            >
              {uploading ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
              <span>{uploading ? 'Enviando...' : 'Trocar Arquivo'}</span>
            </button>
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px dashed rgba(16, 185, 129, 0.5)',
              color: '#34d399',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              marginBottom: '8px',
            }}
            data-testid={`node-audio-upload-btn-${node.id}`}
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="spin" />
                <span>Enviando áudio (máx 50MB)...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Fazer Upload do Áudio (MP3 / OGG / WAV / WebM)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Campo URL do Áudio (Alternativa) */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LinkIcon size={11} />
          <span>Ou cole a URL direta do áudio:</span>
        </div>
        <input
          type="text"
          value={data.audio_url || ''}
          onChange={(e) => handleUpdate('audio_url', e.target.value)}
          placeholder="https://exemplo.com/audio.mp3"
          style={{
            width: '100%',
            backgroundColor: '#020617',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#f8fafc',
            padding: '6px 8px',
            fontSize: '0.72rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          data-testid={`node-audio-url-input-${node.id}`}
        />
      </div>

      {/* Toggle Áudio de Voz (Gravado na hora) */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#cbd5e1',
          padding: '6px 8px',
          borderRadius: '6px',
          backgroundColor: '#020617',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={13} color="#10b981" />
          <span>Simular gravado na hora</span>
        </div>
        <input
          type="checkbox"
          checked={data.is_voice_note ?? true}
          onChange={(e) => handleUpdate('is_voice_note', e.target.checked)}
          style={{ accentColor: '#10b981', cursor: 'pointer' }}
        />
      </label>
    </div>
  );
}
