import { describe, expect, it } from "vitest";
import { generateRoomCode, isValidRoomCode } from "../src/rooms/codes.js";

describe("room codes", () => {
  it("generates codes of the requested length", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateRoomCode(6);
      expect(c).toHaveLength(6);
      expect(isValidRoomCode(c)).toBe(true);
    }
  });

  it("excludes ambiguous characters", () => {
    const forbidden = new Set(["0", "O", "1", "I", "L"]);
    for (let i = 0; i < 100; i++) {
      const c = generateRoomCode(8);
      for (const ch of c) {
        expect(forbidden.has(ch)).toBe(false);
      }
    }
  });

  it("rejects empty or too-long codes", () => {
    expect(isValidRoomCode("")).toBe(false);
    expect(isValidRoomCode("ABC")).toBe(false);
    expect(isValidRoomCode("ABCDEFGHIJK")).toBe(false);
  });

  it("rejects codes with disallowed characters", () => {
    expect(isValidRoomCode("abc123")).toBe(false);
    expect(isValidRoomCode("ABCDEO")).toBe(false);
  });
});
