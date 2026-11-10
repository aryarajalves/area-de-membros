import React, { useState } from 'react';
import { X, Handshake, Sparkles, Send, Briefcase, MapPin } from 'lucide-react';
import IntroCreateMediaTab from './IntroCreateMediaTab';
import IntroCreateSocialTab from './IntroCreateSocialTab';
import IntroCreateMatchmakingTab from './IntroCreateMatchmakingTab';

export default function IntroductionCreateModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'media', 'social', 'matchmaking'

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');

  // Media states
  const [mediaOption, setMediaOption] = useState('none');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');

  // Social states
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');

  // Matchmaking states
  const [seeking, setSeeking] = useState('');
  const [offering, setOffering] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaUploadError('');
    setUploadingMedia(true);

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/introductions/upload-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao realizar upload do arquivo.');
      }

      const data = await res.json();
      setMediaFile(file);
      setMediaUrl(data.url);
      setMediaType(data.media_type);
      setMediaOption('upload');
    } catch (err) {
      setMediaUploadError(err.message || 'Erro ao realizar upload do arquivo.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveUploadedMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    setMediaType('none');
    setMediaOption('none');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        title: cleanTitle,
        content: cleanContent,
        niche: niche.trim() || null,
        location: location.trim() || null,
        media_type: mediaOption === 'embed' && videoEmbedUrl.trim() ? 'video' : mediaType,
        media_url: mediaOption === 'upload' ? mediaUrl : null,
        video_embed_url: mediaOption === 'embed' ? videoEmbedUrl.trim() : null,
        instagram: instagram.trim() || null,
        linkedin: linkedin.trim() || null,
        whatsapp: whatsapp.trim() || null,
        website: website.trim() || null,
        seeking: seeking.trim() || null,
        offering: offering.trim() || null,
      };

      await onCreate(payload);

      // Reset
      setTitle('');
      setContent('');
      setNiche('');
      setLocation('');
      setMediaUrl('');
      setMediaType('none');
      setVideoEmbedUrl('');
      setInstagram('');
      setLinkedin('');
      setWhatsapp('');
      setWebsite('');
      setSeeking('');
      setOffering('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="intro-modal-backdrop" data-testid="intro-create-modal-backdrop">
      <div className="intro-create-modal-card" data-testid="intro-create-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="intro-create-header">
          <div className="create-header-left">
            <div className="create-icon-badge">
              <Handshake size={20} />
            </div>
            <div>
              <h3>Criar Apresentação</h3>
              <p>Apresente-se, adicione mídias, redes e parcerias para se conectar.</p>
            </div>
          </div>

          <button
            type="button"
            className="intro-close-modal-btn"
            onClick={onClose}
            data-testid="close-create-modal-btn"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="intro-modal-tabs-bar" data-testid="intro-create-modal-tabs">
          <button
            type="button"
            className={`intro-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
            data-testid="tab-about-btn"
          >
            <span>📝 Sobre Você</span>
          </button>
          <button
            type="button"
            className={`intro-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
            data-testid="tab-media-btn"
          >
            <span>🎬 Mídia {mediaUrl || videoEmbedUrl ? '✓' : ''}</span>
          </button>
          <button
            type="button"
            className={`intro-tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
            data-testid="tab-social-btn"
          >
            <span>🌐 Redes & Contato</span>
          </button>
          <button
            type="button"
            className={`intro-tab-btn ${activeTab === 'matchmaking' ? 'active' : ''}`}
            onClick={() => setActiveTab('matchmaking')}
            data-testid="tab-matchmaking-btn"
          >
            <span>🤝 Parcerias</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="intro-create-form">
          {/* TAB 1: SOBRE VOCÊ */}
          {activeTab === 'about' && (
            <div className="intro-tab-pane" data-testid="pane-about">
              <div className="form-group">
                <label htmlFor="intro-post-title-input">
                  Título da Apresentação *
                </label>
                <input
                  id="intro-post-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Chegando na comunidade! Sou especialista em tráfego..."
                  maxLength={255}
                  required
                  data-testid="intro-post-title-input"
                />
              </div>

              <div className="form-row-2cols">
                <div className="form-group">
                  <label htmlFor="intro-post-niche-input">
                    <Briefcase size={13} /> Área de Atuação / Nicho
                  </label>
                  <input
                    id="intro-post-niche-input"
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: Design, Programação, Tráfego Pago..."
                    data-testid="intro-post-niche-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="intro-post-location-input">
                    <MapPin size={13} /> Cidade / Estado
                  </label>
                  <input
                    id="intro-post-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo - SP, Curitiba - PR..."
                    data-testid="intro-post-location-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="intro-post-content-input">
                  Conte sobre você *
                </label>
                <textarea
                  id="intro-post-content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Fale sobre sua história, projetos em andamento, o que te trouxe até aqui e o que você busca na comunidade..."
                  rows={6}
                  required
                  data-testid="intro-post-content-input"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MÍDIAS & VÍDEO */}
          {activeTab === 'media' && (
            <IntroCreateMediaTab
              mediaOption={mediaOption}
              setMediaOption={setMediaOption}
              mediaFile={mediaFile}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              videoEmbedUrl={videoEmbedUrl}
              setVideoEmbedUrl={setVideoEmbedUrl}
              uploadingMedia={uploadingMedia}
              mediaUploadError={mediaUploadError}
              onFileUpload={handleFileUpload}
              onRemoveMedia={handleRemoveUploadedMedia}
            />
          )}

          {/* TAB 3: REDES & CONTATO */}
          {activeTab === 'social' && (
            <IntroCreateSocialTab
              instagram={instagram}
              setInstagram={setInstagram}
              whatsapp={whatsapp}
              setWhatsapp={setWhatsapp}
              linkedin={linkedin}
              setLinkedin={setLinkedin}
              website={website}
              setWebsite={setWebsite}
            />
          )}

          {/* TAB 4: MATCHMAKING & PARCERIAS */}
          {activeTab === 'matchmaking' && (
            <IntroCreateMatchmakingTab
              seeking={seeking}
              setSeeking={setSeeking}
              offering={offering}
              setOffering={setOffering}
            />
          )}

          <div className="intro-create-tip-box">
            <Sparkles size={16} className="tip-icon" />
            <span>
              <strong>Dica de ouro:</strong> Apresentações com foto/vídeo e links de contato recebem 4x mais respostas e conexões!
            </span>
          </div>

          <div className="intro-create-footer-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={submitting}
              data-testid="cancel-create-post-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="introductions-cta-btn"
              disabled={!title.trim() || !content.trim() || submitting || uploadingMedia}
              data-testid="submit-create-post-btn"
            >
              <Send size={15} />
              <span>{submitting ? 'Publicando...' : 'Publicar Apresentação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
