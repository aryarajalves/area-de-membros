import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewSupportTopicModal from './NewSupportTopicModal';

const mockAddToast = vi.fn();

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

describe('NewSupportTopicModal Component', () => {
  const mockCourses = [
    {
      id: 10,
      title: 'Astrowake',
      item_type: 'course',
      is_support_locked: false,
      modules: [
        {
          id: 101,
          title: 'Módulo 1 - Comece por aqui',
          order: 1,
          lessons: [
            { id: 1001, title: 'Instruções iniciais', order: 1 },
            { id: 1002, title: 'Desvendando o Mapa Astral', order: 2 },
          ],
        },
        {
          id: 102,
          title: 'Módulo 2 - Avançado',
          order: 2,
          lessons: [
            { id: 1003, title: 'Aspectos Planetários', order: 1 },
          ],
        },
      ],
    },
    {
      id: 11,
      title: 'Bussola Astrologica',
      item_type: 'course',
      is_support_locked: false,
      modules: [],
    },
    {
      id: 12,
      title: 'Bussola Astrologica APP',
      item_type: 'tool',
      is_support_locked: false,
      modules: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('constrains modal height to 88vh with internal scrollable form to prevent screen overflow', () => {
    render(
      <NewSupportTopicModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        onTopicCreated={vi.fn()}
      />
    );

    const modal = screen.getByTestId('new-support-topic-modal');
    const modalContent = modal.querySelector('.modal-content');
    const form = modal.querySelector('form');

    expect(modalContent.style.maxHeight).toBe('88vh');
    expect(form.style.overflowY).toBe('auto');

    // Exibe apenas o curso com aulas ("Astrowake") e o App ("Bussola Astrologica APP"), ocultando o curso sem aulas ("Bussola Astrologica")
    const courseSelect = screen.getByTestId('support-course-select');
    const optionTexts = Array.from(courseSelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(optionTexts).toEqual(['Astrowake', 'Bussola Astrologica APP']);
  });

  it('allows selecting optional module and lesson, uploading multiple media files, and submitting them', async () => {
    let uploadCall = 0;
    global.fetch.mockImplementation((url) => {
      if (url === '/api/v1/support/upload-image') {
        uploadCall += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({ image_url: `https://cdn.example.com/img${uploadCall}.png` }),
        });
      }
      if (url === '/api/v1/support/topics') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 99, title: 'Erro na aula' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const onTopicCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <NewSupportTopicModal
        isOpen={true}
        onClose={onClose}
        courses={mockCourses}
        onTopicCreated={onTopicCreated}
      />
    );

    // Antes de selecionar um módulo, o campo de aula fica bloqueado e não lista aulas
    const lessonSelect = screen.getByTestId('support-lesson-select');
    expect(lessonSelect).toBeDisabled();
    expect(screen.queryByTestId('support-lesson-select-dropdown')).not.toBeInTheDocument();

    // Digita para filtrar o módulo e seleciona a opção filtrada
    const moduleSelect = screen.getByTestId('support-module-select');
    fireEvent.focus(moduleSelect);
    fireEvent.change(moduleSelect, { target: { value: 'Comece por aqui' } });
    expect(screen.getByTestId('support-module-select-option-101')).toBeInTheDocument();
    expect(screen.queryByTestId('support-module-select-option-102')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('support-module-select-option-101'));

    // Agora o campo de aula está habilitado; digita para filtrar a aula e seleciona
    expect(lessonSelect).not.toBeDisabled();
    fireEvent.focus(lessonSelect);
    fireEvent.change(lessonSelect, { target: { value: 'Mapa Astral' } });
    expect(screen.getByTestId('support-lesson-select-option-1002')).toBeInTheDocument();
    expect(screen.queryByTestId('support-lesson-select-option-1001')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('support-lesson-select-option-1002'));

    // Faz upload de 2 imagens de uma vez
    const fileInput = screen.getByTestId('support-image-file-input');
    const file1 = new File(['dummy1'], 'print1.png', { type: 'image/png' });
    const file2 = new File(['dummy2'], 'print2.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByTestId('support-attached-images-grid')).toBeInTheDocument();
      expect(screen.getByText('2 mídias anexadas')).toBeInTheDocument();
    });

    // Preenche título e descrição
    fireEvent.change(screen.getByTestId('support-title-input'), {
      target: { value: 'Tela vermelha ao acessar PDF' },
    });
    fireEvent.change(screen.getByTestId('support-content-input'), {
      target: { value: 'Apareceu aviso do SmartScreen na aula 2.' },
    });

    // Submete
    fireEvent.click(screen.getByTestId('submit-new-topic-btn'));

    await waitFor(() => {
      expect(onTopicCreated).toHaveBeenCalled();
    });

    const postCall = global.fetch.mock.calls.find(([url]) => url === '/api/v1/support/topics');
    expect(postCall).toBeTruthy();
    const sentBody = JSON.parse(postCall[1].body);
    expect(sentBody).toEqual({
      course_id: 10,
      module_id: 101,
      lesson_id: 1002,
      title: 'Tela vermelha ao acessar PDF',
      content: 'Apareceu aviso do SmartScreen na aula 2.',
      image_url: 'https://cdn.example.com/img1.png',
      image_urls: [
        'https://cdn.example.com/img1.png',
        'https://cdn.example.com/img2.png',
      ],
    });
  });
});
