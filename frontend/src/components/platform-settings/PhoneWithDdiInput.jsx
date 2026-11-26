import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { COUNTRIES, filterCountries } from '../register/countryData';

export const COUNTRY_DDI_LIST = COUNTRIES.map((c) => ({
  code: c.ddi,
  isoCode: c.code,
  name: c.name,
  flag: c.flag,
  mask: c.ddi === '+55',
  keywords: c.keywords || '',
}));

export function formatBrazilianPhone(rawDigits) {
  const digits = (rawDigits || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function parsePhoneAndDdi(fullValue) {
  if (!fullValue || typeof fullValue !== 'string') {
    return { ddi: '+55', number: '' };
  }

  const trimmed = fullValue.trim();

  // Se começar com '+', busca na lista o DDI mais longo que casa
  if (trimmed.startsWith('+')) {
    const sortedDdis = [...COUNTRY_DDI_LIST].sort((a, b) => b.code.length - a.code.length);
    for (const country of sortedDdis) {
      if (trimmed.startsWith(country.code)) {
        const rest = trimmed.slice(country.code.length).trim();
        const formatted = country.code === '+55' ? formatBrazilianPhone(rest) : rest;
        return { ddi: country.code, number: formatted };
      }
    }
  }

  // Se não tiver DDI com '+', assume padrão Brasil (+55)
  return { ddi: '+55', number: formatBrazilianPhone(trimmed) };
}

export default function PhoneWithDdiInput({
  value = '',
  onChange,
  disabled = false,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
}) {
  const initial = useMemo(() => parsePhoneAndDdi(value), [value]);
  const [selectedDdi, setSelectedDdi] = useState(initial.ddi);
  const [selectedIsoCode, setSelectedIsoCode] = useState(
    () => COUNTRY_DDI_LIST.find((c) => c.code === initial.ddi)?.isoCode || 'BR'
  );
  const [phoneDigits, setPhoneDigits] = useState(initial.number);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectorWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const parsed = parsePhoneAndDdi(value);
    setSelectedDdi(parsed.ddi);
    setSelectedIsoCode((prevIso) => {
      const currentMatch = COUNTRY_DDI_LIST.find((c) => c.isoCode === prevIso && c.code === parsed.ddi);
      if (currentMatch) return prevIso;
      return COUNTRY_DDI_LIST.find((c) => c.code === parsed.ddi)?.isoCode || 'BR';
    });
    setPhoneDigits(parsed.number);
  }, [value]);

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

  const filteredCountries = useMemo(() => {
    const matches = filterCountries(COUNTRIES, searchQuery);
    return matches.map((c) => ({
      code: c.ddi,
      isoCode: c.code,
      name: c.name,
      flag: c.flag,
    }));
  }, [searchQuery]);

  const selectedCountry = useMemo(
    () =>
      COUNTRY_DDI_LIST.find((c) => c.isoCode === selectedIsoCode) ||
      COUNTRY_DDI_LIST.find((c) => c.code === selectedDdi) ||
      COUNTRY_DDI_LIST[0],
    [selectedIsoCode, selectedDdi]
  );

  const emitChange = (newDdi, newNumber) => {
    const cleanNum = (newNumber || '').trim();
    if (!cleanNum) {
      if (onChange) onChange('');
      return;
    }
    const combined = `${newDdi} ${cleanNum}`.trim();
    if (onChange) onChange(combined);
  };

  const applyCountrySelection = (newDdi, newIsoCode = null) => {
    setSelectedDdi(newDdi);
    if (newIsoCode) {
      setSelectedIsoCode(newIsoCode);
    } else {
      const found = COUNTRY_DDI_LIST.find((c) => c.code === newDdi);
      if (found) setSelectedIsoCode(found.isoCode);
    }
    const formatted = newDdi === '+55' ? formatBrazilianPhone(phoneDigits) : phoneDigits;
    setPhoneDigits(formatted);
    emitChange(newDdi, formatted);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleDdiChange = (e) => {
    applyCountrySelection(e.target.value);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    const formatted = selectedDdi === '+55' ? formatBrazilianPhone(raw) : raw;
    setPhoneDigits(formatted);
    emitChange(selectedDdi, formatted);
  };

  const bgInput = isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)';
  const borderCol = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
  const dropdownBg = isLightBg ? '#ffffff' : '#0f172a';
  const mutedColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderRadius: '8px',
        border: `1px solid ${borderCol}`,
        backgroundColor: bgInput,
        opacity: disabled ? 0.65 : 1,
      }}
      data-testid="phone-with-ddi-container"
    >
      {/* Dropdown de DDI com Busca */}
      <div
        ref={selectorWrapperRef}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)',
          borderRight: `1px solid ${borderCol}`,
          borderTopLeftRadius: '7px',
          borderBottomLeftRadius: '7px',
          width: '102px',
          minWidth: '102px',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          data-testid="profile-ddi-trigger"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            width: '100%',
            padding: '11px 8px',
            background: 'transparent',
            border: 'none',
            color: textColor,
            fontSize: '13px',
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <span>{selectedCountry.flag}</span>
            <span>{selectedDdi}</span>
          </span>
          <ChevronDown
            size={13}
            color={subTextColor}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {/* Select oculto para compatibilidade e acessibilidade */}
        <select
          value={selectedDdi}
          onChange={handleDdiChange}
          disabled={disabled}
          data-testid="profile-ddi-select"
          tabIndex={-1}
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          {COUNTRY_DDI_LIST.map((c) => (
            <option key={c.isoCode} value={c.code}>
              {c.flag} {c.code} — {c.name}
            </option>
          ))}
        </select>

        {isOpen && (
          <div
            data-testid="profile-ddi-dropdown"
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: 'min(310px, 84vw)',
              backgroundColor: dropdownBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '10px',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
              zIndex: 60,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: `1px solid ${borderCol}` }}>
              <Search size={14} color={mutedColor} style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredCountries.length > 0) {
                    e.preventDefault();
                    applyCountrySelection(filteredCountries[0].code, filteredCountries[0].isoCode);
                  }
                }}
                placeholder="Buscar país ou DDI..."
                data-testid="profile-ddi-search-input"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: textColor,
                  fontSize: '12.5px',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: mutedColor, cursor: 'pointer', display: 'flex', padding: '2px' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '12.5px', color: mutedColor, textAlign: 'center' }}>
                  Nenhum país encontrado
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.isoCode === selectedCountry.isoCode;
                  return (
                    <button
                      key={c.isoCode}
                      type="button"
                      data-testid={`profile-ddi-option-${c.isoCode}`}
                      onClick={() => applyCountrySelection(c.code, c.isoCode)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '7px 10px',
                        border: 'none',
                        borderRadius: '7px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                        color: textColor,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                        <span>{c.flag}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </span>
                      <span style={{ fontWeight: 600, color: '#38bdf8', flexShrink: 0 }}>{c.code}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input de Telefone */}
      <input
        type="text"
        value={phoneDigits}
        onChange={handleNumberChange}
        disabled={disabled}
        placeholder={selectedDdi === '+55' ? '(11) 99999-9999' : 'Número do telefone'}
        style={{
          flex: 1,
          width: '100%',
          minWidth: 0,
          padding: '11px 14px',
          border: 'none',
          backgroundColor: 'transparent',
          color: textColor,
          fontSize: '14.5px',
          fontWeight: 500,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        data-testid="profile-input-phone"
      />
    </div>
  );
}
