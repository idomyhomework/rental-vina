// --- I18N — CONFIG ---

export const locales = ["ru", "es", "en", "ua"] as const;
export const defaultLocale = "ru" as const;

export type Locale = (typeof locales)[number];
