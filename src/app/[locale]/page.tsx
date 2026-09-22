import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Background } from "@/components/background";
import { BusinessValue } from "@/components/blocks/business-value";
import { Capabilities } from "@/components/blocks/capabilities";
import { Community } from "@/components/blocks/community";
import { Features } from "@/components/blocks/features";
import { Hero } from "@/components/blocks/hero";
import { OpenSourceBanner } from "@/components/blocks/open-source-banner";
import { Quickstart } from "@/components/blocks/quickstart";
import { UseCases } from "@/components/blocks/use-cases";
import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomeMeta" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/", locale),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org",
    },
    twitter: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default function Home() {
  return (
    <>
      <Background>
        <Hero />
        <Capabilities />
        <Quickstart />
        <Features />
        <BusinessValue />
        <UseCases />
        <OpenSourceBanner />
        <Community />
      </Background>
    </>
  );
}
