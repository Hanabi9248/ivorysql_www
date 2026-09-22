import Image from "next/image";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BlogClient } from "./BlogClient";

import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/hreflang";
import { getSortedPosts, type BlogPost } from "@/lib/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/blog", locale),
    openGraph: {
      title: t("heading"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/blog",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("BlogPage");
  const allPosts = getSortedPosts(locale);

  const featuredPost = allPosts[0] ?? null;
  const listPosts = featuredPost ? allPosts.slice(1) : allPosts;

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

        {/* Featured Post */}
        {featuredPost && (
          <FeaturedPost post={featuredPost} readArticle={t("readArticle")} />
        )}

        {/* Blog Grid with Filters */}
        <div className="mt-10">
          <BlogClient initialPosts={listPosts} allPosts={allPosts} />
        </div>
      </div>
    </div>
  );
}

function FeaturedPost({
  post,
  readArticle,
}: {
  post: BlogPost;
  readArticle: string;
}) {
  return (
    <Link
      href={post.path}
      className="group bg-muted/30 hover:bg-muted/50 grid gap-6 rounded-2xl border-0 p-6 transition-all lg:grid-cols-2 lg:gap-10 lg:p-8"
    >
      {/* Image */}
      <div className="bg-muted/60 relative aspect-[1.91/1] overflow-hidden rounded-xl">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <svg
              className="size-16 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <time>{post.formattedDate}</time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h2 className="text-foreground mt-3 text-2xl leading-tight font-semibold md:text-3xl">
          {post.title}
        </h2>

        <p className="text-muted-foreground mt-3 line-clamp-2 text-base">
          {post.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-foreground font-medium">
            {resolveAuthorName(post.author)}
          </span>
        </div>

        <div className="text-primary mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors group-hover:gap-3">
          {readArticle}
          <svg
            className="size-4 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function resolveAuthorName(authorId: string): string {
  const map: Record<string, string> = {
    official: "IvorySQL Team",
    Asif: "Asif Rehman",
    "Yasir Hussain Shah": "Yasir Hussain Shah",
    严少安: "Shawn Yan",
  };
  return map[authorId] || authorId;
}
