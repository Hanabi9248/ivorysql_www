import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ExpertCommitteeClient } from "./ExpertCommitteeClient";

import { expertCommittee } from "@/lib/expert-committee";
import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ExpertCommitteePage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/expert-advisory-committee", locale),
    openGraph: {
      title: t("heroTitle"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/community/expert-advisory-committee",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default function ExpertAdvisoryCommitteePage() {
  return <ExpertCommitteeClient experts={expertCommittee} />;
}
