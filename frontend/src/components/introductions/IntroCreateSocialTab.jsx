import React from 'react';
import { Globe } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from '../platform-settings/linkIcons';

export default function IntroCreateSocialTab({
  instagram,
  setInstagram,
  linkedin,
  setLinkedin,
  website,
  setWebsite,
}) {
  return (
    <div className="intro-tab-pane" data-testid="pane-social">
      <p className="intro-tab-desc">
        Conecte suas redes para que outros alunos possam te encontrar com 1 clique. O botão de conversa direta via DM da comunidade é exibido automaticamente.
      </p>

      <div className="form-row-2cols">
        <div className="form-group">
          <label htmlFor="intro-instagram-input">
            <InstagramIcon size={13} /> Instagram
          </label>
          <input
            id="intro-instagram-input"
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@seu.perfil"
            data-testid="intro-instagram-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="intro-linkedin-input">
            <LinkedinIcon size={13} /> LinkedIn
          </label>
          <input
            id="intro-linkedin-input"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/seu-perfil"
            data-testid="intro-linkedin-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="intro-website-input">
          <Globe size={13} /> Portfólio / Site Pessoal
        </label>
        <input
          id="intro-website-input"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://meusite.com ou github"
          data-testid="intro-website-input"
        />
      </div>
    </div>
  );
}
