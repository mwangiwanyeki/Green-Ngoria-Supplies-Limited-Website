/** Shared date helpers for the HR module. */

/** Midnight (local) of the given day — matches how `workDate` is stored. */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Midnight (local) today. */
export function startOfToday(): Date {
  return startOfDay(new Date());
}

/** Whole calendar days covered by an inclusive date range (minimum 1). */
export function inclusiveDays(start: Date, end: Date): number {
  const from = startOfDay(start).getTime();
  const to = startOfDay(end).getTime();
  return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
}
