export interface CountryConfig {
  code: string;       // Internal code: 'cl', 'ar', etc.
  num: number;        // Grok encoding digit 1-6
  flag: string;       // Emoji flag
  flagUrl: string;    // FlagCDN image URL
  name: string;       // Display name
  slug: string;       // URL slug: 'chile', 'colombia', etc.
  newsDataCode: string;
  lang: string;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'cl', num: 1, flag: '🇨🇱', flagUrl: 'https://flagcdn.com/w40/cl.png', name: 'Chile', slug: 'chile', newsDataCode: 'cl', lang: 'es' },
  { code: 'ar', num: 2, flag: '🇦🇷', flagUrl: 'https://flagcdn.com/w40/ar.png', name: 'Argentina', slug: 'argentina', newsDataCode: 'ar', lang: 'es' },
  { code: 'co', num: 3, flag: '🇨🇴', flagUrl: 'https://flagcdn.com/w40/co.png', name: 'Colombia', slug: 'colombia', newsDataCode: 'co', lang: 'es' },
  { code: 'br', num: 4, flag: '🇧🇷', flagUrl: 'https://flagcdn.com/w40/br.png', name: 'Brasil', slug: 'brasil', newsDataCode: 'br', lang: 'pt' },
  { code: 'ec', num: 5, flag: '🇪🇨', flagUrl: 'https://flagcdn.com/w40/ec.png', name: 'Ecuador', slug: 'ecuador', newsDataCode: 'ec', lang: 'es' },
  { code: 'mx', num: 6, flag: '🇲🇽', flagUrl: 'https://flagcdn.com/w40/mx.png', name: 'México', slug: 'mexico', newsDataCode: 'mx', lang: 'es' },
];

export const DEFAULT_COUNTRY = 'chile';

export function getCountry(slugOrCode: string): CountryConfig | undefined {
  return COUNTRIES.find(c => c.slug === slugOrCode || c.code === slugOrCode);
}

export function isValidCountry(slug: string): boolean {
  return COUNTRIES.some(c => c.slug === slug);
}

// Topic encoding for Grok 2-digit system
export const TOPIC_MAP: Record<number, string> = {
  1: 'chile',        // General/local news (kept for backwards compat, maps to country-local)
  2: 'tech_global',
  3: 'impacto_global',
  4: 'finanzas',
  5: 'inversiones',
  6: 'economia',
};

// Decode Grok's 2-digit code
export function decodeGrokCode(f: number): { countryCode: string; feedTag: string } {
  const countryNum = Math.floor(f / 10);
  const topicNum = f % 10;
  const country = COUNTRIES.find(c => c.num === countryNum);
  return {
    countryCode: country?.code || 'cl',
    feedTag: TOPIC_MAP[topicNum] || 'chile',
  };
}
