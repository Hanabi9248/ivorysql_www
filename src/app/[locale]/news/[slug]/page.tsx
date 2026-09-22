import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { NewsDetail } from "./NewsDetail";

import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/hreflang";
import { getAllNewsSlugs, getNewsItem, getSortedNews } from "@/lib/news";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllNewsSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const item = getNewsItem(locale, slug);
    const availableLocales = routing.locales.filter((l) =>
      getAllNewsSlugs(l).includes(slug),
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
        images: item.image ? [{ url: item.image }] : [{ url: "/og-image.jpg" }],
      },
    };
  } catch {
    return {
      title: "News Not Found",
      description: "The requested news article could not be found.",
    };
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  try {
    const item = getNewsItem(locale, slug);

    // Get prev/next articles
    const allNews = getSortedNews(locale);
    const currentIndex = allNews.findIndex((n) => n.slug === slug);
    const prevItem =
      currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null;
    const nextItem = currentIndex > 0 ? allNews[currentIndex - 1] : null;

    return <NewsDetail item={item} prevItem={prevItem} nextItem={nextItem} />;
  } catch {
    notFound();
  }
}
