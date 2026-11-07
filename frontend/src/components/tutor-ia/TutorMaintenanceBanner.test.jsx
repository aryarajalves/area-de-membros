import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TutorMaintenanceBanner from './TutorMaintenanceBanner';

describe('TutorMaintenanceBanner Component', () => {
  it('renderiza com mensagem padrão quando nenhuma mensagem é fornecida', () => {
    render(<TutorMaintenanceBanner />);

    expect(screen.getByTestId('tutor-maintenance-banner')).toBeInTheDocument();
    expect(screen.getByText('Tutor IA em Manutenção Temporária')).toBeInTheDocument();
    expect(
      screen.getByText(/O Tutor IA está temporariamente em manutenção/i)
    ).toBeInTheDocument();
  });

  it('renderiza mensagem personalizada quando passada por prop', () => {
    render(<TutorMaintenanceBanner message="Estamos atualizando o modelo para a versão 4.0!" />);

    expect(screen.getByText('Estamos atualizando o modelo para a versão 4.0!')).toBeInTheDocument();
  });

  it('exibe badge de modo de teste quando isManager for verdadeiro', () => {
    render(<TutorMaintenanceBanner isManager={true} />);

    expect(screen.getByTestId('badge-admin-maintenance-override')).toBeInTheDocument();
    expect(screen.getByText(/Acesso de Teste/i)).toBeInTheDocument();
  });

  it('não exibe badge de modo de teste para aluno comum', () => {
    render(<TutorMaintenanceBanner isManager={false} />);

    expect(screen.queryByTestId('badge-admin-maintenance-override')).not.toBeInTheDocument();
  });
});
