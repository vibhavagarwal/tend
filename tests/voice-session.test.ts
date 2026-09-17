import { describe, expect, it } from "vitest";
import { VoiceSessionGate } from "../src/voice/VoiceSessionGate";

describe("Voice session stale-event protection", () => {
  it("serializes sessions until the native end event", () => {
    const gate = new VoiceSessionGate();
    expect(gate.begin()).toBe(1);
    expect(gate.isActive()).toBe(true);
    expect(gate.begin()).toBeNull();
    expect(gate.end()).toBe(1);
    expect(gate.isActive()).toBe(false);
    expect(gate.begin()).toBe(2);
  });

  it("ignores duplicate end events", () => {
    const gate = new VoiceSessionGate();
    gate.begin();
    expect(gate.end()).toBe(1);
    expect(gate.end()).toBeNull();
  });
});
