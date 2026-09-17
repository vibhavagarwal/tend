export type Id = string;

export interface Habit {
  id: Id;
  name: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface HabitEntry {
  id: Id;
  habitId: Id;
  activityDate: string;
  durationMinutes: number | null;
  quantityAmount: number | null;
  quantityUnit: string | null;
  createdAt: number;
}

export type InterpretationProposal =
  | { type: "createHabit"; name: string }
  | {
      type: "logHabitEntry";
      habitName: string;
      durationMinutes: number | null;
      activityDate: string;
      sourceDatePhrase?: string | undefined;
      quantityAmount: number | null;
      quantityUnit: string | null;
    }
  | {
      type: "clarifyHabitEntry";
      candidateHabitNames: string[];
      durationMinutes: number | null;
      activityDate: string;
      sourceDatePhrase?: string | undefined;
      quantityAmount: number | null;
      quantityUnit: string | null;
    }
  | {
      type: "restoreAndLogHabitEntry";
      habitName: string;
      durationMinutes: number | null;
      activityDate: string;
      sourceDatePhrase?: string | undefined;
      quantityAmount: number | null;
      quantityUnit: string | null;
    }
  | { type: "futureActivityDate" }
  | { type: "noMatchingActiveHabit" }
  | { type: "unsupported" };

export interface ValidatedHabitEntry {
  habitId: Id;
  habitName: string;
  activityDate: string;
  durationMinutes: number | null;
  quantityAmount: number | null;
  quantityUnit: string | null;
}

export interface PendingStatement {
  id: Id;
  statement: string;
  submittedAt: number;
  timeZone: string;
  status: "needsRetry" | "reviewReady";
  proposal: InterpretationProposal | null;
}

export interface TendData {
  schemaVersion: 1;
  habits: Habit[];
  entries: HabitEntry[];
  pendingStatements: PendingStatement[];
  acknowledgmentCursor?: number;
}

export const emptyTendData = (): TendData => ({
  schemaVersion: 1,
  habits: [],
  entries: [],
  pendingStatements: [],
});
