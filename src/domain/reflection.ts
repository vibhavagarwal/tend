import { Habit, TendData } from "./types";

export type ReflectionCount = { habit: Habit; count: number };

const isoDate = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

export function currentWeekRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: isoDate(start), end: isoDate(end) };
}

export function reflectionCounts(data: TendData, range?: { start: string; end: string }): ReflectionCount[] {
  const counts = new Map<string, number>();
  for (const entry of data.entries) {
    if (!range || (entry.activityDate >= range.start && entry.activityDate <= range.end)) {
      counts.set(entry.habitId, (counts.get(entry.habitId) ?? 0) + 1);
    }
  }
  return data.habits
    .filter((habit) => (counts.get(habit.id) ?? 0) > 0)
    .sort((a, b) => Number(a.archivedAt !== null) - Number(b.archivedAt !== null) || a.name.localeCompare(b.name))
    .map((habit) => ({ habit, count: counts.get(habit.id)! }));
}
