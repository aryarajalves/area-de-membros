import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorialModal from './TutorialModal';
import * as api from './tutorialsApi';

describe('TutorialModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'mock_admin_token');
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-video-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TutorialModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all form fields and AI button when isOpen is true', () => {
    render(
      <TutorialModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Nova Aula de Tutorial')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('generate-ai-description-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-video-type-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-video-type-url-btn')).toBeInTheDocument();
  });

  it('disables "Gerar com IA" button when no video file or URL is present', () => {
    render(
      <TutorialModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const aiBtn = screen.getByTestId('generate-ai-description-btn');
    expect(aiBtn).toBeDisabled();
  });

  it('renders video preview when a file is selected', async () => {
    render(
      <TutorialModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('tutorial-file-input');
    const mockFile = new File(['fake mp4 bytes'], 'aula_navegacao.mp4', { type: 'video/mp4' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-video-preview-container')).toBeInTheDocument();
      expect(screen.getByText('Renderização do Vídeo')).toBeInTheDocument();
    });
  });

  it('generates description and duration with AI when clicking "Gerar com IA"', async () => {
    const handleToast = vi.fn();
    vi.spyOn(api, 'generateTutorialAiDescriptionApi').mockResolvedValueOnce({
      description: 'Neste vídeo você aprenderá a navegar pelas trilhas de aprendizagem e explorar os tutoriais.',
      full_transcript: 'Olá pessoal, neste vídeo vou ensinar a navegar...',
      duration: '03:15',
    });

    render(
      <TutorialModal
        isOpen={true}
        onClose={vi.fn()}
        addToast={handleToast}
      />
    );

    // Seleciona um arquivo de vídeo
    const fileInput = screen.getByTestId('tutorial-file-input');
    const mockFile = new File(['fake mp4'], 'tutorial_ia.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const aiBtn = screen.getByTestId('generate-ai-description-btn');
    expect(aiBtn).not.toBeDisabled();

    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(api.generateTutorialAiDescriptionApi).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
        }),
        'mock_admin_token'
      );
    });

    await waitFor(() => {
      const descInput = screen.getByTestId('tutorial-description-input');
      expect(descInput.value).toBe('Neste vídeo você aprenderá a navegar pelas trilhas de aprendizagem e explorar os tutoriais.');
      expect(screen.getByTestId('tutorial-duration-input').value).toBe('03:15');
    });

    expect(handleToast).toHaveBeenCalledWith('Descrição gerada com sucesso pela IA!', 'success');
  });

  it('submits form with external video url successfully', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(api, 'createTutorialApi').mockResolvedValueOnce({
      id: 10,
      title: 'Tutorial com Link Externo',
      video_url: 'https://youtube.com/watch?v=123',
    });

    render(
      <TutorialModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        addToast={handleToast}
      />
    );

    // Troca para tipo URL
    fireEvent.click(screen.getByTestId('tutorial-video-type-url-btn'));

    fireEvent.change(screen.getByTestId('tutorial-title-input'), {
      target: { value: 'Tutorial com Link Externo' },
    });
    fireEvent.change(screen.getByTestId('tutorial-video-url-input'), {
      target: { value: 'https://youtube.com/watch?v=123' },
    });

    const form = screen.getByTestId('tutorial-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.createTutorialApi).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tutorial com Link Externo',
          video_url: 'https://youtube.com/watch?v=123',
        }),
        'mock_admin_token'
      );
    });

    expect(handleToast).toHaveBeenCalledWith('Aula de tutorial criada com sucesso!', 'success');
    expect(handleClose).toHaveBeenCalled();
  });

  it('submits form with video file upload and shows progress indicator until created', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(api, 'uploadTutorialVideoApi').mockImplementation(async (file, token, onProgress) => {
      if (onProgress) {
        onProgress(50, 50 * 1024 * 1024, 100 * 1024 * 1024);
      }
      return {
        video_url: 'https://b2.com/video_upload.mp4',
        video_key: 'AreaDeMembros/tutorials/video_upload.mp4',
      };
    });

    vi.spyOn(api, 'createTutorialApi').mockResolvedValueOnce({
      id: 11,
      title: 'Tutorial com Arquivo Local',
      video_url: 'https://b2.com/video_upload.mp4',
    });

    render(
      <TutorialModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        addToast={handleToast}
      />
    );

    const fileInput = screen.getByTestId('tutorial-file-input');
    const mockFile = new File(['fake mp4 bytes'], 'video_local.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const form = screen.getByTestId('tutorial-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.uploadTutorialVideoApi).toHaveBeenCalled();
      expect(api.createTutorialApi).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Video local',
          video_url: 'https://b2.com/video_upload.mp4',
        }),
        'mock_admin_token'
      );
    });

    expect(handleSuccess).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
