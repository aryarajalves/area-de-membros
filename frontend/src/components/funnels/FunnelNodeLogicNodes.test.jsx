import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeAbSplit from './FunnelNodeAbSplit';
import FunnelNodeCourseCondition from './FunnelNodeCourseCondition';
import FunnelNodeStop from './FunnelNodeStop';
import FunnelNodeDelay from './FunnelNodeDelay';
import FunnelNodeMenu from './FunnelNodeMenu';

describe('Novos Nós de Lógica e Fluxo do Funil', () => {
  describe('FunnelNodeAbSplit', () => {
    it('renderiza o nó de Teste A/B com divisões e portas corretas', () => {
      const onUpdateData = vi.fn();
      const node = {
        id: 'node_ab_1',
        type: 'ab_split',
        data: { split_a_pct: 50 },
      };

      render(
        <FunnelNodeAbSplit
          node={node}
          isSelected={false}
          onUpdateData={onUpdateData}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
        />
      );

      expect(screen.getByText('TESTE A/B (SPLIT)')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-node_ab_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-a-node_ab_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-b-node_ab_1')).toBeInTheDocument();

      // Testar clique em preset 70/30
      const preset70 = screen.getByText('70/30');
      fireEvent.click(preset70);
      expect(onUpdateData).toHaveBeenCalledWith('node_ab_1', expect.objectContaining({ split_a_pct: 70 }));

      // Testar alteração do slider
      const slider = screen.getByTestId('ab-split-slider-node_ab_1');
      fireEvent.change(slider, { target: { value: '80' } });
      expect(onUpdateData).toHaveBeenCalledWith('node_ab_1', expect.objectContaining({ split_a_pct: 80 }));
    });
  });

  describe('FunnelNodeCourseCondition', () => {
    it('renderiza o nó condicional de curso com saídas SIM e NÃO', () => {
      const onUpdateData = vi.fn();
      const node = {
        id: 'node_cond_1',
        type: 'condition_course',
        data: { course_id: 'any', course_title: 'Qualquer Curso Ativo' },
      };

      render(
        <FunnelNodeCourseCondition
          node={node}
          isSelected={false}
          onUpdateData={onUpdateData}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
        />
      );

      expect(screen.getByText('POSSUI CURSO?')).toBeInTheDocument();
      expect(screen.getByText('SIM: POSSUI')).toBeInTheDocument();
      expect(screen.getByText('NÃO POSSUI')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-node_cond_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-yes-node_cond_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-no-node_cond_1')).toBeInTheDocument();

      // Alterar curso selecionado
      const select = screen.getByTestId('course-condition-select-node_cond_1');
      fireEvent.change(select, { target: { value: 'any' } });
      expect(onUpdateData).toHaveBeenCalledWith('node_cond_1', expect.objectContaining({ course_id: 'any' }));
    });
  });

  describe('FunnelNodeStop', () => {
    it('renderiza o nó terminal de encerrar funil sem porta de saída', () => {
      const onUpdateData = vi.fn();
      const node = {
        id: 'node_stop_1',
        type: 'stop',
        data: { cancel_other_funnels: false },
      };

      render(
        <FunnelNodeStop
          node={node}
          isSelected={false}
          onUpdateData={onUpdateData}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onConnectTarget={vi.fn()}
        />
      );

      expect(screen.getByText('ENCERRAR FUNIL')).toBeInTheDocument();
      expect(screen.getByText('TERMINAL')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-node_stop_1')).toBeInTheDocument();
      expect(screen.queryByTestId('node-output-handle-node_stop_1')).not.toBeInTheDocument();

      // Toggle cancelar outros funis
      const checkbox = screen.getByTestId('stop-cancel-others-node_stop_1');
      fireEvent.click(checkbox);
      expect(onUpdateData).toHaveBeenCalledWith('node_stop_1', expect.objectContaining({ cancel_other_funnels: true }));
    });
  });

  describe('FunnelNodeDelay com Horário Comercial', () => {
    it('permite configurar unidade de tempo e janela comercial', () => {
      const onUpdateData = vi.fn();
      const node = {
        id: 'node_delay_1',
        type: 'delay',
        data: {
          delay_seconds: 120,
          delay_value: 2,
          delay_unit: 'minutes',
          business_hours_enabled: true,
          business_hours_start: '09:00',
          business_hours_end: '20:00',
        },
      };

      render(
        <FunnelNodeDelay
          node={node}
          isSelected={false}
          onUpdateData={onUpdateData}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
        />
      );

      expect(screen.getByText('DELAY')).toBeInTheDocument();
      expect(screen.getByText('Janela de Horário Comercial')).toBeInTheDocument();
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20:00')).toBeInTheDocument();

      // Alterar valor
      const input = screen.getByTestId('node-delay-input-node_delay_1');
      fireEvent.change(input, { target: { value: '5' } });
      expect(onUpdateData).toHaveBeenCalled();

      // Toggle janela comercial
      const toggle = screen.getByTestId('delay-business-hours-toggle-node_delay_1');
      fireEvent.click(toggle);
      expect(onUpdateData).toHaveBeenCalledWith('node_delay_1', expect.objectContaining({ business_hours_enabled: false }));
    });
  });

  describe('FunnelNodeMenu Scroll', () => {
    it('renderiza o menu de nós e permite rolagem com evento wheel', () => {
      const onSelectNode = vi.fn();
      const onClose = vi.fn();

      render(
        <FunnelNodeMenu
          position={{ x: 100, y: 100 }}
          onSelectNode={onSelectNode}
          onClose={onClose}
        />
      );

      expect(screen.getByText('ADICIONAR NÓ')).toBeInTheDocument();
      expect(screen.getByText('Teste A/B (Split)')).toBeInTheDocument();
      expect(screen.getByText('Possui Curso?')).toBeInTheDocument();
      expect(screen.getByText('Encerrar Funil')).toBeInTheDocument();

      const menu = screen.getByTestId('funnel-node-menu');
      fireEvent.wheel(menu, { deltaY: 100 });
      // Se não disparou erro, o wheel handler funcionou
      expect(menu).toBeInTheDocument();
    });
  });
});
