import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseDescriptionModal from './CourseDescriptionModal';

describe('CourseDescriptionModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Bússola Astrológica',
    description: 'Este é o primeiro parágrafo.\n\nEste é o segundo parágrafo detalhado com orientações.',
    isLightBg: false
  };

  it('não deve renderizar nada quando isOpen for falso', () => {
    const { container } = render(
      <CourseDescriptionModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar o modal com título, ícone e parágrafos formatados', () => {
    render(<CourseDescriptionModal {...defaultProps} />);

    expect(screen.getByTestId('course-description-modal')).toBeInTheDocument();
    expect(screen.getByTestId('course-description-modal-title')).toHaveTextContent('Bússola Astrológica');
    expect(screen.getByText('Descrição Detalhada do Treinamento')).toBeInTheDocument();
    expect(screen.getByText('Este é o primeiro parágrafo.')).toBeInTheDocument();
    expect(screen.getByText('Este é o segundo parágrafo detalhado com orientações.')).toBeInTheDocument();
  });

  it('exibe mensagem padrão de fallback quando a descrição for vazia', () => {
    render(<CourseDescriptionModal {...defaultProps} description="" />);
    expect(
      screen.getByText('Nenhuma descrição detalhada informada para este curso.')
    ).toBeInTheDocument();
  });

  it('não deve fechar ao clicar no overlay de fundo (regra UX: sem fechar ao clicar fora)', () => {
    const onClose = vi.fn();
    render(<CourseDescriptionModal {...defaultProps} onClose={onClose} />);

    const overlay = screen.getByTestId('course-description-modal-overlay');
    fireEvent.click(overlay);

    // Conforme a regra de negócio/UX do sistema, cliques fora não devem acionar o onClose
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deve fechar ao clicar no botão X superior', () => {
    const onClose = vi.fn();
    render(<CourseDescriptionModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByTestId('close-course-description-modal-btn');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve fechar ao clicar no botão "Fechar" do rodapé', () => {
    const onClose = vi.fn();
    render(<CourseDescriptionModal {...defaultProps} onClose={onClose} />);

    const footerBtn = screen.getByTestId('confirm-close-course-description-modal-btn');
    fireEvent.click(footerBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve fechar ao pressionar a tecla Escape', () => {
    const onClose = vi.fn();
    render(<CourseDescriptionModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar cores corretas quando isLightBg for verdadeiro', () => {
    render(<CourseDescriptionModal {...defaultProps} isLightBg={true} />);

    const modalDialog = screen.getByTestId('course-description-modal');
    expect(modalDialog.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });
});
