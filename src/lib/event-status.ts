type EventTiming = {
  date: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
};

// Date-only community events cover the whole calendar day in China.
export function getEventStart(event: EventTiming): Date {
  return new Date(
    event.startsAt ??
      (event.date.includes("T") ? event.date : `${event.date}T00:00:00+08:00`),
  );
}

export function getEventEnd(event: EventTiming): Date {
  const end = event.endsAt ?? event.endDate ?? event.date;
  if (end.includes("T")) return new Date(end);
  // Use the next midnight as an exclusive boundary, including the final day.
  return new Date(new Date(`${end}T00:00:00+08:00`).getTime() + 86_400_000);
}

export function getEventStatus(
  event: EventTiming,
  now: Date,
): "upcoming" | "ongoing" | "ended" {
  if (now < getEventStart(event)) return "upcoming";
  if (now >= getEventEnd(event)) return "ended";
  return "ongoing";
}
