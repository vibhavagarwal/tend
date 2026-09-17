import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyTendData, TendData } from "./domain/types";

const storageKey = "tend.data.v1";

export async function loadTendData(): Promise<TendData> {
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) return emptyTendData();
  const parsed: unknown = JSON.parse(stored);
  if (!isTendData(parsed)) throw new Error("Stored Tend data is not compatible with this version.");
  return parsed;
}

export async function saveTendData(data: TendData): Promise<void> {
  await AsyncStorage.setItem(storageKey, JSON.stringify(data));
}

export function isTendData(value: unknown): value is TendData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TendData>;
  return candidate.schemaVersion === 1 &&
    Array.isArray(candidate.habits) &&
    Array.isArray(candidate.entries) &&
    Array.isArray(candidate.pendingStatements);
}
