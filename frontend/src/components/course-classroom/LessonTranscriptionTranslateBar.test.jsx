import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonTranscriptionTranslateBar from './LessonTranscriptionTranslateBar';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

describe('LessonTranscriptionTranslateBar Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when selectedLang is Portuguese (pt)', () => {
    const { container } = render(
      <LessonTranscriptionTranslateBar
        courseId={1}
        moduleId={2}
        lessonId={3}
        selectedLang="pt"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders translate button for manager when selectedLang is en and not yet translated', async () => {
    const onTranslated = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });

    render(
      <LessonTranscriptionTranslateBar
        courseId={1}
        moduleId={2}
        lessonId={3}
        selectedLang="en"
        activeLanguage="pt"
        availableTranslations={[]}
        isManager={true}
        onTranslated={onTranslated}
      />
    );

    expect(screen.getByTestId('lesson-transcription-translate-bar')).toBeInTheDocument();
    const btn = screen.getByTestId('translate-transcription-btn');
    expect(btn).toHaveTextContent('Traduzir para EN');

    fireEvent.click(btn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/2/lessons/3/transcription/translate',
        expect.objectContaining({ method: 'POST' })
      );
      expect(onTranslated).toHaveBeenCalled();
    });
  });

  it('shows translated status when selectedLang is already cached', () => {
    render(
      <LessonTranscriptionTranslateBar
        courseId={1}
        moduleId={2}
        lessonId={3}
        selectedLang="en"
        activeLanguage="en"
        availableTranslations={['en']}
        isManager={false}
      />
    );

    expect(screen.getByText(/Textos exibidos no idioma selecionado \(EN\)/i)).toBeInTheDocument();
    expect(screen.queryByTestId('translate-transcription-btn')).not.toBeInTheDocument();
  });
});
