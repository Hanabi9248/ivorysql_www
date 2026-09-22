import { ChevronLeft, ExternalLink, GitBranch, Package } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RoadmapPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/roadmap", locale),
  };
}

type Release = { quarter: string; version: string; kernel: string };

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RoadmapPage" });
  const releases = t.raw("releases") as Release[];

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" />
          {t("backToHome")}
        </Link>

        {/* Hero */}
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <GitBranch className="size-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {t("intro")}
          </p>
        </div>

        {/* Minor Releases */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("minorReleasesHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("minorReleasesDescription")}
          </p>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("minorReleasesScheduleIntro")}
          </p>

          <div className="mt-10 space-y-4">
            {releases.map((rel) => (
              <div
                key={rel.version}
                className="bg-muted/10 flex items-center justify-between rounded-xl border px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-foreground text-base font-semibold">
                    {rel.quarter}
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-medium">
                      {t("releaseLabel", { version: rel.version })}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground font-mono text-sm">
                  {rel.kernel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Major Release */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("nextMajorHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("nextMajorDescription")}
          </p>
          <div className="from-primary/5 mt-6 rounded-xl border bg-gradient-to-br to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="bg-muted/50 text-muted-foreground shrink-0 rounded-lg border p-2.5">
                <ExternalLink className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground text-lg font-semibold">v6.0</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("v6Schedule")}
                </p>
                <a
                  href="https://github.com/orgs/IvorySQL/projects/28"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  {t("githubProjectPage")}
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Previously Implemented */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("previousFeaturesHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("previousFeaturesDescription")}
          </p>
          <div className="bg-muted/20 mt-4 flex items-center gap-2 rounded-lg border p-4">
            <Package className="text-primary size-4 shrink-0" />
            <a
              href={t("oracleCompatUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm font-medium hover:underline"
            >
              {t("oracleCompatLabel")}
            </a>
            <ExternalLink className="text-muted-foreground size-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
