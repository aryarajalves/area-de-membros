import React from 'react';
import { Download, FileText, Printer, X, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function formatToBrasiliaDateTime(dateString) {
  if (!dateString) return new Date().toLocaleDateString('pt-BR');
  const isoString = dateString.endsWith('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function generateMarkdownContent(messages, tutorName, lessonTitle) {
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  let md = `# Histórico de Dúvidas - ${tutorName}\n\n`;
  if (lessonTitle) {
    md += `**Aula:** ${lessonTitle}\n`;
  }
  md += `**Data da Exportação:** ${dateStr} (Horário de Brasília)\n\n`;
  md += `---\n\n`;

  messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const author = isUser ? '👤 Aluno' : `🤖 ${tutorName}`;
    const timeFormatted = formatToBrasiliaDateTime(msg.created_at);

    md += `### ${author} _(${timeFormatted})_\n\n`;
    md += `${msg.content}\n\n`;

    if (Array.isArray(msg.related_lessons) && msg.related_lessons.length > 0) {
      md += `> **Aulas Relacionadas Sugeridas:**\n`;
      msg.related_lessons.forEach((rel) => {
        md += `> - ${rel.course_title} • ${rel.lesson_title}\n`;
      });
      md += `\n`;
    }

    if (idx < messages.length - 1) {
      md += `---\n\n`;
    }
  });

  return md;
}

export default function TutorExportChatModal({
  isOpen,
  onClose,
  messages = [],
  tutorName = 'Tutor IA 24h',
  lessonTitle = '',
  isLightBg = false
}) {
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleDownloadMarkdown = () => {
    try {
      const content = generateMarkdownContent(messages, tutorName, lessonTitle);
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = (lessonTitle || 'conversa-tutor')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      link.href = url;
      link.download = `${safeTitle || 'tutor-ia'}-estudo.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Arquivo Markdown baixado com sucesso!', 'success');
      onClose();
    } catch (err) {
      console.error('Erro ao exportar Markdown:', err);
      addToast('Falha ao gerar arquivo Markdown.', 'error');
    }
  };

  const handlePrintPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addToast('Permita a abertura de popups para imprimir em PDF.', 'warning');
        return;
      }

      const dateStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());

      const messagesHtml = messages
        .map((msg) => {
          const isUser = msg.role === 'user';
          const author = isUser ? '👤 Sua Pergunta' : `🤖 ${tutorName}`;
          const bubbleBg = isUser ? '#f1f5f9' : '#faf5ff';
          const borderColor = isUser ? '#cbd5e1' : '#d8b4fe';
          const time = formatToBrasiliaDateTime(msg.created_at);

          return `
            <div style="margin-bottom: 16px; padding: 14px 18px; border-radius: 8px; background: ${bubbleBg}; border: 1px solid ${borderColor}; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: bold; color: ${isUser ? '#0f172a' : '#6b21a8'};">
                <span>${author}</span>
                <span style="font-size: 11px; font-weight: normal; color: #64748b;">${time}</span>
              </div>
              <div style="font-size: 13.5px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
                ${msg.content}
              </div>
            </div>
          `;
        })
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Caderno de Dúvidas - ${tutorName}</title>
          <style>
            @media print {
              body { margin: 15mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
              @page { size: A4; margin: 15mm; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              max-width: 800px;
              margin: 20px auto;
              padding: 0 15px;
            }
            .header {
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0; font-size: 20px; color: #581c87; }
            .header p { margin: 4px 0 0; font-size: 12.5px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Caderno de Estudos & Dúvidas • ${tutorName}</h1>
            ${lessonTitle ? `<p><strong>Aula:</strong> ${lessonTitle}</p>` : ''}
            <p><strong>Exportado em:</strong> ${dateStr} (Horário de Brasília) • Total de mensagens: ${messages.length}</p>
          </div>
          <div>
            ${messagesHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      addToast('Janela de impressão em PDF aberta!', 'info');
      onClose();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      addToast('Falha ao abrir impressão.', 'error');
    }
  };

  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const boxBg = isLightBg ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)';

  return (
    <div
      data-testid="tutor-export-chat-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        data-testid="tutor-export-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-export-chat-title"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: modalBg,
          borderRadius: '16px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              flexShrink: 0
            }}
          >
            <Download size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="tutor-export-chat-title"
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Exportar Conversa da Aula</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(124, 58, 237, 0.18)',
                  color: '#c084fc',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}
              >
                Estudo Offline
              </span>
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12.5px',
                color: subTextColor,
                lineHeight: 1.45
              }}
            >
              Baixe todas as perguntas e respostas desta aula para revisar quando quiser:
            </p>
          </div>
        </div>

        {/* Corpo do Modal: Resumo e Opções de Formato */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card Resumo */}
          <div
            style={{
              backgroundColor: boxBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: textColor
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="#a855f7" />
              <span>{messages.length} mensagens na conversa</span>
            </div>
            <span style={{ fontSize: '11.5px', color: subTextColor }}>
              {tutorName}
            </span>
          </div>

          {/* Opções de Download / Impressão */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Botão Markdown */}
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              data-testid="btn-export-markdown"
              style={{
                padding: '16px 14px',
                borderRadius: '12px',
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${borderColor}`,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={18} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Markdown (.md)</span>
              <span style={{ fontSize: '11px', color: subTextColor, lineHeight: 1.3 }}>
                Ideal para Obsidian, Notion ou bloco de notas
              </span>
            </button>

            {/* Botão PDF / Imprimir */}
            <button
              type="button"
              onClick={handlePrintPdf}
              data-testid="btn-export-pdf"
              style={{
                padding: '16px 14px',
                borderRadius: '12px',
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${borderColor}`,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Printer size={18} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Salvar em PDF (.pdf)</span>
              <span style={{ fontSize: '11px', color: subTextColor, lineHeight: 1.3 }}>
                Layout formatado para impressão ou salvar em PDF
              </span>
            </button>
          </div>
        </div>

        {/* Rodapé: Apenas 1 botão para fechar/cancelar (atende padrão estrito de popups) */}
        <div
          style={{
            padding: '14px 24px 20px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-export-modal"
            style={{
              padding: '9px 20px',
              borderRadius: '9px',
              backgroundColor: 'transparent',
              border: `1px solid ${borderColor}`,
              color: textColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
