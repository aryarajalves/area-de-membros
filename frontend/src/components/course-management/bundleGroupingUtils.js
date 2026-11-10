/**
 * Utilitário para agrupamento de produtos e cursos em pacotes/combos.
 * Constrói componentes conexos entre cursos que compartilham IDs de pacote
 * e retorna uma lista unificada de elementos únicos (individuais ou pacotes).
 */

export function groupCoursesByBundles(courses = []) {
  if (!courses || courses.length === 0) return [];

  const courseMap = new Map();
  courses.forEach((c) => {
    if (c && c.id) {
      courseMap.set(c.id, c);
    }
  });

  // Constrói o grafo de adjacência de pacotes bidirecional
  const adj = new Map();
  courseMap.forEach((_, id) => adj.set(id, new Set()));

  courses.forEach((course) => {
    if (!course || !course.id) return;
    const directBundledIds = Array.isArray(course.bundled_course_ids)
      ? course.bundled_course_ids
      : Array.isArray(course.bundled_courses)
      ? course.bundled_courses.map((b) => (typeof b === 'object' ? b.id : b))
      : [];

    directBundledIds.forEach((targetId) => {
      const numTargetId = Number(targetId);
      if (courseMap.has(numTargetId) && numTargetId !== course.id) {
        adj.get(course.id).add(numTargetId);
        adj.get(numTargetId).add(course.id);
      }
    });
  });

  const visited = new Set();
  const groupedItems = [];

  courses.forEach((course) => {
    if (!course || !course.id || visited.has(course.id)) return;

    // Busca em largura (BFS) para encontrar todos os membros do mesmo pacote
    const queue = [course.id];
    visited.add(course.id);
    const componentIds = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      componentIds.push(currentId);

      const neighbors = adj.get(currentId) || new Set();
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      });
    }

    const componentCourses = componentIds
      .map((id) => courseMap.get(id))
      .filter(Boolean);

    if (componentCourses.length > 1) {
      // É um combo / pacote!
      // Seleciona o curso principal que dará o título ao pacote:
      const primaryCourse =
        componentCourses.find(
          (c) =>
            c.item_type !== 'tool' &&
            Array.isArray(c.bundled_course_ids) &&
            c.bundled_course_ids.length > 0
        ) ||
        componentCourses.find((c) => c.item_type !== 'tool') ||
        componentCourses[0];

      // Ordenar os cursos dentro do pacote:
      // 1º critério: Ordem numérica definida pelo usuário (order_index ascendente: 1 aparece antes de 2, 3...)
      // 2º critério: Cursos antes de ferramentas (se os order_index forem iguais)
      // 3º critério: Curso principal como desempate
      // 4º critério: ID crescente para ordenação estável
      const sortedBundleCourses = [...componentCourses].sort((a, b) => {
        const orderA = a.order_index !== undefined && a.order_index !== null ? Number(a.order_index) : 0;
        const orderB = b.order_index !== undefined && b.order_index !== null ? Number(b.order_index) : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        if (a.item_type === 'course' && b.item_type !== 'course') return -1;
        if (a.item_type !== 'course' && b.item_type === 'course') return 1;
        if (a.id === primaryCourse.id) return -1;
        if (b.id === primaryCourse.id) return 1;
        return (a.id ?? 0) - (b.id ?? 0);
      });

      const hasBundleAccess = sortedBundleCourses.some((c) => c.has_access !== false);
      const finalBundleCourses = hasBundleAccess
        ? sortedBundleCourses.map((c) => ({ ...c, has_access: true }))
        : sortedBundleCourses;

      // Busca título customizado do combo ou usa o título do curso principal
      const customBundleTitle =
        primaryCourse.bundle_title?.trim() ||
        componentCourses.find((c) => c.bundle_title && c.bundle_title.trim())?.bundle_title?.trim();
      const bundleDisplayTitle = customBundleTitle || primaryCourse.title;

      groupedItems.push({
        type: 'bundle',
        key: `bundle-group-${primaryCourse.id}`,
        bundleId: primaryCourse.id,
        title: bundleDisplayTitle,
        bundle_title: customBundleTitle || null,
        primaryCourse,
        courses: finalBundleCourses,
        totalItems: finalBundleCourses.length,
        hasAccess: hasBundleAccess,
      });
    } else {
      // Produto avulso / independente
      groupedItems.push({
        type: 'single',
        key: `course-single-${course.id}`,
        course,
      });
    }
  });

  return groupedItems;
}
