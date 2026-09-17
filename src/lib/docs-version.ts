/**
 * Bump this on every new IvorySQL release — it's the single source of truth
 * for the doc-version segment baked into hardcoded docs.ivorysql.org links
 * (homepage quickstart/capabilities blocks, ecosystem page, etc).
 * Does NOT affect src/lib/releases.ts, which is a historical archive and
 * intentionally pins each entry to its own released version.
 */
export const CURRENT_DOC_VERSION = "5.6";

export function docUrl(locale: "cn" | "en", path: string): string {
  return `https://docs.ivorysql.org/${locale}/ivorysql-doc/v${CURRENT_DOC_VERSION}/${path}`;
}
