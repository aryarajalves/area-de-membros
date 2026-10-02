export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', ddi: '+55' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', ddi: '+351' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', ddi: '+1' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', ddi: '+244' },
  { code: 'MZ', name: 'Moçambique', flag: '🇲🇿', ddi: '+258' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻', ddi: '+238' },
  { code: 'GW', name: 'Guiné-Bissau', flag: '🇬🇼', ddi: '+245' },
  { code: 'ST', name: 'São Tomé e Príncipe', flag: '🇸🇹', ddi: '+239' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', ddi: '+670' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', ddi: '+34' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', ddi: '+44' },
  { code: 'FR', name: 'França', flag: '🇫🇷', ddi: '+33' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', ddi: '+49' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', ddi: '+39' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', ddi: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', ddi: '+56' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾', ddi: '+598' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾', ddi: '+595' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴', ddi: '+57' },
  { code: 'MX', name: 'México', flag: '🇲🇽', ddi: '+52' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', ddi: '+1' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵', ddi: '+81' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺', ddi: '+61' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭', ddi: '+41' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪', ddi: '+32' },
  { code: 'NL', name: 'Holanda', flag: '🇳🇱', ddi: '+31' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪', ddi: '+353' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Brasil 🇧🇷 +55

export const formatPhoneNumber = (value, ddi = '+55') => {
  const digits = value.replace(/\D/g, '');
  if (ddi === '+55') {
    // Máscara Brasil: (00) 00000-0000 ou (00) 0000-0000
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) return limited.length > 0 ? `(${limited}` : '';
    if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
  }
  // Formato internacional genérico: grupos de dígitos
  const limited = digits.slice(0, 15);
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`;
};
