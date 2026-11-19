function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildAttachmentLoadingHtml({ title = 'Material Complementar', fileType = '', fileSize = '' } = {}) {
  const safeTitle = escapeHtml(title);
  const safeType = escapeHtml((fileType || 'ARQUIVO').toUpperCase());
  const safeSize = escapeHtml(fileSize);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.14), transparent 45%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.14), transparent 45%),
        #070b14;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }
    .card {
      width: 100%;
      max-width: 420px;
      padding: 36px 28px 30px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(56, 189, 248, 0.25);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(56, 189, 248, 0.08);
      backdrop-filter: blur(16px);
      text-align: center;
      position: relative;
    }
    .spinner-wrap {
      width: 72px;
      height: 72px;
      margin: 0 auto 22px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid rgba(56, 189, 248, 0.15);
      border-top-color: #38bdf8;
      border-right-color: #818cf8;
      animation: spin 0.95s linear infinite;
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.28);
    }
    .icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
    }
    .badge-row {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 4px 10px;
      border-radius: 999px;
    }
    .title {
      font-size: 17px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 8px;
      word-break: break-word;
      line-height: 1.35;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 22px;
      line-height: 1.5;
    }
    .progress-track {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      overflow: hidden;
      position: relative;
    }
    .progress-bar {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 45%;
      border-radius: 999px;
      background: linear-gradient(90deg, #0284c7, #38bdf8, #818cf8);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
      animation: slide 1.4s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slide {
      0% { left: -45%; }
      50% { left: 35%; width: 55%; }
      100% { left: 100%; width: 45%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner-wrap">
      <div class="ring"></div>
      <div class="icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      </div>
    </div>
    <div class="badge-row">
      <span>${safeType}</span>${safeSize ? `<span>• ${safeSize}</span>` : ''}
    </div>
    <h1 class="title">${safeTitle}</h1>
    <p class="subtitle">Preparando e abrindo seu material com segurança...</p>
    <div class="progress-track">
      <div class="progress-bar"></div>
    </div>
  </div>
</body>
</html>`;
}
