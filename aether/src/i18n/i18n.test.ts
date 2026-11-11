import { describe, expect, it } from "vitest";
import { ar } from "./ar";
import { en } from "./en";
import { createTranslator, interpolate } from "./index";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("have identical keys", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("use the same placeholders in every language", () => {
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("have no empty strings", () => {
    for (const value of [...Object.values(en), ...Object.values(ar)]) expect(value.trim().length).toBeGreaterThan(0);
  });
});

describe("translate", () => {
  it("interpolates and leaves unknown placeholders visible", () => {
    expect(interpolate("Hi {name}, {missing}", { name: "Atef" })).toBe("Hi Atef, {missing}");
    expect(createTranslator("en")("updatedMinutes", { minutes: 5 })).toBe("Updated 5 min ago");
    expect(createTranslator("ar")("brand")).toBe("أثير");
  });
});
