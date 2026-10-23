import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PhoneWithDdiInput, {
  formatBrazilianPhone,
  parsePhoneAndDdi,
  COUNTRY_DDI_LIST,
} from './PhoneWithDdiInput';

describe('PhoneWithDdiInput Component', () => {
  describe('Helper Functions', () => {
    it('formats Brazilian phone numbers with 10 and 11 digits', () => {
      expect(formatBrazilianPhone('11999998888')).toBe('(11) 99999-8888');
      expect(formatBrazilianPhone('1133334444')).toBe('(11) 3333-4444');
      expect(formatBrazilianPhone('11')).toBe('(11');
      expect(formatBrazilianPhone('119')).toBe('(11) 9');
      expect(formatBrazilianPhone('')).toBe('');
    });

    it('parses existing phone values with and without DDI', () => {
      // Com +55
      const br = parsePhoneAndDdi('+55 11999998888');
      expect(br.ddi).toBe('+55');
      expect(br.number).toBe('(11) 99999-8888');

      // Sem DDI (assume Brasil)
      const noDdi = parsePhoneAndDdi('11999998888');
      expect(noDdi.ddi).toBe('+55');
      expect(noDdi.number).toBe('(11) 99999-8888');

      // Com Portugal (+351)
      const pt = parsePhoneAndDdi('+351 912345678');
      expect(pt.ddi).toBe('+351');
      expect(pt.number).toBe('912345678');

      // Vazio ou nulo
      const empty = parsePhoneAndDdi('');
      expect(empty.ddi).toBe('+55');
      expect(empty.number).toBe('');
    });
  });

  describe('Component Rendering & Interaction', () => {
    it('renders DDI select dropdown and phone number input', () => {
      render(<PhoneWithDdiInput value="" onChange={vi.fn()} />);

      expect(screen.getByTestId('phone-with-ddi-container')).toBeInTheDocument();
      expect(screen.getByTestId('profile-ddi-select')).toBeInTheDocument();
      expect(screen.getByTestId('profile-input-phone')).toBeInTheDocument();

      // DDI padrão é Brasil +55
      const select = screen.getByTestId('profile-ddi-select');
      expect(select.value).toBe('+55');
    });

    it('applies Brazilian phone mask as user types and emits combined value', () => {
      const handleChange = vi.fn();
      render(<PhoneWithDdiInput value="" onChange={handleChange} />);

      const input = screen.getByTestId('profile-input-phone');
      fireEvent.change(input, { target: { value: '11988887777' } });

      expect(input.value).toBe('(11) 98888-7777');
      expect(handleChange).toHaveBeenCalledWith('+55 (11) 98888-7777');
    });

    it('allows changing DDI and updates combined output', () => {
      const handleChange = vi.fn();
      render(<PhoneWithDdiInput value="+55 (11) 98888-7777" onChange={handleChange} />);

      const select = screen.getByTestId('profile-ddi-select');
      fireEvent.change(select, { target: { value: '+351' } });

      expect(select.value).toBe('+351');
      expect(handleChange).toHaveBeenCalledWith('+351 (11) 98888-7777');
    });

    it('parses and displays existing international phone correctly', () => {
      render(<PhoneWithDdiInput value="+1 4155552671" onChange={vi.fn()} />);

      const select = screen.getByTestId('profile-ddi-select');
      const input = screen.getByTestId('profile-input-phone');

      expect(select.value).toBe('+1');
      expect(input.value).toBe('4155552671');
    });
  });
});
