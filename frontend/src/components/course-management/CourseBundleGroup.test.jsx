import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseBundleGroup from './CourseBundleGroup';

describe('CourseBundleGroup Component', () => {
  const sampleBundle = {
    bundleId: 10,
    title: 'Bússola Astrológica',
    totalItems: 2,
    hasAccess: true,
    courses: [
      {
        id: 10,
        title: 'Bússola Astrológica',
        item_type: 'course',
        description: 'Curso completo de introdução e leitura de mapas.',
        has_access: true,
      },
      {
        id: 20,
        title: 'Bússola Astrológica APP',
        item_type: 'tool',
        description: 'Software de cálculo astronômico e efemérides.',
        tool_url: 'https://app.bussola.com',
        has_access: true,
      },
    ],
  };

  it('renderiza o container do pacote com título, badges de contagem e produtos', () => {
    render(
      <CourseBundleGroup
        bundle={sampleBundle}
        isManager={false}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        cardBg="rgba(255, 255, 255, 0.04)"
        cardBorder="1px solid rgba(255, 255, 255, 0.1)"
        onSelectCourse={vi.fn()}
      />
    );

    expect(screen.getByTestId('bundle-box-10')).toBeInTheDocument();
    expect(screen.getAllByText('Bússola Astrológica').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('2 Produtos Inclusos')).toBeInTheDocument();
    expect(screen.getByText('1 Curso')).toBeInTheDocument();
    expect(screen.getByText('1 Ferramenta')).toBeInTheDocument();
    expect(screen.getByText('Acesso Liberado')).toBeInTheDocument();

    // Renderiza ambos os produtos dentro do container
    expect(screen.getByText('Bússola Astrológica APP')).toBeInTheDocument();
  });

  it('exibe badge de Combo Bloqueado quando hasAccess for falso', () => {
    const lockedBundle = {
      ...sampleBundle,
      hasAccess: false,
    };

    render(
      <CourseBundleGroup
        bundle={lockedBundle}
        isManager={false}
        isLightBg={true}
        textColor="#0f172a"
        subTextColor="#64748b"
        cardBg="#ffffff"
        cardBorder="1px solid #e2e8f0"
        onSelectCourse={vi.fn()}
      />
    );

    expect(screen.getByText('Combo Bloqueado')).toBeInTheDocument();
  });

  it('permite que o aluno selecione o curso dentro do pacote', () => {
    const onSelectCourse = vi.fn();

    render(
      <CourseBundleGroup
        bundle={sampleBundle}
        isManager={false}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        cardBg="rgba(255, 255, 255, 0.04)"
        cardBorder="1px solid rgba(255, 255, 255, 0.1)"
        onSelectCourse={onSelectCourse}
      />
    );

    const accessBtn = screen.getByTestId('access-course-btn-10');
    fireEvent.click(accessBtn);
    expect(onSelectCourse).toHaveBeenCalledWith(sampleBundle.courses[0]);
  });
});
