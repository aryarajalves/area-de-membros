import React, { useState, useRef } from 'react';
import {
  FileText, Eye, Image as ImageIcon, Link as LinkIcon,
  Heading, Bold, List, Minus, Loader2, Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function LessonArticleEditor({
  textContent = '',
  onChange,
  onUploadImage,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlAltInput, setUrlAltInput] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';
  const inputBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';

  // Insere texto na posição do cursor
  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((textContent ? textContent + '\n' : '') + textToInsert);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newText = textContent.substring(0, start) + textToInsert + textContent.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  // Upload de imagem do computador
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('A imagem excede o tamanho máximo permitido de 5 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = null;
      if (onUploadImage) {
        imageUrl = await onUploadImage(file);
      } else {
        const token = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/v1/courses/upload-thumbnail', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.thumbnail_url;
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Erro ao enviar imagem.');
        }
      }

      if (imageUrl) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Imagem do Artigo';
        const markdownTag = `\n\n![${cleanName}](${imageUrl})\n\n`;
        insertTextAtCursor(markdownTag);
        addToast('Imagem inserida com sucesso no artigo!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao carregar imagem.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Inserção de imagem por URL externa
  const handleInsertUrlImage = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const alt = urlAltInput.trim() || 'Imagem do Artigo';
    const tag = `\n\n![${alt}](${urlInput.trim()})\n\n`;
    insertTextAtCursor(tag);
    setUrlInput('');
    setUrlAltInput('');
    setShowUrlModal(false);
    addToast('Imagem por link inserida no artigo!', 'success');
  };

  // Renderizador simplificado e seguro de pré-visualização de artigo com imagens
  const renderPreviewContent = (text) => {
    if (!text || !text.trim()) {
      return (
        <p style={{ color: subTextColor, fontStyle: 'italic', margin: 0 }}>
          Nenhum conteúdo digitado para este artigo ainda.
        </p>
      );
    }

    // Separa blocos por linhas mantendo imagens e quebras
    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        elements.push(
          <div key={`img-${idx}`} style={{ margin: '20px 0', textAlign: 'center' }}>
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '100%',
                maxHeight: '480px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            />
            {alt && (
              <span style={{ display: 'block', fontSize: '12px', color: subTextColor, marginTop: '6px' }}>
                {alt}
              </span>
            )}
          </div>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} style={{ fontSize: '20px', fontWeight: 700, color: textColor, margin: '20px 0 8px 0' }}>
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${idx}`} style={{ fontSize: '24px', fontWeight: 800, color: textColor, margin: '24px 0 10px 0' }}>
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={`li-${idx}`} style={{ marginLeft: '20px', marginBottom: '4px', color: textColor }}>
            {line.substring(2)}
          </li>
        );
      } else if (line.trim() === '---') {
        elements.push(
          <hr key={`hr-${idx}`} style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '24px 0' }} />
        );
      } else if (line.trim() === '') {
        elements.push(<div key={`empty-${idx}`} style={{ height: '10px' }} />);
      } else {
        elements.push(
          <p key={`p-${idx}`} style={{ margin: '0 0 10px 0', color: textColor, lineHeight: 1.7 }}>
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div data-testid="lesson-article-editor" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Abas Escrever vs Pré-visualizar + Ações de Mídia */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: inputBg, padding: '3px', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            data-testid="article-tab-write-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'write' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'write' ? '#eab308' : 'transparent',
              color: activeTab === 'write' ? '#0f172a' : subTextColor
            }}
          >
            <FileText size={14} />
            <span>Escrever Texto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            data-testid="article-tab-preview-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'preview' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'preview' ? '#eab308' : 'transparent',
              color: activeTab === 'preview' ? '#0f172a' : subTextColor
            }}
          >
            <Eye size={14} />
            <span>Pré-visualizar Artigo</span>
          </button>
        </div>

        {/* Barra de Ferramentas de Inserção de Imagens e Formatação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: 'none' }}
            data-testid="article-image-file-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            data-testid="insert-image-upload-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isLightBg ? '#f0fdf4' : 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#22c55e',
              cursor: uploadingImage ? 'wait' : 'pointer'
            }}
            title="Enviar imagem do computador (JPG, PNG, WEBP até 5 MB)"
          >
            {uploadingImage ? <Loader2 size={13} className="spin-animate" /> : <ImageIcon size={13} />}
            <span>{uploadingImage ? 'Enviando Imagem...' : 'Enviar Imagem do PC'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlModal(true)}
            data-testid="insert-image-url-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: subTextColor,
              cursor: 'pointer'
            }}
            title="Inserir imagem via link externo URL"
          >
            <LinkIcon size={13} />
            <span>Link URL</span>
          </button>

          <button
            type="button"
            onClick={() => insertTextAtCursor('\n## Subtítulo do Tópico\n')}
            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: subTextColor, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
            title="Adicionar Subtítulo"
          >
            <Heading size={13} />
          </button>

          <button
            type="button"
            onClick={() => insertTextAtCursor('**texto em destaque**')}
            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: subTextColor, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
            title="Texto em Negrito"
          >
            <Bold size={13} />
          </button>

          <button
            type="button"
            onClick={() => insertTextAtCursor('\n- Item da lista')}
            style={{ background: inputBg, border: `1px solid ${borderColor}`, color: subTextColor, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
            title="Item de Lista"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* Editor ou Visualizador */}
      {activeTab === 'write' ? (
        <div>
          <textarea
            ref={textareaRef}
            rows={12}
            required
            placeholder="Escreva aqui as orientações, conceitos, passos práticos ou artigos da sua aula... Use o botão 'Enviar Imagem do PC' acima para ilustrar seu conteúdo!"
            value={textContent}
            onChange={(e) => onChange(e.target.value)}
            className="form-control-modern"
            style={{
              resize: 'vertical',
              minHeight: '220px',
              lineHeight: 1.7,
              fontSize: '13.5px',
              fontFamily: 'inherit'
            }}
            data-testid="lesson-text-content-input"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11.5px', color: subTextColor }}>
            <span>💡 Dica: Você pode enviar fotos, diagramas e ilustrações que aparecerão centralizadas e estilizadas para os alunos.</span>
            <span>{textContent.length} caracteres</span>
          </div>
        </div>
      ) : (
        <div
          data-testid="article-preview-container"
          style={{
            minHeight: '220px',
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '18px 20px',
            borderRadius: '10px',
            backgroundColor: inputBg,
            border: `1px solid ${borderColor}`,
            fontSize: '14px'
          }}
        >
          {renderPreviewContent(textContent)}
        </div>
      )}

      {/* Modal Popup para Inserção de Link de Imagem */}
      {showUrlModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}
          onClick={() => setShowUrlModal(false)}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '90%',
              backgroundColor: isLightBg ? '#ffffff' : '#0f172a',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${borderColor}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: textColor }}>
              Inserir Imagem por Link URL
            </h4>
            <form onSubmit={handleInsertUrlImage}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: subTextColor, marginBottom: '4px' }}>
                  URL da Imagem (HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/foto.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="form-control-modern"
                  data-testid="url-image-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: subTextColor, marginBottom: '4px' }}>
                  Legenda / Descrição da Foto (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diagrama explicativo da aula"
                  value={urlAltInput}
                  onChange={(e) => setUrlAltInput(e.target.value)}
                  className="form-control-modern"
                  data-testid="url-image-alt-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowUrlModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  data-testid="confirm-url-image-btn"
                >
                  Inserir no Artigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
