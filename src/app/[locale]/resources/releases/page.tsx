import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ReleasesClient } from "./ReleasesClient";

import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ReleasesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/resources/releases", locale),
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/resources/releases",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default async function ReleasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ReleasesPage" });

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="mb-10 lg:mb-14">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            {t("heading")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-lg">
            {t("subheading")}
          </p>
        </div>
        <ReleasesClient />
      </div>
    </div>
  );
}
