import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContributorsClient } from "./ContributorsClient";

import { contributors, contributorYears } from "@/lib/contributors";
import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContributorsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/contributors", locale),
    openGraph: {
      title: t("heading"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/community/contributors",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default function ContributorsPage() {
  const includedYears = `${contributorYears[contributorYears.length - 1]}-${contributorYears[0]}`;

  return (
    <ContributorsClient
      contributors={contributors}
      contributorYears={contributorYears}
      includedYears={includedYears}
    />
  );
}
