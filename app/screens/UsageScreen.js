import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getUsage } from "../services/api";
import {
  hasUsageAccess,
  isUsageTrackingAvailable,
  openUsageAccessSettings,
  readUsage,
  syncUsageIfDue,
} from "../services/usageTracking";
import s from "./styles";

export default function UsageScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const supported = Platform.OS === "android" && isUsageTrackingAvailable();

  const refresh = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const granted = await hasUsageAccess();
      setPermissionGranted(granted);
      if (!granted) {
        setDays([]);
        return;
      }

      const deviceDays = await readUsage(7);
      setDays(deviceDays);
      const syncResult = await syncUsageIfDue();
      try {
        const savedDays = await getUsage(7);
        if (!Array.isArray(savedDays)) throw new Error("The server returned invalid usage history.");
        const savedByDate = new Map(savedDays.map((entry) => [entry.date, entry]));
        setDays(deviceDays.map((entry) => ({ ...savedByDate.get(entry.date), ...entry })));
      } catch (historyError) {
        setError(historyError.message || "Could not load saved usage history.");
      }
      if (syncResult.error) setError(syncResult.error);
    } catch (loadError) {
      setError(loadError.message || "Could not load app usage.");
    } finally {
      setLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const openSettings = async () => {
    setError("");
    try {
      await openUsageAccessSettings();
      setMessage("Enable Usage access for AI Task Manager, then return here.");
    } catch (settingsError) {
      setError(settingsError.message || "Could not open Usage access settings.");
    }
  };

  return (
    <ScrollView style={s.page}>
      <Text style={s.h}>App usage</Text>
      <Text style={s.note}>Only Chrome and YouTube open counts and foreground minutes are read. No URLs, browsing history, or video titles are collected.</Text>

      {!supported ? (
        <View style={s.card}>
          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Android only</Text>
          <Text>Usage tracking needs the Android development build. It is unavailable on iOS and Expo Go.</Text>
        </View>
      ) : !permissionGranted ? (
        <View style={s.card}>
          <Text style={{ marginBottom: 12 }}>Grant Usage access to view daily opens and foreground time for Chrome and YouTube. You can change this permission in Android Settings at any time.</Text>
          <TouchableOpacity style={s.btn} onPress={openSettings}>
            <Text style={s.btnText}>Open Usage access settings</Text>
          </TouchableOpacity>
          {!!error && <Text>{error}</Text>}
          {!!message && <Text>{message}</Text>}
        </View>
      ) : (
        <>
          <TouchableOpacity style={s.btn} onPress={refresh}>
            <Text style={s.btnText}>Refresh usage</Text>
          </TouchableOpacity>
          {loading && <ActivityIndicator size="large" />}
          {!!error && <View style={s.card}><Text>{error}</Text></View>}
          <Text style={s.h}>Last 7 days</Text>
          {days.map((day) => (
            <View key={day.date} style={s.card}>
              <Text style={{ fontWeight: "700", marginBottom: 6 }}>{day.date}</Text>
              <Text>Chrome: {day.chromeOpens} opens · {day.chromeMinutes} min</Text>
              <Text>YouTube: {day.youtubeOpens} opens · {day.youtubeMinutes} min</Text>
            </View>
          ))}
          {!loading && days.length === 0 && <Text style={s.note}>No usage records are available yet.</Text>}
        </>
      )}
    </ScrollView>
  );
}