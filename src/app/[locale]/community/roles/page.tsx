import { ArrowRight, ChevronLeft, Sparkles, UserPlus } from "lucide-react";
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
  const t = await getTranslations({ locale, namespace: "RolesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/roles", locale),
    openGraph: {
      title: t("heading"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/community/roles",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

type Step = {
  code: string;
  name: string;
  tagline: string;
  summary: string;
  points: string[];
  advance: string;
  criteriaLabel?: string;
  criteriaNote?: string;
  criteria?: string[];
};

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RolesPage" });

  const steps = t.raw("steps") as Step[];
  const mentorPoints = t.raw("mentorPoints") as string[];
  const govCards = t.raw("govCards") as {
    title: string;
    desc: string;
    points: string[];
    linkLabel?: string;
  }[];

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

        {/* ===== Recruiting half ===== */}

        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-primary border-primary/20 bg-primary/5 mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            {t("badge")}
          </span>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
            {t("intro")}
            <br />
            {t("introLine2")}
          </p>
        </div>

        {/* Ladder overview */}
        <div className="mx-auto mt-16 max-w-5xl" id="overview">
          <h2 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {t("overviewTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("overviewNote")}
          </p>

          <div className="relative mt-8">
            {/* connector line */}
            <div className="bg-primary/20 absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 md:block" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
              {steps.map((step) => (
                <a
                  key={step.code}
                  href={`#${step.code}`}
                  className="group bg-card border-border relative rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold">
                    {step.code.replace("L", "")}
                  </span>
                  <p className="text-foreground mt-3 font-semibold">
                    {step.name}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {step.tagline}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contribution types note */}
        <div className="mx-auto mt-6 max-w-5xl">
          <p className="text-muted-foreground bg-muted/40 rounded-xl border-0 px-4 py-3 text-center text-sm">
            {t("contribTypesNote")}
          </p>
        </div>

        {/* Early CTA */}
        <div className="bg-primary/10 mx-auto mt-12 max-w-3xl rounded-2xl border-0 p-6 text-center">
          <p className="text-foreground font-semibold">{t("overviewCta")}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("overviewCtaSub")}
          </p>
          <Link
            href="/community/contribution-guidelines"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {t("guideLabel")}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Details */}
        <div className="mx-auto mt-16 max-w-3xl" id="details">
          <h2 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {t("detailsTitle")}
          </h2>
          <div className="mt-6 space-y-6">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              return (
                <div
                  key={step.code}
                  id={step.code}
                  className="bg-card border-border scroll-mt-24 rounded-2xl border p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold">
                      {step.code.replace("L", "")}
                    </span>
                    <h3 className="text-foreground text-xl font-semibold">
                      {step.name}
                    </h3>
                  </div>

                  <p className="text-primary mt-6 text-sm font-semibold">
                    {t("aboutLabel")}
                  </p>
                  <p className="text-muted-foreground mt-1.5 leading-relaxed">
                    {step.summary}
                  </p>

                  {step.criteria && (
                    <>
                      <p className="text-primary mt-5 text-sm font-semibold">
                        {step.criteriaLabel ?? t("criteriaLabel")}
                      </p>
                      {step.criteriaNote && (
                        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                          {step.criteriaNote}
                        </p>
                      )}
                      <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                        {step.criteria.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className="text-primary mt-5 text-sm font-semibold">
                    {t("canLabel")}
                  </p>
                  <ul className="text-muted-foreground mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {step.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-600 mt-0.5 dark:text-emerald-400">
                          ✓
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {!isLast && (
                    <p className="text-primary mt-5 text-sm font-semibold">
                      {t("toNextLabel")}
                    </p>
                  )}
                  <p className="border-primary/20 bg-primary/5 text-foreground mt-2 rounded-lg border px-3 py-2.5 text-sm leading-relaxed">
                    {step.advance}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentor */}
        <div className="mx-auto mt-16 max-w-3xl" id="mentor">
          <h2 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {t("mentorTitle")}
          </h2>
          <ul className="text-muted-foreground mt-4 space-y-2 text-sm leading-relaxed sm:text-base">
            {mentorPoints.map((item) => (
              <li key={item} className="flex gap-3">
                <UserPlus className="text-primary mt-0.5 size-5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA band */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="bg-primary/10 rounded-3xl border-0 p-8 text-center md:p-10">
            <h2 className="text-foreground text-xl font-semibold md:text-2xl">
              {t("ctaHeading")}
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl leading-relaxed">
              {t("ctaDesc")}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/community/contribution-guidelines"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {t("guideLabel")}
              </Link>
              <a
                href="https://github.com/IvorySQL/IvorySQL/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background text-foreground hover:bg-muted rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {t("contactLabel")}
              </a>
            </div>
          </div>
        </div>

        {/* ===== Governance half ===== */}
        <div className="mx-auto mt-20 max-w-5xl border-t border-border pt-14">
          <h2 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {t("govTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("govIntro")}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {govCards.map((card) => (
              <div
                key={card.title}
                className="bg-card border-border flex flex-col rounded-2xl border p-6"
              >
                <h3 className="text-foreground text-lg font-semibold">
                  {card.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {card.desc}
                </p>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm leading-relaxed">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="text-primary mt-1.5 size-1.5 shrink-0 rounded-full bg-current" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {card.linkLabel && (
                  <Link
                    href="/community/expert-advisory-committee"
                    className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    {card.linkLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
