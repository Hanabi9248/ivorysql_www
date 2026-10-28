"use client";

import { useMemo, useState } from "react";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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

interface BlogClientProps {
  initialPosts: BlogPost[];
  allPosts: BlogPost[];
}

export function BlogClient({ initialPosts, allPosts }: BlogClientProps) {
  const t = useTranslations("BlogUI");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(allPosts.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    let posts = initialPosts;

    if (activeCategory !== "all") {
      posts = posts.filter((p) => p.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }

    return posts;
  }, [initialPosts, activeCategory, searchTerm]);

  return (
    <div>
      {/* Filters Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                cat === activeCategory ||
                  (cat === "all" && activeCategory === "all")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat === "all" ? t("all") : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Post Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-lg">
            {searchTerm ? t("noResultsSearch") : t("noResultsCategory")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={post.path}
      className="group bg-muted/30 hover:bg-muted/50 flex flex-col rounded-xl border-0 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Image */}
      <div className="bg-muted/60 relative mb-4 aspect-[1.91/1] overflow-hidden rounded-lg">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <svg
              className="size-10 opacity-20"
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

      {/* Meta */}
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <time>{post.formattedDate}</time>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>

      {/* Title */}
      <h3 className="text-foreground line-clamp-2 text-lg leading-snug font-semibold group-hover:underline">
        {post.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
        {post.description}
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-foreground text-xs font-medium">
          {resolveAuthorName(post.author)}
        </span>
        <span className="text-muted-foreground border-border rounded-full border px-2.5 py-0.5 text-xs">
          {post.category}
        </span>
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
