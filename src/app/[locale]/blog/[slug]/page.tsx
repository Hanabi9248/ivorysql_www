import { Suspense } from "react";

import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { BlogPostContent } from "./BlogPostContent";

import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/hreflang";
import { getAllPostSlugs, getPostdata, getSortedPosts } from "@/lib/posts";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllPostSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const post = getPostdata(locale, slug);
    const availableLocales = routing.locales.filter((l) =>
      getAllPostSlugs(l).includes(slug),
    );
    return {
      title: post.title,
      description: post.description,
      alternates: buildAlternates(post.path, locale, availableLocales),
      openGraph: {
        title: post.title,
        description: post.description,
        url: `https://www.ivorysql.org${post.path}`,
        type: "article",
        images: post.image ? [{ url: post.image }] : [{ url: "/og-image.jpg" }],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
        images: post.image ? [post.image] : ["/og-image.jpg"],
      },
    };
  } catch {
    return {
      title: "Blog Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  try {
    const post = getPostdata(locale, slug);

    // Get prev/next posts
    const allPosts = getSortedPosts(locale);
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);
    const prevPost =
      currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

    // Get related posts (same category, exclude current)
    const relatedPosts = getSortedPosts(locale)
      .filter((p) => p.category === post.category && p.slug !== slug)
      .slice(0, 3);

    return (
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-16">Loading...</div>
        }
      >
        <BlogPostContent
          post={post}
          prevPost={prevPost}
          nextPost={nextPost}
          relatedPosts={relatedPosts}
        />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
