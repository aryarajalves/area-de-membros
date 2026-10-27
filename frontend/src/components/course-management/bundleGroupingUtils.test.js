import { describe, it, expect } from 'vitest';
import { groupCoursesByBundles } from './bundleGroupingUtils';

describe('groupCoursesByBundles', () => {
  it('retorna array vazio para lista nula ou vazia', () => {
    expect(groupCoursesByBundles([])).toEqual([]);
    expect(groupCoursesByBundles(null)).toEqual([]);
  });

  it('retorna itens únicos para cursos independentes', () => {
    const courses = [
      { id: 1, title: 'Curso 1', item_type: 'course', bundled_course_ids: [] },
      { id: 2, title: 'Curso 2', item_type: 'course', bundled_course_ids: [] },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('single');
    expect(result[0].course.id).toBe(1);
    expect(result[1].type).toBe('single');
    expect(result[1].course.id).toBe(2);
  });

  it('agrupa curso e ferramenta que pertencem ao mesmo combo', () => {
    const courses = [
      { id: 10, title: 'Bússola Astrológica', item_type: 'course', bundled_course_ids: [20] },
      { id: 20, title: 'Bússola Astrológica APP', item_type: 'tool', bundled_course_ids: [] },
      { id: 30, title: 'Curso Avulso', item_type: 'course', bundled_course_ids: [] },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(2);

    // Primeiro item: combo agrupado
    const bundleGroup = result[0];
    expect(bundleGroup.type).toBe('bundle');
    expect(bundleGroup.title).toBe('Bússola Astrológica');
    expect(bundleGroup.totalItems).toBe(2);
    expect(bundleGroup.courses.map((c) => c.id)).toEqual([10, 20]);

    // Segundo item: curso avulso
    const single = result[1];
    expect(single.type).toBe('single');
    expect(single.course.id).toBe(30);
  });

  it('evita duplicação quando a associação é mútua / bidirecional', () => {
    const courses = [
      { id: 1, title: 'Curso A', item_type: 'course', bundled_course_ids: [2] },
      { id: 2, title: 'Ferramenta B', item_type: 'tool', bundled_course_ids: [1] },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bundle');
    expect(result[0].courses).toHaveLength(2);
  });

  it('suporta múltiplos produtos agrupados no mesmo pacote (3 ou mais)', () => {
    const courses = [
      { id: 1, title: 'Combo Master', item_type: 'course', bundled_course_ids: [2, 3] },
      { id: 2, title: 'Ferramenta X', item_type: 'tool', bundled_course_ids: [] },
      { id: 3, title: 'Curso Bônus', item_type: 'course', bundled_course_ids: [] },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bundle');
    expect(result[0].totalItems).toBe(3);
  });

  it('ignora IDs de pacote que não existem na lista atual', () => {
    const courses = [
      { id: 1, title: 'Curso Normal', item_type: 'course', bundled_course_ids: [999] },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('single');
  });

  it('propaga has_access=true para todos os produtos inclusos quando o aluno tem acesso ao pacote', () => {
    const courses = [
      { id: 1, title: 'Bussola Astrologica', item_type: 'course', bundled_course_ids: [2], has_access: true },
      { id: 2, title: 'Bussola Astrologica APP', item_type: 'tool', bundled_course_ids: [], has_access: false },
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(1);
    expect(result[0].hasAccess).toBe(true);
    expect(result[0].courses[0].has_access).toBe(true);
    expect(result[0].courses[1].has_access).toBe(true);
  });

  it('utiliza bundle_title customizado no cabeçalho do combo quando preenchido', () => {
    const courses = [
      {
        id: 1,
        title: 'AstroWake - Trânsitos',
        bundle_title: 'Combo AstroWake Master',
        item_type: 'course',
        bundled_course_ids: [2],
        has_access: true
      },
      { id: 2, title: 'AstroWake', item_type: 'course', bundled_course_ids: [], has_access: true }
    ];

    const result = groupCoursesByBundles(courses);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bundle');
    expect(result[0].title).toBe('Combo AstroWake Master');
  });
});
