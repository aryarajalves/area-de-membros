import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseFormModal, CourseDeleteModal } from './CourseModals';

describe('CourseModals Components', () => {
  describe('CourseFormModal', () => {
    it('renders form fields, allows editing and opens confirmation modal to remove thumbnail', () => {
      const setThumbnailUrl = vi.fn();
      const onSaveCourse = vi.fn();
      const onClose = vi.fn();

      render(
        <CourseFormModal
          isOpen={true}
          onClose={onClose}
          editingCourse={null}
          title="Curso Teste"
          setTitle={vi.fn()}
          description="Descrição Teste"
          setDescription={vi.fn()}
          thumbnailUrl="https://b2.com/cover.jpg"
          setThumbnailUrl={setThumbnailUrl}
          uploading={false}
          saving={false}
          onUploadThumbnail={vi.fn()}
          onSaveCourse={onSaveCourse}
        />
      );

      expect(screen.getByText('Criar Novo Curso')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-preview-img')).toHaveAttribute('src', 'https://b2.com/cover.jpg');

      // Clicar em Remover Capa
      const removeBtn = screen.getByTestId('remove-course-thumbnail-btn');
      fireEvent.click(removeBtn);

      // Deve abrir modal de confirmação
      expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Remover Capa do Curso?')).toBeInTheDocument();

      // Confirmar exclusão no popup
      fireEvent.click(screen.getByTestId('confirm-file-delete-btn'));
      expect(setThumbnailUrl).toHaveBeenCalledWith('');
    });

    it('does not render per-course background color picker and allows removing cover hero banner with confirmation', () => {
      const setCoverImageUrl = vi.fn();

      render(
        <CourseFormModal
          isOpen={true}
          onClose={vi.fn()}
          editingCourse={null}
          title="Curso Netflix"
          setTitle={vi.fn()}
          description="Desc"
          setDescription={vi.fn()}
          thumbnailUrl=""
          setThumbnailUrl={vi.fn()}
          bgColor="#090d16"
          coverImageUrl="https://b2.com/hero-banner.jpg"
          setCoverImageUrl={setCoverImageUrl}
          uploading={false}
          saving={false}
          onUploadThumbnail={vi.fn()}
          onSaveCourse={vi.fn()}
        />
      );

      // A cor de fundo agora fica na aba Configurações da Sidebar, e não no curso individual
      expect(screen.queryByTestId('course-bgcolor-input')).not.toBeInTheDocument();

      // Verificar preview do Banner Hero e remoção com confirmação
      expect(screen.getByTestId('cover-preview-img')).toHaveAttribute('src', 'https://b2.com/hero-banner.jpg');
      fireEvent.click(screen.getByTestId('remove-course-cover-btn'));
      expect(screen.getByText('Remover Banner Hero?')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('confirm-file-delete-btn'));
      expect(setCoverImageUrl).toHaveBeenCalledWith('');
    });

    it('renders upload progress modal when uploading is true', () => {
      render(
        <CourseFormModal
          isOpen={true}
          onClose={vi.fn()}
          editingCourse={null}
          title=""
          setTitle={vi.fn()}
          description=""
          setDescription={vi.fn()}
          thumbnailUrl=""
          setThumbnailUrl={vi.fn()}
          uploading={true}
          saving={false}
          onUploadThumbnail={vi.fn()}
          onSaveCourse={vi.fn()}
        />
      );

      expect(screen.getByTestId('upload-progress-modal')).toBeInTheDocument();
      expect(screen.getByText('Enviando imagem do curso...')).toBeInTheDocument();
    });
  });

  describe('CourseDeleteModal', () => {
    it('renders delete confirmation modal for course', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <CourseDeleteModal
          isOpen={true}
          courseToDelete={{ title: 'Curso de Lançamentos' }}
          onClose={onClose}
          onConfirmDelete={onConfirm}
        />
      );

      expect(screen.getByTestId('delete-course-modal')).toBeInTheDocument();
      expect(screen.getByText('Excluir Curso?')).toBeInTheDocument();
      expect(screen.getByText(/"Curso de Lançamentos"/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('confirm-delete-course-btn'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
