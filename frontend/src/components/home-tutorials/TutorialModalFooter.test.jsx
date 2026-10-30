import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorialModalFooter from './TutorialModalFooter';

describe('TutorialModalFooter Component', () => {
  it('renders default action buttons when not uploading or saving', () => {
    const handleClose = vi.fn();
    render(
      <TutorialModalFooter
        uploading={false}
        uploadProgress={0}
        uploadStats=""
        saving={false}
        isEditing={false}
        isBusy={false}
        onClose={handleClose}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-tutorial-btn');
    const submitBtn = screen.getByTestId('submit-tutorial-btn');

    expect(cancelBtn).toBeInTheDocument();
    expect(cancelBtn).not.toBeDisabled();
    expect(submitBtn).toHaveTextContent('Criar Tutorial');
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders "Salvar Alterações" when isEditing is true', () => {
    render(
      <TutorialModalFooter
        uploading={false}
        uploadProgress={0}
        uploadStats=""
        saving={false}
        isEditing={true}
        isBusy={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('submit-tutorial-btn')).toHaveTextContent('Salvar Alterações');
  });

  it('renders progress bar and upload stats during video upload below 100%', () => {
    render(
      <TutorialModalFooter
        uploading={true}
        uploadProgress={45}
        uploadStats="61.4 MB de 136.4 MB"
        saving={false}
        isEditing={false}
        isBusy={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('upload-progress-container')).toBeInTheDocument();
    expect(screen.getByTestId('upload-progress-percent')).toHaveTextContent('45%');
    expect(screen.getByText('Enviando arquivo de vídeo (45%)...')).toBeInTheDocument();
    expect(screen.getByText('61.4 MB de 136.4 MB')).toBeInTheDocument();

    const progressBar = screen.getByTestId('upload-progress-bar');
    expect(progressBar).toHaveStyle({ width: '45%' });

    const submitBtn = screen.getByTestId('submit-tutorial-btn');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Enviando Vídeo (45%)...');
  });

  it('renders cloud processing status when upload reaches 100%', () => {
    render(
      <TutorialModalFooter
        uploading={true}
        uploadProgress={100}
        uploadStats="136.4 MB de 136.4 MB"
        saving={false}
        isEditing={false}
        isBusy={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Processando e salvando na nuvem...')).toBeInTheDocument();
    expect(screen.getByTestId('submit-tutorial-btn')).toHaveTextContent('Processando na Nuvem...');
  });

  it('disables buttons when isBusy is true', () => {
    render(
      <TutorialModalFooter
        uploading={false}
        uploadProgress={0}
        uploadStats=""
        saving={true}
        isEditing={false}
        isBusy={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('cancel-tutorial-btn')).toBeDisabled();
    expect(screen.getByTestId('submit-tutorial-btn')).toBeDisabled();
    expect(screen.getByTestId('submit-tutorial-btn')).toHaveTextContent('Salvando...');
  });
});
