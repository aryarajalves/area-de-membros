import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseModalUpsellTab from './CourseModalUpsellTab';
import * as api from './courseUpsellApi';

describe('CourseModalUpsellTab Component', () => {
  const mockEditingCourse = { id: 10, title: 'Curso de Astrologia' };
  const mockAvailableCourses = [
    { id: 10, title: 'Curso de Astrologia', item_type: 'course' },
    { id: 20, title: 'Bússola Astrológica APP', item_type: 'tool' },
    { id: 30, title: 'Curso Avançado de Previsões', item_type: 'course' }
  ];

  const mockOffers = [
    {
      id: 101,
      course_id: 10,
      target_course_id: 20,
      target_course_title: 'Bússola Astrológica APP',
      progress_pct: 35,
      media_type: 'image',
      media_url: 'https://exemplo.com/banner.png',
      title: 'Acesse o APP da Bússola',
      description: 'Potencialize seus resultados com o software.',
      button_text: 'Quero o App',
      button_url: 'https://app.com/vendas',
      is_active: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders warning when editingCourse has no id', () => {
    render(<CourseModalUpsellTab editingCourse={null} availableCourses={mockAvailableCourses} />);
    expect(screen.getByTestId('upsell-new-course-warning')).toBeInTheDocument();
    expect(screen.getByText('Salve o curso primeiro')).toBeInTheDocument();
  });

  it('loads and displays list of upsell offers', async () => {
    vi.spyOn(api, 'fetchCourseUpsellOffers').mockResolvedValue(mockOffers);

    render(
      <CourseModalUpsellTab
        editingCourse={mockEditingCourse}
        availableCourses={mockAvailableCourses}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('upsell-offer-card-101')).toBeInTheDocument();
    });

    expect(screen.getByText(/🎯 35%/)).toBeInTheDocument();
    expect(screen.getByText('Acesse o APP da Bússola')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica APP')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('opens creation form modal, fills and calls create API', async () => {
    vi.spyOn(api, 'fetchCourseUpsellOffers').mockResolvedValue([]);
    const createSpy = vi.spyOn(api, 'createCourseUpsellOffer').mockResolvedValue({ id: 102, ...mockOffers[0] });
    const addToast = vi.fn();

    render(
      <CourseModalUpsellTab
        editingCourse={mockEditingCourse}
        availableCourses={mockAvailableCourses}
        addToast={addToast}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('upsell-empty-state')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-upsell-offer-btn'));
    expect(screen.getByTestId('upsell-form-modal')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByTestId('upsell-target-course-select'), { target: { value: '30' } });
    fireEvent.change(screen.getByTestId('upsell-title-input'), { target: { value: 'Treinamento Avançado' } });
    fireEvent.click(screen.getByTestId('upsell-toggle-manual-url-btn'));
    fireEvent.change(screen.getByTestId('upsell-media-url-input'), { target: { value: 'https://exemplo.com/media.mp4' } });
    fireEvent.click(screen.getByTestId('upsell-show-in-sidebar-checkbox'));

    fireEvent.click(screen.getByTestId('save-upsell-form-btn'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(10, expect.objectContaining({
        target_course_id: 30,
        title: 'Treinamento Avançado',
        media_url: 'https://exemplo.com/media.mp4',
        show_in_sidebar: true
      }));
      expect(addToast).toHaveBeenCalledWith('Anúncio de upsell criado com sucesso!', 'success');
    });
  });

  it('opens delete confirmation and calls delete API', async () => {
    vi.spyOn(api, 'fetchCourseUpsellOffers').mockResolvedValue(mockOffers);
    const deleteSpy = vi.spyOn(api, 'deleteCourseUpsellOffer').mockResolvedValue(true);
    const addToast = vi.fn();

    render(
      <CourseModalUpsellTab
        editingCourse={mockEditingCourse}
        availableCourses={mockAvailableCourses}
        addToast={addToast}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-offer-btn-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-offer-btn-101'));
    expect(screen.getByTestId('upsell-delete-confirm-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete-upsell-btn'));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(101);
      expect(addToast).toHaveBeenCalledWith('Anúncio excluído com sucesso!', 'success');
    });
  });
});
