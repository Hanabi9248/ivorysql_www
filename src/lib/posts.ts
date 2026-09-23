import fs from "fs";
import matter from "gray-matter";
import path from "path";

function postsDirectory(locale: string): string {
  return path.join(process.cwd(), "content/blog", locale);
}

export type BlogPost = {
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

export type BlogPostWithContent = BlogPost & {
  content: string;
};

export function getAllPostSlugs(locale: string): string[] {
  const dir = postsDirectory(locale);
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

export function getPostdata(locale: string, slug: string): BlogPostWithContent {
  const dir = postsDirectory(locale);
  const directories = fs.readdirSync(dir);
  const dirName = directories.find((d) => {
    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) return false;
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);
    return (data.slug as string) === slug || d === slug;
  });

  if (!dirName) {
    throw new Error(`Post not found: ${slug}`);
  }

  const filePath = path.join(dir, dirName, "index.mdx");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const readingTime = generateReadingTime(content, locale);
  const date = (data.date as string) || parseDateFromFilename(dirName);

  return {
    slug: (data.slug as string) || slug,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    date,
    formattedDate: formatDate(date, locale),
    author: (data.author as string) || "official",
    category: (data.category as string) || "IvorySQL",
    tags: (data.tags as string[]) || [],
    image: (data.image as string) || "",
    readingTime,
    path: `/blog/${data.slug || slug}`,
    content,
  };
}

export function getSortedPosts(
  locale: string,
  {
    limit,
    tags,
    currentPostSlug,
  }: {
    limit?: number;
    tags?: string[];
    currentPostSlug?: string;
  } = {},
): BlogPost[] {
  const dir = postsDirectory(locale);
  if (!fs.existsSync(dir)) return [];

  const directories = fs.readdirSync(dir);
  const posts: BlogPost[] = [];

  for (const d of directories) {
    if (d.startsWith(".") || !fs.statSync(path.join(dir, d)).isDirectory())
      continue;

    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) continue;

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (currentPostSlug && (data.slug as string) === currentPostSlug) continue;

    if (tags && tags.length > 0) {
      const postTags = (data.tags as string[]) || [];
      if (!tags.some((t) => postTags.includes(t))) continue;
    }

    const readingTime = generateReadingTime(content, locale);
    const date = (data.date as string) || parseDateFromFilename(d);

    posts.push({
      slug: (data.slug as string) || d,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      date,
      formattedDate: formatDate(date, locale),
      author: (data.author as string) || "official",
      category: (data.category as string) || "IvorySQL",
      tags: (data.tags as string[]) || [],
      image: (data.image as string) || "",
      readingTime,
      path: `/blog/${data.slug || d}`,
    });
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (limit) {
    return posts.slice(0, limit);
  }

  return posts;
}

export function getAllCategories(locale: string): string[] {
  const posts = getSortedPosts(locale);
  const categories = new Set(posts.map((p) => p.category));
  return Array.from(categories).sort();
}

function parseDateFromFilename(dirName: string): string {
  const match = dirName.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-/);
  return match
    ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
    : "2024-01-01";
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

function generateReadingTime(content: string, locale: string): string {
  if (locale === "zh") {
    const charsPerMinute = 400;
    const charCount = content.replace(/\s+/g, "").length;
    const minutes = Math.max(1, Math.ceil(charCount / charsPerMinute));
    return `${minutes} 分钟阅读`;
  }
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
