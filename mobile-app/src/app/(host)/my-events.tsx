import { View, Text, StyleSheet } from "react-native";
import { LogoutButton } from "../../components/logout-button";
import { useAuth } from "../../contexts/AuthContext";

export default function MyEvents() {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <LogoutButton />
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.subtitle}>Coming soon — create events in Phase 2</Text>
      {profile && (
        <Text style={styles.greeting}>Hello, {profile.displayName}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#208AEF", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888" },
  greeting: { marginTop: 16, fontSize: 14, color: "#666", textAlign: "center" },
});
