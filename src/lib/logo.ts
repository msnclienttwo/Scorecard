const FORBIDDEN_PATTERNS: RegExp[] = [
  /bing\.com/i,
  /duckduckgo\.com/i,
  /startpage\.com/i,
  /ecosia\.org/i,
  /qwant\.com/i,
  /yahoo\.com\/images/i,
  /yandex\.com\/images/i,
  /google\.com\/search/i,
  /google\.com\/imgres/i,
  /images\.google\./i,
  /imgres/i,
  /\/images\/search/i,
  /\/search[\/?#]?/i,
];

export const LOGO_VALIDATION_MESSAGE =
  "Please provide a direct image URL, not a search page.";

export function isDirectImageUrl(value: string): boolean {
  if (!value || !value.trim()) return false;
  if (value.length > 2048) return false;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(value))) return false;

  return true;
}

export function getLogoValidationError(
  value: string | null | undefined
): string | null {
  if (!value || !value.trim()) return null;
  return isDirectImageUrl(value) ? null : LOGO_VALIDATION_MESSAGE;
}
