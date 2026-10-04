import { describe, expect, it, vi } from "vitest";
import { interpretHabitStatement, parseGatewayProposal } from "../src/domain/interpreter";

const context = {
  activeHabitNames: ["Meditation", "Reading"],
  submittedAt: new Date("2026-09-16T16:00:00.000Z"),
  timeZone: "America/New_York",
};

describe("optional interpretation gateway", () => {
  it("keeps deterministic local interpretation when no gateway is configured", async () => {
    await expect(interpretHabitStatement("I want to track walking", context, { baseUrl: "" }))
      .resolves.toEqual({ type: "createHabit", name: "Walking" });
  });

  it("clarifies locally understood ambiguous entries without calling a configured gateway", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(interpretHabitStatement("I read for 20 minutes yesterday", {
      ...context,
      activeHabitNames: ["Reading", "Poetry Reading"],
    }, {
      baseUrl: "https://tend.example",
      fetchImpl,
      retryDelayMs: 0,
    })).resolves.toEqual({
      type: "clarifyHabitEntry",
      candidateHabitNames: ["Reading", "Poetry Reading"],
      durationMinutes: 20,
      activityDate: "2026-09-15",
      sourceDatePhrase: "yesterday",
      quantityAmount: null,
      quantityUnit: null,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a validated gateway response to the Tend proposal model", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      capturedInit = init;
      return new Response(JSON.stringify({
        type: "log_habit_entry",
        habit_name: "Meditation",
        duration_minutes: 20,
        quantity_amount: null,
        quantity_unit: null,
        activity_date: "2026-09-16",
        candidate_habit_names: [],
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const fetchImpl = fetchMock as unknown as typeof fetch;

    await expect(interpretHabitStatement("I completed a mindful sit", context, {
      baseUrl: "https://tend.example",
      fetchImpl,
      retryDelayMs: 0,
    })).resolves.toMatchObject({ type: "logHabitEntry", habitName: "Meditation", durationMinutes: 20 });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(capturedInit?.headers).toEqual({ "content-type": "application/json" });
  });

  it("retries transient gateway failures and reports waking progress", async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      return calls < 3
        ? new Response("temporary", { status: 503 })
        : new Response(JSON.stringify({ type: "no_matching_active_habit" }), { status: 200 });
    }) as unknown as typeof fetch;
    const onWaking = vi.fn();

    await expect(interpretHabitStatement("I took a neighborhood walk", context, {
      baseUrl: "https://tend.example",
      fetchImpl,
      onWaking,
      retryDelayMs: 0,
    })).resolves.toEqual({ type: "noMatchingActiveHabit" });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(onWaking).toHaveBeenCalledTimes(2);
  });

  it("rejects gateway proposals that name a non-active Habit", () => {
    expect(() => parseGatewayProposal({
      type: "log_habit_entry",
      habit_name: "Archived Habit",
      duration_minutes: null,
      quantity_amount: null,
      quantity_unit: null,
      activity_date: "2026-09-16",
    }, context.activeHabitNames)).toThrow("Active Habit");
  });

  it("keeps a locally understood ambiguous statement on-device for clarification", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      type: "clarify_habit_entry",
      candidate_habit_names: ["Meditation", "Reading"],
      duration_minutes: null,
      quantity_amount: null,
      quantity_unit: null,
      activity_date: "2026-09-16",
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(interpretHabitStatement("I read today", {
      ...context,
      activeHabitNames: ["Reading", "Read poetry"],
    }, {
      baseUrl: "https://tend.example",
      fetchImpl,
      retryDelayMs: 0,
    })).resolves.toMatchObject({ type: "clarifyHabitEntry", candidateHabitNames: ["Reading", "Read poetry"] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an overflow gateway Activity Date instead of allowing Date normalization", () => {
    expect(() => parseGatewayProposal({
      type: "log_habit_entry", habit_name: "Meditation", duration_minutes: null,
      quantity_amount: null, quantity_unit: null, activity_date: "2026-13-01",
    }, context.activeHabitNames)).toThrow("valid Activity Date");
  });
});
