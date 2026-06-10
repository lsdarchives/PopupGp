import { View, Text, StyleSheet } from "react-native";

export default function MyEvents() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#208AEF", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888" },
});
