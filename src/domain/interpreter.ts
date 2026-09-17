import { interpretStatement } from "./interpretation";
import { InterpretationProposal } from "./types";

type InterpretationContext = {
  activeHabitNames: string[];
  archivedHabitNames?: string[];
  submittedAt: Date;
  timeZone: string;
};

type GatewayOptions = {
  baseUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
  onWaking?: () => void;
  retryDelayMs?: number;
};

type GatewayJson = Record<string, unknown>;

const configuredBaseUrl = process.env.EXPO_PUBLIC_TEND_INTERPRETATION_GATEWAY_URL?.trim();
const configuredToken = process.env.EXPO_PUBLIC_TEND_GATEWAY_TOKEN?.trim();

export async function interpretHabitStatement(
  statement: string,
  context: InterpretationContext,
  options: GatewayOptions = {},
): Promise<InterpretationProposal> {
  const localProposal = interpretStatement(
    statement,
    context.activeHabitNames,
    context.submittedAt,
    context.archivedHabitNames ?? [],
  );
  const baseUrl = options.baseUrl ?? configuredBaseUrl;
  if (!baseUrl || localProposal.type === "futureActivityDate" || localProposal.type === "restoreAndLogHabitEntry") {
    return localProposal;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const token = options.token ?? configuredToken;
  const response = await requestWithRetry(
    `${baseUrl.replace(/\/$/, "")}/interpret`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        statement,
        active_habit_names: context.activeHabitNames,
        submitted_at: context.submittedAt.toISOString(),
        time_zone: context.timeZone,
      }),
    },
    fetchImpl,
    options.onWaking,
    options.retryDelayMs ?? 1_000,
  );
  return parseGatewayProposal(await response.json(), context.activeHabitNames);
}

async function requestWithRetry(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  onWaking: (() => void) | undefined,
  retryDelayMs: number,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      if (response.ok) return response;
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      if (!retryable) throw new Error(`Interpretation gateway rejected the request (${response.status}).`);
      lastError = new Error(`Interpretation gateway is temporarily unavailable (${response.status}).`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.includes("rejected the request")) throw error;
    }
    if (attempt < 2) {
      onWaking?.();
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Interpretation gateway is unavailable.");
}

export function parseGatewayProposal(value: unknown, activeHabitNames: string[]): InterpretationProposal {
  if (!value || typeof value !== "object") throw new Error("The interpretation response was invalid.");
  const json = value as GatewayJson;
  switch (json.type) {
    case "create_habit": {
      const name = requiredString(json.habit_name, "The interpretation did not identify a Habit.");
      return { type: "createHabit", name };
    }
    case "log_habit_entry": {
      const habitName = requiredActiveHabit(json.habit_name, activeHabitNames);
      const quantity = optionalQuantity(json);
      return {
        type: "logHabitEntry",
        habitName,
        durationMinutes: optionalDuration(json.duration_minutes),
        activityDate: requiredDate(json.activity_date),
        quantityAmount: quantity.amount,
        quantityUnit: quantity.unit,
      };
    }
    case "clarify_habit_entry": {
      if (!Array.isArray(json.candidate_habit_names)) throw new Error("The interpretation did not identify valid Active Habit choices.");
      const candidates = [...new Set(json.candidate_habit_names.filter((candidate): candidate is string =>
        typeof candidate === "string" && activeHabitNames.includes(candidate),
      ))];
      if (candidates.length < 2) throw new Error("The interpretation did not identify valid Active Habit choices.");
      const quantity = optionalQuantity(json);
      return {
        type: "clarifyHabitEntry",
        candidateHabitNames: candidates,
        durationMinutes: optionalDuration(json.duration_minutes),
        activityDate: requiredDate(json.activity_date),
        quantityAmount: quantity.amount,
        quantityUnit: quantity.unit,
      };
    }
    case "no_matching_active_habit":
      return { type: "noMatchingActiveHabit" };
    default:
      return { type: "unsupported" };
  }
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

function requiredActiveHabit(value: unknown, activeHabitNames: string[]): string {
  const name = requiredString(value, "The interpretation did not identify an Active Habit.");
  if (!activeHabitNames.includes(name)) throw new Error("The interpretation did not identify an Active Habit.");
  return name;
}

function optionalDuration(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || (value as number) <= 0) throw new Error("Habit Entry duration must be positive.");
  return value as number;
}

function optionalQuantity(json: GatewayJson): { amount: number | null; unit: string | null } {
  const amount = json.quantity_amount;
  const unit = json.quantity_unit;
  if (amount == null && unit == null) return { amount: null, unit: null };
  if (typeof amount !== "number" || amount <= 0 || typeof unit !== "string" || !unit.trim()) {
    throw new Error("Habit Entry quantity and unit must be supplied together.");
  }
  return { amount, unit: unit.trim() };
}

function requiredDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("The interpretation did not identify a valid Activity Date.");
  }
  return value;
}
