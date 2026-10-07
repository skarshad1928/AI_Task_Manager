import { Platform, requireOptionalNativeModule } from "expo";
import { getUsage, saveUsage, today } from "./api";

const nativeTracker = Platform.OS === "android"
  ? requireOptionalNativeModule("UsageTracker")
  : null;
const oneDayMs = 24 * 60 * 60 * 1000;
let lastSuccessfulSync = 0;
let syncInFlight = null;

export const isUsageTrackingAvailable = () => Boolean(nativeTracker);

export async function hasUsageAccess() {
  return nativeTracker ? nativeTracker.isUsageAccessGranted() : false;
}

export async function openUsageAccessSettings() {
  if (!nativeTracker) throw new Error("Usage tracking is only available in the Android development build.");
  return nativeTracker.openUsageAccessSettings();
}

export async function readUsage(days = 7) {
  if (!nativeTracker) throw new Error("Usage tracking is only available in the Android development build.");
  return nativeTracker.getUsageForDays(days);
}

export function syncUsageIfDue(force = false) {
  if (!nativeTracker) return Promise.resolve({ supported: false, synced: false });
  if (syncInFlight) return syncInFlight;
  if (!force && Date.now() - lastSuccessfulSync < oneDayMs) {
    return Promise.resolve({ supported: true, synced: false });
  }

  syncInFlight = (async () => {
    if (!await hasUsageAccess()) return { supported: true, permissionGranted: false, synced: false };

    const records = await readUsage(7);
    const currentDay = records.find((record) => record.date === today()) || records[0];
    if (!currentDay) return { supported: true, permissionGranted: true, synced: false };

    const saved = await saveUsage({ ...currentDay, date: today() });
    if (saved.error) throw new Error(saved.error);
    lastSuccessfulSync = Date.now();
    return { supported: true, permissionGranted: true, synced: true };
  })().catch((error) => ({
    supported: true,
    synced: false,
    error: error.message || "Could not sync app usage.",
  })).finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}