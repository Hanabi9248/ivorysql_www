import Image from "next/image";

import { ChevronLeft, Linkedin, Twitter } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MDXRenderer } from "./MDXRenderer";

import { getPathname, Link } from "@/i18n/navigation";
import authorsData from "@/lib/authors.json";
import type { BlogPostWithContent } from "@/lib/posts";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  formattedDate: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  readingTime: string;
  path: string;
};

interface BlogPostContentProps {
  post: BlogPostWithContent;
  prevPost: BlogPost | null;
  nextPost: BlogPost | null;
  relatedPosts: BlogPost[];
}

export function BlogPostContent({
  post,
  prevPost,
  nextPost,
  relatedPosts,
}: BlogPostContentProps) {
  const t = useTranslations("BlogPostUI");
  const tc = useTranslations("Common");
  const authorInfo = resolveAuthor(post.author);
  const locale = useLocale();
  const shareUrl = `https://www.ivorysql.org${getPathname({ locale, href: post.path })}`;
  const encodedTitle = encodeURIComponent(post.title);

  return (
    <article className="bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Back Button */}
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" />
          {t("backToBlog")}
        </Link>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl">
          {/* Category Badge */}
          <span className="text-primary border-primary/20 bg-primary/5 mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {post.description}
          </p>

          {/* Meta Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* Author */}
            {authorInfo && (
              <div>
                <p className="text-foreground text-sm font-medium">
                  {authorInfo.author}
                </p>
                <p className="text-muted-foreground text-xs">
                  {authorInfo.position}
                </p>
              </div>
            )}

            {/* Date & Reading Time */}
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <time>{post.formattedDate}</time>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="prose prose-lg dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-border prose-code:text-foreground prose-code:rounded-md prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal prose-pre:border prose-pre:border-border prose-pre:bg-muted/30 max-w-none">
            <MDXRenderer content={post.content} />
          </div>

          {/* Share & Tags */}
          <div className="border-border mt-12 flex flex-wrap items-center justify-between gap-6 border-t pt-8">
            <div>
              <p className="text-muted-foreground mb-4 text-sm">
                {t("shareThisArticle")}
              </p>
              <div className="flex items-center gap-4">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodedTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Share on X"
                >
                  <Twitter className="size-5" />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(shareUrl)}&title=${encodedTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="size-5" />
                </a>
              </div>
            </div>

            {post.tags.length > 0 && (
              <div>
                <h3 className="text-foreground mb-3 text-sm font-semibold">
                  {t("tags")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-muted-foreground border-border bg-muted/30 rounded-full border px-3 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prev/Next Navigation */}
          {(prevPost || nextPost) && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {prevPost && (
                <Link
                  href={prevPost.path}
                  className="group bg-muted/30 hover:bg-muted/50 rounded-xl border-0 p-5 transition-all"
                >
                  <p className="text-muted-foreground text-xs">
                    {t("previousPost")}
                  </p>
                  <p className="text-foreground mt-1 text-sm font-medium group-hover:underline">
                    {prevPost.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {prevPost.formattedDate}
                  </p>
                </Link>
              )}
              {nextPost && (
                <Link
                  href={nextPost.path}
                  className="group bg-muted/30 hover:bg-muted/50 rounded-xl border-0 p-5 text-right transition-all sm:ml-auto sm:max-w-sm"
                >
                  <p className="text-muted-foreground text-xs">
                    {t("nextPost")}
                  </p>
                  <p className="text-foreground mt-1 text-sm font-medium group-hover:underline">
                    {nextPost.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {nextPost.formattedDate}
                  </p>
                </Link>
              )}
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="border-border mt-12 border-t pt-8">
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                {t("relatedPosts")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link key={rp.slug} href={rp.path} className="group block">
                    <div className="bg-muted/60 relative aspect-[1.91/1] overflow-hidden rounded-lg">
                      {rp.image && (
                        <Image
                          src={rp.image}
                          alt={rp.title}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <p className="text-foreground mt-2 line-clamp-2 text-sm font-medium group-hover:underline">
                      {rp.title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {rp.formattedDate}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-muted/30 mt-12 flex flex-wrap items-center justify-between gap-6 rounded-xl border-0 p-6">
            <div>
              <h3 className="text-foreground text-sm font-semibold">
                {t("tryIvorySQL")}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {t("ctaDescription")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="https://docs.ivorysql.org/"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors"
              >
                {t("readDocs")}
              </Link>
              <Link
                href="https://trial.ivorysql.org/"
                className="border-border bg-background text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors"
              >
                {tc("onlineTrial")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function resolveAuthor(authorId: string) {
  return (
    (
      authorsData as Array<{
        author_id: string;
        author: string;
        author_url: string;
        author_image_url: string;
        position: string;
      }>
    ).find((a) => a.author_id === authorId) ?? null
  );
}
