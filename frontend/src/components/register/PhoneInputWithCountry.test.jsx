import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PhoneInputWithCountry from './PhoneInputWithCountry';
import { COUNTRIES, filterCountries } from './countryData';

describe('PhoneInputWithCountry Component & countryData', () => {
  it('inclui Emirados Árabes Unidos (+971) e mais de 90 países na lista', () => {
    expect(COUNTRIES.length).toBeGreaterThan(90);
    const uae = COUNTRIES.find((c) => c.code === 'AE');
    expect(uae).toBeDefined();
    expect(uae.name).toBe('Emirados Árabes Unidos');
    expect(uae.ddi).toBe('+971');
    expect(uae.flag).toBe('🇦🇪');
  });

  it('filtra países por nome sem acento, sigla, DDI e apelidos como dubai', () => {
    expect(filterCountries(COUNTRIES, 'emirados').some((c) => c.code === 'AE')).toBe(true);
    expect(filterCountries(COUNTRIES, 'dubai').some((c) => c.code === 'AE')).toBe(true);
    expect(filterCountries(COUNTRIES, '+971').some((c) => c.code === 'AE')).toBe(true);
    expect(filterCountries(COUNTRIES, '971').some((c) => c.code === 'AE')).toBe(true);
    expect(filterCountries(COUNTRIES, 'ae').some((c) => c.code === 'AE')).toBe(true);
  });

  it('abre dropdown pesquisável, filtra ao digitar e seleciona Emirados Árabes Unidos', () => {
    const onCountryChange = vi.fn();
    render(
      <PhoneInputWithCountry
        phone=""
        onPhoneChange={vi.fn()}
        selectedCountry={COUNTRIES[0]}
        onCountryChange={onCountryChange}
      />
    );

    const trigger = screen.getByTestId('phone-country-selector-box');
    fireEvent.click(trigger);

    const dropdown = screen.getByTestId('phone-country-dropdown');
    expect(dropdown).toBeInTheDocument();

    const searchInput = screen.getByTestId('phone-country-search-input');
    fireEvent.change(searchInput, { target: { value: 'emirados' } });

    const uaeOption = screen.getByTestId('phone-country-option-AE');
    expect(uaeOption).toHaveTextContent('Emirados Árabes Unidos');
    expect(uaeOption).toHaveTextContent('+971');
    expect(screen.queryByTestId('phone-country-option-BR')).not.toBeInTheDocument();

    fireEvent.click(uaeOption);
    expect(onCountryChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'AE', ddi: '+971' }));
    expect(screen.queryByTestId('phone-country-dropdown')).not.toBeInTheDocument();
  });

  it('exibe mensagem de vazio quando nenhum país corresponde e permite selecionar com Enter', () => {
    const onCountryChange = vi.fn();
    render(
      <PhoneInputWithCountry
        phone=""
        onPhoneChange={vi.fn()}
        selectedCountry={COUNTRIES[0]}
        onCountryChange={onCountryChange}
      />
    );

    fireEvent.click(screen.getByTestId('phone-country-selector-box'));
    const searchInput = screen.getByTestId('phone-country-search-input');

    fireEvent.change(searchInput, { target: { value: 'zzzzinexistente' } });
    expect(screen.getByTestId('phone-country-empty')).toHaveTextContent('Nenhum país encontrado');

    fireEvent.change(searchInput, { target: { value: '+971' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(onCountryChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'AE', ddi: '+971' }));
  });
});
