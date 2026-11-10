import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TutorialArticleViewer from './TutorialArticleViewer';

describe('TutorialArticleViewer', () => {
  it('returns null if no tutorial is provided', () => {
    const { container } = render(<TutorialArticleViewer tutorial={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty message when tutorial has no text content', () => {
    render(<TutorialArticleViewer tutorial={{ title: 'Artigo Sem Conteúdo', text_content: '' }} />);
    expect(screen.getByText(/Nenhum conteúdo em texto cadastrado/i)).toBeInTheDocument();
  });

  it('renders markdown elements correctly (headings, bold, lists, quotes, dividers)', () => {
    const sampleTutorial = {
      id: 1,
      title: 'Guia Completo da Plataforma',
      description: 'Breve resumo do artigo',
      duration: '4 min de leitura',
      text_content: `# Bem-vindo ao Guia
## Como assistir aulas
> Dica: Você ganha pontos a cada aula assistida!
---
- Navegue pelos módulos
- Conclua as lições
Esta aula é muito **especial e prática** para seu progresso.`
    };

    render(<TutorialArticleViewer tutorial={sampleTutorial} />);

    expect(screen.getByText('Guia Completo da Plataforma')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao Guia')).toBeInTheDocument();
    expect(screen.getByText('Como assistir aulas')).toBeInTheDocument();
    expect(screen.getByText('Dica: Você ganha pontos a cada aula assistida!')).toBeInTheDocument();
    expect(screen.getByText('Navegue pelos módulos')).toBeInTheDocument();
    expect(screen.getByText('Conclua as lições')).toBeInTheDocument();
    expect(screen.getByText('especial e prática')).toBeInTheDocument();
  });
});
