import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeTrigger from './FunnelNodeTrigger';

describe('FunnelNodeTrigger - Novos Gatilhos Pedagógicos', () => {
  const availableCourses = [
    { id: 1, title: 'Curso de React Avançado' },
    { id: 2, title: 'Curso de Python & FastAPI' },
  ];

  describe('Gatilho: Marco de Progresso (progress_milestone)', () => {
    const progressNode = {
      id: 'trigger_progress_1',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'progress_milestone',
        milestone: '50',
        course_id: null,
      },
    };

    it('renderiza o nó de progresso com botões de marco e seletor de curso', () => {
      render(
        <FunnelNodeTrigger
          node={progressNode}
          isSelected={false}
          courses={availableCourses}
          onUpdateData={vi.fn()}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-trigger-trigger_progress_1')).toBeInTheDocument();
      expect(screen.getByText('MARCO DE PROGRESSO')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-milestone-btn-25-trigger_progress_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-milestone-btn-50-trigger_progress_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-milestone-btn-75-trigger_progress_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-milestone-btn-100-trigger_progress_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-progress-course-select-trigger_progress_1')).toBeInTheDocument();
    });

    it('permite alterar a porcentagem do marco para 100%', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={progressNode}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const btn100 = screen.getByTestId('trigger-milestone-btn-100-trigger_progress_1');
      fireEvent.click(btn100);

      expect(onUpdateData).toHaveBeenCalledWith('trigger_progress_1', expect.objectContaining({
        trigger_event: 'progress_milestone',
        milestone: '100',
      }));
    });

    it('permite selecionar um curso específico para o marco', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={progressNode}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const selectCourse = screen.getByTestId('trigger-progress-course-select-trigger_progress_1');
      fireEvent.change(selectCourse, { target: { value: '1' } });

      expect(onUpdateData).toHaveBeenCalledWith('trigger_progress_1', expect.objectContaining({
        course_id: 1,
        course_title: 'Curso de React Avançado',
      }));
    });
  });

  describe('Gatilho: Aviso de Renovação/Expiração (renewal_warning)', () => {
    const renewalNode = {
      id: 'trigger_renewal_1',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'renewal_warning',
        days_before: 7,
        course_id: null,
      },
    };

    it('renderiza o nó de aviso de expiração com presets de dias', () => {
      render(
        <FunnelNodeTrigger
          node={renewalNode}
          isSelected={false}
          courses={availableCourses}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-trigger-trigger_renewal_1')).toBeInTheDocument();
      expect(screen.getByText('AVISO DE EXPIRAÇÃO')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-renewal-btn-7-trigger_renewal_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-renewal-btn-3-trigger_renewal_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-renewal-btn-0-trigger_renewal_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-renewal-course-select-trigger_renewal_1')).toBeInTheDocument();
    });

    it('permite alternar para aviso no próprio dia da expiração (0 dias)', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={renewalNode}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const btn0d = screen.getByTestId('trigger-renewal-btn-0-trigger_renewal_1');
      fireEvent.click(btn0d);

      expect(onUpdateData).toHaveBeenCalledWith('trigger_renewal_1', expect.objectContaining({
        trigger_event: 'renewal_warning',
        days_before: 0,
      }));
    });
  });

  describe('Gatilho: Alerta de Inatividade (student_inactivity)', () => {
    const inactivityNode = {
      id: 'trigger_inactivity_1',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'student_inactivity',
        inactive_days: 7,
        course_id: null,
      },
    };

    it('renderiza o nó de inatividade com presets de dias e seletor', () => {
      render(
        <FunnelNodeTrigger
          node={inactivityNode}
          isSelected={false}
          courses={availableCourses}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-trigger-trigger_inactivity_1')).toBeInTheDocument();
      expect(screen.getByText('ALERTA DE INATIVIDADE')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-inactivity-btn-3-trigger_inactivity_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-inactivity-btn-7-trigger_inactivity_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-inactivity-btn-14-trigger_inactivity_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-inactivity-btn-30-trigger_inactivity_1')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-inactivity-course-select-trigger_inactivity_1')).toBeInTheDocument();
    });

    it('permite alterar o tempo de inatividade para 14 dias', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={inactivityNode}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const btn14d = screen.getByTestId('trigger-inactivity-btn-14-trigger_inactivity_1');
      fireEvent.click(btn14d);

      expect(onUpdateData).toHaveBeenCalledWith('trigger_inactivity_1', expect.objectContaining({
        trigger_event: 'student_inactivity',
        inactive_days: 14,
      }));
    });
  });
});
