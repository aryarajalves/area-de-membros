/**
 * Opções e utilitários de tamanho e compressão do logotipo da plataforma.
 */

export const LOGO_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno (28px)', px: 28 },
  { value: 'medium', label: 'Médio — Padrão (36px)', px: 36 },
  { value: 'large', label: 'Grande (48px)', px: 48 },
  { value: 'xlarge', label: 'Extra Grande (64px)', px: 64 },
];

export const DEFAULT_LOGO_SIZE = 'medium';

export function getLogoSizePx(sizeKey) {
  const found = LOGO_SIZE_OPTIONS.find((opt) => opt.value === sizeKey);
  return found ? found.px : 36;
}

/**
 * Redimensiona e comprime imagens raster (JPG/PNG/WEBP) no navegador antes do upload
 * para reduzir drasticamente o tempo de envio. Retorna o arquivo original em SVG,
 * arquivos já leves (< 80 KB) ou ambientes sem suporte a canvas.
 */
export async function compressLogoFile(file, maxDim = 256) {
  if (!file || file.type === 'image/svg+xml' || file.size < 80 * 1024) {
    return file;
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (!width || !height) {
          resolve(file);
          return;
        }

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext?.('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'logo';
            resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
          },
          'image/webp',
          0.85
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
