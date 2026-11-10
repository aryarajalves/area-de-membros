import React from 'react';
import { getZodiacSign, ZODIAC_SIGNS } from '../../utils/zodiacUtils';

export default function ZodiacBadge({
  birthDate,
  signKey,
  size = 'md', // 'sm', 'md', 'lg'
  showSymbol = true,
  showName = true,
  className = '',
}) {
  let sign = null;

  if (signKey) {
    sign = ZODIAC_SIGNS.find((s) => s.key === signKey.toLowerCase()) || null;
  } else if (birthDate) {
    sign = getZodiacSign(birthDate);
  }

  if (!sign) return null;

  const sizeStyles = {
    sm: { fontSize: '11px', padding: '2px 8px', gap: '4px' },
    md: { fontSize: '12px', padding: '3px 10px', gap: '5px' },
    lg: { fontSize: '13.5px', padding: '5px 14px', gap: '6px' },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`zodiac-badge ${className}`}
      data-testid="zodiac-badge"
      title={`Signo Solar: ${sign.name} (${sign.element}) • ${sign.period}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        ...currentSize,
        borderRadius: '20px',
        backgroundColor: sign.bgLight,
        color: sign.color,
        border: `1px solid ${sign.border}`,
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxShadow: `0 0 10px ${sign.bgLight}`,
        userSelect: 'none',
      }}
    >
      {showSymbol && <span className="zodiac-symbol" style={{ fontSize: '1.15em', lineHeight: 1 }}>{sign.symbol}</span>}
      {showName && <span className="zodiac-name">{sign.name}</span>}
    </span>
  );
}
