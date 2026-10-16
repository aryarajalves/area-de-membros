import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeWebhook from './FunnelNodeWebhook';
import FunnelNodeEnrollment from './FunnelNodeEnrollment';
import FunnelNodeGamificationXp from './FunnelNodeGamificationXp';
import FunnelNodeInternalNotify from './FunnelNodeInternalNotify';

describe('Funnel Action Nodes Components', () => {
  const availableCourses = [
    { id: 1, title: 'Curso de React Avançado' },
    { id: 2, title: 'Comunidade VIP de IA' },
  ];

  describe('FunnelNodeWebhook Component', () => {
    const node = {
      id: 'webhook_1',
      type: 'action_webhook',
      position: { x: 100, y: 100 },
      data: { method: 'POST', url: 'https://api.teste.com/webhook' },
    };

    it('renderiza título, handles de entrada/saída e campos de configuração', () => {
      render(
        <FunnelNodeWebhook
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-webhook-webhook_1')).toBeInTheDocument();
      expect(screen.getByText('WEBHOOK EXTERNO')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-webhook_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-webhook_1')).toBeInTheDocument();
      expect(screen.getByTestId('webhook-url-input-webhook_1')).toHaveValue('https://api.teste.com/webhook');
    });

    it('permite alternar método para GET e editar a URL', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeWebhook
          node={node}
          isSelected={true}
          onUpdateData={onUpdateData}
        />
      );

      const getBtn = screen.getByTestId('webhook-method-get-webhook_1');
      fireEvent.click(getBtn);
      expect(onUpdateData).toHaveBeenCalledWith('webhook_1', expect.objectContaining({ method: 'GET' }));

      const urlInput = screen.getByTestId('webhook-url-input-webhook_1');
      fireEvent.change(urlInput, { target: { value: 'https://n8n.webhook.com/receber' } });
      expect(onUpdateData).toHaveBeenCalledWith('webhook_1', expect.objectContaining({ url: 'https://n8n.webhook.com/receber' }));
    });
  });

  describe('FunnelNodeEnrollment Component', () => {
    const node = {
      id: 'enrollment_1',
      type: 'action_enrollment',
      position: { x: 100, y: 100 },
      data: { course_id: 1, course_title: 'Curso de React Avançado', access_duration: 'lifetime' },
    };

    it('renderiza título, handles e seleção de curso e tempo de acesso', () => {
      render(
        <FunnelNodeEnrollment
          node={node}
          isSelected={false}
          courses={availableCourses}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-enrollment-enrollment_1')).toBeInTheDocument();
      expect(screen.getByText('MATRÍCULA AUTOMÁTICA')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-enrollment_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-enrollment_1')).toBeInTheDocument();
      expect(screen.getByTestId('enrollment-course-select-enrollment_1')).toBeInTheDocument();
    });

    it('permite selecionar outro curso e alterar o tempo de acesso para 1 ano', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeEnrollment
          node={node}
          isSelected={true}
          courses={availableCourses}
          onUpdateData={onUpdateData}
        />
      );

      const selectDuration = screen.getByTestId('enrollment-duration-select-enrollment_1');
      fireEvent.change(selectDuration, { target: { value: '1_year' } });
      expect(onUpdateData).toHaveBeenCalledWith('enrollment_1', expect.objectContaining({ access_duration: '1_year' }));

      const selectCourse = screen.getByTestId('enrollment-course-select-enrollment_1');
      fireEvent.change(selectCourse, { target: { value: '2' } });
      expect(onUpdateData).toHaveBeenCalledWith('enrollment_1', expect.objectContaining({ course_id: 2, course_title: 'Comunidade VIP de IA' }));
    });
  });

  describe('FunnelNodeGamificationXp Component', () => {
    const node = {
      id: 'xp_1',
      type: 'action_gamification_xp',
      position: { x: 100, y: 100 },
      data: { xp_amount: 50, reason: 'Desafio Semanal Concluído' },
    };

    it('renderiza título, presets de pontuação e campo de motivo', () => {
      render(
        <FunnelNodeGamificationXp
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-gamification-xp-xp_1')).toBeInTheDocument();
      expect(screen.getByText('RECOMPENSA EM XP')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-xp_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-xp_1')).toBeInTheDocument();
      expect(screen.getByTestId('xp-preset-btn-100-xp_1')).toBeInTheDocument();
    });

    it('permite escolher preset de 100 XP e alterar motivo', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeGamificationXp
          node={node}
          isSelected={true}
          onUpdateData={onUpdateData}
        />
      );

      const btn100 = screen.getByTestId('xp-preset-btn-100-xp_1');
      fireEvent.click(btn100);
      expect(onUpdateData).toHaveBeenCalledWith('xp_1', expect.objectContaining({ xp_amount: 100 }));

      const reasonInput = screen.getByTestId('xp-reason-input-xp_1');
      fireEvent.change(reasonInput, { target: { value: 'Primeira Aula Assistida' } });
      expect(onUpdateData).toHaveBeenCalledWith('xp_1', expect.objectContaining({ reason: 'Primeira Aula Assistida' }));
    });
  });

  describe('FunnelNodeInternalNotify Component', () => {
    const node = {
      id: 'notify_1',
      type: 'action_internal_notify',
      position: { x: 100, y: 100 },
      data: { notify_target: 'admins', message: 'Aluno {aluno} solicitou suporte urgente' },
    };

    it('renderiza título, handles e seleção de destinatário', () => {
      render(
        <FunnelNodeInternalNotify
          node={node}
          isSelected={false}
          onUpdateData={vi.fn()}
        />
      );

      expect(screen.getByTestId('funnel-node-internal-notify-notify_1')).toBeInTheDocument();
      expect(screen.getByText('NOTIFICAÇÃO INTERNA')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-notify_1')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-notify_1')).toBeInTheDocument();
      expect(screen.getByTestId('internal-notify-target-select-notify_1')).toBeInTheDocument();
    });

    it('permite alterar texto da mensagem do alerta', () => {
      const onUpdateData = vi.fn();
      render(
        <FunnelNodeInternalNotify
          node={node}
          isSelected={true}
          onUpdateData={onUpdateData}
        />
      );

      const msgInput = screen.getByTestId('internal-notify-message-input-notify_1');
      fireEvent.change(msgInput, { target: { value: 'Lead qualificado atingiu ponto de compra' } });
      expect(onUpdateData).toHaveBeenCalledWith('notify_1', expect.objectContaining({ message: 'Lead qualificado atingiu ponto de compra' }));
    });
  });
});
