import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseReleaseScheduleCard, { toDatetimeLocalValue, formatReleaseDateTimePtBr } from './CourseReleaseScheduleCard';

describe('CourseReleaseScheduleCard & CourseChannelLockSelector', () => {
  it('renderiza as três opções de liberação do curso', () => {
    const setReleaseType = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="immediate"
        setReleaseType={setReleaseType}
        releaseDate=""
        setReleaseDate={vi.fn()}
      />
    );

    expect(screen.getByTestId('course-release-schedule-card')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-status-badge')).toHaveTextContent('Liberado');
    expect(screen.getByTestId('course-release-option-immediate')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-option-closed')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-option-specific_date')).toBeInTheDocument();
  });

  it('aciona setReleaseType ao clicar em Fechar para Todos os Alunos', () => {
    const setReleaseType = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="immediate"
        setReleaseType={setReleaseType}
        releaseDate=""
        setReleaseDate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('course-release-option-closed'));
    expect(setReleaseType).toHaveBeenCalledWith('closed');
  });

  it('exibe o seletor de data e hora quando releaseType é specific_date', () => {
    const setReleaseDate = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="specific_date"
        setReleaseType={vi.fn()}
        releaseDate="2027-05-10T14:30"
        setReleaseDate={setReleaseDate}
      />
    );

    expect(screen.getByTestId('course-release-status-badge')).toHaveTextContent('Agendado');
    const dtInput = screen.getByTestId('course-release-datetime-input');
    expect(dtInput).toBeInTheDocument();
    expect(dtInput.value).toBe('2027-05-10T14:30');

    fireEvent.change(dtInput, { target: { value: '2027-06-15T19:00' } });
    expect(setReleaseDate).toHaveBeenCalledWith('2027-06-15T19:00');
  });

  it('converte e formata datas corretamente com toDatetimeLocalValue e formatReleaseDateTimePtBr', () => {
    expect(toDatetimeLocalValue('')).toBe('');
    expect(formatReleaseDateTimePtBr('')).toBe('');
    const iso = '2027-05-10T14:30:00.000Z';
    expect(toDatetimeLocalValue(iso)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(formatReleaseDateTimePtBr(iso)).toContain('2027');
  });

  it('renderiza o bloqueio independente de canais, chats e suporte e pré-seleciona canais padrão ao bloquear', () => {
    const setChannelReleaseType = vi.fn();
    const setLockedChannels = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="immediate"
        setReleaseType={vi.fn()}
        releaseDate=""
        setReleaseDate={vi.fn()}
        channelReleaseType="immediate"
        setChannelReleaseType={setChannelReleaseType}
        channelReleaseDate=""
        setChannelReleaseDate={vi.fn()}
        lockedChannels={[]}
        setLockedChannels={setLockedChannels}
      />
    );

    expect(screen.getByTestId('course-channel-lock-card')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('course-channel-option-closed'));
    expect(setChannelReleaseType).toHaveBeenCalledWith('closed');
    expect(setLockedChannels).toHaveBeenCalledWith(['course_chat', 'support']);
  });

  it('permite selecionar e remover múltiplos canais no dropdown e configurar data de liberação dos canais', () => {
    const setLockedChannels = vi.fn();
    const setChannelReleaseDate = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="specific_date"
        setReleaseType={vi.fn()}
        releaseDate="2027-08-01T10:00"
        setReleaseDate={vi.fn()}
        channelReleaseType="specific_date"
        setChannelReleaseType={vi.fn()}
        channelReleaseDate="2027-08-02T12:00"
        setChannelReleaseDate={setChannelReleaseDate}
        lockedChannels={['course_chat', 'support']}
        setLockedChannels={setLockedChannels}
      />
    );

    expect(screen.getByTestId('locked-channel-pill-course_chat')).toBeInTheDocument();
    expect(screen.getByTestId('locked-channel-pill-support')).toBeInTheDocument();

    // Abre o dropdown e adiciona Chat Geral da Comunidade
    fireEvent.click(screen.getByTestId('course-locked-channels-dropdown-trigger'));
    fireEvent.click(screen.getByTestId('course-locked-channel-option-general_chat'));
    expect(setLockedChannels).toHaveBeenCalledWith(['course_chat', 'support', 'general_chat']);

    // Botão de usar mesma data das aulas
    fireEvent.click(screen.getByTestId('copy-course-release-date-btn'));
    expect(setChannelReleaseDate).toHaveBeenCalledWith('2027-08-01T10:00');
  });
});
