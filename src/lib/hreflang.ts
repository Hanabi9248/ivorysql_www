import type { Metadata } from "next";

/**
 * Builds canonical and language alternates for the current page locale and path
 * (no locale prefix, e.g. "/blog/my-post" or "" for the homepage).
 * Relies on metadataBase (set in the root layout) to resolve to absolute URLs.
 *
 * Pass `availableLocales` for content-driven pages (blog/news/events) where a
 * post may only exist in one locale — omitting it would otherwise advertise a
 * hreflang alternate that 404s.
 */
export function buildAlternates(
  path: string,
  locale: string,
  availableLocales?: readonly ("en" | "zh")[],
): Metadata["alternates"] {
  const normalizedPath = path === "/" ? "" : path;
  const allLanguages = {
    en: normalizedPath || "/",
    zh: `/zh${normalizedPath}`,
  };
  const locales = availableLocales ?? (["en", "zh"] as const);
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, allLanguages[locale]]),
  );
  const defaultPath = languages.en ?? languages.zh ?? (normalizedPath || "/");
  return {
    canonical: languages[locale] ?? defaultPath,
    languages: {
      ...languages,
      "x-default": defaultPath,
    },
  };
}
