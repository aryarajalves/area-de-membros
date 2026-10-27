import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeTrigger from './FunnelNodeTrigger';
import FunnelNodeMenu from './FunnelNodeMenu';

describe('FunnelNodeTrigger - Novos Gatilhos da Comunidade & Eventos', () => {
  const availableCourses = [
    { id: 10, title: 'Formação Fullstack Next.js' },
    { id: 20, title: 'Mestrado em IA Generativa' },
  ];

  describe('Gatilho: Primeiro Depoimento (first_testimonial)', () => {
    const node = {
      id: 'trig_depoimento',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'first_testimonial',
        course_id: null,
        course_title: 'Todos os Cursos',
        is_start: true,
      },
    };

    it('renderiza o nó de Primeiro Depoimento com título e seletor de curso', () => {
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={false}
          courses={availableCourses}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByText('PRIMEIRO DEPOIMENTO')).toBeInTheDocument();
      expect(screen.getByTestId('funnel-node-start-badge-trig_depoimento')).toBeInTheDocument();
      expect(screen.getByTestId('select-testimonial-course-trig_depoimento')).toBeInTheDocument();
      expect(screen.getByTestId('testimonial-trigger-summary-trig_depoimento')).toBeInTheDocument();
    });

    it('permite selecionar um curso específico para o depoimento', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const select = screen.getByTestId('select-testimonial-course-trig_depoimento');
      fireEvent.change(select, { target: { value: '20' } });

      expect(onUpdateData).toHaveBeenCalledWith(
        'trig_depoimento',
        expect.objectContaining({
          course_id: 20,
          course_title: 'Mestrado em IA Generativa',
        })
      );
    });
  });

  describe('Gatilho: Primeira Apresentação (first_presentation)', () => {
    const node = {
      id: 'trig_apresentacao',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'first_presentation',
        is_start: true,
      },
    };

    it('renderiza o nó de Primeira Apresentação com card visual informativo', () => {
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByText('PRIMEIRA APRESENTAÇÃO')).toBeInTheDocument();
      expect(screen.getByTestId('presentation-trigger-summary-trig_apresentacao')).toBeInTheDocument();
      expect(screen.getByText(/Dispara imediatamente quando o aluno publicar sua/i)).toBeInTheDocument();
    });
  });

  describe('Gatilho: Subida de Nível / Level Up (level_up)', () => {
    const node = {
      id: 'trig_level_up',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'level_up',
        target_level: 'any',
        is_start: true,
      },
    };

    it('renderiza no modo Qualquer Nível por padrão', () => {
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByText('SUBIDA DE NÍVEL (LEVEL UP)')).toBeInTheDocument();
      expect(screen.getByTestId('level-up-trigger-summary-trig_level_up')).toHaveTextContent(
        /Ativa em qualquer subida de nível/i
      );
    });

    it('permite alternar para Níveis Específicos e selecionar múltiplos níveis do RPG', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={true}
          onUpdateData={onUpdateData}
        />
      );

      const btnSpecific = screen.getByTestId('btn-mode-specific-level-trig_level_up');
      fireEvent.click(btnSpecific);

      expect(onUpdateData).toHaveBeenCalledWith(
        'trig_level_up',
        expect.objectContaining({
          criterion_type: 'specific',
          target_levels: [2],
        })
      );
    });

    it('permite adicionar e remover múltiplos níveis no nó de Level Up', () => {
      const specificNode = {
        ...node,
        data: {
          ...node.data,
          criterion_type: 'specific',
          target_levels: [2, 5],
        },
      };

      const onUpdateData = vi.fn();
      render(
        <FunnelNodeTrigger
          node={specificNode}
          isSelected={true}
          onUpdateData={onUpdateData}
        />
      );

      // Deve renderizar os chips dos níveis 2 e 5
      expect(screen.getByTestId('level-chip-2-trig_level_up')).toBeInTheDocument();
      expect(screen.getByTestId('level-chip-5-trig_level_up')).toBeInTheDocument();

      // Adicionar nível 10
      const select = screen.getByTestId('select-specific-level-trig_level_up');
      fireEvent.change(select, { target: { value: '10' } });

      expect(onUpdateData).toHaveBeenCalledWith(
        'trig_level_up',
        expect.objectContaining({
          target_levels: [2, 5, 10],
        })
      );

      // Remover nível 2 clicando no botão de remover
      const btnRemove2 = screen.getByTestId('btn-remove-level-2-trig_level_up');
      fireEvent.click(btnRemove2);

      expect(onUpdateData).toHaveBeenCalledWith(
        'trig_level_up',
        expect.objectContaining({
          target_levels: [5],
        })
      );
    });
  });

  describe('Gatilho: Presença em Evento (event_attendance)', () => {
    const mockEvents = [
      { id: 101, title: 'Mentoria Vip de Tráfego e Escala' },
      { id: 102, title: 'Workshop de Agentes Autônomos' },
    ];

    const node = {
      id: 'trig_evento',
      type: 'trigger',
      position: { x: 50, y: 50 },
      data: {
        trigger_event: 'event_attendance',
        event_id: 'any',
        event_title: 'Qualquer Evento',
        is_start: true,
      },
    };

    it('renderiza o nó de Presença em Evento com opções', () => {
      render(
        <FunnelNodeTrigger
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByText('PRESENÇA EM EVENTO')).toBeInTheDocument();
      expect(screen.getByTestId('select-attendance-event-trig_evento')).toBeInTheDocument();
      expect(screen.getByTestId('event-attendance-trigger-summary-trig_evento')).toBeInTheDocument();
    });
  });

  describe('Catálogo de Nós - FunnelNodeMenu com novos gatilhos', () => {
    it('exibe os 4 novos gatilhos no catálogo e permite seleção', () => {
      const onSelect = vi.fn();
      render(
        <FunnelNodeMenu
          position={{ x: 100, y: 100 }}
          onSelectNode={onSelect}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('add-node-trigger_first_testimonial')).toBeInTheDocument();
      expect(screen.getByTestId('add-node-trigger_first_presentation')).toBeInTheDocument();
      expect(screen.getByTestId('add-node-trigger_level_up')).toBeInTheDocument();
      expect(screen.getByTestId('add-node-trigger_event_attendance')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('add-node-trigger_first_testimonial'));
      expect(onSelect).toHaveBeenCalledWith(
        'trigger_first_testimonial',
        expect.objectContaining({ trigger_event: 'first_testimonial' })
      );
    });
  });
});
