import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PartnersClient } from "./PartnersClient";

import { buildAlternates } from "@/lib/hreflang";
import {
  APPLY_URL,
  APPLY_URL_ZH,
  getAllPartnerCategories,
} from "@/lib/partners";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnersPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/partners", locale),
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/partners",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PartnersPage" });
  const tUI = await getTranslations({ locale, namespace: "PartnersUI" });

  const categoryLabels = tUI.raw("categories") as Record<
    string,
    { label: string; description: string }
  >;
  const categories = getAllPartnerCategories().map((category) => ({
    ...category,
    label: categoryLabels[category.id]?.label ?? category.id,
    description: categoryLabels[category.id]?.description ?? "",
  }));
  const benefits = tUI.raw("benefits") as {
    title: string;
    description: string;
  }[];
  const applyUrl = locale === "zh" ? APPLY_URL_ZH : APPLY_URL;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Page Header */}
        <div className="mb-10 lg:mb-14">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            {t("heading")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-lg">
            {t("subheading")}
          </p>
        </div>

        {/* Two-column layout: sticky sidebar + partner grid */}
        <PartnersClient
          categories={categories}
          benefits={benefits}
          applyUrl={applyUrl}
        />
      </div>
    </div>
  );
}
