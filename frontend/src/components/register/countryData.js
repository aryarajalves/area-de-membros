export const COUNTRIES = [
  // Principais e Lusófonos
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', ddi: '+55', keywords: 'brazil' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', ddi: '+351' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', ddi: '+1', keywords: 'usa eua america united states' },
  { code: 'AE', name: 'Emirados Árabes Unidos', flag: '🇦🇪', ddi: '+971', keywords: 'dubai abu dhabi uae emirados arabes unidos' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', ddi: '+244' },
  { code: 'MZ', name: 'Moçambique', flag: '🇲🇿', ddi: '+258', keywords: 'mozambique' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻', ddi: '+238', keywords: 'cape verde' },
  { code: 'GW', name: 'Guiné-Bissau', flag: '🇬🇼', ddi: '+245' },
  { code: 'ST', name: 'São Tomé e Príncipe', flag: '🇸🇹', ddi: '+239' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', ddi: '+670' },

  // Américas
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', ddi: '+1', keywords: 'canada' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', ddi: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', ddi: '+56' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾', ddi: '+598', keywords: 'uruguay' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾', ddi: '+595', keywords: 'paraguay' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴', ddi: '+57' },
  { code: 'MX', name: 'México', flag: '🇲🇽', ddi: '+52' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', ddi: '+51' },
  { code: 'BO', name: 'Bolívia', flag: '🇧🇴', ddi: '+591' },
  { code: 'EC', name: 'Equador', flag: '🇪🇨', ddi: '+593', keywords: 'ecuador' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', ddi: '+58' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', ddi: '+506' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', ddi: '+507' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴', ddi: '+1809' },
  { code: 'PR', name: 'Porto Rico', flag: '🇵🇷', ddi: '+1787', keywords: 'puerto rico' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', ddi: '+502' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', ddi: '+504' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', ddi: '+503' },
  { code: 'NI', name: 'Nicarágua', flag: '🇳🇮', ddi: '+505' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', ddi: '+53' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', ddi: '+1876' },
  { code: 'TT', name: 'Trinidad e Tobago', flag: '🇹🇹', ddi: '+1868' },

  // Europa
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', ddi: '+34', keywords: 'spain' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', ddi: '+44', keywords: 'uk inglaterra london england' },
  { code: 'FR', name: 'França', flag: '🇫🇷', ddi: '+33', keywords: 'france paris' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', ddi: '+49', keywords: 'germany deutschland berlin' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', ddi: '+39', keywords: 'italy roma milao' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭', ddi: '+41', keywords: 'switzerland zurich geneva' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪', ddi: '+32', keywords: 'belgium' },
  { code: 'NL', name: 'Holanda (Países Baixos)', flag: '🇳🇱', ddi: '+31', keywords: 'netherlands amsterdam' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪', ddi: '+353', keywords: 'ireland dublin' },
  { code: 'AT', name: 'Áustria', flag: '🇦🇹', ddi: '+43', keywords: 'austria vienna' },
  { code: 'LU', name: 'Luxemburgo', flag: '🇱🇺', ddi: '+352' },
  { code: 'SE', name: 'Suécia', flag: '🇸🇪', ddi: '+46', keywords: 'sweden' },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴', ddi: '+47', keywords: 'norway' },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰', ddi: '+45', keywords: 'denmark' },
  { code: 'FI', name: 'Finlândia', flag: '🇫🇮', ddi: '+358', keywords: 'finland' },
  { code: 'IS', name: 'Islândia', flag: '🇮🇸', ddi: '+354', keywords: 'iceland' },
  { code: 'PL', name: 'Polônia', flag: '🇵🇱', ddi: '+48', keywords: 'poland' },
  { code: 'CZ', name: 'República Tcheca', flag: '🇨🇿', ddi: '+420', keywords: 'czechia' },
  { code: 'HU', name: 'Hungria', flag: '🇭🇺', ddi: '+36', keywords: 'hungary' },
  { code: 'GR', name: 'Grécia', flag: '🇬🇷', ddi: '+30', keywords: 'greece' },
  { code: 'RO', name: 'Romênia', flag: '🇷🇴', ddi: '+40', keywords: 'romania' },
  { code: 'BG', name: 'Bulgária', flag: '🇧🇬', ddi: '+359' },
  { code: 'HR', name: 'Croácia', flag: '🇭🇷', ddi: '+385' },
  { code: 'SK', name: 'Eslováquia', flag: '🇸🇰', ddi: '+421' },
  { code: 'SI', name: 'Eslovênia', flag: '🇸🇮', ddi: '+386' },
  { code: 'RS', name: 'Sérvia', flag: '🇷🇸', ddi: '+381' },
  { code: 'UA', name: 'Ucrânia', flag: '🇺🇦', ddi: '+380', keywords: 'ukraine' },
  { code: 'RU', name: 'Rússia', flag: '🇷🇺', ddi: '+7', keywords: 'russia' },
  { code: 'TR', name: 'Turquia', flag: '🇹🇷', ddi: '+90', keywords: 'turkey istambul' },
  { code: 'CY', name: 'Chipre', flag: '🇨🇾', ddi: '+357', keywords: 'cyprus' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', ddi: '+356' },
  { code: 'MC', name: 'Mônaco', flag: '🇲🇨', ddi: '+377' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', ddi: '+376' },
  { code: 'EE', name: 'Estônia', flag: '🇪🇪', ddi: '+372' },
  { code: 'LV', name: 'Letônia', flag: '🇱🇻', ddi: '+371' },
  { code: 'LT', name: 'Lituânia', flag: '🇱🇹', ddi: '+370' },

  // Oriente Médio
  { code: 'SA', name: 'Arábia Saudita', flag: '🇸🇦', ddi: '+966', keywords: 'saudi arabia riade' },
  { code: 'QA', name: 'Catar (Qatar)', flag: '🇶🇦', ddi: '+974', keywords: 'qatar doha' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', ddi: '+965' },
  { code: 'BH', name: 'Bahrein', flag: '🇧🇭', ddi: '+973' },
  { code: 'OM', name: 'Omã', flag: '🇴🇲', ddi: '+968', keywords: 'oman' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', ddi: '+972', keywords: 'tel aviv jerusalem' },
  { code: 'JO', name: 'Jordânia', flag: '🇯🇴', ddi: '+962', keywords: 'jordan' },
  { code: 'LB', name: 'Líbano', flag: '🇱🇧', ddi: '+961', keywords: 'lebanon' },
  { code: 'IQ', name: 'Iraque', flag: '🇮🇶', ddi: '+964' },
  { code: 'IR', name: 'Irã', flag: '🇮🇷', ddi: '+98' },

  // Ásia e Oceania
  { code: 'JP', name: 'Japão', flag: '🇯🇵', ddi: '+81', keywords: 'japan tokyo' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺', ddi: '+61', keywords: 'australia sydney' },
  { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿', ddi: '+64', keywords: 'new zealand' },
  { code: 'CN', name: 'China', flag: '🇨🇳', ddi: '+86' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', ddi: '+852' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', ddi: '+886' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷', ddi: '+82', keywords: 'south korea seoul' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳', ddi: '+91', keywords: 'india' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬', ddi: '+65', keywords: 'singapore' },
  { code: 'MY', name: 'Malásia', flag: '🇲🇾', ddi: '+60', keywords: 'malaysia' },
  { code: 'TH', name: 'Tailândia', flag: '🇹🇭', ddi: '+66', keywords: 'thailand' },
  { code: 'ID', name: 'Indonésia', flag: '🇮🇩', ddi: '+62', keywords: 'indonesia bali' },
  { code: 'PH', name: 'Filipinas', flag: '🇵🇭', ddi: '+63', keywords: 'philippines' },
  { code: 'VN', name: 'Vietnã', flag: '🇻🇳', ddi: '+84', keywords: 'vietnam' },
  { code: 'PK', name: 'Paquistão', flag: '🇵🇰', ddi: '+92', keywords: 'pakistan' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', ddi: '+880' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', ddi: '+94' },
  { code: 'KZ', name: 'Cazaquistão', flag: '🇰🇿', ddi: '+7' },

  // África
  { code: 'ZA', name: 'África do Sul', flag: '🇿🇦', ddi: '+27', keywords: 'south africa' },
  { code: 'MA', name: 'Marrocos', flag: '🇲🇦', ddi: '+212', keywords: 'morocco' },
  { code: 'EG', name: 'Egito', flag: '🇪🇬', ddi: '+20', keywords: 'egypt' },
  { code: 'NG', name: 'Nigéria', flag: '🇳🇬', ddi: '+234', keywords: 'nigeria' },
  { code: 'KE', name: 'Quênia', flag: '🇰🇪', ddi: '+254', keywords: 'kenya' },
  { code: 'GH', name: 'Gana', flag: '🇬🇭', ddi: '+233', keywords: 'ghana' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', ddi: '+221' },
  { code: 'CM', name: 'Camarões', flag: '🇨🇲', ddi: '+237' },
  { code: 'CI', name: 'Costa do Marfim', flag: '🇨🇮', ddi: '+225' },
  { code: 'TN', name: 'Tunísia', flag: '🇹🇳', ddi: '+216' },
  { code: 'DZ', name: 'Argélia', flag: '🇩🇿', ddi: '+213' },
  { code: 'ET', name: 'Etiópia', flag: '🇪🇹', ddi: '+251' },
  { code: 'TZ', name: 'Tanzânia', flag: '🇹🇿', ddi: '+255' },
  { code: 'NA', name: 'Namíbia', flag: '🇳🇦', ddi: '+264' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Brasil 🇧🇷 +55

export function normalizeCountrySearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterCountries(countries = COUNTRIES, searchQuery = '') {
  const query = normalizeCountrySearchText(searchQuery);
  if (!query) return countries;
  const queryNoPlus = query.replace(/^\+/, '');

  return countries.filter((country) => {
    const name = normalizeCountrySearchText(country.name);
    const code = normalizeCountrySearchText(country.code);
    const ddi = normalizeCountrySearchText(country.ddi);
    const ddiDigits = ddi.replace(/^\+/, '');
    const keywords = normalizeCountrySearchText(country.keywords || '');

    return (
      name.includes(query) ||
      code.includes(query) ||
      ddi.includes(query) ||
      (queryNoPlus && ddiDigits.includes(queryNoPlus)) ||
      keywords.includes(query)
    );
  });
}

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
