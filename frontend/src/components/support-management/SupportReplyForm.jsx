import React from 'react';
import { Send, Upload, Loader2, X } from 'lucide-react';

export default function SupportReplyForm({
  replyContent,
  setReplyContent,
  replyImageUrl,
  setReplyImageUrl,
  uploadingImage,
  sendingReply,
  onImageUpload,
  onSubmit,
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '10px',
      }}
    >
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '0 0 10px 0' }}>
        Enviar sua resposta
      </h4>
      <form onSubmit={onSubmit}>
        <textarea
          rows={3}
          placeholder="Escreva sua resposta ou explicação para ajudar..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.4',
            marginBottom: '10px',
          }}
          data-testid="reply-content-input"
        />

        {replyImageUrl && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
            <img
              src={replyImageUrl}
              alt="Anexo resposta"
              style={{ height: '70px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            />
            <button
              type="button"
              onClick={() => setReplyImageUrl('')}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={10} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: uploadingImage ? 'not-allowed' : 'pointer',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={onImageUpload}
              disabled={uploadingImage}
              style={{ display: 'none' }}
              data-testid="reply-image-input"
            />
            {uploadingImage ? (
              <>
                <Loader2 size={14} className="spin-animation" />
                <span>Enviando print...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Anexar print</span>
              </>
            )}
          </label>

          <button
            type="submit"
            disabled={sendingReply || uploadingImage}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: sendingReply ? 'not-allowed' : 'pointer',
            }}
            data-testid="send-reply-btn"
          >
            {sendingReply ? (
              <>
                <Loader2 size={14} className="spin-animation" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Responder</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
