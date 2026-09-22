import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EventsClient } from "./EventsClient";

import { Link } from "@/i18n/navigation";
import { getSortedEvents } from "@/lib/events";
import { buildAlternates } from "@/lib/hreflang";
import { parseUTCDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/community/events", locale),
    openGraph: {
      title: t("heading"),
      description: t("metaDescription"),
      url: "https://www.ivorysql.org/community/events",
      images: [{ url: "/og-image.jpg" }],
    },
  };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("EventsPage");
  const allEvents = getSortedEvents(locale);

  const now = new Date();

  // Find the next upcoming event:
  // 1. First, look for events that haven't started yet (date > now)
  // 2. If none, look for ongoing events (startDate <= now <= endDate)
  // Sort upcoming by date ascending to find the closest one
  const notStartedEvents = allEvents
    .filter((e) => parseUTCDate(e.date) > now)
    .sort(
      (a, b) => parseUTCDate(a.date).getTime() - parseUTCDate(b.date).getTime(),
    );

  const ongoingEvents = allEvents.filter(
    (e) =>
      parseUTCDate(e.date) <= now &&
      e.endDate &&
      parseUTCDate(e.endDate) >= now,
  );

  const featuredEvent =
    notStartedEvents.length > 0
      ? notStartedEvents[0]
      : ongoingEvents.length > 0
        ? ongoingEvents[0]
        : null;

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

        {/* Featured Event */}
        {featuredEvent && (
          <FeaturedEvent
            event={featuredEvent}
            locale={locale}
            currentlyHappening={t("currentlyHappening")}
            nextUpcomingEvent={t("nextUpcomingEvent")}
            viewDetails={t("viewDetails")}
          />
        )}

        {/* Events Gallery with Filters */}
        <div className="mt-10">
          <EventsClient allEvents={allEvents} />
        </div>
      </div>
    </div>
  );
}

function FeaturedEvent({
  event,
  locale,
  currentlyHappening,
  nextUpcomingEvent,
  viewDetails,
}: {
  event: {
    slug: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    location: string;
    eventType: string;
    type: "Online" | "Offline";
    image: string;
    path: string;
  };
  locale: string;
  currentlyHappening: string;
  nextUpcomingEvent: string;
  viewDetails: string;
}) {
  const now = new Date();
  const startDate = parseUTCDate(event.date);
  const isOngoing =
    startDate <= now && event.endDate && parseUTCDate(event.endDate) >= now;
  const statusLabel = isOngoing ? currentlyHappening : nextUpcomingEvent;

  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const formattedDate = startDate.toLocaleDateString(dateLocale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const formattedEndDate = event.endDate
    ? parseUTCDate(event.endDate).toLocaleDateString(dateLocale, {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <Link
      href={event.path}
      className="group bg-primary/10 hover:bg-primary/15 block w-full rounded-2xl border-0 p-6 transition-all lg:p-8"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
            {event.eventType}
          </span>
          <span className="text-muted-foreground text-sm">{statusLabel}</span>
        </div>
        <h2 className="text-foreground text-xl font-semibold md:text-2xl lg:text-3xl">
          {event.title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          {event.description}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <svg
              className="size-4"
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
            {formattedEndDate && ` \u2192 ${formattedEndDate}`}
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="size-4"
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
          </div>
        </div>
        <div className="text-primary mt-1 flex items-center gap-1 text-sm font-medium">
          {viewDetails}
          <svg
            className="size-4 transition-transform group-hover:translate-x-1"
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
