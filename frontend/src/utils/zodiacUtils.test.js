import { describe, it, expect } from 'vitest';
import { getZodiacSign, ZODIAC_SIGNS } from './zodiacUtils';

describe('zodiacUtils - Cálculo de Signo Zodiacal', () => {
  it('retorna null se a data for vazia ou inválida', () => {
    expect(getZodiacSign(null)).toBeNull();
    expect(getZodiacSign('')).toBeNull();
    expect(getZodiacSign('data-invalida')).toBeNull();
  });

  it('calcula corretamente os signos do zodíaco', () => {
    // Áries (21/03 a 19/04)
    expect(getZodiacSign('1990-03-21')?.name).toBe('Áries');
    expect(getZodiacSign('1995-04-19')?.name).toBe('Áries');

    // Touro (20/04 a 20/05)
    expect(getZodiacSign('1992-04-20')?.name).toBe('Touro');
    expect(getZodiacSign('1988-05-20')?.name).toBe('Touro');

    // Gêmeos (21/05 a 20/06)
    expect(getZodiacSign('1994-05-21')?.name).toBe('Gêmeos');

    // Câncer (21/06 a 22/07)
    expect(getZodiacSign('1999-06-25')?.name).toBe('Câncer');

    // Leão (23/07 a 22/08)
    expect(getZodiacSign('2001-08-10')?.name).toBe('Leão');

    // Virgem (23/08 a 22/09)
    expect(getZodiacSign('1993-09-01')?.name).toBe('Virgem');

    // Libra (23/09 a 22/10)
    expect(getZodiacSign('1997-10-05')?.name).toBe('Libra');

    // Escorpião (23/10 a 21/11)
    expect(getZodiacSign('1995-10-24')?.name).toBe('Escorpião');
    expect(getZodiacSign('1995-11-09')?.symbol).toBe('♏');

    // Sagitário (22/11 a 21/12)
    expect(getZodiacSign('1985-12-01')?.name).toBe('Sagitário');

    // Capricórnio (22/12 a 19/01)
    expect(getZodiacSign('1990-12-25')?.name).toBe('Capricórnio');
    expect(getZodiacSign('1991-01-15')?.name).toBe('Capricórnio');

    // Aquário (20/01 a 18/02)
    expect(getZodiacSign('1998-02-05')?.name).toBe('Aquário');

    // Peixes (19/02 a 20/03)
    expect(getZodiacSign('2003-03-10')?.name).toBe('Peixes');
  });

  it('possui os 12 signos no array ZODIAC_SIGNS com símbolos e elementos', () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    ZODIAC_SIGNS.forEach((sign) => {
      expect(sign.symbol).toBeDefined();
      expect(sign.element).toBeDefined();
      expect(sign.color).toBeDefined();
    });
  });
});
