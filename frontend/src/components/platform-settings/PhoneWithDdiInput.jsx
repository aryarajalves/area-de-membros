import React, { useState, useEffect, useMemo } from 'react';
import { Phone, ChevronDown } from 'lucide-react';

export const COUNTRY_DDI_LIST = [
  { code: '+55', name: 'Brasil', flag: '🇧🇷', mask: true },
  { code: '+1', name: 'Estados Unidos / Canadá', flag: '🇺🇸', mask: false },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', mask: false },
  { code: '+244', name: 'Angola', flag: '🇦🇴', mask: false },
  { code: '+258', name: 'Moçambique', flag: '🇲🇿', mask: false },
  { code: '+34', name: 'Espanha', flag: '🇪🇸', mask: false },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧', mask: false },
  { code: '+39', name: 'Itália', flag: '🇮🇹', mask: false },
  { code: '+49', name: 'Alemanha', flag: '🇩🇪', mask: false },
  { code: '+33', name: 'França', flag: '🇫🇷', mask: false },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', mask: false },
  { code: '+56', name: 'Chile', flag: '🇨🇱', mask: false },
  { code: '+57', name: 'Colômbia', flag: '🇨🇴', mask: false },
  { code: '+52', name: 'México', flag: '🇲🇽', mask: false },
  { code: '+595', name: 'Paraguai', flag: '🇵🇾', mask: false },
  { code: '+598', name: 'Uruguai', flag: '🇺🇾', mask: false },
  { code: '+51', name: 'Peru', flag: '🇵🇪', mask: false },
  { code: '+81', name: 'Japão', flag: '🇯🇵', mask: false },
  { code: '+61', name: 'Austrália', flag: '🇦🇺', mask: false },
  { code: '+41', name: 'Suíça', flag: '🇨🇭', mask: false },
];

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
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)',
}) {
  const initial = useMemo(() => parsePhoneAndDdi(value), [value]);
  const [selectedDdi, setSelectedDdi] = useState(initial.ddi);
  const [phoneDigits, setPhoneDigits] = useState(initial.number);

  useEffect(() => {
    const parsed = parsePhoneAndDdi(value);
    setSelectedDdi(parsed.ddi);
    setPhoneDigits(parsed.number);
  }, [value]);

  const emitChange = (newDdi, newNumber) => {
    const cleanNum = (newNumber || '').trim();
    if (!cleanNum) {
      if (onChange) onChange('');
      return;
    }
    const combined = `${newDdi} ${cleanNum}`.trim();
    if (onChange) onChange(combined);
  };

  const handleDdiChange = (e) => {
    const newDdi = e.target.value;
    setSelectedDdi(newDdi);

    // Se mudou para Brasil (+55), aplica máscara
    const formatted = newDdi === '+55' ? formatBrazilianPhone(phoneDigits) : phoneDigits;
    setPhoneDigits(formatted);
    emitChange(newDdi, formatted);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    const formatted = selectedDdi === '+55' ? formatBrazilianPhone(raw) : raw;
    setPhoneDigits(formatted);
    emitChange(selectedDdi, formatted);
  };

  const bgInput = isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)';
  const borderCol = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${borderCol}`,
        backgroundColor: bgInput,
        opacity: disabled ? 0.65 : 1,
      }}
      data-testid="phone-with-ddi-container"
    >
      {/* Dropdown de DDI */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)',
          borderRight: `1px solid ${borderCol}`,
          padding: '0 8px',
          minWidth: '105px',
          flexShrink: 0,
        }}
      >
        <select
          value={selectedDdi}
          onChange={handleDdiChange}
          disabled={disabled}
          data-testid="profile-ddi-select"
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: 'transparent',
            border: 'none',
            color: textColor,
            fontSize: '13.5px',
            fontWeight: 600,
            padding: '11px 20px 11px 4px',
            width: '100%',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
        >
          {COUNTRY_DDI_LIST.map((c) => (
            <option
              key={c.code + c.name}
              value={c.code}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '6px 10px',
              }}
            >
              {c.flag} {c.code} ({c.name})
            </option>
          ))}
        </select>

        <ChevronDown
          size={14}
          color={subTextColor}
          style={{
            position: 'absolute',
            right: '8px',
            pointerEvents: 'none',
          }}
        />
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
          minWidth: 0,
          padding: '11px 14px',
          border: 'none',
          backgroundColor: 'transparent',
          color: textColor,
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        data-testid="profile-input-phone"
      />
    </div>
  );
}
