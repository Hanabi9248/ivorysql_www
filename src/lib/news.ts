import fs from "fs";
import matter from "gray-matter";
import path from "path";

function newsDirectory(locale: string): string {
  return path.join(process.cwd(), "content/news", locale);
}

export type NewsItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  formattedDate: string;
  category: string;
  categoryLabel: string;
  image: string;
  path: string;
};

export type NewsItemWithContent = NewsItem & { content: string };

export function getAllNewsSlugs(locale: string): string[] {
  const dir = newsDirectory(locale);
  if (!fs.existsSync(dir)) return [];
  const directories = fs.readdirSync(dir);
  return directories
    .filter(
      (d) => !d.startsWith(".") && fs.statSync(path.join(dir, d)).isDirectory(),
    )
    .map((d) => {
      const filePath = path.join(dir, d, "index.mdx");
      if (!fs.existsSync(filePath)) return null;
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContents);
      return (data.slug as string) || d;
    })
    .filter(Boolean) as string[];
}

export function getNewsItem(locale: string, slug: string): NewsItemWithContent {
  const dir = newsDirectory(locale);
  const directories = fs.readdirSync(dir);
  const dirName = directories.find((d) => {
    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) return false;
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);
    return (data.slug as string) === slug || d === slug;
  });

  if (!dirName) {
    throw new Error(`News item not found: ${slug}`);
  }

  const filePath = path.join(dir, dirName, "index.mdx");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug: (data.slug as string) || slug,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    date: (data.date as string) || "",
    formattedDate: formatDate(data.date as string, locale),
    category: (data.category as string) || "community",
    categoryLabel: (data.categoryLabel as string) || "Community",
    image: (data.image as string) || "",
    path: `/news/${data.slug || slug}`,
    content,
  };
}

export function getSortedNews(
  locale: string,
  {
    limit,
    category,
    currentNewsSlug,
  }: {
    limit?: number;
    category?: string;
    currentNewsSlug?: string;
  } = {},
): NewsItem[] {
  const dir = newsDirectory(locale);
  if (!fs.existsSync(dir)) return [];

  const directories = fs.readdirSync(dir);
  const items: NewsItem[] = [];

  for (const d of directories) {
    if (d.startsWith(".") || !fs.statSync(path.join(dir, d)).isDirectory())
      continue;

    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) continue;

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    if (currentNewsSlug && (data.slug as string) === currentNewsSlug) continue;

    if (
      category &&
      category !== "all" &&
      (data.category as string) !== category
    )
      continue;

    items.push({
      slug: (data.slug as string) || d,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      date: (data.date as string) || "",
      formattedDate: formatDate(data.date as string, locale),
      category: (data.category as string) || "community",
      categoryLabel: (data.categoryLabel as string) || "Community",
      image: (data.image as string) || "",
      path: `/news/${data.slug || d}`,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (limit) {
    return items.slice(0, limit);
  }

  return items;
}

export function getAllNewsCategories(
  locale: string,
): { key: string; label: string }[] {
  const items = getSortedNews(locale);
  const categoryMap = new Map<string, string>();
  for (const item of items) {
    categoryMap.set(item.category, item.categoryLabel);
  }
  return Array.from(categoryMap.entries()).map(([key, label]) => ({
    key,
    label,
  }));
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  if (locale === "zh") {
    return date.toLocaleDateString("zh-CN", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
