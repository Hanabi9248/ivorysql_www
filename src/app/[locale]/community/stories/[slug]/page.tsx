import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { StoryDetail } from "./StoryDetail";

import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/hreflang";
import {
  getAllStorySlugs,
  getSortedStories,
  getStoryItem,
} from "@/lib/stories";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllStorySlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const item = getStoryItem(locale, slug);
    const availableLocales = routing.locales.filter((l) =>
      getAllStorySlugs(l).includes(slug),
    );
    return {
      title: item.title,
      description: item.description,
      alternates: buildAlternates(item.path, locale, availableLocales),
      openGraph: {
        title: item.title,
        description: item.description,
        url: `https://www.ivorysql.org${item.path}`,
        type: "article",
        images: [{ url: "/og-image.jpg" }],
      },
    };
  } catch {
    return {
      title: "Story Not Found",
      description: "The requested customer story could not be found.",
    };
  }
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  try {
    const item = getStoryItem(locale, slug);

    // Get prev/next stories
    const allStories = getSortedStories(locale);
    const currentIndex = allStories.findIndex((s) => s.slug === slug);
    const prevItem =
      currentIndex < allStories.length - 1
        ? allStories[currentIndex + 1]
        : null;
    const nextItem = currentIndex > 0 ? allStories[currentIndex - 1] : null;

    return <StoryDetail item={item} prevItem={prevItem} nextItem={nextItem} />;
  } catch {
    notFound();
  }
}
