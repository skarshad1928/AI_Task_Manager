import React, { useEffect, useState } from "react";
import { AppState, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { setupWaterReminders } from "./services/notifications";
import { syncUsageIfDue } from "./services/usageTracking";
import HomeScreen from "./screens/HomeScreen";
import TimerScreen from "./screens/TimerScreen";
import SleepScreen from "./screens/SleepScreen";
import HealthScreen from "./screens/HealthScreen";
import ScoreScreen from "./screens/ScoreScreen";
import UsageScreen from "./screens/UsageScreen";

const TABS = [
  { key: "Home", label: "Tasks", C: HomeScreen },
  { key: "Timer", label: "Timer", C: TimerScreen },
  { key: "Sleep", label: "Sleep", C: SleepScreen },
  { key: "Health", label: "Health", C: HealthScreen },
  { key: "Score", label: "Score", C: ScoreScreen },
  { key: "Usage", label: "Usage", C: UsageScreen },
];

export default function App() {
  const [tab, setTab] = useState("Home");
  useEffect(() => {
    setupWaterReminders().catch((error) => console.warn("Could not set water reminders", error));
    syncUsageIfDue(true);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncUsageIfDue();
    });
    const dailySync = setInterval(() => syncUsageIfDue(), 60 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(dailySync);
    };
  }, []);
  const Active = TABS.find((t) => t.key === tab).C;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}><Active key={tab} /></View>
      <View style={s.bar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.active]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f7fb", paddingTop: 30 },
  bar: { flexDirection: "row", borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  tab: { flex: 1, padding: 14, alignItems: "center" },
  tabText: { color: "#888", fontWeight: "600" },
  active: { color: "#4f46e5" },
});
