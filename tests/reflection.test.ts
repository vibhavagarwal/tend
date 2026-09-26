import { describe, expect, it } from "vitest";
import { nextAcknowledgment, acknowledgments } from "../src/domain/acknowledgment";
import { currentWeekRange, recentActivities, RECENT_ACTIVITY_LIMIT, reflectionCounts } from "../src/domain/reflection";
import { emptyTendData } from "../src/domain/types";

describe("Reflection", () => {
  it("uses a local Monday through Sunday Activity Date range", () => {
    expect(currentWeekRange(new Date(2026, 8, 16))).toEqual({ start: "2026-09-14", end: "2026-09-20" });
  });

  it("counts saved entries, lists active habits first, and retains archived history", () => {
    const data = {
      ...emptyTendData(),
      habits: [
        { id: "a", name: "Reading", createdAt: 1, archivedAt: null },
        { id: "b", name: "Meditation", createdAt: 1, archivedAt: 2 },
      ],
      entries: [
        { id: "1", habitId: "b", activityDate: "2026-09-14", durationMinutes: null, quantityAmount: null, quantityUnit: null, createdAt: 1 },
        { id: "2", habitId: "a", activityDate: "2026-09-15", durationMinutes: null, quantityAmount: null, quantityUnit: null, createdAt: 1 },
        { id: "3", habitId: "a", activityDate: "2026-09-15", durationMinutes: null, quantityAmount: null, quantityUnit: null, createdAt: 1 },
      ],
    };
    expect(reflectionCounts(data).map(({ habit, count }) => [habit.name, count])).toEqual([["Reading", 2], ["Meditation", 1]]);
    expect(reflectionCounts(data, { start: "2026-09-15", end: "2026-09-20" }).map(({ habit, count }) => [habit.name, count])).toEqual([["Reading", 2]]);
  });

  it("limits the Track-screen activity feed to the five most recent saved entries", () => {
    const data = {
      ...emptyTendData(),
      entries: Array.from({ length: 6 }, (_, index) => ({
        id: `${index + 1}`,
        habitId: "habit",
        activityDate: "2026-09-16",
        durationMinutes: null,
        quantityAmount: null,
        quantityUnit: null,
        createdAt: 6 - index,
      })),
    };
    expect(recentActivities(data).map((entry) => entry.id)).toEqual(["1", "2", "3", "4", "5"]);
    expect(recentActivities(data)).toHaveLength(RECENT_ACTIVITY_LIMIT);
  });
});

describe("Post-Achievement Acknowledgment", () => {
  it("rotates deterministically and persists its cursor", () => {
    let data = emptyTendData();
    const received: string[] = [];
    for (let index = 0; index < acknowledgments.length + 1; index += 1) {
      const next = nextAcknowledgment(data);
      received.push(next.message);
      data = next.data;
    }
    expect(received.slice(0, acknowledgments.length)).toEqual(acknowledgments);
    expect(received.at(-1)).toBe(acknowledgments[0]);
  });
});
