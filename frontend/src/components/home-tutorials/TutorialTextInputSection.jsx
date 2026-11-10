import React, { useState } from 'react';
import { FileText, Bold, Italic, Heading1, Heading2, List, Quote, Eye, Edit3, Clock } from 'lucide-react';

export default function TutorialTextInputSection({
  textContent,
  onChangeText,
  duration,
  onChangeDuration,
}) {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.getElementById('tutorial-markdown-textarea');
    if (!textarea) {
      onChangeText(`${textContent}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textContent.substring(start, end) || 'texto';
    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = textContent.substring(0, start) + replacement + textContent.substring(end);
    onChangeText(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const renderSimpleMarkdown = (text) => {
    if (!text || !text.trim()) {
      return (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
          Nenhum conteúdo digitado ainda. Escreva na aba "Escrever" para pré-visualizar aqui.
        </p>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '16px 0 8px 0' }}>
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '20px 0 10px 0' }}>
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            style={{
              margin: '12px 0',
              padding: '8px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderLeft: '3px solid #3b82f6',
              borderRadius: '0 6px 6px 0',
              color: '#93c5fd',
              fontSize: '13px'
            }}
          >
            {line.substring(2)}
          </blockquote>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} style={{ marginLeft: '20px', color: '#cbd5e1', marginBottom: '4px', fontSize: '13.5px' }}>
            {line.substring(2)}
          </li>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.12)', margin: '16px 0' }} />;
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Suporte a negrito **texto**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ margin: '0 0 10px 0', color: '#cbd5e1', lineHeight: 1.6, fontSize: '13.5px' }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} style={{ color: '#f8fafc', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <div style={{ marginTop: '16px' }} data-testid="tutorial-text-input-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label
          htmlFor="tutorial-markdown-textarea"
          style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={15} color="#3b82f6" />
          Conteúdo do Tutorial (Artigo em Markdown) *
        </label>

        {/* Abas Escrever vs Pré-visualizar */}
        <div style={{ display: 'inline-flex', padding: '2px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'write' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: activeTab === 'write' ? '#60a5fa' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            data-testid="tab-write-markdown"
          >
            <Edit3 size={12} />
            Escrever
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'preview' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: activeTab === 'preview' ? '#60a5fa' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            data-testid="tab-preview-markdown"
          >
            <Eye size={12} />
            Visualizar
          </button>
        </div>
      </div>

      {activeTab === 'write' ? (
        <div>
          {/* Barra de Ferramentas Markdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() => insertMarkdown('# ')}
              title="Título Principal (H1)"
              style={toolbarBtnStyle}
              data-testid="btn-md-h1"
            >
              <Heading1 size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ')}
              title="Subtítulo (H2)"
              style={toolbarBtnStyle}
              data-testid="btn-md-h2"
            >
              <Heading2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              title="Negrito"
              style={toolbarBtnStyle}
              data-testid="btn-md-bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              title="Itálico"
              style={toolbarBtnStyle}
              data-testid="btn-md-italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ')}
              title="Lista de Itens"
              style={toolbarBtnStyle}
              data-testid="btn-md-list"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ')}
              title="Destaque / Citação"
              style={toolbarBtnStyle}
              data-testid="btn-md-quote"
            >
              <Quote size={14} />
            </button>
          </div>

          <textarea
            id="tutorial-markdown-textarea"
            rows={8}
            value={textContent}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="# Bem-vindo à Área de Membros!\n\nNeste tutorial você aprenderá como:\n- Navegar pelas aulas\n- Fazer networking no Apresente-se\n- Tirar dúvidas no Suporte..."
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0 0 8px 8px',
              color: '#f8fafc',
              fontSize: '13px',
              fontFamily: 'monospace, sans-serif',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            data-testid="tutorial-text-content-input"
          />
        </div>
      ) : (
        <div
          style={{
            minHeight: '180px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}
          data-testid="tutorial-markdown-preview-container"
        >
          {renderSimpleMarkdown(textContent)}
        </div>
      )}

      {/* Duração / Tempo de Leitura */}
      <div style={{ marginTop: '12px' }}>
        <label
          htmlFor="tutorial-reading-duration-input"
          style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}
        >
          <Clock size={13} />
          Tempo Estimado de Leitura
        </label>
        <input
          id="tutorial-reading-duration-input"
          type="text"
          value={duration}
          onChange={(e) => onChangeDuration(e.target.value)}
          placeholder="Ex: 3 min de leitura"
          maxLength={50}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          data-testid="tutorial-reading-duration-input"
        />
      </div>
    </div>
  );
}

const toolbarBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  padding: '4px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease'
};
