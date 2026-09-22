import Image from "next/image";

import {
  ArrowRight,
  BookOpen,
  Code,
  GitPullRequest,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";
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
  const t = await getTranslations({
    locale,
    namespace: "ContributionGuidelinesPage",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/contribution-guidelines", locale),
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/community/contribution-guidelines",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

const waysToContributeIcons = [Code, HeartHandshake];
const incentivesIcons = [Sparkles, Users, BookOpen, Gift];

function Gift(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export default async function ContributionGuidelinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "ContributionGuidelinesPage",
  });

  const strongTag = (chunks: React.ReactNode) => (
    <strong className="text-foreground font-medium">{chunks}</strong>
  );
  const guideTag = (chunks: React.ReactNode) => (
    <a
      href={t("guideUrl")}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium underline"
    >
      {chunks}
    </a>
  );
  const cocTag = (chunks: React.ReactNode) => (
    <a
      href={t("codeOfConductUrl")}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium underline"
    >
      {chunks}
    </a>
  );

  const waysToContribute = t.raw("waysToContribute") as Array<{
    title: string;
    desc: string;
  }>;
  const incentives = t.raw("incentives") as Array<{
    title: string;
    desc: string;
  }>;
  const processSteps = t.raw("processSteps") as Array<{
    emoji: string;
    title: string;
    desc: string;
  }>;
  const step3Items = t.raw("gettingStartedStep3Items") as string[];
  const needHelpItems = t.raw("needHelpItems") as Array<{
    label: string;
    value: string;
  }>;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
        >
          {t("backToHome")}
        </Link>

        {/* Hero */}
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <GitPullRequest className="size-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {t.rich("heroDescription", { strong: strongTag, guide: guideTag })}
          </p>
        </div>

        {/* Ways to Contribute */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("waysToContributeHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t.rich("waysToContributeIntro", { strong: strongTag })}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {waysToContribute.map((item, i) => {
              const Icon = waysToContributeIcons[i];
              return (
                <div
                  key={item.title}
                  className="bg-muted/10 rounded-xl border p-6"
                >
                  <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-foreground text-base font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-6 text-base leading-relaxed">
            {t.rich("waysToContributeOutro", { strong: strongTag })}
          </p>
        </div>

        {/* Incentive Policy */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("incentivesHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("incentivesIntro")}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {incentives.map((item, i) => {
              const Icon = incentivesIcons[i];
              return (
                <div
                  key={item.title}
                  className="bg-muted/10 rounded-xl border p-5"
                >
                  <div className="bg-primary/10 text-primary mb-2 flex size-8 items-center justify-center rounded-md">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="text-foreground text-sm font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-6 text-base leading-relaxed">
            {t.rich("incentivesOutro", { strong: strongTag })}
          </p>
        </div>

        {/* Community Collaboration Process */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("communityProcessHeading")}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("communityProcessIntro")}
          </p>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t("communityProcessStepsIntro")}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {processSteps.map((step) => (
              <div
                key={step.title}
                className="bg-muted/10 rounded-xl border p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{step.emoji}</span>
                  <h3 className="text-foreground text-sm font-semibold">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {locale === "zh" && (
            <>
              <div className="bg-muted/30 mt-8 overflow-hidden rounded-xl border">
                <Image
                  src="/images/contributors/p23.jpg"
                  alt={t("processDiagramAlt")}
                  width={1200}
                  height={600}
                  className="size-full object-contain"
                />
              </div>
              <p className="text-muted-foreground mt-6 text-base leading-relaxed">
                {t("processSummary")}
              </p>
            </>
          )}

          <p className="text-muted-foreground mt-6 text-base leading-relaxed">
            {t.rich("codeOfConductNotice", { coc: cocTag })}
          </p>
        </div>

        {/* Getting Started */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("gettingStartedHeading")}
          </h2>

          <ol className="mt-8 space-y-8">
            <li className="text-muted-foreground text-base leading-relaxed">
              <span className="text-foreground font-medium">1. </span>
              {t("gettingStartedStep1")}
            </li>

            <li>
              <p className="text-muted-foreground text-base leading-relaxed">
                <span className="text-foreground font-medium">2. </span>
                {t("gettingStartedStep2Heading")}
              </p>
              <div className="mt-4 rounded-xl border bg-amber-50 px-5 py-4 dark:bg-amber-900/20">
                <div className="space-y-3">
                  <a
                    href="/pdf/individual_cla.pdf"
                    className="group flex items-center gap-3 rounded-lg border border-amber-200/60 bg-white/70 px-4 py-3 text-sm font-medium text-amber-900 transition-colors hover:border-amber-300 hover:bg-white dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-300">
                      <span className="text-xs font-bold">I</span>
                    </span>
                    <span className="flex-1">{t("claIndividual")}</span>
                    <ArrowRight className="text-muted-foreground size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a
                    href="/pdf/corporate_cla.pdf"
                    className="group flex items-center gap-3 rounded-lg border border-amber-200/60 bg-white/70 px-4 py-3 text-sm font-medium text-amber-900 transition-colors hover:border-amber-300 hover:bg-white dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-300">
                      <span className="text-xs font-bold">C</span>
                    </span>
                    <span className="flex-1">{t("claCorporate")}</span>
                    <ArrowRight className="text-muted-foreground size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
                <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
                  {t("claAtomGitNote")}
                </p>
              </div>
            </li>

            <li className="text-muted-foreground text-base leading-relaxed">
              <span className="text-foreground font-medium">3. </span>
              {t.rich("gettingStartedStep3", { guide: guideTag })}
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-sm">
                {step3Items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </li>

            <li className="text-muted-foreground text-base leading-relaxed">
              <span className="text-foreground font-medium">4. </span>
              {t("gettingStartedStep4")}
            </li>

            <li className="text-muted-foreground text-base leading-relaxed">
              <span className="text-foreground font-medium">5. </span>
              {t("gettingStartedStep5")}
            </li>
          </ol>
        </div>

        {/* Need Help */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground text-2xl font-semibold">
            {t("needHelpHeading")}
          </h2>

          <ul className="text-muted-foreground mt-4 space-y-2 text-base leading-relaxed">
            {needHelpItems.map((item) => (
              <li key={item.label}>
                <span className="text-foreground font-medium">
                  {item.label}
                </span>
                : {item.value}
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground mt-6 text-base leading-relaxed">
            {t.rich("needHelpFooter", { guide: guideTag })}
          </p>
        </div>
      </div>
    </div>
  );
}
