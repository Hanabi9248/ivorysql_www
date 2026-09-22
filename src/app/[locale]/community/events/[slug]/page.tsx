import { Suspense } from "react";

import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { EventDetail } from "./EventDetail";

import { routing } from "@/i18n/routing";
import { getAllEventSlugs, getEventData, getSortedEvents } from "@/lib/events";
import { buildAlternates } from "@/lib/hreflang";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllEventSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const event = getEventData(locale, slug);
    const availableLocales = routing.locales.filter((l) =>
      getAllEventSlugs(l).includes(slug),
    );
    return {
      title: event.title,
      description: event.description,
      alternates: buildAlternates(event.path, locale, availableLocales),
      openGraph: {
        title: event.title,
        description: event.description,
        url: `https://www.ivorysql.org${event.path}`,
        type: "article",
        images: event.image
          ? [{ url: event.image }]
          : [{ url: "/og-image.jpg" }],
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description: event.description,
        images: event.image ? [event.image] : ["/og-image.jpg"],
      },
    };
  } catch {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  try {
    const event = getEventData(locale, slug);

    // Get prev/next events (sorted by date)
    const allEvents = getSortedEvents(locale);
    const currentIndex = allEvents.findIndex((e) => e.slug === slug);
    const prevEvent =
      currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null;
    const nextEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : null;

    // Get related events (same eventType, exclude current)
    const relatedEvents = getSortedEvents(locale)
      .filter((e) => e.eventType === event.eventType && e.slug !== slug)
      .slice(0, 3);

    return (
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-16">Loading...</div>
        }
      >
        <EventDetail
          event={event}
          prevEvent={prevEvent}
          nextEvent={nextEvent}
          relatedEvents={relatedEvents}
        />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
