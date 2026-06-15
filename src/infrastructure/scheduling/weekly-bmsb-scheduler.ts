const TIME_ZONE = "Europe/Madrid";
const TARGET_WEEKDAY = "Mon";
const TARGET_HOUR = 10;
const MINUTE_IN_MILLISECONDS = 60_000;
const SEARCH_WINDOW_MINUTES = 8 * 24 * 60;

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
});

export interface WeeklyBmsbSchedule {
  stop(): void;
}

export function startWeeklyBmsbSchedule(sendChart: () => Promise<void>): WeeklyBmsbSchedule {
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  const scheduleNext = (after: Date): void => {
    const nextRunAt = findNextMadridMondayAt10(after);
    const delay = Math.max(0, nextRunAt.getTime() - Date.now());

    console.log("Weekly BMSB chart scheduled", {
      nextRunAt: nextRunAt.toISOString(),
      timeZone: TIME_ZONE,
    });

    timer = setTimeout(() => {
      void sendChart()
        .catch((error: unknown) => {
          console.error("Weekly BMSB chart delivery failed", error);
        })
        .finally(() => {
          if (!stopped) {
            scheduleNext(new Date(nextRunAt.getTime() + MINUTE_IN_MILLISECONDS));
          }
        });
    }, delay);
  };

  scheduleNext(new Date());

  return {
    stop() {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}

export function findNextMadridMondayAt10(after: Date): Date {
  const rounded = Math.ceil(after.getTime() / MINUTE_IN_MILLISECONDS) * MINUTE_IN_MILLISECONDS;

  for (let offset = 0; offset < SEARCH_WINDOW_MINUTES; offset += 1) {
    const candidate = new Date(rounded + offset * MINUTE_IN_MILLISECONDS);
    const parts = getZonedParts(candidate);

    if (parts.weekday === TARGET_WEEKDAY && parts.hour === TARGET_HOUR && parts.minute === 0) {
      return candidate;
    }
  }

  throw new Error(`Unable to find the next Monday at 10:00 in ${TIME_ZONE}`);
}

function getZonedParts(date: Date): { weekday: string; hour: number; minute: number } {
  const values = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    weekday: values.weekday ?? "",
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}
