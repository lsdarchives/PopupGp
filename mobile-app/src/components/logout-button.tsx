import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Brand } from "../constants/brand";

type Props = {
  inline?: boolean;
};

export function LogoutButton({ inline = false }: Props) {
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const performLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      router.replace("/(auth)/roles");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`Unable to log out. ${message}`);
      } else {
        Alert.alert("Unable to log out", message);
      }
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.confirm("Are you sure you want to log out?")) {
        return;
      }

      void performLogout();
      return;
    }

    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => void performLogout(),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={inline ? styles.inline : styles.floating}
      onPress={handleLogout}
      disabled={loggingOut}
      accessibilityRole="button"
      accessibilityState={{ disabled: loggingOut }}
    >
      <Text style={styles.text}>{loggingOut ? "Logging out..." : "Log out"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    top: 48,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: { color: Brand.red, fontSize: 14, fontWeight: "600" },
});
