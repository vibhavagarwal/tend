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

    await expect(interpretHabitStatement("I meditated", context, {
      baseUrl: "https://tend.example",
      token: "test-token",
      fetchImpl,
      retryDelayMs: 0,
    })).resolves.toMatchObject({ type: "logHabitEntry", habitName: "Meditation", durationMinutes: 20 });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect((capturedInit?.headers as Record<string, string>).authorization).toBe("Bearer test-token");
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

    await expect(interpretHabitStatement("I walked today", context, {
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
});
