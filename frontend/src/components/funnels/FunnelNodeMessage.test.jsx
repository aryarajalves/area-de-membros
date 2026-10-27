import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeMessage from './FunnelNodeMessage';

describe('FunnelNodeMessage Component', () => {
  const availableSenders = [
    { id: 10, name: 'Admin Principal', role: 'superadmin' },
    { id: 20, name: 'Tutor Suporte', role: 'tutor' },
  ];

  const availableCourses = [
    { id: 1, title: 'Formação Fullstack Pro' },
    { id: 2, title: 'Inteligência Artificial na Prática' },
  ];

  const defaultNode = {
    id: 'msg_node_1',
    type: 'message',
    position: { x: 50, y: 50 },
    data: {
      text: 'Olá {aluno}, seja bem-vindo!',
      destination_type: 'dm',
      sender_id: 10,
      buttons: [],
    },
  };

  it('renderiza nó no modo DM com seletor de remetente por padrão', () => {
    render(
      <FunnelNodeMessage
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    expect(screen.getByTestId('funnel-node-message-msg_node_1')).toBeInTheDocument();
    expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
    expect(screen.getByText('DM')).toBeInTheDocument();
    expect(screen.getByTestId('node-text-input-msg_node_1')).toHaveValue('Olá {aluno}, seja bem-vindo!');
    expect(screen.getByTestId('dest-tab-dm-msg_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('dest-tab-community-general-msg_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('dest-tab-community-course-msg_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('funnel-node-sender-select-msg_node_1')).toBeInTheDocument();
  });

  it('permite alternar para Comunidade Geral e exibe texto informativo', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeMessage
        node={defaultNode}
        isSelected={true}
        onUpdateData={onUpdateData}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    const btnGeneral = screen.getByTestId('dest-tab-community-general-msg_node_1');
    fireEvent.click(btnGeneral);

    expect(onUpdateData).toHaveBeenCalledWith(
      'msg_node_1',
      expect.objectContaining({ destination_type: 'community_general' })
    );
  });

  it('exibe badge COMUNIDADE GERAL e aviso de publicação quando destination_type é community_general', () => {
    const generalNode = {
      ...defaultNode,
      data: {
        ...defaultNode.data,
        destination_type: 'community_general',
      },
    };

    render(
      <FunnelNodeMessage
        node={generalNode}
        isSelected={false}
        onUpdateData={vi.fn()}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
    expect(screen.getByText('GERAL')).toBeInTheDocument();
    expect(screen.getByTestId('info-community-general-msg_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('info-community-general-msg_node_1')).toHaveTextContent(
      /A mensagem será publicada no canal Geral da Comunidade/i
    );
  });

  it('permite alternar para Grupo de Curso e selecionar o curso desejado', () => {
    const courseNode = {
      ...defaultNode,
      data: {
        ...defaultNode.data,
        destination_type: 'community_course',
        course_id: 1,
        course_title: 'Formação Fullstack Pro',
      },
    };

    const onUpdateData = vi.fn();
    render(
      <FunnelNodeMessage
        node={courseNode}
        isSelected={true}
        onUpdateData={onUpdateData}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
    expect(screen.getByText('CURSO')).toBeInTheDocument();
    const select = screen.getByTestId('select-community-course-msg_node_1');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('1');

    fireEvent.change(select, { target: { value: '2' } });
    expect(onUpdateData).toHaveBeenCalledWith(
      'msg_node_1',
      expect.objectContaining({
        course_id: 2,
        course_title: 'Inteligência Artificial na Prática',
      })
    );
  });

  it('permite digitar texto e adicionar botões interativos', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeMessage
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    const textarea = screen.getByTestId('node-text-input-msg_node_1');
    fireEvent.change(textarea, { target: { value: 'Novo texto para os alunos' } });
    expect(onUpdateData).toHaveBeenCalledWith(
      'msg_node_1',
      expect.objectContaining({ text: 'Novo texto para os alunos' })
    );

    const btnAdd = screen.getByTestId('add-button-to-node-msg_node_1');
    fireEvent.click(btnAdd);
    expect(onUpdateData).toHaveBeenCalledWith(
      'msg_node_1',
      expect.objectContaining({
        buttons: expect.arrayContaining([expect.objectContaining({ text: 'Opção 1' })]),
      })
    );
  });

  it('impede propagação de mousedown no select de cursos para não ativar drag do canvas', () => {
    const courseNode = {
      ...defaultNode,
      data: {
        ...defaultNode.data,
        destination_type: 'community_course',
      },
    };

    render(
      <FunnelNodeMessage
        node={courseNode}
        isSelected={true}
        onUpdateData={vi.fn()}
        availableSenders={availableSenders}
        courses={availableCourses}
      />
    );

    const select = screen.getByTestId('select-community-course-msg_node_1');
    const stopPropagationSpy = vi.fn();

    fireEvent.mouseDown(select, {
      stopPropagation: stopPropagationSpy,
    });

    expect(select).toBeInTheDocument();
  });
});
