/**
 * Utilitário para pré-carregamento de imagens de cursos e banners na memória do navegador.
 * Garante transições instantâneas e elimina sensação de atraso.
 */
export function preloadCourseImages(courses = []) {
  if (!Array.isArray(courses) || typeof window === 'undefined') return;

  courses.forEach((item) => {
    if (!item) return;
    const urls = [item.thumbnail_url, item.cover_image_url].filter(Boolean);
    urls.forEach((url) => {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      } catch (_) {
        // Ignora silenciosamente em ambientes de teste ou sem suporte
      }
    });

    if (Array.isArray(item.bundled_courses)) {
      item.bundled_courses.forEach((nested) => {
        if (!nested) return;
        const nestedUrls = [nested.thumbnail_url, nested.cover_image_url].filter(Boolean);
        nestedUrls.forEach((url) => {
          try {
            const img = new Image();
            img.decoding = 'async';
            img.src = url;
          } catch (_) {
            // Ignora silenciosamente
          }
        });
      });
    }
  });
}
