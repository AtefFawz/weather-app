export type InstallPlatform = "ios" | "android" | "desktop";

export interface PlatformSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export function detectInstallPlatform({ userAgent, platform, maxTouchPoints }: PlatformSignals): InstallPlatform {
  const classicIos = /iPad|iPhone|iPod/i.test(userAgent);
  const ipadOs = platform === "MacIntel" && maxTouchPoints > 1;
  if (classicIos || ipadOs) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export function isStandaloneDisplay(displayModeStandalone: boolean, iosStandalone: boolean): boolean {
  return displayModeStandalone || iosStandalone;
}

export function requiresHomeScreenInstall(platform: InstallPlatform, standalone: boolean): boolean {
  return platform === "ios" && !standalone;
}
