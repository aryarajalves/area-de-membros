import { describe, it, expect } from 'vitest';

// Lógica de espelhamento do versionamento decimal para o frontend
export function calculateNextVersion(currentVersion) {
  const parts = currentVersion.trim().split('.');
  if (parts.length !== 3) {
    throw new Error(`Formato de versão inválido: ${currentVersion}`);
  }
  let [x, y, z] = parts.map(Number);
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    throw new Error(`Partes não numéricas na versão: ${currentVersion}`);
  }

  z += 1;
  if (z > 9) {
    z = 0;
    y += 1;
  }
  if (y > 9) {
    y = 0;
    x += 1;
  }

  return `${x}.${y}.${z}`;
}

describe('Pipeline Versioning Utilities (Frontend)', () => {
  it('incrementa versão padrão 1.2.7 para 1.2.8', () => {
    expect(calculateNextVersion('1.2.7')).toBe('1.2.8');
    expect(calculateNextVersion('1.2.8')).toBe('1.2.9');
  });

  it('faz overflow decimal do último dígito quando passa de 9 (1.2.9 -> 1.3.0)', () => {
    expect(calculateNextVersion('1.2.9')).toBe('1.3.0');
    expect(calculateNextVersion('1.0.9')).toBe('1.1.0');
  });

  it('faz overflow decimal do dígito do meio quando passa de 9 (1.9.9 -> 2.0.0)', () => {
    expect(calculateNextVersion('1.9.9')).toBe('2.0.0');
    expect(calculateNextVersion('2.9.9')).toBe('3.0.0');
  });

  it('lança erro em formatos de versão inválidos', () => {
    expect(() => calculateNextVersion('1.2')).toThrow();
    expect(() => calculateNextVersion('1.2.alpha')).toThrow();
  });
});
