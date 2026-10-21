import fs from "fs";
import matter from "gray-matter";
import path from "path";

function eventsDirectory(locale: string): string {
  return path.join(process.cwd(), "content/events", locale);
}

export type IvoryEvent = {
  slug: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
  location: string;
  eventType: string;
  type: "Online" | "Offline";
  image: string;
  path: string;
};

export type IvoryEventWithContent = IvoryEvent & { content: string };

export function getAllEventSlugs(locale: string): string[] {
  const dir = eventsDirectory(locale);
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

export function getEventData(
  locale: string,
  slug: string,
): IvoryEventWithContent {
  const dir = eventsDirectory(locale);
  const directories = fs.readdirSync(dir);
  const dirName = directories.find((d) => {
    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) return false;
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);
    return (data.slug as string) === slug || d === slug;
  });

  if (!dirName) {
    throw new Error(`Event not found: ${slug}`);
  }

  const filePath = path.join(dir, dirName, "index.mdx");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug: (data.slug as string) || slug,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    date: (data.date as string) || "",
    endDate: data.endDate as string | undefined,
    startsAt: data.startsAt as string | undefined,
    endsAt: data.endsAt as string | undefined,
    location: (data.location as string) || "",
    eventType: (data.eventType as string) || "Conference",
    type: (data.type as "Online" | "Offline") || "Offline",
    image: (data.image as string) || "",
    path: `/community/events/${data.slug || slug}`,
    content,
  };
}

export function getSortedEvents(
  locale: string,
  {
    limit,
    eventType,
    currentEventSlug,
  }: {
    limit?: number;
    eventType?: string;
    currentEventSlug?: string;
  } = {},
): IvoryEvent[] {
  const dir = eventsDirectory(locale);
  if (!fs.existsSync(dir)) return [];

  const directories = fs.readdirSync(dir);
  const events: IvoryEvent[] = [];

  for (const d of directories) {
    if (d.startsWith(".") || !fs.statSync(path.join(dir, d)).isDirectory())
      continue;

    const filePath = path.join(dir, d, "index.mdx");
    if (!fs.existsSync(filePath)) continue;

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    if (currentEventSlug && (data.slug as string) === currentEventSlug)
      continue;

    if (eventType && data.eventType !== eventType) continue;

    events.push({
      slug: (data.slug as string) || d,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      date: (data.date as string) || "",
      endDate: data.endDate as string | undefined,
      startsAt: data.startsAt as string | undefined,
      endsAt: data.endsAt as string | undefined,
      location: (data.location as string) || "",
      eventType: (data.eventType as string) || "Conference",
      type: (data.type as "Online" | "Offline") || "Offline",
      image: (data.image as string) || "",
      path: `/community/events/${data.slug || d}`,
    });
  }

  events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (limit) {
    return events.slice(0, limit);
  }

  return events;
}

export function getAllEventTypes(locale: string): string[] {
  const events = getSortedEvents(locale);
  const types = new Set(events.map((e) => e.eventType));
  return Array.from(types).sort();
}
