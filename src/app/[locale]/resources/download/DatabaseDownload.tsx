"use client";

import { useState } from "react";

import { Download, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CopyButton } from "./CopyButton";

import {
  DB_ARCHES,
  DB_ARCH_LABELS,
  DB_FORMATS,
  DB_FORMAT_LABELS,
  formatPackageSize,
  GITHUB_RELEASES_URL,
  type DbArch,
  type DbFormat,
  type DbRelease,
} from "@/lib/db-packages";
import { cn, parseUTCDate } from "@/lib/utils";

const DEFAULT_ARCH: DbArch = "x86_64";
const DEFAULT_FORMAT: DbFormat = "rpm";

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Toggle-button selector. Uses `aria-pressed` rather than tab or radio
 * semantics so the accessible contract matches the (single-click, no arrow-key
 * navigation) behaviour actually implemented.
 */
function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-start gap-x-3">
      {/* Fixed-width label beside a chip box that wraps on its own, so labels
          stay column-aligned even when a row of chips needs two lines. */}
      <span className="text-muted-foreground w-16 shrink-0 pt-2 text-xs font-bold tracking-wide uppercase">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "focus-visible:ring-primary/50 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? // blue-600, not blue-500: white on blue-500 is 3.76:1,
                    // below the 4.5:1 WCAG AA floor for text this size.
                    "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "border-border text-muted-foreground hover:text-foreground bg-transparent hover:border-blue-500/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReleaseTabs({
  releases,
  activeTag,
  onChange,
}: {
  releases: DbRelease[];
  activeTag: string;
  onChange: (tag: string) => void;
}) {
  if (releases.length < 2) return null;

  return (
    <div className="bg-muted/50 inline-flex flex-wrap gap-1 rounded-xl p-1">
      {releases.map((release) => {
        const active = release.tag === activeTag;
        return (
          <button
            key={release.tag}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(release.tag)}
            className={cn(
              "focus-visible:ring-primary/50 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {release.version}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DatabaseDownload({ releases }: { releases: DbRelease[] }) {
  const t = useTranslations("DownloadUI");
  const locale = useLocale();
  const [activeTag, setActiveTag] = useState(releases[0]?.tag ?? "");
  const [arch, setArch] = useState<DbArch>(DEFAULT_ARCH);
  const [format, setFormat] = useState<DbFormat>(DEFAULT_FORMAT);

  if (releases.length === 0) return null;

  const release = releases.find((r) => r.tag === activeTag) ?? releases[0];

  // The effective selection is derived, never stored. Switching release lines
  // therefore can't leave behind a selection the new line doesn't offer, and
  // there is no effect to keep in sync.
  const arches = DB_ARCHES.filter((candidate) =>
    release.packages.some((pkg) => pkg.arch === candidate),
  );
  const effectiveArch = arches.includes(arch) ? arch : arches[0];

  const formats = DB_FORMATS.filter((candidate) =>
    release.packages.some(
      (pkg) => pkg.arch === effectiveArch && pkg.format === candidate,
    ),
  );
  const effectiveFormat = formats.includes(format) ? format : formats[0];

  const selected = release.packages.find(
    (pkg) => pkg.arch === effectiveArch && pkg.format === effectiveFormat,
  );

  const releasedOn = parseUTCDate(release.publishedAt).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: locale === "zh" ? "long" : "short",
      day: "numeric",
      timeZone: "UTC",
    },
  );

  // The highest major line is the flagship; the other maintained line is the
  // long-term-support one. `releases` arrives ordered newest-major-first.
  const isFlagship = release.tag === releases[0].tag;

  return (
    <div className="bg-card overflow-hidden rounded-2xl border">
      <div className="p-5 md:p-7">
        {/* Top row: release-line switch on the left, the way out to every
            published release on the right. */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <ReleaseTabs
            releases={releases}
            activeTag={release.tag}
            onChange={setActiveTag}
          />
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 inline-flex items-center gap-1.5 rounded text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("database.allReleases")}
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* Two columns: pick on the left, get it on the right. Collapses to a
            single stack below lg, where the divider would only add noise. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {/* h2, not h3: the page's only other heading is the h1 page
                  title, so h3 would skip a level. */}
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                IvorySQL {release.version}
              </h2>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {isFlagship ? t("database.latestStable") : t("database.lts")}
              </span>
            </div>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t("database.releasedOn", { date: releasedOn })}
            </p>

            <div className="mt-6 space-y-3">
              <ChipGroup
                label={t("database.archLabel")}
                options={arches.map((value) => ({
                  value,
                  label: DB_ARCH_LABELS[value],
                }))}
                value={effectiveArch}
                onChange={setArch}
              />
              <ChipGroup
                label={t("database.formatLabel")}
                options={formats.map((value) => ({
                  value,
                  label: DB_FORMAT_LABELS[value],
                }))}
                value={effectiveFormat}
                onChange={setFormat}
              />
            </div>
          </div>

          <div className="border-border flex flex-col justify-center border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            {selected ? (
              <>
                <a
                  href={selected.url}
                  rel="noopener noreferrer"
                  className="focus-visible:ring-primary/50 group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Download className="size-5 transition-transform group-hover:translate-y-0.5" />
                  {t("database.downloadNow")}
                  {/* No opacity here: dimming white on blue drops the size
                      below the AA contrast floor. Weight carries the
                      hierarchy instead. */}
                  <span className="font-normal tabular-nums">
                    {formatPackageSize(selected.size)}
                  </span>
                </a>

                <p className="text-muted-foreground mt-3.5 font-mono text-xs break-all">
                  {selected.filename}
                </p>
                {selected.md5 ? (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      MD5
                    </span>
                    <code className="text-muted-foreground truncate font-mono text-xs">
                      {selected.md5}
                    </code>
                    <CopyButton key={selected.md5} value={selected.md5} />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("database.unavailable")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
