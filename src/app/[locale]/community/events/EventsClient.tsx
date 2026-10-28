"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { getEventStatus } from "@/lib/event-status";
import { cn, parseUTCDate } from "@/lib/utils";

type IvoryEvent = {
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

interface EventsClientProps {
  allEvents: IvoryEvent[];
}

export function EventsClient({ allEvents }: EventsClientProps) {
  const locale = useLocale();
  const t = useTranslations("EventsUI");
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(allEvents.map((e) => e.eventType));
    return ["all", ...Array.from(cats).sort()];
  }, [allEvents]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEvents.length };
    for (const e of allEvents) {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1;
    }
    return counts;
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    let events = allEvents;

    if (activeCategory !== "all") {
      events = events.filter((e) => e.eventType === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.location.toLowerCase().includes(term),
      );
    }

    return events;
  }, [allEvents, activeCategory, searchTerm]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, IvoryEvent[]>();

    for (const event of filteredEvents) {
      const date = parseUTCDate(event.date);
      const groupKey = date.toLocaleDateString(dateLocale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(event);
    }

    return groups;
  }, [filteredEvents, dateLocale]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sticky Filters Sidebar */}
      <aside className="lg:sticky lg:top-20 lg:w-[280px] lg:shrink-0">
        <div className="space-y-6">
          {/* Search */}
          <div>
            <div className="relative w-full">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0Z"
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

          {/* Category Badges */}
          <div>
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
              {t("eventType")}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    cat === activeCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {cat === "all" ? t("all") : cat}{" "}
                  <span className="opacity-60">
                    ({categoryCounts[cat] || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="text-muted-foreground text-sm">
            {t("showingCount", {
              shown: filteredEvents.length,
              total: allEvents.length,
            })}
          </div>
        </div>
      </aside>

      {/* Events Timeline */}
      <div className="min-w-0 flex-1">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="text-muted-foreground mx-auto mb-4 size-12 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <p className="text-muted-foreground text-lg">{t("noResults")}</p>
          </div>
        ) : (
          <div className="relative space-y-8">
            {/* Vertical timeline line */}
            <div className="before:bg-border absolute top-0 bottom-0 left-[7px] w-px before:absolute before:inset-0 before:w-full" />

            {Array.from(groupedEvents.entries()).map(([dateGroup, events]) => (
              <div key={dateGroup} className="relative">
                {/* Date header with timeline dot */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-primary ring-background relative z-10 size-3.5 shrink-0 rounded-full ring-4" />
                  <h3 className="text-foreground text-sm font-semibold">
                    {dateGroup}
                  </h3>
                </div>

                {/* Event cards */}
                <div className="ml-[27px] space-y-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.slug}
                      event={event}
                      now={now}
                      dateLocale={dateLocale}
                      statusLabels={{
                        ended: t("statusEnded"),
                        upcoming: t("statusUpcoming"),
                        ongoing: t("statusOngoing"),
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  now,
  dateLocale,
  statusLabels,
}: {
  event: IvoryEvent;
  now: Date | null;
  dateLocale: string;
  statusLabels: { ended: string; upcoming: string; ongoing: string };
}) {
  const startDate = parseUTCDate(event.date);
  const endDate = event.endDate ? parseUTCDate(event.endDate) : startDate;

  const state = now ? getEventStatus(event, now) : null;
  let status: { label: string; color: string; bg: string } = {
    label: statusLabels.ended,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  };
  if (state === "upcoming") {
    status = {
      label: statusLabels.upcoming,
      color: "text-primary",
      bg: "bg-primary/10",
    };
  } else if (state === "ongoing") {
    status = {
      label: statusLabels.ongoing,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    };
  }

  const formattedDate = startDate.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const formattedEndDate =
    event.endDate && event.endDate !== event.date
      ? " \u2192 " +
        endDate.toLocaleDateString(dateLocale, {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : "";

  return (
    <Link
      href={event.path}
      className="group bg-muted/20 hover:bg-muted/40 flex gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="bg-muted/60 relative hidden w-28 shrink-0 self-start overflow-hidden rounded-lg sm:block md:w-36">
        <div className="aspect-[16/10]">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="144px"
              className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center">
              <svg
                className="size-6 opacity-20"
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
      </div>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-foreground line-clamp-1 text-base font-semibold group-hover:underline">
              {event.title}
            </h4>
            {now ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  status.bg,
                  status.color,
                )}
              >
                {status.label}
              </span>
            ) : null}
          </div>

          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
            {event.description}
          </p>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
              {formattedEndDate}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    event.type === "Online"
                      ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      : "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  }
                />
              </svg>
              {event.type}
            </span>
          </div>
        </div>

        {/* Event type badge */}
        <span className="text-muted-foreground border-border shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">
          {event.eventType}
        </span>
      </div>
    </Link>
  );
}
