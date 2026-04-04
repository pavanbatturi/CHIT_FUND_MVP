import { Alert, Platform } from "react-native";

/**
 * Web: `Alert.alert` confirm buttons are unreliable in RN Web; use `window.confirm`.
 */
export function confirmSignOut(onConfirm: () => void | Promise<void>): void {
  const title = "Sign Out";
  const message = "Are you sure you want to sign out?";

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) void Promise.resolve(onConfirm());
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Sign Out",
      style: "destructive",
      onPress: () => void Promise.resolve(onConfirm()),
    },
  ]);
}
