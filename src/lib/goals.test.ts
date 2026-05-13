import { describe, it, expect } from "vitest";
import { calcProgress } from "./goals";

describe("calcProgress", () => {
  it("returns correct percentage", () => {
    expect(calcProgress(30000, 50000)).toBe(60);
  });

  it("caps at 100 when current exceeds target", () => {
    expect(calcProgress(60000, 50000)).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    expect(calcProgress(0, 0)).toBe(0);
  });

  it("returns 0 when current is 0", () => {
    expect(calcProgress(0, 50000)).toBe(0);
  });
});
