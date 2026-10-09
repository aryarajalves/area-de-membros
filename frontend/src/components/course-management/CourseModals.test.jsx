import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseFormModal, CourseDeleteModal } from './CourseModals';
import { ToastProvider } from '../../context/ToastContext';

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

    it('renders sales_page_url input and updates value on change', () => {
      const setSalesPageUrl = vi.fn();

      render(
        <CourseFormModal
          isOpen={true}
          onClose={vi.fn()}
          editingCourse={null}
          title="Curso Vendas"
          setTitle={vi.fn()}
          description=""
          setDescription={vi.fn()}
          thumbnailUrl=""
          setThumbnailUrl={vi.fn()}
          salesPageUrl="https://vendas.com/meucurso"
          setSalesPageUrl={setSalesPageUrl}
          uploading={false}
          saving={false}
          onSaveCourse={vi.fn()}
        />
      );

      const urlInput = screen.getByTestId('course-sales-page-url-input');
      expect(urlInput).toBeInTheDocument();
      expect(urlInput).toHaveValue('https://vendas.com/meucurso');

      fireEvent.change(urlInput, { target: { value: 'https://novalink.com' } });
      expect(setSalesPageUrl).toHaveBeenCalledWith('https://novalink.com');
    });

    it('renders order_index input and updates value on change', () => {
      const setOrderIndex = vi.fn();

      render(
        <CourseFormModal
          isOpen={true}
          onClose={vi.fn()}
          editingCourse={null}
          title="Curso Ordenado"
          setTitle={vi.fn()}
          description=""
          setDescription={vi.fn()}
          thumbnailUrl=""
          setThumbnailUrl={vi.fn()}
          orderIndex={3}
          setOrderIndex={setOrderIndex}
          uploading={false}
          saving={false}
          onSaveCourse={vi.fn()}
        />
      );

      const orderInput = screen.getByTestId('course-order-index-input');
      expect(orderInput).toBeInTheDocument();
      expect(orderInput).toHaveValue(3);

      fireEvent.change(orderInput, { target: { value: '5' } });
      expect(setOrderIndex).toHaveBeenCalledWith('5');
    });

    it('does not render AI description button when creating new course (editingCourse is null)', () => {
      render(
        <ToastProvider>
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
            uploading={false}
            saving={false}
            onSaveCourse={vi.fn()}
          />
        </ToastProvider>
      );

      expect(screen.queryByTestId('generate-course-ai-description-btn')).not.toBeInTheDocument();
    });

    it('renders AI description button when editing course and opens confirmation modal on click', () => {
      render(
        <ToastProvider>
          <CourseFormModal
            isOpen={true}
            onClose={vi.fn()}
            editingCourse={{ id: 42, title: 'Curso Completo' }}
            title="Curso Completo"
            setTitle={vi.fn()}
            description="Descrição Antiga"
            setDescription={vi.fn()}
            thumbnailUrl=""
            setThumbnailUrl={vi.fn()}
            uploading={false}
            saving={false}
            onSaveCourse={vi.fn()}
          />
        </ToastProvider>
      );

      const aiBtn = screen.getByTestId('generate-course-ai-description-btn');
      expect(aiBtn).toBeInTheDocument();
      expect(aiBtn).toHaveTextContent('Gerar com IA');

      // Modal de confirmação inicialmente fechado
      expect(screen.queryByTestId('confirm-generate-ai-metadata-modal')).not.toBeInTheDocument();

      // Clicar no botão para abrir confirmação
      fireEvent.click(aiBtn);
      expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
      expect(screen.getByText('Gerar Descrição do Curso com IA?')).toBeInTheDocument();
    });

    it('calls AI endpoint and updates course description on confirm', async () => {
      const setDescription = vi.fn();
      const mockAiResponse = {
        id: 42,
        title: 'Curso Completo',
        description: 'Esta é a nova descrição detalhada e pedagógica gerada pela IA a partir dos módulos.'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAiResponse
      });

      render(
        <ToastProvider>
          <CourseFormModal
            isOpen={true}
            onClose={vi.fn()}
            editingCourse={{ id: 42, title: 'Curso Completo' }}
            title="Curso Completo"
            setTitle={vi.fn()}
            description="Descrição Antiga"
            setDescription={setDescription}
            thumbnailUrl=""
            setThumbnailUrl={vi.fn()}
            uploading={false}
            saving={false}
            onSaveCourse={vi.fn()}
          />
        </ToastProvider>
      );

      // Clica para abrir modal de confirmação
      fireEvent.click(screen.getByTestId('generate-course-ai-description-btn'));
      expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();

      // Confirma a geração com IA
      const confirmBtn = screen.getByTestId('confirm-generate-ai-metadata-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/courses/42/generate-ai-description',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });

      await waitFor(() => {
        expect(setDescription).toHaveBeenCalledWith(mockAiResponse.description);
      });
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
