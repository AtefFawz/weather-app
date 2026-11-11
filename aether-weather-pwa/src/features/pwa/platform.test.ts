import { describe, expect, it } from "vitest";
import { detectInstallPlatform, isStandaloneDisplay, requiresHomeScreenInstall } from "./platform";

describe("PWA platform capability detection", () => {
  it("detects iPhone and iPad user agents", () => {
    expect(detectInstallPlatform({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 })).toBe("ios");
  });

  it("detects iPadOS when Safari identifies as a touch Mac", () => {
    expect(detectInstallPlatform({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", platform: "MacIntel", maxTouchPoints: 5 })).toBe("ios");
  });

  it("detects Android independently of desktop user agents", () => {
    expect(detectInstallPlatform({ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 })).toBe("android");
  });

  it("falls back to desktop", () => {
    expect(detectInstallPlatform({ userAgent: "Mozilla/5.0 (X11; Linux x86_64)", platform: "Linux x86_64", maxTouchPoints: 0 })).toBe("desktop");
  });

  it("recognises standalone mode from browser or iOS signals", () => {
    expect(isStandaloneDisplay(true, false)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });

  it("requires Add to Home Screen only for an uninstalled iOS app", () => {
    expect(requiresHomeScreenInstall("ios", false)).toBe(true);
    expect(requiresHomeScreenInstall("ios", true)).toBe(false);
    expect(requiresHomeScreenInstall("android", false)).toBe(false);
    expect(requiresHomeScreenInstall("desktop", false)).toBe(false);
  });
});
