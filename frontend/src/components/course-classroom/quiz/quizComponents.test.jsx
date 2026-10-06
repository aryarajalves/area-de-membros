import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizHeaderBanner from './QuizHeaderBanner';
import QuizResultBanner from './QuizResultBanner';
import QuizQuestionCard from './QuizQuestionCard';
import QuizNavigationFooter from './QuizNavigationFooter';

describe('Quiz Subcomponents Unit Tests', () => {
  describe('QuizHeaderBanner', () => {
    it('renders lesson title, course, module and passing score', () => {
      const mockLesson = { id: 1, title: 'Aula de Algoritmos' };
      const handleEdit = vi.fn();

      render(
        <QuizHeaderBanner
          lesson={mockLesson}
          courseTitle="Desenvolvimento Web"
          moduleTitle="Módulo 2: Lógica"
          passingScore={80}
          isManager={true}
          onEditLesson={handleEdit}
          isLightBg={false}
          textColor="#fff"
          subTextColor="#aaa"
          borderColor="#333"
        />
      );

      expect(screen.getByTestId('quiz-lesson-title')).toHaveTextContent('Aula de Algoritmos');
      expect(screen.getByText(/Quiz Interativo de Conhecimento/i)).toBeInTheDocument();
      expect(screen.getByText(/Aprovação com 80%/i)).toBeInTheDocument();
      expect(screen.getByText('Desenvolvimento Web')).toBeInTheDocument();
      expect(screen.getByText('Módulo 2: Lógica')).toBeInTheDocument();

      const editBtn = screen.getByTestId('edit-quiz-lesson-btn');
      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledWith(mockLesson);
    });
  });

  describe('QuizResultBanner', () => {
    it('renders passed banner when score meets criteria and handles retry', () => {
      const handleRetry = vi.fn();
      const mockResult = {
        passed: true,
        score: 100,
        correct_answers: 5,
        total_questions: 5,
        earned_points: 10,
        total_points: 10
      };

      render(
        <QuizResultBanner
          submissionResult={mockResult}
          passingScore={70}
          onRetry={handleRetry}
          isLightBg={false}
          textColor="#fff"
          subTextColor="#aaa"
          borderColor="#333"
        />
      );

      expect(screen.getByTestId('quiz-result-banner')).toBeInTheDocument();
      expect(screen.getByText(/Parabéns! Você foi Aprovado no Quiz/i)).toBeInTheDocument();
      expect(screen.getByText(/Você acertou/i)).toBeInTheDocument();

      const retryBtn = screen.getByTestId('retry-quiz-btn');
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalled();
    });

    it('renders failure banner when not passed', () => {
      const mockResult = {
        passed: false,
        score: 50,
        correct_answers: 2,
        total_questions: 4
      };

      render(
        <QuizResultBanner
          submissionResult={mockResult}
          passingScore={70}
          onRetry={vi.fn()}
          isLightBg={false}
          textColor="#fff"
          subTextColor="#aaa"
          borderColor="#333"
        />
      );

      expect(screen.getByText(/Quase lá! Tente Novamente/i)).toBeInTheDocument();
      expect(screen.getByText(/Necessário no mínimo 70% para aprovação/i)).toBeInTheDocument();
    });
  });

  describe('QuizQuestionCard', () => {
    it('renders question, points and allows option selection', () => {
      const handleSelect = vi.fn();
      const mockQuestion = {
        id: 42,
        question: 'O que significa HTML?',
        points: 2,
        options: [
          { id: 1, option_text: 'HyperText Markup Language' },
          { id: 2, option_text: 'Home Tool Markup Language' }
        ]
      };

      render(
        <QuizQuestionCard
          question={mockQuestion}
          qIndex={0}
          selectedOptionId={1}
          onSelectOption={handleSelect}
          submitting={false}
          isLightBg={false}
          cardBg="#222"
          textColor="#fff"
          subTextColor="#aaa"
          borderColor="#444"
        />
      );

      expect(screen.getByTestId('quiz-question-card-42')).toBeInTheDocument();
      expect(screen.getByText('O que significa HTML?')).toBeInTheDocument();
      expect(screen.getByTestId('question-points-badge-42')).toHaveTextContent('2 pontos');

      const option2 = screen.getByTestId('option-label-2');
      fireEvent.click(option2);
      expect(handleSelect).toHaveBeenCalledWith(42, 2);
    });
  });

  describe('QuizNavigationFooter', () => {
    it('renders navigation buttons and invokes onSelectLesson', () => {
      const handleSelectLesson = vi.fn();
      const prevLesson = { id: 10, title: 'Introdução' };
      const nextLesson = { id: 12, title: 'Conclusão' };

      render(
        <QuizNavigationFooter
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          onSelectLesson={handleSelectLesson}
          borderColor="#444"
        />
      );

      const prevBtn = screen.getByTestId('prev-lesson-btn');
      expect(prevBtn).toHaveTextContent('Aula Anterior: Introdução');
      fireEvent.click(prevBtn);
      expect(handleSelectLesson).toHaveBeenCalledWith(prevLesson);

      const nextBtn = screen.getByTestId('next-lesson-btn');
      expect(nextBtn).toHaveTextContent('Próxima Aula: Conclusão');
      fireEvent.click(nextBtn);
      expect(handleSelectLesson).toHaveBeenCalledWith(nextLesson);
    });
  });
});
