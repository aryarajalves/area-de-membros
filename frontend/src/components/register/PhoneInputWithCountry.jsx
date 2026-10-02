import React from 'react';
import { Phone, ChevronDown } from 'lucide-react';
import { COUNTRIES } from './countryData';

export default function PhoneInputWithCountry({
  phone,
  onPhoneChange,
  selectedCountry,
  onCountryChange,
  isLightBg = false,
}) {
  const selectBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
  const selectBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';

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
      {/* Seletor de Bandeira e DDI */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: selectBg,
          border: selectBorder,
          borderRadius: '10px',
          padding: '0 10px',
          minWidth: '100px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        data-testid="phone-country-selector-box"
      >
        <span style={{ fontSize: '1.25rem', marginRight: '6px' }}>{selectedCountry.flag}</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: textColor }}>{selectedCountry.ddi}</span>
        <ChevronDown size={14} style={{ marginLeft: '4px', opacity: 0.6, color: textColor }} />

        {/* Select invisível cobrindo o box para seleção nativa acessível */}
        <select
          value={selectedCountry.code}
          onChange={(e) => {
            const found = COUNTRIES.find((c) => c.code === e.target.value);
            if (found) onCountryChange(found);
          }}
          data-testid="phone-country-select"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label="Selecionar código do país (DDI)"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} style={{ color: '#000', backgroundColor: '#fff' }}>
              {c.flag} {c.name} ({c.ddi})
            </option>
          ))}
        </select>
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
