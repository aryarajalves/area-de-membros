import React from 'react';
import { Globe, ListOrdered } from 'lucide-react';
import CourseBundleSelector from './CourseBundleSelector';

export default function CourseModalAccessTab({
  salesPageUrl = '',
  setSalesPageUrl,
  orderIndex = 0,
  setOrderIndex,
  setBundledCourseIds,
  bundledCourseIds = [],
  availableCourses = [],
  editingCourse,
  isLightBg
}) {
  return (
    <div data-testid="course-modal-tab-panel-access">
      {/* Link da Página de Vendas / Mais Informações */}
      <div className="form-group">
        <label htmlFor="course-sales-page-url" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={15} style={{ color: '#3b82f6' }} />
          <span>Link da Página de Vendas / Mais Informações (Opcional)</span>
        </label>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
          Página para onde alunos que ainda não possuem acesso ao curso serão redirecionados ao clicar em "Ver Mais Informações".
        </p>
        <input
          id="course-sales-page-url"
          type="url"
          placeholder="Ex: https://seusite.com/curso-bussola"
          value={salesPageUrl}
          onChange={(e) => setSalesPageUrl && setSalesPageUrl(e.target.value)}
          data-testid="course-sales-page-url-input"
        />
      </div>

      {/* Ordem de Posição do Curso */}
      <div className="form-group">
        <label htmlFor="course-order-index" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ListOrdered size={15} style={{ color: '#eab308' }} />
          <span>Ordem de Posição / Exibição</span>
        </label>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
          Define a ordem do curso na vitrine (ordem crescente: 1 aparece antes de 2, 3...).
        </p>
        <input
          id="course-order-index"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={orderIndex}
          onChange={(e) => setOrderIndex && setOrderIndex(e.target.value)}
          data-testid="course-order-index-input"
        />
      </div>

      {/* Seletor de Cursos/Ferramentas Inclusos neste Pacote */}
      {setBundledCourseIds && (
        <CourseBundleSelector
          availableCourses={availableCourses}
          currentCourseId={editingCourse?.id}
          selectedCourseIds={bundledCourseIds}
          onChangeSelectedCourseIds={setBundledCourseIds}
          isLightBg={isLightBg}
        />
      )}
    </div>
  );
}
