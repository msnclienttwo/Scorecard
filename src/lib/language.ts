export interface Language {
  code: string;
  name: string;
  nativeName: string;
  emoji: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", emoji: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", emoji: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", emoji: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", emoji: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", emoji: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", emoji: "🇮🇳" },
];

const LANGUAGE_MAP = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code?: string | null): Language {
  return LANGUAGE_MAP.get(code ?? "") ?? LANGUAGES[0];
}

export function languageName(code?: string | null): string {
  return getLanguage(code).name;
}

export function languageEmoji(code?: string | null): string {
  return getLanguage(code).emoji;
}

export function isValidLanguage(code: string): boolean {
  return LANGUAGE_MAP.has(code);
}

export function targetLanguagePrompt(code: string): string {
  const lang = getLanguage(code);
  return `${lang.name} (${lang.nativeName})`;
}
