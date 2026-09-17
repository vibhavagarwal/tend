import { TendData } from "./types";

export const acknowledgments = [
  "That’s in. Nothing more needed.", "A small moment, kept.", "You made room for it.", "There it is.",
  "The day held this, too.", "A quiet mark on the day.", "That counts as living.", "It happened. It’s noted.",
  "A little care, recorded.", "This part made it in.", "Something real, kept close.", "The record is yours now.",
  "One thing, honestly held.", "A moment with its place.", "It belongs to the day.", "There’s room for this.",
  "The page has it.", "A simple thing, saved.", "It has been noticed.", "The day carries this forward.",
  "A small truth, kept.", "That was worth recording.", "One more thing that happened.", "It’s here when you want it.",
] as const;

export function nextAcknowledgment(data: TendData): { message: string; data: TendData } {
  const cursor = data.acknowledgmentCursor ?? 0;
  return { message: acknowledgments[cursor % acknowledgments.length]!, data: { ...data, acknowledgmentCursor: cursor + 1 } };
}
