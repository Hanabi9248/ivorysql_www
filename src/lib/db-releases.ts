import {
  DB_ARCHES,
  DB_FORMATS,
  type DbArch,
  type DbFormat,
  type DbPackage,
  type DbRelease,
} from "./db-packages";
import rawSnapshot from "./db-releases.snapshot.json";

/**
 * Build-time source for IvorySQL server packages ("介质包") from GitHub
 * Releases. SERVER ONLY — import types and labels from `db-packages.ts`
 * instead when you need them in a client component.
 *
 * Release asset filenames embed a git short hash and a build date
 * (`IvorySQL-5.4-a45b045-20260615.x86_64.rpm`), so download URLs cannot be
 * derived from a version number — they have to come from the API. This runs
 * once during `next build` and is baked into the static download page, so
 * visitors never hit GitHub's API and are never rate-limited. On any failure
 * it falls back to a committed snapshot, so a build never breaks because
 * GitHub is having a bad day.
 *
 * Refresh the snapshot with `pnpm refresh:releases`.
 */

// ─── Raw GitHub shape ─────────────────────────────────────────────────────────
//
// The snapshot stores this raw shape rather than the finished result, so the
// live path and the fallback path run through the same transform below. The
// fallback therefore cannot drift semantically from live data.

type RawAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type RawRelease = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  assets: RawAsset[];
};

export type RawSnapshot = {
  fetchedAt: string;
  releases: RawRelease[];
  /** Asset filename → md5 hash. */
  md5s: Record<string, string>;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const RELEASES_ENDPOINT =
  "https://api.github.com/repos/IvorySQL/IvorySQL/releases?per_page=100";

const FETCH_TIMEOUT_MS = 15_000;

/**
 * How many maintained release lines to surface as tabs.
 *
 * Two is deliberate: a line stops appearing once it stops shipping, because
 * `selectReleases` ranks lines by how recently they released. When a new major
 * line arrives and the previous one goes end-of-life, the retired line falls
 * off on its own — no edit here.
 */
const ACTIVE_LINE_COUNT = 2;

/**
 * Asset filename suffix → architecture and package format.
 *
 * RPM and DEB use different names for the same hardware (`x86_64`/`amd64`,
 * `aarch64`/`arm64`); collapsing them here is what lets the UI offer a plain
 * "architecture × format" choice instead of making visitors decode filenames.
 */
const ASSET_SUFFIXES: Record<string, { arch: DbArch; format: DbFormat }> = {
  ".x86_64.rpm": { arch: "x86_64", format: "rpm" },
  ".amd64.deb": { arch: "x86_64", format: "deb" },
  ".aarch64.rpm": { arch: "arm64", format: "rpm" },
  ".arm64.deb": { arch: "arm64", format: "deb" },
  ".loongarch64.rpm": { arch: "loongarch64", format: "rpm" },
  ".loongarch64.deb": { arch: "loongarch64", format: "deb" },
  ".mips64el.rpm": { arch: "mips64el", format: "rpm" },
  ".mips64el.deb": { arch: "mips64el", format: "deb" },
};

const MD5_SUFFIX = ".md5";

/**
 * Anchored on purpose: `Ivorysql_3.0_Beta` is published with
 * `prerelease: false` on GitHub, so the tag shape — not the flag — is what
 * keeps pre-releases and the legacy `Ivory_REL_1_8` scheme out.
 */
const TAG_PATTERN = /^IvorySQL[_-]v?(\d+)\.(\d+)(?:\.(\d+))?$/i;

// ─── Pure transform ───────────────────────────────────────────────────────────

function parseTag(tag: string): { version: string; line: string } | null {
  const match = TAG_PATTERN.exec(tag.trim());
  if (!match) return null;
  const [, major, minor, patch] = match;
  return {
    version: patch ? `${major}.${minor}.${patch}` : `${major}.${minor}`,
    line: major,
  };
}

function parseAssetName(
  filename: string,
): { arch: DbArch; format: DbFormat } | null {
  for (const [suffix, target] of Object.entries(ASSET_SUFFIXES)) {
    // `.rpm.md5` sidecars don't end in `.rpm`, so they're excluded for free.
    if (filename.endsWith(suffix)) return target;
  }
  return null;
}

/**
 * Picks the maintained release lines: the newest release of each major line,
 * ranked by how recently that line shipped, then ordered newest-major-first
 * for display.
 *
 * Ranking by recency rather than by version number is deliberate. The 4.x
 * line's latest release (4.6, Sep 2025) has a higher version number than the
 * 1.x line's (1.23, Jul 2026) but is older in time, and 4.x is no longer
 * maintained — "shipped most recently" is what actually identifies an active
 * line.
 */
function selectReleases(releases: RawRelease[]): RawRelease[] {
  const newestPerLine = new Map<string, RawRelease>();

  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const parsed = parseTag(release.tag_name);
    if (!parsed) continue;

    const incumbent = newestPerLine.get(parsed.line);
    if (!incumbent || release.published_at > incumbent.published_at) {
      newestPerLine.set(parsed.line, release);
    }
  }

  return Array.from(newestPerLine.values())
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, ACTIVE_LINE_COUNT)
    .sort(
      (a, b) =>
        Number(parseTag(b.tag_name)?.line ?? 0) -
        Number(parseTag(a.tag_name)?.line ?? 0),
    );
}

const ARCH_ORDER = new Map(DB_ARCHES.map((arch, index) => [arch, index]));
const FORMAT_ORDER = new Map(
  DB_FORMATS.map((format, index) => [format, index]),
);

function compareBuildNames(a: string, b: string): number {
  const dateA = /-(\d{8})\.[^.]+\.(?:rpm|deb)$/.exec(a)?.[1];
  const dateB = /-(\d{8})\.[^.]+\.(?:rpm|deb)$/.exec(b)?.[1];
  if (dateA && dateB && dateA !== dateB) {
    return dateA > dateB ? 1 : -1;
  }
  return a === b ? 0 : a > b ? 1 : -1;
}

function buildPackages(
  release: RawRelease,
  md5s: Record<string, string>,
): DbPackage[] {
  // Keyed by arch+format so a release carrying two builds for one target
  // resolves to the later build date. The preceding git hash is not ordered
  // chronologically; use the full filename only as a tie-break or fallback.
  const byTarget = new Map<string, DbPackage>();

  for (const asset of release.assets) {
    const target = parseAssetName(asset.name);
    if (!target) continue;

    const key = `${target.arch}-${target.format}`;
    const incumbent = byTarget.get(key);
    if (incumbent && compareBuildNames(incumbent.filename, asset.name) >= 0)
      continue;

    byTarget.set(key, {
      arch: target.arch,
      format: target.format,
      filename: asset.name,
      url: asset.browser_download_url,
      size: asset.size,
      md5: md5s[asset.name] ?? null,
    });
  }

  return Array.from(byTarget.values()).sort(
    (a, b) =>
      (ARCH_ORDER.get(a.arch) ?? 0) - (ARCH_ORDER.get(b.arch) ?? 0) ||
      (FORMAT_ORDER.get(a.format) ?? 0) - (FORMAT_ORDER.get(b.format) ?? 0),
  );
}

function buildRelease(
  release: RawRelease,
  md5s: Record<string, string>,
): DbRelease | null {
  const parsed = parseTag(release.tag_name);
  if (!parsed) return null;

  const packages = buildPackages(release, md5s);
  if (packages.length === 0) return null;

  const unrecognized = release.assets.filter(
    (asset) =>
      !asset.name.endsWith(MD5_SUFFIX) && parseAssetName(asset.name) === null,
  );
  if (unrecognized.length > 0) {
    // Surfaces at build time when a release adds a target ASSET_SUFFIXES
    // doesn't know about. Such assets are omitted rather than guessed at, and
    // the "view on GitHub" link still reaches them.
    // eslint-disable-next-line no-console -- build-time diagnostic
    console.warn(
      `[db-releases] ${release.tag_name}: ${unrecognized.length} asset(s) with unrecognized platform suffix, omitted: ${unrecognized
        .map((asset) => asset.name)
        .join(", ")}`,
    );
  }

  return {
    tag: release.tag_name,
    version: parsed.version,
    line: parsed.line,
    publishedAt: release.published_at.slice(0, 10),
    packages,
  };
}

function transform(
  releases: RawRelease[],
  md5s: Record<string, string>,
): DbRelease[] {
  return selectReleases(releases)
    .map((release) => buildRelease(release, md5s))
    .filter((release): release is DbRelease => release !== null);
}

// ─── Fetching ─────────────────────────────────────────────────────────────────

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    // GitHub rejects API requests without a User-Agent.
    "User-Agent": "ivorysql-www-build",
    Accept: "application/vnd.github+json",
  };
  // Optional: raises the build-time rate limit in CI. Never required.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchReleases(): Promise<RawRelease[]> {
  const response = await fetch(RELEASES_ENDPOINT, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Fetched once per build and baked into the static page; `force-cache`
    // keeps the en and zh renders from issuing duplicate requests.
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`GitHub releases API returned ${response.status}`);
  }
  return (await response.json()) as RawRelease[];
}

/**
 * Reads the `.md5` sidecar published next to each package. These are ~75-byte
 * files served from `objects.githubusercontent.com`, which does not count
 * against the GitHub API rate limit.
 */
async function fetchMd5s(
  releases: RawRelease[],
): Promise<Record<string, string>> {
  const sidecars = releases.flatMap((release) =>
    release.assets.filter(
      (asset) =>
        asset.name.endsWith(MD5_SUFFIX) &&
        parseAssetName(asset.name.slice(0, -MD5_SUFFIX.length)) !== null,
    ),
  );

  const entries = await Promise.all(
    sidecars.map(async (asset) => {
      try {
        const response = await fetch(asset.browser_download_url, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          cache: "force-cache",
        });
        if (!response.ok) return null;
        // Standard md5sum output: "<hash>  <filename>".
        const hash = (await response.text()).trim().split(/\s+/)[0];
        if (!/^[0-9a-f]{32}$/i.test(hash)) return null;
        return [asset.name.slice(0, -MD5_SUFFIX.length), hash] as const;
      } catch {
        // A missing checksum degrades the UI, it doesn't break it.
        return null;
      }
    }),
  );

  return Object.fromEntries(
    entries.filter((entry): entry is [string, string] => entry !== null),
  );
}

const snapshot = rawSnapshot as RawSnapshot;

/**
 * Returns the maintained IvorySQL release lines with their downloadable
 * packages. Falls back to the committed snapshot on any failure, and returns
 * `[]` only if the snapshot itself yields nothing — which the download page
 * handles by linking out to the GitHub releases page.
 */
export async function getDbReleases(): Promise<DbRelease[]> {
  try {
    const releases = await fetchReleases();
    const md5s = await fetchMd5s(selectReleases(releases));
    const built = transform(releases, md5s);
    if (built.length === 0) {
      throw new Error("GitHub returned no usable IvorySQL releases");
    }
    return built;
  } catch (error) {
    // eslint-disable-next-line no-console -- build-time diagnostic: explains why the page shipped with snapshot data
    console.warn(
      `[db-releases] Falling back to snapshot from ${snapshot.fetchedAt}:`,
      error instanceof Error ? error.message : error,
    );
    return transform(snapshot.releases, snapshot.md5s);
  }
}
