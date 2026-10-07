import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function setupWaterReminders() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const hour of [10, 17]) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Water time", body: "Drink 1 liter of water now" },
      trigger: { type: "daily", hour, minute: 0 },
    });
  }
}
