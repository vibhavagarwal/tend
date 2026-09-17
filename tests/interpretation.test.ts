import { describe, expect, it } from "vitest";
import { interpretStatement } from "../src/domain/interpretation";

describe("Habit Statement interpretation", () => {
  const submittedAt = new Date(2026, 8, 16, 12, 0, 0);

  it("proposes a Habit without creating it", () => {
    expect(interpretStatement("I want to track meditation", [], submittedAt)).toEqual({
      type: "createHabit",
      name: "Meditation",
    });
  });

  it("proposes a duration entry for the matching Active Habit", () => {
    expect(interpretStatement("I meditated for 20 minutes yesterday", ["Meditation"], submittedAt)).toEqual({
      type: "logHabitEntry",
      habitName: "Meditation",
      durationMinutes: 20,
      activityDate: "2026-09-15",
      sourceDatePhrase: "yesterday",
      quantityAmount: null,
      quantityUnit: null,
    });
  });

  it("supports quantity entries", () => {
    expect(interpretStatement("I read 20 pages today", ["Reading"], submittedAt)).toEqual({
      type: "logHabitEntry",
      habitName: "Reading",
      durationMinutes: null,
      activityDate: "2026-09-16",
      sourceDatePhrase: "today",
      quantityAmount: 20,
      quantityUnit: "pages",
    });
  });

  it("asks for clarification when multiple habits plausibly match", () => {
    const proposal = interpretStatement("I read today", ["Reading", "Read poetry"], submittedAt);
    expect(proposal.type).toBe("clarifyHabitEntry");
  });

  it("distinguishes no match from unsupported language", () => {
    expect(interpretStatement("I meditated today", [], submittedAt)).toEqual({ type: "noMatchingActiveHabit" });
    expect(interpretStatement("hello Tend", [], submittedAt)).toEqual({ type: "unsupported" });
  });

  it("recognizes a future activity date so the UI can explain why it cannot be saved", () => {
    expect(interpretStatement("I swam for 30 minutes tomorrow", ["Swimming"], submittedAt)).toEqual({
      type: "futureActivityDate",
    });
  });

  it("proposes restoring an archived Habit before saving its activity", () => {
    expect(interpretStatement("I swam for 30 minutes today", [], submittedAt, ["Swimming"])).toEqual({
      type: "restoreAndLogHabitEntry",
      habitName: "Swimming",
      durationMinutes: 30,
      activityDate: "2026-09-16",
      sourceDatePhrase: "today",
      quantityAmount: null,
      quantityUnit: null,
    });
  });
});
