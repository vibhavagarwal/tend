import { describe, expect, it } from "vitest";
import {
  activeHabits,
  attemptDataChange,
  archiveHabit,
  createHabit,
  deleteHabitEntry,
  findDuplicate,
  restoreHabit,
  saveHabitEntry,
  validateEntryProposal,
} from "../src/domain/tend";
import { emptyTendData } from "../src/domain/types";

const services = { id: () => "habit-1", now: () => 100 };

describe("Tend domain and Entry Safety", () => {
  it("does not mutate persistence merely because interpretation proposed a Habit", () => {
    const initial = emptyTendData();
    expect(initial.habits).toHaveLength(0);
    expect(initial.entries).toHaveLength(0);
  });

  it("creates, archives, and restores a Habit only through explicit domain actions", () => {
    const created = createHabit(emptyTendData(), "Meditation", services);
    expect(activeHabits(created).map((habit) => habit.name)).toEqual(["Meditation"]);
    const archived = archiveHabit(created, "habit-1", 200);
    expect(activeHabits(archived)).toHaveLength(0);
    const restored = restoreHabit(archived, "habit-1");
    expect(activeHabits(restored)).toHaveLength(1);
  });

  it("rejects duplicate Habit names regardless of case", () => {
    const created = createHabit(emptyTendData(), "Meditation", services);
    expect(() => createHabit(created, "meditation")).toThrow("already exists");
  });

  it("turns an expected domain rejection into a UI-safe result", () => {
    const created = createHabit(emptyTendData(), "Meditation", services);
    expect(attemptDataChange(created, (current) => createHabit(current, "meditation", services))).toEqual({
      ok: false,
      message: "A Habit with that name already exists.",
    });
  });

  it("validates, saves, detects duplicates, and deletes Habit Entries", () => {
    const created = createHabit(emptyTendData(), "Meditation", services);
    const candidate = validateEntryProposal(created, {
      type: "logHabitEntry",
      habitName: "Meditation",
      durationMinutes: 10,
      activityDate: "2026-09-16",
      quantityAmount: null,
      quantityUnit: null,
    });
    expect(findDuplicate(created, candidate)).toBeNull();
    const saved = saveHabitEntry(created, candidate, { id: () => "entry-1", now: () => 300 });
    expect(findDuplicate(saved, candidate)?.id).toBe("entry-1");
    expect(deleteHabitEntry(saved, "entry-1").entries).toHaveLength(0);
  });

  it("keeps archived Habit history while excluding it from new entry matching", () => {
    const created = createHabit(emptyTendData(), "Meditation", services);
    const archived = archiveHabit(created, "habit-1", 200);
    expect(() => validateEntryProposal(archived, {
      type: "logHabitEntry",
      habitName: "Meditation",
      durationMinutes: null,
      activityDate: "2026-09-16",
      quantityAmount: null,
      quantityUnit: null,
    })).toThrow("No matching Active Habit");
  });

  it("rejects invalid corrections before a Habit Entry can be saved", () => {
    const data = createHabit(emptyTendData(), "Meditation", services);
    expect(() => validateEntryProposal(data, {
      type: "logHabitEntry", habitName: "Meditation", durationMinutes: null,
      activityDate: "not-a-date", quantityAmount: null, quantityUnit: null,
    })).toThrow("real local date");
  });

  it.each(["2026-13-01", "2026-00-01", "2026-02-29", "2025-04-31", "2026-01-00"]) (
    "rejects the non-existent Activity Date %s without normalizing it",
    (activityDate) => {
      const data = createHabit(emptyTendData(), "Meditation", services);
      expect(() => validateEntryProposal(data, {
        type: "logHabitEntry", habitName: "Meditation", durationMinutes: null,
        activityDate, quantityAmount: null, quantityUnit: null,
      })).toThrow("real local date");
    },
  );

  it.each(["2024-02-29", "2026-12-31", "2026-04-30"]) ("accepts the real Activity Date %s", (activityDate) => {
    const data = createHabit(emptyTendData(), "Meditation", services);
    expect(validateEntryProposal(data, {
      type: "logHabitEntry", habitName: "Meditation", durationMinutes: null,
      activityDate, quantityAmount: null, quantityUnit: null,
    }).activityDate).toBe(activityDate);
  });
});
