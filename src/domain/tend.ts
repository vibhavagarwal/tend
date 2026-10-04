import {
  Habit,
  HabitEntry,
  InterpretationProposal,
  TendData,
  ValidatedHabitEntry,
} from "./types";

export type Services = {
  now?: () => number;
  id?: () => string;
};

const defaultId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalize = (value: string) => value.trim().toLocaleLowerCase();

/**
 * Validates an ISO calendar date without allowing JavaScript's Date constructor
 * to normalize overflow (for example, 2026-13-01 into the following January).
 */
export function isRealLocalCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return day <= daysInMonth;
}

export const activeHabits = (data: TendData) => data.habits.filter((habit) => habit.archivedAt === null);
export const archivedHabits = (data: TendData) => data.habits.filter((habit) => habit.archivedAt !== null);

export type DataChangeResult =
  | { ok: true; data: TendData }
  | { ok: false; message: string };

export function attemptDataChange(data: TendData, change: (current: TendData) => TendData): DataChangeResult {
  try {
    return { ok: true, data: change(data) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Tend couldn't save that.",
    };
  }
}

export function createHabit(data: TendData, proposedName: string, services: Services = {}): TendData {
  const name = proposedName.trim();
  if (!name) throw new Error("A Habit name is required.");
  if (name.length > 50) throw new Error("A Habit name must be 50 characters or fewer.");
  if (data.habits.some((habit) => normalize(habit.name) === normalize(name))) {
    throw new Error("A Habit with that name already exists.");
  }
  const habit: Habit = {
    id: (services.id ?? defaultId)(),
    name,
    createdAt: (services.now ?? Date.now)(),
    archivedAt: null,
  };
  return { ...data, habits: [...data.habits, habit] };
}

export function archiveHabit(data: TendData, habitId: string, now = Date.now()): TendData {
  let changed = false;
  const habits = data.habits.map((habit) => {
    if (habit.id !== habitId || habit.archivedAt !== null) return habit;
    changed = true;
    return { ...habit, archivedAt: now };
  });
  if (!changed) throw new Error("Only an Active Habit can be archived.");
  return { ...data, habits };
}

export function restoreHabit(data: TendData, habitId: string): TendData {
  let changed = false;
  const habits = data.habits.map((habit) => {
    if (habit.id !== habitId || habit.archivedAt === null) return habit;
    changed = true;
    return { ...habit, archivedAt: null };
  });
  if (!changed) throw new Error("Only an Archived Habit can be restored.");
  return { ...data, habits };
}

export function validateEntryProposal(data: TendData, proposal: Extract<InterpretationProposal, { type: "logHabitEntry" }>): ValidatedHabitEntry {
  const habit = activeHabits(data).find((item) => normalize(item.name) === normalize(proposal.habitName));
  if (!habit) throw new Error("No matching Active Habit was found.");
  if (proposal.durationMinutes !== null && proposal.durationMinutes <= 0) {
    throw new Error("Habit Entry duration must be positive when supplied.");
  }
  if (!isRealLocalCalendarDate(proposal.activityDate)) {
    throw new Error("Habit Entry Activity Date must be a real local date in YYYY-MM-DD form.");
  }
  if ((proposal.quantityAmount === null) !== (proposal.quantityUnit === null)) {
    throw new Error("Habit Entry quantity and unit must be supplied together.");
  }
  if (proposal.quantityAmount !== null && proposal.quantityAmount <= 0) {
    throw new Error("Habit Entry quantity must be positive when supplied.");
  }
  return {
    habitId: habit.id,
    habitName: habit.name,
    activityDate: proposal.activityDate,
    durationMinutes: proposal.durationMinutes,
    quantityAmount: proposal.quantityAmount,
    quantityUnit: proposal.quantityUnit?.trim() ?? null,
  };
}

export function findDuplicate(data: TendData, candidate: ValidatedHabitEntry): HabitEntry | null {
  return data.entries.find((entry) =>
    entry.habitId === candidate.habitId &&
    entry.activityDate === candidate.activityDate &&
    entry.durationMinutes === candidate.durationMinutes &&
    entry.quantityAmount === candidate.quantityAmount &&
    entry.quantityUnit === candidate.quantityUnit
  ) ?? null;
}

export function saveHabitEntry(data: TendData, candidate: ValidatedHabitEntry, services: Services = {}): TendData {
  const entry: HabitEntry = {
    id: (services.id ?? defaultId)(),
    habitId: candidate.habitId,
    activityDate: candidate.activityDate,
    durationMinutes: candidate.durationMinutes,
    quantityAmount: candidate.quantityAmount,
    quantityUnit: candidate.quantityUnit,
    createdAt: (services.now ?? Date.now)(),
  };
  return { ...data, entries: [entry, ...data.entries] };
}

export function deleteHabitEntry(data: TendData, entryId: string): TendData {
  const entries = data.entries.filter((entry) => entry.id !== entryId);
  if (entries.length === data.entries.length) throw new Error("Habit Entry could not be deleted.");
  return { ...data, entries };
}
