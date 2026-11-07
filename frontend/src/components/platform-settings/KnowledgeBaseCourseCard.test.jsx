import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeBaseCourseCard from './KnowledgeBaseCourseCard';

describe('KnowledgeBaseCourseCard Component', () => {
  const mockCourse = {
    course_id: 1,
    course_title: 'Bússola Astrológica',
    total_lessons: 2,
    indexed_lessons: 1,
    total_chunks: 10,
    modules: [
      {
        module_id: 11,
        module_title: 'Módulo 01 - Trânsitos',
        order_index: 1,
        lessons: [
          {
            lesson_id: 101,
            lesson_title: 'Aula 1 - Trânsitos Básicos',
            duration_str: '04:15',
            has_transcription: true,
            is_indexed: true,
            chunks_count: 5,
            qa_count: 5
          },
          {
            lesson_id: 102,
            lesson_title: 'Aula 2 - Aspectos Planetários',
            duration_str: '08:30',
            has_transcription: true,
            is_indexed: false,
            chunks_count: 0,
            qa_count: 0
          }
        ]
      }
    ]
  };

  it('renders course header, modules and lessons correctly', () => {
    const handleToggleLesson = vi.fn();
    const handleToggleModule = vi.fn();
    const handleToggleCourse = vi.fn();
    const handleIndexSingle = vi.fn();
    const handleOpenChunks = vi.fn();

    render(
      <KnowledgeBaseCourseCard
        course={mockCourse}
        selectedLessonIds={[101]}
        onToggleLesson={handleToggleLesson}
        onToggleModule={handleToggleModule}
        onToggleCourse={handleToggleCourse}
        indexingLessonId={null}
        onIndexSingleLesson={handleIndexSingle}
        onOpenChunksModal={handleOpenChunks}
      />
    );

    // Título do curso e estatísticas
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2 aulas \(50%\)/i)).toBeInTheDocument();

    // Módulo e aulas
    expect(screen.getByText('Módulo 01 - Trânsitos')).toBeInTheDocument();
    expect(screen.getByText('Aula 1 - Trânsitos Básicos')).toBeInTheDocument();
    expect(screen.getByText('Aula 2 - Aspectos Planetários')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('5 chunks')).toBeInTheDocument();
    expect(screen.getByText('5 Q&A')).toBeInTheDocument();
    expect(screen.getByText('Pendente RAG')).toBeInTheDocument();

    // Clica no checkbox da aula 102
    const lessonCheckbox = screen.getByTestId('checkbox-lesson-102');
    fireEvent.click(lessonCheckbox);
    expect(handleToggleLesson).toHaveBeenCalledWith(102);

    // Clica no botão Ver Chunks da aula 101
    const chunksBtn = screen.getByTestId('btn-view-chunks-101');
    fireEvent.click(chunksBtn);
    expect(handleOpenChunks).toHaveBeenCalledWith(expect.objectContaining({ lesson_id: 101 }));

    // Clica no botão Indexar da aula 102
    const reindexBtn = screen.getByTestId('btn-reindex-102');
    fireEvent.click(reindexBtn);
    expect(handleIndexSingle).toHaveBeenCalledWith(102);
  });

  it('renders dedicated button to generate Q&A and triggers callback', () => {
    const handleGenerateQa = vi.fn();
    render(
      <KnowledgeBaseCourseCard
        course={mockCourse}
        selectedLessonIds={[]}
        onToggleLesson={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleCourse={vi.fn()}
        indexingLessonId={null}
        onIndexSingleLesson={vi.fn()}
        onOpenChunksModal={vi.fn()}
        onGenerateQa={handleGenerateQa}
        generatingQaLessonId={null}
      />
    );

    // Botão dedicado para gerar / re-gerar Q&A
    const genQaBtn = screen.getByTestId('btn-generate-qa-101');
    expect(genQaBtn).toHaveTextContent('Re-gerar Q&A');
    fireEvent.click(genQaBtn);
    expect(handleGenerateQa).toHaveBeenCalledWith(101);

    const genQaBtn2 = screen.getByTestId('btn-generate-qa-102');
    expect(genQaBtn2).toHaveTextContent('⚡ Gerar 5 Q&A');
    fireEvent.click(genQaBtn2);
    expect(handleGenerateQa).toHaveBeenCalledWith(102);
  });
});
