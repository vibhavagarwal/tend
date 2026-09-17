import { InterpretationProposal } from "./types";

const trackHabit = /^I want to track\s+(.+?)[.!?]?$/i;
const logQuantity = /^I\s+(.+?)\s+([1-9]\d*(?:\.\d+)?)\s+((?!minutes?\b).+?)\s+(today|yesterday|tomorrow)[.!?]?$/i;
const logDuration = /^I\s+(.+?)(?:\s+for\s+([1-9]\d*)\s+minutes?)?\s+(today|yesterday|tomorrow)[.!?]?$/i;

const titleCaseFirst = (value: string) =>
  value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);

const localDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const activityDate = (word: string, submittedAt: Date): string => {
  const result = new Date(submittedAt);
  if (word.toLowerCase() === "yesterday") result.setDate(result.getDate() - 1);
  if (word.toLowerCase() === "tomorrow") result.setDate(result.getDate() + 1);
  return localDate(result);
};

const commonPrefixLength = (left: string, right: string): number => {
  const a = left.toLocaleLowerCase();
  const b = right.toLocaleLowerCase();
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
};

const canonicalActivityWord = (value: string): string => {
  const word = value.toLocaleLowerCase().replace(/[^a-z]/g, "");
  if (word === "swam") return "swim";
  if (word.endsWith("ing") && word.length > 5) {
    const withoutIng = word.slice(0, -3);
    const last = withoutIng.at(-1);
    const previous = withoutIng.at(-2);
    return last === previous ? withoutIng.slice(0, -1) : withoutIng;
  }
  return word;
};

const matchingHabitNames = (words: string, activeHabitNames: string[]): string[] =>
  activeHabitNames.filter((habit) => {
    const activityWords = words.split(/\s+/).map(canonicalActivityWord);
    const habitWords = habit.split(/\s+/).map(canonicalActivityWord);
    return activityWords.some((activityWord) => habitWords.some((habitWord) =>
      activityWord === habitWord || commonPrefixLength(activityWord, habitWord) >= 4,
    ));
  });

export function interpretStatement(
  rawStatement: string,
  activeHabitNames: string[],
  submittedAt = new Date(),
  archivedHabitNames: string[] = [],
): InterpretationProposal {
  const statement = rawStatement.trim();
  const creation = trackHabit.exec(statement);
  if (creation) return { type: "createHabit", name: titleCaseFirst(creation[1]!.trim()) };

  const quantity = logQuantity.exec(statement);
  if (quantity) {
    if (quantity[4]!.toLowerCase() === "tomorrow") return { type: "futureActivityDate" };
    return entryProposal(
      matchingHabitNames(quantity[1]!, activeHabitNames),
      matchingHabitNames(quantity[1]!, archivedHabitNames),
      null,
      activityDate(quantity[4]!, submittedAt),
      Number(quantity[2]),
      quantity[3]!.trim().toLocaleLowerCase(),
    );
  }

  const duration = logDuration.exec(statement);
  if (duration) {
    if (duration[3]!.toLowerCase() === "tomorrow") return { type: "futureActivityDate" };
    return entryProposal(
      matchingHabitNames(duration[1]!, activeHabitNames),
      matchingHabitNames(duration[1]!, archivedHabitNames),
      duration[2] ? Number(duration[2]) : null,
      activityDate(duration[3]!, submittedAt),
      null,
      null,
    );
  }

  return { type: "unsupported" };
}

function entryProposal(
  activeMatches: string[],
  archivedMatches: string[],
  durationMinutes: number | null,
  date: string,
  quantityAmount: number | null,
  quantityUnit: string | null,
): InterpretationProposal {
  if (activeMatches.length === 0 && archivedMatches.length === 1) {
    return {
      type: "restoreAndLogHabitEntry",
      habitName: archivedMatches[0]!,
      durationMinutes,
      activityDate: date,
      quantityAmount,
      quantityUnit,
    };
  }
  if (activeMatches.length === 0) return { type: "noMatchingActiveHabit" };
  if (activeMatches.length === 1) {
    return {
      type: "logHabitEntry",
      habitName: activeMatches[0]!,
      durationMinutes,
      activityDate: date,
      quantityAmount,
      quantityUnit,
    };
  }
  return {
    type: "clarifyHabitEntry",
    candidateHabitNames: activeMatches,
    durationMinutes,
    activityDate: date,
    quantityAmount,
    quantityUnit,
  };
}
