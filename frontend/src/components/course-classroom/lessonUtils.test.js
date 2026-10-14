import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatLessonDuration,
  normalizeLessonDuration,
  parseDurationToSeconds,
  formatSecondsToTimer,
  formatSecondsToClock,
  scrollToClassroomSection
} from './lessonUtils';

describe('lessonUtils - formatLessonDuration & normalizeLessonDuration', () => {
  it('formats pure numbers as "X min"', () => {
    expect(formatLessonDuration('20')).toBe('20 min');
    expect(formatLessonDuration(45)).toBe('45 min');
    expect(formatLessonDuration('5')).toBe('5 min');
  });

  it('keeps existing format when string already has min or timestamp format', () => {
    expect(formatLessonDuration('20 min')).toBe('20 min');
    expect(formatLessonDuration('15:30')).toBe('15:30');
    expect(formatLessonDuration('1h 20min')).toBe('1h 20min');
  });

  it('handles empty or null values gracefully', () => {
    expect(formatLessonDuration(null)).toBe('');
    expect(formatLessonDuration(undefined)).toBe('');
    expect(formatLessonDuration('')).toBe('');
    expect(formatLessonDuration('   ')).toBe('');
  });

  it('normalizes duration correctly for saving', () => {
    expect(normalizeLessonDuration('20')).toBe('20 min');
    expect(normalizeLessonDuration('  35  ')).toBe('35 min');
    expect(normalizeLessonDuration('18:40')).toBe('18:40');
    expect(normalizeLessonDuration('')).toBe(null);
    expect(normalizeLessonDuration(null)).toBe(null);
  });
});

describe('lessonUtils - parseDurationToSeconds & formatSecondsToTimer', () => {
  it('parses various duration strings into seconds', () => {
    expect(parseDurationToSeconds('20 min')).toBe(1200);
    expect(parseDurationToSeconds('20')).toBe(1200);
    expect(parseDurationToSeconds('15:30')).toBe(930);
    expect(parseDurationToSeconds('01:20:00')).toBe(4800);
    expect(parseDurationToSeconds(600)).toBe(600);
    expect(parseDurationToSeconds(null)).toBe(0);
    expect(parseDurationToSeconds('')).toBe(0);
  });

  it('formats seconds into timer strings MM:SS and HH:MM:SS', () => {
    expect(formatSecondsToTimer(0)).toBe('00:00');
    expect(formatSecondsToTimer(9)).toBe('00:09');
    expect(formatSecondsToTimer(75)).toBe('01:15');
    expect(formatSecondsToTimer(600)).toBe('10:00');
    expect(formatSecondsToTimer(3665)).toBe('01:01:05');
    expect(formatSecondsToTimer(null)).toBe('00:00');
  });
});

describe('lessonUtils - formatSecondsToClock', () => {
  it('converte segundos em formato cronômetro exato MM:SS e HH:MM:SS', () => {
    expect(formatSecondsToClock(0)).toBe('00:00');
    expect(formatSecondsToClock(930)).toBe('15:30');
    expect(formatSecondsToClock(1540)).toBe('25:40');
    expect(formatSecondsToClock(3600)).toBe('01:00:00');
    expect(formatSecondsToClock(3665)).toBe('01:01:05');
    expect(formatSecondsToClock(null)).toBe('00:00');
  });
});

describe('lessonUtils - scrollToClassroomSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('rola a tela suavemente para o elemento encontrado por id após o delay', () => {
    const el = document.createElement('div');
    el.id = 'selected-module-classroom-section';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    scrollToClassroomSection('selected-module-classroom-section', 50);

    expect(el.scrollIntoView).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('faz fallback para data-testid caso o id direto não exista', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'selected-module-section');
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    scrollToClassroomSection('custom-non-existent-id', 0);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('não dispara erro se o elemento não for encontrado no DOM', () => {
    expect(() => {
      scrollToClassroomSection('inexistent', 0);
    }).not.toThrow();
  });
});


