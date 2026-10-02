import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BackgroundUploadWidget from './BackgroundUploadWidget';
import * as UploadQueueModule from '../../context/UploadQueueContext';

describe('BackgroundUploadWidget Component', () => {
  it('returns null when there are no uploads in queue', () => {
    vi.spyOn(UploadQueueModule, 'useUploadQueue').mockReturnValue({
      uploads: [],
      cancelUpload: vi.fn(),
      clearCompleted: vi.fn(),
      activeUploadsCount: 0,
      isWidgetExpanded: true,
      setIsWidgetExpanded: vi.fn()
    });

    const { container } = render(<BackgroundUploadWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('renders floating card with active uploads and allows collapsing/expanding', () => {
    const mockSetExpanded = vi.fn();
    vi.spyOn(UploadQueueModule, 'useUploadQueue').mockReturnValue({
      uploads: [
        {
          id: 'up_1',
          fileName: 'aula01.mp4',
          lessonTitle: 'Aula 01 - Introdução',
          progress: 45,
          status: 'uploading'
        },
        {
          id: 'up_2',
          fileName: 'aula02.mp4',
          lessonTitle: 'Aula 02 - Prática',
          progress: 100,
          status: 'completed'
        }
      ],
      cancelUpload: vi.fn(),
      clearCompleted: vi.fn(),
      activeUploadsCount: 1,
      isWidgetExpanded: true,
      setIsWidgetExpanded: mockSetExpanded
    });

    render(<BackgroundUploadWidget />);

    expect(screen.getByTestId('background-upload-widget')).toBeInTheDocument();
    expect(screen.getByText('Enviando 1 vídeo...')).toBeInTheDocument();
    expect(screen.getByText('Aula 01 - Introdução')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Aula 02 - Prática')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();

    // Clica no botão de alternar expansão
    fireEvent.click(screen.getByTestId('toggle-upload-widget-btn'));
    expect(mockSetExpanded).toHaveBeenCalledWith(false);
  });

  it('calls cancelUpload when user clicks cancel button on an item', () => {
    const mockCancel = vi.fn();
    vi.spyOn(UploadQueueModule, 'useUploadQueue').mockReturnValue({
      uploads: [
        {
          id: 'up_1',
          fileName: 'aula01.mp4',
          lessonTitle: 'Aula 01',
          progress: 30,
          status: 'uploading'
        }
      ],
      cancelUpload: mockCancel,
      clearCompleted: vi.fn(),
      activeUploadsCount: 1,
      isWidgetExpanded: true,
      setIsWidgetExpanded: vi.fn()
    });

    render(<BackgroundUploadWidget />);

    const cancelBtn = screen.getByTestId('cancel-upload-up_1');
    fireEvent.click(cancelBtn);
    expect(mockCancel).toHaveBeenCalledWith('up_1');
  });
});
