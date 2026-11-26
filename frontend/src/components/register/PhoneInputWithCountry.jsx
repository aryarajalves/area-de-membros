import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Phone, ChevronDown, Search, X } from 'lucide-react';
import { COUNTRIES, filterCountries } from './countryData';

export default function PhoneInputWithCountry({
  phone,
  onPhoneChange,
  selectedCountry,
  onCountryChange,
  isLightBg = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectorWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredCountries = useMemo(
    () => filterCountries(COUNTRIES, searchQuery),
    [searchQuery]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    const handleClickOutside = (event) => {
      if (selectorWrapperRef.current && !selectorWrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
  const selectBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const dropdownBg = isLightBg ? '#ffffff' : '#0f172a';
  const dropdownBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)';
  const hoverBg = isLightBg ? '#f1f5f9' : 'rgba(56, 189, 248, 0.14)';
  const mutedColor = isLightBg ? '#64748b' : '#94a3b8';

  const handleSelectCountry = (country) => {
    onCountryChange(country);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div
      className="phone-country-input-container"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '8px',
        width: '100%',
      }}
    >
      {/* Seletor de Bandeira e DDI com Busca */}
      <div
        ref={selectorWrapperRef}
        style={{ position: 'relative', flexShrink: 0 }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            backgroundColor: selectBg,
            border: selectBorder,
            borderRadius: '10px',
            padding: '0 10px',
            minWidth: '104px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          data-testid="phone-country-selector-box"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span style={{ fontSize: '1.25rem', marginRight: '6px' }}>{selectedCountry.flag}</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: textColor }}>{selectedCountry.ddi}</span>
          <ChevronDown
            size={14}
            style={{
              marginLeft: '4px',
              opacity: 0.7,
              color: textColor,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />

          {/* Select oculto mantido para acessibilidade e compatibilidade de automações/testes */}
          <select
            value={selectedCountry.code}
            onChange={(e) => {
              const found = COUNTRIES.find((c) => c.code === e.target.value);
              if (found) onCountryChange(found);
            }}
            data-testid="phone-country-select"
            tabIndex={-1}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
            aria-label="Selecionar código do país (DDI)"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.ddi})
              </option>
            ))}
          </select>
        </div>

        {isOpen && (
          <div
            data-testid="phone-country-dropdown"
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: 'min(320px, 84vw)',
              backgroundColor: dropdownBg,
              border: dropdownBorder,
              borderRadius: '12px',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
              zIndex: 60,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 10px',
                borderBottom: dropdownBorder,
              }}
            >
              <Search size={15} color={mutedColor} style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredCountries.length > 0) {
                    e.preventDefault();
                    handleSelectCountry(filteredCountries[0]);
                  }
                }}
                placeholder="Buscar país ou DDI (ex: Emirados, +971)..."
                data-testid="phone-country-search-input"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: textColor,
                  fontSize: '13px',
                  padding: '2px 0',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Limpar busca"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: mutedColor,
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
              {filteredCountries.length === 0 ? (
                <div
                  data-testid="phone-country-empty"
                  style={{ padding: '14px 12px', fontSize: '13px', color: mutedColor, textAlign: 'center' }}
                >
                  Nenhum país encontrado
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = country.code === selectedCountry.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-testid={`phone-country-option-${country.code}`}
                      onClick={() => handleSelectCountry(country)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? hoverBg : 'transparent',
                        color: textColor,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{country.flag}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: mutedColor, flexShrink: 0 }}>
                          {country.code}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {country.name}
                        </span>
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', flexShrink: 0 }}>
                        {country.ddi}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input de Telefone */}
      <div className="input-wrapper" style={{ flex: 1, margin: 0 }}>
        <Phone className="input-icon" size={18} />
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          value={phone}
          onChange={onPhoneChange}
          placeholder={selectedCountry.code === 'BR' ? '(00) 00000-0000' : 'Número de telefone'}
          data-testid="reg-phone-input"
        />
      </div>
    </div>
  );
}
